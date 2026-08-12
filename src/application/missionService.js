// Layanan misi harian: menyusun misi hari ini, memantau kemajuannya,
// dan membayarkan hadiah XP ketika misi tuntas.

import { toDayKey } from '../shared/utils.js';
import { emptyDay } from '../domain/progress.js';
import {
  missionsForDay,
  evaluateMissions,
  ALL_MISSIONS_BONUS_ID,
  ALL_MISSIONS_BONUS_XP
} from '../domain/missions.js';

export class MissionService {
  constructor(profiles) {
    this.profiles = profiles;
  }

  /** Definisi misi hari ini (belum dinilai). */
  definitions(profileId, dayKey = toDayKey()) {
    const cfg = this.profiles.profileConfig(profileId);
    return missionsForDay(dayKey, profileId, cfg.dailyGoalXp);
  }

  /** Status misi hari ini, siap ditampilkan. */
  status(profileId, dayKey = toDayKey()) {
    const data = this.profiles.data(profileId);
    const day = data?.dailyLog?.[dayKey] || emptyDay(dayKey);
    const claimed = day.missionsClaimed || [];
    return evaluateMissions(this.definitions(profileId, dayKey), day, claimed);
  }

  /**
   * Bayarkan hadiah untuk misi yang sudah tuntas tapi belum diambil.
   * Dipanggil otomatis setelah satu ronde selesai.
   *
   * @returns {{xp:number, missions:object[], bonus:boolean}} hadiah yang baru dibayarkan
   */
  claimCompleted(profileId, dayKey = toDayKey()) {
    const status = this.status(profileId, dayKey);
    const toClaim = status.unclaimed;
    const bonus = status.bonusPending;
    if (toClaim.length === 0 && !bonus) {
      return { xp: 0, missions: [], bonus: false };
    }

    const gained = toClaim.reduce((acc, m) => acc + m.reward, 0) + (bonus ? ALL_MISSIONS_BONUS_XP : 0);
    const ids = toClaim.map((m) => m.id);
    if (bonus) ids.push(ALL_MISSIONS_BONUS_ID);

    this.profiles.update(profileId, (p) => {
      const dailyLog = { ...(p.dailyLog || {}) };
      const day = { ...(dailyLog[dayKey] || emptyDay(dayKey)) };
      day.missionsClaimed = [...(day.missionsClaimed || []), ...ids];
      // Hadiah misi ikut tercatat sebagai XP hari itu.
      day.xp += gained;
      dailyLog[dayKey] = day;
      return { ...p, xp: p.xp + gained, dailyLog };
    });

    return { xp: gained, missions: toClaim, bonus };
  }

  /** Ringkasan pendek untuk kartu di beranda. */
  summary(profileId, dayKey = toDayKey()) {
    const s = this.status(profileId, dayKey);
    return {
      completed: s.completed,
      total: s.total,
      allDone: s.allDone,
      items: s.items
    };
  }
}
