// Uji kesempatan kedua pada latihan berbicara.
//
// Permintaan dari rumah: "khusus untuk latihan speaking, untuk setiap
// pertanyaan, berikan 1 kesempatan lagi untuk mengulang jika salah."
//
// Yang dijaga di sini: selama kesempatan itu masih ada, TIDAK ADA yang
// tercatat — nyawa utuh, combo utuh, kartu SRS belum disentuh, dan soalnya
// belum terhitung terjawab.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PracticeService } from '../src/application/practiceService.js';
import { appConfig } from '../src/config/appConfig.js';

const word = (zh, id) => ({ zh, py: zh, en: id, id });

const LESSON = {
  number: 1,
  titleZh: '你好！',
  titleId: 'Halo!',
  vocab: [word('你', 'kamu'), word('好', 'baik'), word('我', 'aku'), word('是', 'adalah')],
  keySentences: [{ zh: '你好！', py: 'Nǐ hǎo!', id: 'Halo!' }],
  bridgeVocab: []
};

const fakeContent = {
  async loadLevel() {
    return { id: 'yct1', code: 'YCT 1', alsoIn: {}, lessons: [LESSON] };
  },
  async loadReadings() {
    return {};
  }
};

function fakeProfiles() {
  const store = { colin: { id: 'colin', xp: 0, cards: {}, stats: {}, dailyLog: {}, lessonStars: {} } };
  return {
    store,
    data: (id) => store[id],
    profileConfig: (id) => ({ id, bridgePerLesson: 0 }),
    update(id, mutate) {
      store[id] = mutate({ ...store[id] });
      return store[id];
    },
    refreshBadges: () => []
  };
}

async function mulai() {
  const profiles = fakeProfiles();
  const practice = new PracticeService(fakeContent, profiles, null);
  await practice.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1, skill: 'speaking' });
  return { practice, profiles };
}

/** Ucapan yang pasti tidak mirip apa pun di pelajaran ini. */
const MELESET = { transcripts: ['再见再见'] };
const tepat = (q) => ({ transcripts: [q.target] });

// ---------------------------------------------------------- inti permintaan

test('percobaan pertama yang meleset memberi kesempatan kedua', async () => {
  const { practice } = await mulai();
  const r = practice.submit(MELESET);

  assert.equal(r.retry, true);
  assert.equal(r.correct, false);
  assert.equal(r.retriesLeft, 0, 'satu kesempatan saja, bukan tanpa batas');
});

test('selama masih ada kesempatan, tidak ada yang tercatat', async () => {
  const { practice, profiles } = await mulai();
  const nyawaAwal = practice.round.hearts;

  practice.submit(MELESET);

  assert.equal(practice.round.hearts, nyawaAwal, 'nyawa tidak boleh berkurang dulu');
  assert.equal(practice.round.answered, 0, 'soalnya belum terhitung terjawab');
  assert.equal(practice.round.mistakes.length, 0);
  assert.equal(practice.current().skill, 'speaking', 'masih di soal yang sama');
  assert.deepEqual(profiles.store.colin.cards, {}, 'kartu SRS belum disentuh');
});

test('percobaan kedua yang benar dihitung benar, nyawa selamat', async () => {
  const { practice } = await mulai();
  const q = practice.current();
  const nyawaAwal = practice.round.hearts;

  practice.submit(MELESET);
  const r = practice.submit(tepat(q));

  assert.equal(r.correct, true);
  assert.equal(r.retry, undefined, 'kesempatannya sudah dipakai');
  assert.equal(practice.round.hearts, nyawaAwal);
  assert.equal(practice.round.correct, 1);
  assert.equal(practice.round.answered, 1, 'satu soal tetap satu jawaban');
});

test('percobaan kedua yang meleset lagi baru dihitung salah', async () => {
  const { practice } = await mulai();
  const nyawaAwal = practice.round.hearts;

  practice.submit(MELESET);
  const r = practice.submit(MELESET);

  assert.equal(r.retry, undefined);
  assert.equal(r.correct, false);
  assert.equal(practice.round.hearts, nyawaAwal - 1);
  assert.equal(practice.round.answered, 1);
  assert.equal(practice.round.mistakes.length, 1);
});

test('kesempatannya per soal, bukan per ronde', async () => {
  const { practice } = await mulai();

  practice.submit(MELESET);
  practice.submit(tepat(practice.current()));
  practice.next();

  assert.equal(practice.retriesLeft(), 1, 'soal berikutnya dapat jatahnya sendiri');
  assert.equal(practice.submit(MELESET).retry, true);
});

// --------------------------------------------------- batas-batas yang disengaja

test('combo tidak putus oleh percobaan kedua, tetapi juga tidak tumbuh', async () => {
  const { practice } = await mulai();

  practice.submit(tepat(practice.current()));
  assert.equal(practice.round.streakCount, 1);

  practice.next();
  practice.submit(MELESET);
  practice.submit(tepat(practice.current()));

  assert.equal(practice.round.streakCount, 1, '🔥 tetap hadiah untuk yang sekali jadi');
});

test('kata yang baru pas di percobaan kedua kembali lebih cepat', async () => {
  // Ronde berbicara memuat soal kalimat juga, dan kalimat tidak punya kartu
  // SRS. Jadi maju dulu sampai ketemu soal yang benar-benar menguji satu kata.
  const keKartu = (practice) => {
    while (practice.current() && !practice.current().word) practice.next();
    assert.ok(practice.current(), 'ronde ini tidak memuat satu pun soal kata');
  };

  const sekaliJadi = await mulai();
  keKartu(sekaliJadi.practice);
  sekaliJadi.practice.submit(tepat(sekaliJadi.practice.current()));
  const kotakSekaliJadi = Object.values(sekaliJadi.profiles.store.colin.cards)[0].box;

  const duaKali = await mulai();
  keKartu(duaKali.practice);
  duaKali.practice.submit(MELESET);
  duaKali.practice.submit(tepat(duaKali.practice.current()));
  const kotakDuaKali = Object.values(duaKali.profiles.store.colin.cards)[0].box;

  assert.ok(kotakSekaliJadi > 0, 'yang sekali jadi naik kotak');
  assert.ok(
    kotakDuaKali < kotakSekaliJadi,
    `belum dikuasai — jangan dijadwalkan sejauh yang sekali jadi (${kotakDuaKali} vs ${kotakSekaliJadi})`
  );
});

test('keterampilan selain berbicara tidak dapat kesempatan kedua', async () => {
  const profiles = fakeProfiles();
  const practice = new PracticeService(fakeContent, profiles, null);
  await practice.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1, skill: 'reading' });

  assert.equal(practice.retriesLeft(), 0);
  const r = practice.submit('jawaban yang pasti salah');
  assert.equal(r.retry, undefined, 'membaca: pilihannya terlihat, sekali pilih sudah cukup');
  assert.equal(practice.round.answered, 1);
});

test('penilaian sendiri tidak diberi kesempatan ulang', async () => {
  const { practice } = await mulai();

  // Di sini orang tua yang memutuskan, dan anak sudah bisa mengulang
  // ucapannya sebelum tombolnya ditekan.
  const r = practice.submit({ selfAssessed: true, ok: false });

  assert.equal(r.retry, undefined);
  assert.equal(practice.round.answered, 1);
});

test('rincian pelafalan ikut terbawa ke umpan balik', async () => {
  // Tanpa ini, layar umpan balik selalu menampilkan 0% dan "belum terdengar".
  const { practice } = await mulai();
  const q = practice.current();
  const r = practice.submit(tepat(q));

  assert.ok(r.detail, 'submit() harus mengembalikan rincian penilaiannya');
  assert.equal(r.detail.score, 1);
  assert.equal(r.detail.heard, q.target);
});

test('ringkasan hasil menyebut berapa soal yang butuh percobaan kedua', async () => {
  const { practice } = await mulai();

  practice.submit(MELESET);
  practice.submit(tepat(practice.current()));
  practice.next();
  practice.submit(tepat(practice.current()));

  const ringkasan = await practice.finish([]);
  assert.equal(ringkasan.retried, 1);
});

test('jatah kesempatannya bisa disetel dari konfigurasi', () => {
  assert.equal(appConfig.speech.retries, 1, 'satu kesempatan, sesuai permintaan');
});
