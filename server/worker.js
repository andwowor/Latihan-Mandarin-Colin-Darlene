// Penyimpan progres Mandarin Fun — Cloudflare Worker + KV.
//
// Tugasnya sengaja sesedikit mungkin: menyimpan satu gumpalan JSON per
// keluarga, dan menolak penyimpanan yang berdasarkan data usang. Semua aturan
// penggabungan progres ada di aplikasi (src/domain/mergeState.js), sehingga
// Worker ini tidak perlu tahu apa pun tentang XP, kartu, atau pelajaran.
//
// Dua jalur saja:
//   GET  /state?code=<kode>   header X-Family-Pin  -> { rev, state, updatedAt }
//   PUT  /state?code=<kode>   header X-Family-Pin  -> { rev, updatedAt }
//        body { rev, state }; rev harus cocok dengan yang tersimpan, kalau
//        tidak dijawab 409 beserta salinan terbaru agar bisa digabung ulang.
//
// Cara memasang ada di server/README.md.

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{2,31}$/;
const PIN_PATTERN = /^[0-9]{4,12}$/;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2 MB; progres bertahun-tahun pun jauh di bawah ini

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'mandarin-fun-sync' }, 200, cors);
    }
    if (url.pathname !== '/state') {
      return json({ error: 'not-found' }, 404, cors);
    }
    if (!env.PROGRESS) {
      return json({ error: 'kv-not-bound' }, 500, cors);
    }

    const code = (url.searchParams.get('code') || '').toLowerCase();
    const pin = request.headers.get('X-Family-Pin') || '';
    if (!CODE_PATTERN.test(code) || !PIN_PATTERN.test(pin)) {
      return json({ error: 'bad-credentials-format' }, 400, cors);
    }

    const key = `family:${code}`;
    const record = await env.PROGRESS.get(key, 'json');

    // Keluarga baru terdaftar pada penyimpanan pertama, dan PIN saat itulah
    // yang berlaku seterusnya.
    if (record && !(await pinMatches(record, code, pin))) {
      return json({ error: 'wrong-pin' }, 403, cors);
    }

    if (request.method === 'GET') {
      if (!record) return json({ error: 'not-found' }, 404, cors);
      return json({ rev: record.rev, state: record.state, updatedAt: record.updatedAt }, 200, cors);
    }

    if (request.method !== 'PUT') {
      return json({ error: 'method-not-allowed' }, 405, cors);
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: 'too-large' }, 413, cors);
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: 'bad-json' }, 400, cors);
    }
    if (!body || typeof body.state !== 'object' || body.state === null) {
      return json({ error: 'missing-state' }, 400, cors);
    }

    // Penjagaan tabrakan: perangkat harus menyimpan di atas versi yang baru
    // saja dibacanya. Kalau sudah keduluan, kirim balik yang terbaru.
    const currentRev = record?.rev || null;
    if ((body.rev || null) !== currentRev) {
      return json(
        { error: 'conflict', rev: currentRev, state: record?.state || null, updatedAt: record?.updatedAt || null },
        409,
        cors
      );
    }

    const updatedAt = new Date().toISOString();
    const next = {
      rev: crypto.randomUUID(),
      updatedAt,
      state: body.state,
      pinHash: record?.pinHash || (await hashPin(code, pin))
    };
    await env.PROGRESS.put(key, JSON.stringify(next));

    return json({ rev: next.rev, updatedAt }, 200, cors);
  }
};

// ------------------------------------------------------------------ pembantu

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers }
  });
}

/**
 * Asal permintaan yang diizinkan.
 *
 * Setel ALLOWED_ORIGINS (dipisah koma) di wrangler.toml agar hanya halaman
 * dashboard yang bisa memanggil. Bila kosong, semua asal diizinkan — masih
 * aman karena kode + PIN tetap diminta, tapi sebaiknya diisi.
 */
function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allow = allowed.length === 0 ? '*' : allowed.includes(origin) ? origin : allowed[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Family-Pin',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

async function hashPin(code, pin) {
  const data = new TextEncoder().encode(`mandarin-fun|${code}|${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Perbandingan waktu tetap, supaya PIN tidak bisa ditebak dari lama jawaban. */
async function pinMatches(record, code, pin) {
  const expected = record.pinHash;
  if (!expected) return true; // catatan lama sebelum PIN dipakai
  const actual = await hashPin(code, pin);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
