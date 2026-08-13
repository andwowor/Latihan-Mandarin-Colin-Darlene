# Cara Menambah Materi Baru (sisa: HSK 2 dan HSK 3)

Dokumen ini menjelaskan cara memasukkan level berikutnya ke dalam aplikasi.
Tidak ada perubahan kode yang diperlukan — cukup menambah satu berkas JSON.

## Kenapa tidak otomatis?

Semua PDF di folder sumber adalah **hasil pindaian (gambar murni)**. Tidak ada
lapisan teks, sehingga `pdftotext` hanya menghasilkan watermark. Ekstraksi
dilakukan dengan **membaca halaman secara visual** lalu menyalin isinya.

```bash
# Membuktikan sendiri: keluarannya hanya watermark
pdftotext -f 1 -l 5 "YCT 4/YCT4_standart_course.pdf" -
```

## Langkah 1 — Siapkan alat

```bash
brew install poppler   # menyediakan pdfinfo, pdfseparate, pdfunite, pdftoppm
```

## Cara tercepat: baca 词语表, bukan halaman pelajaran

Ini metode yang terbukti dipakai untuk YCT 4, 5, dan 6 — **5 halaman
menggantikan 15 halaman**.

Di bagian belakang tiap buku ada `词语表 Vocabulary`: daftar seluruh kosakata
buku, terurut pinyin, lengkap dengan **nomor halaman** tempat kata itu muncul:

```
帮助   to help; help    bāngzhù   3
北方   north            běifāng   107
```

Nomor halaman itu persis sama dengan nomor halaman pembuka pelajaran di daftar
isi. Jadi `3 → Pelajaran 1`, `107 → Pelajaran 14`, dan seterusnya. Cukup baca
daftar isi (1 halaman) + 词语表 (4–5 halaman), lalu petakan.

Contoh pemetaan yang dipakai untuk YCT 5:

| Halaman di 词语表 | Pelajaran |
|---|---|
| 3, 11, 19, 27, 35, 43, 51 | 1–7 |
| 59, 67, 75, 83, 91, 99, 107 | 8–14 |

Verifikasi hasilnya dengan membandingkan jumlah kata terhadap angka yang
disebut di Preface buku (mis. "covering 78 words"). YCT 4 cocok persis 78.

## Langkah 2 — Temukan halaman yang penting

Setiap buku *YCT Standard Course* punya pola yang sama:

| Bagian | Isi yang diambil |
|---|---|
| Halaman `目录 Contents` (biasanya PDF hal. 2) | daftar 12 pelajaran + nomor halamannya |
| Halaman pembuka tiap pelajaran | **Key Sentences** dan **Let's learn** (kosakata + pinyin + arti) |
| `测试页听力文本 Test Listening Scripts` | kalimat asli untuk latihan menyimak |
| `测试页答案 Test Answers` | kunci jawaban resmi |

Nomor halaman cetak **tidak selalu sama** dengan nomor halaman PDF, dan beberapa
pindaian melompati halaman. Kalibrasi dulu dengan mengambil beberapa halaman:

```bash
cd /tmp
SRC="/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/YCT 4/YCT4_standart_course.pdf"
pdfinfo "$SRC" | grep Pages

# Ambil halaman contoh untuk mencari selisih penomoran
for p in 2 5 10 15; do pdfseparate -f $p -l $p "$SRC" "probe-$p.pdf"; done
pdfunite probe-*.pdf probe.pdf
open probe.pdf
```

Setelah selisihnya diketahui, gabungkan hanya halaman pembuka pelajaran menjadi
satu PDF ringkas supaya mudah dibaca sekaligus:

```bash
for p in 5 10 15 20 25 30 35 40 45 50 55; do pdfseparate -f $p -l $p "$SRC" "l-$p.pdf"; done
pdfunite l-*.pdf openers.pdf
```

## Langkah 3 — Tulis berkas JSON

Buat `public/data/curriculum/yct4.json` mengikuti bentuk berikut
(contoh lengkap bisa dilihat di `yct1.json`):

```jsonc
{
  "id": "yct4",
  "track": "YCT",
  "level": 4,
  "code": "YCT 4",
  "titleZh": "YCT标准教程 4",
  "titleEn": "YCT Standard Course 4",
  "titleId": "YCT Standar Kursus 4",
  "vocabTarget": 300,
  "recommendedFor": [],
  "source": {
    "book": "YCT4_standart_course.pdf",
    "path": "/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/YCT 4",
    "answerKeyPage": "Test Answers (hal. ...)",
    "listeningScriptPage": "Test Listening Scripts (hal. ...)"
  },
  "lessons": [
    {
      "number": 1,
      "titleZh": "…",
      "titleEn": "…",
      "titleId": "…",                    // terjemahan Indonesia, dipakai di UI
      "keySentences": [
        { "zh": "…", "py": "…", "en": "…", "id": "…" }
      ],
      "vocab": [
        { "zh": "…", "py": "…", "en": "…", "id": "…" }
      ],
      "listeningScripts": ["…"],          // kalimat dari Test Listening Scripts
      "bookAnswers": ["A", "×", "√"]      // kunci jawaban resmi, untuk penelusuran
    }
  ]
}
```

### Aturan penting

- **`py` (pinyin) harus memakai spasi antar-kata**, mis. `"Wǒ hěn hǎo"` bukan
  `"Wǒhěnhǎo"`. Pemisahan kata pada latihan menyusun kalimat memakai spasi ini
  sebagai petunjuk (lihat `segmentSentence()` di `src/domain/exerciseFactory.js`).
- **`id` wajib diisi** — itu yang dibaca anak-anak. `en` boleh sekadar salinan
  dari buku.
- `listeningScripts` boleh kosong; soal menyimak akan dibangkitkan dari kosakata.
- `bookAnswers` murni untuk penelusuran ke buku aslinya. Aplikasi **tidak**
  memakainya untuk menilai, karena soal dibangkitkan sendiri (lihat ADR-0004).

## Langkah 4 — Aktifkan levelnya

Ubah `status` di `public/data/curriculum/index.json` dari `"pending-import"`
menjadi `"ready"`:

```json
{ "id": "yct4", "code": "YCT 4", "file": "yct4.json", "status": "ready", "unlockAtXp": 3000 }
```

Sesuaikan `unlockAtXp` bila perlu — itu ambang XP agar level terbuka.

## Langkah 5 — Tambahkan ke daftar cache offline

Tambahkan barisnya di `sw.js` (array `ASSETS`), lalu naikkan `VERSION`
supaya cache lama dibuang:

```js
const VERSION = 'mandarin-fun-v3';
...
'public/data/curriculum/yct4.json'
```

## Langkah 6 — Periksa

```bash
npm test                                   # uji lapisan domain
python3 -c "import json;json.load(open('public/data/curriculum/yct4.json'))"
npm start                                  # lalu buka http://localhost:4173/public/
```

---

## Catatan khusus

### Lokasi halaman HSK yang sudah ditemukan

Hasil penelusuran, supaya impor berikutnya tinggal ambil halamannya:

| Buku | Halaman PDF | Isi |
|---|---|---|
| `hsk1 textbook.pdf` | 9, 11, 13 | 目录 Contents (pelajaran 1-5, 6-10, 11-15) |
| `hsk1 textbook.pdf` | 133-139 | 词语总表 Vocabulary — **ada kolom 课号 Lesson** |
| `HSK标准教程2.pdf` | selisih PDF = cetak + 23 | mis. PDF 140 = cetak 117 |
| `HSK-3-standard-course-pdf.pdf` | 9, 11, 13, 15 | 目录 Contents (20 pelajaran) |
| `HSK-3-standard-course-pdf.pdf` | selisih PDF = cetak + 16 | mis. PDF 185 = cetak 169 |

**Kabar baik:** daftar kosakata buku HSK memuat kolom **课号 Lesson** secara
langsung, jadi tidak perlu dipetakan lewat nomor halaman seperti buku YCT.
Impornya lebih sederhana.

### Buku HSK berbeda susunannya

Buku *HSK 标准教程* memakai istilah `课` (pelajaran) dengan bagian
`生词` (kosakata baru) dan `课文` (teks). Pemetaan ke skema JSON:

| Bagian buku HSK | Ruas JSON |
|---|---|
| `生词` | `vocab` |
| `课文` / kalimat contoh | `keySentences` |
| naskah latihan menyimak di buku latihan | `listeningScripts` |
| kunci jawaban di 练习册 | `bookAnswers` |

### Audio

Lihat `public/assets/audio/README.md`.
