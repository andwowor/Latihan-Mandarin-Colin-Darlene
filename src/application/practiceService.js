// Orkestrasi satu ronde latihan: menyiapkan soal, menilai jawaban,
// lalu menyimpan XP, SRS, bintang, dan lencana.

import { appConfig } from '../config/appConfig.js';
import { toDayKey } from '../shared/utils.js';
import { buildRound, grade, wordKey } from '../domain/exerciseFactory.js';
import { bridgeShareFor } from '../domain/studyDeck.js';
import { xpForAnswer, roundXp, starsForRound, levelFromXp } from '../domain/scoring.js';
import { newCard, reviewCard, prioritise } from '../domain/srs.js';
import { applyRound } from '../domain/progress.js';
import { newlyEarned } from '../domain/rewards.js';

export class PracticeService {
  constructor(content, profiles, missions) {
    this.content = content;
    this.profiles = profiles;
    this.missions = missions;
    this.round = null;
    this.readings = null;   // kamus lafal, dimuat sekali saat ronde pertama
  }

  /** Siapkan ronde baru. Mengembalikan objek ronde siap dimainkan. */
  async start({ profileId, levelId, lessonNumber, skill }) {
    const level = await this.content.loadLevel(levelId);
    const lesson = (level.lessons || []).find((l) => l.number === lessonNumber);
    if (!lesson) throw new Error(`Pelajaran ${lessonNumber} tidak ditemukan di ${levelId}`);

    // Kamus lafal dipakai menilai ucapan. Kegagalan memuatnya tidak boleh
    // menghentikan latihan — penilaian tinggal jatuh ke perbandingan huruf.
    if (this.readings === null && this.content.loadReadings) {
      this.readings = (await this.content.loadReadings().catch(() => null)) || {};
    }

    const pool = (level.lessons || []).flatMap((l) => l.vocab || []);
    const profile = this.profiles.data(profileId);

    // Kata bekal HSK hanya diuji sebanyak yang sudah diperkenalkan di sesi
    // belajar anak ini, dan tidak lebih dari jatah satu ronde.
    const cfg = this.profiles.profileConfig(profileId);
    const bridgeWords = bridgeShareFor(
      bridgeShareFor(lesson.bridgeVocab, cfg?.bridgePerLesson ?? 0),
      appConfig.bridge.maxPerRound
    );

    const keys = [...(lesson.vocab || []), ...bridgeWords].map((w) => wordKey(levelId, w));
    const ordered = prioritise(keys, profile.cards);

    const questions = buildRound({
      lesson,
      pool: pool.length ? pool : lesson.vocab || [],
      levelId,
      skill,
      orderedWords: ordered,
      bridgeWords,
      count: appConfig.session.questionsPerRound
    });

    this.round = {
      profileId,
      levelId,
      levelCode: level.code,
      lessonNumber,
      lessonTitle: lesson.titleZh,
      skill,
      questions,
      index: 0,
      correct: 0,
      answered: 0,
      xp: 0,
      streakCount: 0,
      bestCombo: 0,
      hearts: appConfig.session.hearts,
      bySkill: {},
      mistakes: [],
      retries: {},        // nomor soal -> berapa kali sudah diulang
      retriedCount: 0,    // berapa soal yang butuh percobaan kedua
      startedAt: Date.now()
    };
    return this.round;
  }

  current() {
    if (!this.round) return null;
    return this.round.questions[this.round.index] || null;
  }

  isFinished() {
    if (!this.round) return true;
    return this.round.index >= this.round.questions.length || this.round.hearts <= 0;
  }

  /** Berapa kali soal saat ini masih boleh diulang sebelum dicatat. */
  retriesLeft() {
    const round = this.round;
    const question = this.current();
    if (!round || !question) return 0;
    if (question.skill !== 'speaking') return 0;
    return Math.max(0, (appConfig.speech.retries ?? 0) - (round.retries[round.index] || 0));
  }

  /**
   * Nilai jawaban untuk soal saat ini.
   *
   * Khusus berbicara, percobaan pertama yang meleset TIDAK langsung dicatat:
   * anak mendapat satu kesempatan lagi, dan yang tercatat adalah percobaan
   * terakhirnya. Selama masih ada kesempatan, tidak ada yang berubah — nyawa
   * utuh, combo utuh, kartu SRS belum disentuh.
   *
   * @returns {{correct:boolean, retry?:boolean, retriesLeft?:number,
   *            xpGained:number, question:object, explain:string, detail:*}}
   */
  submit(response) {
    const round = this.round;
    const question = this.current();
    if (!round || !question) return null;

    const { correct, detail, selfAssessed } = grade(question, response, {
      acceptScore: appConfig.speech.acceptScore,
      readings: this.readings || {}
    });

    // Penilaian sendiri tidak diberi kesempatan ulang: di situ orang tua yang
    // memutuskan, dan anak bisa mengulang ucapannya sebelum tombolnya ditekan.
    if (!correct && !selfAssessed && this.retriesLeft() > 0) {
      round.retries[round.index] = (round.retries[round.index] || 0) + 1;
      return {
        correct: false,
        retry: true,
        retriesLeft: this.retriesLeft(),
        xpGained: 0,
        question,
        explain: question.explain,
        detail
      };
    }

    const diulang = (round.retries[round.index] || 0) > 0;
    if (diulang) round.retriedCount++;
    const xpGained = correct ? xpForAnswer(round.streakCount) : 0;

    round.answered++;
    round.xp += xpGained;
    if (correct) {
      round.correct++;
      // Jawaban yang butuh percobaan kedua tidak memutus combo, tetapi juga
      // tidak menumbuhkannya: 🔥 tetap hadiah untuk yang sekali jadi.
      if (!diulang) {
        round.streakCount++;
        round.bestCombo = Math.max(round.bestCombo, round.streakCount);
      }
    } else {
      round.streakCount = 0;
      round.hearts--;
      round.mistakes.push(question);
    }

    const bucket = (round.bySkill[question.skill] ||= { answered: 0, correct: 0 });
    bucket.answered++;
    if (correct) bucket.correct++;

    // Perbarui kartu SRS untuk kata yang diuji.
    if (question.word) {
      const key = wordKey(round.levelId, question.word);
      this.profiles.update(round.profileId, (p) => {
        const cards = { ...(p.cards || {}) };
        // Kata yang baru benar di percobaan kedua belum dikuasai — biar
        // kembali lebih cepat, walau rondenya sendiri dinilai benar.
        cards[key] = reviewCard(cards[key] || newCard(key), correct && !diulang);
        return { ...p, cards };
      });
    }

    return { correct, xpGained, question, explain: question.explain, detail, retriesLeft: 0 };
  }

  next() {
    if (!this.round) return null;
    this.round.index++;
    return this.current();
  }

  /**
   * Tutup ronde: simpan XP, catatan harian, bintang, dan lencana baru.
   * @returns {object} ringkasan untuk layar hasil
   */
  async finish(clearedLevels = []) {
    const round = this.round;
    if (!round) return null;

    const starKey = `${round.levelId}:${round.lessonNumber}:${round.skill}`;
    const before = this.profiles.data(round.profileId);
    const firstClear = !(before.lessonStars || {})[starKey];
    const stars = starsForRound(round.correct, round.answered);
    const totalXp = roundXp({
      baseXp: round.xp,
      correct: round.correct,
      total: round.answered,
      firstClear
    });
    const minutes = (Date.now() - round.startedAt) / 60000;
    const badgesBefore = before.badges || [];
    const perfect = round.answered > 0 && round.correct === round.answered;

    this.profiles.update(round.profileId, (p) => {
      const stats = { ...(p.stats || {}) };
      stats.roundsCompleted = (stats.roundsCompleted || 0) + 1;
      if (perfect) stats.perfectRounds = (stats.perfectRounds || 0) + 1;
      stats.correctBySkill = { ...(stats.correctBySkill || {}) };
      for (const [skill, s] of Object.entries(round.bySkill)) {
        stats.correctBySkill[skill] = (stats.correctBySkill[skill] || 0) + s.correct;
      }

      const lessonStars = { ...(p.lessonStars || {}) };
      lessonStars[starKey] = Math.max(lessonStars[starKey] || 0, stars);

      return {
        ...p,
        xp: p.xp + totalXp,
        stats,
        lessonStars,
        dailyLog: applyRound(
          p.dailyLog,
          {
            xp: totalXp,
            answered: round.answered,
            correct: round.correct,
            minutes,
            bySkill: round.bySkill,
            perfect,
            stars,
            bestCombo: round.bestCombo
          },
          toDayKey()
        )
      };
    });

    // Misi harian dinilai setelah ronde tercatat, lalu hadiahnya dibayarkan.
    const missionReward = this.missions
      ? this.missions.claimCompleted(round.profileId)
      : { xp: 0, missions: [], bonus: false };
    const missionStatus = this.missions ? this.missions.status(round.profileId) : null;

    const badgeIds = this.profiles.refreshBadges(round.profileId, clearedLevels);
    this.profiles.update(round.profileId, (p) => ({ ...p, badges: badgeIds }));
    const fresh = newlyEarned(badgesBefore, badgeIds);

    const after = this.profiles.data(round.profileId);
    const summary = {
      levelCode: round.levelCode,
      lessonNumber: round.lessonNumber,
      lessonTitle: round.lessonTitle,
      skill: round.skill,
      correct: round.correct,
      answered: round.answered,
      xp: totalXp,
      stars,
      firstClear,
      perfect,
      outOfHearts: round.hearts <= 0,
      retried: round.retriedCount,
      mistakes: round.mistakes,
      newBadges: fresh,
      missionReward,
      missionStatus,
      level: levelFromXp(after.xp)
    };
    this.round = null;
    return summary;
  }

  abandon() {
    this.round = null;
  }
}
