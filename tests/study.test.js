// Uji sesi belajar: susunan kartu materi, kunci soal, dan pencatatan XP.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildStudyDeck, bridgeShareFor, wordsInDeck } from '../src/domain/studyDeck.js';
import { applyStudy, emptyDay } from '../src/domain/progress.js';
import { buildRound } from '../src/domain/exerciseFactory.js';
import { StudyService, studyKey } from '../src/application/studyService.js';
import { appConfig } from '../src/config/appConfig.js';

const word = (zh, id) => ({ zh, py: zh, en: id, id });

const LESSON = {
  number: 1,
  titleZh: '你好！',
  titleId: 'Halo!',
  titleEn: 'Hello!',
  vocab: [word('你', 'kamu'), word('好', 'baik')],
  keySentences: [{ zh: '你好！', py: 'Nǐ hǎo!', en: 'Hello!', id: 'Halo!' }],
  bridgeVocab: [
    { zh: '您', py: 'nín', en: 'you', id: 'Anda', fromCode: 'HSK 1' },
    { zh: '呢', py: 'ne', en: 'particle', id: 'partikel', fromCode: 'HSK 1' }
  ]
};

// ------------------------------------------------------------- tumpukan kartu

test('kartu tersusun: pembuka, kata, kalimat, bekal HSK, penutup', () => {
  const cards = buildStudyDeck(LESSON, {
    bridgeWords: LESSON.bridgeVocab,
    alsoIn: { 你: ['HSK 1'] },
    levelCode: 'YCT 1'
  });

  assert.deepEqual(
    cards.map((c) => c.kind),
    ['intro', 'word', 'word', 'sentence', 'bridge', 'bridge', 'outro']
  );
  assert.equal(cards[0].counts.words, 2);
  assert.equal(cards[0].counts.bridge, 2);
});

test('kata yang juga ada di HSK diberi tanda, kata bekal membawa asalnya', () => {
  const cards = buildStudyDeck(LESSON, { bridgeWords: LESSON.bridgeVocab, alsoIn: { 你: ['HSK 1'] } });
  const ni = cards.find((c) => c.kind === 'word' && c.word.zh === '你');
  const nin = cards.find((c) => c.kind === 'bridge' && c.word.zh === '您');

  assert.deepEqual(ni.alsoIn, ['HSK 1']);
  assert.deepEqual(cards.find((c) => c.word?.zh === '好').alsoIn, []);
  assert.equal(nin.fromCode, 'HSK 1');
});

test('kartu kata membawa contoh kalimat yang benar-benar memakainya', () => {
  const cards = buildStudyDeck(LESSON, {});
  assert.equal(cards.find((c) => c.word?.zh === '你').example.zh, '你好！');
});

test('setiap kartu materi punya teks untuk dibunyikan', () => {
  const cards = buildStudyDeck(LESSON, { bridgeWords: LESSON.bridgeVocab });
  for (const c of cards.filter((x) => !['intro', 'outro'].includes(x.kind))) {
    assert.ok(c.speak, `kartu ${c.kind} harus bisa dibunyikan`);
  }
});

test('pelajaran kosong tidak menghasilkan kartu', () => {
  assert.deepEqual(buildStudyDeck({ number: 9, vocab: [], keySentences: [] }), []);
});

test('porsi bekal mengikuti jatah tiap anak', () => {
  assert.equal(bridgeShareFor(LESSON.bridgeVocab, 1).length, 1);
  assert.equal(bridgeShareFor(LESSON.bridgeVocab, 9).length, 2, 'tidak boleh melebihi yang tersedia');
  assert.deepEqual(bridgeShareFor(LESSON.bridgeVocab, 0), [], 'jatah nol berarti tanpa bekal');
});

test('wordsInDeck mengumpulkan kata asli dan kata bekal', () => {
  const cards = buildStudyDeck(LESSON, { bridgeWords: LESSON.bridgeVocab });
  assert.deepEqual(wordsInDeck(cards).map((w) => w.zh), ['你', '好', '您', '呢']);
});

// ----------------------------------------------------------- catatan harian

test('sesi belajar menambah XP tanpa mengaku-aku sebagai ronde latihan', () => {
  const log = applyStudy({}, { xp: 20, minutes: 3 }, '2026-01-01');
  const day = log['2026-01-01'];

  assert.equal(day.xp, 20);
  assert.equal(day.studySessions, 1);
  assert.equal(day.rounds, 0, 'misi "selesaikan N pelajaran" hanya boleh maju lewat latihan');
  assert.equal(day.answered, 0);
  assert.equal(day.correct, 0);
});

test('sesi belajar berikutnya menumpuk di hari yang sama', () => {
  let log = applyStudy({}, { xp: 20 }, '2026-01-01');
  log = applyStudy(log, { xp: 5 }, '2026-01-01');
  assert.equal(log['2026-01-01'].xp, 25);
  assert.equal(log['2026-01-01'].studySessions, 2);
});

test('hari kosong sudah menyediakan penghitung sesi belajar', () => {
  assert.equal(emptyDay('2026-01-01').studySessions, 0);
});

// ------------------------------------------------------------ kunci latihan

/** Profil tiruan seperlunya, cukup untuk StudyService. */
function fakeProfiles(overrides = {}) {
  const store = { colin: { id: 'colin', xp: 0, studied: {}, dailyLog: {} }, ...overrides };
  return {
    store,
    data: (id) => store[id],
    profileConfig: (id) => ({ id, bridgePerLesson: 2 }),
    update(id, mutate) {
      store[id] = mutate({ ...store[id] });
      return store[id];
    }
  };
}

const fakeContent = {
  async loadLevel() {
    return { id: 'yct1', code: 'YCT 1', alsoIn: {}, lessons: [LESSON] };
  }
};

test('soal terkunci sebelum materi dibaca, terbuka setelahnya', async () => {
  const profiles = fakeProfiles();
  const study = new StudyService(fakeContent, profiles);

  assert.equal(study.canPractice('colin', 'yct1', 1), false);

  await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });
  study.finish();

  assert.equal(study.canPractice('colin', 'yct1', 1), true);
  assert.equal(study.canPractice('colin', 'yct1', 2), false, 'kunci berlaku per pelajaran');
});

test('hadiah penuh hanya sekali; mengulang tetap dihargai kecil', async () => {
  const profiles = fakeProfiles();
  const study = new StudyService(fakeContent, profiles);

  await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });
  const pertama = study.finish();
  await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });
  const kedua = study.finish();

  assert.equal(pertama.firstTime, true);
  assert.equal(pertama.xp, appConfig.study.xpFirstTime);
  assert.equal(kedua.firstTime, false);
  assert.equal(kedua.xp, appConfig.study.xpRepeat);
  assert.equal(profiles.store.colin.xp, appConfig.study.xpFirstTime + appConfig.study.xpRepeat);
  assert.equal(profiles.store.colin.studied[studyKey('yct1', 1)].count, 2);
});

test('sesi yang ditinggalkan sebelum selesai tidak membuka kunci', async () => {
  const profiles = fakeProfiles();
  const study = new StudyService(fakeContent, profiles);

  await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });
  study.next();
  study.abandon();

  assert.equal(study.canPractice('colin', 'yct1', 1), false);
  assert.equal(profiles.store.colin.xp, 0);
});

test('navigasi kartu berhenti di ujung-ujungnya', async () => {
  const profiles = fakeProfiles();
  const study = new StudyService(fakeContent, profiles);
  const session = await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });

  assert.equal(study.atStart(), true);
  assert.equal(study.prev(), null, 'kartu pertama tidak punya sebelumnya');

  for (let i = 0; i < session.cards.length + 3; i++) study.next();
  assert.equal(study.atEnd(), true);
  assert.equal(study.current().kind, 'outro');

  study.jumpTo(0);
  assert.equal(study.current().kind, 'intro');
});

test('jatah bekal tiap anak membatasi kartu yang muncul', async () => {
  const profiles = fakeProfiles();
  profiles.profileConfig = (id) => ({ id, bridgePerLesson: 1 });
  const study = new StudyService(fakeContent, profiles);
  const session = await study.start({ profileId: 'colin', levelId: 'yct1', lessonNumber: 1 });

  assert.equal(session.cards.filter((c) => c.kind === 'bridge').length, 1);
});

// --------------------------------------------------- bekal HSK di soal latihan

test('kata bekal ikut diuji, tapi selalu di belakang kata pelajaran', () => {
  const lesson = { ...LESSON, vocab: [word('你', 'kamu'), word('好', 'baik'), word('我', 'aku')] };
  const questions = buildRound({
    lesson,
    pool: lesson.vocab,
    levelId: 'yct1',
    skill: 'reading',
    bridgeWords: LESSON.bridgeVocab,
    count: 3,
    rng: () => 0.9 // jauh di atas ambang soal kalimat: selalu soal kata
  });

  const diuji = questions.map((q) => q.word?.zh);
  assert.deepEqual(diuji, ['你', '好', '我'], 'tiga soal pertama harus kata pelajaran');
});

test('ronde yang lebih panjang dari kosakata pelajaran menjangkau kata bekal', () => {
  const lesson = { ...LESSON, vocab: [word('你', 'kamu')] };
  const questions = buildRound({
    lesson,
    pool: lesson.vocab,
    levelId: 'yct1',
    skill: 'reading',
    bridgeWords: LESSON.bridgeVocab,
    count: 3,
    rng: () => 0.9
  });

  assert.deepEqual(questions.map((q) => q.word?.zh), ['你', '您', '呢']);
});

test('tanpa kata bekal, perilaku ronde tidak berubah', () => {
  const lesson = { ...LESSON, vocab: [word('你', 'kamu')] };
  const questions = buildRound({
    lesson,
    pool: lesson.vocab,
    levelId: 'yct1',
    skill: 'reading',
    count: 3,
    rng: () => 0.9
  });

  assert.deepEqual(questions.map((q) => q.word?.zh), ['你', '你', '你']);
});
