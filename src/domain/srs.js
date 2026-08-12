// Spaced repetition sederhana (sistem kotak Leitner).
// Kata yang salah kembali ke kotak 0; kata yang benar naik satu kotak dan
// jeda ulangnya makin panjang.

import { appConfig } from '../config/appConfig.js';
import { toDayKey, daysBetween, addDays } from '../shared/utils.js';

export function newCard(wordKey, todayKey = toDayKey()) {
  return { key: wordKey, box: 0, dueOn: todayKey, seen: 0, correct: 0 };
}

/** Perbarui kartu setelah dijawab. Mengembalikan kartu baru (tidak memutasi). */
export function reviewCard(card, wasCorrect, todayKey = toDayKey(), cfg = appConfig.srs) {
  const maxBox = cfg.intervals.length - 1;
  const box = wasCorrect ? Math.min(maxBox, card.box + 1) : cfg.demoteTo;
  const interval = cfg.intervals[box];
  const dueOn = toDayKey(addDays(new Date(`${todayKey}T00:00:00`), interval));
  return {
    ...card,
    box,
    dueOn,
    seen: card.seen + 1,
    correct: card.correct + (wasCorrect ? 1 : 0)
  };
}

export function isDue(card, todayKey = toDayKey()) {
  return daysBetween(card.dueOn, todayKey) >= 0;
}

/** Kata dianggap "dikuasai" bila sudah mencapai kotak 4 ke atas. */
export function isMastered(card) {
  return card.box >= 4;
}

export function countMastered(cards) {
  return Object.values(cards || {}).filter(isMastered).length;
}

/**
 * Urutkan kandidat kata: yang jatuh tempo & paling lemah didahulukan,
 * lalu kata yang belum pernah dilihat.
 */
export function prioritise(wordKeys, cards, todayKey = toDayKey()) {
  const weight = (key) => {
    const card = cards?.[key];
    if (!card) return 50;                      // belum pernah dilihat: prioritas tinggi
    if (!isDue(card, todayKey)) return 0;      // belum waktunya diulang
    return 100 - card.box * 10;                // makin rendah kotaknya, makin butuh diulang
  };
  return wordKeys
    .map((key) => ({ key, w: weight(key) }))
    .sort((a, b) => b.w - a.w)
    .map((x) => x.key);
}
