# 02 - Deployment View

Aplikasi adalah situs statis murni — tanpa backend, tanpa proses build,
tanpa dependensi pihak ketiga saat berjalan.

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
├── src/                     modul ES (domain, application, ports, adapters)
├── tests/                   pengujian domain (node --test)
└── data/content-sources.json  catatan survei berkas sumber
```

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

`localStorage` pada masing-masing perangkat, kunci `mandarin-fun/v2`.
Progres **tidak** tersinkron antar perangkat; gunakan menu ⚙️ → *Simpan
Cadangan* untuk memindahkannya. Bila `localStorage` diblokir (mode privat iOS),
aplikasi tetap berjalan dengan penyimpanan di memori untuk sesi itu.
