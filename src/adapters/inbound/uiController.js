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
import { quizView, feedbackBlock } from './views/quizView.js';
import { resultView } from './views/resultView.js';
import { missionsView } from './views/missionsView.js';
import { progressView } from './views/progressView.js';
import { rewardsView } from './views/rewardsView.js';
import { wordbookView } from './views/wordbookView.js';

export class UiController {
  constructor({ root, profiles, curriculum, practice, stats, missions, speech, recognition }) {
    this.root = root;
    this.profiles = profiles;
    this.curriculum = curriculum;
    this.practice = practice;
    this.stats = stats;
    this.missions = missions;
    this.speech = speech;
    this.recognition = recognition;

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
    const active = this.profiles.activeId();
    if (active) {
      this.state.screen = 'home';
      this.state.levelId = await this.curriculum.defaultLevelId(active);
    }
    await this.render();
  }

  // ------------------------------------------------------------- navigasi

  async go(screen, patch = {}) {
    this.#teardownTrace();
    this.recognition?.stop();
    this.listening = false;
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
        const btn = e.target.closest('[data-start-skill]');
        if (!btn) return;
        panel.close();
        await this.#startRound(btn.dataset.startSkill);
      });
    });

    // --- Lanjut belajar / latihan cepat dari beranda
    on(r, 'click', '[data-action="continue"]', async () => {
      const pid = this.#pid();
      const { lessons } = await this.curriculum.lessonMap(pid, this.state.levelId);
      const playable = lessons.filter((l) => l.vocabCount > 0 || l.sentenceCount > 0);
      const next = playable.find((l) => !l.completed) || playable[0];
      if (!next) return toast('Materi belum tersedia.');
      this.state.lessonNumber = next.number;
      await this.#startRound('mixed');
    });

    on(r, 'click', '[data-quick]', async (_e, el) => {
      const pid = this.#pid();
      const { lessons } = await this.curriculum.lessonMap(pid, this.state.levelId);
      const playable = lessons.filter((l) => l.vocabCount > 0 || l.sentenceCount > 0);
      const target = playable.find((l) => !l.completed) || playable[0];
      if (!target) return toast('Materi belum tersedia.');
      this.state.lessonNumber = target.number;
      await this.#startRound(el.dataset.quick);
    });

    // --- Latihan: audio
    on(r, 'click', '[data-action="speak"]', () => {
      const q = this.practice.current();
      if (q?.speak) this.speech.speak(q.speak);
    });
    on(r, 'click', '[data-action="speak-slow"]', () => {
      const q = this.practice.current();
      if (q?.speak) this.speech.speak(q.speak, { slow: true });
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

  // ------------------------------------------------------------- latihan

  async #startRound(skill) {
    const pid = this.#pid();
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
    let speech = null;
    if (q.skill === 'speaking') {
      const d = result.detail;
      speech = d?.selfAssessed
        ? { selfAssessed: true }
        : {
            heard: d?.heard || '',
            score: d?.score || 0,
            stars: speechStars(d?.score || 0),
            message: speechFeedbackId(d?.score || 0)
          };
    }

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
    const panel = sheet(`
      <h2 style="margin:0 0 4px">⚙️ Menu Orang Tua</h2>
      <p class="small muted" style="margin:0 0 16px">Cadangkan atau atur ulang data belajar.</p>
      <button class="btn btn--ghost" data-export>💾 Simpan Cadangan (JSON)</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-import>📂 Muat Cadangan</button>
      <button class="btn btn--danger" style="margin-top:8px" data-reset>🗑️ Hapus Semua Progres</button>
      <input type="file" accept="application/json" id="import-file" hidden />
    `);

    panel.el.addEventListener('click', async (e) => {
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

const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function labelForDay(dayKey) {
  if (dayKey === toDayKey()) return 'Hari ini';
  const d = dayKeyToDate(dayKey);
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
}
