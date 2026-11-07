// Sesi belajar: menyusun materi sebuah pelajaran menjadi tumpukan kartu yang
// dibaca anak SEBELUM soal keluar.
//
// Alasannya sederhana: soal yang menanyakan kata yang belum pernah dilihat
// bukan latihan, melainkan tebak-tebakan. Kartu di sini tidak punya nilai dan
// tidak bisa salah — tugasnya hanya memperkenalkan.
//
// Urutan kartu dibuat menanjak:
//   1. pembuka        — apa yang akan dipelajari
//   2. kata           — kosakata asli pelajaran itu
//   3. kalimat        — kalimat kunci yang memakai kata-kata tadi
//   4. bekal HSK      — titipan kata HSK, ditaruh terakhir karena bonus
//   5. penutup        — ringkasan + pintu masuk ke latihan

import { spread } from './reviewLesson.js';

/** Kartu diberi id stabil supaya tampilan bisa dibandingkan antar-render. */
function cardId(kind, key) {
  return `${kind}:${key}`;
}

/** Kalimat kunci pertama yang memakai kata ini — contoh pemakaian yang nyata. */
function exampleFor(word, sentences) {
  return sentences.find((s) => String(s.zh || '').includes(word.zh)) || null;
}

/**
 * Susun tumpukan kartu untuk satu pelajaran.
 *
 * @param {object} lesson              pelajaran dari kurikulum
 * @param {object} [opts]
 * @param {object[]} [opts.bridgeWords] kata bekal HSK yang sudah dibatasi jumlahnya
 * @param {object} [opts.alsoIn]        { [zh]: ['HSK 1'] } penanda lintas jalur
 * @param {string} [opts.levelCode]     mis. 'YCT 1', untuk teks pembuka
 * @param {number} [opts.maxWords]      batasi jumlah kartu kata (0 = tanpa batas)
 * @param {number} [opts.maxSentences]  batasi jumlah kartu kalimat
 * @returns {object[]} kartu siap tampil
 */
export function buildStudyDeck(
  lesson,
  { bridgeWords = [], alsoIn = {}, levelCode = '', maxWords = 0, maxSentences = 0 } = {}
) {
  const semuaKata = lesson?.vocab || [];
  const semuaKalimat = lesson?.keySentences || [];
  if (semuaKata.length === 0 && semuaKalimat.length === 0) return [];

  // Bab ulangan membawa seluruh isi level; yang ditampilkan hanya cuplikan
  // yang tersebar, supaya tiap pelajaran terwakili tanpa seratus kartu.
  const words = spread(semuaKata, maxWords);
  const sentences = spread(semuaKalimat, maxSentences);

  const counts = {
    words: words.length,
    sentences: sentences.length,
    bridge: bridgeWords.length,
    // Berapa yang sebenarnya ada, bila kartunya dicuplik.
    totalWords: semuaKata.length,
    totalSentences: semuaKalimat.length
  };
  const review = isReview(lesson)
    ? { isReview: true, reviewOf: lesson.reviewOf || [], sampled: words.length < semuaKata.length }
    : { isReview: false, reviewOf: [], sampled: false };

  const cards = [
    {
      id: cardId('intro', lesson.number),
      kind: 'intro',
      levelCode,
      lessonNumber: lesson.number,
      titleZh: lesson.titleZh,
      titleId: lesson.titleId,
      titleEn: lesson.titleEn,
      counts,
      ...review,
      speak: null
    }
  ];

  words.forEach((word, i) => {
    cards.push({
      id: cardId('word', word.zh),
      kind: 'word',
      word,
      alsoIn: alsoIn[word.zh] || [],
      example: exampleFor(word, semuaKalimat),
      position: i + 1,
      of: words.length,
      speak: word.zh
    });
  });

  sentences.forEach((sentence, i) => {
    cards.push({
      id: cardId('sentence', sentence.zh),
      kind: 'sentence',
      sentence,
      position: i + 1,
      of: sentences.length,
      speak: sentence.zh
    });
  });

  bridgeWords.forEach((word, i) => {
    cards.push({
      id: cardId('bridge', word.zh),
      kind: 'bridge',
      word,
      fromCode: word.fromCode,
      position: i + 1,
      of: bridgeWords.length,
      speak: word.zh
    });
  });

  cards.push({
    id: cardId('outro', lesson.number),
    kind: 'outro',
    levelCode,
    lessonNumber: lesson.number,
    titleZh: lesson.titleZh,
    titleId: lesson.titleId,
    counts,
    ...review,
    speak: null
  });

  return cards;
}

/** Bab ulangan menurut kurikulum — ditandai di berkas levelnya. */
function isReview(lesson) {
  return !!lesson?.isReview;
}

/**
 * Berapa kata bekal yang boleh dilihat anak ini.
 * Rencana di bridge.json selalu menyiapkan jatah penuh; tiap anak mengambil
 * sebagian awalnya saja — dan bagian awal itu memang yang paling mudah.
 */
export function bridgeShareFor(bridgeVocab = [], limit = 0) {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  return bridgeVocab.slice(0, limit);
}

/** Seluruh kata (asli + bekal) yang diperkenalkan sebuah sesi belajar. */
export function wordsInDeck(cards) {
  return cards.filter((c) => c.kind === 'word' || c.kind === 'bridge').map((c) => c.word);
}
