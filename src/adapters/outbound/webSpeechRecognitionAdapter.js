// Adapter pengenal suara memakai Web Speech API (SpeechRecognition).
//
// Dukungan perangkat:
//   - Chrome (Android, Windows, macOS, ChromeOS) : ada
//   - Safari (iOS 14.5+, macOS 14.1+)            : ada, lewat webkitSpeechRecognition
//   - Firefox                                     : belum ada
//
// Pengenalan berjalan di server milik peramban, jadi butuh internet.
// Bila tidak tersedia, UI otomatis beralih ke mode "dengar lalu tirukan"
// dengan penilaian sendiri (lihat quizView).
//
// ANAK YANG MENENTUKAN KAPAN SELESAI, BUKAN PENGHITUNG WAKTU (lihat ADR-0014).
// Mesin pengenal berhenti sendiri begitu mendengar jeda — padahal anak kecil
// berhenti di tengah kalimat untuk berpikir atau mengambil napas. Karena itu
// sesi dengar di sini dijahit kembali: setiap kali mesinnya berhenti sendiri,
// ia dinyalakan lagi, dan hasilnya dikumpulkan sampai anak menekan tombol
// "Selesai". Satu-satunya batas waktu yang tersisa adalah jaring pengaman
// supaya mikrofon tidak menyala selamanya bila alatnya ditinggal.

import { RecognitionPort } from '../../ports/recognitionPort.js';
import { appConfig } from '../../config/appConfig.js';

const SpeechRecognitionImpl =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export class WebSpeechRecognitionAdapter extends RecognitionPort {
  constructor(cfg = appConfig.speech) {
    super();
    this.cfg = cfg;
    this.session = null;
  }

  isAvailable() {
    return !!SpeechRecognitionImpl;
  }

  /** Apakah sedang mendengarkan sekarang? */
  isListening() {
    return !!this.session;
  }

  /** Tanyakan izin mikrofon lebih dulu agar pesannya muncul di saat yang tepat. */
  async requestPermission() {
    if (!navigator.mediaDevices?.getUserMedia) return true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Langsung dilepas: kita hanya butuh izinnya, bukan alirannya.
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Dengarkan sampai `finish()` dipanggil — bukan sampai waktunya habis.
   *
   * @param {object} [opts]
   * @param {(text: string) => void} [opts.onPartial] teks sementara, untuk ditampilkan
   * @param {number} [opts.maxMs] jaring pengaman; setelah ini hasilnya diserahkan apa adanya
   * @returns {Promise<{transcripts: string[], error: string|null, timedOut: boolean}>}
   */
  async listen({ onPartial, maxMs = this.cfg.maxListenMs } = {}) {
    if (!this.isAvailable()) {
      return { transcripts: [], error: 'unsupported' };
    }
    this.stop();

    return new Promise((resolve) => {
      // Potongan kalimat dikumpulkan berurutan, lalu disambung kembali.
      // Mesin pengenal memberi beberapa tebakan untuk tiap potongan, jadi
      // yang dirangkai adalah tebakan ke-n dari setiap potongan: tebakan
      // terbaik dengan terbaik, kedua dengan kedua, dan seterusnya.
      const segments = [];
      let partial = '';
      let error = null;
      let selesai = false;
      let timedOut = false;
      let rec = null;

      const sesi = {
        finish: () => beres(false),
        cancel: () => beres(false, true)
      };

      const beres = (karenaWaktu = false, dibatalkan = false) => {
        if (selesai) return;
        selesai = true;
        timedOut = karenaWaktu;
        clearTimeout(timer);
        this.session = null;
        lepas();
        resolve(
          dibatalkan
            ? { transcripts: [], error: null, timedOut: false }
            : { transcripts: rangkai(segments, partial), error, timedOut }
        );
      };

      const lepas = () => {
        if (!rec) return;
        rec.onresult = rec.onerror = rec.onend = null;
        try {
          rec.abort();
        } catch {
          /* diabaikan */
        }
        rec = null;
      };

      const timer = setTimeout(() => beres(true), maxMs);

      // Mesinnya berhenti sendiri setiap kali mendengar jeda. Selama anak
      // belum menekan "Selesai", nyalakan lagi dan lanjutkan mengumpulkan.
      const mulai = () => {
        if (selesai) return;
        rec = new SpeechRecognitionImpl();
        rec.lang = this.cfg.lang;
        rec.interimResults = true;
        rec.maxAlternatives = this.cfg.maxAlternatives;
        rec.continuous = true;

        rec.onresult = (event) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              partial = '';
              const alternatif = [];
              for (let a = 0; a < result.length; a++) alternatif.push(result[a].transcript);
              segments.push(alternatif);
              onPartial?.(rangkai(segments, '')[0] || '');
            } else {
              partial = result[0].transcript;
              onPartial?.(rangkai(segments, partial)[0] || '');
            }
          }
        };

        rec.onerror = (e) => {
          // 'no-speech' dan 'aborted' bukan kegagalan: anak hanya sedang diam.
          if (!['no-speech', 'aborted'].includes(e.error)) {
            error = e.error;
            beres();
          }
        };

        // Berhenti sendiri bukan tanda selesai — sambung lagi.
        rec.onend = () => {
          if (selesai) return;
          rec = null;
          setTimeout(mulai, 120);
        };

        try {
          rec.start();
        } catch {
          // Mesinnya belum sempat melepas sesi sebelumnya; coba lagi sebentar.
          rec = null;
          setTimeout(mulai, 250);
        }
      };

      this.session = sesi;
      mulai();
    });
  }

  /** Anak menekan "Selesai": serahkan apa yang sudah terkumpul. */
  finish() {
    this.session?.finish();
  }

  /** Batalkan sesi dengar yang sedang berjalan; hasilnya dibuang. */
  stop() {
    this.session?.cancel();
    this.session = null;
  }
}

/**
 * Sambung potongan-potongan kalimat menjadi beberapa tebakan utuh.
 *
 * Tiap potongan punya daftar tebakannya sendiri. Yang dirangkai adalah
 * tebakan ke-n dari setiap potongan — terbaik dengan terbaik — supaya
 * penilaian tetap mendapat beberapa kemungkinan utuh untuk dibandingkan.
 */
export function rangkai(segments = [], partial = '') {
  if (!segments.length) return partial ? [partial.trim()].filter(Boolean) : [];

  const jumlah = Math.max(...segments.map((s) => s.length));
  const hasil = [];
  for (let n = 0; n < jumlah; n++) {
    const teks = segments.map((s) => s[n] ?? s[0] ?? '').join('') + partial;
    const bersih = teks.trim();
    if (bersih && !hasil.includes(bersih)) hasil.push(bersih);
  }
  return hasil;
}
