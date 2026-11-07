# ADR-0015: Bab Ulangan Diisi dari Pelajaran Sebelumnya
Tanggal   : 2026-11-07
Status    : Accepted

## Konteks

Laporan dari rumah: *"Kenapa pada YCT 3 bagian terakhir pada peta pelajaran
yakni Ulangan tidak bisa terbuka padahal semua pelajaran pada YCT 3 sudah
selesai?"*

Buku YCT menutup tiap level dengan bab **复习** (Ulangan). Bab itu memang tidak
memperkenalkan kata baru — isinya mengulang seluruh pelajaran sebelumnya.
Impornya (ADR-0003) menyalin apa yang tertulis, jadi hasilnya nyaris kosong:

| Level | Kata di bab ulangan | Kalimat |
|---|---|---|
| YCT 1, YCT 2 | 2 | 2 |
| YCT 3, 4, 5, 6 | **0** | **0** |

Peta pelajaran menentukan sebuah node bisa diketuk dari jumlah kata dan
kalimatnya:

```js
const playable = lesson.vocabCount > 0 || lesson.sentenceCount > 0;
```

Maka bab ulangan YCT 3 ke atas **selalu** terkunci — berapa pun pelajaran yang
sudah dituntaskan anak. Bukan terkunci menunggu syarat; terkunci selamanya.
Di YCT 1 dan 2 node-nya memang terbuka, tetapi isinya dua kata dari satu level
penuh, yang juga bukan ulangan.

## Keputusan

**Bab ulangan diisi dari pelajaran-pelajaran sebelumnya di level yang sama.**

Ini bukan menambal gejala supaya tombolnya menyala: itu memang isi bab 复习
menurut bukunya. Yang sudah tertulis di bab itu tetap dipertahankan dan
ditaruh paling depan; sisanya menyusul, tanpa kembar.

Pengisiannya berupa **pembungkus adapter konten** (`ReviewContentAdapter`),
dengan alasan yang sama seperti `BridgedContentAdapter` (ADR-0009): versi PWA
dan versi satu-berkas harus berperilaku persis sama, dan aturannya tetap
tinggal di domain. Dipasang **di luar** pembungkus bekal HSK, supaya bab
ulangan ikut mewarisi kata bekal yang sudah dititipkan ke pelajaran sebelumnya:

```js
new ReviewContentAdapter(new BridgedContentAdapter(new StaticContentAdapter()))
```

Fungsinya murni dan idempoten — memanggilnya dua kali memberi hasil yang sama,
jadi aman terhadap cache adapter.

### Sesi belajarnya dicuplik, soalnya tidak

Bab ulangan YCT 3 jadi 78 kata dan 22 kalimat. Menumpuknya menjadi seratus
kartu bukan sesi belajar lagi. Yang ditampilkan hanya **10 kata dan 5 kalimat**
(`appConfig.study.reviewWords` / `reviewSentences`), diambil **tersebar merata**
sepanjang level — bukan sepuluh yang pertama, supaya pelajaran terakhir ikut
terwakili. Pengambilannya tanpa acak, jadi isinya sama tiap kali dibuka.

Soal latihannya tetap mengambil dari **seluruh** level, diurutkan SRS, jadi
yang paling lemah yang paling sering muncul. Itu justru guna sebuah ulangan.

Kartu pembuka mengatakannya apa adanya: *"Ini rangkuman 11 pelajaran
sebelumnya — tidak ada kata baru. Kartunya dicuplik dari 78 kata, dan soalnya
nanti bisa mengambil kata mana pun di level ini."*

### Lencana sengaja tidak ikut berubah

`clearedLevelIds` — dasar lencana *"Selesaikan semua pelajaran YCT 3"* —
tetap **tidak** menghitung bab ulangan. Dua alasannya:

1. Bab ulangan tidak membawa materi baru; "semua pelajaran" adalah soal
   pelajarannya.
2. Lencana dihitung ulang dari nol tiap ronde selesai. Kalau bab ulangan ikut
   dihitung, anak yang sudah meraih lencana itu akan **kehilangannya** begitu
   pembaruan ini terpasang, sampai dia mengerjakan bab ulangannya juga.
   Mengambil kembali sesuatu yang sudah diraih anak adalah harga yang tidak
   sepadan.

### Kamusku tidak ikut menggandakan

"Kamusku" melewati bab ulangan: kata-katanya adalah kata pelajaran sebelumnya,
dan mendaftarnya lagi hanya menggandakan seluruh kamus.

## Yang sengaja tidak dikerjakan

- **Menyembunyikan node-nya.** Itu menghilangkan bab yang ada di bukunya, dan
  tetap tidak memberi anak ulangan.
- **Mengetik ulang isi bab 复习 dari PDF-nya.** Bab itu berisi latihan, bukan
  daftar kata baru; menurunkannya dari pelajaran sebelumnya memberi hasil yang
  sama dan ikut tumbuh sendiri bila kurikulum bertambah.
- **Mengunci bab ulangan sampai pelajaran 1–11 tuntas.** Aplikasi ini tidak
  pernah mengurutkan pelajaran secara paksa; anak boleh memilih. Gerbang yang
  sudah ada (materi harus dibaca dulu, ADR-0008) tetap berlaku di sini.
- **Membuat lencana baru untuk bab ulangan.** Mungkin berguna, tetapi bukan
  yang ditanyakan.

## Konsekuensi

- (+) Bab ulangan YCT 3–6 akhirnya bisa dibuka — keluhan utamanya.
- (+) Bab ulangan YCT 1–2 ikut berubah dari dua kata menjadi satu level penuh.
- (+) Ulangannya nyata: soalnya mengambil dari seluruh level, diurutkan SRS.
- (+) Ikut tumbuh sendiri bila kurikulum bertambah, tanpa pekerjaan baru.
- (+) Aturannya fungsi murni, bisa diuji tanpa browser (16 pengujian baru).
- (−) Satu pembungkus adapter lagi di jalur konten.
- (−) Peta pelajaran YCT 1 dan 2 kini menunjukkan bab ulangan dengan puluhan
  kata, bukan dua. Angka yang sebelumnya terlihat kecil itu memang salah.
- (−) Sesi belajar bab ulangan adalah cuplikan, jadi tidak semua kata yang
  nanti diujikan sempat ditampilkan ulang. Disengaja: kata-kata itu sudah
  dipelajari di pelajaran aslinya.
