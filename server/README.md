# ☁️ Menyalakan sinkronisasi progres

Supaya Colin dan Darlene bisa berlatih dari HP, tablet, atau laptop mana pun
dan progresnya tetap nyambung, dashboard perlu satu tempat penyimpanan di
internet. Isi folder ini adalah tempat penyimpanan itu: sebuah **Cloudflare
Worker** kecil (±150 baris) yang menyimpan satu berkas JSON per keluarga.

**Gratis.** Cloudflare memberi 100.000 permintaan per hari pada paket gratis;
pemakaian dua anak biasanya di bawah 100 per hari.

**Tanpa server ini pun aplikasi tetap jalan.** Progres tersimpan di masing-masing
perangkat seperti sebelumnya — yang hilang hanya kemampuan berpindah perangkat.

---

## Sekali siapkan (±10 menit)

Semua perintah dijalankan dari folder `server/` di komputer Anda.

### 1. Punya akun Cloudflare

Daftar gratis di <https://dash.cloudflare.com/sign-up>. Tidak perlu kartu kredit,
tidak perlu punya domain.

### 2. Masuk dari komputer

```bash
cd server
npx wrangler login
```

Browser akan terbuka untuk meminta izin. Setujui, lalu kembali ke terminal.

### 3. Buat kotak penyimpanannya

```bash
npx wrangler kv namespace create PROGRESS
```

Keluarannya berisi baris seperti ini:

```
[[kv_namespaces]]
binding = "PROGRESS"
id = "8f3a1c...."
```

Salin nilai `id` tersebut, lalu buka `server/wrangler.toml` dan ganti tulisan
`GANTI_DENGAN_ID_KV_ANDA` dengan id itu.

### 4. Pasang

```bash
npx wrangler deploy
```

Di akhir keluarannya ada alamat seperti:

```
https://mandarin-fun-sync.<nama-anda>.workers.dev
```

**Simpan alamat itu.** Itulah "Alamat server" yang diminta aplikasi.

### 5. Uji cepat

```bash
curl https://mandarin-fun-sync.<nama-anda>.workers.dev/health
# {"ok":true,"service":"mandarin-fun-sync"}
```

---

## Menyambungkan dashboard

Lakukan di **setiap perangkat** yang dipakai (HP Colin, tablet Darlene, laptop):

1. Buka dashboard, ketuk **⚙️** di kanan atas.
2. Pilih **☁️ Sinkronisasi Online**.
3. Isi tiga hal — **sama persis di semua perangkat**:
   - **Alamat server** — alamat `workers.dev` dari langkah 4
   - **Kode keluarga** — bebas, mis. `keluarga-wor`
     (3-32 karakter: huruf kecil, angka, tanda hubung)
   - **PIN** — 4-12 angka
4. Ketuk **Sambungkan**.

Perangkat pertama yang menyambung akan **mendaftarkan PIN**-nya. Perangkat
berikutnya harus memakai kode dan PIN yang sama, kalau tidak akan ditolak.

Setelah tersambung, progres tersinkron otomatis: saat aplikasi dibuka, setiap
selesai satu ronde latihan atau sesi belajar, dan saat aplikasi ditutup. Ada
juga tombol **Sinkronkan sekarang** kalau ingin memaksa.

---

## Yang perlu diketahui

**Kalau internet mati.** Anak tetap bisa berlatih seperti biasa; progresnya
tersimpan di perangkat lalu menyusul terkirim saat online lagi.

**Kalau dua perangkat dipakai bersamaan.** Data digabung, bukan saling
menimpa — pelajaran yang tuntas di perangkat mana pun tetap tercatat. Satu hal
yang perlu diketahui: bila di hari yang sama kedua anak berlatih di dua
perangkat tanpa sempat tersinkron, XP hari itu diambil yang terbesar, bukan
dijumlahkan. Ini disengaja supaya angkanya tidak pernah menggelembung.

**Keamanan.** Kode keluarga + PIN adalah satu-satunya kunci, dan PIN disimpan
di server hanya sebagai sidik SHA-256 — bukan angka aslinya. Jangan sebarkan
alamat server beserta kode dan PIN-nya bersamaan. Ganti PIN kapan saja dengan
memakai kode keluarga baru (data lama tetap tersimpan di kode lama).

**Data apa yang dikirim.** Hanya catatan belajar: XP, riwayat harian, bintang
pelajaran, kartu hafalan, lencana, dan catatan sesi belajar. Tidak ada nama
selain "colin"/"darlene" yang memang sudah ada di aplikasi, tidak ada rekaman
suara, dan tidak ada data perangkat.

## Menghapus data di server

```bash
npx wrangler kv key delete --binding PROGRESS "family:keluarga-wor"
```

Atau hapus seluruh Worker beserta isinya lewat dashboard Cloudflare →
Workers & Pages → `mandarin-fun-sync` → Settings → Delete.
