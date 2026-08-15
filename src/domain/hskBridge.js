// Jembatan HSK → YCT.
//
// Anak-anak berlatih di jalur YCT lebih dulu, padahal nanti ujian resminya
// HSK. Supaya tidak kaget saat pindah jalur, setiap pelajaran YCT dititipi
// beberapa kata HSK sebagai "bekal". Dua hal yang dihasilkan modul ini:
//
//   1. `alsoIn`  — kata YCT yang ternyata juga ada di daftar HSK (dan
//                  sebaliknya). Kata seperti ini TIDAK perlu dititipkan lagi,
//                  cukup ditandai supaya anak tahu bekalnya sudah terpakai.
//   2. `lessons` — kata HSK yang belum pernah muncul di YCT sampai level itu,
//                  dibagi rata ke tiap pelajaran, dari yang paling mudah.
//
// Seluruh fungsi di sini murni. Rencananya dibekukan menjadi
// `public/data/curriculum/bridge.json` oleh `tools/build-bridge.mjs`, supaya
// aplikasi tidak perlu memuat seluruh berkas HSK hanya untuk membuka satu
// pelajaran YCT.

/**
 * Level HSK mana yang jadi sumber bekal untuk tiap level YCT.
 *
 * Pasangannya mengikuti tumpang tindih kosakata yang sebenarnya ada di kedua
 * buku: HSK 1 paling banyak beririsan dengan YCT 1-2, HSK 2 dengan YCT 3-4,
 * dan HSK 3 dengan YCT 5-6. Sisa kata yang belum sempat dititipkan di level
 * bawah otomatis mengalir ke level berikutnya, karena kata yang sudah pernah
 * diperkenalkan tidak akan dipilih dua kali.
 */
export const BRIDGE_SOURCES = {
  yct1: ['hsk1'],
  yct2: ['hsk1'],
  yct3: ['hsk1', 'hsk2'],
  yct4: ['hsk2'],
  yct5: ['hsk2', 'hsk3'],
  yct6: ['hsk3']
};

/** Semua kosakata sebuah level, digabung dari seluruh pelajarannya. */
export function vocabOf(level) {
  return (level.lessons || []).flatMap((l) => l.vocab || []);
}

function addChars(set, text) {
  for (const ch of String(text || '')) set.add(ch);
}

/** Bandingkan dua larik nilai secara berurutan (leksikografis). */
function compareTuples(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Peringkat kesulitan sebuah kata bagi anak yang sudah mengenal `familiar`.
 *
 * Urutan pertimbangan, dari yang paling menentukan:
 *   1. berapa huruf Han di dalamnya yang benar-benar baru
 *   2. level HSK asalnya
 *   3. panjang kata (kata satu huruf lebih ringan diingat)
 *   4. nomor pelajaran di buku HSK — urutan bawaan penyusun buku
 *   5. tulisannya sendiri, sekadar agar hasilnya tidak berubah-ubah
 */
export function difficultyRank(word, familiar = new Set()) {
  const chars = [...word.zh];
  const unknown = chars.filter((c) => !familiar.has(c)).length;
  return [unknown, word.fromLevel || 0, chars.length, word.fromLesson || 0, word.zh];
}

/**
 * Kata yang muncul di lebih dari satu jalur.
 *
 * Hanya lintas jalur yang dicatat (YCT ↔ HSK); pengulangan antar-level dalam
 * satu jalur adalah hal biasa dan tidak menarik untuk ditandai.
 *
 * @returns {object} { [levelId]: { [zh]: ['HSK 1', ...] } }
 */
export function crossReference(levels) {
  const owners = new Map(); // zh -> Map(track -> Set(code))
  for (const level of levels) {
    for (const word of vocabOf(level)) {
      if (!owners.has(word.zh)) owners.set(word.zh, new Map());
      const byTrack = owners.get(word.zh);
      if (!byTrack.has(level.track)) byTrack.set(level.track, new Set());
      byTrack.get(level.track).add(level.code);
    }
  }

  const out = {};
  for (const level of levels) {
    const map = {};
    for (const word of vocabOf(level)) {
      const byTrack = owners.get(word.zh);
      const codes = [];
      for (const [track, set] of byTrack) {
        if (track === level.track) continue;
        codes.push(...set);
      }
      if (codes.length) map[word.zh] = [...new Set(codes)].sort();
    }
    out[level.id] = map;
  }
  return out;
}

/** Ambil `n` kata termudah dari `pool` (kata terpilih dikeluarkan dari pool). */
function takeEasiest(pool, n, familiar) {
  if (n <= 0 || pool.length === 0) return [];
  const ranked = pool
    .map((word, i) => ({ word, i, rank: difficultyRank(word, familiar) }))
    .sort((a, b) => compareTuples(a.rank, b.rank) || a.i - b.i);

  const picked = ranked.slice(0, n).map((x) => x.word);
  const chosen = new Set(picked);
  for (let i = pool.length - 1; i >= 0; i--) {
    if (chosen.has(pool[i])) pool.splice(i, 1);
  }
  return picked;
}

/**
 * Susun rencana penyisipan untuk seluruh jalur YCT sekaligus.
 *
 * Dikerjakan sekaligus (bukan per level) karena "kata ini sudah pernah
 * diperkenalkan atau belum" hanya bisa dijawab bila urutan levelnya diketahui.
 *
 * @param {object} args
 * @param {object[]} args.levels    seluruh level (YCT & HSK) sesuai urutan index.json
 * @param {object} [args.sources]   peta level YCT → level HSK sumbernya
 * @param {number} [args.perLesson] jumlah kata titipan maksimum per pelajaran
 * @returns {object} { levels: { [levelId]: { alsoIn, lessons } }, stats }
 */
export function planBridge({ levels, sources = BRIDGE_SOURCES, perLesson = 3 }) {
  const byId = new Map(levels.map((l) => [l.id, l]));
  const alsoIn = crossReference(levels);

  const out = {};
  for (const level of levels) {
    out[level.id] = { alsoIn: alsoIn[level.id] || {}, lessons: {} };
  }

  // Kata yang sudah pernah dilihat anak, dan huruf Han yang sudah dikenalnya.
  // Keduanya tumbuh sambil menyusuri pelajaran satu per satu.
  const introduced = new Set();
  const familiar = new Set();
  const stats = { assigned: 0, leftover: {} };

  const targets = levels.filter((l) => sources[l.id]);
  for (const level of targets) {
    // Kata asli level ini tidak perlu dititipkan — akan dipelajari sendiri.
    const own = new Set(vocabOf(level).map((w) => w.zh));

    const pool = [];
    const seen = new Set();
    for (const sourceId of sources[level.id]) {
      const source = byId.get(sourceId);
      if (!source) continue;
      for (const lesson of source.lessons || []) {
        for (const word of lesson.vocab || []) {
          if (own.has(word.zh) || introduced.has(word.zh) || seen.has(word.zh)) continue;
          seen.add(word.zh);
          pool.push({
            zh: word.zh,
            py: word.py,
            en: word.en,
            id: word.id,
            from: source.id,
            fromCode: source.code,
            fromLevel: source.level,
            fromLesson: lesson.number
          });
        }
      }
    }

    for (const lesson of level.lessons || []) {
      const ownWords = lesson.vocab || [];
      // Kata pelajaran ini dianggap dipelajari lebih dulu, baru titipannya
      // dipilih — supaya huruf yang baru saja dikenal ikut memudahkan.
      for (const word of ownWords) {
        introduced.add(word.zh);
        addChars(familiar, word.zh);
      }
      // Pelajaran ulangan tidak membawa kata baru; jangan dibebani titipan.
      if (ownWords.length === 0) continue;

      const picks = takeEasiest(pool, perLesson, familiar);
      for (const word of picks) {
        introduced.add(word.zh);
        addChars(familiar, word.zh);
      }
      if (picks.length) {
        out[level.id].lessons[lesson.number] = picks;
        stats.assigned += picks.length;
      }
    }

    if (pool.length) stats.leftover[level.id] = pool.length;
  }

  return { levels: out, stats };
}

/**
 * Tempelkan rencana ke sebuah level supaya siap dipakai aplikasi.
 * Mengembalikan salinan; data aslinya tidak disentuh.
 */
export function applyBridge(level, bridge) {
  const plan = bridge?.levels?.[level.id];
  if (!plan) return level;

  const alsoIn = plan.alsoIn || {};
  return {
    ...level,
    alsoIn,
    lessons: (level.lessons || []).map((lesson) => ({
      ...lesson,
      bridgeVocab: plan.lessons?.[lesson.number] || plan.lessons?.[String(lesson.number)] || []
    }))
  };
}
