// Layar hasil setelah satu ronde selesai.

import { esc, stars, bar } from '../dom.js';
import { missionRow } from './shared.js';

export function resultView(summary) {
  const acc = summary.answered ? Math.round((summary.correct / summary.answered) * 100) : 0;
  const mr = summary.missionReward;

  return `
  <div class="screen result">
    <div class="result__stars" style="color:var(--amber)">${stars(summary.stars)}</div>
    <h1 class="result__title">${title(summary)}</h1>
    <p class="muted small" style="margin:0">
      ${esc(summary.levelCode)} · Pelajaran ${summary.lessonNumber} · ${esc(skillLabel(summary.skill))}
    </p>

    <div class="result__grid">
      <div class="result__stat"><b>${summary.correct}/${summary.answered}</b><span>Benar</span></div>
      <div class="result__stat"><b>${acc}%</b><span>Ketepatan</span></div>
      <div class="result__stat"><b>+${summary.xp}</b><span>XP</span></div>
    </div>

    ${
      summary.retried
        ? `<p class="small muted" style="margin:0 0 12px">
             \ud83d\udd01 ${summary.retried} soal baru pas di percobaan kedua \u2014 tetap dihitung benar,
             dan katanya akan muncul lagi lebih cepat.
           </p>`
        : ''
    }

    <div class="card" style="text-align:left">
      <div class="row row--between small" style="margin-bottom:6px">
        <b>Level ${summary.level.level}</b>
        <span class="muted">${summary.level.xpIntoLevel} / ${summary.level.xpForNextLevel} XP</span>
      </div>
      ${bar(summary.level.progress, 'var(--brand)')}
    </div>

    ${mr && mr.xp > 0 ? missionRewardCard(mr) : ''}
    ${summary.missionStatus ? missionProgressCard(summary.missionStatus) : ''}
    ${summary.newBadges?.length ? badgesCard(summary.newBadges) : ''}
    ${summary.mistakes?.length ? mistakesCard(summary.mistakes) : ''}

    <div class="stack" style="margin-top:12px">
      <button class="btn btn--primary" data-action="again">🔁 Latihan Lagi</button>
      <button class="btn btn--ghost" data-action="study-again">📘 Baca Ulang Materi</button>
      <button class="btn btn--ghost" data-nav="map">🗺️ Pilih Pelajaran Lain</button>
      <button class="btn btn--ghost" data-nav="home">🏠 Beranda</button>
    </div>
  </div>`;
}

function title(s) {
  if (s.outOfHearts) return 'Coba lagi ya!';
  if (s.perfect) return 'Sempurna! 🎉';
  if (s.stars >= 2) return 'Kerja bagus!';
  return 'Selesai!';
}

function skillLabel(id) {
  return { reading: 'Membaca', listening: 'Mendengar', speaking: 'Berbicara', writing: 'Menulis', mixed: 'Campur' }[id] || id;
}

function missionRewardCard(mr) {
  return `
  <div class="card" style="text-align:left;border-color:var(--amber)">
    <h2 class="card__title">🎁 Hadiah Misi</h2>
    ${mr.missions.map((m) => `<p class="small" style="margin:2px 0">${m.emoji} ${esc(m.title)} — <b>+${m.reward} XP</b></p>`).join('')}
    ${mr.bonus ? `<p class="small" style="margin:2px 0">🌈 Semua misi selesai — <b>+50 XP bonus</b></p>` : ''}
    <p style="margin:8px 0 0;font-weight:900">Total +${mr.xp} XP</p>
  </div>`;
}

function missionProgressCard(status) {
  return `
  <div class="card" style="text-align:left">
    <div class="row row--between" style="margin-bottom:10px">
      <h2 class="card__title" style="margin:0">🎯 Misi Harian</h2>
      <span class="pill ${status.allDone ? 'chip-level' : ''}">${status.completed}/${status.total}</span>
    </div>
    ${status.items.map(missionRow).join('')}
  </div>`;
}

function badgesCard(badges) {
  return `
  <div style="text-align:left">
    ${badges
      .map(
        (b) => `
      <div class="badge-pop">
        <span class="badge-pop__emoji">${b.emoji}</span>
        <span><b>Lencana baru: ${esc(b.titleId)}</b><br><span class="small muted">${esc(b.descId)}</span></span>
      </div>`
      )
      .join('')}
  </div>`;
}

function mistakesCard(mistakes) {
  const seen = new Set();
  const unique = mistakes.filter((m) => {
    const k = m.explain;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return `
  <div class="card" style="text-align:left">
    <h2 class="card__title">📌 Perlu diulang</h2>
    ${unique.map((m) => `<p class="small" style="margin:4px 0">• ${esc(m.explain)}</p>`).join('')}
  </div>`;
}
