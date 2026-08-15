# ADR-0009: Menitipkan Kosakata HSK ke Pelajaran YCT
Tanggal   : 2026-08-15
Status    : Accepted

## Konteks

Kurikulumnya dua jalur: **YCT 1-6** (untuk anak) dan **HSK 1-3** (ujian resmi
yang lebih umum dipakai). Sebelumnya keduanya berdiri sendiri — anak belajar
YCT sampai tuntas, lalu suatu hari membuka HSK 1 dan bertemu ratusan kata baru
sekaligus.

Penghitungan tumpang tindih kosakata yang sebenarnya menunjukkan keduanya
sebetulnya sangat berdekatan:

| | YCT 1 | YCT 2 | YCT 3 | YCT 4 | YCT 5 | YCT 6 |
|---|---|---|---|---|---|---|
| HSK 1 (148 kata) | **69** | 36 | 16 | 11 | 3 | 3 |
| HSK 2 (162) | 13 | 22 | **39** | **39** | 24 | 13 |
| HSK 3 (309) | 9 | 10 | 20 | 18 | **78** | **75** |

Artinya dua hal:

1. Sebagian besar kata HSK **sudah dipelajari** anak lewat YCT — mereka hanya
   tidak tahu bahwa itu kata HSK.
2. Sisanya tidak banyak, dan bisa dicicil jauh-jauh hari.

## Keputusan

Setiap pelajaran YCT membawa **"bekal HSK"**: sedikit kata HSK yang belum
pernah muncul di YCT, diperkenalkan di sesi belajar (ADR-0008).

Dua keluaran dari satu perhitungan (`domain/hskBridge.js`):

- **`alsoIn`** — kata YCT yang ternyata juga ada di daftar HSK. Kata seperti
  ini **tidak** dititipkan ulang; cukup ditandai
  🏅 *"Kata ini juga ada di HSK 1 — bekalmu sudah siap!"*
- **`lessons`** — kata HSK yang benar-benar baru, dibagi ke tiap pelajaran.

### Pasangan level

```
YCT 1 → HSK 1          YCT 4 → HSK 2
YCT 2 → HSK 1          YCT 5 → HSK 2, HSK 3
YCT 3 → HSK 1, HSK 2   YCT 6 → HSK 3
```

Kata yang belum sempat dititipkan mengalir sendiri ke level berikutnya, karena
kata yang sudah diperkenalkan tidak akan dipilih dua kali. Hasilnya: seluruh
kosakata **HSK 1 tuntas di penghujung YCT 2**, dan **HSK 2 di penghujung
YCT 4** (dijaga oleh `tests/hskBridge.test.js`).

### Urutan kesulitan

Kata termudah didahulukan, dinilai dari — berurutan:

1. berapa huruf Han di dalamnya yang **belum pernah dilihat anak**
2. level HSK asalnya
3. panjang kata
4. nomor pelajaran di buku HSK (urutan bawaan penyusunnya)

Butir pertama yang paling menentukan, dan sengaja dihitung **sambil berjalan**:
huruf yang baru saja dipelajari di pelajaran itu ikut membuat kata HSK
berikutnya terasa lebih mudah. Karena itu perhitungannya dilakukan untuk
seluruh jalur YCT sekaligus, bukan per level.

### Porsi per anak

Rencananya menyiapkan **4 kata per pelajaran**, tetapi yang ditampilkan
mengikuti `bridgePerLesson` masing-masing anak: **Colin 4, Darlene 2**. Karena
urutannya termudah-dulu, Darlene tetap mendapat yang paling ringan. Angka 4
dipilih justru karena itulah yang pas menghabiskan HSK 1 dan HSK 2.

Kata bekal juga ikut diujikan di ronde latihan, tetapi **selalu di belakang
antrean** kata pelajaran dan dibatasi `bridge.maxPerRound = 2`. Materi YCT
tidak boleh terdesak oleh titipan.

## Dibekukan, bukan dihitung ulang

Rencananya dibekukan ke `public/data/curriculum/bridge.json` oleh
`tools/build-bridge.mjs` (`npm run bridge`). Alasannya: menghitung di aplikasi
berarti memuat seluruh berkas HSK (97 KB) hanya untuk membuka satu pelajaran
YCT.

Risiko berkas beku adalah menjadi basi. Itu ditutup oleh tes yang membangun
ulang rencananya dan membandingkannya dengan berkas yang tersimpan — kurikulum
berubah tanpa `npm run bridge` akan langsung menggagalkan `npm test`.

Aturannya sendiri tetap tinggal di domain sebagai fungsi murni, sehingga bisa
diuji tanpa berkas dan tanpa peramban.

## Alternatif yang ditolak

- **Membiarkan HSK sebagai jalur terpisah.** Ini keadaan sebelumnya, dan
  persis masalah yang dikeluhkan.
- **Menggabungkan HSK ke dalam kosakata YCT begitu saja.** Menggelembungkan
  pelajaran (YCT 1 pelajaran 1 dari 14 jadi ±25 kata) dan mengaburkan mana
  materi ujian YCT yang sebenarnya.
- **Menitipkan berdasarkan kemiripan topik.** Terdengar rapi, tetapi butuh
  penandaan topik yang tidak ada di buku, dan meninggalkan banyak kata HSK
  tanpa pelajaran tujuan.
- **Menghitung di aplikasi saat dibutuhkan.** Lebih segar, tetapi membuat
  pembukaan pelajaran menunggu tiga berkas HSK yang tidak ada hubungannya.

## Konsekuensi

- (+) Saat anak sampai di HSK 1, seluruh kosakatanya sudah pernah dikenalkan.
- (+) Kata yang sudah dikuasai diberi pengakuan (🏅), bukan diulang percuma.
- (+) Kamusku ikut menandai keduanya, jadi orang tua bisa menelusuri.
- (−) Satu berkas hasil bangkitan ikut masuk git (110 KB) dan harus dibangun
  ulang setiap kurikulum berubah.
- (−) Ukuran versi satu-berkas naik dari 336 KB ke 441 KB.
- (−) 16 kata HSK 3 tetap tidak kebagian pelajaran; HSK 3 memang jauh lebih
  besar (309 kata) daripada daya tampung YCT 5-6. Sisanya dipelajari langsung
  di jalur HSK.
