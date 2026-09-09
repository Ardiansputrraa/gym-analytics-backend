# 🚀 Getting Started & Cara Menjalankan Project

Panduan lengkap untuk mengatur environment, menjalankan database lokal dengan Docker, dan menjalankan server backend `gym-analytics-backend`.

---

## 1. Prasyarat Sistem (Prerequisites)

Pastikan sistem Anda sudah terinstal tools berikut:
- **Node.js**: Versi `>= 20.x` (LTS direkomendasikan)
- **pnpm**: Versi `>= 9.x` atau `11.x` (`npm install -g pnpm`)
- **Docker & Docker Compose**: Untuk menjalankan database PostgreSQL lokal
- **Git**: Untuk version control

---

## 2. Setup Environment Variables (`.env`)

Salin file `.env.example` menjadi `.env`:

```powershell
cp .env.example .env
```

Pastikan variabel environment di `.env` sudah terisi dengan benar:

```env
# Application
PORT=3000
NODE_ENV=development

# Database (PostgreSQL)
POSTGRES_PASSWORD=postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:55432/gym_analytics?schema=auth"

# JWT Authentication
JWT_SECRET=super-secret-jwt-key-change-in-production-gym-analytics-2026
JWT_EXPIRES_IN=15m

# OTP (One-Time Password)
OTP_EXPIRES_MINUTES=5
OTP_MAX_ATTEMPTS=5

# SMTP Gmail (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-from-google
SMTP_FROM="Gym Analytics <no-reply@gym-analytics.com>"
```

> [!TIP]
> Untuk password Gmail SMTP, gunakan **Google App Password** (bukan password akun biasa) yang dibuat melalui [Google Account Security](https://myaccount.google.com/apppasswords).

---

## 3. Menjalankan Database PostgreSQL (Docker)

Jalankan container PostgreSQL menggunakan Docker Compose:

```powershell
# Menjalankan container di background
docker compose up -d

# Memeriksa status container
docker compose ps
```

Container akan berjalan pada port **`55432`** (agar tidak bentrok dengan PostgreSQL lokal default port `5432`).

---

## 4. Instalasi Dependency & Generate Prisma Client

Jalankan perintah berikut di root folder `gym-analytics-backend`:

```powershell
# 1. Install dependencies
pnpm install

# 2. Sinkronisasi migrasi ke database & generate Prisma Client
pnpm prisma migrate dev

# 3. Generate Prisma Client secara manual (jika diperlukan)
pnpm prisma generate
```

---

## 5. Menjalankan Server Backend

Tersedia beberapa script untuk menjalankan aplikasi:

```powershell
# Menjalankan server dalam mode Development (Hot-Reload / Auto-Restart)
pnpm run start:dev

# Menjalankan server dalam mode Debug
pnpm run start:debug

# Build project untuk Production
pnpm run build

# Menjalankan hasil build Production
pnpm run start:prod
```

Setelah server aktif, akses:
- **API Base URL**: `http://localhost:3000/api/v1`
- **Swagger OpenAPI Docs (Interaktif)**: `http://localhost:3000/api/docs`

---

## 6. Menjalankan Automated Testing

Semua pengujian unit test dan e2e dapat dijalankan dengan perintah berikut:

```powershell
# Menjalankan seluruh unit test
pnpm test

# Menjalankan unit test dalam mode watch (interaktif saat ngoding)
pnpm run test:watch

# Menjalankan unit test dengan laporan coverage
pnpm run test:cov
```
