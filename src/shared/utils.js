// Utilitas murni yang dipakai lintas lapisan. Tidak boleh menyentuh DOM
// maupun storage supaya tetap mudah diuji.

/** Tanggal lokal dalam format YYYY-MM-DD (bukan UTC, supaya "hari ini" sesuai jam dinding). */
export function toDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dayKeyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Selisih hari kalender antara dua dayKey (b - a). */
export function daysBetween(aKey, bKey) {
  const a = dayKeyToDate(aKey);
  const b = dayKeyToDate(bKey);
  return Math.round((b - a) / 86400000);
}

export function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Fisher-Yates. Menerima rng agar bisa dites secara deterministik. */
export function shuffle(list, rng = Math.random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample(list, rng = Math.random) {
  return list[Math.floor(rng() * list.length)];
}

/** Ambil n elemen acak yang berbeda. */
export function sampleMany(list, n, rng = Math.random) {
  return shuffle(list, rng).slice(0, Math.max(0, n));
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function sum(list, pick = (x) => x) {
  return list.reduce((acc, item) => acc + pick(item), 0);
}

export function groupBy(list, keyOf) {
  const map = new Map();
  for (const item of list) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function percent(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

/** Escape teks sebelum masuk innerHTML. */
export function esc(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
