// Uji pemilihan suara text-to-speech.
//
// Keluhan yang mendasari berkas ini: "nada pronunciation-nya tidak terlalu
// terdengar jelas sehingga anak susah menirunya." Suara yang dipakai ternyata
// yang PERTAMA ditemukan perangkat — dan di banyak perangkat itu suara ringkas
// yang lengkung nadanya datar. Tes di sini menjaga agar yang terpilih selalu
// suara paling jelas yang tersedia.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeLang, isMandarin, scoreVoice, rankVoices, pickVoice, voiceId, toneChunks
} from '../src/domain/speechVoice.js';
import { appConfig } from '../src/config/appConfig.js';

// Contoh nyata dari perangkat sungguhan, ditulis apa adanya.
const IPHONE_RINGKAS = {
  name: 'Ting-Ting', lang: 'zh-CN', localService: true,
  voiceURI: 'com.apple.ttsbundle.Ting-Ting-compact'
};
const IPHONE_PREMIUM = {
  name: 'Ting-Ting (Premium)', lang: 'zh-CN', localService: true,
  voiceURI: 'com.apple.voice.premium.zh-CN.Ting-Ting'
};
const EDGE_NEURAL = {
  name: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
  lang: 'zh-CN', localService: false, voiceURI: 'Microsoft Xiaoxiao Online'
};
const CHROME_GOOGLE = {
  name: 'Google 普通话（中国大陆）',
  lang: 'zh-CN', localService: false, voiceURI: 'Google zh-CN'
};
const TAIWAN = { name: 'Mei-Jia', lang: 'zh-TW', localService: true, voiceURI: 'meijia' };
const KANTON = { name: 'Sin-ji', lang: 'zh-HK', localService: true, voiceURI: 'sinji' };
const INGGRIS = { name: 'Samantha', lang: 'en-US', localService: true, voiceURI: 'samantha' };

// ------------------------------------------------------------ bahasa suara

test('bahasa suara dibakukan, apa pun cara penulisannya', () => {
  assert.equal(normalizeLang('zh_CN'), 'zh-CN');
  assert.equal(normalizeLang('zh-cn'), 'zh-CN');
  assert.equal(normalizeLang('ZH'), 'zh');
  assert.equal(normalizeLang(undefined), '');
});

test('hanya suara Mandarin yang dipakai — Kanton bukan Mandarin', () => {
  assert.equal(isMandarin(IPHONE_RINGKAS), true);
  assert.equal(isMandarin(TAIWAN), true);
  assert.equal(isMandarin(KANTON), false, 'zh-HK adalah Kanton: nada dan lafalnya lain sama sekali');
  assert.equal(isMandarin(INGGRIS), false);
});

// --------------------------------------------------- inti perbaikannya

test('suara neural menang atas suara ringkas di perangkat yang sama', () => {
  // Persis keadaan di iPhone: yang ringkas biasanya lebih dulu dalam daftar.
  const dipilih = pickVoice([IPHONE_RINGKAS, IPHONE_PREMIUM]);
  assert.equal(dipilih.name, 'Ting-Ting (Premium)');
});

test('suara pertama dalam daftar tidak otomatis menang', () => {
  const dipilih = pickVoice([IPHONE_RINGKAS, EDGE_NEURAL, CHROME_GOOGLE]);
  assert.equal(dipilih, EDGE_NEURAL, 'urutan perangkat tidak ada hubungannya dengan mutu');
});

test('suara ringkas dinilai lebih rendah dan diberi keterangan apa adanya', () => {
  const ringkas = scoreVoice(IPHONE_RINGKAS);
  const neural = scoreVoice(EDGE_NEURAL);
  assert.ok(neural.score > ringkas.score);
  assert.equal(neural.neural, true);
  assert.match(ringkas.note, /datar/);
});

test('logat daratan didahulukan — itu yang dipakai buku YCT/HSK', () => {
  assert.ok(scoreVoice(IPHONE_RINGKAS).score > scoreVoice({ ...IPHONE_RINGKAS, lang: 'zh-TW' }).score);
});

test('daftar terurut, Kanton dan bahasa lain dibuang', () => {
  const urut = rankVoices([INGGRIS, KANTON, IPHONE_RINGKAS, EDGE_NEURAL, TAIWAN]);
  assert.deepEqual(urut.map((r) => r.voice.name), [
    EDGE_NEURAL.name, TAIWAN.name, IPHONE_RINGKAS.name
  ]);
  for (const r of urut) assert.ok(r.note, 'tiap suara harus punya keterangan untuk orang tua');
});

test('kejelasan nada mengalahkan logat', () => {
  // Sengaja: suara Taiwan yang jelas menang atas suara daratan yang ringkas.
  // Lengkung nadanya persis sama di kedua logat — yang berbeda hanya aksen
  // dan sebagian kosakata — sedangkan nada yang datar justru inti keluhannya.
  // Orang tua tetap bisa memilih sendiri lewat menu Suara Pengucapan.
  assert.equal(pickVoice([IPHONE_RINGKAS, TAIWAN]), TAIWAN);
  assert.equal(pickVoice([IPHONE_PREMIUM, TAIWAN]), IPHONE_PREMIUM, 'kalau sama-sama jelas, daratan menang');
});

test('pilihan orang tua dihormati selama suaranya masih ada', () => {
  const daftar = [IPHONE_RINGKAS, EDGE_NEURAL];
  assert.equal(pickVoice(daftar, voiceId(IPHONE_RINGKAS)), IPHONE_RINGKAS);
  // Berganti perangkat: pilihan lama tidak ada lagi, jangan sampai jadi bisu.
  assert.equal(pickVoice(daftar, 'suara-dari-hp-lama'), EDGE_NEURAL);
});

test('perangkat tanpa suara Mandarin tidak menggagalkan apa pun', () => {
  assert.equal(pickVoice([INGGRIS, KANTON]), null);
  assert.deepEqual(rankVoices([]), []);
  assert.deepEqual(rankVoices(undefined), []);
});

// ------------------------------------------------- mode pelan per suku kata

test('mode pelan memecah teks per suku kata', () => {
  // Satu huruf Han = satu suku kata, jadi tiap nada terdengar utuh.
  assert.deepEqual(toneChunks('你好'), ['你', '好']);
  assert.deepEqual(
    toneChunks('我是学生。'),
    ['我', '是', '学', '生'],
    'tanda baca tidak berbunyi, jadi dibuang'
  );
});

test('angka dan huruf latin tidak ikut terpotong-potong', () => {
  assert.deepEqual(toneChunks('我有15个'), ['我', '有', '15', '个']);
  assert.deepEqual(toneChunks(''), []);
  assert.deepEqual(toneChunks(null), []);
});

// ------------------------------------------------------------- setelannya

test('kecepatan dan pitch dijaga tetap ramah nada', () => {
  const s = appConfig.speech;
  assert.ok(s.rate >= 0.7 && s.rate <= 1,
    `rate ${s.rate} — terlalu lambat justru membuat lengkung nada melar`);
  assert.equal(s.pitch, 1, 'pergeseran pitch ditumpangkan di atas lengkung nada aslinya');
  assert.ok(s.syllableGapMs > 0, 'mode pelan butuh jeda antar suku kata');
});
