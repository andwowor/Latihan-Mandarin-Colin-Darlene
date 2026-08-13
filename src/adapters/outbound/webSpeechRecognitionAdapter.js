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
    this.active = null;
  }

  isAvailable() {
    return !!SpeechRecognitionImpl;
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

  async listen({ onPartial, timeoutMs = this.cfg.listenTimeoutMs } = {}) {
    if (!this.isAvailable()) {
      return { transcripts: [], error: 'unsupported' };
    }
    this.stop();

    return new Promise((resolve) => {
      const rec = new SpeechRecognitionImpl();
      rec.lang = this.cfg.lang;
      rec.interimResults = true;
      rec.maxAlternatives = this.cfg.maxAlternatives;
      rec.continuous = false;

      const transcripts = [];
      let settled = false;
      let error = null;

      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.active = null;
        try {
          rec.stop();
        } catch {
          /* diabaikan */
        }
        resolve({ transcripts: [...new Set(transcripts.filter(Boolean))], error });
      };

      const timer = setTimeout(finish, timeoutMs);

      rec.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            for (let a = 0; a < result.length; a++) transcripts.push(result[a].transcript);
          } else if (onPartial) {
            onPartial(result[0].transcript);
          }
        }
        if (transcripts.length) finish();
      };

      rec.onerror = (e) => {
        // 'no-speech' dan 'aborted' bukan kegagalan: anak hanya belum bersuara.
        error = ['no-speech', 'aborted'].includes(e.error) ? null : e.error;
        finish();
      };

      rec.onend = finish;

      try {
        this.active = rec;
        rec.start();
      } catch (e) {
        error = 'start-failed';
        finish();
      }
    });
  }

  stop() {
    if (!this.active) return;
    try {
      this.active.abort();
    } catch {
      /* diabaikan */
    }
    this.active = null;
  }
}
