# Bendungan Sengkaling — Smart Dam Intelligence

Dashboard **decision-support** untuk rancangan **Bendungan Sengkaling** (Desa Tengah, Kec. Utan, Kab. Sumbawa, NTB) — data teknis dari proposal LRBN SENGKALING-64: FEWS, DEWS, ADAS/IoT (simulasi), ML baseline, workflow operator, dan audit log.

> **Penting:** Tidak ada koneksi ke aktuator bendungan nyata. Data default adalah **SIMULASI** hingga sensor/MQTT/API terhubung.

## Menjalankan aplikasi

```sh
npm i
npm run generate:gallery   # gambar galeri + hero (membutuhkan sharp, terpasang via npm i)
npm run dev
```

Buka `http://localhost:5173` (atau port yang ditampilkan Vite).

## Halaman utama

| Rute | Fungsi |
|------|--------|
| `/` | Landing & pratinjau status simulasi |
| `/dam-profile` | Profil teknis rencana |
| `/early-warning` | Konsep FEWS & DEWS |
| `/gallery` | Galeri 15 ilustrasi rancangan (JPG) |
| `/dashboard` | Pusat operasi (FEWS/DEWS, sensor, ML, operator, histori) |

## Uji skenario FEWS/DEWS

Di **Dashboard → Konfigurasi**, pilih skenario simulasi (normal, banjir, kekeringan, sensor terputus, anomali struktur, dll.).

Jalankan tes otomatis:

```sh
npm test
```

File `src/test/rule-engine-scenarios.test.ts` mencakup 10 skenario operasi wajib.

## Konfigurasi ambang operasi

Edit `src/lib/dam-config.ts` setelah validasi SOP:

- LWL +101 m, FEWS evaluasi +113 m, NWL +119 m, HWL +123 m (dari proposal desain)
- Margin dH/dt dan jarak ke NWL/LWL dapat disesuaikan

## Integrasi nyata (nanti)

| Lapisan | File |
|---------|------|
| Telemetri IoT/API | `src/lib/telemetry.ts` — ganti `simulatedSource` |
| ML terlatih | `src/lib/ml-engine.ts` — ganti baseline |
| Notifikasi eksternal | konfigurasi terpisah (email/SMS) — belum diaktifkan |

## Tim

SENGKALING-64 · Universitas Brawijaya · LRBN 2026
