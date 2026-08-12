// Peta pelajaran: pemilih level + jalur pelajaran bergaya papan permainan.

import { esc, stars } from '../dom.js';
import { navBar, topBar, emptyState } from './shared.js';

export function mapView({ snapshot, levels, activeLevel, lessons, pendingMissions }) {
  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <div class="level-tabs" role="tablist" aria-label="Pilih level">
      ${levels.map((l) => levelTab(l, activeLevel.id)).join('')}
    </div>

    ${statusBanner(activeLevel)}

    ${
      lessons.length === 0
        ? emptyState('🚧', 'Materi belum tersedia', 'Level ini belum diimpor dari buku sumbernya.')
        : `<div class="path">${lessons.map(node).join('')}</div>`
    }
  </div>
  ${navBar('map', pendingMissions)}`;
}

function levelTab(level, activeId) {
  const usable = level.status === 'ready' && level.unlocked;
  const lockNote = level.locked ? ` 🔒` : level.status !== 'ready' ? ' ⋯' : '';
  return `
  <button class="level-tab" role="tab"
          aria-selected="${level.id === activeId}"
          data-level="${level.id}"
          ${usable ? '' : 'disabled'}>
    ${level.emoji} ${esc(level.code)}${lockNote}
  </button>`;
}

function statusBanner(level) {
  if (level.status === 'missing-source') {
    return `<section class="card"><p class="small" style="margin:0">
      📭 Folder <b>HSK 1</b> di komputer masih kosong, jadi materinya belum bisa diambil.
      Taruh berkas PDF-nya di folder itu lalu jalankan importer.
    </p></section>`;
  }
  if (level.status === 'pending-import') {
    return `<section class="card"><p class="small" style="margin:0">
      ⏳ ${esc(level.code)} sudah terdaftar tapi isinya belum diimpor dari PDF.
      Lihat <code>docs/importing-content.md</code> untuk menambahkannya.
    </p></section>`;
  }
  if (level.locked) {
    return `<section class="card"><p class="small" style="margin:0">
      🔒 Terbuka setelah ${level.unlockAtXp} XP. Terus berlatih ya!
    </p></section>`;
  }
  return '';
}

function node(lesson) {
  const done = lesson.completed;
  const cls = done ? 'node node--done' : lesson.started ? 'node' : 'node';
  const playable = lesson.vocabCount > 0 || lesson.sentenceCount > 0;
  return `
  <div class="path__row">
    <button class="${playable ? cls : 'node node--locked'}"
            data-lesson="${lesson.number}"
            ${playable ? '' : 'disabled'}
            aria-label="Pelajaran ${lesson.number}: ${esc(lesson.titleId)}">
      <span class="node__disc">${done ? '✓' : lesson.isReview ? '★' : lesson.number}</span>
      <span class="node__stars" style="color:var(--amber)">${stars(Math.round(lesson.starsEarned / 3))}</span>
      <span class="node__label hanzi">${esc(lesson.titleZh)}</span>
      <span class="node__label">${esc(lesson.titleId)}</span>
    </button>
  </div>`;
}

/** Isi panel pilih keterampilan setelah sebuah pelajaran diketuk. */
export function skillSheet(lesson, skills) {
  return `
  <h2 style="margin:0 0 2px">Pelajaran ${lesson.number}</h2>
  <p class="muted small" style="margin:0 0 4px">
    <span class="hanzi" style="font-size:1.15rem">${esc(lesson.titleZh)}</span> — ${esc(lesson.titleId)}
  </p>
  <p class="small muted" style="margin:0 0 16px">
    ${lesson.vocabCount} kata · ${lesson.sentenceCount} kalimat kunci${lesson.listeningCount ? ` · ${lesson.listeningCount} kalimat simakan` : ''}
  </p>

  ${skills
    .map(
      (s) => `
    <button class="skill-btn" data-start-skill="${s.id}">
      <span class="skill-btn__emoji">${s.emoji}</span>
      <span class="grow">${esc(s.labelId)}
        <span class="skill-btn__sub">${skillHint(s.id)}</span>
      </span>
      <span style="color:var(--amber)">${stars(lesson.stars[s.id] || 0)}</span>
    </button>`
    )
    .join('')}

  <button class="skill-btn" data-start-skill="mixed">
    <span class="skill-btn__emoji">🎲</span>
    <span class="grow">Campur Semua<span class="skill-btn__sub">Baca, dengar, dan tulis bergantian</span></span>
  </button>`;
}

function skillHint(id) {
  return {
    reading: 'Pilih arti, pinyin, dan tulisan yang tepat',
    listening: 'Dengarkan lalu pilih jawabannya',
    writing: 'Tebalkan huruf dan susun kalimat'
  }[id] || '';
}
