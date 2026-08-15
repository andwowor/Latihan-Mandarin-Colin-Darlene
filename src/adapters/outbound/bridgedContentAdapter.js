// Pembungkus sumber konten: menempelkan "bekal HSK" ke setiap pelajaran YCT.
//
// Dibuat sebagai pembungkus (bukan ditanam di dalam adapter JSON maupun
// adapter versi-satu-berkas) supaya kedua sumber konten mendapat perilaku yang
// sama persis, dan supaya aturan penyisipannya tetap tinggal di domain.
//
// Bila bridge.json tidak ada atau gagal dimuat, aplikasi tetap jalan: level
// dikembalikan apa adanya, hanya tanpa kata bekal.

import { ContentPort } from '../../ports/contentPort.js';
import { applyBridge } from '../../domain/hskBridge.js';

export class BridgedContentAdapter extends ContentPort {
  constructor(inner) {
    super();
    this.inner = inner;
    this.bridge = undefined; // undefined = belum dicoba, null = tidak tersedia
    this.cache = new Map();
  }

  async listLevels() {
    return this.inner.listLevels();
  }

  async loadBridge() {
    if (this.bridge === undefined) {
      try {
        this.bridge = (await this.inner.loadBridge()) || null;
      } catch {
        this.bridge = null;
      }
    }
    return this.bridge;
  }

  async loadLevel(levelId) {
    if (this.cache.has(levelId)) return this.cache.get(levelId);
    const level = await this.inner.loadLevel(levelId);
    const bridge = await this.loadBridge();
    const merged = bridge ? applyBridge(level, bridge) : level;
    this.cache.set(levelId, merged);
    return merged;
  }
}
