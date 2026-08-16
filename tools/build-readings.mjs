// Membekukan kamus lafal menjadi public/data/curriculum/readings.json.
//
// Isinya: setiap huruf Han → daftar cara bacanya tanpa nada (mis. 是 → ["shi"]).
// Dipakai penilaian latihan berbicara agar homofon tidak dianggap salah:
// anak mengucapkan 是 dengan benar, pengenal suara menulis 事 — bunyinya sama
// persis, jadi seharusnya lulus.
//
// Kamusnya diturunkan dari kurikulum itu sendiri, bukan dari daftar luar.
// Caranya: untuk kata yang jumlah suku kata pinyin-nya sama dengan jumlah
// hurufnya, keduanya dipasangkan satu-satu. 97% kosakata memenuhi syarat itu.
//
// Jalankan ulang setiap kali kurikulum berubah:
//
//   npm run readings

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stripTone, splitPinyin } from '../src/domain/pronunciation.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public/data/curriculum');

/** Semua kosakata dari seluruh level yang sudah siap. */
export function readVocab(curriculumDir = dir) {
  const index = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'index.json'), 'utf8'));
  const words = [];
  for (const meta of index.levels) {
    const file = path.join(curriculumDir, meta.file);
    if (meta.status !== 'ready' || !fs.existsSync(file)) continue;
    const level = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const lesson of level.lessons || []) {
      for (const word of lesson.vocab || []) words.push(word);
    }
    // Kalimat kunci ikut dipakai: banyak huruf hanya muncul di sana.
    for (const lesson of level.lessons || []) {
      for (const s of lesson.keySentences || []) words.push({ zh: s.zh, py: s.py });
    }
  }
  return words;
}

/** Bentuk akhir readings.json — dipakai juga oleh tes kesegaran. */
export function buildReadings(words) {
  const map = new Map();
  const stats = { dipakai: 0, dilewati: 0 };

  for (const word of words) {
    const chars = [...String(word.zh || '')].filter((c) => /\p{Script=Han}/u.test(c));
    const syllables = splitPinyin(word.py);

    // Hanya dipasangkan bila jumlahnya benar-benar cocok. Menebak-nebak
    // pasangan yang tidak selaras justru menanam lafal yang salah.
    if (chars.length === 0 || chars.length !== syllables.length) {
      stats.dilewati++;
      continue;
    }
    stats.dipakai++;

    chars.forEach((ch, i) => {
      const sound = stripTone(syllables[i]);
      if (!sound) return;
      if (!map.has(ch)) map.set(ch, new Set());
      map.get(ch).add(sound);
    });
  }

  const readings = {};
  for (const ch of [...map.keys()].sort()) {
    readings[ch] = [...map.get(ch)].sort();
  }
  return { schemaVersion: 1, note: 'Dihasilkan oleh tools/build-readings.mjs — jangan disunting tangan.', stats, readings };
}

export function serialise(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = buildReadings(readVocab());
  const outFile = path.join(dir, 'readings.json');
  fs.writeFileSync(outFile, serialise(data));

  const jumlah = Object.keys(data.readings).length;
  const banyakBaca = Object.values(data.readings).filter((r) => r.length > 1).length;
  console.log(
    `✅ ${path.relative(root, outFile)} — ${jumlah} huruf Han, ` +
    `${banyakBaca} di antaranya punya lebih dari satu cara baca ` +
    `(${data.stats.dipakai} kata dipakai, ${data.stats.dilewati} dilewati)`
  );
}
