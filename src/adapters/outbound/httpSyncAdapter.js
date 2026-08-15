// Adapter sinkronisasi lewat HTTP ke Cloudflare Worker (lihat server/worker.js).
//
// Sengaja setipis mungkin: hanya menerjemahkan panggilan port menjadi permintaan
// jaringan dan menerjemahkan kembali kode statusnya menjadi pesan yang bisa
// dibaca orang tua. Semua keputusan penggabungan data ada di
// domain/mergeState.js, bukan di sini.

import { SyncPort, SyncError } from '../../ports/syncPort.js';

const TIMEOUT_MS = 12000;

function endpoint(config) {
  return `${String(config.url).replace(/\/+$/, '')}/state?code=${encodeURIComponent(config.code)}`;
}

async function request(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new SyncError('Server tidak menjawab. Coba lagi nanti.', { status: 0 });
    }
    throw new SyncError('Tidak ada sambungan ke server sinkronisasi.', { status: 0 });
  } finally {
    clearTimeout(timer);
  }
}

/** Terjemahkan status HTTP menjadi pesan yang jelas bagi orang tua. */
function explain(status) {
  if (status === 401 || status === 403) {
    return new SyncError('Kode keluarga atau PIN tidak cocok.', { status, retryable: false });
  }
  if (status === 400) {
    return new SyncError('Kode atau PIN tidak memenuhi aturan penulisan.', { status, retryable: false });
  }
  if (status === 413) {
    return new SyncError('Data progres terlalu besar untuk dikirim.', { status, retryable: false });
  }
  if (status === 429) {
    return new SyncError('Terlalu sering menyinkronkan. Tunggu sebentar ya.', { status });
  }
  return new SyncError(`Server sinkronisasi bermasalah (${status}).`, { status });
}

export class HttpSyncAdapter extends SyncPort {
  async pull(config) {
    const res = await request(endpoint(config), {
      method: 'GET',
      headers: { 'X-Family-Pin': config.pin }
    });

    // Keluarga baru: belum ada apa-apa di server, dan itu wajar.
    if (res.status === 404) return { rev: null, state: null, updatedAt: null };
    if (!res.ok) throw explain(res.status);

    const body = await res.json();
    return { rev: body.rev || null, state: body.state || null, updatedAt: body.updatedAt || null };
  }

  async push(config, rev, state) {
    const res = await request(endpoint(config), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Family-Pin': config.pin
      },
      body: JSON.stringify({ rev, state })
    });

    // Perangkat lain menyimpan lebih dulu: bukan kesalahan, cukup ulangi
    // penggabungan dengan salinan terbaru yang ikut dikirim balik.
    if (res.status === 409) {
      const body = await res.json().catch(() => ({}));
      return {
        rev: body.rev || null,
        updatedAt: body.updatedAt || null,
        conflict: { rev: body.rev || null, state: body.state || null, updatedAt: body.updatedAt || null }
      };
    }
    if (!res.ok) throw explain(res.status);

    const body = await res.json();
    return { rev: body.rev, updatedAt: body.updatedAt };
  }
}
