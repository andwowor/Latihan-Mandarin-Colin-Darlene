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
 *
 * @typedef {object} Level
 * @property {string} id
 * @property {string} code
 * @property {number} level
 * @property {Lesson[]} lessons
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
}
