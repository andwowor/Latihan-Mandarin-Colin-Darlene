# ADR-0005: Text-to-Speech untuk Latihan Menyimak
Tanggal   : 2026-08-12
Status    : Accepted
Sebagian digantikan: ADR-0012 (pemilihan suara dan kecepatan)

## Konteks

Permintaan awal menyebut "carikan juga file audio dari setiap latihan listening".
Hasil penelusuran seluruh folder sumber:

```bash
$ find "…/MANDARIN/YCT 1" … "…/MANDARIN/HSK 3" -type f ! -name ".DS_Store"
# hanya berkas .pdf — nol berkas audio
```

Dua berkas `.wav` yang sempat ada di `public/assets/audio/` ternyata **identik
byte-per-byte dan berisi 1 detik senyap** (puncak amplitudo 0) — sisa
pengembangan sebelumnya, bukan rekaman sungguhan. Keduanya sudah dihapus.

Buku memang merujuk trek audio (ikon `01-04` dsb.), tetapi berkasnya dijual
terpisah / diunduh dari situs penerbit dan tidak ada di komputer ini.

Yang **tersedia** adalah naskahnya: halaman `测试页听力文本 Test Listening
Scripts` memuat setiap kalimat yang dibacakan di rekaman aslinya.

## Keputusan

Latihan menyimak memakai **Web Speech API** (`SpeechSynthesisUtterance`) dengan
`lang = "zh-CN"`, membacakan kalimat asli dari halaman *Test Listening Scripts*.

Rincian implementasi (`src/adapters/outbound/webSpeechAdapter.js`):

- Kecepatan diperlambat (`rate 0.75`) untuk anak; ada tombol 🐢 lebih lambat lagi
  (`rate 0.5`). — *diganti ADR-0012: `rate 0.8`, dan 🐢 kini membacakan satu
  suku kata sekali ucap dengan jeda, bukan meregangkan suaranya.*
- Suara dipilih otomatis: `zh-CN` lebih dulu, lalu suara `zh*` mana pun.
  — *diganti ADR-0012: urutan daftar perangkat tidak ada hubungannya dengan
  mutu, jadi suaranya sekarang dinilai lebih dulu.*
- `unlock()` dipanggil saat anak menekan tombol profil, karena iOS/Safari
  melarang audio sebelum ada interaksi pengguna.
- Adapter **lebih dulu mencari berkas audio asli** di
  `public/assets/audio/manifest.json`; text-to-speech hanya dipakai bila
  teksnya tidak terdaftar di sana.

## Alternatif yang ditolak

- **Mengunduh MP3 dari situs penerbit secara otomatis**: bukan milik kami untuk
  didistribusikan, dan tidak diminta.
- **Merekam suara sendiri**: butuh penutur asli; 300+ kalimat.
- **Menghilangkan latihan menyimak**: menyimak adalah satu dari tiga
  keterampilan yang diminta.

## Konsekuensi

- (+) Latihan menyimak jalan sekarang juga, di semua perangkat target.
- (+) Otomatis mencakup kosakata baru yang ditambahkan kemudian.
- (+) Kecepatan bisa diatur — sesuatu yang tidak bisa dilakukan rekaman tetap.
- (−) Suara sintetis, tidak sehidup rekaman penutur asli.
- (−) Kualitas suara berbeda antar perangkat; sebagian Android perlu memasang
  paket suara Mandarin lebih dulu.
- (−) Bila perangkat sama sekali tidak punya suara Mandarin, latihan menyimak
  menjadi bisu. Latihan membaca dan menulis tidak terpengaruh.

## Jalur peningkatan

Menaruh MP3 asli tidak memerlukan perubahan kode — cukup salin berkasnya ke
`public/assets/audio/` dan daftarkan pemetaan teks→berkas di `manifest.json`.
Petunjuknya ada di `public/assets/audio/README.md`.
