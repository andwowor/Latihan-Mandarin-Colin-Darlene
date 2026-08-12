// Aturan poin & level. Murni fungsi, tanpa efek samping.

import { appConfig } from '../config/appConfig.js';
import { clamp } from '../shared/utils.js';

/**
 * Multiplier combo: makin panjang rentetan jawaban benar, makin besar poinnya.
 * 0-2 benar -> x1, 3-5 -> x2, 6+ -> x3 (dibatasi comboMaxMultiplier).
 */
export function comboMultiplier(streakCount, cfg = appConfig.session) {
  const step = Math.floor(streakCount / cfg.comboStep) + 1;
  return clamp(step, 1, cfg.comboMaxMultiplier);
}

/** XP untuk satu jawaban benar, sudah memperhitungkan combo. */
export function xpForAnswer(streakCountBefore, cfg = appConfig.session) {
  return cfg.xpPerCorrect * comboMultiplier(streakCountBefore, cfg);
}

/**
 * Ringkasan XP satu ronde latihan.
 * `firstClear` = pertama kali menyelesaikan pelajaran ini.
 */
export function roundXp({ baseXp, correct, total, firstClear }, cfg = appConfig.session) {
  let xp = baseXp;
  if (total > 0 && correct === total) xp += cfg.xpPerfectBonus;
  if (firstClear) xp += cfg.xpFirstClearBonus;
  return xp;
}

/**
 * XP kumulatif yang dibutuhkan untuk mencapai suatu level.
 * Level 1 mulai di 0 XP.
 */
export function xpNeededForLevel(level, curve = appConfig.levelCurve) {
  if (level <= 1) return 0;
  let total = 0;
  let step = curve.baseXp;
  for (let i = 1; i < level; i++) {
    total += Math.round(step);
    step *= curve.growth;
  }
  return total;
}

/** Level saat ini + progres menuju level berikutnya. */
export function levelFromXp(totalXp, curve = appConfig.levelCurve) {
  let level = 1;
  while (xpNeededForLevel(level + 1, curve) <= totalXp) {
    level++;
    if (level > 200) break; // pengaman
  }
  const floor = xpNeededForLevel(level, curve);
  const ceiling = xpNeededForLevel(level + 1, curve);
  const span = ceiling - floor;
  return {
    level,
    xpIntoLevel: totalXp - floor,
    xpForNextLevel: span,
    progress: span > 0 ? (totalXp - floor) / span : 0
  };
}

/** Bintang 0-3 untuk sebuah ronde, dipakai di peta pelajaran. */
export function starsForRound(correct, total) {
  if (!total) return 0;
  const acc = correct / total;
  if (acc >= 1) return 3;
  if (acc >= 0.8) return 2;
  if (acc >= 0.6) return 1;
  return 0;
}
