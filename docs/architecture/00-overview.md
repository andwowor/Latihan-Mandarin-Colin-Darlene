# 00 - Overview

Mandarin Fun adalah aplikasi pembelajaran Mandarin bergaya permainan untuk
Colin (7 tahun, kelas 2 SD) dan Darlene (5 tahun, Kindergarten K2).

Aplikasi dirancang sebagai Progressive Web App (PWA) agar dapat dipasang di
Android, iPhone/iPad, tablet, dan laptop melalui Chrome atau Safari.

## Tujuan

- **Sesi belajar** memperkenalkan kata dan kalimatnya lebih dulu; soal baru
  terbuka setelah materinya dibaca.
- Latihan **membaca, mendengar, berbicara, dan menulis** yang terasa seperti permainan.
- **Bekal HSK** dititipkan sedikit demi sedikit ke tiap pelajaran YCT, supaya
  perpindahan ke jalur HSK nanti tidak terasa melompat.
- Progres tersimpan terpisah per anak, tanpa password (cukup pilih tombol nama),
  dan **bisa disinkronkan** antar-perangkat secara opsional.
- **Misi harian** wajib: jumlah pelajaran diselesaikan, XP terkumpul, dan
  pelajaran sempurna tanpa kesalahan.
- Papan skor harian, mingguan, bulanan, 3 bulan, 6 bulan, dan tahunan yang
  membandingkan Colin dengan Darlene — termasuk ketepatan per keterampilan
  yang disandingkan berdampingan.
- **64 lencana** dalam tujuh kelompok bertingkat, agar selalu ada target
  berikutnya yang terasa dekat.
- Konten bersumber dari buku YCT 1–6 dan HSK 1–3 milik keluarga.

## Status konten

| Level | Status | Pelajaran | Kata |
|---|---|---|---|
| YCT 1 | siap | 12 | 106 (+ naskah simakan & kunci jawaban buku) |
| YCT 2 | siap | 12 | 91 |
| YCT 3 | siap | 12 | 79 (+ 72 kalimat simakan asli) |
| YCT 4 | siap | 12 | 78 (+ naskah simakan & kunci jawaban buku) |
| YCT 5 | siap | 15 | 169 |
| YCT 6 | siap | 15 | 195 |
| HSK 1 | siap | 15 | 148 |
| HSK 2 | siap | 15 | 163 |
| HSK 3 | siap | 20 | 311 |

Sudah masuk: **128 pelajaran, 1.340 kata, 230 kalimat simakan** —
seluruh materi yang tersedia di komputer (YCT 1–6 dan HSK 1–3).

Di atas itu, **259 kata HSK dititipkan** ke pelajaran-pelajaran YCT sebagai
bekal, dan **476 kata YCT ditandai** karena ternyata juga ada di daftar HSK
(ADR-0009). Rencananya dibekukan di `public/data/curriculum/bridge.json` dan
dibangun ulang dengan `npm run bridge`.

Cara menambah level lain: `docs/importing-content.md`.

## Temuan penting atas materi sumber

Ketiga temuan ini membentuk beberapa keputusan arsitektur:

1. **Seluruh 16 PDF adalah hasil pindaian gambar**, tanpa lapisan teks
   (1.586 halaman). Ekstraksi otomatis mustahil; isi disalin secara visual
   ke berkas JSON. → ADR-0003
2. **Tidak ada berkas audio sama sekali** di folder sumber. Latihan menyimak
   memakai text-to-speech Mandarin bawaan perangkat, dengan kalimat asli dari
   halaman *Test Listening Scripts*. → ADR-0005
3. **Kunci jawaban ada di dalam buku** (halaman *Test Answers*), tetapi soal di
   aplikasi dibangkitkan sendiri dari kosakata sehingga latihannya tak terbatas.
   Kunci jawaban buku tetap disimpan untuk penelusuran. → ADR-0004
4. Buku **tidak menyediakan cara menilai pelafalan**. Latihan berbicara memakai
   pengenal suara bawaan peramban dengan penilaian yang sengaja longgar. → ADR-0007
5. Buku memperkenalkan kata lewat **halaman materi**, bukan langsung lewat soal.
   Aplikasi versi awal melewatkan tahap itu, sehingga soal pertama sebuah
   pelajaran menguji kata yang belum pernah dilihat anak. → ADR-0008
6. **Pengenal suara mengembalikan huruf hasil tebakan, bukan bunyi.** Dalam
   bahasa yang penuh homofon, tebakan itu sering meleset — sehingga penilaian
   per huruf menghukum anak atas kekeliruan mesin. → ADR-0011
7. **Suara text-to-speech yang "pertama ditemukan" belum tentu yang terbaik.**
   Suara ringkas bawaan perangkat meratakan lengkung nada — padahal nada
   adalah pembeda makna dalam bahasa Mandarin, dan anak tidak bisa menirukan
   nada yang tidak terdengar. → ADR-0012
8. **Percobaan pertama pada soal berbicara sering gagal karena hal teknis** —
   mikrofon telat menyala, suara terlalu pelan — bukan karena lafalnya keliru.
   Setiap soal berbicara diberi satu kesempatan mengulang. → ADR-0013
9. **YCT dan HSK sangat beririsan** — 69 dari 148 kata HSK 1 sudah ada di YCT 1
   saja. Irisan itu dipakai untuk menyiapkan anak jauh sebelum masuk HSK. → ADR-0009

## Peta dokumen

- `01-quality-attributes.md` — skenario atribut kualitas
- `02-views/` — pandangan logis, proses, dan penyebaran
- `03-evaluation.md` — trade-off, risiko, mitigasi
- `adr/` — catatan keputusan arsitektur
