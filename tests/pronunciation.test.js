// Uji penilaian latihan berbicara.
// Semua fungsi murni, jadi tidak butuh mikrofon maupun peramban.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeHan, similarity, missingChars,
  gradeSpeech, speechStars, speechFeedbackId
} from '../src/domain/pronunciation.js';
import { buildRound, grade } from '../src/domain/exerciseFactory.js';

// ---------------------------------------------------------------- normalisasi

test('normalisasi membuang spasi dan tanda baca Han maupun Latin', () => {
  assert.equal(normalizeHan('你好！'), '你好');
  assert.equal(normalizeHan('我 很 好 。'), '我很好');
  assert.equal(normalizeHan('认识你，很高兴！'), '认识你很高兴');
  assert.equal(normalizeHan('Hello, world!'), 'helloworld');
  assert.equal(normalizeHan(null), '');
  assert.equal(normalizeHan(undefined), '');
});

// ---------------------------------------------------------------- kemiripan

test('kemiripan bernilai 1 untuk ucapan yang persis sama', () => {
  assert.equal(similarity('你好', '你好'), 1);
  assert.equal(similarity('你好', '你好。'), 1, 'tanda baca tidak boleh berpengaruh');
  assert.equal(similarity('我很好', '我 很 好'), 1, 'spasi tidak boleh berpengaruh');
});

test('kemiripan turun sesuai jumlah karakter yang meleset', () => {
  assert.equal(similarity('你好', '你号'), 0.5, 'satu dari dua karakter salah');
  assert.ok(similarity('我很好', '我很号') > 0.6, 'dua dari tiga benar masih lulus');
  assert.equal(similarity('你好', ''), 0);
  assert.equal(similarity('', ''), 1);
});

test('kemiripan simetris dan terbatas 0..1', () => {
  for (const [a, b] of [['你好', '老师'], ['我很好', '你好'], ['谢谢', '谢谢你']]) {
    const ab = similarity(a, b);
    assert.equal(ab, similarity(b, a));
    assert.ok(ab >= 0 && ab <= 1, `${ab} harus antara 0 dan 1`);
  }
});

// ------------------------------------------------------------------ penilaian

test('ucapan yang tepat dinilai benar', () => {
  const r = gradeSpeech('你好', '你好');
  assert.equal(r.correct, true);
  assert.equal(r.score, 1);
  assert.deepEqual(r.missing, []);
});

test('penilaian longgar: satu karakter meleset pada kalimat masih lulus', () => {
  // Anak 5 tahun + pengenal suara yang tidak sempurna: 3 dari 4 benar cukup.
  const r = gradeSpeech('认识你很高兴', '认识你很高心');
  assert.ok(r.score >= 0.8, `nilai ${r.score} seharusnya tinggi`);
  assert.equal(r.correct, true);
});

test('ucapan yang jauh berbeda ditolak', () => {
  const r = gradeSpeech('你好', '再见');
  assert.equal(r.correct, false);
  assert.ok(r.score < 0.6);
});

test('alternatif terbaik dari pengenal suara yang dipakai', () => {
  // Pengenal suara mengembalikan beberapa tebakan; ambil yang paling mirip.
  const r = gradeSpeech('谢谢', ['写写', '谢谢', '鞋鞋']);
  assert.equal(r.correct, true);
  assert.equal(r.score, 1);
  assert.equal(r.heard, '谢谢');
});

test('tidak ada suara sama sekali ditandai empty, bukan salah biasa', () => {
  const r = gradeSpeech('你好', []);
  assert.equal(r.empty, true);
  assert.equal(r.correct, false);
  assert.equal(r.score, 0);
  assert.deepEqual(r.missing, ['你', '好']);
});

test('ambang lulus bisa disetel', () => {
  const heard = '你号';                       // 50% mirip
  assert.equal(gradeSpeech('你好', heard, 0.4).correct, true);
  assert.equal(gradeSpeech('你好', heard, 0.9).correct, false);
});

test('karakter yang belum terucap dilaporkan', () => {
  assert.deepEqual(missingChars('我很好', '我好'), ['很']);
  assert.deepEqual(missingChars('你好', '你好'), []);
});

// ------------------------------------------------------------ umpan balik

test('bintang naik seiring ketepatan', () => {
  assert.equal(speechStars(1), 3);
  assert.equal(speechStars(0.85), 2);
  assert.equal(speechStars(0.65), 1);
  assert.equal(speechStars(0.3), 0);
});

test('pujian selalu ada dan berbeda tiap tingkat', () => {
  const pesan = [1, 0.85, 0.65, 0.3, 0].map(speechFeedbackId);
  for (const m of pesan) assert.ok(m.length > 0);
  assert.equal(new Set(pesan).size, 5, 'tiap tingkat punya pesan sendiri');
});

// -------------------------------------------------- integrasi dengan soal

const LESSON = {
  number: 1,
  titleZh: '你好！',
  keySentences: [
    { zh: '你好！', py: 'Nǐ hǎo!', en: 'Hello!', id: 'Halo!' },
    { zh: '再见！', py: 'Zàijiàn!', en: 'Goodbye!', id: 'Sampai jumpa!' }
  ],
  vocab: [
    { zh: '你', py: 'nǐ', en: 'you', id: 'kamu' },
    { zh: '好', py: 'hǎo', en: 'good', id: 'baik' },
    { zh: '老师', py: 'lǎoshī', en: 'teacher', id: 'guru' },
    { zh: '再见', py: 'zàijiàn', en: 'goodbye', id: 'sampai jumpa' }
  ],
  listeningScripts: ['你好。']
};

test('soal berbicara punya target dan teks yang dibacakan', () => {
  const qs = buildRound({ lesson: LESSON, pool: LESSON.vocab, levelId: 'yct1', skill: 'speaking', count: 10 });
  assert.equal(qs.length, 10);
  for (const q of qs) {
    assert.equal(q.skill, 'speaking');
    assert.ok(q.target, 'harus ada kata/kalimat yang dinilai');
    assert.ok(q.speak, 'harus ada contoh suara untuk diperdengarkan');
    assert.ok(q.instructionId, 'harus ada instruksi untuk anak');
    assert.ok(['sayWord', 'saySentence', 'repeatAfter'].includes(q.type));
    // Soal "tirukan" menyembunyikan tulisannya.
    if (q.type === 'repeatAfter') {
      assert.equal(q.hideTarget, true);
      assert.equal(q.prompt, null);
    }
  }
});

test('grade() menilai soal berbicara lewat pengenal suara', () => {
  const q = { skill: 'speaking', type: 'sayWord', target: '老师' };
  assert.equal(grade(q, { transcripts: ['老师'] }).correct, true);
  assert.equal(grade(q, { transcripts: ['再见'] }).correct, false);
  assert.equal(grade(q, { transcripts: [] }).correct, false);
  // Ambang bisa dilonggarkan lewat opts.
  assert.equal(grade(q, { transcripts: ['老是'] }, { acceptScore: 0.4 }).correct, true);
});

test('grade() menghormati penilaian sendiri saat pengenal suara tidak ada', () => {
  const q = { skill: 'speaking', type: 'sayWord', target: '老师' };
  const ok = grade(q, { selfAssessed: true, ok: true });
  assert.equal(ok.correct, true);
  assert.equal(ok.selfAssessed, true);
  assert.equal(grade(q, { selfAssessed: true, ok: false }).correct, false);
});

test('mode campur menyertakan keempat keterampilan', () => {
  const qs = buildRound({ lesson: LESSON, pool: LESSON.vocab, levelId: 'yct1', skill: 'mixed', count: 12 });
  const skills = new Set(qs.map((q) => q.skill));
  for (const s of ['reading', 'listening', 'speaking', 'writing']) {
    assert.ok(skills.has(s), `mode campur harus memuat ${s}`);
  }
});
