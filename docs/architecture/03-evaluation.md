# 03 - Evaluation

## Trade-off points

### Static PWA vs backend server
Dipilih **static PWA**: pemasangan mudah, privasi penuh, nol biaya operasional.
Konsekuensi: progres hanya di perangkat itu dan tidak tersinkron. Diredam dengan
fitur ekspor/impor cadangan JSON di menu orang tua.

### Soal dibangkitkan vs soal buku
Dipilih **dibangkitkan** (ADR-0004): latihan tak terbatas dan penilaian
otomatis. Konsekuensi: bentuk soal tidak identik dengan format ujian YCT resmi.

### Text-to-speech vs rekaman asli
Dipilih **TTS** (ADR-0005), karena tidak ada satu pun berkas audio di sumber.
Konsekuensi: suara sintetis. Jalur peningkatan sudah disiapkan lewat
`assets/audio/manifest.json` tanpa perubahan kode.

### Ekstraksi visual vs OCR
Dipilih **visual** (ADR-0003): data terverifikasi, kesalahan diam-diam
dihindari. Konsekuensi: menambah level butuh kerja manual, dan YCT 4–6 serta
HSK 2–3 belum terisi pada rilis ini.

### Nyawa (hearts) untuk anak-anak
Ronde berhenti setelah 5 kesalahan. Menjaga taruhan tetap terasa, tanpa hukuman
tunggu seperti Duolingo — anak bisa langsung mengulang.

## Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Progres hilang bila data browser dihapus | Ekspor/impor cadangan JSON di menu ⚙️ |
| Perangkat tidak punya suara Mandarin | Membaca & menulis tetap jalan; MP3 asli bisa dipasang |
| Arti bahasa Indonesia keliru saat ekstraksi | Setiap level menyimpan `source` dan `bookAnswers` untuk ditelusuri ke halaman buku |
| Anak menghafal posisi jawaban | Pilihan dan pengecoh diacak setiap soal |
| YCT 4–6 & HSK 2–3 belum ada | Ditampilkan sebagai "belum diimpor" di UI, bukan tombol rusak; prosedurnya terdokumentasi |
| Pindaian YCT 2 tidak memuat kunci jawaban | Dicatat eksplisit di `data/content-sources.json` dan di `source.note` berkas kurikulum |
| Kanvas menulis terlalu ketat untuk anak 5 tahun | Penilaian memberi bobot lebih pada *recall* (0,7) daripada *precision* (0,3), dengan dilatasi 2 sel |
| Soal menguji kata yang belum pernah dilihat anak | Sesi belajar wajib sebelum soal terbuka (ADR-0008) |
| Sesi belajar jadi kepanjangan untuk anak 5 tahun | Porsi bekal HSK disetel per anak (`bridgePerLesson`: Colin 4, Darlene 2) |
| `bridge.json` basi setelah kurikulum berubah | `npm test` membangun ulang rencananya dan membandingkannya dengan berkas tersimpan |
| Sinkronisasi menimpa progres perangkat lain | Penggabungan yang tidak pernah mengurangi, diuji komutatif & idempoten (ADR-0010) |
| Server sinkronisasi mati atau internet putus | Sinkronisasi sepenuhnya opsional; `localStorage` tetap sumber kebenaran dan kegagalan hanya dicatat |
| Sentuhan tak sengaja mem-blok teks di layar sentuh | `user-select: none` di seluruh antarmuka; hanya kolom isian yang dikecualikan |

## Verifikasi yang sudah dilakukan

- **93 pengujian unit domain & aplikasi** (`npm test`) — skor, level, streak,
  SRS, misi harian, agregasi periode, pembangkit soal, lencana, pelafalan,
  jembatan HSK (termasuk kesegaran `bridge.json`), sesi belajar, dan
  penggabungan progres.
- **Pengujian peramban menyeluruh** dengan Chrome headless: login → beranda →
  peta → panel keterampilan → ronde membaca → hasil → misi → progres (6 periode)
  → hadiah → kamus → ronde menulis (kanvas) → ronde menyimak → ganti profil.
  Nol galat konsol, nol permintaan gagal.
- **Pemisahan profil** diverifikasi: XP Colin tidak muncul pada Darlene.
- **Mode gelap** diverifikasi lewat emulasi `prefers-color-scheme: dark`.
- **Alur sesi belajar** diverifikasi di Chrome headless (viewport ponsel,
  `hasTouch`): soal terkunci sebelum materi dibaca → 22 kartu materi termasuk
  kartu bekal HSK dan penanda 🏅 → latihan terbuka setelahnya → kunci tidak
  kembali. Nol galat konsol.
- **`user-select`** diperiksa langsung pada elemen teks yang dirender
  (`none`), sekaligus memastikan kolom isian menu orang tua tetap bisa diketik.

## Cacat yang ditemukan dan diperbaiki saat evaluasi

1. **Batang grafik XP gepeng.** `.chart` memakai `align-items: flex-end`,
   sehingga kolomnya tidak meregang dan `height` persen pada batang tidak punya
   acuan. Diperbaiki menjadi `align-items: stretch` dengan kolom `height: 100%`.
2. **Service worker tidak mencakup `src/`.** Awalnya `sw.js` berada di `public/`,
   sehingga cakupannya hanya folder itu dan modul aplikasi tak pernah ter-cache.
   Dipindah ke akar proyek.
3. **Level awal Colin terkunci.** `startLevel: 'yct2'` bertabrakan dengan
   `unlockAtXp: 300`. Ditambahkan `openLevels` per profil sehingga level yang
   ditetapkan untuk seorang anak selalu terbuka.
4. **Dua berkas audio palsu.** `wo-ai-ta.wav` dan `xie-xie.wav` ternyata identik
   dan berisi 1 detik senyap. Dihapus.
5. **Teks ter-blok saat layar tersentuh.** Menekan agak lama pada huruf Han
   memunculkan blok seleksi biru beserta menu "Salin/Cari" yang menutupi soal —
   sering terjadi karena jari anak menempel sepersekian detik terlalu lama.
   Diperbaiki dengan `user-select: none` dan `-webkit-touch-callout: none` pada
   `body`, dengan pengecualian untuk `input`/`textarea`.
6. **Keterangan tombol keterampilan menyambung jadi satu kalimat.**
   `.skill-btn__sub` bukan elemen blok, sehingga judul dan penjelasannya
   berhimpitan. Diberi `display: block`, dan `<br>` manual di beranda dihapus.

## Utang teknis yang diketahui

- Kunci jawaban dan naskah simakan YCT 3 (hal. 68 & 70) ada di buku tetapi
  belum disalin ke JSON.
- Buku latihan (*workbook* / 活动手册) belum dimanfaatkan sama sekali.
- Latihan menulis menilai kemiripan bentuk, **bukan urutan goresan**
  (笔顺). Urutan goresan yang benar butuh data goresan per karakter.
- 16 kata HSK 3 tidak kebagian pelajaran YCT untuk dititipi; HSK 3 (309 kata)
  lebih besar daripada daya tampung YCT 5-6.
- XP di hari yang sama pada dua perangkat yang belum sempat tersinkron diambil
  yang terbesar, bukan dijumlahkan (lihat ADR-0010).
- Sesi belajar belum punya pemeriksaan cepat di akhir (mis. dua kartu balik
  kata). Sengaja ditunda supaya tahap perkenalan tetap bebas tekanan.
