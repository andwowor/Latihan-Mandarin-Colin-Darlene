# 02 - Process View

## Alur harian seorang anak

1. Buka aplikasi → **halaman pilih profil** (tanpa password).
   Ketukan pertama ini juga "membuka kunci" audio di iOS/Safari.
2. **Beranda**: cincin target XP hari ini, kartu **misi harian** (3 misi),
   dan tombol *Lanjut Belajar* menuju pelajaran berikutnya.
3. **Peta pelajaran**: pilih level (YCT 1/2/3) lalu ketuk sebuah pelajaran.
4. Panel bawah muncul: pilih **Membaca / Mendengar / Menulis / Campur**.
5. **Ronde latihan** — 10 soal, 5 nyawa:
   - soal dibangkitkan dari kosakata & kalimat pelajaran,
   - urutan kata mengikuti prioritas SRS (kata lemah lebih dulu),
   - jawaban dinilai seketika, umpan balik muncul dari bawah layar,
   - jawaban benar beruntun menaikkan multiplier combo (maks ×3).
6. **Ronde selesai** → simpan XP, bintang, kartu SRS, dan rekaman harian →
   **evaluasi misi harian** → bayar hadiah XP misi yang baru tercapai →
   hitung ulang lencana.
7. **Layar hasil**: bintang, XP, kemajuan misi, lencana baru, daftar
   yang perlu diulang.

## Alur orang tua

- Ikon ⚙️ di kanan atas → simpan cadangan JSON, muat cadangan, atau hapus progres.
- Tab **Progres** → papan skor Colin vs Darlene pada 6 rentang waktu.

## Urutan pemanggilan saat menutup ronde

```
practiceService.finish()
  ├─ profiles.update()            simpan XP, bintang, statistik, rekaman harian
  ├─ missionService.claimCompleted()   bayar hadiah misi yang tuntas (sekali saja)
  ├─ profiles.refreshBadges()     evaluasi ulang 16 lencana
  └─ kembalikan ringkasan         dipakai layar hasil
```

Hadiah misi dicatat di `dailyLog[hari].missionsClaimed` sehingga tidak pernah
dibayar dua kali walaupun aplikasi dimuat ulang.

## Peristiwa yang memicu penggambaran ulang

Seluruh layar digambar ulang setiap navigasi (`UiController.render()`),
dan interaksi ditangani lewat delegasi event pada satu simpul akar. Pilihan ini
membuat tidak ada state tampilan yang perlu disinkronkan secara manual.
