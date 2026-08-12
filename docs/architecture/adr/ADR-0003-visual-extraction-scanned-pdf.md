# ADR-0003: Ekstraksi Konten Secara Visual dari PDF Pindaian
Tanggal   : 2026-08-12
Status    : Accepted

## Konteks

Seluruh 16 berkas PDF di folder YCT 1–6 dan HSK 1–3 (total 1.586 halaman)
ternyata **hasil pindaian gambar**, tanpa lapisan teks sama sekali:

```bash
$ pdftotext -f 1 -l 5 "YCT 1/YCT_1_book.pdf" -
www.aibochinese.com, For more     # hanya watermark
```

Pemeriksaan struktur PDF memperkuatnya: 0 `/FontFile`, ratusan gambar
`DCTDecode`. Berkas YCT 1 bahkan menyebut `Creator (Canon )` — hasil pindaian
mesin fotokopi.

Konsekuensinya, tidak ada jalur otomatis dari PDF ke data terstruktur.

## Keputusan

Konten diekstraksi dengan **membaca halaman pindaian secara visual**, lalu
ditulis tangan ke berkas JSON per level di `public/data/curriculum/`.

Untuk efisiensi, hanya halaman bernilai tinggi yang dibaca:
- halaman `目录 Contents` → daftar dan judul pelajaran
- halaman pembuka tiap pelajaran → *Key Sentences* + *Let's learn* (kosakata)
- `测试页听力文本 Test Listening Scripts` → kalimat simakan asli
- `测试页答案 Test Answers` → kunci jawaban resmi

`pdfseparate` + `pdfunite` (poppler) dipakai untuk merakit halaman-halaman
tersebut menjadi satu PDF ringkas sebelum dibaca.

## Alternatif yang ditolak

- **OCR (Tesseract `chi_sim`)**: akurasi pada karakter Han hasil pindaian
  bervariasi, dan kesalahan satu goresan mengubah arti kata. Untuk materi yang
  akan dipakai anak belajar, kesalahan diam-diam lebih berbahaya daripada
  pekerjaan manual.
- **Mengimpor seluruh 1.586 halaman sekaligus**: sebagian besar isi (gambar
  latihan kelas, permainan berpasangan) tidak dapat dipakai di aplikasi.
- **Mengunduh silabus YCT/HSK dari internet**: menyimpang dari permintaan agar
  aplikasi merujuk pada buku milik keluarga.

## Konsekuensi

- (+) Data bersih dan terverifikasi; setiap kata dapat ditelusuri ke halamannya.
- (+) Skema JSON stabil, sehingga penambahan level tidak menyentuh kode.
- (−) Menambah level butuh pekerjaan manual (lihat `docs/importing-content.md`).
- (−) YCT 4–6 dan HSK 2–3 belum diimpor pada rilis ini.

## Catatan cacat pindaian yang ditemukan

- **YCT 1**: halaman cetak 56–60 (词语表 & terjemahan) tidak ikut terpindai.
- **YCT 2**: pindaian berhenti di halaman cetak 60 — *Test Answers* (hal. 70)
  dan *Listening Scripts* (hal. 68) hilang. Halaman 53 (pembuka Pelajaran 11)
  juga terlewat; kosakatanya diambil dari teks bacaan dan mini story.
- **HSK 1**: foldernya kosong sama sekali.

Semua ini dicatat di `data/content-sources.json` dan ditampilkan sebagai
status di dalam aplikasi.
