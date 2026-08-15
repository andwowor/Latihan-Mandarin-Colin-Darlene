// Uji jembatan HSK: aturan penyisipan kata HSK ke pelajaran YCT, sekaligus
// menjaga agar public/data/curriculum/bridge.json tidak pernah basi.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { planBridge, crossReference, difficultyRank, applyBridge, vocabOf, BRIDGE_SOURCES } from '../src/domain/hskBridge.js';
import { readLevels, buildBridge, serialise } from '../tools/build-bridge.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Kurikulum mini untuk menguji aturannya tanpa bergantung pada isi buku asli.
function fixture() {
  const word = (zh, py = 'x', id = 'x') => ({ zh, py, en: id, id });
  return [
    {
      id: 'yct1',
      code: 'YCT 1',
      track: 'YCT',
      level: 1,
      lessons: [
        { number: 1, vocab: [word('你'), word('好')] },
        { number: 2, vocab: [word('我')] },
        { number: 3, vocab: [] } // pelajaran ulangan
      ]
    },
    {
      id: 'yct2',
      code: 'YCT 2',
      track: 'YCT',
      level: 2,
      lessons: [{ number: 1, vocab: [word('猫')] }]
    },
    {
      id: 'hsk1',
      code: 'HSK 1',
      track: 'HSK',
      level: 1,
      lessons: [
        { number: 1, vocab: [word('你'), word('您'), word('好')] },
        { number: 2, vocab: [word('谢谢'), word('不客气')] }
      ]
    }
  ];
}

// -------------------------------------------------------------- aturan dasar

test('kata yang sudah ada di YCT hanya ditandai, tidak dititipkan lagi', () => {
  const levels = fixture();
  const { levels: plan } = planBridge({ levels, sources: { yct1: ['hsk1'] }, perLesson: 4 });

  assert.deepEqual(plan.yct1.alsoIn['你'], ['HSK 1'], 'kata bersama harus bertanda HSK');
  assert.deepEqual(plan.yct1.alsoIn['好'], ['HSK 1']);

  const titipan = Object.values(plan.yct1.lessons).flat().map((w) => w.zh);
  assert.ok(!titipan.includes('你'), '你 sudah dipelajari di YCT, tidak boleh dititipkan');
  assert.ok(!titipan.includes('好'), '好 sudah dipelajari di YCT, tidak boleh dititipkan');
  assert.ok(titipan.includes('您'), '您 belum ada di YCT, harus jadi bekal');
});

test('penanda hanya lintas jalur, bukan antar-level dalam satu jalur', () => {
  const levels = fixture();
  levels[1].lessons[0].vocab.push({ zh: '你', py: 'nǐ', en: 'you', id: 'kamu' });
  const map = crossReference(levels);
  assert.deepEqual(map.yct2['你'], ['HSK 1'], 'YCT 1 tidak perlu disebut di YCT 2');
  assert.deepEqual(map.hsk1['你'].sort(), ['YCT 1', 'YCT 2'], 'dari sisi HSK, kedua level YCT disebut');
});

test('pelajaran tanpa kata baru tidak dititipi bekal', () => {
  const levels = fixture();
  const { levels: plan } = planBridge({ levels, sources: { yct1: ['hsk1'] }, perLesson: 4 });
  assert.equal(plan.yct1.lessons['3'], undefined, 'pelajaran ulangan harus dilewati');
});

test('jatah per pelajaran dihormati', () => {
  const levels = fixture();
  const { levels: plan } = planBridge({ levels, sources: { yct1: ['hsk1'] }, perLesson: 1 });
  for (const list of Object.values(plan.yct1.lessons)) {
    assert.ok(list.length <= 1, 'tidak boleh melebihi perLesson');
  }
});

test('kata tidak pernah dititipkan dua kali di sepanjang jalur', () => {
  const levels = fixture();
  const { levels: plan } = planBridge({
    levels,
    sources: { yct1: ['hsk1'], yct2: ['hsk1'] },
    perLesson: 1
  });
  const semua = [...Object.values(plan.yct1.lessons).flat(), ...Object.values(plan.yct2.lessons).flat()];
  const zh = semua.map((w) => w.zh);
  assert.equal(new Set(zh).size, zh.length, 'tiap kata bekal hanya muncul sekali');
});

test('kata yang hurufnya sudah dikenal dianggap lebih mudah', () => {
  const familiar = new Set(['你', '好']);
  const mudah = difficultyRank({ zh: '你好', fromLevel: 1, fromLesson: 9 }, familiar);
  const sulit = difficultyRank({ zh: '谢谢', fromLevel: 1, fromLesson: 1 }, familiar);
  assert.ok(mudah[0] < sulit[0], 'jumlah huruf baru jadi pertimbangan pertama');
});

test('applyBridge menempelkan bekal ke pelajaran tanpa mengubah data asli', () => {
  const level = { id: 'yct1', lessons: [{ number: 1, vocab: [] }] };
  const bridge = { levels: { yct1: { alsoIn: { 你: ['HSK 1'] }, lessons: { 1: [{ zh: '您' }] } } } };
  const out = applyBridge(level, bridge);

  assert.equal(out.lessons[0].bridgeVocab[0].zh, '您');
  assert.deepEqual(out.alsoIn['你'], ['HSK 1']);
  assert.equal(level.lessons[0].bridgeVocab, undefined, 'data asli tidak boleh disentuh');
});

test('level tanpa rencana dikembalikan apa adanya', () => {
  const level = { id: 'yct9', lessons: [{ number: 1, vocab: [] }] };
  assert.equal(applyBridge(level, { levels: {} }), level);
});

// ------------------------------------------------------- kurikulum sungguhan

test('bridge.json sama dengan hasil generator (jangan lupa "npm run bridge")', () => {
  const file = path.join(root, 'public/data/curriculum/bridge.json');
  const tersimpan = fs.readFileSync(file, 'utf8');
  const segar = serialise(buildBridge(readLevels()));
  assert.equal(
    tersimpan,
    segar,
    'bridge.json tertinggal dari kurikulum — jalankan: npm run bridge'
  );
});

test('setiap kata bekal benar-benar berasal dari buku HSK dan belum ada di YCT-nya', () => {
  const levels = readLevels();
  const byId = new Map(levels.map((l) => [l.id, l]));
  const bridge = buildBridge(levels);

  for (const [levelId, sumber] of Object.entries(BRIDGE_SOURCES)) {
    const plan = bridge.levels[levelId];
    if (!plan) continue;

    const milikSendiri = new Set(vocabOf(byId.get(levelId)).map((w) => w.zh));
    const dariHsk = new Set(sumber.flatMap((id) => vocabOf(byId.get(id)).map((w) => w.zh)));

    for (const [nomor, list] of Object.entries(plan.lessons)) {
      assert.ok(list.length <= bridge.perLesson, `${levelId} pelajaran ${nomor} kelebihan jatah`);
      for (const w of list) {
        assert.ok(dariHsk.has(w.zh), `${w.zh} tidak ada di sumber HSK ${levelId}`);
        assert.ok(!milikSendiri.has(w.zh), `${w.zh} sudah diajarkan ${levelId} sendiri`);
        assert.ok(w.py && w.id && w.fromCode, `${w.zh} kekurangan data tampil`);
      }
    }
  }
});

test('seluruh kosakata HSK 1 tuntas dikenalkan sebelum jalur YCT selesai', () => {
  const levels = readLevels();
  const byId = new Map(levels.map((l) => [l.id, l]));
  const bridge = buildBridge(levels);

  const dikenalkan = new Set();
  for (const id of Object.keys(BRIDGE_SOURCES)) {
    for (const w of vocabOf(byId.get(id))) dikenalkan.add(w.zh);
    for (const list of Object.values(bridge.levels[id]?.lessons || {})) {
      for (const w of list) dikenalkan.add(w.zh);
    }
  }

  const belum = vocabOf(byId.get('hsk1')).filter((w) => !dikenalkan.has(w.zh));
  assert.deepEqual(belum, [], 'setiap kata HSK 1 harus sempat diperkenalkan');
});
