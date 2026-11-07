// Uji bab ulangan (复习) di penghujung tiap level.
//
// Keluhan dari rumah: "Kenapa pada YCT 3 bagian terakhir pada peta pelajaran
// yakni Ulangan tidak bisa terbuka padahal semua pelajaran pada YCT 3 sudah
// selesai?"
//
// Sebabnya: hasil impor bab 复习 kosong (nol kata, nol kalimat), sedangkan
// peta pelajaran menilai sebuah pelajaran bisa dibuka dari jumlah kata dan
// kalimatnya. Tes di sini menjaga agar bab ulangan selalu terisi dari
// pelajaran-pelajaran sebelumnya, dan agar isiannya tidak merusak hal lain.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyReview, isReviewLesson, spread } from '../src/domain/reviewLesson.js';
import { buildStudyDeck } from '../src/domain/studyDeck.js';
import { CurriculumService } from '../src/application/curriculumService.js';
import { appConfig } from '../src/config/appConfig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const level = (id) =>
  JSON.parse(fs.readFileSync(path.join(root, `public/data/curriculum/${id}.json`), 'utf8'));

/** Aturan yang dipakai peta pelajaran untuk memutuskan sebuah node bisa diketuk. */
const bisaDibuka = (lesson) =>
  (lesson.vocab || []).length > 0 || (lesson.keySentences || []).length > 0;

// ------------------------------------------------------------ inti keluhannya

test('bab ulangan YCT 3 bisa dibuka setelah diisi', () => {
  const mentah = level('yct3');
  const sebelum = mentah.lessons.at(-1);
  assert.equal(isReviewLesson(sebelum), true);
  assert.equal(bisaDibuka(sebelum), false, 'inilah sebab node-nya selalu terkunci');

  const sesudah = applyReview(mentah).lessons.at(-1);
  assert.equal(bisaDibuka(sesudah), true);
  assert.ok(sesudah.vocab.length > 50, `hanya ${sesudah.vocab.length} kata`);
  assert.ok(sesudah.keySentences.length > 15);
});

test('setiap level punya bab ulangan yang bisa dibuka', () => {
  for (const id of ['yct1', 'yct2', 'yct3', 'yct4', 'yct5', 'yct6']) {
    const lessons = applyReview(level(id)).lessons.filter(isReviewLesson);
    assert.equal(lessons.length, 1, `${id} seharusnya punya satu bab ulangan`);
    assert.equal(bisaDibuka(lessons[0]), true, `bab ulangan ${id} masih terkunci`);
  }
});

test('isinya persis kumpulan pelajaran sebelumnya, tanpa kembar', () => {
  const lessons = applyReview(level('yct3')).lessons;
  const ulangan = lessons.at(-1);
  const diharapkan = new Set(
    lessons.filter((l) => !isReviewLesson(l)).flatMap((l) => (l.vocab || []).map((w) => w.zh))
  );

  assert.deepEqual(new Set(ulangan.vocab.map((w) => w.zh)), diharapkan);
  assert.equal(ulangan.vocab.length, diharapkan.size, 'tidak boleh ada kata kembar');
  assert.deepEqual(ulangan.reviewOf, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test('kata yang sudah ada di bab ulangan tetap dipertahankan dan ditaruh depan', () => {
  // YCT 1 dan 2 memang membawa dua kata sendiri di bab ulangannya.
  const mentah = level('yct1');
  const milikSendiri = (mentah.lessons.at(-1).vocab || []).map((w) => w.zh);
  assert.ok(milikSendiri.length > 0, 'prasyarat tes: YCT 1 punya kata di bab ulangannya');

  const ulangan = applyReview(mentah).lessons.at(-1);
  assert.deepEqual(ulangan.vocab.slice(0, milikSendiri.length).map((w) => w.zh), milikSendiri);
  assert.ok(ulangan.vocab.length > milikSendiri.length, 'sisanya ikut ditambahkan');
});

test('pelajaran biasa tidak tersentuh sama sekali', () => {
  const mentah = level('yct3');
  const sesudah = applyReview(mentah);
  for (const [i, lesson] of sesudah.lessons.entries()) {
    if (isReviewLesson(lesson)) continue;
    assert.deepEqual(lesson, mentah.lessons[i], `pelajaran ${lesson.number} berubah`);
  }
});

test('dipanggil dua kali hasilnya sama', () => {
  const sekali = applyReview(level('yct3'));
  assert.deepEqual(applyReview(sekali), sekali);
});

test('level tanpa bab ulangan dikembalikan apa adanya', () => {
  const hsk = level('hsk1');
  assert.equal(applyReview(hsk), hsk, 'objek yang sama, bukan salinan');
  assert.deepEqual(applyReview({ lessons: [] }), { lessons: [] });
  assert.deepEqual(applyReview({}), {});
});

// --------------------------------------------------------- cuplikan merata

test('cuplikan tersebar sepanjang daftar, bukan sepuluh yang pertama', () => {
  const angka = Array.from({ length: 100 }, (_, i) => i);
  const ambil = spread(angka, 5);
  assert.equal(ambil.length, 5);
  assert.equal(ambil[0], 0);
  assert.ok(ambil.at(-1) > 70, `butir terakhir ${ambil.at(-1)} — ekor daftar tidak terwakili`);
  assert.deepEqual(ambil, [...ambil].sort((a, b) => a - b), 'urutannya tetap');
});

test('daftar yang sudah pendek tidak dipotong', () => {
  assert.deepEqual(spread([1, 2, 3], 10), [1, 2, 3]);
  assert.deepEqual(spread([1, 2, 3], 0), [1, 2, 3], '0 berarti tanpa batas');
  assert.deepEqual(spread([], 5), []);
});

// ------------------------------------------------------------ sesi belajar

test('sesi belajar bab ulangan dicuplik, tidak seratus kartu', () => {
  const ulangan = applyReview(level('yct3')).lessons.at(-1);
  const penuh = buildStudyDeck(ulangan, { levelCode: 'YCT 3' });
  const dicuplik = buildStudyDeck(ulangan, {
    levelCode: 'YCT 3',
    maxWords: appConfig.study.reviewWords,
    maxSentences: appConfig.study.reviewSentences
  });

  assert.ok(penuh.length > 90, 'prasyarat tes: tanpa batas memang sangat panjang');
  assert.ok(dicuplik.length < 25, `${dicuplik.length} kartu — masih terlalu panjang untuk anak`);
  assert.equal(dicuplik.filter((c) => c.kind === 'word').length, appConfig.study.reviewWords);
  assert.equal(dicuplik.filter((c) => c.kind === 'sentence').length, appConfig.study.reviewSentences);
});

test('kartu pembuka bab ulangan jujur: ini rangkuman, dan berapa sebenarnya', () => {
  const ulangan = applyReview(level('yct3')).lessons.at(-1);
  const intro = buildStudyDeck(ulangan, { maxWords: 10, maxSentences: 5 })[0];

  assert.equal(intro.isReview, true);
  assert.equal(intro.sampled, true, 'anak harus diberi tahu kartunya hanya cuplikan');
  assert.equal(intro.counts.words, 10);
  assert.ok(intro.counts.totalWords > 50, 'jumlah sebenarnya ikut dibawa');
  assert.deepEqual(intro.reviewOf, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test('pelajaran biasa tidak ditandai ulangan', () => {
  const biasa = applyReview(level('yct3')).lessons[0];
  const intro = buildStudyDeck(biasa)[0];
  assert.equal(intro.isReview, false);
  assert.equal(intro.sampled, false);
  assert.equal(intro.counts.words, intro.counts.totalWords);
});

test('contoh pemakaian dicari dari seluruh kalimat, bukan hanya yang tercuplik', () => {
  const lesson = {
    number: 1,
    vocab: [{ zh: '书', py: 'shū', id: 'buku' }],
    keySentences: [
      { zh: '你好！', py: 'nǐ hǎo', id: 'Halo!' },
      { zh: '这是书。', py: 'zhè shì shū', id: 'Ini buku.' }
    ]
  };
  const kartu = buildStudyDeck(lesson, { maxSentences: 1 })[1];
  assert.equal(kartu.example?.zh, '这是书。', 'contohnya tidak boleh hilang gara-gara dicuplik');
});

// -------------------------------------------- dampak ke bagian lain aplikasi

function layanan(levelData) {
  const content = { async listLevels() { return [{ id: 'yct3', code: 'YCT 3', status: 'ready' }]; },
                    async loadLevel() { return levelData; } };
  const profiles = {
    data: () => ({ xp: 0, cards: {}, lessonStars: {}, studied: {} }),
    profileConfig: () => ({ id: 'colin', bridgePerLesson: 2 })
  };
  return new CurriculumService(content, profiles);
}

test('kamusku tidak menggandakan seluruh kata gara-gara bab ulangan', async () => {
  // Dibandingkan dengan kamus dari level yang BELUM diisi: mengisi bab ulangan
  // tidak boleh menambah satu baris pun. (YCT 3 memang punya satu kata yang
  // muncul di dua pelajaran, 给 — itu memang begitu di bukunya.)
  const mentah = level('yct3');
  const sebelum = await layanan(mentah).wordbook('colin', 'yct3');
  const sesudah = await layanan(applyReview(mentah)).wordbook('colin', 'yct3');

  assert.deepEqual(sesudah.map((w) => w.zh), sebelum.map((w) => w.zh));
  assert.ok(sebelum.length > 50, 'prasyarat tes: kamusnya memang panjang');
});

test('lencana "selesaikan semua pelajaran" tidak ikut tercabut', async () => {
  // Bab ulangan sengaja tidak dihitung: kalau dihitung, anak yang sudah
  // menuntaskan pelajaran 1-11 akan KEHILANGAN lencana yang sudah diraihnya
  // sampai dia mengerjakan bab ulangan juga.
  const isi = applyReview(level('yct3'));
  const bintangPenuh = {};
  for (const l of isi.lessons) {
    if (isReviewLesson(l)) continue;
    for (const s of appConfig.skills) bintangPenuh[`yct3:${l.number}:${s.id}`] = 3;
  }

  const content = { async listLevels() { return [{ id: 'yct3', code: 'YCT 3', status: 'ready' }]; },
                    async loadLevel() { return isi; } };
  const profiles = {
    data: () => ({ xp: 0, cards: {}, lessonStars: bintangPenuh, studied: {} }),
    profileConfig: () => ({ id: 'colin', bridgePerLesson: 2 })
  };

  const cleared = await new CurriculumService(content, profiles).clearedLevelIds('colin');
  assert.deepEqual(cleared, ['yct3']);
});

test('peta pelajaran membawa daftar pelajaran yang diulang', async () => {
  const isi = applyReview(level('yct3'));
  const { lessons } = await layanan(isi).lessonMap('colin', 'yct3');
  const ulangan = lessons.at(-1);
  assert.equal(ulangan.isReview, true);
  assert.ok(ulangan.vocabCount > 50, 'peta harus melihatnya sebagai bisa dibuka');
  assert.equal(ulangan.reviewOf.length, 11);
});
