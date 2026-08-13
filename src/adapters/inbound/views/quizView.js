// Layar latihan. Satu tampilan menangani semua tipe soal
// (membaca, mendengar, menulis) agar alurnya konsisten bagi anak.

import { esc } from '../dom.js';

export function quizView({ round, question, index, total, canRecognise = true }) {
  const progress = total ? index / total : 0;
  return `
  <div class="screen quiz">
    <div class="quiz__head">
      <button class="btn btn--ghost btn--sm" data-action="quit" style="width:auto" aria-label="Keluar">✕</button>
      <div class="quiz__bar">
        <div class="bar"><div class="bar__fill" style="width:${Math.round(progress * 100)}%"></div></div>
      </div>
      ${round.streakCount >= 3 ? `<span class="quiz__combo">🔥${round.streakCount}</span>` : ''}
      <div class="quiz__hearts" aria-label="Sisa nyawa ${round.hearts}">${'❤️'.repeat(Math.max(0, round.hearts))}</div>
    </div>

    <p class="quiz__instruction">${esc(question.instructionId)}</p>

    <div class="grow">
      ${promptBlock(question)}
      ${answerBlock(question, canRecognise)}
    </div>

    <div id="feedback-slot"></div>
  </div>`;
}

// ------------------------------------------------------------------ prompt

function promptBlock(q) {
  if (q.skill === 'listening') {
    return `
    <div class="prompt">
      <button class="speaker" data-action="speak" aria-label="Putar suara">🔊</button>
      <div style="margin-top:14px">
        <button class="speaker speaker--slow" data-action="speak-slow" aria-label="Putar pelan">🐢</button>
      </div>
    </div>`;
  }

  if (q.skill === 'speaking') {
    // "Tirukan" menyembunyikan tulisannya: anak harus menangkapnya dari suara.
    return `
    <div class="prompt">
      ${
        q.hideTarget
          ? `<button class="speaker" data-action="speak" aria-label="Putar suara">🔊</button>
             <p class="muted small" style="margin:12px 0 0">Dengarkan baik-baik, lalu tirukan.</p>`
          : `<div class="hanzi prompt__zh ${q.type === 'saySentence' ? 'prompt__zh--sentence' : ''}">${esc(q.prompt)}</div>
             ${q.promptSub ? `<div class="prompt__py">${esc(q.promptSub)}</div>` : ''}
             <button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto;margin-top:12px">🔊 Dengar contoh</button>`
      }
    </div>`;
  }

  if (q.type === 'trace') {
    return `
    <div class="trace-wrap">
      <div class="trace-guide" aria-hidden="true"></div>
      <canvas class="trace-canvas" id="trace-guide-canvas" width="520" height="520" aria-hidden="true"></canvas>
      <canvas class="trace-canvas" id="trace-canvas" width="520" height="520"
              data-char="${esc(q.prompt)}"
              aria-label="Area menulis huruf ${esc(q.prompt)}"></canvas>
    </div>
    <p class="center muted small" style="margin:0 0 12px">${esc(q.promptSub || '')}</p>
    <div class="row" style="justify-content:center;gap:8px">
      <button class="btn btn--ghost btn--sm" data-action="trace-clear" style="width:auto">🧽 Hapus</button>
      <button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto">🔊 Dengar</button>
    </div>`;
  }

  if (q.type === 'assemble' || q.type === 'buildSentence') {
    return `
    <div class="prompt">
      <div class="prompt__id">${esc(q.prompt)}</div>
      ${q.promptSub ? `<div class="prompt__py">${esc(q.promptSub)}</div>` : ''}
    </div>`;
  }

  // Soal membaca
  const isSentence = q.type === 'sentenceMeaning';
  const isHanziPrompt = ['zh2meaning', 'zh2pinyin', 'sentenceMeaning'].includes(q.type);
  return `
  <div class="prompt">
    ${
      isHanziPrompt
        ? `<div class="hanzi prompt__zh ${isSentence ? 'prompt__zh--sentence' : ''}">${esc(q.prompt)}</div>`
        : `<div class="prompt__id">${esc(q.prompt)}</div>`
    }
    ${q.promptSub ? `<div class="prompt__py">${esc(q.promptSub)}</div>` : ''}
    ${q.speak ? `<button class="btn btn--ghost btn--sm" data-action="speak" style="width:auto;margin-top:12px">🔊 Dengar</button>` : ''}
  </div>`;
}

// ------------------------------------------------------------------ jawaban

function answerBlock(q, canRecognise = true) {
  if (q.skill === 'speaking') {
    // Tanpa pengenal suara: anak menirukan, lalu menilai sendiri bersama
    // orang tua. Tetap latihan yang berguna, hanya tanpa penilaian otomatis.
    if (!canRecognise) {
      return `
      <p class="center muted small" style="margin:0 0 12px">
        Perangkat ini belum bisa menilai suara otomatis. Ucapkan dengan lantang,
        lalu tekan tombolnya sendiri.
      </p>
      <button class="btn btn--primary" data-self-say="1">✅ Sudah bisa mengucapkan</button>
      <button class="btn btn--ghost" style="margin-top:8px" data-self-say="0">🔁 Belum, perlu latihan lagi</button>`;
    }
    return `
    <div class="mic-wrap">
      <button class="mic" data-action="record" aria-label="Tekan lalu bicara">🎤</button>
      <p class="mic__hint" id="mic-hint">Ketuk mikrofon, lalu ucapkan</p>
      <p class="mic__heard hanzi" id="mic-heard" aria-live="polite"></p>
    </div>`;
  }

  if (q.type === 'trace') {
    return `<button class="btn btn--primary" data-action="check-trace">Sudah Selesai</button>`;
  }

  if (q.type === 'assemble' || q.type === 'buildSentence') {
    return `
    <div class="builder" id="builder" aria-label="Susunan jawabanmu"></div>
    <div class="row" style="flex-wrap:wrap;gap:8px;margin-bottom:14px">
      ${q.tiles.map((t, i) => `<button class="tile hanzi" data-tile="${i}" data-value="${esc(t)}">${esc(t)}</button>`).join('')}
    </div>
    <button class="btn btn--primary" data-action="check-build" disabled>Periksa</button>`;
  }

  const style = q.optionStyle;
  const cls = style === 'hanzi' ? 'option option--hanzi' : style === 'hanzi-sentence' ? 'option option--sentence hanzi' : 'option';
  const wide = style === 'hanzi-sentence' || q.options.some((o) => String(o).length > 22);
  return `
  <div class="options ${wide ? 'options--wide' : ''}" role="group">
    ${q.options
      .map(
        (opt) => `<button class="${cls} ${style === 'hanzi' ? 'hanzi' : ''}" data-option="${esc(opt)}">${esc(opt)}</button>`
      )
      .join('')}
  </div>`;
}

// ------------------------------------------------------------ umpan balik

export function feedbackBlock({ correct, explain, isLast, speech }) {
  return `
  <div class="feedback ${correct ? 'feedback--ok' : 'feedback--bad'}">
    <div class="feedback__title">
      ${correct ? '🎉 Benar!' : '💡 Belum tepat'}
      ${speech && speech.stars ? `<span style="color:var(--amber)">${'★'.repeat(speech.stars)}</span>` : ''}
    </div>
    ${speech ? speechDetail(speech) : ''}
    <p class="feedback__body">${esc(explain || '')}</p>
    <div class="row" style="gap:8px">
      ${speech ? `<button class="btn btn--ghost" data-action="speak" style="width:auto">🔊</button>` : ''}
      <button class="btn ${correct ? 'btn--primary' : 'btn--danger'} grow" data-action="next">
        ${isLast ? 'Lihat Hasil' : 'Lanjut'}
      </button>
    </div>
  </div>`;
}

/** Rincian hasil pengenalan suara: apa yang terdengar dan seberapa mirip. */
function speechDetail(s) {
  if (s.selfAssessed) return '';
  const pct = Math.round((s.score || 0) * 100);
  return `
  <p class="feedback__body" style="margin-bottom:6px">
    ${esc(s.message || '')}
    ${
      s.heard
        ? `<br><span class="small muted">Terdengar:</span>
           <span class="hanzi" style="font-size:1.1rem">${esc(s.heard)}</span>
           <span class="small muted">(${pct}% mirip)</span>`
        : ''
    }
  </p>`;
}
