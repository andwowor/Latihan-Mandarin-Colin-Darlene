# ADR-0010: Sinkronisasi Progres Antar-Perangkat
Tanggal   : 2026-08-15
Status    : Accepted

## Konteks

ADR-0002 memilih PWA statis tanpa backend, dengan progres di `localStorage`.
Itu masih benar untuk konten pelajaran — tetapi punya akibat yang tidak
disengaja: **progres terkurung di satu peramban di satu perangkat**.

Colin dan Darlene berlatih di HP, tablet, dan laptop bergantian. Dengan
`localStorage`, tiga perangkat berarti tiga anak yang berbeda menurut
aplikasi: rentetan hari terputus, XP terpecah, dan pelajaran yang sudah tuntas
tampak belum dikerjakan.

Cadangan JSON manual (menu orang tua) sudah ada, tetapi menuntut orang tua
mengekspor dan mengimpor setiap kali anak berpindah perangkat. Tidak akan
dilakukan setiap hari.

## Keputusan

Menambahkan sinkronisasi **opsional** ke sebuah Cloudflare Worker + KV yang
dipasang sendiri oleh keluarga (`server/`).

`localStorage` **tetap sumber kebenaran** di setiap perangkat. Server hanya
tempat bertemu. Aplikasi tanpa sinkronisasi berjalan persis seperti sebelumnya
— tidak ada satu pun fitur yang menuntut sambungan.

### Penggabungan, bukan penimpaan

Aturan "yang terbaru menang" akan menghapus latihan yang dikerjakan di
perangkat lain saat perangkat ini sedang offline. Yang dipakai adalah
penggabungan yang tidak pernah mengurangi (`domain/mergeState.js`):

| Data | Aturan |
|---|---|
| XP, bintang, statistik | ambil yang terbesar |
| lencana, misi terklaim | gabungkan (union) |
| kartu SRS | ambil yang paling sering dilatih |
| catatan sesi belajar | tanggal pertama paling awal, hitungan terbesar |
| catatan harian | terbesar per bidang |
| `activeProfile` | **tidak** disinkronkan — milik perangkat |

Fungsinya dijaga tetap **komutatif, idempoten, dan monoton**, sehingga dua
perangkat yang saling menyusul pasti bertemu di hasil yang sama. Ketiganya
diuji langsung di `tests/sync.test.js`.

Kelemahan yang disadari dan diterima: bila dua perangkat berlatih di hari yang
sama tanpa sempat bertemu, XP hari itu **diambil yang terbesar, bukan
dijumlahkan**. Menjumlahkan butuh catatan per-kejadian, bukan per-hari — harga
yang terlalu mahal untuk keuntungan yang kecil.

### Server sengaja bodoh

Worker tidak tahu apa pun tentang XP, kartu, atau pelajaran. Tugasnya hanya
menyimpan satu gumpalan JSON per keluarga dan menolak penyimpanan yang
berdasarkan data usang (`rev` tidak cocok → 409 beserta salinan terbaru).
Seluruh penggabungan terjadi di perangkat.

Akibatnya aturan penggabungan cukup ditulis dan diuji sekali, dan mengubahnya
tidak menuntut penyebaran ulang server.

### Kunci masuk

Kode keluarga + PIN, tanpa akun. PIN disimpan sebagai sidik SHA-256, bukan
angka aslinya. Perangkat pertama yang menyambung mendaftarkan PIN-nya.

Ini bukan keamanan tingkat perbankan, dan memang tidak perlu: yang tersimpan
adalah catatan latihan Mandarin dua anak, tanpa nama, tanpa suara, tanpa data
perangkat. Yang penting kesalahan ketik satu keluarga tidak menimpa data
keluarga lain.

### Kapan disinkronkan

Saat aplikasi dibuka, setelah tiap ronde latihan, setelah tiap sesi belajar,
saat aplikasi disembunyikan, dan saat sambungan pulih. Ditambah tombol manual
di menu orang tua. Semuanya berjalan di latar belakang; kegagalan dicatat lalu
dilupakan.

## Alternatif yang ditolak

- **Firebase / Supabase.** Lebih banyak fitur daripada yang dibutuhkan, dan
  memasukkan SDK pihak ketiga ke aplikasi yang selama ini bebas dependensi
  dan bisa dibuka dari satu berkas HTML.
- **Gist privat GitHub + token.** Tanpa server sama sekali, tetapi menaruh
  token GitHub di peramban setiap perangkat anak — akses yang jauh melebihi
  keperluannya.
- **Menyimpan riwayat per-kejadian agar XP bisa dijumlahkan.** Penggabungan
  jadi benar sempurna, dengan harga penyimpanan yang terus tumbuh dan
  penggabungan yang jauh lebih rumit. Tidak sepadan.
- **Backend sendiri (VPS).** Biaya bulanan dan perawatan, untuk beban puluhan
  permintaan per hari.

## Konsekuensi

- (+) Anak bisa berlatih dari perangkat mana pun; rentetan hari dan XP-nya utuh.
- (+) Tetap berjalan penuh saat offline; yang tertinggal menyusul sendiri.
- (+) Progres kini punya cadangan di luar perangkat.
- (+) Aturan penggabungan murni, sehingga bisa diuji tanpa jaringan.
- (−) Menyalakannya butuh sekali pemasangan Worker (±10 menit, `server/README.md`).
  Sepenuhnya opsional.
- (−) ADR-0002 tidak lagi berlaku mutlak: masih tanpa backend untuk konten,
  tetapi ada backend opsional untuk progres.
- (−) XP hari yang sama di dua perangkat diambil yang terbesar, tidak dijumlah.
- (−) Satu bagian lagi yang harus dijaga tetap hidup (kuota gratis Cloudflare
  jauh di atas kebutuhan, tetapi tetap milik pihak lain).
