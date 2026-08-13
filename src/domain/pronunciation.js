// Penilaian latihan berbicara.
//
// Pengenal suara mengembalikan teks Han, bukan nilai kemiripan. Modul ini
// membandingkan apa yang terdengar dengan apa yang seharusnya diucapkan.
// Sepenuhnya fungsi murni sehingga bisa diuji tanpa mikrofon.
//
// Sengaja longgar: anak 5 tahun tidak akan lafalnya sempurna, dan pengenal
// suara pun kerap salah dengar satu karakter. Menolak jawaban yang sudah
// mendekati benar hanya akan membuat anak berhenti mencoba.

/** Buang spasi dan tanda baca (Latin maupun Han) agar bisa dibandingkan. */
export function normalizeHan(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/[，。！？、；：""''（）《》〈〉…—·~,.!?;:'"()<>[\]{}\-–—]/g, '')
    .toLowerCase();
}

/** Jarak sunting (Levenshtein) antara dua deret karakter. */
function editDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,          // hapus
        curr[j - 1] + 1,      // sisip
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // ganti
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Kemiripan 0..1 antara dua teks Han, dihitung per karakter. */
export function similarity(target, heard) {
  const a = [...normalizeHan(target)];
  const b = [...normalizeHan(heard)];
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  return 1 - editDistance(a, b) / Math.max(a.length, b.length);
}

/** Karakter target yang sama sekali tidak muncul pada hasil dengar. */
export function missingChars(target, heard) {
  const got = new Set([...normalizeHan(heard)]);
  return [...new Set([...normalizeHan(target)])].filter((c) => !got.has(c));
}

/**
 * Nilai satu percobaan berbicara.
 *
 * @param {string} target        kalimat/kata yang seharusnya diucapkan
 * @param {string|string[]} heard  hasil pengenal suara (boleh beberapa alternatif)
 * @param {number} threshold     ambang lulus (0..1)
 */
export function gradeSpeech(target, heard, threshold = 0.6) {
  const options = (Array.isArray(heard) ? heard : [heard]).filter(Boolean);
  let best = { score: 0, text: '' };

  for (const option of options) {
    const score = similarity(target, option);
    if (score > best.score) best = { score, text: String(option) };
  }

  return {
    correct: best.score >= threshold,
    score: best.score,
    heard: best.text,
    missing: best.text ? missingChars(target, best.text) : [...normalizeHan(target)],
    empty: options.length === 0
  };
}

/** Bintang 1-3 untuk sebuah percobaan, dipakai pada umpan balik. */
export function speechStars(score) {
  if (score >= 0.95) return 3;
  if (score >= 0.8) return 2;
  if (score >= 0.6) return 1;
  return 0;
}

/** Pujian yang sesuai dengan nilai — bahasa yang dimengerti anak. */
export function speechFeedbackId(score) {
  if (score >= 0.95) return 'Sempurna! Lafalmu tepat sekali.';
  if (score >= 0.8) return 'Bagus sekali! Hampir sempurna.';
  if (score >= 0.6) return 'Sudah benar! Ayo coba lebih jelas lagi.';
  if (score > 0) return 'Hampir! Dengarkan contohnya lalu ulangi.';
  return 'Suaramu belum terdengar. Coba bicara lebih keras ya.';
}
