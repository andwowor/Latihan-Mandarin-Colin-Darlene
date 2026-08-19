// Adapter audio untuk latihan listening.
//
// Buku YCT/HSK di folder sumber hanya berisi scan PDF — tidak ada satu pun
// file audio. Karena itu suara dibangkitkan dengan text-to-speech Mandarin
// bawaan perangkat (tersedia di Chrome Android/desktop dan Safari iOS/macOS).
//
// Bila suatu saat file MP3 asli dari penerbit tersedia, letakkan di
// public/assets/audio/<teks>.mp3 dan adapter ini otomatis memakainya lebih dulu.
//
// Pemilihan suaranya sendiri ada di domain/speechVoice.js: perangkat biasanya
// punya beberapa suara Mandarin dengan mutu yang jauh berbeda, dan yang paling
// jelas nadanya hampir tidak pernah yang pertama dalam daftar (ADR-0012).

import { SpeechPort } from '../../ports/speechPort.js';
import { appConfig } from '../../config/appConfig.js';
import { rankVoices, pickVoice, voiceId, toneChunks } from '../../domain/speechVoice.js';

export class WebSpeechAdapter extends SpeechPort {
  constructor(cfg = appConfig.speech) {
    super();
    this.cfg = cfg;
    this.voice = null;
    this.preferredId = '';     // pilihan orang tua, bila ada
    this.rateScale = 1;        // penyetel kecepatan dari menu orang tua
    this.manifest = null;      // peta teks -> berkas audio, bila ada
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

  #allVoices() {
    if (typeof speechSynthesis === 'undefined') return [];
    return speechSynthesis.getVoices() || [];
  }

  #loadVoices() {
    if (typeof speechSynthesis === 'undefined') return;
    const pick = () => {
      this.voice = pickVoice(this.#allVoices(), this.preferredId);
    };
    pick();
    // Daftar suara sering baru terisi beberapa saat setelah halaman dibuka —
    // terutama suara jaringan, yang justru yang paling jelas nadanya.
    speechSynthesis.addEventListener?.('voiceschanged', pick);
  }

  /**
   * Daftar suara Mandarin di perangkat ini, terurut dari yang nadanya paling
   * jelas. Dipakai pemilih suara di menu orang tua.
   */
  voiceOptions() {
    return rankVoices(this.#allVoices()).map((r) => ({
      id: r.id,
      name: r.voice.name || r.id,
      lang: r.voice.lang || '',
      note: r.note,
      neural: r.neural,
      active: r.id === this.currentVoiceId()
    }));
  }

  /** Tanda pengenal suara yang sedang dipakai. */
  currentVoiceId() {
    return this.voice ? voiceId(this.voice) : '';
  }

  /**
   * Terapkan setelan perangkat: pilihan suara dan penyetel kecepatan.
   * Setelan ini milik perangkat, bukan milik anak — tidak ikut disinkronkan.
   *
   * @param {{voiceId?: string, rateScale?: number}} [settings]
   */
  applySettings({ voiceId: id = '', rateScale = 1 } = {}) {
    this.preferredId = id || '';
    this.rateScale = Number(rateScale) > 0 ? Number(rateScale) : 1;
    this.voice = pickVoice(this.#allVoices(), this.preferredId);
    return this.currentVoiceId();
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

  /**
   * @param {string} text teks Mandarin yang dibacakan
   * @param {{slow?: boolean}} [opts] `slow` membacakan per suku kata dengan jeda
   */
  async speak(text, { slow = false } = {}) {
    if (!text) return;
    this.cancel();

    const file = this.manifest?.[text];
    if (file) {
      await this.#playFile(file, slow);
      return;
    }

    if (typeof speechSynthesis === 'undefined') return;
    this.token = (this.token || 0) + 1;
    const token = this.token;

    // Mode pelan: satu suku kata sekali ucap, dipisah jeda. Meregangkan
    // `rate` saja membuat lengkung nadanya melar; per suku kata memberi nada
    // kutipan yang bersih dan bisa ditirukan.
    const parts = slow ? toneChunks(text) : [String(text)];
    const rate = (slow ? this.cfg.rateSlow : this.cfg.rate) * this.rateScale;

    for (const [i, part] of parts.entries()) {
      if (token !== this.token) return;   // sudah dibatalkan / diganti
      await this.#utter(part, rate);
      if (slow && i < parts.length - 1) await this.#pause(this.cfg.syllableGapMs ?? 300);
    }
  }

  #utter(text, rate) {
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = this.voice?.lang || this.cfg.lang;
      u.rate = Math.min(2, Math.max(0.1, rate));
      u.pitch = this.cfg.pitch;
      if (this.voice) u.voice = this.voice;
      let selesai = false;
      const done = () => {
        if (selesai) return;
        selesai = true;
        resolve();
      };
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
      // Jaring pengaman: beberapa browser tidak selalu memicu onend.
      // Satu suku kata jauh lebih pendek daripada satu kalimat, jadi
      // batasnya ikut menyesuaikan panjang teksnya.
      setTimeout(done, 1500 + text.length * 700);
    });
  }

  #pause(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    this.token = (this.token || 0) + 1;   // hentikan rangkaian suku kata
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
