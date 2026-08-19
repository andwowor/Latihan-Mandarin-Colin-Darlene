// Memilih suara text-to-speech yang NADANYA paling terdengar jelas.
//
// Keluhan dari rumah: "nada pronunciation-nya tidak terlalu terdengar jelas
// sehingga anak susah menirunya." Sebabnya bukan pada penilaian, melainkan
// pada suara yang dipakai membacakan contoh.
//
// Pemilihan lama mengambil suara Mandarin PERTAMA yang ditemukan perangkat.
// Urutan itu tidak ada hubungannya dengan mutu: di banyak perangkat yang
// pertama justru suara "compact" bawaan — suara formant hemat memori yang
// meratakan lengkung nada, sehingga mā/má/mǎ/mà terdengar nyaris sama.
// Perangkat yang sama sering juga punya suara neural yang nadanya tegas,
// hanya saja letaknya di belakang.
//
// Modul ini memberi nilai pada setiap suara supaya yang terbaik yang dipakai,
// dan supaya orang tua bisa melihat pilihan yang ada. Sepenuhnya fungsi murni:
// masukannya cukup objek biasa {name, lang, voiceURI, localService, default},
// jadi bisa diuji tanpa browser.

/** Kata kunci pada nama/URI suara yang menandakan mesin suara modern. */
const NEURAL = /natural|neural|online|premium|enhanced|wavenet|studio|siri|eloquent/i;

/** Suara ringkas/robotik yang lengkung nadanya paling datar. */
const COMPACT = /espeak|compact|pico|flite|robot/i;

/**
 * Suara Mandarin yang sudah dikenal, dengan nilai tambahan.
 * Yang tidak terdaftar tidak dihukum — hanya tidak mendapat tambahan.
 */
const KNOWN = [
  // Microsoft neural (Edge/Windows) — paling tegas nadanya.
  { match: /xiaoxiao|xiaoyi|xiaochen|xiaohan|xiaomo|yunxi|yunyang|yunjian/i, bonus: 22 },
  // Siri Mandarin (iOS/macOS versi baru).
  { match: /li-?mu|yu-?shu|tian-?tian/i, bonus: 18 },
  // Google Mandarin (Chrome/Android) — suara jaringan.
  { match: /google.*(zh|chinese|mandarin|普通话|國語|国语)/i, bonus: 16 },
  // Apple Tingting/Meijia — bukan neural, tetapi nadanya masih jelas.
  { match: /ting-?ting|婷婷|mei-?jia|美佳/i, bonus: 8 },
  // Microsoft generasi lama — bisa dipakai, nadanya sudah agak datar.
  { match: /huihui|kangkang|yaoyao|hanhan|zhiwei/i, bonus: 2 }
];

/** Bahasa suara dalam bentuk baku: "zh_CN" dan "zh-cn" sama-sama jadi "zh-CN". */
export function normalizeLang(lang) {
  const [base, region] = String(lang ?? '').replace('_', '-').split('-');
  return region ? `${base.toLowerCase()}-${region.toUpperCase()}` : base.toLowerCase();
}

/**
 * Apakah suara ini membacakan Mandarin?
 *
 * zh-HK dan yue adalah bahasa Kanton — nada dan lafalnya berbeda sama sekali,
 * jadi tidak pernah dipakai untuk melatih Mandarin.
 */
export function isMandarin(voice) {
  const lang = normalizeLang(voice?.lang);
  if (!lang.startsWith('zh') && !lang.startsWith('cmn')) return false;
  return !/^(zh-HK|yue)/i.test(lang) && !/cantonese|廣東|粤/i.test(voice?.name || '');
}

/** Nilai untuk logat: daratan lebih dulu, karena itu yang dipakai buku YCT/HSK. */
function localeScore(lang) {
  const l = normalizeLang(lang);
  if (l === 'zh-CN' || l === 'zh' || l.startsWith('cmn')) return 40;
  if (l === 'zh-SG') return 30;
  if (l === 'zh-TW') return 25;
  return 15;
}

/**
 * Nilai satu suara. Semakin tinggi, semakin jelas lengkung nadanya.
 *
 * @param {{name?: string, lang?: string, voiceURI?: string, localService?: boolean, default?: boolean}} voice
 * @returns {{score: number, note: string, neural: boolean}}
 */
export function scoreVoice(voice = {}) {
  const teks = `${voice.name || ''} ${voice.voiceURI || ''}`;
  let score = localeScore(voice.lang);
  let note = '';
  let neural = false;

  if (COMPACT.test(teks)) {
    score -= 30;
    note = 'suara ringkas — nada cenderung datar';
  } else if (NEURAL.test(teks)) {
    score += 30;
    neural = true;
    note = 'suara neural — nada paling jelas';
  }

  for (const k of KNOWN) {
    if (k.match.test(teks)) {
      score += k.bonus;
      break;
    }
  }

  // Suara jaringan hampir selalu model neural; suara lokal belum tentu.
  if (voice.localService === false) {
    score += 15;
    if (!note) {
      neural = true;
      note = 'suara jaringan — nadanya lebih jelas, perlu internet';
    }
  }

  if (voice.default) score += 1;   // pemecah seri saja

  if (!note) note = 'suara bawaan perangkat';
  return { score, note, neural };
}

/** Tanda pengenal suara yang tetap sama antar sesi. */
export function voiceId(voice = {}) {
  return String(voice.voiceURI || voice.name || '');
}

/**
 * Urutkan suara Mandarin dari yang paling jelas nadanya.
 * Suara non-Mandarin (termasuk Kanton) dibuang.
 *
 * @param {Array} voices daftar dari speechSynthesis.getVoices()
 * @returns {Array<{voice: object, id: string, score: number, note: string, neural: boolean}>}
 */
export function rankVoices(voices = []) {
  return (voices || [])
    .filter(isMandarin)
    .map((voice) => ({ voice, id: voiceId(voice), ...scoreVoice(voice) }))
    .sort((a, b) => b.score - a.score || String(a.voice.name).localeCompare(String(b.voice.name)));
}

/**
 * Suara yang dipakai: pilihan orang tua bila masih ada di perangkat ini,
 * kalau tidak yang bernilai tertinggi.
 *
 * Pilihan yang sudah hilang (mis. berganti perangkat) sengaja tidak
 * menggagalkan apa pun — cukup jatuh kembali ke pilihan otomatis.
 */
export function pickVoice(voices = [], preferredId = '') {
  const ranked = rankVoices(voices);
  if (preferredId) {
    const cocok = ranked.find((r) => r.id === preferredId);
    if (cocok) return cocok.voice;
  }
  return ranked[0]?.voice || null;
}

/**
 * Pecah teks menjadi potongan seukuran suku kata, untuk mode pelan.
 *
 * Alasannya: memperlambat `rate` meregangkan satu suku kata sampai lengkung
 * nadanya melar dan justru makin sulit dikenali. Membacakan per suku kata
 * dengan jeda memberi nada kutipan yang bersih — persis cara guru mengulang
 * satu-satu supaya bisa ditirukan.
 *
 * Huruf Han dipecah satu-satu (satu huruf = satu suku kata). Angka dan huruf
 * Latin dibiarkan menyatu supaya "2" tidak terpotong-potong. Tanda baca
 * dibuang: ia tidak berbunyi, tetapi bisa membuat mesin suara diam.
 */
export function toneChunks(text) {
  const out = [];
  let latin = '';
  for (const ch of String(text ?? '')) {
    if (/\p{Script=Han}/u.test(ch)) {
      if (latin.trim()) out.push(latin.trim());
      latin = '';
      out.push(ch);
    } else if (/[\p{L}\p{N}]/u.test(ch)) {
      latin += ch;
    } else {
      if (latin.trim()) out.push(latin.trim());
      latin = '';
    }
  }
  if (latin.trim()) out.push(latin.trim());
  return out;
}
