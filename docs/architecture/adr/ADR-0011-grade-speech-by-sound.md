# ADR-0011: Menilai Ucapan dari Bunyinya, Bukan dari Hurufnya
Tanggal   : 2026-08-16
Status    : Accepted
Menggantikan sebagian: ADR-0007 (bagian penilaian)

## Konteks

Laporan dari rumah: *"speaking mereka yang terbaca pada microphone sering
keliru padahal terdengar sudah benar. Terlalu sering terbaca kata lain."*

ADR-0007 sudah menandai ini sebagai kelemahan yang diketahui — *"Homofon
(mis. 是/事) dianggap salah walau bunyinya sama"* — dan mengandalkan ambang
longgar (0,6) untuk meredamnya. Ternyata tidak cukup.

Sebabnya ada pada rantainya:

1. Anak mengucapkan sesuatu.
2. Pengenal suara menerima **bunyi**, lalu menebak **huruf** mana yang dimaksud.
3. Penilaian lama membandingkan huruf tebakan itu dengan huruf target.

Langkah 2 adalah tebakan mesin. Bahasa Mandarin penuh homofon, jadi tebakan
itu sering meleset ke huruf lain yang bunyinya persis sama. Penilaian per huruf
lalu menghukum anak atas kekeliruan mesin, bukan atas lafalnya sendiri.

Contoh nyata pada kosakata YCT 1-2, dinilai dengan aturan lama:

| Diucapkan | Ditulis mesin | Nilai lama | Kenyataan |
|---|---|---|---|
| 妈妈 | 麻麻 | 0,00 ❌ | bunyinya identik |
| 他 | 她 | 0,00 ❌ | bunyinya identik |
| 谢谢 | 写写 | 0,00 ❌ | bunyinya identik |
| 再见 | 在见 | 0,50 ❌ | bunyinya identik |

Empat kali berturut-turut diberi tahu "salah" padahal lafalnya benar sudah
cukup membuat anak berhenti mencoba. Itu kegagalan yang lebih mahal daripada
sesekali meluluskan yang kurang tepat.

## Keputusan

**Bandingkan bunyi, bukan huruf.**

Kata target dan hasil tebakan mesin sama-sama diubah menjadi deret bunyi lebih
dulu, baru dibandingkan dengan jarak sunting.

### Kamus lafal berlapis dua

**Lapis pertama diturunkan dari kurikulum sendiri.** 97% kosakata punya pinyin
yang jumlah suku katanya sama persis dengan jumlah hurufnya, jadi keduanya bisa
dipasangkan satu-satu. Hasilnya **771 huruf Han** — satu-satunya lapis yang
benar-benar terverifikasi terhadap materi yang dipelajari anak. Kata yang tidak
selaras (16 dari 1.449) sengaja dilewati: menebak pasangan yang tidak selaras
justru menanam lafal yang salah.

**Lapis kedua mencakup seluruh huruf Han.** Lapis pertama saja ternyata tidak
cukup: kosakata pengenal suara adalah seluruh bahasa Mandarin, sedangkan kamus
kurikulum hanya 771 huruf. Diuji pada sepuluh homofon yang lazim ditebak mesin,
**separuhnya memakai huruf di luar kurikulum** — 你/尼, 我/窝, 爱/唉, 吗/嘛,
高兴/高性 — sehingga tetap dinilai salah.

Lapis kedua menutup celah itu: **20.856 huruf, 415 bunyi berbeda**, dibangkitkan
dari `pinyin-pro` dan disimpan **terbalik** (bunyi → deretan huruf) karena jauh
lebih padat — **27 KB**, dibanding 263 KB bila disimpan huruf → bunyi. Peta
majunya dirakit kembali saat dimuat (30 ms).

`pinyin-pro` dipakai **hanya saat membangun**, seperti esbuild; aplikasinya
sendiri tetap tanpa dependensi. Bila paketnya tidak terpasang, generator
mempertahankan lapis kedua apa adanya alih-alih menghapusnya.

Keduanya dibekukan lewat `npm run readings` dengan pola yang sama seperti
`bridge.json`. Tes menjaga lapis kurikulum agar tidak pernah basi, dan menjaga
lapis umum agar tidak hilang diam-diam.

### Nada diabaikan

Nada yang kita punya adalah nada kamus dari huruf yang **ditebak mesin**, bukan
nada yang benar-benar diucapkan anak. Membandingkannya tidak memberi tahu apa
pun tentang lafal anak — hanya memberi tahu apakah mesin kebetulan memilih
huruf dengan nada yang sama.

Jadi mengabaikan nada di sini bukan sekadar lebih longgar; itu **lebih jujur**
terhadap apa yang sebenarnya bisa kita amati.

### Bunyi berdekatan dihitung setengah kesalahan

Pasangan zh/z, ch/c, sh/s, -ng/-n, dan r/l adalah kekeliruan paling lazim pada
anak kecil sekaligus pada pengenal suara. Penggantian di antara pasangan itu
berbiaya 0,5, bukan 1 — sehingga 老师 → 老四 bernilai 0,75 dan lulus, tetapi
tetap di bawah nilai sempurna.

### Ambang diturunkan 0,6 → 0,5

Sekarang perannya berbeda. Homofon sudah bernilai penuh lewat kamus, jadi
ambang ini hanya menolong huruf yang **tidak ada** di kamus — di situ penilaian
memang jatuh kembali ke perbandingan huruf.

Ambang bintang ikut disesuaikan (3★ ≥ 0,9 · 2★ ≥ 0,7 · 1★ ≥ 0,5) supaya pujian
tetap terasa berjenjang, bukan selalu sempurna.

### Tebakan alternatif diperbanyak 5 → 8

Yang dipakai tetap alternatif paling mirip. Meminta lebih banyak tebakan
memperbesar peluang salah satunya kebetulan tepat.

## Hasil terukur

Sepuluh kasus nyata, sebelum dan sesudah:

```
lulus: 3/10  →  9/10          (lapis kurikulum saja)
```

Sepuluh homofon yang hurufnya di luar kurikulum:

```
dikenali: 5/10  →  10/10      (setelah lapis umum ditambahkan)
```

Yang tetap gagal hanya satu — 你好 diucapkan, 再见 yang terdengar. Memang
seharusnya gagal.

### Seri dimenangkan tebakan yang persis sama

Sejak homofon bernilai penuh, beberapa tebakan bisa sama-sama bernilai 1,00.
Yang ditampilkan sebagai "terdengar" pada umpan balik kini didahulukan yang
hurufnya persis sama dengan target — supaya anak melihat tulisan yang benar,
bukan homofonnya.

## Yang sengaja tidak dikerjakan

- **Menilai nada.** Butuh analisis akustik, bukan teks. Di luar jangkauan
  aplikasi statis tanpa backend (ADR-0002).
- **Menyimpan kamus lengkap dalam arah huruf → bunyi.** 263 KB, sepuluh kali
  lipat arah terbaliknya, untuk isi yang sama persis.
- **Menjadikan `pinyin-pro` dependensi aplikasi.** Aplikasinya harus tetap bisa
  dibuka sebagai berkas statis tanpa proses apa pun (ADR-0002); paketnya cukup
  dipakai saat membangun.
- **Menurunkan ambang lebih jauh.** Dengan perbandingan bunyi, menurunkan
  ambang di bawah 0,5 mulai meluluskan ucapan yang benar-benar berbeda —
  pujian yang tidak dipercaya anak sama tidak bergunanya dengan hukuman yang
  tidak adil.

## Konsekuensi

- (+) Homofon — penyebab utama keluhan — kini bernilai penuh.
- (+) Anak dinilai atas lafalnya, bukan atas tebakan mesin.
- (+) Kamusnya tumbuh sendiri seiring kurikulum bertambah, tanpa pekerjaan baru.
- (+) Aturannya tetap fungsi murni, bisa diuji tanpa mikrofon (17 pengujian baru).
- (−) Satu berkas bangkitan lagi yang harus dibangun ulang saat kurikulum
  berubah (dijaga `npm test`).
- (+) Huruf di luar kurikulum kini ikut dikenali — celah yang tersisa setelah
  lapis pertama sudah tertutup.
- (−) Berkas kamus bertambah 27 KB, dan versi satu-berkas naik menjadi 707 KB
  (huruf Han di-escape menjadi 6 bita di sana).
- (−) Membangkitkan lapis umum menuntut `npm install pinyin-pro` sekali.
- (−) Karena nada diabaikan, anak yang mengucapkan nada keliru tetap bisa
  lulus. Disengaja pada tahap umur ini — nada dilatih lewat mendengar dan
  menirukan, bukan lewat penolakan.
