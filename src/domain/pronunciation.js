// Penilaian latihan berbicara.
//
// Pengenal suara mengembalikan teks Han, bukan nilai kemiripan. Modul ini
// membandingkan apa yang terdengar dengan apa yang seharusnya diucapkan.
// Sepenuhnya fungsi murni sehingga bisa diuji tanpa mikrofon.
//
// Yang dibandingkan adalah BUNYI, bukan hurufnya. Sebabnya: pengenal suara
// menerima suara lalu menebak huruf mana yang dimaksud, dan tebakan itu sering
// meleset ke homofon — anak mengucapkan 是 dengan benar, yang tertulis 事.
// Menghitung per huruf akan menyebut itu salah total, padahal bunyinya sama
// persis. Anak jadi dihukum atas kekeliruan mesin, bukan atas lafalnya sendiri.
//
// Nada juga sengaja diabaikan. Nada yang kita punya adalah nada kamus dari
// huruf yang DITEBAK mesin, bukan nada yang benar-benar diucapkan anak — jadi
// membandingkannya tidak memberi tahu apa pun tentang lafal anak.
//
// Di atas itu, sepasang bunyi yang berdekatan (zh/z, ch/c, sh/s, -ng/-n, r/l)
// hanya dihitung setengah kesalahan. Itu kekeliruan paling lazim pada anak
// kecil sekaligus pada pengenal suara.

// Bunyi yang mudah tertukar, dinormalkan untuk perbandingan "hampir sama".
const NEAR_RULES = [
  [/^zh/, 'z'], [/^ch/, 'c'], [/^sh/, 's'], [/^r/, 'l'],
  [/ng$/, 'n'], [/^n/, 'l']
];

/** Buang spasi dan tanda baca (Latin maupun Han) agar bisa dibandingkan. */
export function normalizeHan(text) {
  return String(text ?? '')
    .replace(/\s+/g, '')
    .replace(/[，。！？、；：""''（）《》〈〉…—·~,.!?;:'"()<>[\]{}\-–—]/g, '')
    .toLowerCase();
}

/**
 * Buang nada dari satu suku kata pinyin: "hǎo" → "hao", "lǜ" → "lv".
 * ü dipertahankan sebagai "v" karena lu dan lü memang bunyi yang berbeda.
 */
export function stripTone(syllable) {
  return String(syllable ?? '')
    .toLowerCase()
    .replace(/[üǖǘǚǜ]/g, 'v')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '');
}

/** Pecah pinyin sebuah kata menjadi suku kata, satu per huruf Han. */
export function splitPinyin(pinyin) {
  const text = String(pinyin ?? '')
    .replace(/[.,!?，。！？、；：]/g, ' ')
    .trim();
  if (!text) return [];

  const out = [];
  for (const block of text.split(/\s+/).filter(Boolean)) {
    // Satu blok bisa memuat beberapa suku kata ("zàijiàn"), dan tiap suku kata
    // punya tepat satu gugus vokal. Itu yang dipakai memenggalnya.
    const parts = block.match(/[^aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]*[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+(?:n(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ])g?|r(?![aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]))?/gi);
    if (parts) out.push(...parts);
  }
  return out;
}

/** Bentuk "hampir sama" dari sebuah bunyi, untuk pasangan yang mudah tertukar. */
export function nearSound(sound) {
  let s = String(sound ?? '');
  for (const [pattern, replacement] of NEAR_RULES) s = s.replace(pattern, replacement);
  return s;
}

/**
 * Rakit satu peta lafal dari kedua lapis readings.json.
 *
 * `sounds` disimpan terbalik (bunyi → deretan huruf) karena jauh lebih padat
 * di berkas — 27 KB, bukan 263 KB. Di sini arahnya dibalik kembali menjadi
 * huruf → daftar bunyi, bentuk yang dipakai penilaian.
 *
 * Lapis kurikulum ditambahkan belakangan dan bersifat menambah, bukan
 * mengganti: lafal yang benar-benar terverifikasi terhadap materi anak tidak
 * boleh hilang, tetapi cara baca lain dari kamus umum tetap berguna karena
 * mesin bisa menebak huruf yang sama untuk bunyi yang berbeda.
 *
 * @param {object} data isi readings.json — { readings, sounds }
 * @returns {object} { [huruf]: [bunyi, ...] }
 */
export function mergeReadingSources(data = {}) {
  const out = {};

  for (const [sound, chars] of Object.entries(data.sounds || {})) {
    for (const ch of String(chars)) {
      (out[ch] ||= []).push(sound);
    }
  }

  for (const [ch, sounds] of Object.entries(data.readings || {})) {
    const list = (out[ch] ||= []);
    for (const s of sounds) if (!list.includes(s)) list.push(s);
  }

  for (const ch of Object.keys(out)) out[ch].sort();
  return out;
}

/**
 * Ubah teks Han menjadi deret bunyi memakai kamus lafal.
 * Huruf yang tidak ada di kamus dibiarkan apa adanya, sehingga perbandingannya
 * jatuh kembali ke perbandingan huruf — tidak ada yang jadi lebih buruk.
 */
export function toSounds(text, readings = {}) {
  return [...normalizeHan(text)].map((ch) => ({ ch, sounds: readings[ch] || null }));
}

/** Biaya mengganti satu bunyi dengan bunyi lain: 0 sama, 0.5 mirip, 1 beda. */
function substitutionCost(a, b) {
  if (a.ch === b.ch) return 0;

  const soundsA = a.sounds;
  const soundsB = b.sounds;
  if (!soundsA || !soundsB) return 1; // salah satu tak dikenal — bandingkan hurufnya saja

  for (const x of soundsA) {
    if (soundsB.includes(x)) return 0; // homofon: bunyinya benar-benar sama
  }
  const nearB = soundsB.map(nearSound);
  for (const x of soundsA) {
    if (nearB.includes(nearSound(x))) return 0.5; // berdekatan, bukan salah penuh
  }
  return 1;
}

/** Jarak sunting berbobot antara dua deret bunyi. */
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
        prev[j - 1] + substitutionCost(a[i - 1], b[j - 1])
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Kemiripan 0..1 antara dua teks Han.
 * @param {object} [readings] kamus huruf → daftar bunyi (readings.json)
 */
export function similarity(target, heard, readings = {}) {
  const a = toSounds(target, readings);
  const b = toSounds(heard, readings);
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  return Math.max(0, 1 - editDistance(a, b) / Math.max(a.length, b.length));
}

/** Karakter target yang bunyinya sama sekali tidak muncul pada hasil dengar. */
export function missingChars(target, heard, readings = {}) {
  const heardSounds = toSounds(heard, readings);
  const seen = new Set();
  for (const item of heardSounds) {
    seen.add(item.ch);
    for (const s of item.sounds || []) seen.add(s);
  }
  const out = [];
  for (const item of toSounds(target, readings)) {
    const cocok = seen.has(item.ch) || (item.sounds || []).some((s) => seen.has(s));
    if (!cocok && !out.includes(item.ch)) out.push(item.ch);
  }
  return out;
}

/**
 * Nilai satu percobaan berbicara.
 *
 * @param {string} target          kalimat/kata yang seharusnya diucapkan
 * @param {string|string[]} heard  hasil pengenal suara (boleh beberapa alternatif)
 * @param {number} threshold       ambang lulus (0..1)
 * @param {object} [readings]      kamus lafal; tanpa ini penilaian jatuh ke per-huruf
 */
export function gradeSpeech(target, heard, threshold = 0.5, readings = {}) {
  const options = (Array.isArray(heard) ? heard : [heard]).filter(Boolean);
  const bersih = normalizeHan(target);
  let best = { score: 0, text: '', exact: false };

  for (const option of options) {
    const score = similarity(target, option, readings);
    const exact = normalizeHan(option) === bersih;

    // Nilai tertinggi yang menang. Bila seri, tebakan yang hurufnya persis
    // sama didahulukan — sejak homofon bernilai penuh, beberapa tebakan bisa
    // sama-sama 1,00 dan yang ditampilkan sebagai "terdengar" sebaiknya yang
    // benar-benar ditulis anak, bukan homofonnya.
    if (score > best.score || (score === best.score && exact && !best.exact)) {
      best = { score, text: String(option), exact };
    }
  }

  return {
    correct: best.score >= threshold,
    score: best.score,
    heard: best.text,
    missing: best.text ? missingChars(target, best.text, readings) : [...normalizeHan(target)],
    empty: options.length === 0
  };
}

/** Bintang 1-3 untuk sebuah percobaan, dipakai pada umpan balik. */
export function speechStars(score) {
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  if (score >= 0.5) return 1;
  return 0;
}

/** Pujian yang sesuai dengan nilai — bahasa yang dimengerti anak. */
export function speechFeedbackId(score) {
  if (score >= 0.9) return 'Sempurna! Lafalmu tepat sekali.';
  if (score >= 0.7) return 'Bagus sekali! Hampir sempurna.';
  if (score >= 0.5) return 'Sudah benar! Ayo coba lebih jelas lagi.';
  if (score > 0) return 'Hampir! Dengarkan contohnya lalu ulangi.';
  return 'Suaramu belum terdengar. Coba bicara lebih keras ya.';
}
