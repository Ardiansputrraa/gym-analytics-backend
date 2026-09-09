# 🏛️ Arsitektur & Alur (Flow) Menulis Kode Fitur Baru

Project `gym-analytics-backend` menerapkan **Clean Architecture Lite (DDD-lite)** yang memisahkan kode menjadi lapisan-lapisan (*layers*) independen. 

Dokumentasi ini memandu Anda **langkah demi langkah dari folder mana ke mana** saat membuat fitur baru.

---

## 1. Prinsip Batasan Layer (Layer Boundary Rules)

```
[ HTTP REQUEST ]
       │
       ▼
┌───────────────────────────────────────────────────────────┐
│ 1. Modules Layer (src/modules/<feature>/)                │
│    • Zod Request/Response Schemas (DTO)                   │
│    • NestJS Controller + Swagger OpenAPI Docs             │
│    • NestJS Module DI Configuration                       │
└─────────────────────────────┬─────────────────────────────┘
                              │
                              ▼
┌───────────────────────────────────────────────────────────┐
│ 2. Application Layer (src/application/<feature>/)         │
│    • Use Case Orchestration (Service)                     │
│    • Business logic, exception throwing (400, 401, 403)   │
│    • Unit Tests (*.spec.ts)                               │
└──────────────┬─────────────────────────────┬──────────────┘
               │                             │
               ▼                             ▼
┌──────────────────────────────┐ ┌──────────────────────────┐
│ 3. Domain Layer (src/domain) │ │ 4. Infrastructure Layer  │
│    • Pure TS Entities        │ │    (src/infrastructure/) │
│    • Repository Interfaces   │ │    • Prisma DB Repos     │
│    • Pure Calculators        │ │    • Mail / External API │
└──────────────────────────────┘ └──────────────────────────┘
```

### 🔒 Aturan Kunci:
1. **Domain Layer (`src/domain/`)**: Murni TypeScript. **TIDAK BOLEH** mengimpor `@nestjs/*`, `@prisma/*`, PrismaService, atau pustaka framework apapun.
2. **Application Layer (`src/application/`)**: Mengorkestrasi use-case. Menyuntikkan repository melalui interface (`@Inject(TOKEN)`), bukan langsung mengimpor Prisma.
3. **Infrastructure Layer (`src/infrastructure/`)**: Tempat implementasi teknis (Prisma ORM, Nodemailer, S3, dll.) yang mengonversi data DB ke `DomainEntity`.
4. **Modules Layer (`src/modules/`)**: Pintu masuk HTTP (Controller, Route, Zod DTO, Swagger).

---

## 2. Alur Menulis Kode Fitur Baru (Step-by-Step Flow)

Ketika Anda ingin membuat fitur baru (contoh: fitur `Exercise` atau `Workout`), ikuti urutan pengerjaan berikut:

---

### 🔹 Langkah 1: Database Model & Migrasi (`prisma/`)
1. Buka file [`prisma/schema.prisma`](file:///c:/Users/ardia/OneDrive/Documents/Project%20Ardian/gym-analytics/gym-analytics-backend/prisma/schema.prisma).
2. Tambahkan model tabel baru dan enum yang dibutuhkan.
3. Jalankan migrasi:
   ```powershell
   pnpm prisma migrate dev --name create_exercise_tables
   ```

---

### 🔹 Langkah 2: Domain Layer (`src/domain/`)
1. **Buat Entity** di `src/domain/entities/<feature>.entity.ts`:
   - Berupa kelas TypeScript murni yang memodelkan data bisnis.
2. **Buat Repository Interface & Injection Token** di `src/domain/repositories/<feature>.repository.interface.ts`:
   - Definisikan `interface I<Feature>Repository` (kontrak method data access).
   - Definisikan symbol injection token: `export const <FEATURE>_REPOSITORY = Symbol('<FEATURE>_REPOSITORY');`.
3. Daftarkan di file index barrel `src/domain/entities/index.ts` dan `src/domain/repositories/index.ts`.

---

### 🔹 Langkah 3: Infrastructure Layer (`src/infrastructure/`)
1. **Buat Repository Adapter** di `src/infrastructure/database/repositories/prisma-<feature>.repository.ts`:
   - Implementasikan interface `I<Feature>Repository`.
   - Inject `PrismaService`.
   - Lakukan mapping dari Prisma Model ke `DomainEntity`.

---

### 🔹 Langkah 4: Zod Schemas & DTO (`src/modules/<feature>/schemas/`)
1. Buat folder `src/modules/<feature>/schemas/`.
2. Buat skema validasi menggunakan Zod (contoh: `create-<feature>.schema.ts`):
   - Gunakan `createZodDto(...)` dari `nestjs-zod` untuk menghasilkan class DTO.
   - Buat skema request dan response DTO.
3. Export seluruh schema melalui `src/modules/<feature>/schemas/index.ts`.

---

### 🔹 Langkah 5: Application Layer (`src/application/<feature>/`) — *Use-Case Pattern*
1. **Buat Use-Case Class** (1 File = 1 Aksi Bisnis) di `src/application/<feature>/<action>.use-case.ts`:
   - Contoh: `create-workout.use-case.ts`, `get-workout-history.use-case.ts`.
   - Gunakan decorator `@Injectable()`.
   - Hanya miliki 1 public method: `async execute(dto: ...): Promise<...>`
   - Inject repository interface: `@Inject(<FEATURE>_REPOSITORY) private readonly repo: I<Feature>Repository`.
   - Tulis logika bisnis dan validasi aturan domain.
2. **Buat Unit Test** di `src/application/<feature>/<action>.use-case.spec.ts`:
   - Buat mock repository dan uji semua skenario sukses maupun gagal untuk use-case tersebut.
3. **Ekspor Seluruh Use-Case di `src/application/<feature>/index.ts`**:
   - Ekspor class use case dan kumpulkan ke dalam array:
     ```typescript
     export const FEATURE_USE_CASES = [CreateWorkoutUseCase, GetWorkoutHistoryUseCase];
     ```

---

### 🔹 Langkah 6: Controller & Module Layer (`src/modules/<feature>/`)
1. **Buat Controller** di `src/modules/<feature>/<feature>.controller.ts`:
   - Gunakan decorator NestJS (`@Controller`, `@Get`, `@Post`, `@Body`, `@Param`).
   - Tambahkan decorator Swagger OpenAPI: `@ApiTags(...)`, `@ApiOperation(...)`, `@ApiResponse(...)`, `@ApiBearerAuth('JWT-auth')`.
   - Inject use-case terkait dan panggil `this.<action>UseCase.execute(dto)`.
2. **Buat Controller Unit Test** di `src/modules/<feature>/<feature>.controller.spec.ts`.
3. **Buat Module** di `src/modules/<feature>/<feature>.module.ts`:
   - Daftarkan `...FEATURE_USE_CASES` dan binding interface repository ke implementasi Prisma:
     ```typescript
     providers: [
       ...FEATURE_USE_CASES,
       {
         provide: FEATURE_REPOSITORY,
         useClass: PrismaFeatureRepository,
       },
     ],
     exports: [...FEATURE_USE_CASES],
     ```


---

### 🔹 Langkah 7: Daftarkan ke Root Module (`src/app.module.ts`)
1. Buka [`src/app.module.ts`](file:///c:/Users/ardia/OneDrive/Documents/Project%20Ardian/gym-analytics/gym-analytics-backend/src/app.module.ts).
2. Tambahkan `<Feature>Module` ke array `imports`.

---

### 🔹 Langkah 8: Verifikasi & Testing
Jalankan perintah verifikasi:
```powershell
# 1. Jalankan unit test
pnpm test

# 2. Pastikan build TypeScript berhasil tanpa error
pnpm build
```
