// Uji laporan progres, khususnya perbandingan ketepatan dua anak.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { StatsService } from '../src/application/statsService.js';
import { appConfig } from '../src/config/appConfig.js';
import { emptyDay } from '../src/domain/progress.js';

const HARI = '2026-01-15';

/** Profil tiruan dengan catatan harian yang bisa diatur per keterampilan. */
function fakeProfiles(bySkillPerChild) {
  const store = {};
  for (const p of appConfig.profiles) {
    const day = { ...emptyDay(HARI), answered: 0, correct: 0 };
    day.bySkill = bySkillPerChild[p.id] || {};
    for (const stat of Object.values(day.bySkill)) {
      day.answered += stat.answered;
      day.correct += stat.correct;
    }
    store[p.id] = { id: p.id, xp: 0, dailyLog: { [HARI]: day }, cards: {}, stats: {} };
  }
  return {
    data: (id) => store[id],
    profileConfig: (id) => appConfig.profiles.find((p) => p.id === id)
  };
}

test('perbandingan memuat kedua anak untuk setiap keterampilan', () => {
  const stats = new StatsService(
    fakeProfiles({
      colin: { reading: { answered: 50, correct: 41 } },
      darlene: { reading: { answered: 28, correct: 17 } }
    })
  );

  const rows = stats.skillComparison('daily', HARI);

  assert.equal(rows.length, appConfig.skills.length, 'semua keterampilan harus muncul');
  for (const row of rows) {
    assert.equal(row.entries.length, 2, `${row.id} harus memuat dua anak`);
  }

  const membaca = rows.find((r) => r.id === 'reading');
  assert.deepEqual(
    membaca.entries.map((e) => [e.profile.id, e.accuracy, e.correct, e.answered]),
    [
      ['colin', 82, 41, 50],
      ['darlene', 61, 17, 28]
    ]
  );
});

test('urutan anak tetap, tidak mengikuti siapa yang sedang masuk', () => {
  const stats = new StatsService(fakeProfiles({}));
  const urutan = stats.skillComparison('daily', HARI)[0].entries.map((e) => e.profile.id);
  assert.deepEqual(urutan, appConfig.profiles.map((p) => p.id));
});

test('setiap anak membawa warna identitasnya sendiri', () => {
  const stats = new StatsService(fakeProfiles({}));
  const entries = stats.skillComparison('daily', HARI)[0].entries;

  for (const e of entries) {
    const cfg = appConfig.profiles.find((p) => p.id === e.profile.id);
    assert.equal(e.profile.color, cfg.color);
  }
  assert.notEqual(entries[0].profile.color, entries[1].profile.color, 'dua anak tidak boleh sewarna');
});

test('"belum dicoba" dibedakan dari "dicoba tapi semua salah"', () => {
  const stats = new StatsService(
    fakeProfiles({
      colin: { writing: { answered: 6, correct: 0 } } // dicoba, semuanya salah
      // darlene: sama sekali tidak menyentuh menulis
    })
  );

  const menulis = stats.skillComparison('daily', HARI).find((r) => r.id === 'writing');
  const [colin, darlene] = menulis.entries;

  assert.equal(colin.tried, true, 'menjawab 6 soal berarti sudah mencoba');
  assert.equal(colin.accuracy, 0);
  assert.equal(darlene.tried, false, 'tidak menjawab satu pun berarti belum mencoba');
  assert.equal(darlene.accuracy, 0);
  assert.equal(menulis.anyTried, true, 'salah satu anak sudah mencoba');
});

test('keterampilan yang belum disentuh siapa pun ditandai', () => {
  const stats = new StatsService(fakeProfiles({ colin: { reading: { answered: 4, correct: 4 } } }));
  const rows = stats.skillComparison('daily', HARI);

  assert.equal(rows.find((r) => r.id === 'reading').anyTried, true);
  assert.equal(rows.find((r) => r.id === 'speaking').anyTried, false);
});

test('perbandingan membawa nama dan lambang keterampilan untuk ditampilkan', () => {
  const stats = new StatsService(fakeProfiles({}));
  for (const row of stats.skillComparison('daily', HARI)) {
    const cfg = appConfig.skills.find((s) => s.id === row.id);
    assert.equal(row.labelId, cfg.labelId);
    assert.equal(row.emoji, cfg.emoji);
  }
});
