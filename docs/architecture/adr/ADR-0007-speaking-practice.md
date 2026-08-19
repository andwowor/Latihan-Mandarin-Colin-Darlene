# ADR-0007: Latihan Berbicara dengan Pengenal Suara Peramban
Tanggal   : 2026-08-13
Status    : Accepted
Dilengkapi: ADR-0011 (penilaian dari bunyi), ADR-0013 (kesempatan kedua)

## Konteks

Tiga keterampilan awal (membaca, mendengar, menulis) melewatkan hal yang
justru paling penting untuk anak kecil: **mengucapkan**. Anak bisa mengenali
你好 di layar tanpa pernah berani mengucapkannya.

Menilai pelafalan itu sulit. Yang tersedia di peramban:

1. **Web Speech API (`SpeechRecognition`)** — mengembalikan teks Han hasil
   pengenalan. Ada di Chrome (Android/desktop) dan Safari (iOS 14.5+),
   belum ada di Firefox. Butuh internet.
2. **MediaRecorder + putar ulang** — anak mendengar suaranya sendiri, tapi
   tidak ada penilaian.
3. **Analisis nada (pitch) sendiri** — bisa mengukur kontur nada, tapi
   membandingkannya dengan lafal baku butuh model akustik; jauh di luar
   lingkup aplikasi statis tanpa backend.

## Keputusan

Memakai **Web Speech API**, lalu membandingkan teks hasil pengenalan dengan
teks target memakai **jarak sunting per karakter** (`src/domain/pronunciation.js`).

Penilaiannya sengaja **longgar**: lulus pada kemiripan ≥ 0,6
(`appConfig.speech.acceptScore`). Alasannya dua:

- Penuturnya anak 5 dan 7 tahun, bukan penutur dewasa.
- Pengenal suara sendiri kerap salah dengar satu karakter, bahkan untuk
  ucapan yang sebenarnya sudah benar.

Menolak ucapan yang sudah mendekati benar akan membuat anak berhenti mencoba —
itu kegagalan yang lebih mahal daripada sesekali meluluskan yang kurang tepat.

Pengenal suara mengembalikan beberapa alternatif (`maxAlternatives: 5`);
yang dipakai adalah **alternatif paling mirip**, bukan yang pertama. Ini
menolong ketika tebakan teratas keliru tetapi tebakan kedua tepat.

Tiga bentuk soal:

| Tipe | Yang terlihat | Yang dilatih |
|---|---|---|
| `sayWord` | 汉字 + pinyin + arti | mengucapkan kata |
| `saySentence` | kalimat + pinyin | membaca nyaring |
| `repeatAfter` | **tidak ada tulisan** | menyimak lalu menirukan |

## Jalur cadangan

Bila `SpeechRecognition` tidak ada (Firefox, atau iOS lama), UI berganti ke
mode **"dengar lalu tirukan"**: anak menekan 🔊, mengucapkan dengan lantang,
lalu menekan sendiri "Sudah bisa mengucapkan" atau "Belum".

Penilaian sendiri memang bisa dicurangi. Untuk aplikasi latihan anak yang
dipakai berdampingan dengan orang tua, itu tidak apa-apa — yang penting anak
tetap berlatih bersuara, bukan layarnya menolak jalan.

## Alternatif yang ditolak

- **Menuntut nada (tone) yang tepat**: pengenal suara mengembalikan teks,
  bukan nada. Menilai nada butuh model akustik dan backend.
- **Layanan pengenalan berbayar**: menyalahi ADR-0002 (tanpa backend) dan
  akan mengirim suara anak ke pihak ketiga.
- **Menyembunyikan latihan bicara bila tidak didukung**: anak dengan perangkat
  "salah" akan kehilangan seluruh keterampilan.

## Konsekuensi

- (+) Keempat keterampilan bahasa kini terlatih.
- (+) Penilaian otomatis, tanpa backend, tanpa biaya.
- (+) Logika penilaian murni sehingga bisa diuji tanpa mikrofon
  (17 pengujian di `tests/pronunciation.test.js`).
- (−) Butuh internet: pengenalan berjalan di server peramban.
- (−) Suara anak dikirim ke Google/Apple saat pengenalan berlangsung. Ini
  perlu diketahui orang tua dan dicatat di PANDUAN.md.
- (−) Pengenal suara Mandarin kadang salah dengar aksen anak-anak; nilai
  ditampilkan sebagai persentase agar orang tua bisa menilai sendiri.
- (−) Homofon (mis. 是/事) dianggap salah walau bunyinya sama. Ambang yang
  longgar meredam sebagian masalah ini.

## Catatan privasi

Mikrofon hanya menyala saat anak menekan tombol 🎤, berhenti otomatis setelah
7 detik, dan dimatikan saat aplikasi berpindah layar atau disembunyikan
(`visibilitychange`). Tidak ada rekaman yang disimpan di perangkat maupun
dikirim ke mana pun oleh aplikasi ini sendiri.
