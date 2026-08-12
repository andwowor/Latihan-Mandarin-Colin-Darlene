// Agregasi progres per periode: harian, bulanan, 3 bulan, 6 bulan, tahunan.
// Sumber datanya adalah catatan harian (daily log) per profil.

import { toDayKey, dayKeyToDate, addDays, sum, percent } from '../shared/utils.js';

export const PERIODS = [
  { id: 'daily',    labelId: 'Harian',    days: 1,   bucket: 'day' },
  { id: 'weekly',   labelId: 'Mingguan',  days: 7,   bucket: 'day' },
  { id: 'monthly',  labelId: 'Bulanan',   days: 30,  bucket: 'day' },
  { id: 'quarter',  labelId: '3 Bulan',   days: 90,  bucket: 'week' },
  { id: 'half',     labelId: '6 Bulan',   days: 180, bucket: 'week' },
  { id: 'yearly',   labelId: 'Tahunan',   days: 365, bucket: 'month' }
];

export function periodById(id) {
  return PERIODS.find((p) => p.id === id) || PERIODS[2];
}

/** Catatan harian kosong. */
export function emptyDay(dayKey) {
  return {
    day: dayKey,
    xp: 0,
    answered: 0,
    correct: 0,
    minutes: 0,
    rounds: 0,          // pelajaran/ronde yang diselesaikan hari itu
    perfectRounds: 0,   // ronde tanpa satu pun kesalahan
    starsEarned: 0,
    bestCombo: 0,
    missionsClaimed: [],
    bySkill: { reading: { answered: 0, correct: 0 }, listening: { answered: 0, correct: 0 }, writing: { answered: 0, correct: 0 } }
  };
}

/** Daftar dayKey dari `days` hari terakhir, termasuk hari ini. */
export function recentDayKeys(days, todayKey = toDayKey()) {
  const today = dayKeyToDate(todayKey);
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(toDayKey(addDays(today, -i)));
  }
  return keys;
}

/** Total sebuah periode untuk satu profil. */
export function totalsForPeriod(dailyLog, periodId, todayKey = toDayKey()) {
  const period = periodById(periodId);
  const keys = recentDayKeys(period.days, todayKey);
  const days = keys.map((k) => dailyLog?.[k] || emptyDay(k));
  const answered = sum(days, (d) => d.answered);
  const correct = sum(days, (d) => d.correct);
  return {
    periodId,
    label: period.labelId,
    xp: sum(days, (d) => d.xp),
    answered,
    correct,
    accuracy: percent(correct, answered),
    minutes: Math.round(sum(days, (d) => d.minutes)),
    activeDays: days.filter((d) => d.answered > 0).length,
    totalDays: period.days,
    days
  };
}

/**
 * Data untuk grafik: dikelompokkan agar tidak terlalu padat.
 * bucket 'day' -> per hari, 'week' -> per 7 hari, 'month' -> per bulan.
 */
export function seriesForPeriod(dailyLog, periodId, todayKey = toDayKey()) {
  const period = periodById(periodId);
  const keys = recentDayKeys(period.days, todayKey);
  const days = keys.map((k) => dailyLog?.[k] || emptyDay(k));

  if (period.bucket === 'day') {
    return days.map((d) => ({ label: shortDayLabel(d.day), xp: d.xp, key: d.day }));
  }

  if (period.bucket === 'week') {
    const buckets = [];
    for (let i = 0; i < days.length; i += 7) {
      const slice = days.slice(i, i + 7);
      buckets.push({
        label: shortDayLabel(slice[0].day),
        xp: sum(slice, (d) => d.xp),
        key: slice[0].day
      });
    }
    return buckets;
  }

  // per bulan
  const byMonth = new Map();
  for (const d of days) {
    const monthKey = d.day.slice(0, 7);
    byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + d.xp);
  }
  return [...byMonth.entries()].map(([key, xp]) => ({ label: monthLabel(key), xp, key }));
}

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function shortDayLabel(dayKey) {
  const d = dayKeyToDate(dayKey);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]}`;
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return `${MONTHS_ID[m - 1]} ${String(y).slice(2)}`;
}

/** Bandingkan dua profil pada periode yang sama. */
export function compareProfiles(profileA, profileB, periodId, todayKey = toDayKey()) {
  const a = totalsForPeriod(profileA.dailyLog, periodId, todayKey);
  const b = totalsForPeriod(profileB.dailyLog, periodId, todayKey);
  const leader = a.xp === b.xp ? null : a.xp > b.xp ? 'a' : 'b';
  return { a, b, leader, gap: Math.abs(a.xp - b.xp) };
}

/** Tambahkan hasil satu ronde ke catatan harian (mengembalikan log baru). */
export function applyRound(
  dailyLog,
  { xp, answered, correct, minutes, bySkill, perfect, stars, bestCombo },
  dayKey = toDayKey()
) {
  const log = { ...(dailyLog || {}) };
  const prev = log[dayKey] || emptyDay(dayKey);
  const next = {
    ...prev,
    xp: prev.xp + xp,
    answered: prev.answered + answered,
    correct: prev.correct + correct,
    minutes: prev.minutes + minutes,
    rounds: (prev.rounds || 0) + 1,
    perfectRounds: (prev.perfectRounds || 0) + (perfect ? 1 : 0),
    starsEarned: (prev.starsEarned || 0) + (stars || 0),
    bestCombo: Math.max(prev.bestCombo || 0, bestCombo || 0),
    missionsClaimed: prev.missionsClaimed || [],
    bySkill: { ...prev.bySkill }
  };
  for (const [skill, stat] of Object.entries(bySkill || {})) {
    const before = next.bySkill[skill] || { answered: 0, correct: 0 };
    next.bySkill[skill] = {
      answered: before.answered + (stat.answered || 0),
      correct: before.correct + (stat.correct || 0)
    };
  }
  log[dayKey] = next;
  return log;
}
