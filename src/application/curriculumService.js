// Menyusun "peta belajar": level mana yang terbuka, pelajaran mana yang
// sudah dituntaskan, dan berapa bintang yang sudah dikumpulkan.

import { appConfig, SKILL_IDS } from '../config/appConfig.js';
import { bridgeShareFor } from '../domain/studyDeck.js';

export class CurriculumService {
  constructor(content, profiles) {
    this.content = content;
    this.profiles = profiles;
  }

  async levels(profileId) {
    const metas = await this.content.listLevels();
    const p = this.profiles.data(profileId);
    const cfg = this.profiles.profileConfig(profileId);
    const alwaysOpen = new Set(cfg?.openLevels || [cfg?.startLevel]);
    const xp = p?.xp || 0;

    return metas.map((m) => {
      const open = m.status === 'ready' && (alwaysOpen.has(m.id) || xp >= (m.unlockAtXp || 0));
      return { ...m, unlocked: open, locked: m.status === 'ready' && !open };
    });
  }

  /** Level yang sebaiknya dibuka pertama kali untuk anak ini. */
  async defaultLevelId(profileId) {
    const cfg = this.profiles.profileConfig(profileId);
    const list = await this.levels(profileId);
    const preferred = list.find((l) => l.id === cfg.startLevel && l.unlocked);
    if (preferred) return preferred.id;
    const firstOpen = list.find((l) => l.unlocked);
    return firstOpen ? firstOpen.id : list[0]?.id;
  }

  /** Peta pelajaran satu level, lengkap dengan bintang per keterampilan. */
  async lessonMap(profileId, levelId) {
    const level = await this.content.loadLevel(levelId);
    const p = this.profiles.data(profileId);
    const cfg = this.profiles.profileConfig(profileId);
    const stars = p?.lessonStars || {};
    const studied = p?.studied || {};

    const lessons = (level.lessons || []).map((lesson) => {
      const perSkill = {};
      let earned = 0;
      for (const skill of SKILL_IDS) {
        const s = stars[`${levelId}:${lesson.number}:${skill}`] || 0;
        perSkill[skill] = s;
        earned += s;
      }
      const bridge = bridgeShareFor(lesson.bridgeVocab, cfg?.bridgePerLesson ?? 0);
      const studyRecord = studied[`${levelId}:${lesson.number}`] || null;
      return {
        number: lesson.number,
        titleZh: lesson.titleZh,
        titleEn: lesson.titleEn,
        titleId: lesson.titleId,
        isReview: !!lesson.isReview,
        vocabCount: (lesson.vocab || []).length,
        sentenceCount: (lesson.keySentences || []).length,
        listeningCount: (lesson.listeningScripts || []).length,
        bridgeCount: bridge.length,
        hasBookAnswers: (lesson.bookAnswers || []).length > 0,
        stars: perSkill,
        starsEarned: earned,
        starsMax: SKILL_IDS.length * 3,
        studied: !!studyRecord,
        studyCount: studyRecord?.count || 0,
        // Soal dikunci sampai materinya dibaca — inilah gunanya sesi belajar.
        practiceLocked: appConfig.study.requireBeforeQuiz && !studyRecord,
        started: earned > 0,
        completed: earned >= SKILL_IDS.length // minimal 1 bintang di tiap keterampilan
      };
    });

    return { level, lessons };
  }

  /** Id level yang seluruh pelajarannya sudah tuntas (untuk lencana). */
  async clearedLevelIds(profileId) {
    const metas = await this.content.listLevels();
    const cleared = [];
    for (const m of metas.filter((x) => x.status === 'ready')) {
      const { lessons } = await this.lessonMap(profileId, m.id);
      const playable = lessons.filter((l) => l.vocabCount > 0 || l.sentenceCount > 0);
      if (playable.length && playable.every((l) => l.completed)) cleared.push(m.id);
    }
    return cleared;
  }

  /** Semua kata yang sedang dipelajari, untuk halaman "Kamusku". */
  async wordbook(profileId, levelId) {
    const level = await this.content.loadLevel(levelId);
    const p = this.profiles.data(profileId);
    const cfg = this.profiles.profileConfig(profileId);
    const cards = p?.cards || {};
    const alsoIn = level.alsoIn || {};
    const decorate = (w, lessonNumber, bridge) => ({
      ...w,
      lesson: lessonNumber,
      bridge,
      alsoIn: bridge ? [] : alsoIn[w.zh] || [],
      card: cards[`${levelId}:${w.zh}`] || null
    });

    return (level.lessons || []).flatMap((lesson) => [
      ...(lesson.vocab || []).map((w) => decorate(w, lesson.number, false)),
      ...bridgeShareFor(lesson.bridgeVocab, cfg?.bridgePerLesson ?? 0).map((w) =>
        decorate(w, lesson.number, true)
      )
    ]);
  }

  skills() {
    return appConfig.skills;
  }
}
