// Adapter audio untuk latihan listening.
//
// Buku YCT/HSK di folder sumber hanya berisi scan PDF — tidak ada satu pun
// file audio. Karena itu suara dibangkitkan dengan text-to-speech Mandarin
// bawaan perangkat (tersedia di Chrome Android/desktop dan Safari iOS/macOS).
//
// Bila suatu saat file MP3 asli dari penerbit tersedia, letakkan di
// public/assets/audio/<teks>.mp3 dan adapter ini otomatis memakainya lebih dulu.

import { SpeechPort } from '../../ports/speechPort.js';
import { appConfig } from '../../config/appConfig.js';

export class WebSpeechAdapter extends SpeechPort {
  constructor(cfg = appConfig.speech) {
    super();
    this.cfg = cfg;
    this.voice = null;
    this.manifest = null;   // peta teks -> berkas audio, bila ada
    this.audioBase = 'assets/audio';
    this.unlocked = false;
    this.#loadVoices();
  }

  isAvailable() {
    return typeof speechSynthesis !== 'undefined' || !!this.manifest;
  }

  /** Muat daftar file audio opsional. Aman bila berkas tidak ada. */
  async loadManifest(url = 'assets/audio/manifest.json') {
    try {
      const res = await fetch(url);
      if (res.ok) this.manifest = await res.json();
    } catch {
      this.manifest = null;
    }
  }

  #loadVoices() {
    if (typeof speechSynthesis === 'undefined') return;
    const pick = () => {
      const voices = speechSynthesis.getVoices() || [];
      // Utamakan suara Mandarin daratan, lalu Mandarin apa pun.
      this.voice =
        voices.find((v) => v.lang?.replace('_', '-') === 'zh-CN') ||
        voices.find((v) => /^zh/i.test(v.lang || '')) ||
        null;
    };
    pick();
    speechSynthesis.addEventListener?.('voiceschanged', pick);
  }

  /**
   * iOS/Safari hanya mengizinkan audio setelah interaksi pengguna.
   * Panggil sekali saat anak menekan tombol profil.
   */
  unlock() {
    if (this.unlocked || typeof speechSynthesis === 'undefined') return;
    try {
      const warm = new SpeechSynthesisUtterance('');
      warm.volume = 0;
      speechSynthesis.speak(warm);
      this.unlocked = true;
    } catch {
      /* diabaikan */
    }
  }

  async speak(text, { slow = false } = {}) {
    if (!text) return;
    this.cancel();

    const file = this.manifest?.[text];
    if (file) {
      await this.#playFile(file, slow);
      return;
    }

    if (typeof speechSynthesis === 'undefined') return;
    await new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.cfg.lang;
      u.rate = slow ? this.cfg.rateSlow : this.cfg.rate;
      u.pitch = this.cfg.pitch;
      if (this.voice) u.voice = this.voice;
      u.onend = resolve;
      u.onerror = resolve;
      speechSynthesis.speak(u);
      // Jaring pengaman: beberapa browser tidak selalu memicu onend.
      setTimeout(resolve, 6000);
    });
  }

  #playFile(file, slow) {
    return new Promise((resolve) => {
      const audio = new Audio(`${this.audioBase}/${file}`);
      audio.playbackRate = slow ? 0.7 : 1;
      audio.onended = resolve;
      audio.onerror = resolve;
      this.currentAudio = audio;
      audio.play().catch(resolve);
    });
  }

  cancel() {
    try {
      speechSynthesis?.cancel();
    } catch {
      /* diabaikan */
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }
}
