// Port (kontrak) untuk penyimpanan progres bersama di internet.
//
// Aplikasi tetap bisa jalan penuh tanpa ini — localStorage adalah sumber
// kebenaran di setiap perangkat, dan sinkronisasi hanya menyamakan isinya.
// Karena itu setiap kegagalan di sini harus dianggap "nanti lagi", bukan
// kesalahan yang menghentikan anak berlatih.

/**
 * @typedef {object} SyncConfig
 * @property {string} url   alamat endpoint, mis. https://xxx.workers.dev
 * @property {string} code  kode keluarga
 * @property {string} pin   PIN keluarga
 *
 * @typedef {object} RemoteState
 * @property {string|null} rev        penanda versi di server (untuk cek tabrakan)
 * @property {object|null} state      isi progres, null bila belum pernah diunggah
 * @property {string|null} updatedAt  waktu unggahan terakhir
 */

export class SyncPort {
  /**
   * Ambil salinan terkini dari server.
   * @param {SyncConfig} config
   * @returns {Promise<RemoteState>}
   */
  async pull(config) {
    throw new Error('not implemented');
  }

  /**
   * Kirim salinan gabungan ke server.
   * @param {SyncConfig} config
   * @param {string|null} rev  rev yang baru saja dibaca; server menolak bila sudah basi
   * @param {object} state
   * @returns {Promise<{rev: string, updatedAt: string, conflict?: RemoteState}>}
   */
  async push(config, rev, state) {
    throw new Error('not implemented');
  }
}

/** Kesalahan yang perlu ditampilkan ke orang tua, bukan sekadar dicatat. */
export class SyncError extends Error {
  constructor(message, { status = 0, retryable = true } = {}) {
    super(message);
    this.name = 'SyncError';
    this.status = status;
    this.retryable = retryable;
  }
}
