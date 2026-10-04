// Uji sesi dengar latihan berbicara.
//
// Keluhan dari rumah: "waktu yang kamu berikan untuk menjawab pertanyaan
// speaking terlalu singkat, jawabannya belum selesai tetapi sudah tidak bisa
// terekam sisa jawabannya."
//
// Yang dijaga di sini: tidak ada penghitung waktu yang memutus anak. Mesin
// pengenal yang berhenti sendiri karena mendengar jeda harus disambung lagi,
// dan yang mengakhiri sesi adalah tombol "Selesai" — bukan jam.

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mesin pengenal tiruan. Harus dipasang SEBELUM adapternya dimuat, karena
// adapter menangkap window.SpeechRecognition sekali saat modulnya dibaca.
const mesin = [];

class FakeRecognition {
  constructor() {
    this.lang = '';
    this.continuous = false;
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.dimulai = false;
    this.dibatalkan = false;
    mesin.push(this);
  }
  start() {
    this.dimulai = true;
  }
  stop() {
    this.onend?.();
  }
  abort() {
    this.dibatalkan = true;
  }

  // --- alat bantu uji ---
  /** Mesin mengirim satu potongan final, dengan beberapa tebakan. */
  dengar(...alternatif) {
    const hasil = Object.assign([...alternatif.map((t) => ({ transcript: t }))], {
      isFinal: true,
      length: alternatif.length
    });
    this.onresult?.({ results: Object.assign([hasil], { length: 1 }), resultIndex: 0 });
  }
  /** Mesin mengirim teks sementara (belum final). */
  sementara(teks) {
    const hasil = Object.assign([{ transcript: teks }], { isFinal: false, length: 1 });
    this.onresult?.({ results: Object.assign([hasil], { length: 1 }), resultIndex: 0 });
  }
  /** Mesin berhenti sendiri karena mendengar jeda. */
  berhentiSendiri() {
    this.onend?.();
  }
  galat(kode) {
    this.onerror?.({ error: kode });
  }
}

globalThis.window = { SpeechRecognition: FakeRecognition };

const { WebSpeechRecognitionAdapter, rangkai } = await import(
  '../src/adapters/outbound/webSpeechRecognitionAdapter.js'
);

const tunggu = (ms = 5) => new Promise((r) => setTimeout(r, ms));
const terakhir = () => mesin[mesin.length - 1];

function adapter(cfg = {}) {
  mesin.length = 0;
  return new WebSpeechRecognitionAdapter({
    lang: 'zh-CN',
    maxAlternatives: 8,
    maxListenMs: 60000,
    ...cfg
  });
}

// -------------------------------------------------------- inti keluhannya

test('mesin yang berhenti sendiri disambung lagi, bukan diakhiri', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().dengar('你好');
  terakhir().berhentiSendiri();   // anak berhenti sejenak untuk berpikir
  await tunggu(200);

  assert.equal(mesin.length, 2, 'harus dinyalakan lagi, bukan menyerah');
  assert.equal(rec.isListening(), true, 'sesinya masih berjalan');

  // Sisa kalimatnya masih sempat terekam — persis yang dulu hilang.
  terakhir().dengar('我是学生');
  rec.finish();

  const hasil = await janji;
  assert.deepEqual(hasil.transcripts, ['你好我是学生']);
  assert.equal(hasil.timedOut, false);
});

test('sesinya baru berakhir saat "Selesai" ditekan', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().dengar('你好');
  await tunggu(150);

  // Satu potongan final sudah masuk, tetapi sesinya TIDAK boleh berakhir.
  let sudahSelesai = false;
  janji.then(() => {
    sudahSelesai = true;
  });
  await tunggu(50);
  assert.equal(sudahSelesai, false, 'dulu di sinilah anak terpotong');

  rec.finish();
  const hasil = await janji;
  assert.deepEqual(hasil.transcripts, ['你好']);
});

test('potongan-potongan disambung berurutan', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().dengar('我');
  terakhir().dengar('有');
  terakhir().dengar('一本书');
  rec.finish();

  assert.deepEqual((await janji).transcripts, ['我有一本书']);
});

test('teks yang belum final tetap ikut terkirim', async () => {
  // Anak menekan "Selesai" saat mesinnya belum sempat memfinalkan suku kata
  // terakhir. Yang sudah terdengar tidak boleh ikut hilang.
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().dengar('你好');
  terakhir().sementara('我是');
  rec.finish();

  assert.deepEqual((await janji).transcripts, ['你好我是']);
});

test('teks sementara dilaporkan agar anak melihat suaranya tertangkap', async () => {
  const rec = adapter();
  const terlihat = [];
  const janji = rec.listen({ onPartial: (t) => terlihat.push(t) });
  await tunggu();

  terakhir().sementara('你');
  terakhir().dengar('你好');
  terakhir().sementara('我');

  rec.finish();
  await janji;
  assert.deepEqual(terlihat, ['你', '你好', '你好我']);
});

// ------------------------------------------------------- jaring pengaman

test('batas waktu hanya jaring pengaman — hasilnya diserahkan, bukan dibuang', async () => {
  const rec = adapter({ maxListenMs: 60 });
  const janji = rec.listen();
  await tunggu();
  terakhir().dengar('你好');

  const hasil = await janji;
  assert.equal(hasil.timedOut, true);
  assert.deepEqual(hasil.transcripts, ['你好'], 'yang sudah terkumpul tetap dinilai');
  assert.equal(rec.isListening(), false);
});

test('batas waktunya panjang, bukan beberapa detik', async () => {
  const { appConfig } = await import('../src/config/appConfig.js');
  assert.ok(
    appConfig.speech.maxListenMs >= 30000,
    `maxListenMs ${appConfig.speech.maxListenMs} ms terlalu pendek untuk anak yang berpikir di tengah kalimat`
  );
  assert.equal(appConfig.speech.listenTimeoutMs, undefined, 'penghitung waktu lama sudah tidak dipakai');
});

// ------------------------------------------------------------ keadaan lain

test('keluar dari layar membatalkan sesi dan membuang hasilnya', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();
  terakhir().dengar('你好');

  rec.stop();
  const hasil = await janji;
  assert.deepEqual(hasil.transcripts, [], 'yang dibatalkan tidak boleh ikut dinilai');
  assert.equal(rec.isListening(), false);
});

test('diam sama sekali bukan galat — anak hanya belum bersuara', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().galat('no-speech');
  await tunggu(50);
  assert.equal(rec.isListening(), true, 'jangan menyerah hanya karena anak masih diam');

  terakhir().dengar('你好');
  rec.finish();
  const hasil = await janji;
  assert.equal(hasil.error, null);
  assert.deepEqual(hasil.transcripts, ['你好']);
});

test('galat sungguhan menghentikan sesi dan dilaporkan', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  terakhir().galat('not-allowed');
  const hasil = await janji;
  assert.equal(hasil.error, 'not-allowed');
  assert.equal(rec.isListening(), false);
});

test('mesinnya disetel mendengar terus, bukan sekali ucap', async () => {
  const rec = adapter();
  const janji = rec.listen();
  await tunggu();

  const m = terakhir();
  assert.equal(m.continuous, true, 'tanpa ini mesinnya berhenti di jeda pertama');
  assert.equal(m.interimResults, true);
  assert.equal(m.maxAlternatives, 8);
  assert.equal(m.lang, 'zh-CN');

  rec.finish();
  await janji;
});

// --------------------------------------------------- perangkaian potongan

test('beberapa tebakan dirangkai sejajar: terbaik dengan terbaik', () => {
  assert.deepEqual(rangkai([['你好', '尼好'], ['我是', '我事']]), ['你好我是', '尼好我事']);
});

test('potongan dengan tebakan lebih sedikit memakai tebakan terbaiknya', () => {
  assert.deepEqual(rangkai([['你好', '尼好'], ['吗']]), ['你好吗', '尼好吗']);
});

test('perangkaian aman untuk masukan kosong', () => {
  assert.deepEqual(rangkai([], ''), []);
  assert.deepEqual(rangkai([], '  '), []);
  assert.deepEqual(rangkai([], '你'), ['你']);
  assert.deepEqual(rangkai(), []);
});

test('tebakan yang kebetulan sama tidak digandakan', () => {
  assert.deepEqual(rangkai([['你好', '你好']]), ['你好']);
});
