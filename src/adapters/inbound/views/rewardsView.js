// Galeri lencana: yang sudah didapat berwarna, yang belum masih abu-abu.

import { esc } from '../dom.js';
import { navBar, topBar } from './shared.js';
import { BADGES } from '../../../domain/rewards.js';

export function rewardsView({ snapshot, pendingMissions }) {
  const earned = new Set(snapshot.badges || []);
  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <section class="card center">
      <div style="font-size:2.6rem">🏅</div>
      <h1 style="margin:4px 0;font-size:1.3rem">${earned.size} dari ${BADGES.length} lencana</h1>
      <p class="small muted" style="margin:0">Kumpulkan semuanya dengan berlatih setiap hari!</p>
    </section>

    <section class="card">
      <h2 class="card__title">Koleksi Lencana</h2>
      <div class="badge-grid">
        ${BADGES.map((b) => badge(b, earned.has(b.id))).join('')}
      </div>
    </section>

    <section class="card">
      <h2 class="card__title">🔥 Rekor</h2>
      <div class="result__grid" style="margin:0">
        <div class="result__stat"><b>${snapshot.streak.current}</b><span>Hari beruntun</span></div>
        <div class="result__stat"><b>${snapshot.streak.longest}</b><span>Rekor terpanjang</span></div>
        <div class="result__stat"><b>${snapshot.stats?.perfectRounds || 0}</b><span>Ronde sempurna</span></div>
      </div>
    </section>
  </div>
  ${navBar('rewards', pendingMissions)}`;
}

function badge(b, has) {
  return `
  <div class="badge ${has ? '' : 'badge--locked'}" title="${esc(b.descId)}">
    <div class="badge__emoji">${has ? b.emoji : '🔒'}</div>
    <div class="badge__name">${esc(b.titleId)}</div>
  </div>`;
}
