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
npm run build
```

Menghasilkan `dist/mandarin-fun.html` (±700 KB): seluruh gaya, kode, dan
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

**📘 Sesi belajar dulu, baru soal** — setiap pelajaran dibuka dengan kartu
materi satu-per-layar: 汉字 besar, pinyin, arti, contoh kalimat, dan suaranya
langsung diputar. Tidak ada nilai dan tidak ada jawaban salah di sini. Soal
latihan baru terbuka setelah materinya dibaca sampai habis, supaya anak tidak
lagi dihadapkan pada kata yang belum pernah dilihatnya (lihat ADR-0008).

**🌉 Bekal HSK di dalam pelajaran YCT** — tiap pelajaran YCT menitipkan
beberapa kata HSK yang belum pernah muncul, dipilih dari yang paling mudah
lebih dulu. Kata YCT yang ternyata juga ada di daftar HSK diberi tanda
🏅 *"Kata ini juga ada di HSK 1 — bekalmu sudah siap!"*. Hasilnya: seluruh
kosakata HSK 1 sudah dikenalkan sebelum YCT 2 selesai, dan HSK 2 sebelum
YCT 4 selesai (lihat ADR-0009).

**☁️ Progres tersinkron antar-perangkat** — opsional. Sekali memasang
penyimpan progres sendiri (`server/README.md`), Colin dan Darlene bisa
berlatih dari HP, tablet, atau laptop mana pun dan progresnya tetap menyambung.
Tanpa itu pun aplikasi berjalan penuh, hanya progresnya tinggal di satu
perangkat (lihat ADR-0010).

**Empat keterampilan**

- 📖 **Membaca** — 汉字→arti, arti→汉字, pinyin→汉字, 汉字→pinyin, arti kalimat
- 🎧 **Mendengar** — dengar lalu pilih tulisan/arti/kalimat, ada tombol 🐢 yang
  membacakan **satu suku kata sekali ucap** dengan jeda, supaya tiap nada
  terdengar utuh dan mudah ditiru (lihat ADR-0012)
- 🎤 **Berbicara** — ucapkan lewat mikrofon, suaranya dinilai otomatis; ada juga
  mode "dengarkan lalu tirukan" tanpa melihat tulisan. Penilaiannya
  membandingkan **bunyi**, bukan huruf: pengenal suara sering meleset ke
  homofon (妈妈 → 麻麻), dan anak tidak boleh dihukum atas kekeliruan mesin
  (lihat ADR-0011)
- ✍️ **Menulis** — tebalkan huruf di kanvas, susun huruf jadi kata, susun kata
  jadi kalimat

**Permainan** — XP, multiplier combo (sampai ×3), level, 5 nyawa per ronde,
bintang 0–3 per pelajaran, peta pelajaran berkelok, **64 lencana** dalam tujuh
kelompok, dan streak harian. Galeri lencana menampilkan tiga "incaran
berikutnya" yang sengaja diambil dari kelompok berbeda, supaya targetnya
beragam dan selalu ada yang terasa dekat.

**🎯 Misi harian** — tiga misi yang berganti setiap hari:

1. Selesaikan sejumlah pelajaran
2. Kumpulkan sejumlah XP
3. Selesaikan sejumlah pelajaran **tanpa satu pun kesalahan**

Menuntaskan ketiganya memberi bonus +50 XP. Target Darlene lebih ringan daripada
Colin, dan misinya tidak berubah di tengah hari.

**📊 Papan skor Colin vs Darlene** — harian, mingguan, bulanan, 3 bulan,
6 bulan, dan tahunan; lengkap dengan grafik XP dua warna dan **ketepatan per
keterampilan yang menyandingkan kedua anak**. Warna melekat pada anaknya
(Colin biru, Darlene merah muda) dan dipakai sama di seluruh layar — paletnya
diuji lolos keterbacaan bagi buta warna di tema terang maupun gelap.
"Belum dicoba" dibedakan dari "0% benar", karena keduanya sama-sama
menghasilkan batang kosong tetapi artinya jauh berbeda.

**Pengulangan cerdas** — kata yang sering salah muncul lebih sering (sistem
kotak Leitner), dan kemajuannya terlihat di tab 📚 Kamus.

**Menu orang tua (⚙️)** — sambungkan sinkronisasi online, simpan cadangan JSON,
muat cadangan, hapus progres.

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

Di atas angka itu, **259 kata HSK dititipkan** ke pelajaran-pelajaran YCT
sebagai bekal, dan **476 kata YCT ditandai** karena ternyata juga ada di daftar
HSK. Rencananya tersimpan di `public/data/curriculum/bridge.json` dan dibangun
ulang dengan `npm run bridge`.

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
5. **Mutu suara text-to-speech berbeda jauh antar perangkat.** Aplikasi menilai
   sendiri suara Mandarin yang ada dan memakai yang paling jelas nadanya —
   suara "compact" bawaan meratakan lengkung nada sehingga mā/má/mǎ/mà
   terdengar nyaris sama. Orang tua bisa memilih dan mendengarkan sendiri lewat
   ⚙️ → **🔊 Suara Pengucapan** (lihat ADR-0012).
6. **Pengenal suara sering meleset ke homofon.** Karena itu penilaiannya
   membandingkan bunyi, memakai kamus lafal berlapis dua: 771 huruf dari
   kurikulum sendiri, ditambah 20.856 huruf lafal umum agar tebakan mesin yang
   jatuh di luar kurikulum tetap dikenali (lihat ADR-0011).

## Perintah

```bash
npm start       # jalankan di http://localhost:4173/public/
npm test        # 142 pengujian lapisan domain & aplikasi
npm run bridge  # bangun ulang bridge.json setelah kurikulum berubah
npm run readings # bangun ulang kamus lafal readings.json
                 # (butuh: npm install pinyin-pro — sekali saja, seperti esbuild)
npm run build   # bangun dist/mandarin-fun.html (versi satu berkas)
```

`npm test` sengaja gagal bila `bridge.json` atau `readings.json` tertinggal dari
kurikulumnya, jadi tidak mungkin lupa membangunnya ulang tanpa ketahuan.

## Struktur proyek

```
sw.js                     service worker (scope "/" — lihat deployment.md)
public/                   cangkang aplikasi: index.html, app.js, style.css, ikon
public/data/curriculum/   kurikulum JSON per level + bridge.json (bekal HSK)
                          + readings.json (kamus lafal 2 lapis untuk menilai ucapan)
src/domain/               logika murni: skor, level, streak, misi, SRS, pelafalan,
                          soal, kartu belajar, jembatan HSK, penggabungan progres
src/application/          layanan: profil, kurikulum, misi, latihan, belajar,
                          statistik, sinkronisasi
src/ports/                kontrak: konten, penyimpanan, suara, pengenal suara, sinkronisasi
public/icons/             ikon aplikasi + lambang (avatar) anak
src/adapters/             UI (inbound) + JSON/localStorage/TTS/mikrofon/HTTP (outbound)
server/                   OPSIONAL: penyimpan progres (Cloudflare Worker) + panduannya
tools/                    build-bridge.mjs, build-standalone.mjs
tests/                    pengujian domain & aplikasi
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

Beberapa yang paling mungkin ingin disetel:

| Setelan | Arti |
|---|---|
| `study.requireBeforeQuiz` | `false` membuka soal tanpa menunggu sesi belajar selesai |
| `study.xpFirstTime` / `xpRepeat` | hadiah XP menuntaskan dan mengulang sesi belajar |
| `profiles[].bridgePerLesson` | berapa kata bekal HSK yang dilihat anak ini (Colin 4, Darlene 2) |
| `bridge.maxPerRound` | berapa kata bekal yang boleh ikut diuji dalam satu ronde |
| `profiles[].avatar` | berkas gambar lambang anak (mis. `icons/avatar-colin.png`); kosongkan untuk memakai `emoji` |

Mengubah `bridge.perLesson` menuntut `npm run bridge` dijalankan ulang.
