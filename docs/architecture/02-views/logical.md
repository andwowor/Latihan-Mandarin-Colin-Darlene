# 02 - Logical View

Dependensi mengarah ke dalam: `adapters -> ports -> application -> domain`.
Lapisan domain tidak mengimpor apa pun dari luar dirinya, sehingga bisa diuji
tanpa browser (`npm test`, 142 pengujian).

```
public/app.js                     merakit semua bagian (composition root)
        │
        ▼
adapters/inbound                  adapters/outbound
  uiController.js                   staticContentAdapter.js   (fetch JSON)
  dom.js                            bridgedContentAdapter.js  (tempel bekal HSK)
  traceCanvas.js                    localStorageAdapter.js    (localStorage)
  views/*.js                        webSpeechAdapter.js       (TTS / MP3)
        │                           webSpeechRecognitionAdapter.js (mikrofon)
        │                           httpSyncAdapter.js        (Worker + KV)
        │                                   │
        └──────────► ports ◄────────────────┘
   contentPort · storagePort · speechPort · recognitionPort · syncPort
                          │
                          ▼
                    application
       profileService · curriculumService · missionService
       practiceService · studyService · statsService · syncService
                          │
                          ▼
                       domain
  scoring · streak · missions · srs · rewards · progress
  pronunciation · exerciseFactory · studyDeck · hskBridge · mergeState
```

`bridgedContentAdapter` adalah pembungkus, bukan sumber konten tersendiri: ia
membungkus adapter JSON (atau adapter versi-satu-berkas) dan menempelkan bekal
HSK ke setiap pelajaran. Dengan begitu kedua sumber konten berperilaku sama
tanpa aturan penyisipan tercecer di dua tempat.

## Tanggung jawab tiap modul domain

| Modul | Isi |
|---|---|
| `scoring.js` | multiplier combo, XP per jawaban, kurva level, bintang 0–3 |
| `streak.js` | hari berturut-turut, status target harian |
| `missions.js` | tiga misi harian (pelajaran, XP, pelajaran sempurna) yang dipilih deterministik dari tanggal + id anak |
| `srs.js` | kotak Leitner untuk pengulangan kata |
| `rewards.js` | katalog 64 lencana dalam tujuh kelompok, beserta syarat dan pemilihan "incaran berikutnya" |
| `progress.js` | rekaman harian dan agregasi per periode |
| `pronunciation.js` | membandingkan ucapan anak dengan target **berdasarkan bunyi**, memakai kamus lafal; homofon bernilai penuh (ADR-0011) |
| `speechVoice.js` | menilai suara text-to-speech perangkat agar yang **nadanya paling jelas** yang dipakai, dan memecah teks per suku kata untuk mode 🐢 (ADR-0012) |
| `exerciseFactory.js` | membangkitkan soal + kunci jawabannya, dan menilai jawaban |
| `studyDeck.js` | menyusun materi pelajaran menjadi tumpukan kartu sesi belajar (ADR-0008) |
| `hskBridge.js` | memilih kata HSK yang dititipkan ke tiap pelajaran YCT (ADR-0009) |
| `mergeState.js` | menggabungkan dua salinan progres tanpa menghilangkan apa pun (ADR-0010) |

## Application

| Layanan | Tanggung jawab |
|---|---|
| `profileService` | pilih profil, ringkasan progres, ekspor/impor cadangan |
| `curriculumService` | daftar level, kunci/buka level, peta pelajaran, kamus |
| `missionService` | status misi hari ini dan pembayaran hadiah XP |
| `practiceService` | siapkan ronde, nilai jawaban, tutup ronde |
| `studyService` | jalankan sesi belajar, buka kunci soal, bayar hadiah XP-nya |
| `statsService` | laporan per periode, papan skor, dan perbandingan ketepatan per keterampilan |
| `syncService` | satu putaran ambil → gabung → kirim, beserta keadaan sambungannya |

## Catatan tentang penilaian

Satu pintu masuk penilaian: `exerciseFactory.grade(question, response)`.
Soal pilihan ganda dibandingkan langsung dengan `question.answer`; soal menulis
(`trace`) dinilai dari kemiripan coretan pada kanvas (lihat `traceCanvas.js`);
soal berbicara dinilai dari kemiripan teks hasil pengenal suara
(lihat `pronunciation.js` dan ADR-0007).
