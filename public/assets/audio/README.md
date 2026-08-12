# Audio latihan menyimak

## Keadaan saat ini

Folder sumber YCT 1–6 dan HSK 1–3 di komputer ini **tidak memuat satu pun berkas
audio** — semuanya hanya PDF hasil pindaian. Karena itu latihan menyimak memakai
**text-to-speech Mandarin bawaan perangkat** (`zh-CN`), yang tersedia di:

- Chrome di Android, Windows, macOS, ChromeOS
- Safari di iPhone, iPad, macOS

Kalimat yang dibacakan diambil dari **"Test Listening Scripts"** asli di buku
(mis. YCT 1 halaman 61), jadi materinya tetap otentik walau suaranya sintetis.

## Menambahkan audio asli dari penerbit

Buku YCT/HSK menyediakan MP3 pendamping di situs resmi penerbit
(tercetak di sampul belakang: `www.chinesetest.cn/jiaocheng.do` dan
`www.chinesexp.com.cn`). Bila Anda mengunduhnya:

1. Salin berkas audio ke folder ini.
2. Daftarkan di `manifest.json`, memetakan **teks Mandarin persis** seperti yang
   tertulis di berkas kurikulum ke nama berkasnya:

```json
{
  "你好。": "yct1/01-04-a.mp3",
  "老师再见。": "yct1/01-04-c.mp3",
  "我很好。": "yct1/05-03.mp3"
}
```

3. Muat ulang aplikasi. `WebSpeechAdapter` otomatis memakai berkas audio bila
   teksnya ada di manifest, dan jatuh kembali ke text-to-speech bila tidak.

Tidak perlu mengubah kode apa pun — pemetaan ini satu-satunya yang dibaca
(`src/adapters/outbound/webSpeechAdapter.js`).

## Catatan

`manifest.json` yang kosong (`{}`) berarti "belum ada audio asli, pakai
text-to-speech untuk semuanya". Itu kondisi normal, bukan galat.
