// Orkestrasi sesi belajar: menyiapkan kartu materi, mengingat sampai mana
// anak membaca, lalu mencatat bahwa pelajaran itu sudah dipelajari.
//
// Catatan "sudah dipelajari" inilah yang membuka kunci soal-soal latihan
// (lihat appConfig.study.requireBeforeQuiz).

import { appConfig } from '../config/appConfig.js';
import { toDayKey } from '../shared/utils.js';
import { buildStudyDeck, bridgeShareFor } from '../domain/studyDeck.js';
import { applyStudy } from '../domain/progress.js';
import { levelFromXp } from '../domain/scoring.js';

/** Kunci catatan "sudah belajar" untuk satu pelajaran. */
export function studyKey(levelId, lessonNumber) {
  return `${levelId}:${lessonNumber}`;
}

export class StudyService {
  constructor(content, profiles) {
    this.content = content;
    this.profiles = profiles;
    this.session = null;
  }

  /** Sudah pernah menuntaskan sesi belajar pelajaran ini? */
  hasStudied(profileId, levelId, lessonNumber) {
    const studied = this.profiles.data(profileId)?.studied || {};
    return !!studied[studyKey(levelId, lessonNumber)];
  }

  /** Soal boleh dibuka? Selalu boleh bila syaratnya dimatikan di konfigurasi. */
  canPractice(profileId, levelId, lessonNumber) {
    if (!appConfig.study.requireBeforeQuiz) return true;
    return this.hasStudied(profileId, levelId, lessonNumber);
  }

  /** Siapkan sesi belajar dan kembalikan keadaannya. */
  async start({ profileId, levelId, lessonNumber }) {
    const level = await this.content.loadLevel(levelId);
    const lesson = (level.lessons || []).find((l) => l.number === lessonNumber);
    if (!lesson) throw new Error(`Pelajaran ${lessonNumber} tidak ditemukan di ${levelId}`);

    const cfg = this.profiles.profileConfig(profileId);
    const cards = buildStudyDeck(lesson, {
      bridgeWords: bridgeShareFor(lesson.bridgeVocab, cfg?.bridgePerLesson ?? 0),
      alsoIn: level.alsoIn || {},
      levelCode: level.code
    });

    this.session = {
      profileId,
      levelId,
      levelCode: level.code,
      lessonNumber,
      lessonTitle: lesson.titleZh,
      cards,
      index: 0,
      startedAt: Date.now(),
      replay: this.hasStudied(profileId, levelId, lessonNumber)
    };
    return this.session;
  }

  current() {
    if (!this.session) return null;
    return this.session.cards[this.session.index] || null;
  }

  atStart() {
    return !this.session || this.session.index <= 0;
  }

  atEnd() {
    if (!this.session) return true;
    return this.session.index >= this.session.cards.length - 1;
  }

  next() {
    if (!this.session || this.atEnd()) return null;
    this.session.index++;
    return this.current();
  }

  prev() {
    if (!this.session || this.atStart()) return null;
    this.session.index--;
    return this.current();
  }

  /** Lompat ke kartu tertentu (dipakai tombol "ulangi dari awal"). */
  jumpTo(index) {
    if (!this.session) return null;
    const max = this.session.cards.length - 1;
    this.session.index = Math.max(0, Math.min(max, index));
    return this.current();
  }

  /**
   * Tutup sesi: tandai pelajaran sudah dipelajari dan bayarkan hadiah XP.
   * Hadiah penuh hanya untuk kali pertama; mengulang tetap dihargai kecil.
   *
   * @returns {object|null} ringkasan untuk kartu penutup
   */
  finish() {
    const s = this.session;
    if (!s) return null;

    const key = studyKey(s.levelId, s.lessonNumber);
    const before = this.profiles.data(s.profileId);
    const firstTime = !(before.studied || {})[key];
    const xp = firstTime ? appConfig.study.xpFirstTime : appConfig.study.xpRepeat;
    const minutes = (Date.now() - s.startedAt) / 60000;
    const now = new Date().toISOString();

    this.profiles.update(s.profileId, (p) => {
      const studied = { ...(p.studied || {}) };
      const prev = studied[key];
      studied[key] = {
        firstAt: prev?.firstAt || now,
        lastAt: now,
        count: (prev?.count || 0) + 1
      };
      return {
        ...p,
        xp: p.xp + xp,
        studied,
        dailyLog: applyStudy(p.dailyLog, { xp, minutes }, toDayKey())
      };
    });

    const after = this.profiles.data(s.profileId);
    const summary = {
      levelId: s.levelId,
      levelCode: s.levelCode,
      lessonNumber: s.lessonNumber,
      lessonTitle: s.lessonTitle,
      firstTime,
      xp,
      cards: s.cards.length,
      counts: s.cards.find((c) => c.kind === 'intro')?.counts || null,
      level: levelFromXp(after.xp)
    };
    this.session = null;
    return summary;
  }

  abandon() {
    this.session = null;
  }
}
