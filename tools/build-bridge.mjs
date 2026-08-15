// Membekukan rencana "jembatan HSK" menjadi public/data/curriculum/bridge.json.
//
// Aplikasi hanya memuat satu berkas kecil ini, bukan seluruh berkas HSK,
// hanya untuk tahu kata titipan sebuah pelajaran YCT. Jalankan ulang setiap
// kali kurikulum berubah:
//
//   npm run bridge
//
// Berkas keluarannya ikut masuk git supaya bisa ditinjau seperti data biasa —
// tes `tests/hskBridge.test.js` menjaga agar tidak pernah basi.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { planBridge, BRIDGE_SOURCES } from '../src/domain/hskBridge.js';
import { appConfig } from '../src/config/appConfig.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public/data/curriculum');

/** Baca seluruh level yang isinya sudah siap, sesuai urutan index.json. */
export function readLevels(curriculumDir = dir) {
  const index = JSON.parse(fs.readFileSync(path.join(curriculumDir, 'index.json'), 'utf8'));
  const levels = [];
  for (const meta of index.levels) {
    const file = path.join(curriculumDir, meta.file);
    if (meta.status !== 'ready' || !fs.existsSync(file)) continue;
    levels.push({ ...meta, ...JSON.parse(fs.readFileSync(file, 'utf8')) });
  }
  return levels;
}

/** Bentuk akhir bridge.json — dipakai juga oleh tes kesegaran. */
export function buildBridge(levels, perLesson = appConfig.bridge.perLesson) {
  const { levels: plan, stats } = planBridge({ levels, sources: BRIDGE_SOURCES, perLesson });
  return {
    schemaVersion: 1,
    perLesson,
    sources: BRIDGE_SOURCES,
    note:
      'Dihasilkan oleh tools/build-bridge.mjs dari src/domain/hskBridge.js. ' +
      'Jangan disunting tangan — jalankan "npm run bridge" setelah kurikulum berubah.',
    levels: plan,
    stats
  };
}

/** JSON yang stabil antar-jalan, supaya diff-nya bersih. */
export function serialise(bridge) {
  return `${JSON.stringify(bridge, null, 2)}\n`;
}

// Dijalankan langsung (bukan diimpor oleh tes)?
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const levels = readLevels();
  const bridge = buildBridge(levels);
  const outFile = path.join(dir, 'bridge.json');
  fs.writeFileSync(outFile, serialise(bridge));

  const perLevel = Object.entries(bridge.levels)
    .filter(([id]) => BRIDGE_SOURCES[id])
    .map(([id, plan]) => {
      const count = Object.values(plan.lessons).reduce((a, list) => a + list.length, 0);
      const tagged = Object.keys(plan.alsoIn).length;
      const left = bridge.stats.leftover[id] || 0;
      return `   ${id.padEnd(5)} +${String(count).padStart(3)} kata bekal · ${String(tagged).padStart(3)} kata bertanda HSK${left ? ` · sisa ${left}` : ''}`;
    });

  console.log(`✅ ${path.relative(root, outFile)} — ${bridge.stats.assigned} kata HSK dititipkan (maks ${bridge.perLesson}/pelajaran)`);
  console.log(perLevel.join('\n'));
}
