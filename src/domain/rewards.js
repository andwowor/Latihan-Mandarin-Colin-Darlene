// Katalog lencana (reward) dan evaluasinya.
// Setiap lencana adalah predikat murni atas ringkasan progres.

export const BADGES = [
  {
    id: 'first-step',
    emoji: '👣',
    titleId: 'Langkah Pertama',
    descId: 'Selesaikan satu ronde latihan',
    test: (s) => s.roundsCompleted >= 1
  },
  {
    id: 'perfect-round',
    emoji: '💯',
    titleId: 'Nilai Sempurna',
    descId: 'Satu ronde tanpa salah',
    test: (s) => s.perfectRounds >= 1
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    titleId: 'Tiga Hari Berturut',
    descId: 'Latihan 3 hari berturut-turut',
    test: (s) => s.longestStreak >= 3
  },
  {
    id: 'streak-7',
    emoji: '⚡',
    titleId: 'Satu Minggu Penuh',
    descId: 'Latihan 7 hari berturut-turut',
    test: (s) => s.longestStreak >= 7
  },
  {
    id: 'streak-30',
    emoji: '🏆',
    titleId: 'Sebulan Tanpa Bolos',
    descId: 'Latihan 30 hari berturut-turut',
    test: (s) => s.longestStreak >= 30
  },
  {
    id: 'words-25',
    emoji: '🌱',
    titleId: '25 Kata',
    descId: 'Kuasai 25 kata',
    test: (s) => s.masteredWords >= 25
  },
  {
    id: 'words-80',
    emoji: '🌳',
    titleId: '80 Kata',
    descId: 'Kuasai 80 kata (target YCT 1)',
    test: (s) => s.masteredWords >= 80
  },
  {
    id: 'words-150',
    emoji: '🌟',
    titleId: '150 Kata',
    descId: 'Kuasai 150 kata (target YCT 2)',
    test: (s) => s.masteredWords >= 150
  },
  {
    id: 'reader',
    emoji: '📖',
    titleId: 'Kutu Buku',
    descId: '100 soal membaca benar',
    test: (s) => (s.correctBySkill.reading || 0) >= 100
  },
  {
    id: 'listener',
    emoji: '🎧',
    titleId: 'Telinga Tajam',
    descId: '100 soal mendengar benar',
    test: (s) => (s.correctBySkill.listening || 0) >= 100
  },
  {
    id: 'writer',
    emoji: '✍️',
    titleId: 'Tangan Emas',
    descId: '100 soal menulis benar',
    test: (s) => (s.correctBySkill.writing || 0) >= 100
  },
  {
    id: 'level-5',
    emoji: '🚀',
    titleId: 'Level 5',
    descId: 'Capai level 5',
    test: (s) => s.level >= 5
  },
  {
    id: 'level-10',
    emoji: '👑',
    titleId: 'Level 10',
    descId: 'Capai level 10',
    test: (s) => s.level >= 10
  },
  {
    id: 'yct1-clear',
    emoji: '🥇',
    titleId: 'Tamat YCT 1',
    descId: 'Selesaikan semua pelajaran YCT 1',
    test: (s) => s.clearedLevels.includes('yct1')
  },
  {
    id: 'yct2-clear',
    emoji: '🥈',
    titleId: 'Tamat YCT 2',
    descId: 'Selesaikan semua pelajaran YCT 2',
    test: (s) => s.clearedLevels.includes('yct2')
  },
  {
    id: 'yct3-clear',
    emoji: '🥉',
    titleId: 'Tamat YCT 3',
    descId: 'Selesaikan semua pelajaran YCT 3',
    test: (s) => s.clearedLevels.includes('yct3')
  }
];

/** Kembalikan daftar id lencana yang sudah memenuhi syarat. */
export function evaluateBadges(summary) {
  return BADGES.filter((b) => {
    try {
      return b.test(summary);
    } catch {
      return false;
    }
  }).map((b) => b.id);
}

/** Lencana yang baru saja diraih (ada di `now` tapi belum di `before`). */
export function newlyEarned(beforeIds, nowIds) {
  const before = new Set(beforeIds);
  return nowIds.filter((id) => !before.has(id)).map((id) => BADGES.find((b) => b.id === id));
}

export function badgeById(id) {
  return BADGES.find((b) => b.id === id);
}
