// Menggabungkan dua salinan progres yang sama-sama sah.
//
// Colin dan Darlene memakai beberapa perangkat, dan salah satunya bisa saja
// dipakai saat internet mati. Karena itu aturannya bukan "yang terbaru
// menang" — itu akan menghapus latihan yang sudah terlanjur dikerjakan di
// perangkat lain. Yang dipakai adalah penggabungan yang tidak pernah
// mengurangi:
//
//   angka  -> ambil yang terbesar
//   daftar -> gabungkan (union)
//   kartu  -> ambil yang paling sering dilatih
//
// Tiga sifat yang dijaga tes, dan menjadi alasan cara ini aman — berlaku untuk
// data progres; `activeProfile` dikecualikan karena memang milik perangkat:
//   - komutatif : merge(a, b) == merge(b, a)
//   - idempoten : merge(a, a) == a
//   - monoton   : hasilnya tidak pernah lebih kecil dari salah satu sisi
//
// Kelemahan yang disadari: bila dua perangkat berlatih di hari yang sama
// tanpa sempat sinkron, XP hari itu diambil yang terbesar, bukan dijumlah.
// Itu pilihan yang disengaja — lebih baik kurang sedikit daripada menggandakan
// atau menghapus.

const numberKeys = (obj) => Object.keys(obj || {});

function maxNumber(a, b) {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

function union(a = [], b = []) {
  return [...new Set([...a, ...b])].sort();
}

/** Waktu ISO paling awal / paling akhir; nilai kosong kalah. */
function earliest(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a < b ? a : b;
}

function latest(a, b) {
  if (!a) return b || null;
  if (!b) return a;
  return a > b ? a : b;
}

/** Gabungkan dua peta angka dengan mengambil nilai terbesar tiap kunci. */
function mergeNumberMap(a = {}, b = {}) {
  const out = {};
  for (const key of new Set([...numberKeys(a), ...numberKeys(b)])) {
    out[key] = maxNumber(a[key], b[key]);
  }
  return out;
}

/**
 * Kartu SRS mana yang lebih "maju".
 * Urutan penentu dibuat lengkap supaya hasilnya sama dari sisi mana pun.
 */
export function pickCard(a, b) {
  if (!a) return b;
  if (!b) return a;
  const rank = (c) => [c.seen || 0, c.box || 0, c.correct || 0, c.dueOn || ''];
  const ra = rank(a);
  const rb = rank(b);
  for (let i = 0; i < ra.length; i++) {
    if (ra[i] === rb[i]) continue;
    return ra[i] > rb[i] ? a : b;
  }
  return a;
}

function mergeCards(a = {}, b = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[key] = pickCard(a[key], b[key]);
  }
  return out;
}

function mergeStudied(a = {}, b = {}) {
  const out = {};
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const x = a[key];
    const y = b[key];
    if (!x || !y) {
      out[key] = x || y;
      continue;
    }
    out[key] = {
      firstAt: earliest(x.firstAt, y.firstAt),
      lastAt: latest(x.lastAt, y.lastAt),
      count: maxNumber(x.count, y.count)
    };
  }
  return out;
}

function mergeBySkill(a = {}, b = {}) {
  const out = {};
  for (const skill of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[skill] = {
      answered: maxNumber(a[skill]?.answered, b[skill]?.answered),
      correct: maxNumber(a[skill]?.correct, b[skill]?.correct)
    };
  }
  return out;
}

function mergeDay(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    ...a,
    ...b,
    day: a.day || b.day,
    xp: maxNumber(a.xp, b.xp),
    answered: maxNumber(a.answered, b.answered),
    correct: maxNumber(a.correct, b.correct),
    minutes: Math.max(a.minutes || 0, b.minutes || 0),
    rounds: maxNumber(a.rounds, b.rounds),
    perfectRounds: maxNumber(a.perfectRounds, b.perfectRounds),
    studySessions: maxNumber(a.studySessions, b.studySessions),
    starsEarned: maxNumber(a.starsEarned, b.starsEarned),
    bestCombo: maxNumber(a.bestCombo, b.bestCombo),
    missionsClaimed: union(a.missionsClaimed, b.missionsClaimed),
    bySkill: mergeBySkill(a.bySkill, b.bySkill)
  };
}

function mergeDailyLog(a = {}, b = {}) {
  const out = {};
  for (const day of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[day] = mergeDay(a[day], b[day]);
  }
  return out;
}

function mergeStats(a = {}, b = {}) {
  return {
    ...a,
    ...b,
    roundsCompleted: maxNumber(a.roundsCompleted, b.roundsCompleted),
    perfectRounds: maxNumber(a.perfectRounds, b.perfectRounds),
    correctBySkill: mergeNumberMap(a.correctBySkill, b.correctBySkill)
  };
}

/** Gabungkan progres satu anak. */
export function mergeProfile(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    ...a,
    ...b,
    id: a.id || b.id,
    xp: maxNumber(a.xp, b.xp),
    badges: union(a.badges, b.badges),
    stats: mergeStats(a.stats, b.stats),
    lessonStars: mergeNumberMap(a.lessonStars, b.lessonStars),
    studied: mergeStudied(a.studied, b.studied),
    cards: mergeCards(a.cards, b.cards),
    dailyLog: mergeDailyLog(a.dailyLog, b.dailyLog),
    lastSeen: latest(a.lastSeen, b.lastSeen)
  };
}

/**
 * Gabungkan seluruh isi penyimpanan.
 *
 * `activeProfile` sengaja tidak ikut digabung: siapa yang sedang masuk adalah
 * urusan perangkat masing-masing, bukan data yang perlu disamakan.
 *
 * @param {object} local  salinan di perangkat ini
 * @param {object} remote salinan dari server
 */
export function mergeStates(local, remote) {
  if (!remote) return local;
  if (!local) return remote;

  const profiles = {};
  for (const id of new Set([...Object.keys(local.profiles || {}), ...Object.keys(remote.profiles || {})])) {
    profiles[id] = mergeProfile(local.profiles?.[id], remote.profiles?.[id]);
  }

  return {
    ...remote,
    ...local,
    version: Math.max(local.version || 0, remote.version || 0),
    activeProfile: local.activeProfile ?? null,
    profiles
  };
}

/**
 * Apakah dua salinan sudah sama isinya?
 * Dipakai agar perangkat tidak mengirim ulang data yang tidak berubah.
 */
export function sameState(a, b) {
  return stable(a) === stable(b);
}

/** JSON dengan urutan kunci tetap, supaya perbandingannya bisa dipercaya. */
export function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
}
