// Port untuk pengenal suara (latihan berbicara).
//
// Implementasi saat ini memakai Web Speech API bawaan peramban. Bila suatu
// saat ingin memakai layanan lain, cukup ganti adapternya di composition root.

export class RecognitionPort {
  /** @returns {boolean} apakah perangkat ini bisa mengenali suara */
  isAvailable() {
    return false;
  }

  /** @returns {boolean} apakah sedang mendengarkan sekarang */
  isListening() {
    return false;
  }

  /**
   * Dengarkan satu ucapan — sampai `finish()` dipanggil, bukan sampai
   * waktunya habis. Anak kecil berhenti di tengah kalimat untuk berpikir;
   * yang menentukan selesai adalah anaknya, bukan penghitung waktu.
   *
   * @param {{onPartial?: (text: string) => void, maxMs?: number}} [opts]
   * @returns {Promise<{transcripts: string[], error: string|null, timedOut?: boolean}>}
   *   `transcripts` berisi tebakan terbaik lebih dulu; kosong bila tidak
   *   ada suara yang tertangkap.
   */
  async listen(opts) {
    throw new Error('not implemented');
  }

  /** Selesai bicara: serahkan apa yang sudah terkumpul untuk dinilai. */
  finish() {}

  /** Batalkan sesi dengar yang sedang berjalan; hasilnya dibuang. */
  stop() {}
}
