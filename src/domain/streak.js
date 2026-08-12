// Perhitungan "streak" harian (berapa hari berturut-turut anak berlatih).

import { toDayKey, daysBetween } from '../shared/utils.js';

/**
 * Hitung ulang streak dari daftar hari yang punya aktivitas.
 * `dayKeys` tidak perlu terurut.
 */
export function computeStreak(dayKeys, todayKey = toDayKey()) {
  if (!dayKeys || dayKeys.length === 0) {
    return { current: 0, longest: 0, activeToday: false };
  }
  const unique = [...new Set(dayKeys)].sort();
  const activeToday = unique.includes(todayKey);

  // Streak terpanjang sepanjang sejarah.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i++) {
    if (daysBetween(unique[i - 1], unique[i]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Streak berjalan: mundur dari hari ini (atau kemarin kalau hari ini belum latihan).
  const last = unique[unique.length - 1];
  const gapFromToday = daysBetween(last, todayKey);
  if (gapFromToday > 1) {
    return { current: 0, longest, activeToday };
  }
  let current = 1;
  for (let i = unique.length - 1; i > 0; i--) {
    if (daysBetween(unique[i - 1], unique[i]) === 1) current++;
    else break;
  }
  return { current, longest, activeToday };
}

/** Apakah target XP harian sudah tercapai? */
export function dailyGoalState(xpToday, goalXp) {
  const reached = xpToday >= goalXp;
  return {
    reached,
    xpToday,
    goalXp,
    progress: goalXp > 0 ? Math.min(1, xpToday / goalXp) : 1
  };
}
