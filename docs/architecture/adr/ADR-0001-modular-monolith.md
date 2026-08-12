# ADR-0001: Pilih Modular Monolith untuk Aplikasi Pembelajaran
Tanggal   : 2026-08-12
Status    : Accepted

## Konteks
Aplikasi ini ditujukan untuk satu keluarga dengan dua pengguna anak, dan memerlukan pengalaman belajar yang sederhana namun mudah berkembang.

## Keputusan
Kami memilih arsitektur modular monolith dengan prinsip ports & adapters.

## Alternatif yang ditolak
- Microservices: terlalu berat untuk penggunaan keluarga dan Hukum Conway menyarankan modular monolith.
- Single file JavaScript tanpa lapisan arsitektur: cepat tapi sulit dikembangkan dan diuji.

## Konsekuensi
- + Mudah dikembangkan dan dipelihara.
- + Sesuai prinsip Parnas dan ISO 42010.
- + Lapisan domain murni tanpa DOM, sehingga bisa diuji langsung di Node
  (`npm test`, 30 pengujian) tanpa peramban maupun kerangka kerja uji.
- - Tidak langsung siap untuk sinkronisasi cloud.

## Bukti pemisahan lapisan

Menukar penyimpanan atau sumber konten cukup dengan mengganti satu adapter di
`public/app.js` (composition root); tidak ada modul domain atau application yang
menyebut `localStorage`, `fetch`, maupun `document`. Satu-satunya berkas yang
mengetahui ketiganya sekaligus adalah composition root itu sendiri.
