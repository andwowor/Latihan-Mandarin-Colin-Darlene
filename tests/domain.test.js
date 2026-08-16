// Uji lapisan domain. Semuanya fungsi murni, jadi tidak butuh browser.
// Jalankan dengan: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { comboMultiplier, xpForAnswer, levelFromXp, xpNeededForLevel, starsForRound, roundXp } from '../src/domain/scoring.js';
import { computeStreak, dailyGoalState } from '../src/domain/streak.js';
import { newCard, reviewCard, isDue, isMastered, prioritise } from '../src/domain/srs.js';
import { missionsForDay, evaluateMissions, MISSION_KINDS, ALL_MISSIONS_BONUS_XP } from '../src/domain/missions.js';
import { applyRound, totalsForPeriod, emptyDay, recentDayKeys, compareProfiles } from '../src/domain/progress.js';
import { buildRound, grade, segmentSentence, wordKey } from '../src/domain/exerciseFactory.js';
import { evaluateBadges, BADGES, BADGE_GROUPS, groupedBadges, nextBadges } from '../src/domain/rewards.js';

// ------------------------------------------------------------------ scoring

test('combo naik tiap 3 jawaban benar dan berhenti di batas', () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(2), 1);
  assert.equal(comboMultiplier(3), 2);
  assert.equal(comboMultiplier(6), 3);
  assert.equal(comboMultiplier(30), 3, 'tidak boleh melewati comboMaxMultiplier');
});

test('xp per jawaban ikut combo', () => {
  assert.equal(xpForAnswer(0), 10);
  assert.equal(xpForAnswer(3), 20);
  assert.equal(xpForAnswer(9), 30);
});

test('bonus ronde sempurna dan penyelesaian pertama', () => {
  assert.equal(roundXp({ baseXp: 100, correct: 10, total: 10, firstClear: false }), 125);
  assert.equal(roundXp({ baseXp: 100, correct: 10, total: 10, firstClear: true }), 155);
  assert.equal(roundXp({ baseXp: 100, correct: 9, total: 10, firstClear: false }), 100);
});

test('level naik seiring xp dan ambangnya menaik', () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(xpNeededForLevel(1), 0);
  assert.ok(xpNeededForLevel(3) > xpNeededForLevel(2));

  const atL2 = xpNeededForLevel(2);
  assert.equal(levelFromXp(atL2).level, 2);
  assert.equal(levelFromXp(atL2 - 1).level, 1);

  const info = levelFromXp(atL2);
  assert.equal(info.xpIntoLevel, 0);
  assert.ok(info.progress >= 0 && info.progress <= 1);
});

test('bintang mengikuti ketepatan', () => {
  assert.equal(starsForRound(10, 10), 3);
  assert.equal(starsForRound(8, 10), 2);
  assert.equal(starsForRound(6, 10), 1);
  assert.equal(starsForRound(3, 10), 0);
});

// ------------------------------------------------------------------- streak

test('streak menghitung hari berturut-turut', () => {
  const s = computeStreak(['2026-08-10', '2026-08-11', '2026-08-12'], '2026-08-12');
  assert.equal(s.current, 3);
  assert.equal(s.longest, 3);
  assert.equal(s.activeToday, true);
});

test('streak masih hidup bila kemarin latihan tapi hari ini belum', () => {
  const s = computeStreak(['2026-08-10', '2026-08-11'], '2026-08-12');
  assert.equal(s.current, 2);
  assert.equal(s.activeToday, false);
});

test('streak putus bila bolong lebih dari sehari', () => {
  const s = computeStreak(['2026-08-01', '2026-08-02'], '2026-08-12');
  assert.equal(s.current, 0);
  assert.equal(s.longest, 2);
});

test('target harian', () => {
  assert.equal(dailyGoalState(60, 60).reached, true);
  assert.equal(dailyGoalState(30, 60).progress, 0.5);
});

// ---------------------------------------------------------------------- srs

test('kartu naik kotak saat benar dan jatuh saat salah', () => {
  let card = newCard('yct1:你好', '2026-08-12');
  card = reviewCard(card, true, '2026-08-12');
  assert.equal(card.box, 1);
  assert.equal(card.dueOn, '2026-08-13');

  card = reviewCard(card, true, '2026-08-13');
  assert.equal(card.box, 2);

  card = reviewCard(card, false, '2026-08-14');
  assert.equal(card.box, 0, 'salah mengembalikan kartu ke kotak awal');
  assert.equal(card.seen, 3);
  assert.equal(card.correct, 2);
});

test('kartu dianggap dikuasai mulai kotak 4', () => {
  let card = newCard('k', '2026-08-12');
  for (let i = 0; i < 4; i++) card = reviewCard(card, true, '2026-08-12');
  assert.equal(card.box, 4);
  assert.equal(isMastered(card), true);
});

test('kata yang belum pernah dilihat diprioritaskan', () => {
  const cards = { a: { ...newCard('a'), box: 5, dueOn: '2099-01-01' } };
  const order = prioritise(['a', 'b'], cards, '2026-08-12');
  assert.equal(order[0], 'b');
});

test('isDue benar untuk kartu jatuh tempo', () => {
  assert.equal(isDue({ dueOn: '2026-08-12' }, '2026-08-12'), true);
  assert.equal(isDue({ dueOn: '2026-08-13' }, '2026-08-12'), false);
});

// ----------------------------------------------------------------- missions

test('misi harian selalu tiga jenis yang diminta', () => {
  const m = missionsForDay('2026-08-12', 'colin', 60);
  assert.equal(m.length, 3);
  assert.deepEqual(
    m.map((x) => x.id).sort(),
    [MISSION_KINDS.LESSONS, MISSION_KINDS.PERFECT, MISSION_KINDS.XP].sort()
  );
});

test('misi sama sepanjang hari, berbeda antar anak dan antar hari', () => {
  const a1 = missionsForDay('2026-08-12', 'colin', 60).map((m) => m.target);
  const a2 = missionsForDay('2026-08-12', 'colin', 60).map((m) => m.target);
  assert.deepEqual(a1, a2, 'harus stabil dalam hari yang sama');

  const darlene = missionsForDay('2026-08-12', 'darlene', 40).map((m) => m.target);
  assert.notDeepEqual(a1, darlene, 'anak berbeda -> target berbeda');

  // Sepanjang 30 hari harus ada variasi target.
  const variants = new Set(
    Array.from({ length: 30 }, (_, i) => missionsForDay(`2026-09-${String(i + 1).padStart(2, '0')}`, 'colin', 60)[0].target)
  );
  assert.ok(variants.size > 1, 'target harus berayun antar hari');
});

test('target Darlene lebih ringan daripada Colin', () => {
  const colin = missionsForDay('2026-08-12', 'colin', 60);
  const darlene = missionsForDay('2026-08-12', 'darlene', 40);
  const xpC = colin.find((m) => m.id === MISSION_KINDS.XP).target;
  const xpD = darlene.find((m) => m.id === MISSION_KINDS.XP).target;
  assert.ok(xpD < xpC, `xp Darlene (${xpD}) harus < Colin (${xpC})`);
});

test('evaluasi misi menghitung kemajuan dan hadiah', () => {
  const missions = missionsForDay('2026-08-12', 'colin', 60);
  const lessons = missions.find((m) => m.id === MISSION_KINDS.LESSONS);
  const xp = missions.find((m) => m.id === MISSION_KINDS.XP);
  const perfect = missions.find((m) => m.id === MISSION_KINDS.PERFECT);

  const kosong = evaluateMissions(missions, emptyDay('2026-08-12'), []);
  assert.equal(kosong.completed, 0);
  assert.equal(kosong.pendingXp, 0);

  const day = {
    ...emptyDay('2026-08-12'),
    rounds: lessons.target,
    xp: xp.target,
    perfectRounds: perfect.target
  };
  const penuh = evaluateMissions(missions, day, []);
  assert.equal(penuh.completed, 3);
  assert.equal(penuh.allDone, true);
  const expected = missions.reduce((a, m) => a + m.reward, 0) + ALL_MISSIONS_BONUS_XP;
  assert.equal(penuh.pendingXp, expected, 'hadiah termasuk bonus semua misi');

  // Setelah diambil, tidak boleh dibayar dua kali.
  const claimed = evaluateMissions(missions, day, [...missions.map((m) => m.id), 'all-missions-bonus']);
  assert.equal(claimed.pendingXp, 0);
});

// ----------------------------------------------------------------- progress

test('applyRound menambah catatan harian termasuk ronde & ronde sempurna', () => {
  let log = applyRound({}, {
    xp: 50, answered: 10, correct: 10, minutes: 3,
    bySkill: { reading: { answered: 10, correct: 10 } },
    perfect: true, stars: 3, bestCombo: 10
  }, '2026-08-12');

  assert.equal(log['2026-08-12'].rounds, 1);
  assert.equal(log['2026-08-12'].perfectRounds, 1);
  assert.equal(log['2026-08-12'].starsEarned, 3);
  assert.equal(log['2026-08-12'].bestCombo, 10);

  log = applyRound(log, {
    xp: 20, answered: 10, correct: 6, minutes: 2,
    bySkill: { reading: { answered: 10, correct: 6 } },
    perfect: false, stars: 1, bestCombo: 3
  }, '2026-08-12');

  const d = log['2026-08-12'];
  assert.equal(d.rounds, 2);
  assert.equal(d.perfectRounds, 1);
  assert.equal(d.xp, 70);
  assert.equal(d.answered, 20);
  assert.equal(d.bySkill.reading.correct, 16);
  assert.equal(d.bestCombo, 10, 'combo terbaik dipertahankan');
});

test('total periode menghitung ketepatan dan hari aktif', () => {
  const log = applyRound({}, {
    xp: 40, answered: 10, correct: 8, minutes: 4,
    bySkill: { listening: { answered: 10, correct: 8 } },
    perfect: false, stars: 2, bestCombo: 4
  }, '2026-08-12');

  const t = totalsForPeriod(log, 'weekly', '2026-08-12');
  assert.equal(t.xp, 40);
  assert.equal(t.accuracy, 80);
  assert.equal(t.activeDays, 1);
  assert.equal(t.days.length, 7);
});

test('rentang hari sesuai periode', () => {
  assert.equal(recentDayKeys(1, '2026-08-12')[0], '2026-08-12');
  assert.equal(recentDayKeys(7, '2026-08-12').length, 7);
  assert.equal(recentDayKeys(365, '2026-08-12').length, 365);
});

test('perbandingan dua anak menentukan pemenang', () => {
  const a = { dailyLog: applyRound({}, { xp: 100, answered: 10, correct: 10, minutes: 1, bySkill: {}, perfect: true, stars: 3, bestCombo: 10 }, '2026-08-12') };
  const b = { dailyLog: applyRound({}, { xp: 40, answered: 10, correct: 4, minutes: 1, bySkill: {}, perfect: false, stars: 0, bestCombo: 1 }, '2026-08-12') };
  const cmp = compareProfiles(a, b, 'daily', '2026-08-12');
  assert.equal(cmp.leader, 'a');
  assert.equal(cmp.gap, 60);
});

// --------------------------------------------------------- exerciseFactory

const LESSON = {
  number: 1,
  titleZh: '你好！',
  titleId: 'Halo!',
  keySentences: [
    { zh: '你好！', py: 'Nǐ hǎo!', en: 'Hello!', id: 'Halo!' },
    { zh: '再见！', py: 'Zàijiàn!', en: 'Goodbye!', id: 'Sampai jumpa!' },
    { zh: '老师好！', py: 'Lǎoshī hǎo!', en: 'Hello teacher!', id: 'Halo Bu Guru!' },
    { zh: '我很好。', py: 'Wǒ hěn hǎo.', en: 'I am fine.', id: 'Aku baik-baik saja.' }
  ],
  vocab: [
    { zh: '你', py: 'nǐ', en: 'you', id: 'kamu' },
    { zh: '好', py: 'hǎo', en: 'good', id: 'baik' },
    { zh: '老师', py: 'lǎoshī', en: 'teacher', id: 'guru' },
    { zh: '再见', py: 'zàijiàn', en: 'goodbye', id: 'sampai jumpa' },
    { zh: '我', py: 'wǒ', en: 'I', id: 'aku' },
    { zh: '很', py: 'hěn', en: 'very', id: 'sangat' }
  ],
  listeningScripts: ['你好。', '老师再见。', '我很好。', '再见。']
};

for (const skill of ['reading', 'listening', 'writing', 'mixed']) {
  test(`buildRound menghasilkan soal valid untuk ${skill}`, () => {
    const qs = buildRound({
      lesson: LESSON,
      pool: LESSON.vocab,
      levelId: 'yct1',
      skill,
      count: 10
    });

    assert.equal(qs.length, 10, 'jumlah soal harus sesuai permintaan');

    for (const q of qs) {
      assert.ok(q.id && q.skill && q.type, 'soal harus punya identitas');
      assert.ok(q.instructionId, 'harus ada instruksi untuk anak');
      if (skill !== 'mixed') assert.equal(q.skill, skill);

      if (q.options?.length) {
        assert.ok(q.options.includes(q.answer), `jawaban "${q.answer}" harus ada di pilihan`);
        assert.equal(new Set(q.options).size, q.options.length, 'pilihan tidak boleh kembar');
        assert.ok(q.options.length >= 2, 'minimal dua pilihan');
        // Kunci jawaban berfungsi.
        assert.equal(grade(q, q.answer).correct, true);
        const salah = q.options.find((o) => o !== q.answer);
        assert.equal(grade(q, salah).correct, false);
      }

      if (q.type === 'assemble' || q.type === 'buildSentence') {
        assert.ok(q.tiles?.length, 'harus ada kepingan huruf');
        for (const ch of q.answer) {
          assert.ok(q.tiles.includes(ch) || q.tiles.some((t) => t.includes(ch)),
            `kepingan harus memuat "${ch}"`);
        }
        assert.equal(grade(q, q.answer).correct, true);
      }

      if (q.skill === 'listening') {
        assert.ok(q.speak, 'soal menyimak wajib punya teks yang dibacakan');
      }
    }
  });
}

test('soal menulis "trace" dinilai dari kemiripan coretan', () => {
  const q = { type: 'trace', answer: '你' };
  assert.equal(grade(q, { coverage: 0.9 }).correct, true);
  assert.equal(grade(q, { coverage: 0.61 }).correct, true);
  assert.equal(grade(q, { coverage: 0.2 }).correct, false);
  assert.equal(grade(q, null).correct, false);
});

test('pemenggalan kalimat memakai pinyin sebagai petunjuk', () => {
  assert.deepEqual(segmentSentence('我很好', 'Wǒ hěn hǎo'), ['我', '很', '好']);
  assert.deepEqual(segmentSentence('认识你很高兴', 'Rènshi nǐ hěn gāoxìng'), ['认识', '你', '很', '高兴']);
  // Bila pinyin tidak cocok, jatuh ke pemecahan per karakter.
  assert.deepEqual(segmentSentence('你好', 'salah hitung sekali'), ['你', '好']);
});

test('wordKey unik per level', () => {
  assert.equal(wordKey('yct1', { zh: '你好' }), 'yct1:你好');
  assert.notEqual(wordKey('yct1', { zh: '好' }), wordKey('yct2', { zh: '好' }));
});

test('pelajaran tanpa isi tidak menghasilkan soal', () => {
  const qs = buildRound({ lesson: { vocab: [], keySentences: [] }, pool: [], levelId: 'x', skill: 'reading', count: 5 });
  assert.equal(qs.length, 0);
});

// ----------------------------------------------------------------- rewards

test('lencana diberikan sesuai pencapaian', () => {
  const none = evaluateBadges({
    roundsCompleted: 0, perfectRounds: 0, longestStreak: 0,
    masteredWords: 0, correctBySkill: {}, level: 1, clearedLevels: []
  });
  assert.equal(none.length, 0);

  const some = evaluateBadges({
    roundsCompleted: 1, perfectRounds: 1, longestStreak: 7,
    masteredWords: 25, correctBySkill: { reading: 100 }, level: 5, clearedLevels: ['yct1']
  });
  assert.ok(some.includes('first-step'));
  assert.ok(some.includes('perfect-round'));
  assert.ok(some.includes('streak-7'));
  assert.ok(some.includes('words-25'));
  assert.ok(some.includes('reader'));
  assert.ok(some.includes('level-5'));
  assert.ok(some.includes('yct1-clear'));
  assert.ok(!some.includes('streak-30'));
  assert.ok(!some.includes('words-150'));
});

// ------------------------------------------------------------------ lencana

test('katalog lencana tidak punya id maupun lambang kembar', () => {
  const ids = BADGES.map((b) => b.id);
  const emojis = BADGES.map((b) => b.emoji);
  assert.equal(new Set(ids).size, ids.length, 'id lencana harus unik');
  assert.equal(new Set(emojis).size, emojis.length, 'lambang lencana harus unik agar mudah dibedakan');
});

test('setiap lencana lengkap dan masuk kelompok yang dikenal', () => {
  const groups = new Set(BADGE_GROUPS.map((g) => g.id));
  for (const b of BADGES) {
    assert.ok(b.titleId && b.descId, `${b.id} kekurangan judul atau keterangan`);
    assert.equal(typeof b.test, 'function', `${b.id} tidak punya syarat`);
    assert.ok(groups.has(b.group), `${b.id} berada di kelompok tak dikenal: ${b.group}`);
  }
});

test('progres kosong tidak memberi satu lencana pun', () => {
  const kosong = {
    xp: 0, level: 1, roundsCompleted: 0, perfectRounds: 0, longestStreak: 0,
    masteredWords: 0, seenWords: 0, correctBySkill: {}, studiedLessons: 0,
    threeStarLessons: 0, activeDays: 0, goalDays: 0, bestCombo: 0,
    totalAnswered: 0, totalMinutes: 0, clearedLevels: []
  };
  assert.deepEqual(evaluateBadges(kosong), []);
});

test('ringkasan yang tidak lengkap tidak menjatuhkan evaluasi', () => {
  // Cadangan data lama bisa saja tidak punya medan-medan baru.
  assert.doesNotThrow(() => evaluateBadges({ clearedLevels: [] }));
  assert.doesNotThrow(() => evaluateBadges({}));
});

test('lencana bertingkat: capaian besar ikut membuka tingkat di bawahnya', () => {
  const ids = evaluateBadges({
    xp: 6000, level: 16, roundsCompleted: 60, perfectRounds: 12, longestStreak: 15,
    masteredWords: 260, seenWords: 320, studiedLessons: 33, threeStarLessons: 11,
    activeDays: 55, goalDays: 12, bestCombo: 21, totalAnswered: 2100, totalMinutes: 620,
    correctBySkill: { reading: 310, listening: 310, speaking: 210, writing: 205 },
    clearedLevels: ['yct1', 'yct2']
  });

  for (const id of ['rounds-10', 'rounds-50', 'words-25', 'words-80', 'words-150', 'words-250',
                    'streak-3', 'streak-7', 'streak-14', 'study-1', 'study-10', 'study-30',
                    'level-5', 'level-10', 'level-15', 'xp-1000', 'xp-5000',
                    'reader', 'reader-pro', 'all-four-skills', 'all-four-master',
                    'combo-10', 'combo-20', 'yct1-clear', 'yct2-clear']) {
    assert.ok(ids.includes(id), `${id} seharusnya sudah diraih`);
  }
  for (const id of ['rounds-200', 'words-400', 'streak-30', 'level-20', 'xp-20000',
                    'yct3-clear', 'yct-all', 'three-star-40']) {
    assert.ok(!ids.includes(id), `${id} belum boleh diraih`);
  }
});

test('lencana "Naga YCT" hanya terbuka bila seluruh jalur YCT tamat', () => {
  const enam = ['yct1', 'yct2', 'yct3', 'yct4', 'yct5', 'yct6'];
  assert.ok(evaluateBadges({ clearedLevels: enam }).includes('yct-all'));
  assert.ok(!evaluateBadges({ clearedLevels: enam.slice(0, 5) }).includes('yct-all'));
});

test('pengelompokan mencakup seluruh lencana dan menghitung yang sudah diraih', () => {
  const groups = groupedBadges(['first-step', 'streak-3', 'streak-7']);
  const total = groups.reduce((a, g) => a + g.total, 0);
  const earned = groups.reduce((a, g) => a + g.earnedCount, 0);

  assert.equal(total, BADGES.length, 'tidak boleh ada lencana yang tercecer di luar kelompok');
  assert.equal(earned, 3);
  assert.equal(groups.find((g) => g.id === 'tekun').earnedCount, 2);
});

test('incaran berikutnya hanya berisi lencana yang belum diraih', () => {
  const semua = BADGES.map((b) => b.id);
  const next = nextBadges(['first-step'], 3);
  assert.equal(next.length, 3);
  assert.ok(!next.some((b) => b.id === 'first-step'));
  assert.deepEqual(nextBadges(semua, 3), [], 'kalau sudah lengkap, tidak ada incaran');
});

test('incaran berikutnya diambil dari kelompok berbeda-beda', () => {
  const next = nextBadges([], 3);
  const kelompok = next.map((b) => b.group);
  assert.equal(new Set(kelompok).size, 3, 'tiga incaran harus dari tiga kelompok berbeda');
});
