# 🐼 Mandarin Fun — Colin & Darlene

Dashboard belajar bahasa Mandarin bergaya permainan untuk Colin (7 th, kelas 2 SD)
dan Darlene (5 th, Kindergarten K2). Dibuat sebagai PWA supaya bisa dipasang di
Android, iPhone, iPad, tablet, dan laptop lewat Chrome maupun Safari.

> **Panduan lengkap untuk orang tua ada di [PANDUAN.md](PANDUAN.md)** —
> cara membuka, memasang di HP, mencadangkan progres, dan menyetel kesulitan.

## Tautan online (privat)

👉 https://claude.ai/code/artifact/8aa9238e-76b1-4c85-ac7c-e34d4c22c75d

Halaman privat berisi seluruh aplikasi dalam satu berkas. Cukup dibuka lewat
browser mana pun. Dibangun dari `dist/mandarin-fun.html`.

## Menjalankan versi lengkap (PWA + offline)

```bash
cd "Latihan-Mandarin-Colin-Darlene"
npm start                 # sama dengan: python3 -m http.server 4173
```

Lalu buka **http://localhost:4173/public/**

> Harus lewat `http://`, bukan `file://` — aplikasi memakai modul ES dan `fetch`.

Untuk membukanya dari HP di rumah, cari alamat IP komputer
(`ipconfig getifaddr en0`) lalu buka `http://<ip>:4173/public/` di HP.

## Membangun versi satu berkas

```bash
npm install esbuild
node tools/build-standalone.mjs ./node_modules/.bin/esbuild
```

Menghasilkan `dist/mandarin-fun.html` (±250 KB): seluruh gaya, kode, dan
kurikulum menyatu dalam satu berkas ASCII murni — aman dibuka dari server mana
pun tanpa bergantung pada header charset.

## Memasang ke layar utama

| Perangkat | Cara |
|---|---|
| Android (Chrome) | menu ⋮ → **Add to Home screen** |
| iPhone / iPad (Safari) | tombol Bagikan → **Add to Home Screen** |
| Laptop (Chrome/Edge) | ikon instal di bilah alamat |
| macOS (Safari) | File → **Add to Dock** |

## Fitur

**Masuk tanpa password** — cukup ketuk 🦁 Colin atau 🦄 Darlene. Progres keduanya
tersimpan terpisah.

**Empat keterampilan**

- 📖 **Membaca** — 汉字→arti, arti→汉字, pinyin→汉字, 汉字→pinyin, arti kalimat
- 🎧 **Mendengar** — dengar lalu pilih tulisan/arti/kalimat, ada tombol 🐢 pelan
- 🎤 **Berbicara** — ucapkan lewat mikrofon, suaranya dinilai otomatis; ada juga
  mode "dengarkan lalu tirukan" tanpa melihat tulisan
- ✍️ **Menulis** — tebalkan huruf di kanvas, susun huruf jadi kata, susun kata
  jadi kalimat

**Permainan** — XP, multiplier combo (sampai ×3), level, 5 nyawa per ronde,
bintang 0–3 per pelajaran, peta pelajaran berkelok, 18 lencana, dan streak harian.

**🎯 Misi harian** — tiga misi yang berganti setiap hari:

1. Selesaikan sejumlah pelajaran
2. Kumpulkan sejumlah XP
3. Selesaikan sejumlah pelajaran **tanpa satu pun kesalahan**

Menuntaskan ketiganya memberi bonus +50 XP. Target Darlene lebih ringan daripada
Colin, dan misinya tidak berubah di tengah hari.

**📊 Papan skor Colin vs Darlene** — harian, mingguan, bulanan, 3 bulan,
6 bulan, dan tahunan; lengkap dengan grafik XP dua warna dan ketepatan per
keterampilan.

**Pengulangan cerdas** — kata yang sering salah muncul lebih sering (sistem
kotak Leitner), dan kemajuannya terlihat di tab 📚 Kamus.

**Menu orang tua (⚙️)** — simpan cadangan JSON, muat cadangan, hapus progres.

**Offline** — sudah dibuka sekali, aplikasi bisa dipakai tanpa internet.

## Materi

Kurikulum diambil dari buku YCT/HSK milik keluarga di
`/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/`.

| Level | Status | Pelajaran | Kata | Kalimat simakan | Kunci jawaban buku |
|---|---|---|---|---|---|
| YCT 1 | ✅ siap | 12 | 106 | 38 | ✅ |
| YCT 2 | ✅ siap | 12 | 91 | 49 | — |
| YCT 3 | ✅ siap | 12 | 79 | 72 | — |
| YCT 4 | ✅ siap | 12 | 78 | 71 | ✅ |
| YCT 5 | ✅ siap | 15 | 169 | — | — |
| YCT 6 | ✅ siap | 15 | 195 | — | — |
| HSK 1 | ✅ siap | 15 | 148 | — | — |
| HSK 2 | ✅ siap | 15 | 163 | — | — |
| HSK 3 | ✅ siap | 20 | 311 | — | — |
| **Total** | | **128** | **1.340** | **230** | |

Seluruh materi yang tersedia di komputer sudah diimpor.

Tanda `—` pada kunci jawaban berarti halaman *Test Answers* buku tidak ikut
terpindai; penilaian aplikasi tetap otomatis karena soalnya dibangkitkan
sendiri (lihat ADR-0004).

Cara menambah/memperbarui materi: **`docs/importing-content.md`**.

### Tiga hal yang perlu diketahui tentang materi sumber

1. **Semua PDF adalah hasil pindaian gambar** (1.586 halaman, nol lapisan teks),
   jadi isinya disalin dengan membaca halamannya satu per satu.
2. **Tidak ada berkas audio sama sekali** di folder sumber. Latihan menyimak
   memakai text-to-speech Mandarin bawaan perangkat, membacakan kalimat asli
   dari halaman *Test Listening Scripts* buku. Cara memasang MP3 asli:
   `public/assets/audio/README.md`.
3. **Kunci jawaban ada di dalam buku** (halaman *Test Answers*) dan sudah
   disalin untuk YCT 1 dan YCT 4. Namun soal di aplikasi dibangkitkan sendiri
   dari kosakata, sehingga penilaiannya otomatis dan latihannya tak terbatas.
4. **Latihan berbicara butuh internet** dan mikrofon: penilaian memakai
   pengenal suara bawaan peramban (lihat ADR-0007). Bila tidak tersedia,
   aplikasi otomatis beralih ke mode "dengarkan lalu tirukan".

## Pengujian

```bash
npm test        # 47 pengujian lapisan domain
```

## Struktur proyek

```
sw.js                     service worker (scope "/" — lihat deployment.md)
public/                   cangkang aplikasi: index.html, app.js, style.css, ikon
public/data/curriculum/   kurikulum JSON per level
src/domain/               logika murni: skor, level, streak, misi, SRS, pelafalan, soal
src/application/          layanan: profil, kurikulum, misi, latihan, statistik
src/ports/                kontrak: konten, penyimpanan, suara, pengenal suara
src/adapters/             UI (inbound) + JSON/localStorage/TTS/mikrofon (outbound)
tests/                    pengujian domain
docs/architecture/        dokumen arsitektur dan ADR
data/content-sources.json hasil survei berkas sumber
```

Arsitekturnya modular monolith dengan ports & adapters; dependensi mengarah ke
dalam (`adapters → ports → application → domain`). Rinciannya di
`docs/architecture/`.

## Menyetel

Hampir semua "aturan main" ada di `src/config/appConfig.js`:
target XP harian tiap anak, level awal dan level yang selalu terbuka, jumlah
soal per ronde, jumlah nyawa, kurva level, jeda pengulangan SRS, dan kecepatan
suara.
