// Pelajaran ulangan (复习) di penghujung tiap level.
//
// Buku YCT menutup setiap level dengan bab 复习. Bab itu tidak memperkenalkan
// kata baru — isinya mengulang seluruh pelajaran sebelumnya. Karena itu hasil
// impornya nyaris kosong: YCT 3, 4, 5, dan 6 nol kata nol kalimat, YCT 1 dan 2
// hanya dua kata dua kalimat.
//
// Peta pelajaran menilai sebuah pelajaran bisa dibuka dari jumlah kata dan
// kalimatnya, jadi bab ulangan YCT 3 ke atas SELALU terkunci — berapa pun
// pelajaran yang sudah dituntaskan anak (lihat ADR-0015).
//
// Modul ini mengisi bab ulangan dari pelajaran-pelajaran sebelum dia di level
// yang sama. Bukan menambal gejala: itu memang isi bab 复习 menurut bukunya.
// Apa yang sudah ada di bab itu tetap dipertahankan dan ditaruh paling depan.

/** Bab ulangan menurut kurikulum. */
export function isReviewLesson(lesson) {
  return !!lesson?.isReview;
}

/**
 * Ambil `limit` butir yang tersebar merata sepanjang daftar.
 *
 * Dipakai menyusun sesi belajar bab ulangan: tumpukan 79 kartu terlalu panjang
 * untuk anak 7 tahun, sedangkan mengambil 10 yang pertama berarti pelajaran
 * terakhir tidak pernah ikut terulang. Mengambil secara tersebar membuat
 * seluruh level terwakili. Tanpa acak, supaya hasilnya sama tiap kali dibuka.
 */
export function spread(list = [], limit = 0) {
  const items = list || [];
  if (!Number.isFinite(limit) || limit <= 0 || items.length <= limit) return [...items];

  const out = [];
  const step = items.length / limit;
  for (let i = 0; i < limit; i++) out.push(items[Math.floor(i * step)]);
  return out;
}

/** Gabung dua daftar tanpa kembar, menurut kunci yang dipilih. */
function merge(own = [], extra = [], key = (x) => x?.zh) {
  const out = [];
  const seen = new Set();
  for (const item of [...own, ...extra]) {
    const k = key(item);
    if (k == null || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/**
 * Isi setiap bab ulangan sebuah level dari pelajaran-pelajaran sebelumnya.
 *
 * Yang dikumpulkan bersifat menumpuk dari awal level: bab ulangan di akhir
 * mengulang semuanya, dan bab ulangan di tengah (bila suatu saat ada)
 * mengulang semua yang sudah lewat. Keduanya memang arti 复习.
 *
 * Aman dipanggil dua kali: hasilnya sama persis.
 *
 * @param {object} level level dari kurikulum (boleh sudah lewat applyBridge)
 * @returns {object} level dengan bab ulangannya terisi
 */
export function applyReview(level) {
  const lessons = level?.lessons || [];
  if (!lessons.some(isReviewLesson)) return level;

  const vocab = [];
  const sentences = [];
  const scripts = [];
  const bridge = [];
  const sebelumnya = [];

  const out = lessons.map((lesson) => {
    if (!isReviewLesson(lesson)) {
      vocab.push(...(lesson.vocab || []));
      sentences.push(...(lesson.keySentences || []));
      scripts.push(...(lesson.listeningScripts || []));
      bridge.push(...(lesson.bridgeVocab || []));
      sebelumnya.push(lesson.number);
      return lesson;
    }

    return {
      ...lesson,
      // Nomor pelajaran yang diulang — dipakai tampilan untuk menjelaskan
      // kepada anak bahwa ini rangkuman, bukan materi baru.
      reviewOf: [...sebelumnya],
      vocab: merge(lesson.vocab, vocab),
      keySentences: merge(lesson.keySentences, sentences),
      listeningScripts: merge(lesson.listeningScripts, scripts, (s) => s?.zh ?? s?.text ?? s),
      bridgeVocab: merge(lesson.bridgeVocab, bridge)
    };
  });

  return { ...level, lessons: out };
}
