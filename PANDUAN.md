# 📘 Panduan Mandarin Fun — untuk Orang Tua

Semua yang perlu Bapak/Ibu lakukan, langkah demi langkah.

---

## 1. Membuka dashboard (paling mudah)

**Tautan privat:**
👉 https://claude.ai/code/artifact/8aa9238e-76b1-4c85-ac7c-e34d4c22c75d

Langkah:

1. Buka tautan di atas lewat Chrome atau Safari (di HP, tablet, atau laptop).
2. Login akun Claude Bapak/Ibu bila diminta — halaman ini **privat**, hanya bisa
   dibuka oleh Bapak/Ibu.
3. Muncul halaman "Siapa yang mau belajar hari ini?" dengan dua tombol.
4. Ketuk 🦁 **Colin** atau 🦄 **Darlene**. Selesai — langsung bisa dipakai.

**Penting:** progres tersimpan di **perangkat dan browser yang dipakai**.
Kalau Colin belajar di iPad lalu lanjut di HP Bapak/Ibu, skornya tidak ikut
pindah. Untuk memindahkannya, lihat bagian 4 (Cadangan).

### Membagikan tautan ke anggota keluarga lain

1. Buka halaman artifact di atas.
2. Klik menu **Share** di pojok halaman.
3. Pilih siapa yang boleh mengakses, lalu salin tautannya.

---

## 2. Memasang seperti aplikasi di HP / tablet / laptop

Versi tautan di atas berjalan di browser. Kalau ingin ikonnya nangkring di
layar utama **dan bisa dipakai tanpa internet**, jalankan versi lengkapnya
dari komputer. Ini caranya.

### 2a. Menjalankan server di komputer (sekali saja tiap mau dipakai)

1. Buka aplikasi **Terminal** di Mac (tekan `Cmd + Spasi`, ketik `Terminal`, Enter).
2. Salin-tempel perintah ini, lalu tekan Enter:

   ```bash
   cd "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene"
   npm start
   ```

3. Akan muncul tulisan `Serving HTTP on :: port 4173`. **Biarkan jendela
   Terminal ini terbuka** selama anak-anak belajar.
4. Di komputer yang sama, buka Chrome dan ketik:
   `http://localhost:4173/public/`

Untuk menghentikan server: kembali ke Terminal, tekan `Ctrl + C`.

### 2b. Membuka dari HP / tablet (satu WiFi dengan komputer)

1. Di Terminal, jalankan perintah ini untuk mengetahui alamat IP komputer:

   ```bash
   ipconfig getifaddr en0
   ```

   Akan muncul angka seperti `192.168.1.7`.

2. Pastikan HP/tablet tersambung ke **WiFi yang sama** dengan komputer.
3. Di HP, buka Chrome/Safari dan ketik (ganti angkanya sesuai hasil langkah 1):

   ```
   http://192.168.1.7:4173/public/
   ```

### 2c. Memasang ke layar utama

**iPhone / iPad (Safari):**
1. Buka alamat di atas lewat **Safari** (bukan Chrome).
2. Ketuk tombol **Bagikan** (kotak dengan panah ke atas) di bawah layar.
3. Gulir ke bawah, pilih **Add to Home Screen** / **Tambah ke Layar Utama**.
4. Ketuk **Add**. Ikon 🐼 muncul di layar utama.

**Android (Chrome):**
1. Buka alamat di atas lewat Chrome.
2. Ketuk menu **⋮** di kanan atas.
3. Pilih **Add to Home screen** / **Tambahkan ke layar utama**.
4. Ketuk **Install**.

**Laptop (Chrome / Edge):**
1. Buka `http://localhost:4173/public/`.
2. Klik ikon **instal** (monitor dengan panah) di ujung kanan bilah alamat.
3. Klik **Install**.

**Mac (Safari):**
1. Buka alamatnya di Safari.
2. Menu **File → Add to Dock**.

> Catatan: sesudah terpasang, aplikasi tetap perlu server di langkah 2a
> menyala saat pertama kali dibuka. Setelah itu bisa dipakai offline.

---

## 3. Cara memakainya sehari-hari

1. Anak memilih namanya sendiri — tidak ada password.
2. Di beranda ada **🎯 Misi Harian** berisi tiga tantangan hari itu:
   - Selesaikan sejumlah pelajaran
   - Kumpulkan sejumlah XP
   - Selesaikan pelajaran **tanpa satu pun kesalahan**

   Menuntaskan ketiganya memberi bonus +50 XP. Misi berganti tiap hari, dan
   target Darlene lebih ringan daripada Colin.
3. Tekan **▶︎ Lanjut Belajar** untuk langsung ke pelajaran berikutnya, atau
   **🗺️ Peta Pelajaran** untuk memilih sendiri.
4. Setiap pelajaran bisa dilatih dalam 5 mode: 📖 Membaca, 🎧 Mendengar,
   🎤 Berbicara, ✍️ Menulis, atau 🎲 Campur.
5. Satu ronde = 10 soal dan 5 nyawa ❤️. Salah 5 kali, ronde berhenti dan
   bisa diulang.

**Melihat perbandingan Colin vs Darlene:** ketuk tab **📊 Progres** di bawah,
lalu pilih periode (Harian, Mingguan, Bulanan, 3 Bulan, 6 Bulan, Tahunan).

### 🎤 Latihan berbicara — yang perlu diketahui

Anak menekan tombol mikrofon, mengucapkan kata/kalimatnya, lalu aplikasi
menilai seberapa mirip ucapannya.

**Langkah pertama kali dipakai:**

1. Ketuk 🎤 **Berbicara** pada sebuah pelajaran.
2. Browser akan bertanya *"Izinkan akses mikrofon?"* → pilih **Izinkan**.
   (Kalau tidak sengaja tertolak: buka ikon gembok 🔒 di bilah alamat →
   *Setelan situs* → **Mikrofon** → **Izinkan**, lalu muat ulang.)
3. Ketuk 🔊 **Dengar contoh** dulu supaya anak tahu bunyinya.
4. Ketuk mikrofon, tunggu tulisan *"Mendengarkan…"*, baru bicara.
5. Hasilnya muncul: apa yang terdengar, berapa persen mirip, dan bintangnya.

**Yang perlu diperhatikan:**

- **Butuh internet.** Pengenalan suara dikerjakan di server Google (Chrome)
  atau Apple (Safari), jadi suara anak dikirim ke sana selama beberapa detik.
  Aplikasi ini sendiri tidak merekam maupun menyimpan apa pun.
- Mikrofon hanya menyala saat tombolnya ditekan, mati sendiri setelah
  7 detik, dan langsung mati saat pindah layar.
- **Penilaiannya sengaja longgar** (lulus di kemiripan 60%). Anak 5 tahun
  tidak akan sempurna, dan pengenal suara pun sering salah dengar satu
  karakter. Lebih baik anak terus berani bersuara.
- Kalau perangkatnya tidak mendukung (mis. Firefox), aplikasi otomatis
  berganti ke mode **"dengarkan lalu tirukan"**: anak menirukan dengan
  lantang, lalu Bapak/Ibu yang menekan "Sudah bisa" atau "Belum".

**Suara latihan menyimak tidak keluar?**
- Pastikan HP tidak dalam mode senyap.
- Android: buka *Setelan → Sistem → Bahasa & masukan → Keluaran teks-ke-ucapan*,
  lalu unduh paket suara **Bahasa Mandarin (中文)**.
- Ketuk tombol 🐢 untuk mendengar versi lebih pelan.

---

## 4. Menyimpan & memindahkan progres (Cadangan)

Lakukan ini sebulan sekali, atau sebelum ganti HP.

**Menyimpan cadangan:**
1. Ketuk ikon **⚙️** di pojok kanan atas.
2. Pilih **💾 Simpan Cadangan (JSON)**.
3. Berkas `mandarin-fun-2026-08-13.json` tersimpan di folder Download.
   Simpan berkas ini di tempat aman (Google Drive / iCloud).

**Memulihkan di perangkat lain:**
1. Buka aplikasi di perangkat baru.
2. Ketuk **⚙️ → 📂 Muat Cadangan**.
3. Pilih berkas JSON tadi. Semua XP, lencana, dan riwayat kembali.

**Menghapus semua progres (mulai dari nol):**
⚙️ → **🗑️ Hapus Semua Progres**. Tindakan ini **tidak bisa dibatalkan**.

---

## 5. Menyetel tingkat kesulitan

Bila terasa terlalu berat atau terlalu ringan, ubah satu berkas:

1. Buka Terminal, jalankan:

   ```bash
   open -e "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene/src/config/appConfig.js"
   ```

2. Cari bagian `profiles:` lalu ubah angkanya:

   | Yang diubah | Artinya |
   |---|---|
   | `dailyGoalXp: 60` | Target XP harian Colin (juga menentukan besar misi harian) |
   | `dailyGoalXp: 40` | Target XP harian Darlene |
   | `acceptScore: 0.6` (bagian `speech:`) | Ketatnya penilaian bicara — naikkan bila terlalu mudah |
   | `startLevel: 'yct1'` | Level yang dibuka pertama kali |
   | `openLevels: ['yct1','yct2']` | Level yang selalu terbuka untuk anak itu |

3. Untuk mengubah jumlah soal atau nyawa, cari bagian `session:`:

   | Yang diubah | Artinya |
   |---|---|
   | `questionsPerRound: 10` | Jumlah soal per ronde |
   | `hearts: 5` | Jumlah nyawa |

4. Simpan (`Cmd + S`), lalu muat ulang halaman di browser.
5. Kalau ingin tautan online ikut berubah, jalankan langkah di bagian 7.

---

## 6. Menambah materi baru

Seluruh buku YCT 1–6 dan HSK 1–3 sudah diimpor — **128 pelajaran, 1.340 kata**.

Kalau nanti Bapak/Ibu menambah buku baru (mis. HSK 4), letakkan PDF-nya di
folder `MANDARIN/`, lalu minta saya mengimpornya. Prosedur teknisnya ada di
`docs/importing-content.md`.

### Kunci jawaban & naskah simakan buku HSK

Buku latihan HSK (练习册 / Workbook) memuat kunci jawaban dan naskah simakan
yang belum saya salin. Kalau ingin ditambahkan, cukup minta.

---

## 7. Memperbarui tautan online setelah materi bertambah

Setelah materi baru masuk, tautan privat perlu dibangun ulang:

1. Buka Terminal, jalankan:

   ```bash
   cd "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene"
   npx esbuild --version >/dev/null 2>&1 || npm install esbuild
   node tools/build-standalone.mjs ./node_modules/.bin/esbuild
   ```

2. Akan muncul: `✅ dist/mandarin-fun.html — ... KB, ... level, ... pelajaran`
3. Minta saya mempublikasikan ulang berkas itu — tautannya **tetap sama**,
   isinya yang diperbarui.

---

## 8. Kalau ada masalah

| Gejala | Yang harus dilakukan |
|---|---|
| Halaman putih / "Aplikasi gagal dimuat" | Pastikan alamatnya diawali `http://`, bukan `file://`. Server di langkah 2a harus menyala. |
| "Materi belum tersedia" saat pelajaran diketuk | Level itu belum diimpor (HSK). Normal. |
| Level bergembok 🔒 | Terbuka otomatis setelah XP cukup. Bisa dibuka paksa lewat `openLevels` di bagian 5. |
| Suara tidak keluar | Lihat bagian 3. |
| Skor anak tercampur | Tidak mungkin tercampur — datanya terpisah. Pastikan menekan nama yang benar di halaman awal. |
| Progres hilang setelah bersihkan data browser | Pulihkan dari cadangan (bagian 4). Karena itu rutinlah mencadangkan. |

---

## Ringkasan isi materi

| Level | Pelajaran | Kata | Kalimat simakan | Kunci jawaban buku |
|---|---|---|---|---|
| YCT 1 | 12 | 106 | 38 | ✅ |
| YCT 2 | 12 | 91 | 49 | — (tidak ikut terpindai) |
| YCT 3 | 12 | 79 | 72 | — (tidak ikut terpindai) |
| YCT 4 | 12 | 78 | 71 | ✅ |
| YCT 5 | 15 | 169 | — | — |
| YCT 6 | 15 | 195 | — | — |
| HSK 1 | 15 | 148 | — | — |
| HSK 2 | 15 | 163 | — | — |
| HSK 3 | 20 | 311 | — | — |
| **Total** | **128** | **1.340** | **230** | |

Seluruh buku YCT dan HSK yang ada di komputer sudah masuk.

Semuanya bisa dilatih dalam empat keterampilan: membaca, mendengar,
berbicara, dan menulis.

---

---

## 9. Mengaktifkan link publik — tinggal SATU langkah

Yang sudah selesai (semuanya sudah saya kerjakan):

- ✅ Repositori `Latihan-Mandarin-Colin-Darlene` sudah ada di GitHub
- ✅ Seluruh kode dan materi sudah diunggah ke sana
- ✅ Repositori sudah diubah menjadi **publik**
- ✅ `robots.txt` + `noindex` sudah dipasang agar tidak muncul di Google

Yang tersisa: **mengaktifkan GitHub Pages**. Langkah ini diblokir untuk saya
(sistem tidak mengizinkan saya menerbitkan situs atas nama akun Bapak/Ibu),
jadi harus Bapak/Ibu sendiri yang menekannya. Pilih salah satu cara:

### Cara A — lewat browser (langkah demi langkah)

**Langkah 0 — Pastikan sudah login GitHub**

Buka dulu https://github.com dan pastikan sudah masuk sebagai **andwowor**
(foto profil di pojok kanan atas). Ini penting: halaman *Settings* hanya bisa
dilihat pemilik repo. **Kalau belum login, halaman setelan akan tampil 404** —
dan 404 itu mudah dikira "repo-nya tidak ada", padahal hanya belum login.

**Langkah 1 — Buka halaman setelan Pages**

Salin alamat ini ke bilah alamat browser:

```
https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene/settings/pages
```

Yang seharusnya terlihat: judul besar **"GitHub Pages"**, dan di bawahnya
sub-judul **"Build and deployment"**.

> Kalau yang muncul malah halaman repo biasa: klik tab **⚙ Settings** di baris
> menu atas repo (paling kanan), lalu pada daftar menu kiri cari kelompok
> **"Code and automation"** → klik **"Pages"**.

**Langkah 2 — Ubah kotak "Source"** ⚠️ *bagian yang paling sering terlewat*

Di bawah "Build and deployment" ada label **Source** dengan sebuah kotak pilihan.

- Kalau isinya **"GitHub Actions"** → **klik kotaknya, lalu pilih
  "Deploy from a branch"**.
- Kalau isinya sudah "Deploy from a branch" → lanjut ke langkah 3.

Selama kotak ini masih "GitHub Actions", **baris Branch tidak akan muncul dan
tidak ada tombol Save** — inilah sebabnya klik sebelumnya terasa sudah
dilakukan padahal tidak tersimpan.

**Langkah 3 — Pilih branch dan folder**

Setelah langkah 2, muncul baris baru berlabel **Branch** berisi dua kotak
pilihan kecil dan satu tombol **Save**.

- Kotak kiri: klik, pilih **`main`**. (Awalnya sering tertulis **"None"**.)
- Kotak kanan: pilih **`/ (root)`**. (Jangan `/docs`.)

**Langkah 4 — Klik Save**

Tombol **Save** ada di kanan kedua kotak tadi. Klik sekali.

**Langkah 5 — Pastikan benar-benar tersimpan**

Halaman akan memuat ulang sendiri, lalu di bagian atas muncul kotak berwarna
berisi salah satu dari:

- *"Your GitHub Pages site is currently being built from the main branch."* atau
- *"Your site is live at https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/"*

**Kalau kotak itu tidak muncul, berarti belum tersimpan** — ulangi dari
langkah 2.

**Langkah 6 — Tunggu proses build**

Pembangunan pertama biasanya **1–3 menit**. Untuk memantaunya, buka tab
**Actions**:

```
https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene/actions
```

Akan ada baris pekerjaan bernama *"pages build and deployment"*:
🟡 lingkaran kuning = sedang berjalan · ✅ centang hijau = selesai ·
❌ silang merah = gagal (beri tahu saya).

**Langkah 7 — Buka situsnya**

Setelah centang hijau, buka:

```
https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/
```

Akan tampil sekejap halaman 🐼 *"Membuka Mandarin Fun…"*, lalu otomatis
berpindah ke aplikasinya. Kalau masih 404, tekan **Cmd + Shift + R**
(muat ulang paksa) — browser kadang menyimpan 404 yang lama.

### Cara B — lewat Terminal (satu perintah)

```bash
gh api -X POST repos/andwowor/Latihan-Mandarin-Colin-Darlene/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

### Setelah itu

Tunggu **1–3 menit** (GitHub perlu membangun situsnya sekali), lalu buka:

**https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/**

Kalau masih muncul halaman 404, tunggu satu menit lagi lalu muat ulang —
pembangunan pertama memang agak lama.

Untuk memantau prosesnya:
https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene/actions

### Kalau nanti materinya diperbarui

```bash
cd "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene"
git push
```

Situsnya ikut ter-update sendiri dalam satu menit. Tidak perlu mengulangi
langkah di atas.

### Yang perlu Bapak/Ibu ketahui

- Repositorinya **publik** karena GitHub Pages pada paket gratis memang
  mensyaratkan itu (sudah saya pastikan: paket akun Bapak/Ibu tidak mendukung
  Pages untuk repo privat). Artinya kutipan kosakata dan kalimat dari buku
  YCT/HSK bisa dilihat siapa pun yang tahu alamatnya.
- `robots.txt` dan `<meta name="robots" content="noindex">` membuatnya **tidak
  muncul di hasil pencarian Google**, jadi praktis hanya orang yang Bapak/Ibu
  beri tautannya yang akan menemukannya.
- Kalau suatu saat ingin ditutup kembali: buka
  https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene/settings
  lalu gulir ke bawah ke **Danger Zone → Change repository visibility → Private**.
  Situsnya otomatis mati.

### Bonus setelah Pages aktif

Karena alamatnya HTTPS, aplikasinya menjadi **PWA penuh**: bisa dipasang ke
layar utama HP/tablet (lihat bagian 2c) **dan jalan offline** — komputer tidak
perlu menyala lagi.
