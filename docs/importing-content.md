# Cara Menambah Materi Baru (YCT 4–6, HSK 1–3)

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

### HSK 1 — folder kosong

`/Users/andwowor/Documents/PELAJARAN ANAK/MANDARIN/HSK 1` tidak berisi berkas
apa pun. Letakkan `HSK标准教程1.pdf` di sana lebih dulu, lalu ikuti langkah di
atas dan ubah `status` dari `"missing-source"` menjadi `"ready"`.

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
