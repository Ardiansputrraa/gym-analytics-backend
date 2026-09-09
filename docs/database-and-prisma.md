# 🗄️ Panduan Database & Perintah-Perintah Prisma

Dokumentasi ini menjelaskan konfigurasi database PostgreSQL, multi-schema architecture, dan seluruh perintah Prisma ORM beserta aturan baku migrasinya.

---

## 1. Arsitektur Multi-Schema Database

Database project ini menggunakan PostgreSQL dengan pembagian schema domain modular (sesuai `erd.dbml`):

```prisma
datasource db {
  provider = "postgresql"
  schemas  = [
    "auth",
    "profile",
    "exercise",
    "workout",
    "body",
    "nutrition",
    "calorie",
    "analytics"
  ]
}
```

Setiap tabel dan enum di `prisma/schema.prisma` dipetakan ke schema terkait, contohnya:
- `auth.users` dan `auth.otp_tokens` ➔ `@@schema("auth")`
- `workout.workouts` dan `workout.workout_logs` ➔ `@@schema("workout")`
- `exercise.exercises` ➔ `@@schema("exercise")`

---

## 2. Perintah-Perintah Penting Prisma (Cheatsheet)

| Perintah | Deskripsi & Kegunaan |
| :--- | :--- |
| `pnpm prisma migrate dev --name <nama_migrasi>` | **Wajib saat ubah schema.** Membuat file SQL migrasi baru, mengeksekusinya ke DB, dan otomatis me-regenerate Prisma Client. |
| `pnpm prisma generate` | Menghasilkan file TypeScript Client dari `schema.prisma` ke `node_modules/.prisma/client`. |
| `pnpm prisma studio` | Membuka Dashboard Web GUI interaktif di browser (`localhost:5555`) untuk melihat dan mengedit data tabel. |
| `pnpm prisma format` | Merapikan format indentasi dan relasi di `prisma/schema.prisma`. |
| `pnpm prisma migrate status` | Memeriksa apakah ada migrasi yang belum diterapkan atau status database saat ini. |
| `pnpm prisma migrate reset` | **⚠️ Hati-hati.** Menghapus seluruh isi database, menjalankan ulang semua migrasi dari awal (fresh DB), dan menjalankan seed. |

---

## 3. 🚨 Aturan Baku Migrasi Database (Strict Migration Rules)

### ✅ Yang WAJIB Dilakukan saat Menambah/Mengubah Tabel atau Kolom:

1. Edit file `prisma/schema.prisma` (misal menambah model baru, kolom baru, atau index baru).
2. Jalankan perintah:
   ```powershell
   pnpm prisma migrate dev --name <nama_perubahan>
   ```
   *Contoh nama migrasi:*
   ```powershell
   pnpm prisma migrate dev --name add_exercise_tables
   pnpm prisma migrate dev --name add_user_profile_columns
   ```
3. Prisma akan otomatis:
   - Membuat file SQL migrasi di folder `prisma/migrations/<timestamp>_<nama_perubahan>/migration.sql`.
   - Menjalankan file SQL tersebut ke database PostgreSQL lokal.
   - Meng-update file `prisma/migrations/migration_lock.toml`.
   - Meng-update TypeScript type definition pada `@prisma/client`.
4. Commit file `schema.prisma` dan folder `prisma/migrations/` ke Git.

---

### ❌ Yang DILARANG KERAS di Lingkungan Development:

> [!WARNING]
> - **DILARANG menggunakan `prisma db push`**:
>   `prisma db push` langsung mengubah struktur database tanpa membuat file SQL migration. Hal ini membuat perubahan struktur database tidak tercatat di Git dan akan merusak deployment server/staging.
> - **DILARANG menggunakan `prisma migrate deploy` di local development**:
>   `prisma migrate deploy` hanya digunakan di server Production/CI-CD untuk mengeksekusi file migrasi yang sudah ada tanpa mendeteksi perubahan baru pada `schema.prisma`.

---

## 4. Membuka Prisma Studio (Web GUI)

Untuk melihat data user, OTP tokens, atau isi database lainnya melalui visual interface:

```powershell
pnpm prisma studio
```

Buka URL `http://localhost:5555` di browser Anda.
