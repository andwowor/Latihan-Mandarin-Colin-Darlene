# ADR-0006: Misi Harian Deterministik
Tanggal   : 2026-08-12
Status    : Accepted

## Konteks

Aplikasi harus punya misi harian yang mencakup tiga hal spesifik:
jumlah pelajaran yang diselesaikan, jumlah XP yang dikumpulkan, dan jumlah
pelajaran yang diselesaikan sempurna tanpa kesalahan.

Kebutuhan lain yang menyertainya:

- Misi tidak boleh berubah saat halaman dimuat ulang di tengah hari — anak akan
  bingung dan merasa curang.
- Tidak ada server, jadi misi tidak bisa dibuat terpusat.
- Target harus berbeda antara Colin (7 th) dan Darlene (5 th).
- Hadiah XP tidak boleh terbayar dua kali.

## Keputusan

Misi harian **dihitung**, bukan disimpan.

`missionsForDay(dayKey, profileId, goalXp)` memakai PRNG terbenih
(*mulberry32*) dengan benih dari hash FNV-1a atas string `"tanggal|idProfil"`.
Fungsi yang sama, masukan yang sama, hasil yang selalu sama — tanpa perlu
menyimpan definisi misi ke localStorage sama sekali.

Ketiga misi selalu ada setiap hari; yang berayun hanyalah targetnya:

| Misi | Target |
|---|---|
| Selesaikan N pelajaran | Colin 2–4, Darlene 1–3 |
| Kumpulkan N XP | 80–130% dari target XP harian, dibulatkan ke kelipatan 10 |
| Selesaikan N pelajaran tanpa salah | Colin 1–2, Darlene 1 |

Kemajuan dibaca dari rekaman harian yang sudah ada
(`dailyLog[hari].rounds`, `.xp`, `.perfectRounds`) — tidak ada penghitung
terpisah yang bisa melenceng dari data sebenarnya.

Yang **disimpan** hanya daftar id misi yang hadiahnya sudah dibayar, di
`dailyLog[hari].missionsClaimed`. Itulah pengaman terhadap pembayaran ganda.

Menuntaskan ketiga misi memberi bonus +50 XP.

## Alternatif yang ditolak

- **Menyimpan definisi misi ke localStorage tiap pagi**: butuh logika
  "ganti hari", rawan rusak bila aplikasi tidak dibuka seharian, dan menambah
  status yang bisa tidak sinkron.
- **Misi acak dari kumpulan besar**: menyimpang dari tiga jenis yang diminta.
- **Target tetap untuk kedua anak**: terlalu berat bagi anak 5 tahun.

## Konsekuensi

- (+) Nol status tersimpan untuk definisi misi; mustahil tidak sinkron.
- (+) Berganti sendiri saat tengah malam, tanpa penjadwal apa pun.
- (+) Dapat diuji sepenuhnya (lihat pengujian determinisme di `tests/`).
- (−) Mengubah rumus target akan mengubah misi hari itu juga bagi anak yang
  sedang mengerjakannya. Dapat diterima: perubahan semacam itu jarang.
- (−) Anak tidak bisa "menabung" misi kemarin yang belum selesai.
