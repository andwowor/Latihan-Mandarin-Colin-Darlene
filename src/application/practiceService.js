// Orkestrasi satu ronde latihan: menyiapkan soal, menilai jawaban,
// lalu menyimpan XP, SRS, bintang, dan lencana.

import { appConfig } from '../config/appConfig.js';
import { toDayKey } from '../shared/utils.js';
import { buildRound, grade, wordKey } from '../domain/exerciseFactory.js';
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
  }

  /** Siapkan ronde baru. Mengembalikan objek ronde siap dimainkan. */
  async start({ profileId, levelId, lessonNumber, skill }) {
    const level = await this.content.loadLevel(levelId);
    const lesson = (level.lessons || []).find((l) => l.number === lessonNumber);
    if (!lesson) throw new Error(`Pelajaran ${lessonNumber} tidak ditemukan di ${levelId}`);

    const pool = (level.lessons || []).flatMap((l) => l.vocab || []);
    const profile = this.profiles.data(profileId);
    const keys = (lesson.vocab || []).map((w) => wordKey(levelId, w));
    const ordered = prioritise(keys, profile.cards);

    const questions = buildRound({
      lesson,
      pool: pool.length ? pool : lesson.vocab || [],
      levelId,
      skill,
      orderedWords: ordered,
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

  /**
   * Nilai jawaban untuk soal saat ini.
   * @returns {{correct:boolean, xpGained:number, question:object, explain:string}}
   */
  submit(response) {
    const round = this.round;
    const question = this.current();
    if (!round || !question) return null;

    const { correct } = grade(question, response);
    const xpGained = correct ? xpForAnswer(round.streakCount) : 0;

    round.answered++;
    round.xp += xpGained;
    if (correct) {
      round.correct++;
      round.streakCount++;
      round.bestCombo = Math.max(round.bestCombo, round.streakCount);
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
        cards[key] = reviewCard(cards[key] || newCard(key), correct);
        return { ...p, cards };
      });
    }

    return { correct, xpGained, question, explain: question.explain };
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
