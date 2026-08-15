// Kamusku: seluruh kata di level aktif beserta status hafalannya.

import { esc } from '../dom.js';
import { navBar, topBar, emptyState } from './shared.js';

export function wordbookView({ snapshot, levels, activeLevel, words, pendingMissions }) {
  const mastered = words.filter((w) => (w.card?.box || 0) >= 4).length;
  const started = words.filter((w) => w.card).length;
  const bridged = words.filter((w) => w.bridge).length;

  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <div class="level-tabs" role="tablist" aria-label="Pilih level">
      ${levels
        .filter((l) => l.status === 'ready')
        .map(
          (l) => `<button class="level-tab" role="tab" aria-selected="${l.id === activeLevel.id}"
                    data-level="${l.id}" ${l.unlocked ? '' : 'disabled'}>${l.emoji} ${esc(l.code)}</button>`
        )
        .join('')}
    </div>

    <section class="card">
      <div class="result__grid" style="margin:0">
        <div class="result__stat"><b>${words.length}</b><span>Total kata</span></div>
        <div class="result__stat"><b>${started}</b><span>Sudah dilatih</span></div>
        <div class="result__stat"><b>${mastered}</b><span>Dikuasai</span></div>
      </div>
    </section>

    ${
      bridged
        ? `<section class="card" style="border-color:var(--brand)">
             <p class="small" style="margin:0">
               🌉 ${bridged} kata di daftar ini adalah <b>bekal HSK</b> — belum keluar di
               ${esc(activeLevel.code)}, tapi sengaja dititipkan supaya nanti tidak kaget.
             </p>
           </section>`
        : ''
    }

    <section class="card">
      <h2 class="card__title">📚 Daftar Kata — ${esc(activeLevel.code)}</h2>
      ${
        words.length === 0
          ? emptyState('📭', 'Belum ada kata', 'Materi level ini belum diimpor.')
          : words.map(row).join('')
      }
    </section>
  </div>
  ${navBar('wordbook', pendingMissions)}`;
}

function row(w) {
  const box = w.card?.box || 0;
  const tag = w.bridge
    ? `<span class="tag tag--bridge">🌉 ${esc(w.fromCode)}</span>`
    : w.alsoIn?.length
      ? `<span class="tag tag--also">🏅 ${esc(w.alsoIn.join(' & '))}</span>`
      : '';
  return `
  <div class="word-row">
    <div class="word-row__zh hanzi">${esc(w.zh)}</div>
    <div class="word-row__body">
      <div class="word-row__py">${esc(w.py)}</div>
      <div style="font-weight:700;font-size:.92rem">${esc(w.id)} ${tag}</div>
      <div class="small muted">${esc(w.en)} · Pelajaran ${w.lesson}</div>
    </div>
    <div style="text-align:right">
      <button class="btn btn--ghost btn--sm" data-speak="${esc(w.zh)}" style="width:auto" aria-label="Dengar ${esc(w.zh)}">🔊</button>
      <div class="box-dots" style="margin-top:6px;justify-content:flex-end">
        ${Array.from({ length: 6 }, (_, i) => `<span class="box-dot ${i < box ? 'box-dot--on' : ''}"></span>`).join('')}
      </div>
    </div>
  </div>`;
}
