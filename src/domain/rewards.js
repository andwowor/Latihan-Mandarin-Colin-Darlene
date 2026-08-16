// Katalog lencana (reward) dan evaluasinya.
// Setiap lencana adalah predikat murni atas ringkasan progres.
//
// Katalognya sengaja bertingkat: hampir setiap capaian punya jenjang
// berikutnya, supaya selalu ada target yang terasa dekat. Lencana juga
// dikelompokkan agar galerinya tetap terbaca meski isinya banyak.
//
// Ringkasan yang diterima `test` dirakit di application/profileService.js:
//   xp, level, roundsCompleted, perfectRounds, longestStreak, activeDays,
//   goalDays, masteredWords, seenWords, correctBySkill, studiedLessons,
//   threeStarLessons, bestCombo, totalAnswered, totalMinutes, clearedLevels

export const BADGE_GROUPS = [
  { id: 'mulai',      titleId: 'Langkah Awal',   emoji: '👣' },
  { id: 'belajar',    titleId: 'Sesi Belajar',   emoji: '📘' },
  { id: 'tekun',      titleId: 'Ketekunan',      emoji: '🔥' },
  { id: 'kosakata',   titleId: 'Kosakata',       emoji: '🌳' },
  { id: 'terampil',   titleId: 'Keterampilan',   emoji: '🌈' },
  { id: 'sempurna',   titleId: 'Kesempurnaan',   emoji: '💯' },
  { id: 'perjalanan', titleId: 'Perjalanan',     emoji: '🗺️' }
];

const SKILLS = ['reading', 'listening', 'speaking', 'writing'];
const YCT_LEVELS = ['yct1', 'yct2', 'yct3', 'yct4', 'yct5', 'yct6'];

const skillCount = (s, id) => s.correctBySkill?.[id] || 0;

export const BADGES = [
  // ------------------------------------------------------------ Langkah Awal
  { id: 'first-step',  group: 'mulai', emoji: '👣', titleId: 'Langkah Pertama',
    descId: 'Selesaikan satu ronde latihan', test: (s) => s.roundsCompleted >= 1 },
  { id: 'rounds-10',   group: 'mulai', emoji: '🎯', titleId: '10 Ronde',
    descId: 'Selesaikan 10 ronde latihan', test: (s) => s.roundsCompleted >= 10 },
  { id: 'rounds-50',   group: 'mulai', emoji: '🎖️', titleId: '50 Ronde',
    descId: 'Selesaikan 50 ronde latihan', test: (s) => s.roundsCompleted >= 50 },
  { id: 'rounds-200',  group: 'mulai', emoji: '🏵️', titleId: '200 Ronde',
    descId: 'Selesaikan 200 ronde latihan', test: (s) => s.roundsCompleted >= 200 },
  { id: 'answered-500', group: 'mulai', emoji: '🧮', titleId: '500 Soal',
    descId: 'Jawab 500 soal', test: (s) => s.totalAnswered >= 500 },
  { id: 'answered-2000', group: 'mulai', emoji: '🧠', titleId: '2.000 Soal',
    descId: 'Jawab 2.000 soal', test: (s) => s.totalAnswered >= 2000 },

  // ------------------------------------------------------------ Sesi Belajar
  { id: 'study-1',   group: 'belajar', emoji: '📘', titleId: 'Baca Dulu',
    descId: 'Tuntaskan materi satu pelajaran', test: (s) => s.studiedLessons >= 1 },
  { id: 'study-10',  group: 'belajar', emoji: '📗', titleId: '10 Materi',
    descId: 'Tuntaskan materi 10 pelajaran', test: (s) => s.studiedLessons >= 10 },
  { id: 'study-30',  group: 'belajar', emoji: '📚', titleId: '30 Materi',
    descId: 'Tuntaskan materi 30 pelajaran', test: (s) => s.studiedLessons >= 30 },
  { id: 'study-60',  group: 'belajar', emoji: '🎒', titleId: '60 Materi',
    descId: 'Tuntaskan materi 60 pelajaran', test: (s) => s.studiedLessons >= 60 },
  { id: 'minutes-60', group: 'belajar', emoji: '⏳', titleId: 'Satu Jam',
    descId: 'Total 60 menit belajar', test: (s) => s.totalMinutes >= 60 },
  { id: 'minutes-600', group: 'belajar', emoji: '🕰️', titleId: 'Sepuluh Jam',
    descId: 'Total 600 menit belajar', test: (s) => s.totalMinutes >= 600 },

  // -------------------------------------------------------------- Ketekunan
  { id: 'streak-3',   group: 'tekun', emoji: '🔥', titleId: 'Tiga Hari Berturut',
    descId: 'Latihan 3 hari berturut-turut', test: (s) => s.longestStreak >= 3 },
  { id: 'streak-7',   group: 'tekun', emoji: '⚡', titleId: 'Satu Minggu Penuh',
    descId: 'Latihan 7 hari berturut-turut', test: (s) => s.longestStreak >= 7 },
  { id: 'streak-14',  group: 'tekun', emoji: '🌩️', titleId: 'Dua Minggu',
    descId: 'Latihan 14 hari berturut-turut', test: (s) => s.longestStreak >= 14 },
  { id: 'streak-30',  group: 'tekun', emoji: '🏆', titleId: 'Sebulan Tanpa Bolos',
    descId: 'Latihan 30 hari berturut-turut', test: (s) => s.longestStreak >= 30 },
  { id: 'streak-60',  group: 'tekun', emoji: '💫', titleId: 'Dua Bulan',
    descId: 'Latihan 60 hari berturut-turut', test: (s) => s.longestStreak >= 60 },
  { id: 'streak-100', group: 'tekun', emoji: '🌠', titleId: 'Seratus Hari',
    descId: 'Latihan 100 hari berturut-turut', test: (s) => s.longestStreak >= 100 },
  { id: 'days-50',    group: 'tekun', emoji: '📅', titleId: '50 Hari Aktif',
    descId: 'Berlatih pada 50 hari berbeda', test: (s) => s.activeDays >= 50 },
  { id: 'days-150',   group: 'tekun', emoji: '🗓️', titleId: '150 Hari Aktif',
    descId: 'Berlatih pada 150 hari berbeda', test: (s) => s.activeDays >= 150 },
  { id: 'goal-10',    group: 'tekun', emoji: '✅', titleId: 'Target 10 Hari',
    descId: 'Capai target XP harian pada 10 hari', test: (s) => s.goalDays >= 10 },
  { id: 'goal-50',    group: 'tekun', emoji: '🎊', titleId: 'Target 50 Hari',
    descId: 'Capai target XP harian pada 50 hari', test: (s) => s.goalDays >= 50 },

  // --------------------------------------------------------------- Kosakata
  { id: 'words-25',  group: 'kosakata', emoji: '🌱', titleId: '25 Kata',
    descId: 'Kuasai 25 kata', test: (s) => s.masteredWords >= 25 },
  { id: 'words-80',  group: 'kosakata', emoji: '🌳', titleId: '80 Kata',
    descId: 'Kuasai 80 kata (target YCT 1)', test: (s) => s.masteredWords >= 80 },
  { id: 'words-150', group: 'kosakata', emoji: '🌟', titleId: '150 Kata',
    descId: 'Kuasai 150 kata (target YCT 2)', test: (s) => s.masteredWords >= 150 },
  { id: 'words-250', group: 'kosakata', emoji: '💎', titleId: '250 Kata',
    descId: 'Kuasai 250 kata', test: (s) => s.masteredWords >= 250 },
  { id: 'words-400', group: 'kosakata', emoji: '🔱', titleId: '400 Kata',
    descId: 'Kuasai 400 kata', test: (s) => s.masteredWords >= 400 },
  { id: 'words-600', group: 'kosakata', emoji: '🐲', titleId: '600 Kata',
    descId: 'Kuasai 600 kata', test: (s) => s.masteredWords >= 600 },
  { id: 'seen-300',  group: 'kosakata', emoji: '🔍', titleId: 'Kenal 300 Kata',
    descId: 'Pernah melatih 300 kata berbeda', test: (s) => s.seenWords >= 300 },

  // ----------------------------------------------------------- Keterampilan
  { id: 'reader',        group: 'terampil', emoji: '📖', titleId: 'Kutu Buku',
    descId: '100 soal membaca benar', test: (s) => skillCount(s, 'reading') >= 100 },
  { id: 'reader-pro',    group: 'terampil', emoji: '🔖', titleId: 'Mata Elang',
    descId: '300 soal membaca benar', test: (s) => skillCount(s, 'reading') >= 300 },
  { id: 'listener',      group: 'terampil', emoji: '🎧', titleId: 'Telinga Tajam',
    descId: '100 soal mendengar benar', test: (s) => skillCount(s, 'listening') >= 100 },
  { id: 'listener-pro',  group: 'terampil', emoji: '👂', titleId: 'Pendengar Ulung',
    descId: '300 soal mendengar benar', test: (s) => skillCount(s, 'listening') >= 300 },
  { id: 'speaker',       group: 'terampil', emoji: '🎤', titleId: 'Suara Merdu',
    descId: '100 soal berbicara benar', test: (s) => skillCount(s, 'speaking') >= 100 },
  { id: 'speaker-pro',   group: 'terampil', emoji: '🗣️', titleId: 'Lidah Fasih',
    descId: '300 soal berbicara benar', test: (s) => skillCount(s, 'speaking') >= 300 },
  { id: 'writer',        group: 'terampil', emoji: '✍️', titleId: 'Tangan Emas',
    descId: '100 soal menulis benar', test: (s) => skillCount(s, 'writing') >= 100 },
  { id: 'writer-pro',    group: 'terampil', emoji: '🖌️', titleId: 'Kuas Ajaib',
    descId: '300 soal menulis benar', test: (s) => skillCount(s, 'writing') >= 300 },
  { id: 'all-four-skills', group: 'terampil', emoji: '🌈', titleId: 'Empat Jempol',
    descId: '50 benar di setiap keterampilan', test: (s) => SKILLS.every((k) => skillCount(s, k) >= 50) },
  { id: 'all-four-master', group: 'terampil', emoji: '🎭', titleId: 'Serba Bisa',
    descId: '200 benar di setiap keterampilan', test: (s) => SKILLS.every((k) => skillCount(s, k) >= 200) },

  // --------------------------------------------------------- Kesempurnaan
  { id: 'perfect-round', group: 'sempurna', emoji: '💯', titleId: 'Nilai Sempurna',
    descId: 'Satu ronde tanpa salah', test: (s) => s.perfectRounds >= 1 },
  { id: 'perfect-10',    group: 'sempurna', emoji: '✨', titleId: '10 Ronde Sempurna',
    descId: '10 ronde tanpa satu pun salah', test: (s) => s.perfectRounds >= 10 },
  { id: 'perfect-50',    group: 'sempurna', emoji: '🎆', titleId: '50 Ronde Sempurna',
    descId: '50 ronde tanpa satu pun salah', test: (s) => s.perfectRounds >= 50 },
  { id: 'combo-10',      group: 'sempurna', emoji: '🔗', titleId: 'Rentetan 10',
    descId: '10 jawaban benar beruntun', test: (s) => s.bestCombo >= 10 },
  { id: 'combo-20',      group: 'sempurna', emoji: '⛓️', titleId: 'Rentetan 20',
    descId: '20 jawaban benar beruntun', test: (s) => s.bestCombo >= 20 },
  { id: 'three-star-10', group: 'sempurna', emoji: '⭐', titleId: '10 Bintang Tiga',
    descId: '10 latihan berbintang tiga', test: (s) => s.threeStarLessons >= 10 },
  { id: 'three-star-40', group: 'sempurna', emoji: '🌞', titleId: '40 Bintang Tiga',
    descId: '40 latihan berbintang tiga', test: (s) => s.threeStarLessons >= 40 },

  // ----------------------------------------------------------- Perjalanan
  { id: 'level-5',   group: 'perjalanan', emoji: '🚀', titleId: 'Level 5',
    descId: 'Capai level 5', test: (s) => s.level >= 5 },
  { id: 'level-10',  group: 'perjalanan', emoji: '👑', titleId: 'Level 10',
    descId: 'Capai level 10', test: (s) => s.level >= 10 },
  { id: 'level-15',  group: 'perjalanan', emoji: '🛸', titleId: 'Level 15',
    descId: 'Capai level 15', test: (s) => s.level >= 15 },
  { id: 'level-20',  group: 'perjalanan', emoji: '🌌', titleId: 'Level 20',
    descId: 'Capai level 20', test: (s) => s.level >= 20 },
  { id: 'level-30',  group: 'perjalanan', emoji: '☄️', titleId: 'Level 30',
    descId: 'Capai level 30', test: (s) => s.level >= 30 },
  { id: 'xp-1000',   group: 'perjalanan', emoji: '💰', titleId: '1.000 XP',
    descId: 'Kumpulkan 1.000 XP', test: (s) => s.xp >= 1000 },
  { id: 'xp-5000',   group: 'perjalanan', emoji: '💸', titleId: '5.000 XP',
    descId: 'Kumpulkan 5.000 XP', test: (s) => s.xp >= 5000 },
  { id: 'xp-20000',  group: 'perjalanan', emoji: '🏦', titleId: '20.000 XP',
    descId: 'Kumpulkan 20.000 XP', test: (s) => s.xp >= 20000 },
  { id: 'yct1-clear', group: 'perjalanan', emoji: '🥇', titleId: 'Tamat YCT 1',
    descId: 'Selesaikan semua pelajaran YCT 1', test: (s) => s.clearedLevels.includes('yct1') },
  { id: 'yct2-clear', group: 'perjalanan', emoji: '🥈', titleId: 'Tamat YCT 2',
    descId: 'Selesaikan semua pelajaran YCT 2', test: (s) => s.clearedLevels.includes('yct2') },
  { id: 'yct3-clear', group: 'perjalanan', emoji: '🥉', titleId: 'Tamat YCT 3',
    descId: 'Selesaikan semua pelajaran YCT 3', test: (s) => s.clearedLevels.includes('yct3') },
  { id: 'yct4-clear', group: 'perjalanan', emoji: '🏅', titleId: 'Tamat YCT 4',
    descId: 'Selesaikan semua pelajaran YCT 4', test: (s) => s.clearedLevels.includes('yct4') },
  { id: 'yct5-clear', group: 'perjalanan', emoji: '🎗️', titleId: 'Tamat YCT 5',
    descId: 'Selesaikan semua pelajaran YCT 5', test: (s) => s.clearedLevels.includes('yct5') },
  { id: 'yct6-clear', group: 'perjalanan', emoji: '🎓', titleId: 'Tamat YCT 6',
    descId: 'Selesaikan semua pelajaran YCT 6', test: (s) => s.clearedLevels.includes('yct6') },
  { id: 'yct-all',    group: 'perjalanan', emoji: '🐉', titleId: 'Naga YCT',
    descId: 'Tamatkan seluruh jalur YCT 1-6', test: (s) => YCT_LEVELS.every((id) => s.clearedLevels.includes(id)) },
  { id: 'hsk1-clear', group: 'perjalanan', emoji: '📕', titleId: 'Tamat HSK 1',
    descId: 'Selesaikan semua pelajaran HSK 1', test: (s) => s.clearedLevels.includes('hsk1') },
  { id: 'hsk2-clear', group: 'perjalanan', emoji: '📓', titleId: 'Tamat HSK 2',
    descId: 'Selesaikan semua pelajaran HSK 2', test: (s) => s.clearedLevels.includes('hsk2') },
  { id: 'hsk3-clear', group: 'perjalanan', emoji: '📔', titleId: 'Tamat HSK 3',
    descId: 'Selesaikan semua pelajaran HSK 3', test: (s) => s.clearedLevels.includes('hsk3') }
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

/** Katalog yang sudah dikelompokkan, siap ditampilkan di galeri. */
export function groupedBadges(earnedIds = []) {
  const earned = new Set(earnedIds);
  return BADGE_GROUPS.map((group) => {
    const items = BADGES.filter((b) => b.group === group.id).map((b) => ({
      ...b,
      earned: earned.has(b.id)
    }));
    return {
      ...group,
      items,
      earnedCount: items.filter((b) => b.earned).length,
      total: items.length
    };
  }).filter((g) => g.total > 0);
}

/**
 * Lencana terdekat berikutnya — untuk memberi anak target yang jelas.
 *
 * Diambil bergiliran satu per kelompok, bukan tiga teratas dari daftar. Kalau
 * urutannya dituruti begitu saja, incarannya jadi tiga tingkat berturut dari
 * capaian yang sama ("50 ronde, 200 ronde, 500 soal") — dua di antaranya masih
 * jauh, dan tak satu pun menunjukkan jalan lain yang sebenarnya lebih dekat.
 */
export function nextBadges(earnedIds = [], limit = 3) {
  const earned = new Set(earnedIds);
  const perGroup = BADGE_GROUPS.map((g) =>
    BADGES.filter((b) => b.group === g.id && !earned.has(b.id))
  );

  const out = [];
  for (let tier = 0; out.length < limit; tier++) {
    const before = out.length;
    for (const list of perGroup) {
      if (out.length >= limit) break;
      if (list[tier]) out.push(list[tier]);
    }
    if (out.length === before) break; // semua kelompok sudah habis
  }
  return out;
}
