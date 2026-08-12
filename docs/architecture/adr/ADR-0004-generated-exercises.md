# ADR-0004: Membangkitkan Soal, Bukan Menyalin Soal Buku
Tanggal   : 2026-08-12
Status    : Accepted

## Konteks

Buku YCT menyediakan halaman *Test* beserta kunci jawabannya. Namun:

1. Soal-soal itu **bergantung pada foto** ("dengarkan, pilih gambar A/B/C").
   Gambarnya tidak dapat dipindahkan ke aplikasi.
2. Jumlahnya sangat sedikit — sekitar 6–8 soal per pelajaran. Sekali dikerjakan,
   anak akan hafal urutan jawabannya, bukan materinya.
3. Aplikasi bergaya permainan butuh latihan yang bisa diulang berkali-kali.

## Keputusan

Soal **dibangkitkan** dari data otentik buku (kosakata, kalimat kunci, naskah
simakan) oleh `src/domain/exerciseFactory.js`. Setiap soal membawa kunci
jawabannya sendiri, sehingga penilaian sepenuhnya otomatis dan pasti benar.

Sembilan bentuk soal saat ini:

| Keterampilan | Bentuk |
|---|---|
| Membaca | 汉字→arti, arti→汉字, pinyin→汉字, 汉字→pinyin, arti kalimat |
| Mendengar | suara→汉字, suara→arti, suara→kalimat |
| Menulis | tebalkan huruf di kanvas, susun huruf jadi kata, susun kata jadi kalimat |

Pengecoh (*distractor*) diambil dari kosakata lain di level yang sama, sehingga
pilihan gandanya masuk akal dan tetap menantang.

Kunci jawaban resmi buku tetap disimpan di ruas `bookAnswers` tiap pelajaran —
bukan untuk menilai, melainkan agar isi kurikulum dapat ditelusuri kembali ke
halaman aslinya.

## Alternatif yang ditolak

- **Menyalin soal buku apa adanya**: mustahil tanpa gambarnya, dan terlalu
  sedikit untuk latihan harian.
- **Bank soal statis buatan tangan**: pekerjaan besar dan tetap terbatas.

## Konsekuensi

- (+) Latihan praktis tak terbatas dari kosakata yang sama.
- (+) Penilaian otomatis dan konsisten untuk semua bentuk soal.
- (+) Menambah kosakata otomatis menambah soal, tanpa menulis soal baru.
- (−) Bentuk soal tidak persis sama dengan format ujian YCT resmi. Untuk
  simulasi ujian sungguhan, buku latihan cetak tetap diperlukan.
- (−) Kualitas soal bergantung pada kualitas data kosakata; `id` (arti bahasa
  Indonesia) yang keliru akan langsung terlihat oleh anak.

## Pengujian

`tests/domain.test.js` memverifikasi untuk keempat mode (membaca, mendengar,
menulis, campur) bahwa: jumlah soal sesuai permintaan, jawaban benar selalu ada
di antara pilihan, tidak ada pilihan kembar, dan `grade()` menerima jawaban
benar sekaligus menolak jawaban salah.
