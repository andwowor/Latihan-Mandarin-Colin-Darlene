// Adapter konten: membaca file JSON statis hasil ekstraksi buku YCT/HSK.

import { ContentPort } from '../../ports/contentPort.js';
import { appConfig } from '../../config/appConfig.js';

export class StaticContentAdapter extends ContentPort {
  constructor(base = appConfig.contentBase) {
    super();
    this.base = base;
    this.levelCache = new Map();
    this.indexCache = null;
    this.bridgeCache = undefined;
    this.readingsCache = undefined;
  }

  /** Rencana jembatan HSK, hasil `npm run bridge`. Boleh tidak ada. */
  async loadBridge() {
    if (this.bridgeCache !== undefined) return this.bridgeCache;
    try {
      const res = await fetch(`${this.base}/bridge.json`);
      this.bridgeCache = res.ok ? await res.json() : null;
    } catch {
      this.bridgeCache = null;
    }
    return this.bridgeCache;
  }

  async listLevels() {
    if (this.indexCache) return this.indexCache;
    const res = await fetch(`${this.base}/index.json`);
    if (!res.ok) throw new Error(`Gagal memuat daftar level (${res.status})`);
    const data = await res.json();
    this.indexCache = data.levels;
    return this.indexCache;
  }

  /** Kamus lafal, hasil `npm run readings`. Boleh tidak ada. */
  async loadReadings() {
    if (this.readingsCache !== undefined) return this.readingsCache;
    try {
      const res = await fetch(`${this.base}/readings.json`);
      const data = res.ok ? await res.json() : null;
      this.readingsCache = data?.readings || null;
    } catch {
      this.readingsCache = null;
    }
    return this.readingsCache;
  }

  async loadLevel(levelId) {
    if (this.levelCache.has(levelId)) return this.levelCache.get(levelId);
    const levels = await this.listLevels();
    const meta = levels.find((l) => l.id === levelId);
    if (!meta) throw new Error(`Level tidak dikenal: ${levelId}`);
    if (meta.status !== 'ready') {
      const stub = { ...meta, lessons: [], unavailable: true };
      this.levelCache.set(levelId, stub);
      return stub;
    }
    const res = await fetch(`${this.base}/${meta.file}`);
    if (!res.ok) throw new Error(`Gagal memuat ${meta.code} (${res.status})`);
    const level = await res.json();
    const merged = { ...meta, ...level };
    this.levelCache.set(levelId, merged);
    return merged;
  }

  /** Semua kosakata di sebuah level, dipakai sebagai bank pengecoh. */
  async vocabPool(levelId) {
    const level = await this.loadLevel(levelId);
    return (level.lessons || []).flatMap((l) => l.vocab || []);
  }
}
