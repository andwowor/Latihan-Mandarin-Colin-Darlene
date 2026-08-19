// Adapter masuk: menerjemahkan ketukan layar menjadi panggilan ke lapisan
// application, lalu menggambar ulang tampilan.

import { mount, on, qs, toast, confetti, sheet, buzz, esc } from './dom.js';
import { TraceCanvas } from './traceCanvas.js';
import { toDayKey, dayKeyToDate } from '../../shared/utils.js';
import { emptyDay, recentDayKeys } from '../../domain/progress.js';
import { speechStars, speechFeedbackId } from '../../domain/pronunciation.js';

import { loginView } from './views/loginView.js';
import { homeView } from './views/homeView.js';
import { mapView, skillSheet } from './views/mapView.js';
import { studyView } from './views/studyView.js';
import { quizView, feedbackBlock, retryBlock } from './views/quizView.js';
import { resultView } from './views/resultView.js';
import { missionsView } from './views/missionsView.js';
import { progressView } from './views/progressView.js';
import { rewardsView } from './views/rewardsView.js';
import { wordbookView } from './views/wordbookView.js';

export class UiController {
  constructor({ root, profiles, curriculum, practice, study, stats, missions, speech, recognition, sync }) {
    this.root = root;
    this.profiles = profiles;
    this.curriculum = curriculum;
    this.practice = practice;
    this.study = study;
    this.stats = stats;
    this.missions = missions;
    this.speech = speech;
    this.recognition = recognition;
    this.sync = sync;

    this.state = {
      screen: 'login',
      levelId: null,
      lessonNumber: null,
      skill: null,
      periodId: 'weekly',
      wordbookLevelId: null,
      answered: false,
      lastSummary: null
    };

    this.trace = null;
    this.selectedTiles = [];
    this.#bindEvents();
  }

  async start() {
    // Setelan suara milik perangkat ini (pilihan suara + kecepatan), bukan
    // milik anak — sengaja tidak ikut disinkronkan antar perangkat.
    this.speech.applySettings?.(this.profiles.settings().speech || {});

    const active = this.profiles.activeId();
    if (active) {
      this.state.screen = 'home';
      this.state.levelId = await this.curriculum.defaultLevelId(active);
    }
    await this.render();
    // Tarik progres dari perangkat lain di latar belakang; layar sudah
    // tampil lebih dulu supaya anak tidak menunggu jaringan.
    this.#syncSoon('pembukaan');
  }

  /**
   * Sinkronkan tanpa menghalangi apa pun. Kegagalan cukup dicatat: anak tetap
   * berlatih, dan percobaan berikutnya menyusul sendiri.
   */
  #syncSoon(reason = '') {
    if (!this.sync?.isConnected()) return;
    this.sync
      .sync()
      .then(async (result) => {
        // Layar hanya digambar ulang bila memang ada data baru yang masuk,
        // dan tidak pernah di tengah latihan atau sesi belajar.
        if (result?.changed && ['home', 'map', 'progress', 'missions', 'rewards'].includes(this.state.screen)) {
          await this.render();
        }
      })
      .catch((err) => console.warn(`Sinkronisasi (${reason}) gagal:`, err));
  }

  // ------------------------------------------------------------- navigasi

  async go(screen, patch = {}) {
    this.#teardownTrace();
    this.recognition?.stop();
    this.listening = false;
    // Meninggalkan layar belajar berarti sesinya batal: catatan "sudah
    // belajar" hanya diberikan bila materinya dibaca sampai kartu terakhir.
    if (screen !== 'study') this.study?.abandon();
    Object.assign(this.state, patch, { screen });
    await this.render();
    this.root.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  // -------------------------------------------------------------- render

  async render() {
    const s = this.state;
    try {
      switch (s.screen) {
        case 'login':    return mount(this.root, loginView(this.profiles.allSnapshots()));
        case 'home':     return await this.#renderHome();
        case 'map':      return await this.#renderMap();
        case 'study':    return this.#renderStudy();
        case 'quiz':     return this.#renderQuiz();
        case 'result':   return mount(this.root, resultView(s.lastSummary));
        case 'missions': return this.#renderMissions();
        case 'progress': return this.#renderProgress();
        case 'rewards':  return this.#renderRewards();
        case 'wordbook': return await this.#renderWordbook();
        default:         return mount(this.root, loginView(this.profiles.allSnapshots()));
      }
    } catch (err) {
      console.error(err);
      mount(
        this.root,
        `<div class="screen center">
           <div class="empty">
             <div class="empty__emoji">😵</div>
             <p style="font-weight:800">Ada yang tidak beres</p>
             <p class="small muted">${esc(err.message || String(err))}</p>
             <button class="btn btn--ghost" data-nav="home" style="margin-top:12px">Kembali</button>
           </div>
         </div>`
      );
    }
  }

  #pid() {
    return this.profiles.activeId();
  }

  /** Teks yang harus dibunyikan di layar yang sedang tampil. */
  #speakTarget() {
    if (this.state.screen === 'study') return this.study.current()?.speak || null;
    return this.practice.current()?.speak || null;
  }

  #pendingMissions() {
    const st = this.missions.status(this.#pid());
    return st.unclaimed.length + (st.bonusPending ? 1 : 0);
  }

  async #renderHome() {
    const pid = this.#pid();
    if (!this.state.levelId) this.state.levelId = await this.curriculum.defaultLevelId(pid);

    const snapshot = this.profiles.snapshot(pid);
    const levels = await this.curriculum.levels(pid);
    const levelMeta = levels.find((l) => l.id === this.state.levelId) || levels[0];
    const { lessons } = await this.curriculum.lessonMap(pid, levelMeta.id);
    const playable = lessons.filter((l) => l.vocabCount > 0 || l.sentenceCount > 0);
    const nextLesson = playable.find((l) => !l.completed) || null;

    mount(
      this.root,
      homeView({
        snapshot,
        missions: this.missions.summary(pid),
        levelMeta,
        nextLesson,
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  async #renderMap() {
    const pid = this.#pid();
    const levels = await this.curriculum.levels(pid);
    const activeLevel = levels.find((l) => l.id === this.state.levelId) || levels[0];
    const { lessons } = await this.curriculum.lessonMap(pid, activeLevel.id);

    mount(
      this.root,
      mapView({
        snapshot: this.profiles.snapshot(pid),
        levels,
        activeLevel,
        lessons,
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  #renderStudy() {
    const session = this.study.session;
    const card = this.study.current();
    if (!session || !card) return this.go('map');

    mount(
      this.root,
      studyView({
        session,
        card,
        index: session.index,
        total: session.cards.length
      })
    );

    // Kartu kata dan kalimat langsung dibunyikan: mendengar sambil melihat
    // tulisannya adalah inti sesi belajar ini.
    if (card.speak) setTimeout(() => this.speech.speak(card.speak), 200);
  }

  #renderQuiz() {
    const round = this.practice.round;
    const question = this.practice.current();
    if (!round || !question) return this.go('home');

    mount(
      this.root,
      quizView({
        round,
        question,
        index: round.index,
        total: round.questions.length,
        canRecognise: !!this.recognition?.isAvailable()
      })
    );

    this.state.answered = false;
    this.selectedTiles = [];
    this.listening = false;

    if (question.type === 'trace') this.#setupTrace(question);
    if (question.autoPlay) setTimeout(() => this.speech.speak(question.speak), 250);
  }

  #renderMissions() {
    const pid = this.#pid();
    const data = this.profiles.data(pid);
    const history = recentDayKeys(7)
      .map((k) => data.dailyLog?.[k] || emptyDay(k))
      .reverse()
      .map((d) => ({
        label: labelForDay(d.day),
        xp: d.xp,
        rounds: d.rounds || 0,
        perfectRounds: d.perfectRounds || 0
      }));

    mount(
      this.root,
      missionsView({
        snapshot: this.profiles.snapshot(pid),
        missions: this.missions.status(pid),
        history,
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  #renderProgress() {
    const pid = this.#pid();
    const other = this.profiles.listProfiles().find((p) => p.id !== pid);
    mount(
      this.root,
      progressView({
        snapshot: this.profiles.snapshot(pid),
        periods: this.stats.periods(),
        activePeriod: this.state.periodId,
        leaderboard: this.stats.leaderboard(this.state.periodId),
        report: this.stats.report(pid, this.state.periodId),
        otherReport: this.stats.report(other.id, this.state.periodId),
        skills: this.stats.skillComparison(this.state.periodId),
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  #renderRewards() {
    mount(
      this.root,
      rewardsView({
        snapshot: this.profiles.snapshot(this.#pid()),
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  async #renderWordbook() {
    const pid = this.#pid();
    const levels = await this.curriculum.levels(pid);
    const id = this.state.wordbookLevelId || this.state.levelId || levels[0].id;
    const activeLevel = levels.find((l) => l.id === id) || levels[0];
    const words = await this.curriculum.wordbook(pid, activeLevel.id);

    mount(
      this.root,
      wordbookView({
        snapshot: this.profiles.snapshot(pid),
        levels,
        activeLevel,
        words,
        pendingMissions: this.#pendingMissions()
      })
    );
  }

  // ------------------------------------------------------ menulis (canvas)

  #setupTrace(question) {
    const guide = qs(this.root, '#trace-guide-canvas');
    const draw = qs(this.root, '#trace-canvas');
    if (!guide || !draw) return;
    this.trace = new TraceCanvas(guide, draw, question.prompt);
  }

  #teardownTrace() {
    this.trace?.destroy();
    this.trace = null;
  }

  // ------------------------------------------------------------- events

  #bindEvents() {
    const r = this.root;

    // --- Login
    on(r, 'click', '[data-profile]', async (_e, el) => {
      const id = el.dataset.profile;
      this.speech.unlock();          // iOS butuh interaksi sebelum audio boleh bunyi
      this.profiles.login(id);
      this.state.levelId = await this.curriculum.defaultLevelId(id);
      await this.go('home');
    });

    // --- Navigasi bawah & tombol pindah layar
    on(r, 'click', '[data-nav]', async (_e, el) => {
      await this.go(el.dataset.nav);
    });

    on(r, 'click', '[data-action="switch-profile"]', async () => {
      this.profiles.logout();
      this.practice.abandon();
      await this.go('login');
    });

    on(r, 'click', '[data-action="parent"]', () => this.#openParentSheet());

    // --- Peta pelajaran
    on(r, 'click', '[data-level]', async (_e, el) => {
      if (this.state.screen === 'wordbook') {
        await this.go('wordbook', { wordbookLevelId: el.dataset.level });
      } else {
        await this.go('map', { levelId: el.dataset.level });
      }
    });

    on(r, 'click', '[data-lesson]', async (_e, el) => {
      const number = Number(el.dataset.lesson);
      const pid = this.#pid();
      const { lessons } = await this.curriculum.lessonMap(pid, this.state.levelId);
      const lesson = lessons.find((l) => l.number === number);
      this.state.lessonNumber = number;

      const panel = sheet(skillSheet(lesson, this.curriculum.skills()));
      panel.el.addEventListener('click', async (e) => {
        if (e.target.closest('[data-start-study]')) {
          panel.close();
          return await this.#startStudy(number);
        }
        const btn = e.target.closest('[data-start-skill]');
        if (!btn) return;
        panel.close();
        await this.#startRound(btn.dataset.startSkill);
      });
    });

    // --- Lanjut belajar / latihan cepat dari beranda
    on(r, 'click', '[data-action="continue"]', async () => {
      const next = await this.#pickLesson((l) => !l.completed);
      if (!next) return toast('Materi belum tersedia.');
      this.state.lessonNumber = next.number;
      // Pelajaran yang materinya belum dibaca selalu dimulai dari sesi belajar.
      if (!next.studied) return await this.#startStudy(next.number);
      await this.#startRound('mixed');
    });

    on(r, 'click', '[data-quick]', async (_e, el) => {
      const target = await this.#pickLesson((l) => !l.completed);
      if (!target) return toast('Materi belum tersedia.');
      this.state.lessonNumber = target.number;
      await this.#startRound(el.dataset.quick);
    });

    // --- Sesi belajar
    on(r, 'click', '[data-action="study-next"]', async () => {
      if (this.study.atEnd()) return;
      this.study.next();
      this.#renderStudy();
      this.root.scrollTop = 0;
      window.scrollTo(0, 0);
    });

    on(r, 'click', '[data-action="study-prev"]', () => {
      if (this.study.atStart()) return;
      this.study.prev();
      this.#renderStudy();
      this.root.scrollTop = 0;
      window.scrollTo(0, 0);
    });

    on(r, 'click', '[data-action="study-restart"]', () => {
      this.study.jumpTo(0);
      this.#renderStudy();
    });

    on(r, 'click', '[data-action="study-quit"]', () => this.#confirmQuitStudy());

    on(r, 'click', '[data-action="study-to-quiz"]', async () => {
      this.#finishStudy();
      await this.#startRound('mixed');
    });

    on(r, 'click', '[data-action="study-done"]', async () => {
      this.#finishStudy();
      await this.go('map');
    });

    // --- Audio (dipakai layar latihan maupun sesi belajar)
    on(r, 'click', '[data-action="speak"]', () => {
      const text = this.#speakTarget();
      if (text) this.speech.speak(text);
    });
    on(r, 'click', '[data-action="speak-slow"]', () => {
      const text = this.#speakTarget();
      if (text) this.speech.speak(text, { slow: true });
    });
    on(r, 'click', '[data-speak]', (_e, el) => this.speech.speak(el.dataset.speak));

    // --- Latihan: pilihan ganda
    on(r, 'click', '[data-option]', (_e, el) => {
      if (this.state.answered) return;
      this.#answer(el.dataset.option, el);
    });

    // --- Latihan: susun kata / kalimat
    on(r, 'click', '[data-tile]', (_e, el) => {
      if (this.state.answered) return;
      el.classList.add('tile--used');
      this.selectedTiles.push({ value: el.dataset.value, el });
      this.#refreshBuilder();
    });

    on(r, 'click', '[data-builder-remove]', (_e, el) => {
      if (this.state.answered) return;
      const i = Number(el.dataset.builderRemove);
      const [removed] = this.selectedTiles.splice(i, 1);
      removed?.el.classList.remove('tile--used');
      this.#refreshBuilder();
    });

    on(r, 'click', '[data-action="check-build"]', () => {
      if (this.state.answered) return;
      this.#answer(this.selectedTiles.map((t) => t.value).join(''));
    });

    // --- Latihan: berbicara
    on(r, 'click', '[data-action="record"]', () => this.#record());
    on(r, 'click', '[data-action="retry"]', () => {
      this.speech.cancel();
      this.#record();
    });
    on(r, 'click', '[data-self-say]', (_e, el) => {
      if (this.state.answered) return;
      this.#answer({ selfAssessed: true, ok: el.dataset.selfSay === '1' });
    });

    // --- Latihan: menulis
    on(r, 'click', '[data-action="trace-clear"]', () => this.trace?.clear());
    on(r, 'click', '[data-action="check-trace"]', () => {
      if (this.state.answered) return;
      const score = this.trace?.score() || { coverage: 0 };
      this.#answer(score);
    });

    // --- Latihan: lanjut & keluar
    on(r, 'click', '[data-action="next"]', () => this.#next());
    on(r, 'click', '[data-action="quit"]', () => this.#confirmQuit());
    on(r, 'click', '[data-action="again"]', async () => {
      await this.#startRound(this.state.skill);
    });
    on(r, 'click', '[data-action="study-again"]', async () => {
      await this.#startStudy(this.state.lessonNumber);
    });

    // --- Progres
    on(r, 'click', '[data-period]', async (_e, el) => {
      await this.go('progress', { periodId: el.dataset.period });
    });
  }

  #refreshBuilder() {
    const box = qs(this.root, '#builder');
    if (!box) return;
    box.innerHTML = this.selectedTiles
      .map((t, i) => `<button class="tile hanzi" data-builder-remove="${i}">${esc(t.value)}</button>`)
      .join('');
    const check = qs(this.root, '[data-action="check-build"]');
    if (check) check.disabled = this.selectedTiles.length === 0;
  }

  // -------------------------------------------------------- berbicara

  /** Rekam satu ucapan lalu nilai. */
  async #record() {
    if (this.state.answered || this.listening) return;
    const question = this.practice.current();
    if (!question) return;

    const btn = qs(this.root, '[data-action="record"]');
    const hint = qs(this.root, '#mic-hint');
    const heard = qs(this.root, '#mic-heard');

    // Suara contoh harus berhenti dulu, jangan sampai ikut terekam.
    this.speech.cancel();

    this.listening = true;
    btn?.classList.add('mic--listening');
    if (btn) btn.disabled = true;
    if (hint) hint.textContent = 'Mendengarkan… bicaralah sekarang';
    if (heard) heard.textContent = '';
    buzz(20);

    const result = await this.recognition.listen({
      onPartial: (text) => {
        if (heard) heard.textContent = text;
      }
    });

    this.listening = false;
    btn?.classList.remove('mic--listening');
    if (btn) btn.disabled = false;

    if (result.error === 'not-allowed' || result.error === 'service-not-allowed') {
      if (hint) hint.textContent = 'Izin mikrofon ditolak';
      return toast('Izinkan akses mikrofon di pengaturan browser untuk latihan bicara.');
    }
    if (result.error) {
      if (hint) hint.textContent = 'Ketuk mikrofon untuk mencoba lagi';
      return toast('Pengenalan suara bermasalah. Coba lagi ya.');
    }
    if (result.transcripts.length === 0) {
      if (hint) hint.textContent = 'Belum terdengar — ketuk lagi lalu bicara lebih keras';
      return;
    }

    if (heard) heard.textContent = result.transcripts[0];
    if (hint) hint.textContent = 'Selesai — begini yang terdengar:';
    this.#answer({ transcripts: result.transcripts });
  }

  // -------------------------------------------------------- sesi belajar

  /** Pelajaran pertama di level aktif yang cocok dengan `match`. */
  async #pickLesson(match) {
    const { lessons } = await this.curriculum.lessonMap(this.#pid(), this.state.levelId);
    const playable = lessons.filter((l) => l.vocabCount > 0 || l.sentenceCount > 0);
    return playable.find(match) || playable[0] || null;
  }

  async #startStudy(lessonNumber) {
    const pid = this.#pid();
    this.state.lessonNumber = lessonNumber;
    try {
      const session = await this.study.start({
        profileId: pid,
        levelId: this.state.levelId,
        lessonNumber
      });
      if (!session.cards.length) return toast('Materi pelajaran ini belum tersedia.');
      await this.go('study');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Gagal membuka sesi belajar.');
    }
  }

  /** Tutup sesi belajar dan tampilkan hadiahnya. */
  #finishStudy() {
    const summary = this.study.finish();
    if (!summary) return null;
    if (summary.firstTime) confetti(30);
    toast(
      summary.firstTime
        ? `📘 Materi selesai dibaca — soal terbuka! +${summary.xp} XP`
        : `📖 Materi disegarkan. +${summary.xp} XP`
    );
    this.#syncSoon('selesai belajar');
    return summary;
  }

  #confirmQuitStudy() {
    const panel = sheet(`
      <h2 style="margin:0 0 8px">Berhenti membaca materi?</h2>
      <p class="small muted" style="margin:0 0 16px">
        Materi harus dibaca sampai kartu terakhir supaya soal latihannya terbuka.
      </p>
      <button class="btn btn--danger" data-quit-yes>Ya, berhenti dulu</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-quit-no>Lanjut membaca</button>
    `);
    panel.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-quit-yes]')) {
        panel.close();
        this.speech.cancel();
        await this.go('map');
      }
      if (e.target.closest('[data-quit-no]')) panel.close();
    });
  }

  // ------------------------------------------------------------- latihan

  async #startRound(skill) {
    const pid = this.#pid();
    const lessonNumber = this.state.lessonNumber;

    // Pintu masuk soal hanya satu: materinya harus sudah dibaca.
    if (!this.study.canPractice(pid, this.state.levelId, lessonNumber)) {
      toast('Baca materinya dulu ya — soalnya terbuka setelah itu.');
      return await this.#startStudy(lessonNumber);
    }

    this.state.skill = skill;
    try {
      const round = await this.practice.start({
        profileId: pid,
        levelId: this.state.levelId,
        lessonNumber: this.state.lessonNumber,
        skill
      });
      if (!round.questions.length) {
        return toast('Belum ada soal untuk pelajaran ini.');
      }
      await this.go('quiz');
    } catch (err) {
      console.error(err);
      toast(err.message || 'Gagal memulai latihan.');
    }
  }

  #answer(response, el) {
    const result = this.practice.submit(response);
    if (!result) return;

    // Berbicara: percobaan pertama yang meleset belum dicatat apa-apa.
    if (result.retry) return this.#offerRetry(result);

    this.state.answered = true;
    buzz(result.correct ? 20 : [40, 60, 40]);

    // Tandai pilihan benar/salah.
    const q = result.question;
    if (q.options?.length) {
      for (const btn of this.root.querySelectorAll('[data-option]')) {
        const value = btn.dataset.option;
        if (value === q.answer) btn.classList.add('option--correct');
        else if (btn === el) btn.classList.add('option--wrong');
        btn.disabled = true;
      }
    }

    // Rincian pelafalan: apa yang terdengar, seberapa mirip, dan pujiannya.
    const speech = this.#speechFeedback(result);

    const round = this.practice.round;
    const isLast = round.index >= round.questions.length - 1 || round.hearts <= 0;
    const slot = qs(this.root, '#feedback-slot');
    if (slot) {
      slot.innerHTML = feedbackBlock({
        correct: result.correct,
        explain: result.explain,
        isLast,
        speech
      });
    }

    if (result.correct && q.speak) setTimeout(() => this.speech.speak(q.speak), 120);
  }

  /**
   * Tawarkan kesempatan kedua untuk soal berbicara.
   *
   * Layarnya sengaja tidak digambar ulang: tulisan, tombol contoh suara, dan
   * mikrofonnya tetap di tempatnya supaya anak merasa masih pada soal yang
   * sama \u2014 hanya ditambah ajakan mencoba lagi.
   */
  #offerRetry(result) {
    buzz(30);
    const slot = qs(this.root, '#feedback-slot');
    if (slot) {
      slot.innerHTML = retryBlock({
        speech: this.#speechFeedback(result),
        canRecognise: !!this.recognition?.isAvailable()
      });
    }
    this.#resetMic('Ketuk mikrofon, lalu ucapkan sekali lagi');
    // Contohnya dibunyikan sendiri: yang dibutuhkan anak sekarang adalah
    // mendengar lagi, bukan menebak ulang.
    if (result.question.speak) setTimeout(() => this.speech.speak(result.question.speak), 200);
  }

  /** Kembalikan mikrofon ke keadaan siap dipakai lagi. */
  #resetMic(hintText) {
    const btn = qs(this.root, '[data-action="record"]');
    const hint = qs(this.root, '#mic-hint');
    const heard = qs(this.root, '#mic-heard');
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('mic--listening');
    }
    if (hint) hint.textContent = hintText;
    if (heard) heard.textContent = '';
    this.listening = false;
  }

  /** Rincian pelafalan untuk umpan balik: apa yang terdengar dan nilainya. */
  #speechFeedback(result) {
    if (result.question.skill !== 'speaking') return null;
    const d = result.detail;
    if (d?.selfAssessed) return { selfAssessed: true };
    return {
      heard: d?.heard || '',
      score: d?.score || 0,
      stars: speechStars(d?.score || 0),
      message: speechFeedbackId(d?.score || 0, d?.heard || '')
    };
  }

  async #next() {
    if (this.practice.isFinished() || this.practice.round.index >= this.practice.round.questions.length - 1) {
      return await this.#finish();
    }
    this.practice.next();
    this.#teardownTrace();
    this.#renderQuiz();
  }

  async #finish() {
    const pid = this.#pid();
    const cleared = await this.curriculum.clearedLevelIds(pid);
    const summary = await this.practice.finish(cleared);
    this.#teardownTrace();
    this.speech.cancel();

    if (summary.stars >= 2 || summary.newBadges?.length || summary.missionReward?.xp > 0) confetti();
    await this.go('result', { lastSummary: summary });
    this.#syncSoon('selesai latihan');
  }

  #confirmQuit() {
    const panel = sheet(`
      <h2 style="margin:0 0 8px">Keluar dari latihan?</h2>
      <p class="small muted" style="margin:0 0 16px">Kemajuan ronde ini tidak akan disimpan.</p>
      <button class="btn btn--danger" data-quit-yes>Ya, keluar</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-quit-no>Lanjut latihan</button>
    `);
    panel.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-quit-yes]')) {
        panel.close();
        this.practice.abandon();
        this.speech.cancel();
        await this.go('map');
      }
      if (e.target.closest('[data-quit-no]')) panel.close();
    });
  }

  // -------------------------------------------------------- menu orang tua

  #openParentSheet() {
    const sync = this.sync?.status();
    const panel = sheet(`
      <h2 style="margin:0 0 4px">⚙️ Menu Orang Tua</h2>
      <p class="small muted" style="margin:0 0 16px">Cadangkan, sinkronkan, atau atur ulang data belajar.</p>
      ${
        sync
          ? `<button class="btn btn--ghost" data-sync-open>
               ☁️ Sinkronisasi Online ${sync.connected ? '— aktif ✅' : '— belum aktif'}
             </button>`
          : ''
      }
      <button class="btn btn--ghost" style="margin-top:8px" data-voice-open>🔊 Suara Pengucapan</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-export>💾 Simpan Cadangan (JSON)</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-import>📂 Muat Cadangan</button>
      <button class="btn btn--danger" style="margin-top:8px" data-reset>🗑️ Hapus Semua Progres</button>
      <input type="file" accept="application/json" id="import-file" hidden />
    `);

    panel.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-sync-open]')) {
        panel.close();
        return this.#openSyncSheet();
      }

      if (e.target.closest('[data-voice-open]')) {
        panel.close();
        return this.#openVoiceSheet();
      }

      if (e.target.closest('[data-export]')) {
        const blob = new Blob([this.profiles.exportJson()], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `mandarin-fun-${toDayKey()}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        toast('Cadangan tersimpan.');
      }

      if (e.target.closest('[data-import]')) {
        panel.el.querySelector('#import-file').click();
      }

      if (e.target.closest('[data-reset]')) {
        if (!confirm('Hapus semua progres Colin dan Darlene? Tindakan ini tidak bisa dibatalkan.')) return;
        this.profiles.resetAll();
        panel.close();
        await this.go('login');
        toast('Semua progres dihapus.');
      }
    });

    this.#bindImportFile(panel);
  }

  // ------------------------------------------------------- suara pengucapan

  /**
   * Pemilih suara text-to-speech.
   *
   * Perangkat biasanya punya lebih dari satu suara Mandarin dan mutunya jauh
   * berbeda: suara "ringkas" bawaan meratakan lengkung nada sehingga
   * ma1/ma2/ma3/ma4 terdengar nyaris sama, sedangkan suara neural
   * mengucapkannya tegas. Urutan daftar perangkat tidak ada hubungannya
   * dengan mutu, jadi aplikasi mengurutkannya sendiri — dan orang tua tetap
   * bisa memilih sendiri sambil mendengarkan (ADR-0012).
   */
  #openVoiceSheet() {
    const setelan = this.profiles.settings().speech || {};
    const daftar = this.speech.voiceOptions?.() || [];
    const skala = Number(setelan.rateScale) > 0 ? Number(setelan.rateScale) : 1;

    // Tombol coba-dengar sengaja DI LUAR <label>: kalau di dalam, satu ketukan
    // untuk mendengar ikut memilih suaranya juga.
    const baris = (v, i) => `
      <div class="voice ${v.active ? 'voice--on' : ''}">
        <label class="voice__pick">
          <input type="radio" name="voice" value="${esc(v.id)}" ${v.active ? 'checked' : ''} />
          <span class="voice__body">
            <span class="voice__name">
              ${esc(v.name)}
              ${i === 0 ? '<span class="voice__tag">disarankan</span>' : ''}
            </span>
            <span class="voice__note small muted">${esc(v.note)}${v.lang ? ` · ${esc(v.lang)}` : ''}</span>
          </span>
        </label>
        <button type="button" class="voice__try" data-try="${esc(v.id)}"
                aria-label="Coba dengar ${esc(v.name)}">\u25b6</button>
      </div>`;

    const kosong = `
      <p class="small" style="margin:0 0 14px">
        \u26a0\ufe0f Perangkat ini belum punya suara Mandarin, jadi contoh pengucapan tidak
        berbunyi. Pasang dulu paket suaranya:
      </p>
      <ul class="small muted" style="margin:0 0 14px;padding-left:18px;line-height:1.7">
        <li><b>Android</b>: Setelan \u2192 Bahasa &amp; masukan \u2192 Keluaran teks-ke-ucapan \u2192 Pasang data suara \u2192 Chinese (China).</li>
        <li><b>iPhone/iPad</b>: Setelan \u2192 Aksesibilitas \u2192 Konten Terucap \u2192 Suara \u2192 Chinese (China) \u2014 pilih yang <i>Premium</i>.</li>
        <li><b>Laptop</b>: pakai Google Chrome; suara Mandarinnya diambil dari internet.</li>
      </ul>`;

    const panel = sheet(`
      <h2 style="margin:0 0 4px">\ud83d\udd0a Suara Pengucapan</h2>
      ${
        daftar.length
          ? `<p class="small muted" style="margin:0 0 14px">
               Suara yang dipakai membacakan contoh. Yang paling atas nadanya paling
               jelas \u2014 ketuk \u25b6 untuk mendengar <b>m\u0101 m\u00e1 m\u01ce m\u00e0</b>, empat nada
               yang bunyinya hanya beda di nadanya saja.
             </p>`
          : ''
      }

      ${daftar.length ? `<div class="voice-list">${daftar.map(baris).join('')}</div>` : kosong}

      <p class="field__label" style="margin:16px 0 6px">Kecepatan</p>
      <div class="seg" role="group" aria-label="Kecepatan suara">
        ${[
          { v: 0.8, label: '\ud83d\udc22 Pelan' },
          { v: 1, label: 'Biasa' },
          { v: 1.2, label: '\ud83d\udc07 Cepat' }
        ]
          .map(
            (o) =>
              `<button type="button" class="seg__btn ${Math.abs(o.v - skala) < 0.01 ? 'seg__btn--on' : ''}"
                       data-rate="${o.v}">${o.label}</button>`
          )
          .join('')}
      </div>
      <p class="small muted" style="margin:8px 0 0">
        Tombol \ud83d\udc22 di layar latihan tetap membacakan <b>satu suku kata sekali ucap</b>
        dengan jeda, supaya tiap nada terdengar utuh dan mudah ditiru.
      </p>
    `);

    const simpan = (patch) => {
      const next = { ...(this.profiles.settings().speech || {}), ...patch };
      this.profiles.saveSettings({ speech: next });
      this.speech.applySettings?.(next);
      return next;
    };

    panel.el.addEventListener('change', (e) => {
      const radio = e.target.closest('input[name="voice"]');
      if (!radio) return;
      simpan({ voiceId: radio.value });
      for (const el of panel.el.querySelectorAll('.voice')) {
        el.classList.toggle('voice--on', el.contains(radio));
      }
      this.speech.speak(CONTOH_NADA, { slow: true });
    });

    panel.el.addEventListener('click', (e) => {
      const coba = e.target.closest('[data-try]');
      if (coba) {
        // Mendengarkan tidak sama dengan memilih: suara dicoba dulu, baru
        // dipilih kalau memang lebih jelas. Karena itu setelan dikembalikan
        // setelah contohnya selesai berbunyi.
        const sebelumnya = this.profiles.settings().speech || {};
        this.speech.applySettings?.({ ...sebelumnya, voiceId: coba.dataset.try });
        this.speech.speak(CONTOH_NADA, { slow: true }).finally?.(() => {
          this.speech.applySettings?.(this.profiles.settings().speech || {});
        });
        return;
      }

      const rate = e.target.closest('[data-rate]');
      if (rate) {
        simpan({ rateScale: Number(rate.dataset.rate) });
        for (const b of panel.el.querySelectorAll('.seg__btn')) {
          b.classList.toggle('seg__btn--on', b === rate);
        }
        this.speech.speak(CONTOH_NADA);
      }
    });
  }

  // --------------------------------------------------- sinkronisasi online

  #openSyncSheet() {
    const s = this.sync?.status() || { connected: false };
    const panel = sheet(`
      <h2 style="margin:0 0 4px">☁️ Sinkronisasi Online</h2>
      <p class="small muted" style="margin:0 0 14px">
        Isi ketiganya sama persis di setiap perangkat, supaya progres Colin dan
        Darlene menyambung di HP, tablet, maupun laptop.
      </p>

      <div id="sync-status" class="card" style="margin-bottom:14px">${syncStatusHtml(s)}</div>

      <label class="field">
        <span class="field__label">Alamat server</span>
        <input class="field__input" id="sync-url" type="url" inputmode="url"
               autocomplete="off" autocapitalize="off" spellcheck="false"
               placeholder="https://mandarin-fun-sync.xxx.workers.dev"
               value="${esc(s.url || '')}" />
      </label>

      <label class="field">
        <span class="field__label">Kode keluarga</span>
        <input class="field__input" id="sync-code" type="text"
               autocomplete="off" autocapitalize="off" spellcheck="false"
               placeholder="keluarga-wor" value="${esc(s.code || '')}" />
      </label>

      <label class="field">
        <span class="field__label field__label--row">
          <span>PIN (4-12 angka)</span>
          ${s.connected ? '<button type="button" class="field__reveal" data-pin-toggle>👁 Tampilkan</button>' : ''}
        </span>
        <input class="field__input" id="sync-pin" type="password" inputmode="numeric"
               autocomplete="off" placeholder="••••••"
               value="${esc(s.connected ? this.sync.storedPin() : '')}" />
      </label>

      <p class="small muted" style="margin:0 0 14px">
        ${
          s.connected
            ? 'Lupa PIN? Ketuk <b>👁 Tampilkan</b> di atas — perangkat yang sudah tersambung menyimpannya. Catat kode dan PIN-nya di tempat aman; keduanya diperlukan setiap kali ada perangkat baru disambungkan.'
            : 'Belum punya alamat server? Panduan memasangnya ada di <code>server/README.md</code> — sekali siapkan, ±10 menit.'
        }
      </p>

      <button class="btn btn--primary" data-sync-connect>
        ${s.connected ? '🔄 Perbarui Sambungan' : '🔗 Sambungkan'}
      </button>
      ${
        s.connected
          ? `<button class="btn btn--ghost" style="margin-top:8px" data-sync-now>⬇️⬆️ Sinkronkan Sekarang</button>
             <button class="btn btn--danger" style="margin-top:8px" data-sync-off>🔌 Putuskan Perangkat Ini</button>`
          : ''
      }
    `);

    const box = panel.el.querySelector('#sync-status');
    const refresh = () => {
      box.innerHTML = syncStatusHtml(this.sync.status());
    };

    panel.el.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      // Tampilkan/sembunyikan PIN yang tersimpan di perangkat ini.
      if (btn.hasAttribute('data-pin-toggle')) {
        const input = panel.el.querySelector('#sync-pin');
        const tampilkan = input.type === 'password';
        input.type = tampilkan ? 'text' : 'password';
        btn.textContent = tampilkan ? '🙈 Sembunyikan' : '👁 Tampilkan';
        return;
      }

      if (btn.hasAttribute('data-sync-connect')) {
        const url = panel.el.querySelector('#sync-url').value.trim();
        const code = panel.el.querySelector('#sync-code').value.trim().toLowerCase();
        const pin = panel.el.querySelector('#sync-pin').value.trim();

        btn.disabled = true;
        box.innerHTML = '<p class="small" style="margin:0">⏳ Menyambung…</p>';
        try {
          await this.sync.connect({ url, code, pin });
          panel.close();
          toast('☁️ Tersambung. Progres akan tersinkron otomatis.');
          await this.render();
        } catch (err) {
          btn.disabled = false;
          box.innerHTML = `<p class="small" style="margin:0;color:var(--red)">⚠️ ${esc(err.message)}</p>`;
        }
        return;
      }

      if (btn.hasAttribute('data-sync-now')) {
        btn.disabled = true;
        box.innerHTML = '<p class="small" style="margin:0">⏳ Menyinkronkan…</p>';
        const result = await this.sync.sync({ force: true });
        btn.disabled = false;
        refresh();
        if (result.ok) {
          toast(result.changed ? '☁️ Progres diperbarui.' : '☁️ Sudah paling baru.');
          if (result.changed) await this.render();
        } else {
          toast(result.error || 'Sinkronisasi gagal.');
        }
        return;
      }

      if (btn.hasAttribute('data-sync-off')) {
        if (!confirm('Putuskan perangkat ini dari sinkronisasi? Progres di perangkat ini tetap tersimpan.')) return;
        this.sync.disconnect();
        panel.close();
        toast('Perangkat ini tidak lagi tersinkron.');
      }
    });
  }

  #bindImportFile(panel) {
    panel.el.querySelector('#import-file').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        this.profiles.importJson(await file.text());
        panel.close();
        await this.go('login');
        toast('Cadangan dimuat.');
      } catch (err) {
        toast(err.message || 'Berkas tidak valid.');
      }
    });
  }
}

/** Ringkasan keadaan sinkronisasi, untuk kotak di panel setelan. */
function syncStatusHtml(s) {
  if (!s.connected) {
    return `<p class="small" style="margin:0">
      ⚪ Belum tersambung. Progres perangkat ini hanya tersimpan di perangkat ini saja.
    </p>`;
  }
  const when = s.lastSyncAt ? relativeTime(s.lastSyncAt) : 'belum pernah';
  return `
    <p class="small" style="margin:0 0 4px">✅ Tersambung sebagai <b>${esc(s.code)}</b></p>
    <p class="small muted" style="margin:0">Sinkron terakhir: ${esc(when)}</p>
    ${s.lastError ? `<p class="small" style="margin:6px 0 0;color:var(--red)">⚠️ ${esc(s.lastError)}</p>` : ''}`;
}

/** "3 menit lalu", "kemarin" — cukup untuk memberi rasa, tanpa jam persis. */
function relativeTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'belum pernah';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'kemarin' : `${days} hari lalu`;
}

// Empat nada pada suku kata yang sama. Kalau keempatnya terdengar berbeda,
// suaranya cukup jelas untuk ditirukan anak; kalau terdengar sama, tidak.
const CONTOH_NADA = '\u5988\u9ebb\u9a6c\u9a82';

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function labelForDay(dayKey) {
  if (dayKey === toDayKey()) return 'Hari ini';
  const d = dayKeyToDate(dayKey);
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}
