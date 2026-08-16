// Port (kontrak) untuk sumber konten pelajaran.
// Lapisan application hanya bergantung pada bentuk ini, bukan pada cara
// konten disimpan (JSON statis sekarang, bisa API nanti).

/**
 * @typedef {object} Word
 * @property {string} zh  tulisan Han
 * @property {string} py  pinyin bernada
 * @property {string} en  arti bahasa Inggris
 * @property {string} id  arti bahasa Indonesia
 *
 * @typedef {object} Sentence
 * @property {string} zh
 * @property {string} py
 * @property {string} en
 * @property {string} id
 *
 * @typedef {object} Lesson
 * @property {number} number
 * @property {string} titleZh
 * @property {string} titleEn
 * @property {string} titleId
 * @property {Sentence[]} keySentences
 * @property {Word[]} vocab
 * @property {string[]} listeningScripts  kalimat asli dari "Test Listening Scripts"
 * @property {string[]} bookAnswers       kunci jawaban resmi dari buku (untuk penelusuran)
 * @property {Word[]} [bridgeVocab]       titipan kata HSK (lihat domain/hskBridge.js)
 *
 * @typedef {object} Level
 * @property {string} id
 * @property {string} code
 * @property {number} level
 * @property {Lesson[]} lessons
 * @property {object} [alsoIn]            { [zh]: ['HSK 1'] } — kata yang juga ada di jalur lain
 */

export class ContentPort {
  /** @returns {Promise<object[]>} daftar level beserta statusnya */
  async listLevels() {
    throw new Error('not implemented');
  }

  /** @param {string} levelId @returns {Promise<Level>} */
  async loadLevel(levelId) {
    throw new Error('not implemented');
  }

  /**
   * Rencana jembatan HSK, bila sumber kontennya punya.
   * Mengembalikan `null` berarti aplikasi berjalan tanpa kata bekal —
   * bukan kesalahan, hanya kehilangan satu fitur.
   *
   * @returns {Promise<object|null>}
   */
  async loadBridge() {
    return null;
  }

  /**
   * Kamus lafal (huruf Han → daftar bunyi tanpa nada), untuk menilai ucapan.
   * `null` berarti penilaian jatuh kembali ke perbandingan per huruf.
   *
   * @returns {Promise<object|null>}
   */
  async loadReadings() {
    return null;
  }
}
