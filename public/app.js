// Titik masuk aplikasi: merakit adapter, service, dan UI.
// Susunan ketergantungan mengikuti ADR-0001 (adapters -> ports -> application -> domain).

import { StaticContentAdapter } from '../src/adapters/outbound/staticContentAdapter.js';
import { BridgedContentAdapter } from '../src/adapters/outbound/bridgedContentAdapter.js';
import { LocalStorageAdapter } from '../src/adapters/outbound/localStorageAdapter.js';
import { WebSpeechAdapter } from '../src/adapters/outbound/webSpeechAdapter.js';
import { WebSpeechRecognitionAdapter } from '../src/adapters/outbound/webSpeechRecognitionAdapter.js';
import { HttpSyncAdapter } from '../src/adapters/outbound/httpSyncAdapter.js';

import { ProfileService } from '../src/application/profileService.js';
import { CurriculumService } from '../src/application/curriculumService.js';
import { MissionService } from '../src/application/missionService.js';
import { PracticeService } from '../src/application/practiceService.js';
import { StudyService } from '../src/application/studyService.js';
import { StatsService } from '../src/application/statsService.js';
import { SyncService } from '../src/application/syncService.js';

import { UiController } from '../src/adapters/inbound/uiController.js';

async function bootstrap() {
  const root = document.getElementById('app');

  // Outbound adapters
  // Konten dibungkus supaya tiap pelajaran YCT membawa "bekal HSK"-nya.
  const content = new BridgedContentAdapter(new StaticContentAdapter());
  const storage = new LocalStorageAdapter();
  const speech = new WebSpeechAdapter();
  await speech.loadManifest();       // pakai MP3 asli bila tersedia
  const recognition = new WebSpeechRecognitionAdapter();

  // Application services
  const profiles = new ProfileService(storage);
  const curriculum = new CurriculumService(content, profiles);
  const missions = new MissionService(profiles);
  const practice = new PracticeService(content, profiles, missions);
  const study = new StudyService(content, profiles);
  const stats = new StatsService(profiles);
  const sync = new SyncService(profiles, new HttpSyncAdapter());

  // Inbound adapter
  const ui = new UiController({ root, profiles, curriculum, practice, study, stats, missions, speech, recognition, sync });
  await ui.start();

  // Hentikan suara & mikrofon saat aplikasi disembunyikan
  // (hemat baterai, dan mikrofon tidak menyala diam-diam di latar).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      speech.cancel();
      recognition.stop();
      // Kesempatan terakhir menyimpan progres sebelum tab ditutup atau
      // aplikasi berpindah ke latar belakang.
      sync.sync();
    }
  });

  // Baru tersambung lagi setelah sempat putus: susulkan yang tertinggal.
  window.addEventListener('online', () => sync.sync());
}

bootstrap().catch((err) => {
  console.error(err);
  document.getElementById('app').innerHTML = `
    <div class="screen center">
      <div class="empty">
        <div class="empty__emoji">😢</div>
        <p style="font-weight:800">Aplikasi gagal dimuat</p>
        <p class="small muted">${err.message}</p>
        <p class="small muted">Pastikan dibuka lewat server (bukan file://).</p>
      </div>
    </div>`;
});

// Service worker: cache aset agar bisa dipakai offline.
// Berkasnya ada di akar proyek supaya cakupannya menjangkau src/ dan data/.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(() => {
      /* offline tidak wajib — aplikasi tetap berjalan online */
    });
  });
}
