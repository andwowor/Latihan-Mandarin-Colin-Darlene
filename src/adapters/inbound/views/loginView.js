// Halaman pilih profil. Tanpa password: satu ketukan pada nama = masuk.

import { esc } from '../dom.js';

export function loginView(snapshots) {
  return `
  <div class="screen login">
    <div>
      <div class="login__logo">🐼</div>
      <h1 class="login__title">Mandarin Fun</h1>
      <p class="login__sub">Siapa yang mau belajar hari ini?</p>
    </div>

    <div class="profile-grid">
      ${snapshots.map(card).join('')}
    </div>

    <p class="small muted" style="margin-top:auto">
      Progres tersimpan di perangkat ini. Pilih namamu untuk melanjutkan.
    </p>
  </div>`;
}

function card(s) {
  const c = s.config;
  return `
  <button class="profile-card" data-profile="${c.id}" style="border-color:${c.color}">
    <div class="profile-card__avatar">${c.emoji}</div>
    <div class="profile-card__name" style="color:${c.color}">${esc(c.name)}</div>
    <div class="profile-card__meta">${c.age} tahun · ${esc(c.grade)}</div>
    <div class="profile-card__stats">
      <span class="pill chip-level">Lv ${s.level}</span>
      <span class="pill chip-xp">⭐ ${s.xp}</span>
      <span class="pill chip-streak">🔥 ${s.streak.current}</span>
    </div>
  </button>`;
}
