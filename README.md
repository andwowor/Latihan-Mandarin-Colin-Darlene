# 🐼 Mandarin Fun — Colin & Darlene

Dashboard belajar bahasa Mandarin bergaya permainan untuk Colin (7 th, kelas 2 SD)
dan Darlene (5 th, Kindergarten K2). Dibuat sebagai PWA supaya bisa dipasang di
Android, iPhone, iPad, tablet, dan laptop lewat Chrome maupun Safari.

## Menjalankan

```bash
cd "Latihan-Mandarin-Colin-Darlene"
npm start                 # sama dengan: python3 -m http.server 4173
```

Lalu buka **http://localhost:4173/public/**

> Harus lewat `http://`, bukan `file://` — aplikasi memakai modul ES dan `fetch`.

Untuk membukanya dari HP di rumah, cari alamat IP komputer
(`ipconfig getifaddr en0`) lalu buka `http://<ip>:4173/public/` di HP.

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

**Tiga keterampilan**

- 📖 **Membaca** — 汉字→arti, arti→汉字, pinyin→汉字, 汉字→pinyin, arti kalimat
- 🎧 **Mendengar** — dengar lalu pilih tulisan/arti/kalimat, ada tombol 🐢 pelan
- ✍️ **Menulis** — tebalkan huruf di kanvas, susun huruf jadi kata, susun kata
  jadi kalimat

**Permainan** — XP, multiplier combo (sampai ×3), level, 5 nyawa per ronde,
bintang 0–3 per pelajaran, peta pelajaran berkelok, 16 lencana, dan streak harian.

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

| Level | Status | Isi |
|---|---|---|
| YCT 1 | ✅ siap | 12 pelajaran · ±80 kata · naskah simakan · kunci jawaban buku |
| YCT 2 | ✅ siap | 12 pelajaran · ±90 kata |
| YCT 3 | ✅ siap | 12 pelajaran · ±80 kata |
| YCT 4–6 | ⏳ belum diimpor | — |
| HSK 1 | 📭 folder sumber kosong | — |
| HSK 2–3 | ⏳ belum diimpor | — |

Menambah level: **`docs/importing-content.md`**.

### Tiga hal yang perlu diketahui tentang materi sumber

1. **Semua PDF adalah hasil pindaian gambar** (1.586 halaman, nol lapisan teks),
   jadi isinya disalin dengan membaca halamannya satu per satu.
2. **Tidak ada berkas audio sama sekali** di folder sumber. Latihan menyimak
   memakai text-to-speech Mandarin bawaan perangkat, membacakan kalimat asli
   dari halaman *Test Listening Scripts* buku. Cara memasang MP3 asli:
   `public/assets/audio/README.md`.
3. **Kunci jawaban ada di dalam buku** (halaman *Test Answers*) dan sudah
   disalin untuk YCT 1. Namun soal di aplikasi dibangkitkan sendiri dari
   kosakata, sehingga penilaiannya otomatis dan latihannya tak terbatas.

## Pengujian

```bash
npm test        # 30 pengujian lapisan domain
```

## Struktur proyek

```
sw.js                     service worker (scope "/" — lihat deployment.md)
public/                   cangkang aplikasi: index.html, app.js, style.css, ikon
public/data/curriculum/   kurikulum JSON per level
src/domain/               logika murni: skor, level, streak, misi, SRS, soal
src/application/          layanan: profil, kurikulum, misi, latihan, statistik
src/ports/                kontrak: konten, penyimpanan, suara
src/adapters/             UI (inbound) + JSON/localStorage/TTS (outbound)
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
