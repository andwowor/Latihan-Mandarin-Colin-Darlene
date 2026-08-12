// Layar misi harian lengkap dengan penjelasan dan riwayat singkat.

import { esc, bar } from '../dom.js';
import { navBar, topBar, missionRow } from './shared.js';

export function missionsView({ snapshot, missions, history, pendingMissions }) {
  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <section class="card">
      <div class="row row--between" style="margin-bottom:4px">
        <h1 class="card__title" style="margin:0;font-size:1.15rem">🎯 Misi Hari Ini</h1>
        <span class="pill ${missions.allDone ? 'chip-level' : ''}">${missions.completed}/${missions.total}</span>
      </div>
      <p class="small muted" style="margin:0 0 12px">
        Misi berganti setiap hari. Hadiah XP langsung masuk begitu misi tercapai.
      </p>
      ${bar(missions.total ? missions.completed / missions.total : 0, 'var(--amber)')}
    </section>

    <section class="card">
      ${missions.items.map(detailedRow).join('')}
      ${
        missions.allDone
          ? `<div class="badge-pop" style="margin-top:10px">
               <span class="badge-pop__emoji">🌈</span>
               <span><b>Semua misi selesai!</b><br><span class="small muted">Bonus +50 XP sudah ditambahkan.</span></span>
             </div>`
          : `<p class="small muted center" style="margin:12px 0 0">Selesaikan semua misi untuk bonus +50 XP.</p>`
      }
    </section>

    <section class="card">
      <h2 class="card__title">📅 7 Hari Terakhir</h2>
      ${history.length ? history.map(historyRow).join('') : '<p class="small muted">Belum ada catatan.</p>'}
    </section>

    <button class="btn btn--primary" data-nav="map">▶︎ Mulai Latihan</button>
  </div>
  ${navBar('missions', pendingMissions)}`;
}

function detailedRow(m) {
  return `
  ${missionRow(m)}
  <p class="small muted" style="margin:-4px 0 12px 52px">${esc(m.hint || '')}</p>`;
}

function historyRow(d) {
  return `
  <div class="row row--between small" style="padding:7px 0;border-bottom:1px solid var(--line)">
    <span>${esc(d.label)}</span>
    <span class="row" style="gap:10px">
      <span class="muted">${d.rounds} pelajaran</span>
      <span class="muted">${d.perfectRounds}× sempurna</span>
      <b>${d.xp} XP</b>
    </span>
  </div>`;
}
