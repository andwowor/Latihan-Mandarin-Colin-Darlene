// Pembuat soal. Dari data kurikulum (kosakata + kalimat kunci + skrip listening)
// dibangkitkan soal beserta kunci jawabannya, sehingga evaluasi 100% otomatis.
//
// Setiap soal punya bentuk seragam:
//   { id, skill, type, prompt, promptSub, speak, options[], answer, explain, word }
// `answer` adalah nilai yang harus cocok dengan pilihan yang ditekan anak.

import { shuffle, sampleMany, uid } from '../shared/utils.js';

const MAX_OPTIONS = 4;

/** Kunci unik sebuah kata, dipakai oleh SRS. */
export function wordKey(levelId, word) {
  return `${levelId}:${word.zh}`;
}

/** Ambil pengecoh dari kumpulan kata lain di level yang sama. */
function distractors(pool, correct, pick, rng) {
  const candidates = pool.filter((w) => pick(w) && pick(w) !== pick(correct));
  const unique = [];
  const seen = new Set();
  for (const c of shuffle(candidates, rng)) {
    const value = pick(c);
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(c);
    if (unique.length >= MAX_OPTIONS - 1) break;
  }
  return unique;
}

function buildChoice(pool, correct, pick, rng) {
  const others = distractors(pool, correct, pick, rng);
  const options = shuffle([correct, ...others].map(pick), rng);
  return { options, answer: pick(correct) };
}

// ---------------------------------------------------------------- READING

function readingZhToMeaning(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.id, rng);
  return {
    id: uid('q'),
    skill: 'reading',
    type: 'zh2meaning',
    instructionId: 'Apa arti kata ini?',
    prompt: word.zh,
    promptSub: word.py,
    speak: word.zh,
    options,
    answer,
    explain: `${word.zh} (${word.py}) = ${word.id}`,
    word
  };
}

function readingMeaningToZh(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.zh, rng);
  return {
    id: uid('q'),
    skill: 'reading',
    type: 'meaning2zh',
    instructionId: 'Pilih tulisan Mandarin yang benar',
    prompt: word.id,
    promptSub: word.en,
    speak: null,
    options,
    answer,
    optionStyle: 'hanzi',
    explain: `${word.id} = ${word.zh} (${word.py})`,
    word
  };
}

function readingPinyinToZh(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.zh, rng);
  return {
    id: uid('q'),
    skill: 'reading',
    type: 'pinyin2zh',
    instructionId: 'Pinyin ini tulisannya yang mana?',
    prompt: word.py,
    promptSub: word.id,
    speak: word.zh,
    options,
    answer,
    optionStyle: 'hanzi',
    explain: `${word.py} = ${word.zh}`,
    word
  };
}

function readingZhToPinyin(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.py, rng);
  return {
    id: uid('q'),
    skill: 'reading',
    type: 'zh2pinyin',
    instructionId: 'Bagaimana cara membacanya?',
    prompt: word.zh,
    promptSub: null,
    speak: word.zh,
    options,
    answer,
    explain: `${word.zh} dibaca ${word.py}`,
    word
  };
}

function readingSentence(sentence, sentencePool, rng) {
  const others = sampleMany(
    sentencePool.filter((s) => s.zh !== sentence.zh),
    MAX_OPTIONS - 1,
    rng
  );
  const options = shuffle([sentence, ...others].map((s) => s.id), rng);
  return {
    id: uid('q'),
    skill: 'reading',
    type: 'sentenceMeaning',
    instructionId: 'Apa arti kalimat ini?',
    prompt: sentence.zh,
    promptSub: sentence.py,
    speak: sentence.zh,
    options,
    answer: sentence.id,
    explain: `${sentence.zh} = ${sentence.id}`,
    word: null
  };
}

// -------------------------------------------------------------- LISTENING

function listeningToZh(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.zh, rng);
  return {
    id: uid('q'),
    skill: 'listening',
    type: 'hear2zh',
    instructionId: 'Dengarkan, lalu pilih tulisannya',
    prompt: null,
    promptSub: null,
    speak: word.zh,
    autoPlay: true,
    options,
    answer,
    optionStyle: 'hanzi',
    explain: `Yang kamu dengar: ${word.zh} (${word.py}) = ${word.id}`,
    word
  };
}

function listeningToMeaning(word, pool, levelId, rng) {
  const { options, answer } = buildChoice(pool, word, (w) => w.id, rng);
  return {
    id: uid('q'),
    skill: 'listening',
    type: 'hear2meaning',
    instructionId: 'Dengarkan, lalu pilih artinya',
    prompt: null,
    promptSub: null,
    speak: word.zh,
    autoPlay: true,
    options,
    answer,
    explain: `Yang kamu dengar: ${word.zh} (${word.py}) = ${word.id}`,
    word
  };
}

function listeningSentence(script, scriptPool, rng) {
  const others = sampleMany(
    scriptPool.filter((s) => s !== script),
    MAX_OPTIONS - 1,
    rng
  );
  const options = shuffle([script, ...others], rng);
  return {
    id: uid('q'),
    skill: 'listening',
    type: 'hearSentence',
    instructionId: 'Dengarkan kalimatnya, pilih yang cocok',
    prompt: null,
    promptSub: null,
    speak: script,
    autoPlay: true,
    options,
    answer: script,
    optionStyle: 'hanzi-sentence',
    explain: `Yang kamu dengar: ${script}`,
    word: null
  };
}

// ---------------------------------------------------------------- WRITING

function writingTrace(word) {
  // Karakter tunggal paling cocok untuk dilatih menulis.
  const char = [...word.zh][0];
  return {
    id: uid('q'),
    skill: 'writing',
    type: 'trace',
    instructionId: 'Tebalkan hurufnya dengan jarimu',
    prompt: char,
    promptSub: `${word.py} — ${word.id}`,
    speak: word.zh,
    options: [],
    answer: char,
    explain: `${word.zh} (${word.py}) = ${word.id}`,
    word
  };
}

function writingAssembleWord(word, pool, rng) {
  const chars = [...word.zh];
  const extras = sampleMany(
    pool.flatMap((w) => [...w.zh]).filter((c) => !chars.includes(c)),
    Math.min(3, Math.max(2, chars.length)),
    rng
  );
  return {
    id: uid('q'),
    skill: 'writing',
    type: 'assemble',
    instructionId: 'Susun hurufnya jadi kata yang benar',
    prompt: word.id,
    promptSub: word.py,
    speak: word.zh,
    tiles: shuffle([...chars, ...extras], rng),
    options: [],
    answer: word.zh,
    explain: `${word.id} = ${word.zh} (${word.py})`,
    word
  };
}

function writingBuildSentence(sentence, rng) {
  // Pecah kalimat jadi potongan kata. Tanda baca akhir dilepas supaya
  // anak fokus pada urutan kata.
  const cleaned = sentence.zh.replace(/[。！？]/g, '');
  const parts = segmentSentence(cleaned, sentence.py);
  if (parts.length < 2) return null;
  return {
    id: uid('q'),
    skill: 'writing',
    type: 'buildSentence',
    instructionId: 'Susun kalimatnya dari kata-kata ini',
    prompt: sentence.id,
    promptSub: sentence.en,
    speak: sentence.zh,
    tiles: shuffle(parts, rng),
    options: [],
    answer: parts.join(''),
    explain: `${sentence.zh} = ${sentence.id}`,
    word: null
  };
}

/**
 * Pecah kalimat Mandarin menjadi kata memakai spasi pada pinyin sebagai
 * petunjuk jumlah suku kata per kata. Kalau tidak cocok, jatuh kembali ke
 * pemecahan per karakter.
 */
export function segmentSentence(zh, pinyin) {
  const chars = [...zh];
  if (!pinyin) return chars;
  const syllablesPerWord = pinyin
    .replace(/[.,!?，。！？]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(countSyllables);
  const total = syllablesPerWord.reduce((a, b) => a + b, 0);
  if (total !== chars.length) return chars;

  const parts = [];
  let i = 0;
  for (const n of syllablesPerWord) {
    parts.push(chars.slice(i, i + n).join(''));
    i += n;
  }
  return parts;
}

/** Hitung suku kata dalam satu blok pinyin (mis. "zàijiàn" = 2). */
function countSyllables(block) {
  const vowels = block.toLowerCase().match(/[aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/g);
  return vowels ? vowels.length : 1;
}

// ------------------------------------------------------------- ORKESTRASI

const READING_BUILDERS = [readingZhToMeaning, readingMeaningToZh, readingPinyinToZh, readingZhToPinyin];
const LISTENING_BUILDERS = [listeningToZh, listeningToMeaning];

/**
 * Bangun satu set soal untuk sebuah pelajaran.
 *
 * @param {object} args
 * @param {object} args.lesson      pelajaran terpilih
 * @param {object[]} args.pool      seluruh kosakata level (untuk pengecoh)
 * @param {string} args.skill       'reading' | 'listening' | 'writing' | 'mixed'
 * @param {string[]} args.orderedWords urutan kata dari SRS (kunci wordKey)
 * @param {number} args.count       jumlah soal
 */
export function buildRound({ lesson, pool, levelId, skill, orderedWords = [], count = 10, rng = Math.random }) {
  const lessonWords = lesson.vocab || [];
  if (lessonWords.length === 0 && (lesson.keySentences || []).length === 0) return [];

  // Urutkan kata pelajaran mengikuti prioritas SRS bila tersedia.
  const priority = new Map(orderedWords.map((k, i) => [k, i]));
  const words = lessonWords
    .slice()
    .sort((a, b) => (priority.get(wordKey(levelId, a)) ?? 999) - (priority.get(wordKey(levelId, b)) ?? 999));

  const sentences = lesson.keySentences || [];
  const scripts = lesson.listeningScripts || [];
  const questions = [];
  let i = 0;
  let guard = 0;

  while (questions.length < count && guard < count * 12) {
    guard++;
    const word = words[i % Math.max(1, words.length)];
    i++;
    const currentSkill = skill === 'mixed' ? pickSkill(questions.length, rng) : skill;
    const q = buildOne(currentSkill, { word, words, pool, sentences, scripts, levelId, rng });
    if (q) questions.push(q);
  }
  return questions.slice(0, count);
}

function pickSkill(index, rng) {
  const order = ['reading', 'listening', 'writing'];
  return order[index % order.length];
}

function buildOne(skill, ctx) {
  const { word, words, pool, sentences, scripts, levelId, rng } = ctx;

  if (skill === 'reading') {
    // Sesekali selipkan soal kalimat supaya tidak monoton.
    if (sentences.length && rng() < 0.25) {
      return readingSentence(sentences[Math.floor(rng() * sentences.length)], sentences, rng);
    }
    if (!word) return null;
    const builder = READING_BUILDERS[Math.floor(rng() * READING_BUILDERS.length)];
    return builder(word, pool, levelId, rng);
  }

  if (skill === 'listening') {
    if (scripts.length && rng() < 0.35) {
      return listeningSentence(scripts[Math.floor(rng() * scripts.length)], scripts, rng);
    }
    if (!word) return null;
    const builder = LISTENING_BUILDERS[Math.floor(rng() * LISTENING_BUILDERS.length)];
    return builder(word, pool, levelId, rng);
  }

  if (skill === 'writing') {
    const roll = rng();
    if (sentences.length && roll < 0.3) {
      const built = writingBuildSentence(sentences[Math.floor(rng() * sentences.length)], rng);
      if (built) return built;
    }
    if (!word) return null;
    if (roll < 0.65 && [...word.zh].length > 1) return writingAssembleWord(word, pool, rng);
    return writingTrace(word);
  }

  return null;
}

/** Evaluasi jawaban. Satu pintu masuk untuk semua tipe soal. */
export function grade(question, response) {
  if (question.type === 'trace') {
    // Nilai tracing datang dari canvas: 0..1 kemiripan.
    return { correct: (response?.coverage ?? 0) >= 0.6, detail: response };
  }
  const given = typeof response === 'string' ? response : response?.value;
  return { correct: given === question.answer, detail: given };
}
