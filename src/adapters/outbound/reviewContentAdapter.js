// Pembungkus sumber konten: mengisi bab ulangan (复习) tiap level.
//
// Dibuat sebagai pembungkus dengan alasan yang sama seperti
// BridgedContentAdapter — supaya versi PWA dan versi satu-berkas berperilaku
// persis sama, dan aturannya tetap tinggal di domain.
//
// Dipasang DI LUAR BridgedContentAdapter supaya bab ulangan ikut mewarisi
// kata bekal HSK yang sudah dititipkan ke pelajaran-pelajaran sebelumnya.

import { ContentPort } from '../../ports/contentPort.js';
import { applyReview } from '../../domain/reviewLesson.js';

export class ReviewContentAdapter extends ContentPort {
  constructor(inner) {
    super();
    this.inner = inner;
    this.cache = new Map();
  }

  async listLevels() {
    return this.inner.listLevels();
  }

  async loadBridge() {
    return this.inner.loadBridge();
  }

  async loadReadings() {
    return this.inner.loadReadings();
  }

  async loadLevel(levelId) {
    if (this.cache.has(levelId)) return this.cache.get(levelId);
    const level = applyReview(await this.inner.loadLevel(levelId));
    this.cache.set(levelId, level);
    return level;
  }
}
