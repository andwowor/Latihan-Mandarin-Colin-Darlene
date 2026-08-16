// Galeri lencana: yang sudah didapat berwarna, yang belum masih abu-abu.
//
// Koleksinya banyak, jadi dikelompokkan per jenis dan tiap kelompok membawa
// hitungannya sendiri. Tanpa itu, galerinya cuma jadi dinding ikon panjang
// yang tidak terbaca.

import { esc, bar } from '../dom.js';
import { navBar, topBar } from './shared.js';
import { BADGES, groupedBadges, nextBadges } from '../../../domain/rewards.js';

export function rewardsView({ snapshot, pendingMissions }) {
  const earnedIds = snapshot.badges || [];
  const groups = groupedBadges(earnedIds);
  const berikutnya = nextBadges(earnedIds, 3);
  const progress = BADGES.length ? earnedIds.length / BADGES.length : 0;

  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <section class="card center">
      <div style="font-size:2.6rem">🏅</div>
      <h1 style="margin:4px 0;font-size:1.3rem">${earnedIds.length} dari ${BADGES.length} lencana</h1>
      <div style="margin:10px 0 6px">${bar(progress, 'var(--amber)')}</div>
      <p class="small muted" style="margin:0">
        ${
          earnedIds.length === BADGES.length
            ? 'Semua lencana terkumpul. Luar biasa! 🎉'
            : `Kurang ${BADGES.length - earnedIds.length} lagi untuk melengkapi koleksi.`
        }
      </p>
    </section>

    ${berikutnya.length ? nextCard(berikutnya) : ''}

    ${groups.map(groupCard).join('')}

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

/** Tiga lencana terdekat — target yang terasa bisa dijangkau hari ini. */
function nextCard(items) {
  return `
  <section class="card" style="border-color:var(--amber)">
    <h2 class="card__title">🎯 Incaran Berikutnya</h2>
    ${items
      .map(
        (b) => `
      <div class="next-badge">
        <span class="next-badge__emoji">${b.emoji}</span>
        <span class="grow">
          <b>${esc(b.titleId)}</b>
          <span class="next-badge__desc">${esc(b.descId)}</span>
        </span>
      </div>`
      )
      .join('')}
  </section>`;
}

function groupCard(group) {
  const done = group.earnedCount === group.total;
  return `
  <section class="card">
    <div class="row row--between" style="margin-bottom:10px">
      <h2 class="card__title" style="margin:0">${group.emoji} ${esc(group.titleId)}</h2>
      <span class="pill ${done ? 'chip-level' : ''}">${group.earnedCount}/${group.total}</span>
    </div>
    <div class="badge-grid">
      ${group.items.map(badge).join('')}
    </div>
  </section>`;
}

function badge(b) {
  return `
  <div class="badge ${b.earned ? '' : 'badge--locked'}"
       title="${esc(b.titleId)} — ${esc(b.descId)}"
       aria-label="${esc(b.titleId)}: ${esc(b.descId)}${b.earned ? ' (sudah didapat)' : ' (belum didapat)'}">
    <div class="badge__emoji">${b.earned ? b.emoji : '🔒'}</div>
    <div class="badge__name">${esc(b.titleId)}</div>
  </div>`;
}
