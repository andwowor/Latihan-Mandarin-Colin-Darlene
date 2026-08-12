# 01 - Quality Attribute Scenarios

## QAS-01: Modifiability — menambah materi
- **Source**: Orang tua / pengembang
- **Stimulus**: Materi baru (YCT 4, HSK 2, …) ditambahkan
- **Artifact**: Modul konten dan mesin soal
- **Environment**: Aplikasi berjalan normal
- **Response**: Tambah satu berkas JSON + ubah satu ruas `status`; tidak ada
  perubahan pada kode domain, application, maupun UI
- **Response Measure**: Terpenuhi. Prosedurnya ada di `docs/importing-content.md`
  dan tidak menyentuh satu pun berkas `.js`

## QAS-02: Usability — anak 5 tahun bisa memulai sendiri
- **Source**: Darlene (5 tahun, belum lancar membaca)
- **Stimulus**: Ingin mulai berlatih
- **Artifact**: Halaman profil dan beranda
- **Environment**: Tablet di rumah
- **Response**: Tombol besar bergambar (🦄), tanpa password, tanpa mengetik
- **Response Measure**: Terpenuhi. Dari membuka aplikasi sampai soal pertama =
  **3 ketukan** (profil → *Lanjut Belajar* → soal muncul)

## QAS-03: Portability — terpasang di semua perangkat keluarga
- **Source**: Orang tua
- **Stimulus**: Aplikasi dibuka di Chrome/Safari pada Android/iOS/laptop
- **Artifact**: Seluruh aplikasi
- **Environment**: Jaringan rumah
- **Response**: Berjalan sebagai PWA dan dapat dipasang ke layar utama
- **Response Measure**: Terpenuhi. Manifest + service worker + ikon
  192/512/maskable + `apple-touch-icon`; tanpa proses build, tanpa dependensi

## QAS-04: Reliability — progres tidak hilang
- **Source**: Orang tua
- **Stimulus**: Browser dimuat ulang atau ditutup setelah latihan
- **Artifact**: Penyimpanan progres
- **Environment**: Browser lokal setiap anak
- **Response**: Data tersimpan dan dipulihkan; bila `localStorage` diblokir,
  aplikasi tetap berjalan memakai memori
- **Response Measure**: Terpenuhi. Diverifikasi lewat pengujian peramban:
  XP, rekaman harian, kartu SRS, dan lencana bertahan setelah dimuat ulang

## QAS-05: Correctness — penilaian tidak boleh keliru
- **Source**: Colin & Darlene
- **Stimulus**: Anak menjawab soal
- **Artifact**: `exerciseFactory.grade()`
- **Environment**: Setiap ronde latihan
- **Response**: Jawaban benar selalu ada di antara pilihan; kunci jawaban
  melekat pada soal saat dibangkitkan
- **Response Measure**: Terpenuhi. 30 pengujian domain, termasuk pemeriksaan
  invarian untuk keempat mode latihan (`npm test`)

## QAS-06: Availability — bisa dipakai tanpa internet
- **Source**: Anak-anak (mis. di mobil)
- **Stimulus**: Aplikasi dibuka tanpa koneksi
- **Artifact**: Service worker
- **Environment**: Offline
- **Response**: Cangkang aplikasi, modul, dan kurikulum dilayani dari cache
- **Response Measure**: Terpenuhi. `sw.js` beroperasi di scope `/` sehingga
  `public/`, `src/`, dan `public/data/` semuanya tercakup

## QAS-07: Privacy — data anak tidak keluar dari perangkat
- **Source**: Orang tua
- **Stimulus**: Anak memakai aplikasi
- **Artifact**: Seluruh aplikasi
- **Environment**: Perangkat keluarga
- **Response**: Tidak ada akun, tidak ada permintaan jaringan ke pihak ketiga,
  tidak ada analitik
- **Response Measure**: Terpenuhi. Nol dependensi eksternal; seluruh permintaan
  jaringan menuju origin sendiri
