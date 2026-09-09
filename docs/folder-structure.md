# 📁 Struktur Folder & Penjelasan Setiap File

Dokumentasi ini menjelaskan rincian kegunaan setiap folder dan file pada project `gym-analytics-backend`.

---

## 1. Struktur Root Directory

```text
gym-analytics-backend/
├── .env.example              # Template variabel environment
├── .gitignore                # Daftar file/folder yang diabaikan Git
├── .prettierrc               # Konfigurasi code formatting Prettier
├── docker-compose.yml        # Konfigurasi container PostgreSQL lokal
├── docs/                     # Dokumentasi arsitektur, panduan, dan workflow
├── eslint.config.mjs         # Konfigurasi linting ESLint
├── nest-cli.json             # Konfigurasi NestJS CLI build
├── package.json              # Daftar dependencies & scripts NPM/pnpm
├── pnpm-lock.yaml            # Lockfile versi dependencies
├── prisma.config.ts          # Konfigurasi Prisma CLI
├── prisma/                   # Folder schema & migrasi database
├── src/                      # Source code utama aplikasi
├── test/                     # Konfigurasi pengujian E2E (End-to-End)
├── tsconfig.json             # Konfigurasi compiler TypeScript
└── tsconfig.build.json       # Konfigurasi build production TypeScript
```

---

## 2. Folder `prisma/` (Database Layer)

- **`prisma/schema.prisma`**: Single source of truth untuk definisi model database, enum, relasi, dan mapping multi-schema PostgreSQL.
- **`prisma/migrations/`**: Berisi riwayat file SQL migrasi yang digenerate oleh `prisma migrate dev`.
  - `migration_lock.toml`: Lockfile internal Prisma untuk mendeteksi status migrasi.

---

## 3. Folder `src/` (Source Code Aplikasi)

### 📂 `src/common/` (Shared Cross-Cutting Concerns)
Folder untuk modul utilitas global yang digunakan di berbagai layer:
- **`decorators/`**:
  - `current-user.decorator.ts`: Decorator `@CurrentUser()` untuk mengekstrak data user terautentikasi dari request.
- **`errors/`**:
  - `http-exception.filter.ts`: Filter global untuk menyeragamkan format response error JSON (`{ success: false, message, code, errors: [] }`).
- **`guards/`**:
  - `jwt-auth.guard.ts`: Guard untuk memvalidasi Bearer JWT Access Token pada endpoint yang diproteksi.
- **`interceptors/`**:
  - `response-transform.interceptor.ts`: Interceptor untuk membungkus response sukses (`{ success: true, data, message }`).
- **`config/`, `pipes/`, `utils/`**: Placeholder helper dan konfigurasi pendukung.

---

### 📂 `src/domain/` (Pure Domain Layer)
Layer murni TypeScript yang tidak terikat framework NestJS atau database:
- **`entities/`**:
  - `user.entity.ts`: Representasi domain entity User.
  - `otp-token.entity.ts`: Representasi domain entity OTP Token.
- **`enums/`**:
  - `user-role.enum.ts`: Enum peran user (`USER`, `ADMIN`).
  - `otp-type.enum.ts`: Enum jenis OTP (`EMAIL_VERIFICATION`, `PASSWORD_RESET`).
- **`repositories/`**:
  - `user.repository.interface.ts`: Kontrak method data access User (`IUserRepository`) & Injection Token (`USER_REPOSITORY`).
  - `otp-token.repository.interface.ts`: Kontrak data access OTP (`IOtpTokenRepository`) & Injection Token (`OTP_TOKEN_REPOSITORY`).
- **`calculators/`**: (Tempat fungsi perhitungan murni seperti BMR, TDEE, 1RM, Volume training).

---

### 📂 `src/application/` (Use-Case & Business Logic Layer)
Mengatur orkestrasi alur bisnis dan aturan aplikasi menggunakan **Clean Architecture Use-Case Pattern** (`1 Use-Case = 1 File`):
- **`application/auth/`**:
  - `register.use-case.ts` & `.spec.ts`: Use-case registrasi akun baru.
  - `verify-email.use-case.ts` & `.spec.ts`: Use-case verifikasi OTP email.
  - `resend-otp.use-case.ts` & `.spec.ts`: Use-case kirim ulang kode OTP.
  - `login.use-case.ts` & `.spec.ts`: Use-case autentikasi & penerbitan JWT.
  - `otp.service.ts` & `.spec.ts`: Sub-service pengelola siklus token OTP (generate, attempt limit, expire, invalidation).
  - `index.ts`: Barrel export seluruh use case & provider array `AUTH_USE_CASES`.


---

### 📂 `src/infrastructure/` (Adapters & External Integrations)
Implementasi teknis dari domain repository dan integrasi pihak ketiga:
- **`infrastructure/database/prisma/`**:
  - `prisma.service.ts`: Service koneksi lifecycle Prisma Client ke PostgreSQL.
  - `prisma.module.ts`: NestJS module global untuk `PrismaService`.
- **`infrastructure/database/repositories/`**:
  - `prisma-user.repository.ts`: Adapter implementasi `IUserRepository` menggunakan Prisma query.
  - `prisma-otp-token.repository.ts`: Adapter implementasi `IOtpTokenRepository` menggunakan Prisma query.
- **`infrastructure/mail/`**:
  - `mail.service.ts`: Pengiriman email transaksional OTP via Nodemailer SMTP.
  - `mail.module.ts`: NestJS module untuk mail service.

---

### 📂 `src/modules/` (HTTP Delivery Layer)
Berisi Controller NestJS, skema validasi Zod, dan routing:
- **`modules/auth/`**:
  - `auth.controller.ts`: Endpoint REST API (`/auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/resend-otp`) dengan dekorator Swagger.
  - `auth.controller.spec.ts`: Unit test untuk HTTP controller.
  - `auth.module.ts`: Dependency injection module yang menghubungkan Service, Controller, Repositories, dan `JwtModule`.
  - **`schemas/`**:
    - `register.schema.ts`: Skema validasi Zod & DTO registrasi user.
    - `login.schema.ts`: Skema validasi Zod & DTO login user.
    - `verify-email.schema.ts`: Skema validasi Zod & DTO verifikasi OTP.
    - `resend-otp.schema.ts`: Skema validasi Zod & DTO kirim ulang OTP.
    - `index.ts`: Barrel export seluruh skema.

---

### 📄 File Entry Point
- **`src/app.module.ts`**: Root module NestJS yang mengimpor seluruh modul fitur dan konfigurasi environment global.
- **`src/main.ts`**: Bootstrap server NestJS, inisialisasi Swagger UI (`/api/docs`), Global Exception Filter, dan Global Interceptor.
