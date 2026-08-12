// Port untuk pemutar audio latihan listening.
// Implementasi bisa: Web Speech (text-to-speech) atau file audio MP3 asli
// dari penerbit bila suatu saat tersedia.

export class SpeechPort {
  /** @returns {boolean} apakah audio siap dipakai di perangkat ini */
  isAvailable() {
    return false;
  }

  /**
   * @param {string} text teks Mandarin yang dibacakan
   * @param {{slow?: boolean}} [opts]
   * @returns {Promise<void>}
   */
  async speak(text, opts) {
    throw new Error('not implemented');
  }

  cancel() {}
}
