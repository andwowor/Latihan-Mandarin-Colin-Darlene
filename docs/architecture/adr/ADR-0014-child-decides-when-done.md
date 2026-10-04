# ADR-0014: Anak yang Menentukan Kapan Selesai Bicara
Tanggal   : 2026-10-04
Status    : Accepted
Menggantikan sebagian: ADR-0007 (bagian sesi dengar)

## Konteks

Laporan dari rumah: *"Waktu yang kamu berikan untuk menjawab pertanyaan
speaking terlalu singkat. Saat anak saya menjawab, jawabannya belum selesai
tetapi sudah tidak bisa terekam sisa jawabannya."*

Sesi dengar lama berakhir karena **dua** hal, dan keduanya memutus anak:

```js
const timer = setTimeout(finish, timeoutMs);   // 7 detik, dan habis ya habis
…
if (transcripts.length) finish();              // potongan final pertama = tamat
rec.continuous = false;                        // mesin berhenti di jeda pertama
```

Baris ketiga yang paling merusak. Dengan `continuous = false`, mesin pengenal
menganggap jeda sebagai akhir ucapan. Anak umur 5 dan 7 tahun berhenti di
tengah kalimat terus-menerus — untuk mengingat kata berikutnya, untuk
mengambil napas, untuk melirik tulisannya sekali lagi. Jeda itu bukan tanda
selesai; itu tanda sedang berpikir.

Akibatnya 我有一本书 yang diucapkan "我有… 一本书" tercatat hanya sebagai 我有,
lalu dinilai salah. Anak merasa sudah menjawab benar, tetapi aplikasinya
berkata lain — dan kali ini aplikasinya memang yang keliru.

Tujuh detik pun terlalu pendek untuk kalimat YCT yang panjang, apalagi dengan
jeda berpikir di dalamnya.

## Keputusan

**Sesi dengar berakhir karena anak menekan "Selesai", bukan karena waktunya
habis.**

### Sesinya dijahit kembali

`rec.continuous = true`, dan setiap kali mesin pengenal tetap berhenti sendiri
(Safari mengabaikan `continuous`), ia **dinyalakan lagi**. Potongan-potongan
yang masuk dikumpulkan berurutan, lalu disambung menjadi kalimat utuh.

Tiap potongan datang dengan beberapa tebakan. Yang dirangkai adalah tebakan
ke-n dari setiap potongan — terbaik dengan terbaik, kedua dengan kedua —
supaya penilaian tetap menerima beberapa kemungkinan utuh untuk dibandingkan,
persis seperti sebelumnya (ADR-0011 butuh itu untuk homofon).

Teks yang belum sempat difinalkan ikut terkirim. Anak menekan "Selesai" tepat
setelah suku kata terakhir; yang sudah terdengar tidak boleh ikut hilang
hanya karena mesinnya belum sempat membereskan.

### Tombolnya

Tombol **✅ Selesai — Kirim Jawaban** muncul hanya selagi mikrofonnya menyala;
sebelum itu tidak ada yang bisa dikirim, dan tombol yang tidak bisa ditekan
hanya membingungkan. Mikrofonnya sendiri **tidak** dimatikan selama
mendengarkan: ketukan kedua di situ sama artinya dengan "Selesai", karena itu
gerakan yang paling wajar.

Petunjuknya berubah menjadi *"Mendengarkan… bicara sampai selesai, baru ketuk
Selesai"* — anak perlu diberi tahu bahwa diam sejenak tidak apa-apa.

### Yang tersisa dari penghitung waktu

Satu jaring pengaman, `maxListenMs: 60000`. Gunanya hanya supaya mikrofon
tidak menyala selamanya bila alatnya ditinggal. Bedanya dengan yang lama:
**hasil yang sudah terkumpul tetap diserahkan, tidak dibuang**, dan anak
diberi tahu lewat kalimat yang berbeda.

`no-speech` juga tidak lagi mengakhiri apa pun — anak yang masih diam belum
tentu sudah menyerah.

## Yang sengaja tidak dikerjakan

- **Berhenti otomatis setelah sekian detik hening.** Terdengar pintar, dan
  itu persis cacat yang sedang dibetulkan: jeda berpikir anak akan dibaca
  sebagai "sudah selesai". Jeda milik anak, bukan milik mesin.
- **Tombol "Selesai" yang selalu terlihat.** Sebelum mikrofon menyala tidak
  ada yang bisa dikirim.
- **Merekam audionya sendiri lalu dinilai belakangan.** Butuh penyimpanan dan
  izin yang lebih besar, dan aplikasi ini tidak merekam apa pun (ADR-0002).
- **Menahan hasil bila mesinnya telanjur berhenti.** Menyambung lagi lebih
  sederhana daripada menebak apakah berhentinya disengaja.

## Konsekuensi

- (+) Kalimat panjang dan anak yang berhenti berpikir tidak lagi terpotong —
  keluhan utamanya.
- (+) Anak memegang kendali: selesai artinya dia yang bilang selesai.
- (+) Berjalan sama di Chrome maupun Safari, walau `continuous` diperlakukan
  berbeda di keduanya.
- (+) Aturannya diuji tanpa mikrofon (15 pengujian baru).
- (−) Mikrofon menyala lebih lama, jadi lebih boros baterai. Pengenalannya
  tetap di server peramban (ADR-0007) dan tetap tidak ada yang disimpan.
- (−) Anak bisa lupa menekan "Selesai". Jaring pengaman 60 detik menutupnya,
  dan hasilnya tetap dinilai.
- (−) Menyalakan ulang mesin pengenal berkali-kali bisa memunculkan jeda
  pendek yang tidak terdengar. Suara yang jatuh tepat di jeda itu hilang —
  masih jauh lebih jarang daripada terpotong setiap kali anak berpikir.
