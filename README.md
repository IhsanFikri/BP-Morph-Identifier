# 🐍 Ball Python Morph Identifier v1.0.0

<div align="center">

![Ball Python Morph Identifier](https://img.shields.io/badge/Ball_Python-Morph_Identifier-d4a84b?style=for-the-badge&logo=python&logoColor=white)
![AI Powered](https://img.shields.io/badge/AI-EfficientNet_V2--L-34d399?style=for-the-badge)
![License](https://img.shields.io/badge/License-CC_BY--NC--ND_4.0-blue?style=for-the-badge)

**Identifikasi morph ball python Anda secara otomatis menggunakan AI.**

Upload foto ball python, dan aplikasi akan menganalisis gambar untuk mengenali pola warna dan morph ular Anda — dengan tingkat akurasi tinggi menggunakan model deep learning.

[Demo Langsung](https://huggingface.co/spaces/samfhy/ball-python-morph-identifier) · [Laporkan Bug](https://github.com/issues) · [Request Fitur](https://github.com/issues)

</div>

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🧠 **AI-Powered** | Model EfficientNet V2-L yang dilatih dengan ribuan gambar ball python |
| 🏷️ **37 Morph** | Mengenali 37 jenis morph termasuk Pastel, Banana, Piebald, Clown, dll |
| 🎯 **Multi-Label** | Bisa mendeteksi beberapa morph sekaligus dalam satu gambar |
| 📊 **Confidence Score** | Menampilkan persentase keyakinan untuk setiap morph yang terdeteksi |
| 🖼️ **Drag & Drop** | Upload gambar dengan drag & drop, paste dari clipboard, atau pilih file |
| 🌙 **Dark Theme** | UI premium dengan dark mode, glassmorphism, dan animasi halus |
| 🔌 **Auto-Connect** | Otomatis terhubung ke HuggingFace Space API |
| 🐳 **Docker Ready** | Siap di-deploy ke container Docker |

## 📸 Screenshot

### Halaman Utama
Tampilan utama dengan area upload dan panel hasil prediksi.

### Hasil Identifikasi
Setelah upload gambar, AI menampilkan morph yang terdeteksi beserta confidence score.

---

## 🚀 Quick Start

### Opsi 1: Buka Langsung di Browser

Cukup buka file `index.html` langsung di browser — tidak perlu install apapun!

```
📂 BP-Morph-Identifier/
   └── index.html  ← Klik dua kali untuk membuka
```

> **Catatan:** Beberapa browser mungkin memblokir request API saat dibuka via `file://`. Gunakan Opsi 2 jika mengalami masalah.

### Opsi 2: Local Development Server

```bash
# Menggunakan npx (Node.js diperlukan)
npx serve .

# Atau menggunakan Python
python -m http.server 3000

# Atau menggunakan PHP
php -S localhost:3000
```

Buka **http://localhost:3000** di browser.

### Opsi 3: Docker (Recommended untuk Production)

```bash
# Build & jalankan dengan satu perintah
docker compose up -d

# Aplikasi berjalan di http://localhost:8080
```

Lihat bagian [Deploy dengan Docker](#-deploy-dengan-docker) untuk detail lebih lanjut.

---

## 📖 Cara Menggunakan

### 1. Upload Gambar

Anda bisa upload gambar ball python dengan 3 cara:
- **Drag & Drop** — Seret gambar ke area upload
- **Klik "pilih file"** — Pilih dari file manager
- **Paste (Ctrl+V)** — Paste gambar dari clipboard

Format yang didukung: **JPG, PNG, WEBP** (maks 20MB)

### 2. Identifikasi Morph

Klik tombol **"Identifikasi Morph"** untuk memulai analisis. AI akan memproses gambar dan menampilkan hasilnya dalam beberapa detik.

### 3. Lihat Hasil

Hasil ditampilkan berupa kartu morph dengan:
- **Nama morph** yang terdeteksi
- **Confidence score** (persentase keyakinan)
- **Progress bar** berwarna (hijau = tinggi, kuning = sedang, merah = rendah)

### 4. Coba Contoh

Klik salah satu thumbnail di bagian **"Contoh Morph"** untuk mencoba dengan gambar contoh yang sudah disediakan.

---

## 🔑 Pengaturan API (Opsional)

### Kapan Perlu API Token?

| Situasi | Token Diperlukan? |
|---------|-------------------|
| Space public (default) | ❌ Tidak perlu |
| Space private / gated | ✅ Wajib |
| Rate limit lebih tinggi | ✅ Disarankan |

### Cara Memasukkan Token

1. Dapatkan token di [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Klik ikon ⚙️ (gear) di navbar
3. Paste token di field **"HuggingFace API Token"**
4. Klik **"Simpan & Reconnect"**

> **Keamanan:** Token hanya disimpan di `localStorage` browser Anda. Tidak dikirim ke server manapun selain HuggingFace.

### Status Koneksi

Lihat indikator di navbar:
- 🟢 **AI Model Active** — Terhubung dan siap digunakan
- 🟡 **Connecting...** — Sedang menghubungkan
- 🔴 **Offline (Demo)** — Tidak terhubung, menampilkan data contoh

---

## 🐳 Deploy dengan Docker

### Prasyarat

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall dan running

### Docker Compose (Recommended)

```bash
# Clone atau download project
cd BP-Morph-Identifier

# Build dan jalankan
docker compose up -d

# Cek status
docker compose ps

# Lihat logs
docker compose logs -f

# Stop
docker compose down
```

Aplikasi berjalan di **http://localhost:8080**

### Docker Manual

```bash
# Build image
docker build -t bp-morph-identifier .

# Jalankan container
docker run -d \
  --name bp-morph \
  -p 8080:80 \
  --restart unless-stopped \
  bp-morph-identifier

# Cek status
docker ps

# Stop & hapus
docker stop bp-morph && docker rm bp-morph
```

### Ganti Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "3000:80"  # Ganti 3000 dengan port yang diinginkan
```

Atau saat docker run:
```bash
docker run -d -p 3000:80 bp-morph-identifier
```

### Health Check

```bash
curl http://localhost:8080/health
# Response: {"status":"ok"}
```

---

## 🏗️ Struktur Project

```
BP-Morph-Identifier/
├── index.html           # Halaman utama (HTML)
├── style.css            # Styling & design system (CSS)
├── app.js               # Logic aplikasi & API integration (JS)
├── Dockerfile           # Container image (Nginx Alpine)
├── docker-compose.yml   # Docker orchestration
├── nginx.conf           # Konfigurasi Nginx (gzip, cache, security)
├── .dockerignore        # File yang diabaikan saat Docker build
└── README.md            # Dokumentasi (file ini)
```

---

## 🧬 Daftar Morph yang Didukung

Aplikasi ini dapat mengenali **37 morph** ball python:

<details>
<summary>Klik untuk melihat daftar lengkap</summary>

| # | Morph | # | Morph |
|---|-------|---|-------|
| 1 | Albino | 20 | Hurricane |
| 2 | Asphalt | 21 | Hypo |
| 3 | Axanthic (VPI) | 22 | Lavender Albino |
| 4 | Banana | 23 | Leopard |
| 5 | Black Head | 24 | Lesser |
| 6 | Black Pastel | 25 | Mahogany |
| 7 | Butter | 26 | Mojave |
| 8 | Calico | 27 | Normal |
| 9 | Chocolate | 28 | Orange Dream |
| 10 | Cinnamon | 29 | Pastel |
| 11 | Clown | 30 | Piebald |
| 12 | Cypress | 31 | Pinstripe |
| 13 | Desert Ghost | 32 | Red Stripe |
| 14 | Enchi | 33 | Spider |
| 15 | Fire | 34 | Spotnose |
| 16 | GHI | 35 | Stranger |
| 17 | Gravel | 36 | Super Pastel |
| 18 | | 37 | Ultramel |
| 19 | | | Vanilla / Yellow Belly |

</details>

---

## ⚙️ Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| **Design** | Custom CSS Design System, Glassmorphism, CSS Animations |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) (UI), [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) (Code) |
| **API Client** | [@gradio/client](https://www.npmjs.com/package/@gradio/client) via CDN |
| **AI Model** | EfficientNet V2-L (PyTorch) |
| **Backend** | [HuggingFace Spaces](https://huggingface.co/spaces/samfhy/ball-python-morph-identifier) (Gradio) |
| **Container** | Docker + Nginx Alpine |

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Status menunjukkan "Offline" | HF Space mungkin sedang sleep. Buka [Space langsung](https://huggingface.co/spaces/samfhy/ball-python-morph-identifier) untuk membangunkannya |
| CORS error di console | Jangan buka via `file://`. Gunakan local server atau Docker |
| Gambar tidak bisa di-upload | Pastikan format JPG/PNG/WEBP dan ukuran < 20MB |
| Docker build gagal | Pastikan Docker Desktop sedang running |
| Port 8080 sudah dipakai | Ganti port di `docker-compose.yml` |
| Token ditolak | Pastikan token dimulai dengan `hf_` dan masih valid |
| Hasil tidak akurat | Pastikan foto jelas, pencahayaan baik, dan ular terlihat jelas |

---

## 🙏 Kredit

- **AI Model** oleh [samfhy](https://huggingface.co/samfhy) — Model EfficientNet V2-L dilatih dengan dataset dari MorphMarket
- **HuggingFace Spaces** — Platform hosting untuk model AI
- **Gradio** — Framework untuk API model machine learning

---

## 📄 Lisensi

Project ini mengikuti lisensi dari model asli: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)

- ✅ Boleh digunakan untuk keperluan non-komersial
- ✅ Boleh di-share dengan memberikan kredit
- ❌ Tidak boleh dimodifikasi untuk distribusi komersial
- ❌ Tidak boleh digunakan untuk tujuan komersial
