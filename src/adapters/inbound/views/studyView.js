// Layar sesi belajar: satu kartu materi per layar, tanpa nilai dan tanpa
// jawaban salah. Tujuannya membuat anak mengenal kata dan kalimatnya lebih
// dulu, supaya soal latihan terasa seperti mengingat, bukan menebak.

import { esc } from '../dom.js';

export function studyView({ session, card, index, total }) {
  const progress = total > 1 ? index / (total - 1) : 1;
  return `
  <div class="screen study">
    <div class="quiz__head">
      <button class="btn btn--ghost btn--sm" data-action="study-quit" style="width:auto" aria-label="Keluar">✕</button>
      <div class="quiz__bar">
        <div class="bar"><div class="bar__fill" style="width:${Math.round(progress * 100)}%;background:var(--brand)"></div></div>
      </div>
      <span class="pill">${index + 1}/${total}</span>
    </div>

    <div class="grow">${cardBlock(card, session)}</div>

    ${card.kind === 'outro' ? '' : footer(index)}
  </div>`;
}

function footer(index) {
  return `
  <div class="row" style="gap:8px">
    <button class="btn btn--ghost" data-action="study-prev" style="width:auto" ${index === 0 ? 'disabled' : ''} aria-label="Kartu sebelumnya">←</button>
    <button class="btn btn--brand grow" data-action="study-next">Lanjut →</button>
  </div>`;
}

// -------------------------------------------------------------------- kartu

function cardBlock(card, session) {
  switch (card.kind) {
    case 'intro':    return introCard(card, session);
    case 'word':     return wordCard(card);
    case 'bridge':   return bridgeCard(card);
    case 'sentence': return sentenceCard(card);
    case 'outro':    return outroCard(card, session);
    default:         return '';
  }
}

function introCard(card, session) {
  const c = card.counts;
  return `
  <div class="study__cover">
    <div class="study__emoji">${session.replay ? '🔁' : '📘'}</div>
    <p class="muted small" style="margin:0">${esc(card.levelCode)} · Pelajaran ${card.lessonNumber}</p>
    <h1 class="hanzi study__title">${esc(card.titleZh)}</h1>
    <p class="study__subtitle">${esc(card.titleId)}</p>

    <div class="result__grid" style="width:100%">
      <div class="result__stat"><b>${c.words}</b><span>Kata baru</span></div>
      <div class="result__stat"><b>${c.sentences}</b><span>Kalimat</span></div>
      <div class="result__stat"><b>${c.bridge}</b><span>Bekal HSK</span></div>
    </div>

    <p class="small muted" style="margin:4px 0 0">
      ${
        session.replay
          ? 'Kamu sudah pernah belajar ini. Baca sekali lagi untuk menyegarkan ingatan ya.'
          : 'Kenali dulu kata-katanya. Setelah selesai, soal latihannya terbuka.'
      }
    </p>
  </div>`;
}

function wordCard(card) {
  const w = card.word;
  return `
  <p class="study__step">Kata ${card.position} dari ${card.of}</p>
  <div class="prompt study__card">
    <div class="hanzi prompt__zh">${esc(w.zh)}</div>
    <div class="prompt__py">${esc(w.py)}</div>
    <div class="study__meaning">${esc(w.id)}</div>
    <div class="small muted">${esc(w.en)}</div>

    ${card.alsoIn?.length ? tagAlsoIn(card.alsoIn) : ''}

    <div class="row" style="justify-content:center;gap:8px;margin-top:14px">
      <button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto">🔊 Dengar</button>
      <button class="btn btn--ghost btn--sm" data-action="speak-slow" style="width:auto">🐢 Pelan</button>
    </div>
  </div>
  ${card.example ? exampleBlock(card.example) : ''}`;
}

function bridgeCard(card) {
  const w = card.word;
  return `
  <p class="study__step">Bekal ${esc(card.fromCode)} — ${card.position} dari ${card.of}</p>
  <div class="prompt study__card study__card--bridge">
    <div class="study__ribbon">🌉 Belum keluar di YCT, tapi dipakai di ${esc(card.fromCode)}</div>
    <div class="hanzi prompt__zh">${esc(w.zh)}</div>
    <div class="prompt__py">${esc(w.py)}</div>
    <div class="study__meaning">${esc(w.id)}</div>
    <div class="small muted">${esc(w.en)}</div>

    <div class="row" style="justify-content:center;gap:8px;margin-top:14px">
      <button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto">🔊 Dengar</button>
      <button class="btn btn--ghost btn--sm" data-action="speak-slow" style="width:auto">🐢 Pelan</button>
    </div>
  </div>
  <p class="small muted center" style="margin:0">
    Kata ini bekal untuk nanti. Tidak apa-apa kalau belum langsung hafal.
  </p>`;
}

function sentenceCard(card) {
  const s = card.sentence;
  return `
  <p class="study__step">Kalimat ${card.position} dari ${card.of}</p>
  <div class="prompt study__card">
    <div class="hanzi prompt__zh prompt__zh--sentence">${esc(s.zh)}</div>
    <div class="prompt__py">${esc(s.py)}</div>
    <div class="study__meaning">${esc(s.id)}</div>
    <div class="small muted">${esc(s.en)}</div>

    <div class="row" style="justify-content:center;gap:8px;margin-top:14px">
      <button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto">🔊 Dengar</button>
      <button class="btn btn--ghost btn--sm" data-action="speak-slow" style="width:auto">🐢 Pelan</button>
    </div>
  </div>`;
}

function outroCard(card, session) {
  const c = card.counts;
  return `
  <div class="study__cover">
    <div class="study__emoji">🎉</div>
    <h1 class="study__title" style="font-size:1.6rem">Materi selesai dibaca!</h1>
    <p class="study__subtitle">
      ${esc(card.levelCode)} · Pelajaran ${card.lessonNumber} — <span class="hanzi">${esc(card.titleZh)}</span>
    </p>
    <p class="small muted" style="margin:0 0 4px">
      Kamu baru saja mengenal ${c.words} kata${c.bridge ? `, ${c.bridge} bekal HSK,` : ''} dan ${c.sentences} kalimat.
      Sekarang soalnya sudah terbuka.
    </p>

    <div class="stack" style="width:100%;margin-top:12px">
      <button class="btn btn--primary" data-action="study-to-quiz">▶︎ Mulai Latihan</button>
      <button class="btn btn--ghost" data-action="study-restart">🔁 Baca Ulang Materi</button>
      <button class="btn btn--ghost" data-action="study-done">🗺️ Nanti Saja</button>
    </div>
  </div>`;
}

// ------------------------------------------------------------------ potongan

function tagAlsoIn(codes) {
  return `
  <p class="study__badge" style="margin-top:12px">
    🏅 Kata ini juga ada di ${esc(codes.join(' & '))} — bekalmu sudah siap!
  </p>`;
}

function exampleBlock(sentence) {
  return `
  <section class="card study__example">
    <div class="small muted" style="margin-bottom:4px">Contoh pemakaian</div>
    <div class="hanzi" style="font-size:1.25rem">${esc(sentence.zh)}</div>
    <div class="small muted">${esc(sentence.py)}</div>
    <div class="small" style="font-weight:700">${esc(sentence.id)}</div>
    <button class="btn btn--ghost btn--sm" style="width:auto;margin-top:8px"
            data-speak="${esc(sentence.zh)}">🔊 Dengar kalimatnya</button>
  </section>`;
}
