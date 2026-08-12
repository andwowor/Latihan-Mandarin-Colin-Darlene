// Latihan menulis: anak menebalkan huruf Han dengan jari atau mouse.
//
// Penilaian dilakukan dengan membandingkan dua "topeng" (mask):
//   - topeng huruf contoh yang digambar di kanvas panduan
//   - topeng coretan anak
// Keduanya diperkecil ke kisi kasar lalu dibandingkan, sehingga goresan yang
// sedikit meleset tetap dihitung benar — penting untuk anak 5 tahun.

const GRID = 52;          // kisi penilaian (520px / 10)
const CELL = 10;
const ALPHA_ON = 40;      // ambang piksel dianggap "terisi"
const GUIDE_FONT = "600 384px 'PingFang SC','Hiragino Sans GB','Noto Sans SC','Microsoft YaHei','Heiti SC',sans-serif";

export class TraceCanvas {
  /**
   * @param {HTMLCanvasElement} guideEl kanvas huruf contoh (di bawah)
   * @param {HTMLCanvasElement} drawEl  kanvas coretan anak (di atas)
   * @param {string} char huruf yang dilatih
   */
  constructor(guideEl, drawEl, char) {
    this.guide = guideEl;
    this.canvas = drawEl;
    this.char = char;
    this.ctx = drawEl.getContext('2d', { willReadFrequently: true });
    this.drawing = false;
    this.hasInk = false;
    this.#drawGuide();
    this.#setupPen();
    this.#bind();
  }

  #drawGuide() {
    const g = this.guide.getContext('2d');
    g.clearRect(0, 0, this.guide.width, this.guide.height);
    g.font = GUIDE_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    // Abu-abu muda: cukup terlihat untuk ditebalkan, tidak mendominasi.
    g.fillStyle = 'rgba(130,140,175,0.30)';
    g.fillText(this.char, this.guide.width / 2, this.guide.height / 2 + 8);
  }

  #setupPen() {
    const c = this.ctx;
    c.lineWidth = 26;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = '#2f7ef2';
  }

  #pos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: ((point.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  #bind() {
    const start = (e) => {
      e.preventDefault();
      this.drawing = true;
      this.hasInk = true;
      const { x, y } = this.#pos(e);
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      // Titik tunggal tetap meninggalkan bekas.
      this.ctx.lineTo(x + 0.1, y + 0.1);
      this.ctx.stroke();
    };
    const move = (e) => {
      if (!this.drawing) return;
      e.preventDefault();
      const { x, y } = this.#pos(e);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    };
    const end = () => {
      this.drawing = false;
    };

    this.handlers = { start, move, end };
    this.canvas.addEventListener('pointerdown', start);
    this.canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  destroy() {
    const h = this.handlers || {};
    this.canvas.removeEventListener('pointerdown', h.start);
    this.canvas.removeEventListener('pointermove', h.move);
    window.removeEventListener('pointerup', h.end);
    window.removeEventListener('pointercancel', h.end);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hasInk = false;
  }

  /** Ubah kanvas menjadi kisi boolean GRID x GRID. */
  #maskOf(canvas) {
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const mask = new Uint8Array(GRID * GRID);
    for (let gy = 0; gy < GRID; gy++) {
      for (let gx = 0; gx < GRID; gx++) {
        let on = 0;
        for (let y = 0; y < CELL && !on; y += 2) {
          for (let x = 0; x < CELL; x += 2) {
            const px = (gx * CELL + x) + (gy * CELL + y) * canvas.width;
            if (data[px * 4 + 3] > ALPHA_ON) { on = 1; break; }
          }
        }
        mask[gy * GRID + gx] = on;
      }
    }
    return mask;
  }

  /** Perlebar topeng satu sel ke segala arah (toleransi goresan meleset). */
  #dilate(mask, radius = 1) {
    const out = new Uint8Array(mask.length);
    for (let y = 0; y < GRID; y++) {
      for (let x = 0; x < GRID; x++) {
        if (!mask[y * GRID + x]) continue;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < GRID && ny >= 0 && ny < GRID) out[ny * GRID + nx] = 1;
          }
        }
      }
    }
    return out;
  }

  /**
   * Nilai kemiripan 0..1.
   *  - recall   : seberapa banyak huruf contoh yang tertutup coretan
   *  - precision: seberapa banyak coretan yang jatuh di atas huruf
   */
  score() {
    if (!this.hasInk) return { coverage: 0, recall: 0, precision: 0 };

    const glyph = this.#maskOf(this.guide);
    const ink = this.#maskOf(this.canvas);
    const glyphWide = this.#dilate(glyph, 2);
    const inkWide = this.#dilate(ink, 2);

    let glyphCount = 0;
    let inkCount = 0;
    let covered = 0;
    let onTarget = 0;

    for (let i = 0; i < glyph.length; i++) {
      if (glyph[i]) {
        glyphCount++;
        if (inkWide[i]) covered++;
      }
      if (ink[i]) {
        inkCount++;
        if (glyphWide[i]) onTarget++;
      }
    }

    const recall = glyphCount ? covered / glyphCount : 0;
    const precision = inkCount ? onTarget / inkCount : 0;
    // Anak-anak: yang penting bentuknya tertelusuri, bukan kerapiannya.
    const coverage = recall * 0.7 + precision * 0.3;
    return { coverage, recall, precision };
  }
}
