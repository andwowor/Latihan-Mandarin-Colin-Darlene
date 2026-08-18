// Membangun versi SATU BERKAS dari aplikasi.
//
// Keluarannya `dist/mandarin-fun.html`: satu berkas HTML mandiri berisi
// seluruh gaya, kode, dan kurikulum. Berguna untuk dibuka langsung lewat
// tautan online, dikirim lewat email, atau disalin ke flashdisk — tanpa
// server dan tanpa berkas pendamping.
//
// Yang berbeda dari versi PWA di public/:
//   - konten dibaca dari objek dalam berkas, bukan lewat fetch()
//   - tidak ada service worker (tidak diperlukan: semuanya sudah menyatu)
//
// Pakai: node tools/build-standalone.mjs [path-ke-esbuild]

import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const esbuild = process.argv[2] || 'esbuild';
const curriculumDir = path.join(root, 'public/data/curriculum');
const tmp = path.join(root, '.build-tmp');

fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

// --- 1. Kumpulkan kurikulum menjadi satu objek -----------------------------

const index = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'index.json'), 'utf8'));
const bundle = { index, levels: {}, bridge: null, readings: null };
for (const meta of index.levels) {
  const file = path.join(curriculumDir, meta.file);
  if (meta.status === 'ready' && fs.existsSync(file)) {
    bundle.levels[meta.id] = JSON.parse(fs.readFileSync(file, 'utf8'));
  }
}

// Rencana bekal HSK ikut menyatu, supaya versi satu-berkas punya sesi belajar
// yang persis sama dengan versi PWA.
const bridgeFile = path.join(curriculumDir, 'bridge.json');
if (fs.existsSync(bridgeFile)) {
  bundle.bridge = JSON.parse(fs.readFileSync(bridgeFile, 'utf8'));
} else {
  console.warn('⚠️  bridge.json belum ada — jalankan "npm run bridge" agar bekal HSK ikut masuk.');
}

// Kamus lafal ikut menyatu, supaya penilaian berbicara di versi satu-berkas
// sama longgarnya dengan versi PWA (lihat ADR-0011).
const readingsFile = path.join(curriculumDir, 'readings.json');
if (fs.existsSync(readingsFile)) {
  bundle.readings = JSON.parse(fs.readFileSync(readingsFile, 'utf8'));
} else {
  console.warn('⚠️  readings.json belum ada — jalankan "npm run readings" agar homofon tidak dianggap salah.');
}

// --- 2. Adapter konten versi dalam-berkas ---------------------------------

fs.writeFileSync(
  path.join(tmp, 'inlineContentAdapter.js'),
  `import { ContentPort } from '${path.join(root, 'src/ports/contentPort.js')}';
import { mergeReadingSources } from '${path.join(root, 'src/domain/pronunciation.js')}';
export const CURRICULUM = ${JSON.stringify(bundle)};

/** Membaca kurikulum dari objek yang sudah menyatu, bukan lewat jaringan. */
export class InlineContentAdapter extends ContentPort {
  async listLevels() {
    return CURRICULUM.index.levels;
  }
  async loadLevel(levelId) {
    const meta = CURRICULUM.index.levels.find((l) => l.id === levelId);
    if (!meta) throw new Error('Level tidak dikenal: ' + levelId);
    const data = CURRICULUM.levels[levelId];
    if (!data) return { ...meta, lessons: [], unavailable: true };
    return { ...meta, ...data };
  }
  async loadBridge() {
    return CURRICULUM.bridge;
  }
  async loadReadings() {
    return CURRICULUM.readings ? mergeReadingSources(CURRICULUM.readings) : null;
  }
}\n`
);

// --- 3. Titik masuk (composition root) versi mandiri ----------------------

fs.writeFileSync(
  path.join(tmp, 'entry.js'),
  `import { InlineContentAdapter } from './inlineContentAdapter.js';
import { BridgedContentAdapter } from '${path.join(root, 'src/adapters/outbound/bridgedContentAdapter.js')}';
import { LocalStorageAdapter } from '${path.join(root, 'src/adapters/outbound/localStorageAdapter.js')}';
import { WebSpeechAdapter } from '${path.join(root, 'src/adapters/outbound/webSpeechAdapter.js')}';
import { WebSpeechRecognitionAdapter } from '${path.join(root, 'src/adapters/outbound/webSpeechRecognitionAdapter.js')}';
import { HttpSyncAdapter } from '${path.join(root, 'src/adapters/outbound/httpSyncAdapter.js')}';
import { ProfileService } from '${path.join(root, 'src/application/profileService.js')}';
import { CurriculumService } from '${path.join(root, 'src/application/curriculumService.js')}';
import { MissionService } from '${path.join(root, 'src/application/missionService.js')}';
import { PracticeService } from '${path.join(root, 'src/application/practiceService.js')}';
import { StudyService } from '${path.join(root, 'src/application/studyService.js')}';
import { StatsService } from '${path.join(root, 'src/application/statsService.js')}';
import { SyncService } from '${path.join(root, 'src/application/syncService.js')}';
import { UiController } from '${path.join(root, 'src/adapters/inbound/uiController.js')}';

async function bootstrap() {
  const root = document.getElementById('app');
  const content = new BridgedContentAdapter(new InlineContentAdapter());
  const storage = new LocalStorageAdapter();
  const speech = new WebSpeechAdapter();
  const recognition = new WebSpeechRecognitionAdapter();

  const profiles = new ProfileService(storage);
  const curriculum = new CurriculumService(content, profiles);
  const missions = new MissionService(profiles);
  const practice = new PracticeService(content, profiles, missions);
  const study = new StudyService(content, profiles);
  const stats = new StatsService(profiles);
  const sync = new SyncService(profiles, new HttpSyncAdapter());

  const ui = new UiController({ root, profiles, curriculum, practice, study, stats, missions, speech, recognition, sync });
  await ui.start();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { speech.cancel(); recognition.stop(); sync.sync(); }
  });
  window.addEventListener('online', () => sync.sync());
}

bootstrap().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML =
    '<div class="screen center"><div class="empty"><div class="empty__emoji">😢</div>' +
    '<p style="font-weight:800">Aplikasi gagal dimuat</p>' +
    '<p class="small muted">' + err.message + '</p></div></div>';
});\n`
);

// --- 4. Bundling ----------------------------------------------------------

const jsPath = path.join(tmp, 'app.bundle.js');
// --charset=ascii membuat esbuild meng-escape setiap karakter non-ASCII
// menjadi \uXXXX. Berkas keluaran jadi ASCII murni sehingga tidak pernah
// salah baca walau server tidak menyebutkan charset=utf-8 — penting karena
// hampir seluruh isinya huruf Han.
execFileSync(esbuild, [
  path.join(tmp, 'entry.js'),
  '--bundle',
  '--format=iife',
  '--target=es2020',
  '--charset=ascii',
  `--outfile=${jsPath}`
], { stdio: 'inherit' });

let bundled = fs.readFileSync(jsPath, 'utf8');

// Lambang anak ikut ditanam sebagai data URI. Tanpa ini versi satu-berkas
// akan mencari berkas gambar yang tidak ada di sebelahnya, lalu jatuh ke
// emoji cadangan — jalan, tapi tidak sama dengan versi PWA-nya.
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
let inlinedAvatars = 0;
for (const rel of [...new Set(bundled.match(/icons\/avatar-[\w.-]+/g) || [])]) {
  const file = path.join(root, 'public', rel);
  if (!fs.existsSync(file)) continue;
  const mime = MIME[path.extname(file).toLowerCase()];
  if (!mime) continue;
  const dataUri = `data:${mime};base64,${fs.readFileSync(file).toString('base64')}`;
  bundled = bundled.split(rel).join(dataUri);
  inlinedAvatars++;
}

// esbuild meng-escape literal string, tapi TIDAK literal regex — padahal
// exerciseFactory.js memakai regex berisi tanda baca Han (mis. /[。！？]/).
// Karena itu seluruh keluaran di-escape sendiri per unit UTF-16: hasilnya
// valid baik di dalam string, template, maupun kelas karakter regex.
const js = bundled.replace(/[^\x00-\x7F]/g, (unit) =>
  '\\u' + unit.charCodeAt(0).toString(16).padStart(4, '0')
);

// CSS diberi perlakuan sama: non-ASCII (mis. tanda pisah di komentar)
// diubah menjadi escape CSS 6-digit yang tidak butuh spasi penutup.
const css = fs
  .readFileSync(path.join(root, 'public/style.css'), 'utf8')
  .replace(/[^\x00-\x7F]/gu, (ch) => `\\${ch.codePointAt(0).toString(16).padStart(6, '0')}`);

// --- 5. Rakit HTML --------------------------------------------------------

const lessons = Object.values(bundle.levels).reduce((a, l) => a + l.lessons.length, 0);
const words = Object.values(bundle.levels).reduce(
  (a, l) => a + l.lessons.reduce((b, x) => b + (x.vocab || []).length, 0), 0);

const html = `<title>Mandarin Fun</title>
<meta name="description" content="Latihan membaca, mendengar, dan menulis bahasa Mandarin untuk Colin dan Darlene." />
<style>
${css}
</style>

<div id="app">
  <div class="screen center"><p class="muted" style="margin-top:40vh">Memuat&hellip;</p></div>
</div>

<script type="module">
${js}
</script>
`;

// Jaring pengaman: berkas harus ASCII murni agar aman dari salah baca charset.
const stray = [...html].find((ch) => ch.codePointAt(0) > 127);
if (stray) {
  throw new Error(
    `Masih ada karakter non-ASCII di keluaran (U+${stray.codePointAt(0).toString(16).toUpperCase()}). ` +
    'Berkas bisa salah tampil bila server tidak menyebut charset=utf-8.'
  );
}

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'mandarin-fun.html');
fs.writeFileSync(outFile, html);
fs.rmSync(tmp, { recursive: true, force: true });

const kb = (fs.statSync(outFile).size / 1024).toFixed(0);
console.log(
  `✅ ${path.relative(root, outFile)} — ${kb} KB, ${Object.keys(bundle.levels).length} level, ` +
  `${lessons} pelajaran, ${words} kata` +
  (inlinedAvatars ? `, ${inlinedAvatars} lambang anak ikut ditanam` : '')
);
