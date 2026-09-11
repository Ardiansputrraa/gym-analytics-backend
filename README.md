# Gym Analytics — Backend Service

> **NestJS 11 + TypeScript (Strict) + Prisma 7 + PostgreSQL (Multi-Schema)**
> Production-grade Backend API for the **Gym Analytics & Body Progress Platform** MVP following **Clean Architecture Lite (DDD-Lite)**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture & Layer Boundaries](#architecture--layer-boundaries)
- [Database Schemas](#database-schemas)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [API Endpoints & Swagger](#api-endpoints--swagger)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Production Docker Deployment](#production-docker-deployment)

---

## Overview

The backend service powers the Gym Analytics platform with deterministic, mathematical calculation engines (BMR, TDEE, Calorie Targets, Workout Volume, 1RM, PR detection, and Rule-based Insights).

**Core Product Concept:** `Track → Calculate → Analyze → Visualize → Improve`

---

## Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | NestJS 11 | Modular monolith backend architecture |
| **Language** | TypeScript 5.7+ | Strict typing mode, zero `any` |
| **Database ORM** | Prisma 7.10 | Multi-schema PostgreSQL ORM with migrations |
| **Database** | PostgreSQL 16 (Supabase) | Multi-schema relational database |
| **Validation** | Zod + nestjs-zod | Schema-first DTO validation |
| **Documentation** | Swagger OpenAPI 3.0 | Auto-generated interactive API docs (`/api/docs`) |
| **Password Hashing**| Argon2id | Memory-hard password hashing algorithm |
| **Email Transport** | Nodemailer (SMTP) | Transactional OTP emails |
| **Container** | Docker (Multi-stage) | Lean production image optimized for Render |
| **Package Manager**| pnpm 10+ | Fast, deterministic dependency resolution |

---

## Architecture & Layer Boundaries

The backend implements **Clean Architecture Lite (DDD-lite)** with isolated layers and strict dependency flow:

```text
HTTP Request (Client)
      ↓
Modules Layer (Controllers & Schemas)
      ↓
Application Layer (Use-Cases: 1 Use-Case = 1 File)
      ↓
Domain Layer (Pure Entities, Enums, Calculators, Repository Interfaces)
      ↓
Infrastructure Layer (Prisma Repositories, Mailer, External Adapters)
      ↓
PostgreSQL Database (Supabase)
```

1. **Domain Layer (`src/domain/`)**: Pure TypeScript logic (Mifflin-St Jeor BMR, TDEE, Calorie Target, Macro distribution). **Zero dependencies on NestJS or Prisma**.
2. **Application Layer (`src/application/`)**: Encapsulates business actions as individual Use-Case classes (e.g. `RegisterUseCase`, `UpsertProfileUseCase`, `GetDailyCalorieTargetUseCase`) with co-located unit tests (`*.spec.ts`).
3. **Infrastructure Layer (`src/infrastructure/`)**: Prisma database repositories implementing domain interfaces and converting records to domain entities.
4. **Modules Layer (`src/modules/`)**: REST controllers, route mapping, Zod DTOs, and Swagger OpenAPI decorators.

---

## Database Schemas

The PostgreSQL database uses dedicated schemas to namespace domain tables:

| Schema | Tables / Enums | Deskripsi |
| :--- | :--- | :--- |
| **`identity`** | `users`, `otp_tokens`, `OtpType` | Akun pengguna, otentikasi, dan siklus hidup kode OTP. |
| **`profile`** | `user_profiles`, `Gender`, `ActivityLevel`, `FitnessGoal`, `DietPace` | Profil biometrik, preferensi diet (*Santai/Standar/Ekstrem*), dan reminder 30 hari. |
| **`calorie`** | `daily_calorie_targets` | Snapshot harian target kalori, BMR, TDEE, dan pembagian makronutrisi. |
| **`exercise`** | `muscle_groups`, `exercises`, `exercise_secondary_muscles` | Katalog master gerakan & otot. |
| **`workout`** | `workouts`, `workout_exercises`, `workout_sets`, `workout_transitions` | Sesi latihan, set beban/reps, dan durasi istirahat. |
| **`body`** | `body_measurements` | Catatan komposisi tubuh (berat, Body Fat %, Skeletal Muscle). |
| **`nutrition`** | `nutrition_entries` | Log harian konsumsi makanan & minuman. |
| **`analytics`** | `personal_records`, `insights` | Personal Records (PR) dan insight deterministik. |

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20.x
- [pnpm](https://pnpm.io/) >= 9.x
- [PostgreSQL](https://www.postgresql.org/) 16 or [Supabase](https://supabase.com/)

---

## Environment Variables

Salin `.env.example` menjadi `.env` dan lengkapi nilai konfigurasi:

```env
# Application
PORT=3000
NODE_ENV=development

# Database (PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="3h"

# OTP Settings
OTP_EXPIRES_MINUTES=5
OTP_MAX_ATTEMPTS=5

# SMTP Email (Gmail / Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD="your-google-app-password"
SMTP_FROM="Gym Analytics <your-email@gmail.com>"
```

---

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Generate Prisma Client
pnpm prisma generate

# 3. Jalankan migrasi database
pnpm prisma migrate dev

# 4. Jalankan Development Server
pnpm run start:dev
```

- **API Base URL**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

---

## API Endpoints & Swagger

### 1. Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` ➔ Registrasi akun baru & kirim OTP email
- `POST /api/v1/auth/login` ➔ Login akun & peroleh JWT Access Token
- `POST /api/v1/auth/verify-email` ➔ Verifikasi akun dengan OTP 6 digit
- `POST /api/v1/auth/resend-otp` ➔ Kirim ulang OTP (verifikasi / reset password)
- `POST /api/v1/auth/forgot-password` ➔ Request kode OTP reset password
- `POST /api/v1/auth/reset-password` ➔ Reset password dengan OTP dan hash Argon2

### 2. User Profile (`/api/v1/profile`) — `[Bearer JWT Required]`
- `GET /api/v1/profile/me` ➔ Profil fisik user & status pengingat evaluasi 30 hari
- `PUT /api/v1/profile/me` ➔ Buat / perbarui data profil fisik & auto-refresh target kalori

### 3. Calorie Engine (`/api/v1/calorie`) — `[Bearer JWT Required]`
- `GET /api/v1/calorie/target/today` ➔ Snapshot target kalori & makronutrisi aktif hari ini
- `POST /api/v1/calorie/preview` ➔ Simulator instan kalkulasi BMR, TDEE, dan Makro

---

## Testing & Quality Assurance

```bash
# Menjalankan seluruh test suite unit tests (Jest)
pnpm test

# Menjalankan test dalam mode watch
pnpm test:watch

# Menjalankan linter & auto-fix (ESLint)
pnpm run lint

# Membangun bundle produksi (TypeScript build)
pnpm run build
```

---

## Production Docker Deployment

Aplikasi siap di-deploy ke **Render** atau cloud hosting lainnya menggunakan `Dockerfile`:

```bash
# Build Docker Image
docker build -t gym-analytics-backend .

# Run Docker Container
docker run -p 3000:3000 --env-file .env gym-analytics-backend
```

---

## License

Private Repository — Hak Cipta Terpelihara &copy; 2026 Gym Analytics Platform.
