// Adapter penyimpanan: localStorage browser.
// Semua progres tinggal di perangkat, tanpa server dan tanpa akun.

import { StoragePort } from '../../ports/storagePort.js';
import { appConfig } from '../../config/appConfig.js';

function blankProfile(id) {
  return {
    id,
    xp: 0,
    dailyLog: {},        // { 'YYYY-MM-DD': { xp, answered, correct, minutes, bySkill } }
    cards: {},           // SRS: { 'yct1:你好': { box, dueOn, seen, correct } }
    lessonStars: {},     // { 'yct1:1:reading': 3 }
    badges: [],
    stats: { roundsCompleted: 0, perfectRounds: 0, correctBySkill: {} },
    lastSeen: null
  };
}

function blankState() {
  const profiles = {};
  for (const p of appConfig.profiles) profiles[p.id] = blankProfile(p.id);
  return { version: 2, activeProfile: null, profiles };
}

export class LocalStorageAdapter extends StoragePort {
  constructor(key = appConfig.storageKey) {
    super();
    this.key = key;
    this.memory = null; // cadangan bila localStorage diblokir (mode privat iOS)
  }

  read() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return blankState();
      const parsed = JSON.parse(raw);
      return this.#migrate(parsed);
    } catch {
      return this.memory || blankState();
    }
  }

  write(state) {
    this.memory = state;
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
      return true;
    } catch {
      // Kuota penuh atau storage diblokir: aplikasi tetap jalan di memori.
      return false;
    }
  }

  clear() {
    this.memory = null;
    try {
      localStorage.removeItem(this.key);
    } catch {
      /* diabaikan */
    }
  }

  /** Pastikan setiap profil yang dikonfigurasi punya slot data. */
  #migrate(state) {
    const next = { ...blankState(), ...state };
    next.profiles = { ...next.profiles };
    for (const p of appConfig.profiles) {
      next.profiles[p.id] = { ...blankProfile(p.id), ...(next.profiles[p.id] || {}) };
    }
    return next;
  }
}
