# 02 - Logical View

Dependensi mengarah ke dalam: `adapters -> ports -> application -> domain`.
Lapisan domain tidak mengimpor apa pun dari luar dirinya, sehingga bisa diuji
tanpa browser (`npm test`, 30 pengujian).

```
public/app.js                     merakit semua bagian (composition root)
        │
        ▼
adapters/inbound                  adapters/outbound
  uiController.js                   staticContentAdapter.js   (fetch JSON)
  dom.js                            localStorageAdapter.js    (localStorage)
  traceCanvas.js                    webSpeechAdapter.js       (TTS / MP3)
  views/*.js                        webSpeechRecognitionAdapter.js
        │                                                     (mikrofon)
        │                                   │
        └──────────► ports ◄────────────────┘
        contentPort · storagePort · speechPort · recognitionPort
                          │
                          ▼
                    application
       profileService · curriculumService · missionService
              practiceService · statsService
                          │
                          ▼
                       domain
  scoring · streak · missions · srs · rewards · progress
         pronunciation · exerciseFactory
```

## Tanggung jawab tiap modul domain

| Modul | Isi |
|---|---|
| `scoring.js` | multiplier combo, XP per jawaban, kurva level, bintang 0–3 |
| `streak.js` | hari berturut-turut, status target harian |
| `missions.js` | tiga misi harian (pelajaran, XP, pelajaran sempurna) yang dipilih deterministik dari tanggal + id anak |
| `srs.js` | kotak Leitner untuk pengulangan kata |
| `rewards.js` | katalog 18 lencana beserta syaratnya |
| `progress.js` | rekaman harian dan agregasi per periode |
| `pronunciation.js` | membandingkan ucapan anak dengan target (jarak sunting per karakter) |
| `exerciseFactory.js` | membangkitkan soal + kunci jawabannya, dan menilai jawaban |

## Application

| Layanan | Tanggung jawab |
|---|---|
| `profileService` | pilih profil, ringkasan progres, ekspor/impor cadangan |
| `curriculumService` | daftar level, kunci/buka level, peta pelajaran, kamus |
| `missionService` | status misi hari ini dan pembayaran hadiah XP |
| `practiceService` | siapkan ronde, nilai jawaban, tutup ronde |
| `statsService` | laporan per periode dan papan skor dua anak |

## Catatan tentang penilaian

Satu pintu masuk penilaian: `exerciseFactory.grade(question, response)`.
Soal pilihan ganda dibandingkan langsung dengan `question.answer`; soal menulis
(`trace`) dinilai dari kemiripan coretan pada kanvas (lihat `traceCanvas.js`);
soal berbicara dinilai dari kemiripan teks hasil pengenal suara
(lihat `pronunciation.js` dan ADR-0007).
