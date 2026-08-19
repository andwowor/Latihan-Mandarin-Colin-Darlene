# ADR-0013: Satu Kesempatan Kedua untuk Setiap Soal Berbicara
Tanggal   : 2026-08-19
Status    : Accepted
Melengkapi: ADR-0007 (latihan berbicara), ADR-0011 (penilaian dari bunyi)

## Konteks

Permintaan dari rumah: *"Khusus untuk latihan speaking, untuk setiap
pertanyaan, berikan 1 kesempatan lagi untuk mengulang jika salah."*

Berbicara memang tidak sama dengan memilih jawaban. Pada soal pilihan, anak
melihat semua pilihannya dan sekali ketuk sudah menyatakan maksudnya. Pada
soal berbicara, percobaan pertama sering gagal karena hal-hal yang tidak ada
hubungannya dengan lafal:

- mikrofon baru menyala saat anak sudah mulai bicara;
- suaranya terlalu pelan, atau ada suara lain di ruangan;
- anak baru saja mendengar contohnya dan belum sempat mencerna.

ADR-0011 sudah membuat penilaiannya adil terhadap **bunyi**. Yang belum ada
adalah kelonggaran terhadap **percobaannya**. Padahal mengulang sebuah kata
setelah mendengar contohnya bukan sekadar kesempatan tambahan — itu justru
bentuk latihan yang sebenarnya.

## Keputusan

**Setiap soal berbicara mendapat satu kesempatan mengulang. Yang tercatat
adalah percobaan terakhir.**

Selama kesempatan itu masih ada, percobaan yang meleset **tidak mengubah apa
pun**: nyawa utuh, combo utuh, kartu SRS belum disentuh, dan soalnya belum
terhitung terjawab. Ini penting — kalau nyawanya sudah berkurang lebih dulu,
"kesempatan kedua" hanya jadi nama lain untuk hukuman yang ditunda.

Jatahnya satu angka di `appConfig.speech.retries`, jadi bisa diubah tanpa
menyentuh logika.

### Yang tampil di layar

Blok umpan baliknya sengaja **bukan** bergaya "salah": warnanya amber, bukan
merah, dan judulnya *"🔁 Belum pas — coba sekali lagi"*. Tombol **🔊 Dengar
contoh** berdampingan sama besar dengan **🎤 Coba Lagi**, karena mendengar
contohnya memang langkah berikutnya, bukan pilihan sampingan. Contohnya juga
dibunyikan sendiri begitu bloknya muncul.

Layarnya tidak digambar ulang: tulisan, tombol contoh suara, dan mikrofonnya
tetap di tempatnya, supaya anak merasa masih pada soal yang sama.

### Batas-batas yang disengaja

**Combo 🔥 tidak tumbuh oleh percobaan kedua** — tetapi juga tidak putus.
Combo adalah hadiah untuk yang sekali jadi; kalau percobaan kedua ikut
menumbuhkannya, angkanya tidak lagi berarti apa-apa.

**Kartu SRS-nya dinilai jujur.** Kata yang baru pas di percobaan kedua belum
dikuasai, jadi kartunya diperlakukan seperti jawaban yang meleset dan kembali
lebih cepat — walau rondenya sendiri dinilai benar. Anak melihat pujian, dan
kata itu tetap datang lagi besok. Keduanya benar pada tempatnya masing-masing.

**Penilaian sendiri tidak diberi kesempatan ulang.** Pada perangkat tanpa
pengenal suara, orang tua yang memutuskan — dan anak sudah bisa mengulang
ucapannya berkali-kali sebelum tombolnya ditekan. Menawarkan pengulangan di
situ hanya menambah satu ketukan.

**Keterampilan lain tidak ikut.** Pada soal pilihan, jawabannya terlihat
semua; kesempatan kedua di situ berarti menebak, bukan berlatih.

### Layar hasil ikut jujur

Ringkasan ronde menyebut berapa soal yang baru pas di percobaan kedua. Tanpa
itu, orang tua tidak punya cara membedakan ronde yang benar-benar lancar dari
ronde yang lulus di percobaan kedua terus-menerus.

## Dua cacat lama yang ikut terbetulkan

Keduanya ditemukan saat menelusuri jalur umpan balik ini.

**1. Rincian pelafalan tidak pernah sampai ke layar.** `PracticeService.submit()`
tidak mengembalikan `detail`, padahal layar umpan balik membacanya. Akibatnya
setiap jawaban berbicara — termasuk yang benar — menampilkan 0% dan
*"Suaramu belum terdengar"*. Sekarang `detail` ikut dikembalikan.

**2. Nilai 0 punya dua arti yang berbeda.** Mikrofon tidak menangkap apa pun,
atau anak bersuara tetapi yang terdengar lain sama sekali. Dulu keduanya diberi
kalimat yang sama. Selain itu, ketika semua tebakan bernilai 0, `heard`
dikosongkan sehingga anak tidak melihat apa yang sebenarnya terdengar —
sekarang tebakan pertama tetap ditampilkan.

Layar hasil juga tidak punya label untuk keterampilan berbicara, sehingga
tertulis `speaking` apa adanya.

## Yang sengaja tidak dikerjakan

- **Kesempatan tanpa batas.** Anak akan mengulang sampai kebetulan lolos, dan
  nilainya berhenti berarti. Satu kesempatan cukup untuk menutup kegagalan
  teknis tanpa menghapus taruhannya.
- **Menghitung percobaan kedua setengah benar.** Terdengar adil, tetapi
  membuat bintang dan ketepatan sulit dijelaskan pada anak umur 5 dan 7 tahun.
  Kejujurannya dititipkan pada kartu SRS, tempat yang tidak terlihat anak.
- **Memberikan kesempatan kedua pada keterampilan lain.** Di situ jawabannya
  terlihat; mengulang berarti menebak.

## Konsekuensi

- (+) Kegagalan teknis (mikrofon telat, suara pelan) tidak lagi memakan nyawa.
- (+) Anak mendengar contohnya lalu menirukan — latihan yang sebenarnya.
- (+) Umpan balik pelafalan akhirnya benar-benar tampil (cacat lama).
- (+) Aturannya diuji tanpa mikrofon (13 pengujian baru).
- (−) Ronde berbicara jadi sedikit lebih mudah; bintang tidak lagi sepadan
  persis dengan keterampilan lain. Disengaja, dan terlihat di layar hasil.
- (−) Satu keadaan lagi yang harus dijaga di dalam ronde (`retries`).
