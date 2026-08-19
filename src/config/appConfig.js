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
  // `bridgePerLesson` : berapa kata bekal HSK yang ikut ditampilkan di sesi
  //                     belajar. Darlene (5 th) mendapat porsi lebih sedikit
  //                     supaya satu sesi tidak terlalu panjang.
  // `avatar`          : berkas gambar untuk lambang anak, relatif terhadap
  //                     public/index.html. Boleh dikosongkan — bila berkasnya
  //                     tidak ada atau gagal dimuat, tampilan otomatis jatuh
  //                     kembali ke `emoji`.
  profiles: [
    {
      id: 'colin',
      name: 'Colin',
      age: 7,
      grade: 'Kelas 2 SD',
      emoji: '🦁',
      avatar: 'icons/avatar-colin.png',   // kapibara — belum ada emoji resminya
      color: '#2f7ef2',
      colorSoft: '#dbe9ff',
      startLevel: 'yct1',
      openLevels: ['yct1', 'yct2'],
      dailyGoalXp: 60,
      bridgePerLesson: 4
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
      dailyGoalXp: 40,
      bridgePerLesson: 2
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

  // Sesi belajar: kartu materi yang wajib dilihat sebelum soal keluar.
  // `requireBeforeQuiz` boleh dimatikan bila anak sudah terbiasa dan ingin
  // langsung berlatih.
  study: {
    requireBeforeQuiz: true,
    xpFirstTime: 20,     // hadiah sekali saja, saat pertama menuntaskan materi
    xpRepeat: 5          // mengulang materi tetap dihargai, tapi kecil
  },

  // Bekal HSK yang dititipkan ke tiap pelajaran YCT.
  // `perLesson` adalah jatah yang DISIAPKAN per pelajaran; berapa yang benar-
  // benar ditampilkan mengikuti `bridgePerLesson` masing-masing anak. Angka 4
  // dipilih karena pas menghabiskan seluruh kosakata HSK 1 di penghujung
  // YCT 2 dan HSK 2 di penghujung YCT 4.
  bridge: {
    perLesson: 4,
    // Berapa banyak kata bekal yang boleh ikut diuji dalam satu ronde latihan.
    maxPerRound: 2
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

    // Kecepatan dan nada dipilih agar LENGKUNG NADA tetap terdengar.
    // `rate` terlalu rendah meregangkan satu suku kata sampai nadanya melar
    // dan justru makin sulit ditiru, jadi 0,8 — cukup pelan tanpa melar.
    // `pitch` dibiarkan netral: setiap pergeseran pitch ditumpangkan di atas
    // lengkung nada aslinya, dan itu yang membuat nada terdengar samar.
    rate: 0.8,
    pitch: 1,

    // Mode 🐢: pelan dengan cara membacakan SATU SUKU KATA sekali ucap,
    // dipisah jeda. Ini nada kutipan yang bersih — cara guru mengulang
    // satu-satu supaya bisa ditirukan (lihat ADR-0012).
    rateSlow: 0.7,
    syllableGapMs: 340,

    // Latihan berbicara
    maxAlternatives: 8,       // berapa tebakan diminta dari pengenal suara
    listenTimeoutMs: 7000,    // berhenti mendengar setelah sekian lama
    // Ambang lulus. Sengaja longgar: penuturnya anak 5 dan 7 tahun, dan
    // pengenal suara sendiri kerap meleset ke huruf lain yang bunyinya sama.
    // Penilaiannya membandingkan bunyi (lihat domain/pronunciation.js), jadi
    // homofon sudah bernilai penuh — ambang ini hanya menolong huruf yang
    // tidak ada di kamus lafal.
    acceptScore: 0.5
  },

  skills: [
    { id: 'reading',   labelId: 'Membaca',     emoji: '📖', color: '#2f7ef2' },
    { id: 'listening', labelId: 'Mendengar',   emoji: '🎧', color: '#f2971f' },
    { id: 'speaking',  labelId: 'Berbicara',   emoji: '🎤', color: '#e0489b' },
    { id: 'writing',   labelId: 'Menulis',     emoji: '✍️', color: '#37c8ab' }
  ]
};

export const SKILL_IDS = appConfig.skills.map((s) => s.id);
