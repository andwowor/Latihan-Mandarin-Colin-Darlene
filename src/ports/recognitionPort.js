// Port untuk pengenal suara (latihan berbicara).
//
// Implementasi saat ini memakai Web Speech API bawaan peramban. Bila suatu
// saat ingin memakai layanan lain, cukup ganti adapternya di composition root.

export class RecognitionPort {
  /** @returns {boolean} apakah perangkat ini bisa mengenali suara */
  isAvailable() {
    return false;
  }

  /**
   * Dengarkan satu ucapan.
   *
   * @param {{onPartial?: (text: string) => void, timeoutMs?: number}} [opts]
   * @returns {Promise<{transcripts: string[], error: string|null}>}
   *   `transcripts` berisi tebakan terbaik lebih dulu; kosong bila tidak
   *   ada suara yang tertangkap.
   */
  async listen(opts) {
    throw new Error('not implemented');
  }

  /** Hentikan sesi dengar yang sedang berjalan. */
  stop() {}
}
