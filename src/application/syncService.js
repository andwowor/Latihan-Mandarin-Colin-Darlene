// Menyamakan progres antar-perangkat.
//
// Aturan mainnya:
//   - localStorage tetap sumber kebenaran; sinkronisasi hanya menyusulkan.
//   - Setiap putaran selalu: ambil dari server → gabungkan → kirim balik.
//     Tidak pernah menimpa mentah-mentah, supaya latihan yang dikerjakan di
//     perangkat lain tidak hilang.
//   - Gagal itu wajar (internet mati, di mobil, di sekolah). Kegagalan dicatat
//     lalu dilupakan; anak tidak boleh sampai terhalang berlatih karenanya.

import { mergeStates, sameState } from '../domain/mergeState.js';

const MAX_ATTEMPTS = 3;

/** Aturan penulisan kode & PIN — sama persis dengan yang dijaga server. */
export const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/;
export const PIN_PATTERN = /^[0-9]{4,12}$/;

export function validateConfig({ url, code, pin }) {
  const problems = [];
  if (!/^https:\/\/.+/.test(String(url || ''))) {
    problems.push('Alamat server harus diawali https://');
  }
  if (!CODE_PATTERN.test(String(code || ''))) {
    problems.push('Kode keluarga: 3-32 huruf kecil, angka, atau tanda hubung.');
  }
  if (!PIN_PATTERN.test(String(pin || ''))) {
    problems.push('PIN: 4-12 angka.');
  }
  return problems;
}

export class SyncService {
  constructor(profiles, remote) {
    this.profiles = profiles;
    this.remote = remote;
    this.running = null;      // janji yang sedang berjalan, agar tidak dobel
    this.queued = false;      // ada permintaan menyusul saat masih berjalan
    this.listeners = new Set();
  }

  // ------------------------------------------------------------- sambungan

  config() {
    const s = this.profiles.settings().sync;
    if (!s?.url || !s?.code || !s?.pin) return null;
    return { url: s.url, code: s.code, pin: s.pin };
  }

  isConnected() {
    return !!this.config();
  }

  status() {
    const s = this.profiles.settings().sync || {};
    return {
      connected: this.isConnected(),
      url: s.url || '',
      code: s.code || '',
      lastSyncAt: s.lastSyncAt || null,
      lastError: s.lastError || null,
      busy: !!this.running
    };
  }

  /** Simpan sambungan lalu segera sinkronkan sekali sebagai uji coba. */
  async connect({ url, code, pin }) {
    const problems = validateConfig({ url, code, pin });
    if (problems.length) throw new Error(problems.join(' '));

    const clean = { url: String(url).replace(/\/+$/, ''), code: String(code).trim(), pin: String(pin).trim() };
    this.profiles.saveSettings({ sync: { ...clean, lastSyncAt: null, lastError: null } });

    const result = await this.sync({ force: true });
    if (!result.ok) throw new Error(result.error || 'Gagal menyambung ke server.');
    return result;
  }

  disconnect() {
    this.profiles.saveSettings({ sync: null });
    this.#announce();
  }

  onChange(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  #announce() {
    for (const listener of this.listeners) {
      try {
        listener(this.status());
      } catch {
        /* pendengar yang rusak tidak boleh menjatuhkan sinkronisasi */
      }
    }
  }

  #remember(patch) {
    const sync = this.profiles.settings().sync;
    if (!sync) return;
    this.profiles.saveSettings({ sync: { ...sync, ...patch } });
    this.#announce();
  }

  // ------------------------------------------------------------ penyamaan

  /**
   * Jalankan satu putaran penyamaan.
   * Aman dipanggil sesering apa pun: panggilan yang datang saat putaran lain
   * masih berjalan digabungkan menjadi satu putaran susulan.
   *
   * @returns {Promise<{ok:boolean, changed?:boolean, error?:string, skipped?:string}>}
   */
  async sync({ force = false } = {}) {
    if (!this.isConnected()) return { ok: false, skipped: 'not-connected' };
    if (typeof navigator !== 'undefined' && navigator.onLine === false && !force) {
      return { ok: false, skipped: 'offline' };
    }

    if (this.running) {
      this.queued = true;
      return this.running;
    }

    this.running = this.#run().finally(() => {
      this.running = null;
      if (this.queued) {
        this.queued = false;
        this.sync();
      }
    });
    this.#announce();
    return this.running;
  }

  async #run() {
    const config = this.config();
    try {
      let changed = false;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const { rev, state: remoteState } = await this.remote.pull(config);
        const local = this.profiles.rawState();
        const merged = mergeStates(local, remoteState);

        // Hasil gabungan selalu dipakai di perangkat ini, walau server tidak
        // perlu diperbarui — di sinilah progres dari perangkat lain masuk.
        if (!sameState(local, merged)) {
          this.profiles.replaceState(merged);
          changed = true;
        }

        if (remoteState && sameState(remoteState, merged)) break;

        const result = await this.remote.push(config, rev, merged);
        if (!result.conflict) {
          changed = true;
          break;
        }
        // Perangkat lain menang di detik yang sama — ulangi dengan data terbaru.
        if (attempt === MAX_ATTEMPTS) {
          throw new Error('Perangkat lain sedang menyimpan. Coba lagi sebentar.');
        }
      }

      this.#remember({ lastSyncAt: new Date().toISOString(), lastError: null });
      return { ok: true, changed };
    } catch (err) {
      const message = err?.message || 'Sinkronisasi gagal.';
      this.#remember({ lastError: message });
      return { ok: false, error: message };
    }
  }
}
