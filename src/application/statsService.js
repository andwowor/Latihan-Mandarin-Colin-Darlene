// Laporan progres & papan perbandingan Colin vs Darlene.

import { appConfig } from '../config/appConfig.js';
import { toDayKey, percent } from '../shared/utils.js';
import { PERIODS, totalsForPeriod, seriesForPeriod, compareProfiles } from '../domain/progress.js';

export class StatsService {
  constructor(profiles) {
    this.profiles = profiles;
  }

  periods() {
    return PERIODS;
  }

  /** Laporan lengkap satu anak pada satu periode. */
  report(profileId, periodId, todayKey = toDayKey()) {
    const data = this.profiles.data(profileId);
    const cfg = this.profiles.profileConfig(profileId);
    const totals = totalsForPeriod(data.dailyLog, periodId, todayKey);
    const series = seriesForPeriod(data.dailyLog, periodId, todayKey);

    // Rincian per keterampilan pada periode tersebut.
    const bySkill = {};
    for (const skill of appConfig.skills.map((s) => s.id)) {
      bySkill[skill] = { answered: 0, correct: 0 };
    }
    for (const day of totals.days) {
      for (const [skill, stat] of Object.entries(day.bySkill || {})) {
        if (!bySkill[skill]) bySkill[skill] = { answered: 0, correct: 0 };
        bySkill[skill].answered += stat.answered || 0;
        bySkill[skill].correct += stat.correct || 0;
      }
    }
    for (const stat of Object.values(bySkill)) {
      stat.accuracy = percent(stat.correct, stat.answered);
    }

    return { profile: cfg, totals, series, bySkill };
  }

  /** Papan perbandingan dua anak. */
  leaderboard(periodId, todayKey = toDayKey()) {
    const [a, b] = appConfig.profiles;
    const cmp = compareProfiles(
      this.profiles.data(a.id),
      this.profiles.data(b.id),
      periodId,
      todayKey
    );
    return {
      period: PERIODS.find((p) => p.id === periodId),
      entries: [
        { profile: a, totals: cmp.a, winner: cmp.leader === 'a' },
        { profile: b, totals: cmp.b, winner: cmp.leader === 'b' }
      ],
      tie: cmp.leader === null,
      gap: cmp.gap
    };
  }

  /** Semua periode sekaligus, untuk tabel ringkas di dasbor orang tua. */
  allPeriods(profileId, todayKey = toDayKey()) {
    return PERIODS.map((p) => ({
      period: p,
      totals: totalsForPeriod(this.profiles.data(profileId).dailyLog, p.id, todayKey)
    }));
  }
}
