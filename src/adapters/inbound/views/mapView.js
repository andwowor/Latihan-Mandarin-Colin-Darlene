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
  // Tanda buku menandai pelajaran yang materinya belum pernah dibaca.
  const mark = done ? '✓' : lesson.isReview ? '★' : lesson.number;
  return `
  <div class="path__row">
    <button class="${playable ? cls : 'node node--locked'}"
            data-lesson="${lesson.number}"
            ${playable ? '' : 'disabled'}
            aria-label="Pelajaran ${lesson.number}: ${esc(lesson.titleId)}${playable && !lesson.studied ? ' — materi belum dibaca' : ''}">
      <span class="node__disc">${mark}${playable && !lesson.studied ? '<span class="node__flag" aria-hidden="true">📘</span>' : ''}</span>
      <span class="node__stars" style="color:var(--amber)">${stars(Math.round(lesson.starsEarned / 3))}</span>
      <span class="node__label hanzi">${esc(lesson.titleZh)}</span>
      <span class="node__label">${esc(lesson.titleId)}</span>
    </button>
  </div>`;
}

/** Isi panel pilih keterampilan setelah sebuah pelajaran diketuk. */
export function skillSheet(lesson, skills) {
  const locked = lesson.practiceLocked;
  return `
  <h2 style="margin:0 0 2px">Pelajaran ${lesson.number}</h2>
  <p class="muted small" style="margin:0 0 4px">
    <span class="hanzi" style="font-size:1.15rem">${esc(lesson.titleZh)}</span> — ${esc(lesson.titleId)}
  </p>
  <p class="small muted" style="margin:0 0 16px">
    ${lesson.vocabCount} kata · ${lesson.sentenceCount} kalimat kunci${lesson.listeningCount ? ` · ${lesson.listeningCount} kalimat simakan` : ''}${lesson.bridgeCount ? ` · ${lesson.bridgeCount} bekal HSK` : ''}
  </p>

  <button class="skill-btn skill-btn--study" data-start-study>
    <span class="skill-btn__emoji">${lesson.studied ? '📖' : '📘'}</span>
    <span class="grow">${lesson.studied ? 'Baca Ulang Materi' : 'Sesi Belajar'}
      <span class="skill-btn__sub">
        ${lesson.studied ? 'Segarkan ingatan sebelum berlatih lagi' : 'Kenali kata & kalimatnya dulu — belum ada soal di sini'}
      </span>
    </span>
    <span>${lesson.studied ? '✅' : '▶︎'}</span>
  </button>

  ${
    locked
      ? `<p class="small muted" style="margin:2px 0 12px">
           🔒 Soal terbuka setelah sesi belajar selesai. Begitu materinya dibaca sekali,
           keempat latihan di bawah bisa dibuka kapan saja.
         </p>`
      : '<div style="height:6px"></div>'
  }

  ${skills
    .map(
      (s) => `
    <button class="skill-btn" data-start-skill="${s.id}" ${locked ? 'disabled' : ''}>
      <span class="skill-btn__emoji">${locked ? '🔒' : s.emoji}</span>
      <span class="grow">${esc(s.labelId)}
        <span class="skill-btn__sub">${skillHint(s.id)}</span>
      </span>
      <span style="color:var(--amber)">${stars(lesson.stars[s.id] || 0)}</span>
    </button>`
    )
    .join('')}

  <button class="skill-btn" data-start-skill="mixed" ${locked ? 'disabled' : ''}>
    <span class="skill-btn__emoji">${locked ? '🔒' : '🎲'}</span>
    <span class="grow">Campur Semua<span class="skill-btn__sub">Baca, dengar, ucap, dan tulis bergantian</span></span>
  </button>`;
}

function skillHint(id) {
  return {
    reading: 'Pilih arti, pinyin, dan tulisan yang tepat',
    listening: 'Dengarkan lalu pilih jawabannya',
    speaking: 'Ucapkan dengan lantang, suaramu dinilai',
    writing: 'Tebalkan huruf dan susun kalimat'
  }[id] || '';
}
