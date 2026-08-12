// Potongan tampilan yang dipakai lebih dari satu layar.

import { esc, bar } from '../dom.js';

export const NAV_ITEMS = [
  { id: 'home',     emoji: '🏠', label: 'Belajar' },
  { id: 'missions', emoji: '🎯', label: 'Misi' },
  { id: 'progress', emoji: '📊', label: 'Progres' },
  { id: 'rewards',  emoji: '🏅', label: 'Hadiah' },
  { id: 'wordbook', emoji: '📚', label: 'Kamus' }
];

/** Navigasi bawah. `pending` menandai jumlah misi yang siap diambil. */
export function navBar(active, pendingMissions = 0) {
  return `
  <nav class="nav" aria-label="Menu utama">
    ${NAV_ITEMS.map(
      (item) => `
      <button class="nav__item" data-nav="${item.id}"
              ${active === item.id ? 'aria-current="page"' : ''}>
        <span class="nav__emoji">${item.emoji}</span>
        ${item.id === 'missions' && pendingMissions > 0 ? `<span class="nav__badge">${pendingMissions}</span>` : ''}
        <span>${item.label}</span>
      </button>`
    ).join('')}
  </nav>`;
}

/** Baris identitas anak + ringkasan angka penting. */
export function topBar(snapshot) {
  const c = snapshot.config;
  return `
  <header class="topbar">
    <button class="topbar__avatar" data-action="switch-profile" aria-label="Ganti profil">${c.emoji}</button>
    <div class="grow">
      <div class="topbar__name">${esc(c.name)}</div>
      <div class="topbar__chips">
        <span class="pill chip-level">Lv ${snapshot.level}</span>
        <span class="pill chip-xp">⭐ ${snapshot.xp} XP</span>
        <span class="pill chip-streak">🔥 ${snapshot.streak.current}</span>
        <span class="pill chip-word">📚 ${snapshot.masteredWords}</span>
      </div>
    </div>
    <button class="btn btn--ghost btn--sm" data-action="parent" style="width:auto" aria-label="Menu orang tua">⚙️</button>
  </header>`;
}

/** Kartu target XP harian. */
export function goalCard(snapshot) {
  const g = snapshot.goal;
  return `
  <section class="card">
    <div class="goal">
      ${ringHtml(g.progress, `${g.xpToday}<br><span class="small muted">/${g.goalXp}</span>`)}
      <div class="grow">
        <div class="card__title" style="margin-bottom:4px">🎯 Target hari ini</div>
        <p class="small muted" style="margin:0 0 8px">
          ${g.reached ? 'Target hari ini sudah tercapai. Hebat!' : `Kurang ${g.goalXp - g.xpToday} XP lagi.`}
        </p>
        <div class="row small">
          <span class="pill chip-streak">🔥 ${snapshot.streak.current} hari beruntun</span>
        </div>
      </div>
    </div>
  </section>`;
}

function ringHtml(progress, label) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.max(0, Math.min(1, progress)));
  return `
    <div class="ring">
      <svg class="ring__svg" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
        <circle class="ring__bg" cx="42" cy="42" r="${r}" fill="none" stroke-width="9" />
        <circle class="ring__fg" cx="42" cy="42" r="${r}" fill="none" stroke-width="9"
                stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
      </svg>
      <div class="ring__label" style="line-height:1.1">${label}</div>
    </div>`;
}

/** Satu baris misi harian. */
export function missionRow(m) {
  return `
  <div class="mission ${m.done ? 'mission--done' : ''}">
    <div class="mission__icon">${m.emoji}</div>
    <div class="mission__body">
      <div class="mission__title">${esc(m.title)}</div>
      <div class="mission__meta">
        <span>${m.value} / ${m.target} ${esc(m.unit || '')}</span>
        <span>+${m.reward} XP</span>
      </div>
      ${bar(m.progress, m.done ? 'var(--green)' : 'var(--brand)')}
    </div>
    <div class="mission__check">${m.done ? (m.claimed ? '✅' : '🎁') : ''}</div>
  </div>`;
}

/** Kartu ringkas misi harian untuk beranda. */
export function missionCard(status) {
  return `
  <section class="card">
    <div class="row row--between" style="margin-bottom:10px">
      <h2 class="card__title" style="margin:0">🎯 Misi Harian</h2>
      <span class="pill ${status.allDone ? 'chip-level' : ''}">${status.completed}/${status.total}</span>
    </div>
    ${status.items.map(missionRow).join('')}
    ${
      status.allDone
        ? `<p class="small center" style="margin:10px 0 0">🎉 Semua misi hari ini selesai! Bonus +50 XP.</p>`
        : ''
    }
  </section>`;
}

export function levelProgressCard(snapshot) {
  return `
  <section class="card">
    <div class="row row--between small" style="margin-bottom:6px">
      <b>Level ${snapshot.level}</b>
      <span class="muted">${snapshot.xpIntoLevel} / ${snapshot.xpForNextLevel} XP</span>
    </div>
    ${bar(snapshot.progress, 'var(--brand)')}
  </section>`;
}

export function emptyState(emoji, title, body = '') {
  return `
  <div class="empty">
    <div class="empty__emoji">${emoji}</div>
    <p style="font-weight:800;margin:8px 0 4px">${esc(title)}</p>
    ${body ? `<p class="small">${esc(body)}</p>` : ''}
  </div>`;
}
