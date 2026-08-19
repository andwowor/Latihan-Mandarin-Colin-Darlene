# ADR-0012: Suara yang Nadanya Terdengar Jelas
Tanggal   : 2026-08-19
Status    : Accepted
Menggantikan sebagian: ADR-0005 (bagian pemilihan suara dan kecepatan)

## Konteks

Laporan dari rumah: *"masalah pada bagian speaking adalah sound pengucapan
yang kamu berikan nada pronunciation-nya tidak terlalu terdengar jelas
sehingga anak saya susah menirunya."*

Ini keluhan yang berbeda dari ADR-0011. ADR-0011 memperbaiki **penilaian** —
apa yang terjadi setelah anak bicara. Yang dikeluhkan sekarang ada di
**sebelum** itu: contoh yang dibacakan aplikasi tidak cukup jelas untuk
ditiru. Anak tidak bisa menirukan nada yang tidak terdengar.

Nada adalah pembeda makna dalam bahasa Mandarin — mā (妈, ibu), má (麻, rami),
mǎ (马, kuda), mà (骂, memarahi) hanya berbeda pada lengkung nadanya. Kalau
lengkung itu rata, anak mendengar empat kata yang sama.

Tiga hal pada ADR-0005 ternyata sama-sama meratakannya:

**1. Suaranya diambil asal ketemu.** Kodenya:

```js
voices.find((v) => v.lang === 'zh-CN') || voices.find((v) => /^zh/i.test(v.lang))
```

Yaitu suara Mandarin **pertama** dalam daftar perangkat. Urutan daftar itu
tidak ada hubungannya dengan mutu. Di iPhone yang pertama biasanya suara
*compact* — suara formant hemat memori yang memang meratakan lengkung nada —
padahal perangkat yang sama juga punya suara *Premium* yang jauh lebih tegas,
hanya letaknya di belakang. Di laptop, suara neural Microsoft/Google kerap
kalah urutan dari suara lokal lama.

**2. Mode pelan meregangkan suku kata.** `rate 0.5` tidak memperjelas nada;
ia meregangkan satu suku kata sampai lengkungnya melar dan terdengar seperti
dengungan. Yang dibutuhkan anak bukan suku kata yang lebih panjang, melainkan
jeda untuk menyerap dan menirukan.

**3. `pitch 1.05`.** Setiap pergeseran pitch ditumpangkan **di atas** lengkung
nada aslinya. Untungnya kecil, risikonya jelas.

## Keputusan

### Suara dipilih berdasarkan mutu, bukan urutan

`domain/speechVoice.js` memberi nilai pada setiap suara — fungsi murni,
masukannya objek biasa, bisa diuji tanpa browser:

| Faktor | Nilai |
|---|---|
| Logat: zh-CN · zh-SG · zh-TW | +40 · +30 · +25 |
| Bertanda neural/natural/premium/enhanced/Siri/WaveNet | +30 |
| Bertanda compact/eSpeak/pico | −30 |
| Suara jaringan (`localService === false`) | +15 |
| Nama yang sudah dikenal (Xiaoxiao, Li-mu, Google, Ting-Ting, …) | +2…+22 |

Kanton (`zh-HK`, `yue`) **dibuang seluruhnya**, bukan sekadar diturunkan.
Nada dan lafalnya berbeda sama sekali dari Mandarin; melatih dengannya bukan
sekadar kurang bagus, melainkan salah.

Satu akibat yang disengaja: **kejelasan mengalahkan logat.** Suara Taiwan yang
jelas menang atas suara daratan yang ringkas, karena lengkung nadanya persis
sama di kedua logat sementara nada yang datar justru inti keluhannya.

### Mode 🐢 membacakan satu suku kata sekali ucap

Bukan `rate` yang diturunkan, melainkan teksnya yang dipecah: satu huruf Han =
satu suku kata, diucapkan sendiri-sendiri dengan jeda 340 ms. Hasilnya nada
kutipan yang bersih — persis cara guru mengulang satu-satu supaya bisa
ditirukan. Kecepatannya sendiri naik dari 0,5 ke 0,7 karena kelambatannya kini
datang dari jedanya, bukan dari meregangkan suaranya.

`rate` biasa naik 0,75 → 0,8 dan `pitch` dikembalikan ke 1.

### Orang tua bisa memilih dan mendengarkan sendiri

Daftar suara berbeda di tiap perangkat, dan telinga orang tua adalah satu-
satunya penguji yang sebenarnya. Menu Orang Tua → **🔊 Suara Pengucapan**
menampilkan seluruh suara Mandarin di perangkat itu, terurut, masing-masing
dengan keterangan singkat ("suara neural — nada paling jelas", "suara ringkas
— nada cenderung datar") dan tombol ▶ yang membacakan **妈麻马骂**: empat nada
pada suku kata yang sama. Kalau keempatnya terdengar berbeda, suaranya cukup
jelas; kalau terdengar sama, tidak.

Mendengarkan sengaja **tidak** sama dengan memilih — tombol ▶ mengembalikan
setelan setelah contohnya selesai, jadi orang tua bisa membandingkan dulu.

Ada juga tiga tombol kecepatan (🐢 Pelan · Biasa · 🐇 Cepat) karena Darlene (5)
dan Colin (7) tidak butuh kecepatan yang sama.

Pilihannya disimpan sebagai **setelan perangkat**, satu kunci dengan setelan
sinkronisasi — jadi tidak pernah ikut terkirim ke server dan tidak pernah ikut
tersapu saat progres di-reset. Memang begitu seharusnya: suara yang tersedia
milik perangkat, bukan milik anak. Pilihan yang sudah tidak ada di perangkat
baru diabaikan diam-diam, jatuh kembali ke pilihan otomatis.

Perangkat yang sama sekali tidak punya suara Mandarin tidak lagi hanya diam:
panel itu menampilkan langkah memasang paket suaranya di Android, iOS, dan
laptop.

## Yang sengaja tidak dikerjakan

- **Menyintesis nada sendiri (mengolah pitch).** Menggeser pitch di atas
  keluaran text-to-speech merusak lengkung aslinya — persis kesalahan yang
  sedang diperbaiki.
- **Memakai layanan suara berbayar di internet.** Butuh backend dan biaya
  jalan; ADR-0002 menahan aplikasi ini tetap statis. Jalur MP3 asli (ADR-0005)
  tetap terbuka dan tetap didahulukan bila berkasnya ada.
- **Menampilkan tanda nada pada tulisan.** Berguna, tetapi itu soal tampilan,
  bukan soal suara yang sedang dikeluhkan.
- **Memaksa suara jaringan.** Lebih jelas, tetapi mati saat internet putus —
  dan aplikasi ini harus tetap jalan offline.

## Konsekuensi

- (+) Perangkat yang punya suara neural kini memakainya, tanpa disetel.
- (+) Mode 🐢 memberi nada kutipan yang bersih, satu per satu.
- (+) Kanton tidak pernah lagi terpakai untuk melatih Mandarin.
- (+) Aturannya fungsi murni, bisa diuji tanpa mikrofon dan tanpa suara
  (14 pengujian baru).
- (+) Perangkat tanpa suara Mandarin mendapat petunjuk memasangnya, bukan
  sekadar diam.
- (−) Perangkat yang **hanya** punya suara ringkas tidak bisa ikut membaik.
  Yang bisa ditawarkan hanya petunjuk memasang suara yang lebih baik.
- (−) Satu kalimat panjang di mode 🐢 kini berbunyi lebih lama, karena ada
  jeda di antara tiap suku kata.
- (−) Mutunya tetap tidak bisa diuji dari sisi pengembang: tidak ada cara
  mendengarkan hasilnya di sini. Telinga orang tua yang menentukan — dan
  karena itulah pemilihnya ada.
