# ADR-0008: Sesi Belajar Wajib Sebelum Soal
Tanggal   : 2026-08-15
Status    : Accepted

## Konteks

Sampai versi 2.0, satu-satunya pintu masuk sebuah pelajaran adalah soal. Anak
menekan nomor pelajaran, memilih keterampilan, lalu langsung dihadapkan pada
pilihan ganda berisi kata yang **belum pernah dilihatnya sama sekali**.

Pengamatan orang tua di rumah: Colin dan Darlene kesulitan karena kosakatanya
benar-benar baru. Yang terjadi bukan latihan melainkan tebak-tebakan — dan
menebak salah berulang kali membuat anak menyerah.

Ini kekeliruan rancangan, bukan kekeliruan anak. Aplikasi memperlakukan buku
YCT seolah anak sudah membacanya lebih dulu, padahal dashboard inilah satu-
satunya media yang mereka pakai.

Mekanisme yang sudah ada tidak menutup celah ini:

- **SRS** (`domain/srs.js`) mengurutkan kata mana yang diulang, tetapi
  perkenalan pertamanya tetap berupa soal.
- **Umpan balik** setelah menjawab memang memuat arti kata, tetapi datang
  *setelah* anak telanjur salah.
- **Kamusku** memuat seluruh kata, tetapi berupa daftar panjang yang tidak
  ada kaitannya dengan pelajaran yang sedang dikerjakan.

## Keputusan

Menambahkan **sesi belajar** sebagai tahap pertama setiap pelajaran, dan
**mengunci soal** sampai sesi itu tuntas sekali.

Sesi belajar adalah tumpukan kartu satu-per-layar (`domain/studyDeck.js`):

| Urutan | Kartu | Isi |
|---|---|---|
| 1 | pembuka | judul pelajaran + berapa kata, kalimat, dan bekal HSK |
| 2 | kata | 汉字 besar, pinyin, arti, contoh kalimat, tombol 🔊 & 🐢 |
| 3 | kalimat | kalimat kunci beserta pinyin dan artinya |
| 4 | bekal HSK | titipan kata HSK (lihat ADR-0009) |
| 5 | penutup | ringkasan + tombol masuk ke latihan |

Tiga sifat yang membedakannya dari layar soal:

1. **Tidak ada nilai dan tidak ada jawaban salah.** Tidak ada nyawa, tidak ada
   bintang, tidak ada rentetan. Tekanan sengaja dihilangkan sepenuhnya.
2. **Suara diputar otomatis** setiap kartu muncul. Mendengar sambil melihat
   tulisannya adalah inti perkenalannya.
3. **Bisa mundur.** Anak boleh bolak-balik sesuka hati sebelum menutup sesi.

Kuncinya dilepas per pelajaran dan bersifat tetap: begitu materi dibaca
sekali, keempat keterampilan pelajaran itu terbuka selamanya. Catatan
disimpan di `profile.studied['<levelId>:<lessonNumber>']`.

Sesi yang ditinggalkan di tengah **tidak** membuka kunci. Membaca setengah
materi lalu langsung ke soal adalah persis masalah yang ingin diselesaikan.

## Hadiah XP

Menuntaskan sesi belajar bernilai **+20 XP** (sekali), mengulangnya **+5 XP**.
XP-nya dicatat lewat `applyStudy()` yang sengaja **tidak** menyentuh `rounds`,
`answered`, maupun `correct`. Akibatnya:

- Misi "kumpulkan N XP" ikut maju — membaca materi memang usaha yang pantas dihargai.
- Misi "selesaikan N pelajaran" dan angka ketepatan tetap murni dari latihan.

Tanpa pemisahan ini, anak bisa menuntaskan seluruh misi harian hanya dengan
menggeser kartu tanpa pernah menjawab satu soal pun.

## Bisa dimatikan

`appConfig.study.requireBeforeQuiz = false` mengembalikan perilaku lama: sesi
belajar tetap ada dan tetap berhadiah, tetapi soal tidak lagi terkunci.
Disediakan untuk nanti, ketika anak-anak sudah terbiasa dan penguncian justru
memperlambat.

## Alternatif yang ditolak

- **Kartu perkenalan disisipkan di tengah ronde soal** (gaya Duolingo). Alur
  latihan jadi tersendat, dan anak yang mengulang pelajaran terpaksa melihat
  perkenalan yang sama berulang-ulang.
- **Peringatan saja, tanpa kunci.** Anak berumur 5 dan 7 tahun akan menekan
  "lanjut saja" — dan masalahnya kembali utuh.
- **Membuka soal setelah sekian detik membaca.** Menghitung waktu memancing
  anak menunggu, bukan membaca.
- **Sekadar menampilkan daftar kata sebelum kuis.** Satu layar padat 14 kata
  tidak terbaca oleh anak; satu kartu per kata jauh lebih mungkin diperhatikan.

## Konsekuensi

- (+) Soal pertama sebuah pelajaran kini menguji ingatan, bukan keberuntungan.
- (+) Ada tempat resmi untuk memperkenalkan kata — dipakai juga oleh ADR-0009.
- (+) Peta pelajaran menandai materi yang belum dibaca (📘), sehingga orang tua
  bisa melihat sekilas di mana anaknya berhenti.
- (−) Memulai pelajaran baru butuh ±3 menit lebih lama. Ini biaya yang memang
  ingin dibayar.
- (−) Satu keadaan baru yang harus ikut disinkronkan antar-perangkat
  (`studied`), ditangani ADR-0010.
- (−) Pelajaran dengan kosakata banyak (YCT 1 pelajaran 1: 14 kata) menghasilkan
  22 kartu. Porsi bekal HSK per anak (`bridgePerLesson`) dipakai untuk menahan
  agar tidak makin panjang bagi Darlene.
