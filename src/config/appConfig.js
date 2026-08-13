// Konfigurasi aplikasi. Semua angka "aturan main" dikumpulkan di sini supaya
// orang tua bisa menyetel tingkat kesulitan tanpa menyentuh logika domain.

export const appConfig = {
  appName: 'Mandarin Fun',
  storageKey: 'mandarin-fun/v2',
  // Relatif terhadap public/index.html. Disimpan di dalam public/ agar
  // ikut ter-cache oleh service worker (scope-nya sebatas folder ini).
  contentBase: 'data/curriculum',

  // `startLevel`      : level yang dibuka pertama kali saat anak masuk.
  // `openLevels`      : level yang selalu terbuka untuk anak ini, tanpa
  //                     menunggu ambang XP. Colin (7 th) boleh langsung
  //                     melompat ke YCT 2 kalau YCT 1 terasa terlalu mudah.
  // `dailyGoalXp`     : target XP harian; juga jadi dasar besar misi harian.
  profiles: [
    {
      id: 'colin',
      name: 'Colin',
      age: 7,
      grade: 'Kelas 2 SD',
      emoji: '🦁',
      color: '#2f7ef2',
      colorSoft: '#dbe9ff',
      startLevel: 'yct1',
      openLevels: ['yct1', 'yct2'],
      dailyGoalXp: 60
    },
    {
      id: 'darlene',
      name: 'Darlene',
      age: 5,
      grade: 'Kindergarten K2',
      emoji: '🦄',
      color: '#e0489b',
      colorSoft: '#ffdcee',
      startLevel: 'yct1',
      openLevels: ['yct1'],
      dailyGoalXp: 40
    }
  ],

  session: {
    questionsPerRound: 10,
    hearts: 5,
    xpPerCorrect: 10,
    xpPerfectBonus: 25,
    xpFirstClearBonus: 30,
    comboStep: 3,        // tiap 3 jawaban benar beruntun, multiplier naik
    comboMaxMultiplier: 3
  },

  // Kurva level: XP kumulatif yang dibutuhkan untuk naik ke level berikutnya.
  levelCurve: {
    baseXp: 120,
    growth: 1.18
  },

  srs: {
    // Kotak Leitner: jeda (hari) sebelum sebuah kata diulang kembali.
    intervals: [0, 1, 2, 4, 7, 14, 30],
    demoteTo: 0
  },

  speech: {
    lang: 'zh-CN',
    rate: 0.75,          // pelan, untuk anak-anak
    rateSlow: 0.5,
    pitch: 1.05,

    // Latihan berbicara
    maxAlternatives: 5,       // berapa tebakan diminta dari pengenal suara
    listenTimeoutMs: 7000,    // berhenti mendengar setelah sekian lama
    acceptScore: 0.6          // ambang lulus; longgar, karena penuturnya anak-anak
  },

  skills: [
    { id: 'reading',   labelId: 'Membaca',     emoji: '📖', color: '#2f7ef2' },
    { id: 'listening', labelId: 'Mendengar',   emoji: '🎧', color: '#f2971f' },
    { id: 'speaking',  labelId: 'Berbicara',   emoji: '🎤', color: '#e0489b' },
    { id: 'writing',   labelId: 'Menulis',     emoji: '✍️', color: '#37c8ab' }
  ]
};

export const SKILL_IDS = appConfig.skills.map((s) => s.id);
