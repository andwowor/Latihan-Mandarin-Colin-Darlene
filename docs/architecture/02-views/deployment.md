# 02 - Deployment View

Aplikasi adalah situs statis murni — tanpa proses build dan tanpa dependensi
pihak ketiga saat berjalan. Satu-satunya bagian sisi-server bersifat
**opsional**: Worker penyimpan progres di `server/`, yang boleh tidak dipasang
sama sekali (lihat ADR-0010).

```
akar proyek/                 ← ini yang di-serve sebagai document root
├── sw.js                    service worker (scope "/")
├── public/                  cangkang aplikasi
│   ├── index.html
│   ├── app.js               composition root
│   ├── style.css
│   ├── manifest.json
│   ├── icons/
│   ├── assets/audio/        opsional: MP3 asli penerbit + manifest.json
│   └── data/curriculum/     kurikulum JSON (di dalam public/ agar ter-cache)
│       ├── bridge.json      rencana bekal HSK, hasil `npm run bridge`
│       └── readings.json    kamus lafal, hasil `npm run readings`
├── src/                     modul ES (domain, application, ports, adapters)
├── server/                  OPSIONAL: Worker penyimpan progres + panduannya
├── tests/                   pengujian domain (node --test)
├── tools/                   build-bridge.mjs, build-standalone.mjs
└── data/content-sources.json  catatan survei berkas sumber
```

## Berkas hasil bangkitan

Dua berkas tidak ditulis tangan dan harus dibangun ulang saat kurikulum berubah:

```bash
npm run bridge     # public/data/curriculum/bridge.json    (wajib; dijaga npm test)
npm run readings   # public/data/curriculum/readings.json  (wajib; dijaga npm test)
npm run build      # dist/mandarin-fun.html                (versi satu berkas)
```

`npm test` akan gagal bila salah satunya tertinggal dari kurikulumnya, sehingga
tidak mungkin lupa tanpa ketahuan.

## Kenapa `sw.js` di akar, bukan di `public/`?

Cakupan (*scope*) sebuah service worker dibatasi oleh **direktori tempat
berkasnya berada**. Bila `sw.js` diletakkan di `public/`, permintaan ke
`/src/**` tidak akan pernah dicegat, sehingga modul aplikasi tidak bisa
di-cache dan mode offline gagal. Menaruhnya di akar membuat `public/`, `src/`,
dan `public/data/` semuanya masuk cakupan.

Sebaliknya, berkas kurikulum sengaja diletakkan **di dalam** `public/data/`
agar ikut tercakup bersama cangkang aplikasi.

## Menjalankan

```bash
npm start                    # python3 -m http.server 4173, dijalankan dari akar
# lalu buka http://localhost:4173/public/
```

Halaman **harus** diakses lewat `http://`, bukan `file://`, karena memakai
modul ES dan `fetch`.

## Memasang sebagai aplikasi

- **Android / Chrome**: menu ⋮ → *Add to Home screen*
- **iPhone / iPad / Safari**: tombol Bagikan → *Add to Home Screen*
- **Laptop (Chrome/Edge)**: ikon instal di bilah alamat
- **macOS Safari**: menu File → *Add to Dock*

Agar bisa dipasang dari perangkat lain di rumah, jalankan server di komputer
lalu buka `http://<alamat-ip-komputer>:4173/public/` dari ponsel. Untuk
pemasangan penuh di iOS, situs sebaiknya dilayani lewat HTTPS.

## Penyimpanan

`localStorage` pada masing-masing perangkat, kunci `mandarin-fun/v2` untuk
progres dan `mandarin-fun/v2/settings` untuk setelan perangkat. Keduanya
sengaja terpisah: setelan sambungan (alamat server, kode keluarga, PIN) tidak
boleh ikut terkirim ke server, dan tidak ikut terhapus saat progres di-reset.

Bila `localStorage` diblokir (mode privat iOS), aplikasi tetap berjalan dengan
penyimpanan di memori untuk sesi itu.

### Sinkronisasi antar-perangkat (opsional)

Bila Worker di `server/` dipasang dan perangkat disambungkan lewat menu ⚙️ →
*Sinkronisasi Online*, progres disamakan otomatis: saat aplikasi dibuka, setelah
tiap ronde latihan dan sesi belajar, saat aplikasi disembunyikan, dan saat
sambungan pulih.

`localStorage` tetap sumber kebenaran — server hanya tempat bertemu, dan
penggabungannya terjadi di perangkat (`domain/mergeState.js`). Tanpa Worker,
progres tetap terkurung di satu perangkat dan dipindahkan lewat menu ⚙️ →
*Simpan Cadangan* seperti sebelumnya.

Cara memasang: `server/README.md`.
