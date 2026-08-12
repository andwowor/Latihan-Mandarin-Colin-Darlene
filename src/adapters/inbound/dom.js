// Pembantu DOM ringan. Sengaja tanpa framework agar aplikasi tetap satu
// berkas statis yang bisa dibuka langsung tanpa proses build.

export { esc } from '../../shared/utils.js';

/** Pasang HTML ke sebuah elemen. */
export function mount(root, html) {
  root.innerHTML = html;
  return root;
}

export function qs(root, selector) {
  return root.querySelector(selector);
}

export function qsa(root, selector) {
  return [...root.querySelectorAll(selector)];
}

/**
 * Delegasi event: satu listener untuk banyak elemen.
 * Cocok karena seluruh layar digambar ulang setiap navigasi.
 */
export function on(root, event, selector, handler) {
  root.addEventListener(event, (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  });
}

/** Cincin progres SVG (dipakai untuk target XP harian). */
export function ring(progress, label, color = 'var(--green)') {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return `
    <div class="ring">
      <svg class="ring__svg" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle class="ring__bg" cx="42" cy="42" r="${r}" fill="none" stroke-width="9" />
        <circle class="ring__fg" cx="42" cy="42" r="${r}" fill="none" stroke-width="9"
                stroke="${color}"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}" />
      </svg>
      <div class="ring__label">${label}</div>
    </div>`;
}

/** Bilah progres sederhana. */
export function bar(progress, color = 'var(--green)') {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return `<div class="bar"><div class="bar__fill" style="width:${pct}%;background:${color}"></div></div>`;
}

/** Tiga bintang, terisi sesuai nilai 0-3. */
export function stars(count, max = 3) {
  return '★'.repeat(count) + '☆'.repeat(Math.max(0, max - count));
}

let toastTimer = null;
export function toast(message, ms = 2200) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  el.setAttribute('role', 'status');
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), ms);
}

const CONFETTI_COLORS = ['#ffb020', '#35c47a', '#2f7ef2', '#e0489b', '#6c5ce7'];

export function confetti(pieces = 60) {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const wrap = document.createElement('div');
  wrap.className = 'confetti';
  wrap.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < pieces; i++) {
    const bit = document.createElement('i');
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    bit.style.animationDuration = `${1.4 + Math.random() * 1.4}s`;
    bit.style.animationDelay = `${Math.random() * 0.5}s`;
    wrap.appendChild(bit);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 3600);
}

/** Panel yang muncul dari bawah layar. */
export function sheet(innerHtml) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  backdrop.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">
    <div class="sheet__handle"></div>
    ${innerHtml}
  </div>`;
  const close = () => backdrop.remove();
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.body.appendChild(backdrop);
  return { el: backdrop, close };
}

/** Getaran halus sebagai umpan balik (diabaikan bila tidak didukung). */
export function buzz(pattern = 30) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* diabaikan */
  }
}
