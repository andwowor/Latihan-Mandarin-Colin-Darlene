/* Service worker Mandarin Fun.
 *
 * Diletakkan di akar proyek (bukan di public/) supaya cakupannya meliputi
 * public/, src/, dan public/data/ sekaligus — tanpa itu modul aplikasi dan
 * berkas kurikulum tidak bisa di-cache untuk pemakaian offline.
 */

const VERSION = 'mandarin-fun-v5';
const base = (path) => new URL(path, self.location).toString();

const ASSETS = [
  // Cangkang aplikasi
  'public/', 'public/index.html', 'public/style.css', 'public/app.js', 'public/manifest.json',
  'public/icons/icon-192.png', 'public/icons/icon-512.png', 'public/icons/icon-180.png',

  // Konfigurasi & utilitas
  'src/config/appConfig.js',
  'src/shared/utils.js',

  // Domain
  'src/domain/scoring.js',
  'src/domain/streak.js',
  'src/domain/rewards.js',
  'src/domain/srs.js',
  'src/domain/missions.js',
  'src/domain/progress.js',
  'src/domain/exerciseFactory.js',
  'src/domain/pronunciation.js',

  // Ports
  'src/ports/contentPort.js',
  'src/ports/storagePort.js',
  'src/ports/speechPort.js',
  'src/ports/recognitionPort.js',

  // Application
  'src/application/profileService.js',
  'src/application/curriculumService.js',
  'src/application/missionService.js',
  'src/application/practiceService.js',
  'src/application/statsService.js',

  // Adapters
  'src/adapters/outbound/staticContentAdapter.js',
  'src/adapters/outbound/localStorageAdapter.js',
  'src/adapters/outbound/webSpeechAdapter.js',
  'src/adapters/outbound/webSpeechRecognitionAdapter.js',
  'src/adapters/inbound/dom.js',
  'src/adapters/inbound/traceCanvas.js',
  'src/adapters/inbound/uiController.js',
  'src/adapters/inbound/views/shared.js',
  'src/adapters/inbound/views/loginView.js',
  'src/adapters/inbound/views/homeView.js',
  'src/adapters/inbound/views/mapView.js',
  'src/adapters/inbound/views/quizView.js',
  'src/adapters/inbound/views/resultView.js',
  'src/adapters/inbound/views/missionsView.js',
  'src/adapters/inbound/views/progressView.js',
  'src/adapters/inbound/views/rewardsView.js',
  'src/adapters/inbound/views/wordbookView.js',

  // Kurikulum
  'public/data/curriculum/index.json',
  'public/data/curriculum/yct1.json',
  'public/data/curriculum/yct2.json',
  'public/data/curriculum/yct3.json',
  'public/data/curriculum/yct4.json',
  'public/data/curriculum/yct5.json',
  'public/data/curriculum/yct6.json',
  'public/data/curriculum/hsk1.json'
].map(base);

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(VERSION);
      // addAll gagal total bila satu berkas hilang; simpan satu per satu
      // agar ikon yang belum dibuat tidak menggagalkan seluruh instalasi.
      await Promise.all(
        ASSETS.map((url) => cache.add(url).catch(() => null))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Cache-first: konten pelajaran statis dan jarang berubah, sehingga
  // aplikasi tetap bisa dipakai di mobil atau saat internet mati.
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) {
        // Segarkan diam-diam di latar belakang.
        fetch(req)
          .then((res) => res.ok && caches.open(VERSION).then((c) => c.put(req, res.clone())))
          .catch(() => null);
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok) {
          const clone = res.clone();
          caches.open(VERSION).then((c) => c.put(req, clone));
        }
        return res;
      } catch {
        // Permintaan navigasi yang gagal dialihkan ke cangkang aplikasi.
        if (req.mode === 'navigate') {
          const shell = await caches.match(base('public/index.html'));
          if (shell) return shell;
        }
        throw new Error('offline');
      }
    })()
  );
});
