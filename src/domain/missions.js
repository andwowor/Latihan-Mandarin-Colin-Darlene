// Misi harian: 3 tantangan yang harus diselesaikan setiap hari.
//
// Tiga misi wajib setiap hari:
//   1. Jumlah pelajaran yang diselesaikan
//   2. Jumlah XP yang harus dikumpulkan
//   3. Jumlah pelajaran yang diselesaikan sempurna (tanpa satu pun kesalahan)
//
// Besar targetnya berayun sedikit setiap hari secara deterministik dari
// (tanggal + id profil), sehingga tetap sama sepanjang hari itu meski halaman
// dimuat ulang, tetapi tidak membosankan dari hari ke hari. Target juga
// menyesuaikan umur: target harian Darlene (5 th) lebih ringan dari Colin (7 th).

import { clamp } from '../shared/utils.js';

export const MISSION_KINDS = {
  LESSONS: 'lessons-completed',
  XP: 'xp-earned',
  PERFECT: 'perfect-lessons'
};

/** Hash string sederhana & stabil (FNV-1a) untuk benih acak harian. */
function hashSeed(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG deterministik (mulberry32). */
function seededRng(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pilih satu nilai dari daftar memakai rng terbenih. */
function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

/**
 * Susun misi hari ini untuk seorang anak.
 *
 * @param {string} dayKey    'YYYY-MM-DD'
 * @param {string} profileId 'colin' | 'darlene'
 * @param {number} goalXp    target XP harian anak (dari appConfig.profiles)
 * @returns {object[]} tiga misi dengan target dan hadiahnya
 */
export function missionsForDay(dayKey, profileId, goalXp) {
  const rng = seededRng(hashSeed(`${dayKey}|${profileId}`));

  // 1. Pelajaran yang diselesaikan: 2-4 ronde, lebih ringan untuk anak kecil.
  const lessonChoices = goalXp >= 60 ? [2, 3, 3, 4] : [1, 2, 2, 3];
  const lessonTarget = pick(lessonChoices, rng);

  // 2. XP: berayun 80%-130% dari target harian, dibulatkan ke kelipatan 10.
  const xpFactor = pick([0.8, 1, 1, 1.15, 1.3], rng);
  const xpTarget = clamp(Math.round((goalXp * xpFactor) / 10) * 10, 20, 300);

  // 3. Pelajaran sempurna: 1-2, hanya sesekali 2 supaya tidak melelahkan.
  const perfectChoices = goalXp >= 60 ? [1, 1, 1, 2] : [1, 1, 1, 1];
  const perfectTarget = pick(perfectChoices, rng);

  return [
    {
      id: MISSION_KINDS.LESSONS,
      emoji: '🏁',
      title: `Selesaikan ${lessonTarget} pelajaran`,
      hint: 'Satu ronde latihan = satu pelajaran',
      target: lessonTarget,
      reward: 20 + lessonTarget * 5,
      unit: 'pelajaran',
      progressOf: (day) => day?.rounds || 0
    },
    {
      id: MISSION_KINDS.XP,
      emoji: '⭐',
      title: `Kumpulkan ${xpTarget} XP`,
      hint: 'XP didapat dari setiap jawaban benar',
      target: xpTarget,
      reward: 25,
      unit: 'XP',
      progressOf: (day) => day?.xp || 0
    },
    {
      id: MISSION_KINDS.PERFECT,
      emoji: '💯',
      title:
        perfectTarget === 1
          ? 'Selesaikan 1 pelajaran tanpa salah'
          : `Selesaikan ${perfectTarget} pelajaran tanpa salah`,
      hint: 'Semua jawaban harus benar dalam satu ronde',
      target: perfectTarget,
      reward: 30 + (perfectTarget - 1) * 20,
      unit: 'pelajaran',
      progressOf: (day) => day?.perfectRounds || 0
    }
  ];
}

/**
 * Hitung status misi hari ini.
 *
 * @param {object[]} missions hasil missionsForDay
 * @param {object} day        rekaman harian (lihat domain/progress.js)
 * @param {string[]} claimed  id misi yang hadiahnya sudah diberikan
 */
export function evaluateMissions(missions, day, claimed = []) {
  const claimedSet = new Set(claimed);
  const items = missions.map((m) => {
    const raw = Math.max(0, m.progressOf(day));
    const done = raw >= m.target;
    return {
      id: m.id,
      emoji: m.emoji,
      title: m.title,
      hint: m.hint,
      unit: m.unit,
      target: m.target,
      reward: m.reward,
      value: Math.min(raw, m.target),
      rawValue: raw,
      done,
      claimed: claimedSet.has(m.id),
      progress: Math.min(1, raw / m.target)
    };
  });

  const completed = items.filter((i) => i.done).length;
  const unclaimed = items.filter((i) => i.done && !i.claimed);
  const allDone = completed === items.length && items.length > 0;
  const allBonusClaimed = claimedSet.has(ALL_MISSIONS_BONUS_ID);

  return {
    items,
    completed,
    total: items.length,
    allDone,
    unclaimed,
    // Hadiah yang belum diambil, termasuk bonus bila ketiganya tuntas.
    pendingXp:
      unclaimed.reduce((acc, i) => acc + i.reward, 0) +
      (allDone && !allBonusClaimed ? ALL_MISSIONS_BONUS_XP : 0),
    bonusPending: allDone && !allBonusClaimed
  };
}

/** Bonus tambahan bila ketiga misi hari itu tuntas semua. */
export const ALL_MISSIONS_BONUS_XP = 50;
export const ALL_MISSIONS_BONUS_ID = 'all-missions-bonus';
