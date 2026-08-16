// Laporan progres: perbandingan Colin vs Darlene per periode,
// grafik XP, dan rincian per keterampilan.

import { esc } from '../dom.js';
import { navBar, topBar, avatar } from './shared.js';

export function progressView({ snapshot, periods, activePeriod, leaderboard, report, otherReport, skills, pendingMissions }) {
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
    ${chartCard(report, otherReport)}
    ${skillsCard(skills)}
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
    <div class="versus__avatar">${avatar(entry.profile)}</div>
    <div style="font-weight:800">${esc(entry.profile.name)}</div>
    <div class="versus__xp" style="color:${entry.profile.color}">${entry.totals.xp}</div>
    <div class="small muted">XP · ${entry.totals.accuracy}% tepat</div>
    <div class="small muted">${entry.totals.activeDays} hari aktif</div>
    ${entry.winner ? '<div style="font-size:1.3rem">👑</div>' : ''}
  </div>`;
}

function chartCard(report, otherReport) {
  const max = Math.max(
    1,
    ...report.series.map((d) => d.xp),
    ...otherReport.series.map((d) => d.xp)
  );
  // Warna mengikuti anaknya, bukan posisinya. Kalau dibalik (anak yang sedang
  // masuk selalu ungu), warna yang sama akan berpindah orang begitu profil
  // diganti — dan keterangan warnanya jadi berbohong.
  return `
  <section class="card">
    <h2 class="card__title">📈 Grafik XP</h2>
    ${legend([report.profile, otherReport.profile])}
    <div class="chart">
      ${report.series
        .map((d, i) => {
          const other = otherReport.series[i] || { xp: 0 };
          return `
          <div class="chart__col">
            <div class="chart__bar" style="height:${Math.round((d.xp / max) * 100)}%;background:${report.profile.color}"
                 title="${esc(report.profile.name)} · ${esc(d.label)}: ${d.xp} XP"></div>
            <div class="chart__bar" style="height:${Math.round((other.xp / max) * 100)}%;background:${otherReport.profile.color}"
                 title="${esc(otherReport.profile.name)} · ${esc(d.label)}: ${other.xp} XP"></div>
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

/** Keterangan warna. Selalu ada bila ada dua anak — identitas tidak boleh
 *  bergantung pada warna saja. */
function legend(profiles) {
  return `
  <div class="legend">
    ${profiles
      .map(
        (p) => `
      <span class="legend__item">
        <i class="legend__swatch" style="background:${p.color}"></i>${avatar(p)} ${esc(p.name)}
      </span>`
      )
      .join('')}
  </div>`;
}

function skillsCard(skills = []) {
  if (!skills.length) return '';
  const profiles = skills[0].entries.map((e) => e.profile);

  return `
  <section class="card">
    <h2 class="card__title">🎓 Ketepatan per Keterampilan</h2>
    ${legend(profiles)}
    ${skills.map(skillGroup).join('')}
    <p class="small muted" style="margin:14px 0 0">
      Panjang batang = persentase jawaban benar. Angka di sebelahnya menunjukkan
      berapa soal yang sudah dikerjakan — ketepatan tinggi dari sedikit soal
      belum tentu berarti sudah kuat.
    </p>
  </section>`;
}

function skillGroup(skill) {
  return `
  <div class="skillcmp">
    <div class="skillcmp__head">
      <span class="skillcmp__emoji" aria-hidden="true">${skill.emoji}</span>
      <span class="skillcmp__name">${esc(skill.labelId)}</span>
      ${skill.anyTried ? '' : '<span class="small muted">belum dicoba keduanya</span>'}
    </div>
    ${skill.entries.map((e) => skillRow(e, skill.labelId)).join('')}
  </div>`;
}

function skillRow(entry, skillLabel) {
  const p = entry.profile;
  const label = entry.tried
    ? `${esc(p.name)} · ${esc(skillLabel)}: ${entry.accuracy}% tepat, ${entry.correct} dari ${entry.answered} soal`
    : `${esc(p.name)} · ${esc(skillLabel)}: belum dicoba`;

  return `
  <div class="skillcmp__row ${entry.tried ? '' : 'skillcmp__row--idle'}" title="${label}" aria-label="${label}">
    <span class="skillcmp__who">${avatar(p)} ${esc(p.name)}</span>
    <span class="skillcmp__track">
      ${
        entry.tried
          ? `<span class="skillcmp__fill" style="width:${entry.accuracy}%;background:${p.color}"></span>`
          : ''
      }
    </span>
    <span class="skillcmp__val">
      ${
        entry.tried
          ? `<b>${entry.accuracy}%</b> <span class="muted">${entry.correct}/${entry.answered}</span>`
          : `<span class="muted">belum dicoba</span>`
      }
    </span>
  </div>`;
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
