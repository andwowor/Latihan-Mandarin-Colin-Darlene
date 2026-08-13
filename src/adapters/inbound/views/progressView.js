// Laporan progres: perbandingan Colin vs Darlene per periode,
// grafik XP, dan rincian per keterampilan.

import { esc, bar } from '../dom.js';
import { navBar, topBar } from './shared.js';

export function progressView({ snapshot, periods, activePeriod, leaderboard, report, otherReport, pendingMissions }) {
  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    <div class="period-tabs" role="tablist" aria-label="Pilih periode">
      ${periods
        .map(
          (p) => `<button class="period-tab" role="tab"
                    aria-selected="${p.id === activePeriod}"
                    data-period="${p.id}">${esc(p.labelId)}</button>`
        )
        .join('')}
    </div>

    ${versusCard(leaderboard)}
    ${chartCard(report, otherReport, leaderboard)}
    ${skillsCard(report)}
    ${statsCard(report)}
  </div>
  ${navBar('progress', pendingMissions)}`;
}

function versusCard(lb) {
  const [a, b] = lb.entries;
  return `
  <section class="card">
    <h2 class="card__title">🏆 Papan Skor — ${esc(lb.period.labelId)}</h2>
    <div class="versus">
      ${side(a)}
      <div class="versus__vs">VS</div>
      ${side(b)}
    </div>
    <p class="small center muted" style="margin:12px 0 0">
      ${
        lb.tie
          ? 'Seri! Sama-sama hebat 🤝'
          : `${esc(lb.entries.find((e) => e.winner).profile.name)} unggul ${lb.gap} XP`
      }
    </p>
  </section>`;
}

function side(entry) {
  return `
  <div class="versus__side ${entry.winner ? 'versus__side--win' : ''}">
    <div class="versus__avatar">${entry.profile.emoji}</div>
    <div style="font-weight:800">${esc(entry.profile.name)}</div>
    <div class="versus__xp" style="color:${entry.profile.color}">${entry.totals.xp}</div>
    <div class="small muted">XP · ${entry.totals.accuracy}% tepat</div>
    <div class="small muted">${entry.totals.activeDays} hari aktif</div>
    ${entry.winner ? '<div style="font-size:1.3rem">👑</div>' : ''}
  </div>`;
}

function chartCard(report, otherReport, lb) {
  const max = Math.max(
    1,
    ...report.series.map((d) => d.xp),
    ...otherReport.series.map((d) => d.xp)
  );
  const [aCfg, bCfg] = lb.entries.map((e) => e.profile);
  return `
  <section class="card">
    <h2 class="card__title">📈 Grafik XP</h2>
    <div class="row small" style="gap:14px;margin-bottom:6px">
      <span class="row" style="gap:5px"><i style="width:11px;height:11px;border-radius:3px;background:var(--brand);display:inline-block"></i>${esc(aCfg.name)}</span>
      <span class="row" style="gap:5px"><i style="width:11px;height:11px;border-radius:3px;background:var(--pink);display:inline-block"></i>${esc(bCfg.name)}</span>
    </div>
    <div class="chart">
      ${report.series
        .map((d, i) => {
          const other = otherReport.series[i] || { xp: 0 };
          return `
          <div class="chart__col" title="${esc(d.label)}: ${d.xp} XP">
            <div class="chart__bar" style="height:${Math.round((d.xp / max) * 100)}%"></div>
            <div class="chart__bar chart__bar--b" style="height:${Math.round((other.xp / max) * 100)}%"></div>
          </div>`;
        })
        .join('')}
    </div>
    <div class="row row--between small muted" style="margin-top:6px">
      <span>${esc(report.series[0]?.label || '')}</span>
      <span>${esc(report.series[report.series.length - 1]?.label || '')}</span>
    </div>
  </section>`;
}

function skillsCard(report) {
  const meta = {
    reading: { emoji: '📖', label: 'Membaca', color: 'var(--blue)' },
    listening: { emoji: '🎧', label: 'Mendengar', color: 'var(--amber)' },
    speaking: { emoji: '🎤', label: 'Berbicara', color: 'var(--pink)' },
    writing: { emoji: '✍️', label: 'Menulis', color: 'var(--green)' }
  };
  return `
  <section class="card">
    <h2 class="card__title">🎓 Ketepatan per Keterampilan</h2>
    ${Object.entries(report.bySkill)
      .map(([id, stat]) => {
        const m = meta[id] || { emoji: '•', label: id, color: 'var(--brand)' };
        return `
        <div class="skill-row">
          <span class="skill-row__emoji">${m.emoji}</span>
          <span class="skill-row__bar">
            <div class="row row--between small" style="margin-bottom:3px">
              <span>${esc(m.label)}</span>
              <span class="muted">${stat.correct}/${stat.answered} · ${stat.accuracy}%</span>
            </div>
            ${bar(stat.answered ? stat.correct / stat.answered : 0, m.color)}
          </span>
        </div>`;
      })
      .join('')}
  </section>`;
}

function statsCard(report) {
  const t = report.totals;
  return `
  <section class="card">
    <h2 class="card__title">📋 Ringkasan ${esc(t.label)}</h2>
    <div class="result__grid" style="margin:0">
      <div class="result__stat"><b>${t.xp}</b><span>XP</span></div>
      <div class="result__stat"><b>${t.answered}</b><span>Soal</span></div>
      <div class="result__stat"><b>${t.accuracy}%</b><span>Tepat</span></div>
      <div class="result__stat"><b>${t.activeDays}</b><span>Hari aktif</span></div>
      <div class="result__stat"><b>${t.minutes}</b><span>Menit</span></div>
      <div class="result__stat"><b>${t.totalDays}</b><span>Hari dipantau</span></div>
    </div>
  </section>`;
}
