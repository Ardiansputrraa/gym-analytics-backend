# 📚 Dokumentasi Teknis Backend — Gym Analytics

Selamat datang di pusat dokumentasi resmi backend **Gym Analytics & Body Progress Platform**.

Dokumentasi ini disusun untuk mempermudah developer dan AI agents memahami arsitektur, workflow development, pengelolaan database, dan navigasi codebase.

---

## 📑 Daftar Isi Dokumentasi

1. [**🚀 Cara Menjalankan & Setup Environment (Getting Started)**](./getting-started.md)
   - Prasyarat sistem (Node.js, pnpm, Docker)
   - Konfigurasi `.env`
   - Menjalankan PostgreSQL via Docker
   - Menjalankan server development & production
   - Menjalankan Automated Testing

2. [**🗄️ Database & Perintah Prisma (Prisma Guide)**](./database-and-prisma.md)
   - Arsitektur Multi-Schema PostgreSQL (`auth`, `profile`, `workout`, dll.)
   - Cheatsheet perintah Prisma (`migrate dev`, `generate`, `studio`)
   - Aturan baku migrasi database (Strict Migrations)

3. [**🏛️ Arsitektur & Alur (Flow) Menulis Kode Fitur Baru**](./architecture-and-code-flow.md)
   - Prinsip Clean Architecture Lite (DDD-lite)
   - Aturan isolasi antar layer
   - Step-by-step alur menulis kode dari folder ke folder saat membuat fitur baru

4. [**📁 Struktur Folder & Penjelasan Setiap File**](./folder-structure.md)
   - Rincian kegunaan setiap folder (`src/domain`, `src/application`, `src/infrastructure`, `src/modules`, `src/common`)
   - Penjelasan file-file konfigurasi root

---

## 🛠️ Stack Teknologi Utama

| Komponen | Teknologi / Library |
| :--- | :--- |
| **Framework** | [NestJS v11](https://nestjs.com/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database & ORM** | [PostgreSQL 16](https://www.postgresql.org/) + [Prisma ORM v7](https://www.prisma.io/) |
| **Validation** | [Zod](https://zod.dev/) + [nestjs-zod](https://github.com/risen228/nestjs-zod) |
| **API Documentation** | [Swagger / OpenAPI 3.0](https://swagger.io/) (URL: `/api/docs`) |
| **Authentication** | [JWT (@nestjs/jwt)](https://jwt.io/) + [Argon2](https://github.com/ranisalt/node-argon2) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP Gmail) |
| **Testing** | [Jest](https://jestjs.io/) |
| **Package Manager** | [pnpm](https://pnpm.io/) |
