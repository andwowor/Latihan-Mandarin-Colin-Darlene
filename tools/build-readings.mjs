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
// Kamusnya punya dua lapis:
//
//   `readings` — dari kurikulum sendiri, satu-satunya sumber yang benar-benar
//                terverifikasi terhadap materi yang dipelajari anak.
//   `sounds`   — lafal seluruh huruf Han (20.856 huruf, 27 KB) supaya tebakan
//                mesin yang jatuh DI LUAR kurikulum tetap bisa dikenali sebagai
//                homofon. Tanpa lapis ini, separuh kekeliruan mesin lolos dari
//                pengenalan (lihat ADR-0011).
//
// Lapis kedua dibangkitkan memakai `pinyin-pro`, dan HANYA saat membangun —
// aplikasinya sendiri tetap tanpa dependensi. Bila paketnya tidak terpasang,
// lapis itu dipertahankan dari berkas yang sudah ada dan generator tetap
// berjalan:
//
//   npm install pinyin-pro     # sekali saja, seperti esbuild
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

/**
 * Lafal seluruh huruf Han, disimpan terbalik (bunyi → deretan huruf).
 *
 * Arah terbalik dipilih karena jauh lebih padat: 27 KB, dibanding 263 KB bila
 * disimpan huruf → bunyi. Peta majunya dirakit kembali saat dimuat.
 *
 * @returns {object|null} null bila `pinyin-pro` tidak terpasang
 */
export async function buildSounds() {
  let pinyin;
  try {
    ({ pinyin } = await import('pinyin-pro'));
  } catch {
    return null;
  }

  const rev = new Map();
  for (let cp = 0x4e00; cp <= 0x9fff; cp++) {
    const ch = String.fromCodePoint(cp);
    let list;
    try {
      list = pinyin(ch, { toneType: 'none', type: 'array', multiple: true });
    } catch {
      continue;
    }
    if (!list?.length) continue;

    const sounds = [...new Set(list.map((s) => stripTone(s)).filter(Boolean))];
    // pinyin-pro mengembalikan hurufnya sendiri bila tidak tahu lafalnya.
    if (!sounds.length || sounds.includes(ch)) continue;
    for (const s of sounds) {
      if (!rev.has(s)) rev.set(s, []);
      rev.get(s).push(ch);
    }
  }

  const out = {};
  for (const s of [...rev.keys()].sort()) out[s] = rev.get(s).join('');
  return out;
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
  return { schemaVersion: 2, note: 'Dihasilkan oleh tools/build-readings.mjs — jangan disunting tangan.', stats, readings };
}

export function serialise(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outFile = path.join(dir, 'readings.json');
  const data = buildReadings(readVocab());

  const sounds = await buildSounds();
  if (sounds) {
    data.sounds = sounds;
  } else {
    // Tanpa pinyin-pro, lapis umum dipertahankan apa adanya — jangan sampai
    // menjalankan generator justru menghapus data yang sudah ada.
    const lama = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
    data.sounds = lama.sounds || {};
    console.warn('⚠️  pinyin-pro tidak terpasang — lapis lafal umum dipertahankan apa adanya.');
    console.warn('    Pasang dengan: npm install pinyin-pro');
  }

  fs.writeFileSync(outFile, serialise(data));

  const jumlah = Object.keys(data.readings).length;
  const umum = new Set(Object.values(data.sounds).flatMap((chars) => [...chars])).size;
  console.log(
    `✅ ${path.relative(root, outFile)} — ${jumlah} huruf dari kurikulum ` +
    `+ ${umum} huruf lafal umum (${Object.keys(data.sounds).length} bunyi berbeda)`
  );
}
