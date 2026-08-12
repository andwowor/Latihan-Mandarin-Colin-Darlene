// Beranda: sapaan, target harian, misi harian, dan tombol mulai belajar.

import { esc } from '../dom.js';
import { navBar, topBar, goalCard, missionCard, levelProgressCard } from './shared.js';

export function homeView({ snapshot, missions, levelMeta, nextLesson, pendingMissions }) {
  return `
  <div class="screen screen--pad-nav">
    ${topBar(snapshot)}

    ${goalCard(snapshot)}
    ${levelProgressCard(snapshot)}

    <section class="card" style="background:linear-gradient(135deg, ${levelMeta.color}22, transparent)">
      <h2 class="card__title">${levelMeta.emoji} ${esc(levelMeta.code)}</h2>
      ${
        nextLesson
          ? `<p class="small muted" style="margin:0 0 12px">
               Pelajaran ${nextLesson.number} · <span class="hanzi">${esc(nextLesson.titleZh)}</span>
               <br>${esc(nextLesson.titleId)}
             </p>
             <button class="btn btn--primary" data-action="continue">▶︎ Lanjut Belajar</button>`
          : `<p class="small muted" style="margin:0 0 12px">Semua pelajaran di level ini sudah kamu selesaikan. Hebat!</p>
             <button class="btn btn--brand" data-nav="map">Lihat Peta Pelajaran</button>`
      }
      <button class="btn btn--ghost" style="margin-top:8px" data-nav="map">🗺️ Peta Pelajaran</button>
    </section>

    ${missionCard(missions)}

    <section class="card">
      <h2 class="card__title">⚡ Latihan Cepat</h2>
      <div class="stack">
        <button class="skill-btn" data-quick="reading">
          <span class="skill-btn__emoji">📖</span>
          <span class="grow">Membaca<br><span class="skill-btn__sub">Kenali huruf, pinyin, dan artinya</span></span>
        </button>
        <button class="skill-btn" data-quick="listening">
          <span class="skill-btn__emoji">🎧</span>
          <span class="grow">Mendengar<br><span class="skill-btn__sub">Dengar suaranya, pilih jawabannya</span></span>
        </button>
        <button class="skill-btn" data-quick="writing">
          <span class="skill-btn__emoji">✍️</span>
          <span class="grow">Menulis<br><span class="skill-btn__sub">Tebalkan huruf dan susun kalimat</span></span>
        </button>
      </div>
    </section>
  </div>
  ${navBar('home', pendingMissions)}`;
}
