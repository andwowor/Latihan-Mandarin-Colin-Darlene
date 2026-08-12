# ADR-0002: Bangun sebagai Progressive Web App (PWA)
Tanggal   : 2026-08-12
Status    : Accepted

## Konteks
Aplikasi harus dapat dipasang di Android, iPhone, tablet, dan laptop melalui Chrome dan Safari.

## Keputusan
Kami menggunakan PWA dengan manifest dan service worker untuk menyediakan installable experience.

## Alternatif yang ditolak
- Native app: memerlukan rilis App Store / Play Store.
- Backend server penuh: lebih kompleks dan tidak diperlukan untuk MVP.

## Konsekuensi
- + Bisa diinstal pada perangkat target (Android/iOS/laptop).
- + Cache offline untuk cangkang aplikasi, modul, dan kurikulum.
- + Tanpa proses build dan tanpa dependensi pihak ketiga saat berjalan.
- - Batasan storage di browser dan tidak tersinkronisasi antar perangkat.

## Catatan implementasi (ditambahkan setelah evaluasi)

`sw.js` diletakkan di **akar proyek**, bukan di `public/`. Cakupan service
worker dibatasi oleh direktori tempat berkasnya berada; bila diletakkan di
`public/`, permintaan ke `/src/**` tidak akan pernah dicegat sehingga modul
aplikasi tidak bisa di-cache dan mode offline gagal.

Sebaliknya berkas kurikulum sengaja dipindahkan ke `public/data/curriculum/`
supaya berada di dalam cakupan tersebut bersama cangkang aplikasi.
