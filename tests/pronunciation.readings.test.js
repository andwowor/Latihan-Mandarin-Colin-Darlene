// Uji penilaian ucapan berbasis BUNYI.
//
// Keluhan yang mendasari berkas ini: anak mengucapkan dengan benar, tetapi
// pengenal suara menulis huruf lain yang bunyinya sama — dan penilaian lama
// menyebutnya salah total. Tes di sini menjaga agar itu tidak terulang.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  gradeSpeech, similarity, stripTone, splitPinyin, nearSound, missingChars, speechStars,
  mergeReadingSources, speechFeedbackId
} from '../src/domain/pronunciation.js';
import { readVocab, buildReadings, serialise } from '../tools/build-readings.mjs';
import { appConfig } from '../src/config/appConfig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const KAMUS = JSON.parse(
  fs.readFileSync(path.join(root, 'public/data/curriculum/readings.json'), 'utf8')
);
// Yang dipakai penilaian adalah peta gabungan kedua lapis, bukan salah satunya.
const readings = mergeReadingSources(KAMUS);
const AMBANG = appConfig.speech.acceptScore;

// ------------------------------------------------------------ alat bantu

test('nada dibuang, ü dipertahankan sebagai bunyi tersendiri', () => {
  assert.equal(stripTone('hǎo'), 'hao');
  assert.equal(stripTone('Nǐ'), 'ni');
  assert.equal(stripTone('lǜ'), 'lv', 'lu dan lü memang bunyi berbeda');
  assert.equal(stripTone('zàijiàn'), 'zaijian');
});

test('pinyin dipenggal per suku kata', () => {
  assert.deepEqual(splitPinyin('nǐ hǎo').map(stripTone), ['ni', 'hao']);
  assert.deepEqual(splitPinyin('zàijiàn').map(stripTone), ['zai', 'jian']);
  assert.deepEqual(splitPinyin('lǎoshī').map(stripTone), ['lao', 'shi']);
  assert.deepEqual(splitPinyin(''), []);
});

test('bunyi yang berdekatan dinormalkan ke bentuk yang sama', () => {
  assert.equal(nearSound('zhi'), nearSound('zi'));
  assert.equal(nearSound('shi'), nearSound('si'));
  assert.equal(nearSound('chang'), nearSound('can'));
  assert.notEqual(nearSound('ma'), nearSound('ba'));
});

// ------------------------------------------------ keluhan yang sebenarnya

test('homofon dinilai benar penuh — inti perbaikannya', () => {
  // Semua pasangan ini bunyinya sama persis; hanya hurufnya yang berbeda.
  for (const [target, terdengar] of [['是', '事'], ['在', '再'], ['他', '她'], ['做', '坐']]) {
    const r = gradeSpeech(target, terdengar, AMBANG, readings);
    assert.equal(r.score, 1, `${target} vs ${terdengar} seharusnya bernilai penuh`);
    assert.equal(r.correct, true);
  }
});

test('homofon di tengah kalimat tidak merusak nilainya', () => {
  const r = gradeSpeech('我是学生', '我事学生', AMBANG, readings);
  assert.equal(r.score, 1);
  assert.equal(r.correct, true);
});

test('bunyi berdekatan hanya dihitung setengah kesalahan', () => {
  // 师 shi vs 四 si — kekeliruan paling lazim pada anak dan pada mesin.
  const r = gradeSpeech('老师', '老四', AMBANG, readings);
  assert.ok(r.score > 0.5 && r.score < 1, `nilainya ${r.score}, harus di antara`);
  assert.equal(r.correct, true);
});

test('ucapan yang benar-benar berbeda tetap dinilai salah', () => {
  const r = gradeSpeech('你好', '再见', AMBANG, readings);
  assert.equal(r.score, 0);
  assert.equal(r.correct, false);
});

test('kata yang sama persis tetap bernilai sempurna', () => {
  const r = gradeSpeech('谢谢', '谢谢', AMBANG, readings);
  assert.equal(r.score, 1);
  assert.equal(speechStars(r.score), 3);
});

test('alternatif terbaik yang dipakai, bukan tebakan pertama', () => {
  const r = gradeSpeech('你好', ['再见', '尼豪', '你好'], AMBANG, readings);
  assert.equal(r.score, 1);
  assert.equal(r.heard, '你好');
});

test('tanpa kamus lafal, penilaian jatuh ke perbandingan huruf tanpa galat', () => {
  const r = gradeSpeech('是', '事', AMBANG);
  assert.equal(r.score, 0, 'tanpa kamus, homofon memang tak bisa dikenali');
  assert.doesNotThrow(() => gradeSpeech('你好', '你好'));
});

test('homofon DI LUAR kurikulum juga dikenali — celah yang ditutup lapis umum', () => {
  // Huruf-huruf ini tidak ada di materi anak, tetapi pengenal suara bisa saja
  // menebaknya. Tanpa lapis lafal umum, semuanya akan dinilai salah.
  for (const [target, terdengar] of [['你', '尼'], ['我', '窝'], ['爱', '唉'], ['吗', '嘛']]) {
    const r = gradeSpeech(target, terdengar, AMBANG, readings);
    assert.equal(r.score, 1, `${target} vs ${terdengar} seharusnya bernilai penuh`);
  }
  assert.equal(gradeSpeech('高兴', '高性', AMBANG, readings).score, 1);
});

test('huruf yang benar-benar tak dikenali jatuh ke perbandingan huruf', () => {
  // Huruf Latin tidak pernah ada di kamus lafal mana pun.
  const r = gradeSpeech('你好', 'Xy', AMBANG, readings);
  assert.equal(r.score, 0);
  assert.equal(r.correct, false);
});

test('penggabungan dua lapis: kurikulum menambah, bukan mengganti', () => {
  const gabungan = mergeReadingSources({
    sounds: { shi: '是事', hao: '好' },
    readings: { 是: ['shi'], 好: ['hao', 'hau'] }
  });
  assert.deepEqual(gabungan['事'], ['shi'], 'dari lapis umum saja');
  assert.deepEqual(gabungan['好'], ['hao', 'hau'], 'cara baca kurikulum ikut ditambahkan');
  assert.deepEqual(mergeReadingSources({}), {}, 'masukan kosong tidak menggagalkan');
});

test('suara yang tidak terdengar sama sekali ditandai kosong', () => {
  const r = gradeSpeech('你好', [], AMBANG, readings);
  assert.equal(r.empty, true);
  assert.equal(r.correct, false);
  assert.equal(r.heard, '');
});

test('ucapan yang meleset total tetap ditampilkan apa adanya', () => {
  // Nilainya 0, tetapi anak jelas bersuara — umpan baliknya tidak boleh
  // berkata "suaramu belum terdengar".
  const r = gradeSpeech('你好', ['再见'], AMBANG, readings);
  assert.equal(r.score, 0);
  assert.equal(r.heard, '再见', 'anak harus melihat apa yang terdengar');
  assert.equal(r.empty, false);
  assert.match(speechFeedbackId(r.score, r.heard), /terdengar masih lain/);
  assert.match(speechFeedbackId(0, ''), /belum terdengar/);
});

test('huruf yang hilang dilaporkan berdasarkan bunyi, bukan tulisan', () => {
  assert.deepEqual(missingChars('是', '事', readings), [], 'bunyinya ada, jadi tidak hilang');
  assert.deepEqual(missingChars('你好', '你', readings), ['好']);
});

test('kemiripan simetris dan berada di rentang 0..1', () => {
  for (const [a, b] of [['你好', '尼好'], ['老师', '老四'], ['我是学生', '我事学生']]) {
    const ab = similarity(a, b, readings);
    const ba = similarity(b, a, readings);
    assert.equal(ab.toFixed(6), ba.toFixed(6), `${a}/${b} harus simetris`);
    assert.ok(ab >= 0 && ab <= 1);
  }
});

// ------------------------------------------------------- kamus lafal itu sendiri

test('lapis kurikulum di readings.json sama dengan hasil generator', () => {
  // Hanya lapis kurikulum yang dibandingkan: lapis umum dibangkitkan dari
  // `pinyin-pro` yang tidak selalu terpasang, dan isinya tidak bergantung
  // pada materi anak.
  assert.deepEqual(
    KAMUS.readings,
    buildReadings(readVocab()).readings,
    'readings.json tertinggal dari kurikulum — jalankan: npm run readings'
  );
  assert.equal(typeof serialise, 'function');
});

test('lapis lafal umum lengkap dan berbentuk benar', () => {
  const bunyi = Object.keys(KAMUS.sounds || {});
  assert.ok(bunyi.length > 300, `hanya ${bunyi.length} bunyi berbeda — lapis umum sepertinya hilang`);

  for (const [sound, chars] of Object.entries(KAMUS.sounds)) {
    assert.match(sound, /^[a-z]+$/, `bunyi "${sound}" belum bersih`);
    assert.ok(chars.length > 0, `bunyi "${sound}" tidak punya huruf`);
  }

  const huruf = new Set(Object.values(KAMUS.sounds).flatMap((c) => [...c]));
  assert.ok(huruf.size > 15000, `hanya ${huruf.size} huruf terpetakan`);
});

test('kamus lafal mencakup hampir seluruh huruf yang dipakai kurikulum', () => {
  const dipakai = new Set();
  for (const w of readVocab()) {
    for (const ch of String(w.zh || '')) if (/\p{Script=Han}/u.test(ch)) dipakai.add(ch);
  }
  const tercakup = [...dipakai].filter((ch) => readings[ch]).length;
  const rasio = tercakup / dipakai.size;
  assert.ok(rasio > 0.97, `cakupan kamus hanya ${Math.round(rasio * 100)}%`);
});

test('setiap bunyi di kamus sudah tanpa nada dan hanya huruf latin', () => {
  for (const [ch, sounds] of Object.entries(KAMUS.readings)) {
    assert.ok(sounds.length > 0, `${ch} tidak punya bunyi`);
    for (const s of sounds) {
      assert.match(s, /^[a-z]+$/, `bunyi "${s}" pada ${ch} belum bersih`);
    }
  }
});
