// Pengelolaan profil anak. Tidak ada password: memilih tombol = login.

import { appConfig } from '../config/appConfig.js';
import { toDayKey } from '../shared/utils.js';
import { levelFromXp } from '../domain/scoring.js';
import { computeStreak, dailyGoalState } from '../domain/streak.js';
import { countMastered } from '../domain/srs.js';
import { evaluateBadges } from '../domain/rewards.js';

export class ProfileService {
  constructor(storage) {
    this.storage = storage;
    this.state = storage.read();
  }

  #save() {
    this.storage.write(this.state);
  }

  listProfiles() {
    return appConfig.profiles;
  }

  profileConfig(id) {
    return appConfig.profiles.find((p) => p.id === id);
  }

  activeId() {
    return this.state.activeProfile;
  }

  login(profileId) {
    this.state.activeProfile = profileId;
    const p = this.state.profiles[profileId];
    if (p) p.lastSeen = new Date().toISOString();
    this.#save();
    return this.snapshot(profileId);
  }

  logout() {
    this.state.activeProfile = null;
    this.#save();
  }

  data(profileId = this.activeId()) {
    return this.state.profiles[profileId];
  }

  /** Ringkasan siap-tampil untuk satu profil. */
  snapshot(profileId = this.activeId(), todayKey = toDayKey()) {
    const cfg = this.profileConfig(profileId);
    const d = this.data(profileId);
    if (!cfg || !d) return null;

    const lvl = levelFromXp(d.xp);
    const streak = computeStreak(Object.keys(d.dailyLog || {}).filter((k) => d.dailyLog[k].answered > 0), todayKey);
    const today = d.dailyLog?.[todayKey];
    const goal = dailyGoalState(today?.xp || 0, cfg.dailyGoalXp);

    return {
      id: profileId,
      config: cfg,
      xp: d.xp,
      ...lvl,
      streak,
      goal,
      today: today || null,
      badges: d.badges || [],
      masteredWords: countMastered(d.cards),
      stats: d.stats,
      dailyLog: d.dailyLog
    };
  }

  allSnapshots(todayKey = toDayKey()) {
    return appConfig.profiles.map((p) => this.snapshot(p.id, todayKey));
  }

  /** Terapkan perubahan pada profil aktif lewat fungsi mutator. */
  update(profileId, mutate) {
    const current = this.state.profiles[profileId];
    this.state.profiles[profileId] = mutate({ ...current });
    this.#save();
    return this.state.profiles[profileId];
  }

  /** Hitung ulang lencana; kembalikan daftar id lencana terkini. */
  refreshBadges(profileId, clearedLevels = []) {
    const d = this.data(profileId);
    const cfg = this.profileConfig(profileId);
    const lvl = levelFromXp(d.xp);
    const days = Object.values(d.dailyLog || {});
    const streak = computeStreak(Object.keys(d.dailyLog || {}).filter((k) => d.dailyLog[k].answered > 0));
    const stars = Object.values(d.lessonStars || {});

    const summary = {
      xp: d.xp || 0,
      level: lvl.level,
      roundsCompleted: d.stats?.roundsCompleted || 0,
      perfectRounds: d.stats?.perfectRounds || 0,
      longestStreak: streak.longest,
      masteredWords: countMastered(d.cards),
      seenWords: Object.keys(d.cards || {}).length,
      correctBySkill: d.stats?.correctBySkill || {},
      studiedLessons: Object.keys(d.studied || {}).length,
      threeStarLessons: stars.filter((s) => s >= 3).length,
      activeDays: days.filter((x) => (x.answered || 0) > 0).length,
      // Tanpa target harian yang jelas, "hari target tercapai" tidak bermakna —
      // jangan sampai setiap hari kosong ikut terhitung.
      goalDays: cfg?.dailyGoalXp ? days.filter((x) => (x.xp || 0) >= cfg.dailyGoalXp).length : 0,
      bestCombo: days.reduce((max, x) => Math.max(max, x.bestCombo || 0), 0),
      totalAnswered: days.reduce((sum, x) => sum + (x.answered || 0), 0),
      totalMinutes: Math.round(days.reduce((sum, x) => sum + (x.minutes || 0), 0)),
      clearedLevels
    };
    return evaluateBadges(summary);
  }

  resetAll() {
    this.storage.clear();
    this.state = this.storage.read();
  }

  /** Seluruh isi penyimpanan — dipakai sinkronisasi, jangan diubah langsung. */
  rawState() {
    return this.state;
  }

  /** Ganti seluruh isi penyimpanan dengan hasil penggabungan dari server. */
  replaceState(next) {
    this.storage.write(next);
    this.state = this.storage.read();
    return this.state;
  }

  /** Setelan perangkat (sambungan sinkronisasi). Tidak ikut disinkronkan. */
  settings() {
    return this.storage.readSettings() || {};
  }

  saveSettings(patch) {
    const next = { ...this.settings(), ...patch };
    this.storage.writeSettings(next);
    return next;
  }

  exportJson() {
    return JSON.stringify(this.state, null, 2);
  }

  importJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !parsed.profiles) {
      throw new Error('Berkas cadangan tidak dikenali.');
    }
    this.storage.write(parsed);
    this.state = this.storage.read();
  }
}
