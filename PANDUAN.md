# 📘 Panduan Mandarin Fun — untuk Orang Tua

Semua yang perlu Bapak/Ibu lakukan, langkah demi langkah.

---

## 1. Membuka dashboard (paling mudah)

**Tautan utama:**
👉 https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/public/

Langkah:

1. Buka tautan di atas lewat Chrome atau Safari (di HP, tablet, atau laptop).
2. Muncul halaman "Siapa yang mau belajar hari ini?" dengan dua tombol.
3. Ketuk 🦁 **Colin** atau 🦄 **Darlene**. Selesai — langsung bisa dipakai.

**Penting:** secara bawaan, progres tersimpan di **perangkat dan browser yang
dipakai**. Kalau Colin belajar di iPad lalu lanjut di HP Bapak/Ibu, skornya
tidak ikut pindah.

Supaya ikut pindah sendiri, nyalakan **sinkronisasi online** — sekali siapkan,
lihat bagian 4. Kalau tidak ingin repot, cara lamanya (cadangan JSON manual)
tetap tersedia di bagian 4b.

### Membagikan tautan ke anggota keluarga lain

Cukup kirimkan tautan di atas. Halamannya tidak muncul di hasil pencarian
Google (`robots.txt` + `noindex`), jadi praktis hanya orang yang Bapak/Ibu
beri tautannya yang akan menemukannya.

---

## 2. Memasang seperti aplikasi di HP / tablet / laptop

Tautan di bagian 1 sudah cukup: karena alamatnya HTTPS, aplikasinya bisa
**langsung dipasang ke layar utama dan dipakai tanpa internet**. Lompat saja
ke bagian **2c**.

Bagian 2a dan 2b hanya diperlukan bila Bapak/Ibu ingin mencoba perubahan dari
komputer sendiri sebelum diunggah.

### 2a. Menjalankan server di komputer (hanya untuk uji coba)

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
1. Buka tautan bagian 1.
2. Klik ikon **instal** (monitor dengan panah) di ujung kanan bilah alamat.
3. Klik **Install**.

**Mac (Safari):**
1. Buka alamatnya di Safari.
2. Menu **File → Add to Dock**.

> Setelah terpasang lewat tautan bagian 1, aplikasi bisa dipakai **offline**
> — komputer tidak perlu menyala. Jangan lupa memasangnya di setiap perangkat
> yang dipakai anak-anak.

---

## 3. Cara memakainya sehari-hari

1. Anak memilih namanya sendiri — tidak ada password.
2. Di beranda ada **🎯 Misi Harian** berisi tiga tantangan hari itu:
   - Selesaikan sejumlah pelajaran
   - Kumpulkan sejumlah XP
   - Selesaikan pelajaran **tanpa satu pun kesalahan**

   Menuntaskan ketiganya memberi bonus +50 XP. Misi berganti tiap hari, dan
   target Darlene lebih ringan daripada Colin.
3. Tekan **📘 Mulai Sesi Belajar** untuk langsung ke pelajaran berikutnya, atau
   **🗺️ Peta Pelajaran** untuk memilih sendiri.
4. Setiap pelajaran **dimulai dari sesi belajar** — lihat bagian 3a di bawah.
5. Setelah materinya dibaca, pelajaran itu bisa dilatih dalam 5 mode:
   📖 Membaca, 🎧 Mendengar, 🎤 Berbicara, ✍️ Menulis, atau 🎲 Campur.
6. Satu ronde = 10 soal dan 5 nyawa ❤️. Salah 5 kali, ronde berhenti dan
   bisa diulang.

**Melihat perbandingan Colin vs Darlene:** ketuk tab **📊 Progres** di bawah,
lalu pilih periode (Harian, Mingguan, Bulanan, 3 Bulan, 6 Bulan, Tahunan).

Di dalamnya ada **🎓 Ketepatan per Keterampilan** yang menyandingkan kedua anak
langsung berdampingan — satu kelompok untuk tiap keterampilan, dua batang di
dalamnya. Warna melekat pada anaknya (Colin biru, Darlene merah muda) dan
dipakai sama persis di grafik XP maupun di sini, jadi satu warna selalu berarti
satu orang.

Dua hal yang sengaja dibedakan di situ:

- Angka di sebelah batang, mis. **82% · 41/50**, memuat ketepatan **dan** berapa
  soal yang sudah dikerjakan. Ketepatan 100% dari 3 soal jelas belum sekuat 82%
  dari 50 soal.
- **"belum dicoba"** (jalur kosong bergaris putus) berbeda dari **0%** (batang
  yang benar-benar ada tapi pendek). Yang pertama berarti keterampilan itu belum
  disentuh sama sekali pada periode tersebut.

### 🏅 Lencana

Ada **64 lencana** dalam tujuh kelompok: Langkah Awal, Sesi Belajar, Ketekunan,
Kosakata, Keterampilan, Kesempurnaan, dan Perjalanan. Hampir semuanya
bertingkat — 25 kata, 80 kata, 150 kata, dan seterusnya — supaya selalu ada
target berikutnya yang terasa bisa dijangkau.

Di bagian atas tab **🏅 Hadiah** ada **🎯 Incaran Berikutnya**: tiga lencana
terdekat yang belum diraih, sengaja diambil dari tiga kelompok berbeda supaya
anak punya beberapa jalan sekaligus, bukan tiga tingkat berturut dari capaian
yang sama.

### 3a. 📘 Sesi belajar — kenalan dulu, baru soal

Dulu anak langsung dihadapkan pada soal berisi kata yang belum pernah mereka
lihat. Itu bukan latihan, melainkan tebak-tebakan — dan menebak salah
berulang-ulang membuat anak menyerah. Sekarang setiap pelajaran dibuka dengan
**sesi belajar** lebih dulu.

Bentuknya kartu satu-per-layar, seperti membuka buku halaman demi halaman:

| Urutan kartu | Isinya |
|---|---|
| Pembuka | judul pelajaran + berapa kata, kalimat, dan bekal HSK di dalamnya |
| Kata | 汉字 besar, cara bacanya, artinya, dan contoh kalimatnya |
| Kalimat | kalimat kunci pelajaran itu beserta artinya |
| 🌉 Bekal HSK | kata HSK titipan — lihat bagian 3b |
| Penutup | ringkasan + tombol **▶︎ Mulai Latihan** |

Yang perlu diketahui:

- **Tidak ada nilai dan tidak ada jawaban salah** di sesi belajar. Tidak ada
  nyawa, tidak ada bintang. Anak hanya perlu melihat dan mendengar.
- **Suaranya diputar otomatis** tiap kartu muncul. Ada juga 🔊 dan 🐢 (pelan)
  bila ingin diulang.
- Anak boleh **bolak-balik** dengan tombol ← dan **Lanjut →** sesukanya.
- Menuntaskannya memberi **+20 XP** (sekali) — mengulang bacanya +5 XP.
- **Soal terkunci 🔒 sampai sesi belajarnya selesai.** Setelah dibaca sekali,
  keempat latihan pelajaran itu terbuka selamanya.
- Di peta pelajaran, nomor yang masih bertanda 📘 berarti materinya belum
  pernah dibaca — praktis untuk melihat sekilas sampai mana anak berjalan.

> Sesi yang ditutup di tengah jalan tidak membuka kunci. Ini disengaja:
> membaca setengah materi lalu lompat ke soal adalah persis masalah yang
> ingin diselesaikan.

Kalau suatu saat anak-anak sudah terbiasa dan penguncian terasa memperlambat,
penguncian bisa dimatikan — lihat bagian 5.

### 3b. 🌉 Bekal HSK di dalam pelajaran YCT

Anak-anak berlatih di jalur **YCT**, tetapi ujian yang lebih umum dipakai
adalah **HSK**. Supaya perpindahannya nanti tidak terasa melompat, tiap
pelajaran YCT sekarang menitipkan beberapa kata HSK.

Ternyata kedua buku sangat beririsan: **69 dari 148 kata HSK 1 sudah ada di
YCT 1 saja**. Jadi ada dua hal yang dikerjakan:

1. **Kata yang sudah dipelajari cukup ditandai.** Saat kartu 你 muncul, di
   bawahnya tertulis 🏅 *"Kata ini juga ada di HSK 1 — bekalmu sudah siap!"*
   Anak tidak perlu mempelajarinya dua kali, tetapi tahu bekalnya terpakai.
2. **Kata yang benar-benar baru dititipkan sedikit demi sedikit**, di kartu
   bertanda 🌉 pada akhir sesi belajar. Dipilih dari yang **paling mudah lebih
   dulu** — kata pendek yang hurufnya sudah dikenal anak didahulukan.

Hasilnya: **seluruh kosakata HSK 1 sudah dikenalkan sebelum YCT 2 selesai**,
dan HSK 2 sebelum YCT 4 selesai. Saat anak akhirnya membuka level HSK, tidak
ada kata yang benar-benar asing.

Porsinya sengaja berbeda per anak — **Colin 4 kata per pelajaran, Darlene 2** —
supaya sesi Darlene tidak kepanjangan. Bisa disetel di bagian 5.

Kata bekal juga sesekali ikut keluar di soal latihan (paling banyak 2 per
ronde) dan selalu **setelah** kata pelajaran YCT-nya, jadi materi utamanya
tidak pernah terdesak. Semuanya juga terdaftar di tab **📚 Kamus** dengan
tanda 🌉 dan 🏅.

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

**Setiap soal dapat satu kesempatan mengulang.** Kalau percobaan pertama belum
pas, yang muncul bukan "salah" melainkan **🔁 Belum pas — coba sekali lagi**
dengan warna amber. Contohnya langsung dibunyikan, dan ada dua tombol:
**🔊 Dengar contoh** dan **🎤 Coba Lagi**.

Selama kesempatan itu belum dipakai, **tidak ada yang tercatat sama sekali**:
nyawa ❤️ utuh, combo 🔥 utuh, dan soalnya belum terhitung terjawab. Baru
percobaan keduanya yang dinilai. Ini disengaja — percobaan pertama sering
gagal bukan karena lafalnya keliru, melainkan karena mikrofonnya baru menyala
saat anak sudah mulai bicara, suaranya terlalu pelan, atau anak baru saja
mendengar contohnya.

Dua hal yang tetap jujur:

- Combo 🔥 **tidak putus** oleh percobaan kedua, tetapi juga **tidak tumbuh** —
  combo tetap hadiah untuk yang sekali jadi.
- Kata yang baru pas di percobaan kedua **akan muncul lagi lebih cepat**.
  Anak melihat pujiannya, dan katanya tetap datang lagi besok.

Layar hasil menyebut berapa soal yang butuh percobaan kedua, jadi Bapak/Ibu
tetap bisa melihat ronde mana yang benar-benar lancar.

**Yang perlu diperhatikan:**

- **Butuh internet.** Pengenalan suara dikerjakan di server Google (Chrome)
  atau Apple (Safari), jadi suara anak dikirim ke sana selama beberapa detik.
  Aplikasi ini sendiri tidak merekam maupun menyimpan apa pun.
- Mikrofon hanya menyala saat tombolnya ditekan, mati sendiri setelah
  7 detik, dan langsung mati saat pindah layar.
- **Penilaiannya membandingkan bunyi, bukan tulisan.** Ini penting: pengenal
  suara menerima suara anak lalu *menebak* huruf mana yang dimaksud, dan dalam
  bahasa Mandarin yang penuh homofon tebakan itu sering meleset. Anak
  mengucapkan 妈妈 dengan benar, yang tertulis 麻麻 — bunyinya sama persis.
  Dulu itu dinilai salah total; sekarang bernilai penuh. Kamus lafalnya
  mencakup **seluruh huruf Han** (20.856 huruf), jadi tebakan mesin yang aneh
  sekalipun tetap dikenali kalau bunyinya memang sama.
- **Bunyi yang berdekatan** (zh/z, ch/c, sh/s, ng/n, r/l) hanya dihitung
  setengah kesalahan — itu kekeliruan paling lazim pada anak kecil.
- **Nada sengaja tidak dinilai.** Nada yang bisa diamati aplikasi adalah nada
  kamus dari huruf yang ditebak mesin, bukan nada yang benar-benar diucapkan
  anak. Nada tetap dilatih lewat mendengar contoh dan menirukan, bukan lewat
  penolakan.
- **Ambang lulusnya longgar** (kemiripan 50%). Anak 5 tahun tidak akan
  sempurna. Lebih baik anak terus berani bersuara daripada berhenti mencoba
  karena merasa selalu disalahkan.
- Kalau perangkatnya tidak mendukung (mis. Firefox), aplikasi otomatis
  berganti ke mode **"dengarkan lalu tirukan"**: anak menirukan dengan
  lantang, lalu Bapak/Ibu yang menekan "Sudah bisa" atau "Belum".

**Suara latihan menyimak tidak keluar?**
- Pastikan HP tidak dalam mode senyap.
- Android: buka *Setelan → Sistem → Bahasa & masukan → Keluaran teks-ke-ucapan*,
  lalu unduh paket suara **Bahasa Mandarin (中文)**.
- Ketuk tombol 🐢 untuk mendengar versi lebih pelan.

---

### 🔊 Kalau nadanya terdengar kurang jelas

Nada adalah pembeda makna dalam bahasa Mandarin: **mā** 妈 (ibu), **má** 麻
(rami), **mǎ** 马 (kuda), **mà** 骂 (memarahi) hanya berbeda pada naik-turunnya
suara. Kalau suara yang membacakan contohnya kurang tegas, anak mendengar
empat kata yang sama — dan tidak bisa menirukan nada yang tidak terdengar.

Hampir setiap perangkat punya **lebih dari satu** suara Mandarin, dan mutunya
jauh berbeda. Suara "compact" bawaan hemat memori dan lengkung nadanya rata;
suara *neural* / *premium* / suara jaringan jauh lebih tegas. Aplikasi sudah
memilihkan yang terbaik yang ada, tetapi Bapak/Ibu bisa mendengarkan sendiri:

1. Ketuk ⚙️ di pojok kanan atas → **🔊 Suara Pengucapan**.
2. Daftar suara Mandarin di perangkat itu muncul, terurut dari yang nadanya
   paling jelas. Yang teratas ditandai **disarankan**.
3. Ketuk **▶** di sebelah kanan sebuah suara untuk mendengar **妈麻马骂** —
   empat nada pada suku kata yang sama.
   - Kalau keempatnya terdengar **berbeda** → suaranya cukup jelas.
   - Kalau terdengar **sama saja** → coba suara lain di daftar itu.
   Mendengarkan tidak ikut memilih, jadi silakan bandingkan dulu.
4. Kalau sudah ketemu yang paling jelas, ketuk **lingkaran di sebelah kirinya**
   untuk memilihnya.
5. **Kecepatan** bisa disetel di bawahnya: 🐢 Pelan · Biasa · 🐇 Cepat.
   Darlene mungkin cocok di 🐢, Colin di Biasa.

Pilihan ini milik **perangkat itu saja** — tidak ikut tersinkron dan tidak
ikut terhapus saat progres di-reset. Jadi setiap HP/tablet/laptop perlu
disetel sendiri sekali.

**Kalau daftarnya kosong**, perangkat itu memang belum punya suara Mandarin.
Panel yang sama menampilkan langkah memasangnya:

- **Android**: Setelan → Bahasa & masukan → Keluaran teks-ke-ucapan →
  Pasang data suara → **Chinese (China)**.
- **iPhone/iPad**: Setelan → Aksesibilitas → Konten Terucap → Suara →
  **Chinese (China)** — pilih yang bertanda **Premium** (unduhannya lebih
  besar, tetapi nadanya paling jelas).
- **Laptop**: pakai **Google Chrome**; suara Mandarinnya diambil dari internet
  dan termasuk yang paling jelas.

**Tombol 🐢 di layar latihan** sekarang membacakan **satu suku kata sekali
ucap** dengan jeda di antaranya, bukan sekadar memperlambat. Satu nada utuh,
lalu diam sebentar — persis cara guru mengulang satu-satu supaya bisa ditirukan.

---

## 4. Progres di banyak perangkat

### 4a. ☁️ Sinkronisasi online (disarankan)

Supaya Colin dan Darlene bisa berlatih dari HP, tablet, atau laptop mana pun
dengan progres yang menyambung, dashboard perlu satu tempat penyimpanan di
internet. Penyimpannya dipasang sendiri, gratis, dan datanya tetap milik
keluarga.

**Sekali siapkan (±10 menit di komputer):** langkah lengkapnya ada di
**`server/README.md`** — daftar akun Cloudflare gratis, lalu jalankan tiga
perintah. Hasil akhirnya sebuah alamat seperti
`https://mandarin-fun-sync.xxx.workers.dev`.

**Lalu di setiap perangkat anak:**

1. Ketuk **⚙️** di pojok kanan atas.
2. Pilih **☁️ Sinkronisasi Online**.
3. Isi tiga hal — **sama persis di semua perangkat**:
   - **Alamat server** — alamat `workers.dev` tadi
   - **Kode keluarga** — bebas, mis. `keluarga-wor` (huruf kecil, angka, tanda hubung)
   - **PIN** — 4-12 angka
4. Ketuk **🔗 Sambungkan**.

Setelah itu progres tersinkron sendiri: saat aplikasi dibuka, tiap selesai
satu ronde latihan atau sesi belajar, dan saat aplikasi ditutup. Ada juga
tombol **Sinkronkan Sekarang** kalau ingin memaksa.

**Kalau lupa kode keluarga atau PIN**

Perangkat yang sudah tersambung menyimpan keduanya, jadi ia bisa menjadi
catatannya sendiri:

1. Di perangkat yang masih tersambung, ketuk **⚙️** → **☁️ Sinkronisasi Online**
2. **Kode keluarga** sudah terlihat di kolomnya
3. Untuk PIN-nya, ketuk **👁 Tampilkan** di sebelah kanan label PIN

Catat keduanya di tempat aman — pengelola kata sandi (Apple Passwords/iCloud
Keychain) atau catatan terkunci. **Jangan menuliskannya di dalam berkas proyek**:
repositorinya publik, jadi apa pun yang ditulis di situ ikut terbaca siapa pun.

Kalau tidak ada satu pun perangkat yang masih tersambung dan PIN-nya benar-benar
hilang, datanya tidak bisa dibuka lagi — tetapi tidak ada yang hilang: sambungkan
saja dengan **kode keluarga baru**, dan progres dari perangkat itu akan terunggah
sebagai catatan baru.

**Yang perlu diketahui:**

- **Internet mati? Tidak masalah.** Anak tetap bisa berlatih; progresnya
  menyusul terkirim saat online lagi.
- **Dua perangkat bersamaan?** Datanya **digabung**, bukan saling menimpa —
  pelajaran yang tuntas di perangkat mana pun tetap tercatat. Satu
  pengecualian: bila di hari yang sama kedua perangkat dipakai tanpa sempat
  tersinkron, XP hari itu diambil yang terbesar, bukan dijumlahkan.
- **Yang dikirim hanya catatan belajar** — XP, riwayat harian, bintang,
  kartu hafalan, lencana. Tidak ada rekaman suara dan tidak ada data perangkat.
- Kode keluarga + PIN adalah satu-satunya kuncinya, jadi jangan disebarkan
  bersamaan dengan alamat servernya.

### 4b. 💾 Cadangan manual (cara lama, tetap berguna)

Berguna sebagai arsip, atau bila tidak ingin memasang penyimpan online.
Lakukan sebulan sekali, atau sebelum ganti HP.

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
Setelan sinkronisasi tidak ikut terhapus; kalau perangkat masih tersambung,
progres dari server akan masuk lagi pada sinkronisasi berikutnya. Untuk
benar-benar mengosongkan, putuskan sambungannya lebih dulu (⚙️ → ☁️ →
**🔌 Putuskan Perangkat Ini**).

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

   | `bridgePerLesson: 4` | Berapa kata bekal HSK yang dilihat anak itu tiap pelajaran (Colin 4, Darlene 2) |
   | `avatar: 'icons/avatar-colin.png'` | Berkas gambar lambang anak. Kosongkan (hapus barisnya) untuk kembali memakai emoji |

3. Untuk mengubah jumlah soal atau nyawa, cari bagian `session:`:

   | Yang diubah | Artinya |
   |---|---|
   | `questionsPerRound: 10` | Jumlah soal per ronde |
   | `hearts: 5` | Jumlah nyawa |

4. Untuk sesi belajar, cari bagian `study:`:

   | Yang diubah | Artinya |
   |---|---|
   | `requireBeforeQuiz: true` | Ubah jadi `false` bila soal tidak perlu lagi menunggu sesi belajar selesai |
   | `xpFirstTime: 20` | Hadiah XP saat pertama menuntaskan materi sebuah pelajaran |
   | `xpRepeat: 5` | Hadiah XP saat membaca ulang materi |

5. Simpan (`Cmd + S`), lalu muat ulang halaman di browser.
6. Agar ikut terbit di tautan online, jalankan `git push` (lihat bagian 9).

---

## 5a. Mengganti lambang (avatar) anak

Lambang anak boleh berupa gambar sendiri, bukan hanya emoji. Berguna untuk
hewan yang belum punya emoji resmi — kapibara, misalnya.

**Syarat gambarnya:**

| Hal | Ketentuan |
|---|---|
| Nama berkas | `avatar-colin.png` atau `avatar-darlene.png` — persis, huruf kecil semua |
| Ukuran | Persegi, sebaiknya 512 × 512 piksel |
| Latar | **Transparan**. Latar putih akan terlihat sebagai kotak putih pada tema gelap |
| Berat | Di bawah 300 KB supaya cepat dimuat |

**Cara memasangnya lewat browser (tanpa Terminal):**

1. Buka https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene
2. Masuk ke folder **`public`** → **`icons`**
3. Klik tombol **Add file** → **Upload files**
4. Seret berkas PNG-nya ke halaman itu. **Pastikan namanya sudah benar sebelum
   diunggah** — GitHub memakai nama berkas apa adanya.
5. Gulir ke bawah, klik **Commit changes**

Satu menit kemudian tautan dashboard sudah memakainya. Di HP, tutup penuh
aplikasinya lalu buka lagi agar versi barunya terambil.

**Kalau gambarnya belum ada atau salah nama**, aplikasi otomatis kembali
menampilkan emoji — tidak akan muncul ikon gambar rusak.

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

## 7. Menerbitkan perubahan

Setelah materi atau setelan diubah, jalankan ini di Terminal:

```bash
cd "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene"
npm run bridge     # wajib bila kosakatanya berubah — menyusun ulang bekal HSK
npm test           # memastikan tidak ada yang rusak
git add -A && git commit -m "Perbarui materi" && git push
```

Tautan online ikut ter-update sendiri dalam satu menit. `npm test` sengaja
gagal bila `npm run bridge` terlewat, jadi tidak mungkin lupa tanpa ketahuan.

Bila ingin versi satu-berkas (untuk dikirim lewat email atau disalin ke
flashdisk) ikut diperbarui:

```bash
npx esbuild --version >/dev/null 2>&1 || npm install esbuild
npm run build      # menghasilkan dist/mandarin-fun.html
```

---

## 8. Kalau ada masalah

| Gejala | Yang harus dilakukan |
|---|---|
| Halaman putih / "Aplikasi gagal dimuat" | Pastikan alamatnya diawali `http://`, bukan `file://`. Server di langkah 2a harus menyala. |
| "Materi belum tersedia" saat pelajaran diketuk | Level itu belum diimpor (HSK). Normal. |
| Level bergembok 🔒 | Terbuka otomatis setelah XP cukup. Bisa dibuka paksa lewat `openLevels` di bagian 5. |
| Suara tidak keluar | Lihat bagian 3. |
| Skor anak tercampur | Tidak mungkin tercampur — datanya terpisah. Pastikan menekan nama yang benar di halaman awal. |
| Progres hilang setelah bersihkan data browser | Kalau sinkronisasi aktif, progres masuk lagi sendiri saat aplikasi dibuka. Kalau tidak, pulihkan dari cadangan (bagian 4b). |
| Soal bergembok 🔒 saat pelajaran diketuk | Normal — materinya belum dibaca. Ketuk **📘 Sesi Belajar** di panel yang sama. |
| Sinkronisasi bilang "Kode keluarga atau PIN tidak cocok" | Kode dan PIN harus **sama persis** di semua perangkat. Yang berlaku adalah PIN yang dipakai perangkat pertama kali menyambung. |
| Sinkronisasi bilang "Tidak ada sambungan" | Internet sedang mati, atau alamat servernya salah ketik. Progres tetap aman di perangkat dan akan menyusul sendiri. |
| Kata ter-blok biru saat anak menyentuh layar | Sudah diperbaiki — pastikan halaman dimuat ulang paksa (`Cmd/Ctrl + Shift + R`) agar versi barunya terpakai. |

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

Di atas angka itu, **259 kata HSK dititipkan** ke pelajaran-pelajaran YCT
sebagai bekal, dan **476 kata YCT ditandai** karena ternyata juga ada di
daftar HSK (lihat bagian 3b).

Semuanya diperkenalkan lewat sesi belajar, lalu bisa dilatih dalam empat
keterampilan: membaca, mendengar, berbicara, dan menulis.

---

---

## 9. Tautan online — sudah aktif ✅

GitHub Pages sudah menyala dan dashboardnya hidup di:

**https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/public/**

### Kalau nanti materinya diperbarui

```bash
cd "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/Latihan-Mandarin-Colin-Darlene"
git push
```

Situsnya ikut ter-update sendiri dalam satu menit. Perangkat yang sudah
memasang aplikasinya akan mengambil versi baru saat dibuka berikutnya
(kadang perlu ditutup dan dibuka sekali lagi).

### Yang perlu Bapak/Ibu ketahui

- Repositorinya **publik** karena GitHub Pages pada paket gratis memang
  mensyaratkan itu. Artinya kutipan kosakata dan kalimat dari buku YCT/HSK
  bisa dilihat siapa pun yang tahu alamatnya.
- `robots.txt` dan `<meta name="robots" content="noindex">` membuatnya **tidak
  muncul di hasil pencarian Google**.
- **Progres anak tidak ikut publik.** Progres tinggal di perangkat
  masing-masing, dan bila sinkronisasi dinyalakan, di penyimpan milik keluarga
  sendiri yang dikunci kode + PIN (bagian 4a).
- Kalau suatu saat ingin ditutup kembali: buka
  https://github.com/andwowor/Latihan-Mandarin-Colin-Darlene/settings
  lalu gulir ke **Danger Zone → Change repository visibility → Private**.
  Situsnya otomatis mati.

---

## Lampiran: cara mengaktifkan Pages (kalau suatu saat mati)

Disimpan sebagai catatan — normalnya tidak perlu dibuka lagi.

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

Setelah tersimpan, tunggu 1-3 menit lalu buka
**https://andwowor.github.io/Latihan-Mandarin-Colin-Darlene/**.
Kalau masih 404, muat ulang paksa (`Cmd/Ctrl + Shift + R`) — browser kadang
menyimpan halaman 404 yang lama.
