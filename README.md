# Gym Analytics — Backend

> **NestJS + TypeScript + Prisma + PostgreSQL**
> Backend API for the **Gym Analytics & Body Progress Platform** MVP.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Modules](#modules)
- [Database Schemas](#database-schemas)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Running the Server](#running-the-server)
- [API Base URL](#api-base-url)
- [API Endpoints](#api-endpoints)
- [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Business Rules Reference](#business-rules-reference)

---

## Overview

This is the backend service for the **Gym Analytics & Body Progress Platform**, a web application that helps individual gym users track and analyze:

- Workout sessions, exercises, sets, weight, and reps
- Active time, rest time, transition time, and session duration
- Workout volume, strength progression, and personal records (PR)
- Estimated calories burned (MET-based, deterministic)
- Body composition measurements and progress over time
- Daily food & drink intake and calorie targets (BMR → TDEE → Goal Adjustment)
- Dashboard analytics and deterministic insight engine

**Core principle:** `Track → Calculate → Analyze → Visualize`

All metrics are computed deterministically from raw user data — no AI is used.

---

## Tech Stack

| Layer      | Technology                     |
| ---------- | ------------------------------ |
| Runtime    | Node.js                        |
| Framework  | NestJS 11 + TypeScript (strict)|
| ORM        | Prisma 8                       |
| Database   | PostgreSQL 16                  |
| Validation | Zod + nestjs-zod               |
| Config     | @nestjs/config                 |
| Container  | Docker + Docker Compose        |
| Pkg Mgr    | pnpm                           |

---

## Architecture

```
Modular Monolith
```

```
Client
  ↓
Controller          ← HTTP layer, input validation
  ↓
Service / Use Case  ← Orchestration, business flow
  ↓
Domain Logic        ← Calculation engine (BMR, TDEE, volume, PR, etc.)
  ↓
Repository / Prisma ← Data access
  ↓
PostgreSQL
```

Calculation logic (BMR, TDEE, workout volume, active/rest/transition time, calorie burn estimation) lives in the **domain layer**, not in controllers or repositories.

---

## Modules

| Module                  | Responsibility                                                    |
| ----------------------- | ----------------------------------------------------------------- |
| `AuthModule`            | Register, login, logout, refresh token, password reset            |
| `UsersModule`           | User identity management                                          |
| `ProfilesModule`        | User biometric profile (age, gender, height, weight, goal)        |
| `ExercisesModule`       | Exercise catalogue (predefined, not user-owned)                   |
| `WorkoutsModule`        | Workout sessions, exercises, sets, transitions, timing analytics  |
| `BodyMeasurementsModule`| Body composition entries and progress tracking                    |
| `NutritionModule`       | Food & drink entries, daily calorie intake                        |
| `CaloriesModule`        | Daily calorie target (BMR → TDEE → Goal Adjustment)               |
| `AnalyticsModule`       | Dashboard, historical trends, strength progression                |
| `InsightsModule`        | Deterministic insight engine (no AI)                              |

---

## Database Schemas

The database uses **PostgreSQL schemas** to namespace tables by domain:

| Schema      | Tables                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| `auth`      | `users`                                                                  |
| `profile`   | `user_profiles`                                                          |
| `exercise`  | `muscle_groups`, `exercises`, `exercise_secondary_muscles`               |
| `workout`   | `workouts`, `workout_exercises`, `workout_sets`, `workout_transitions`   |
| `body`      | `body_measurements`                                                      |
| `nutrition` | `nutrition_entries`                                                      |
| `calorie`   | `daily_calorie_targets`                                                  |
| `analytics` | `personal_records`, `insights`                                           |

See [`erd.dbml`](../erd.dbml) in the project root for the full Entity-Relationship Diagram.

---

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 9
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Environment Variables

Add `.env` and fill in the values:

| Variable          | Description                            | Example                         |
| ----------------- | -------------------------------------- | ------------------------------- |
| `DATABASE_URL`    | Prisma PostgreSQL connection string    | See above                       |
| `PORT`            | HTTP port the server listens on        | `3000`                          |
| `NODE_ENV`        | Environment mode                       | `development` / `production`    |
| `POSTGRES_PASSWORD` | Password used by Docker Compose      | Strong password                 |

---

## Getting Started

### 1. Clone & install dependencies

```bash
pnpm install
```

### 2. Start the database

```bash
docker compose up -d
```

PostgreSQL will be available at `localhost:55432`.

Verify the container is running:

```bash
docker compose ps
```

### 3. Run database migrations

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init
```

### 4. Seed exercise data (optional)

```bash
pnpm prisma db seed
```

---

## Running the Server

```bash
# Development (watch mode — auto-restart on file change)
pnpm start:dev

# Development (single run)
pnpm start

# Debug mode
pnpm start:debug

# Production
pnpm start:prod
```

---

## API Base URL

```
http://localhost:3000/api/v1
```

---

## API Endpoints

### Authentication

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
```

### Profile

```
GET    /api/v1/profile
PATCH  /api/v1/profile
```

### Exercises

```
GET    /api/v1/exercises
GET    /api/v1/exercises/:id
```

Query: `?search=&equipment=&muscleGroup=`

### Workouts

```
POST   /api/v1/workouts
GET    /api/v1/workouts
GET    /api/v1/workouts/:id
PATCH  /api/v1/workouts/:id
DELETE /api/v1/workouts/:id
```

### Body Measurements

```
POST   /api/v1/body-measurements
GET    /api/v1/body-measurements
GET    /api/v1/body-measurements/:id
PATCH  /api/v1/body-measurements/:id
DELETE /api/v1/body-measurements/:id
```

### Nutrition

```
POST   /api/v1/nutrition
GET    /api/v1/nutrition
GET    /api/v1/nutrition/:id
PATCH  /api/v1/nutrition/:id
DELETE /api/v1/nutrition/:id
```

Query: `?date=&from=&to=&type=`

### Analytics

```
GET    /api/v1/analytics/dashboard
GET    /api/v1/analytics/body
GET    /api/v1/analytics/workout
GET    /api/v1/analytics/nutrition
GET    /api/v1/analytics/calories
```

### Insights

```
GET    /api/v1/insights
```

Query: `?type=&severity=&date=`

---

## Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `pnpm start:dev`      | Start server in watch mode               |
| `pnpm start:prod`     | Start compiled production server         |
| `pnpm build`          | Compile TypeScript to `dist/`            |
| `pnpm test`           | Run unit tests                           |
| `pnpm test:e2e`       | Run end-to-end tests                     |
| `pnpm test:cov`       | Run tests with coverage report           |
| `pnpm lint`           | Lint & auto-fix with ESLint + Prettier   |
| `pnpm format`         | Format source with Prettier              |
| `pnpm prisma studio`  | Open Prisma Studio (GUI for database)    |
| `pnpm prisma migrate dev` | Run migrations in development        |
| `pnpm prisma generate` | Regenerate Prisma client                |

---

## Project Structure

```
gym-analytics-backend/
├── src/
│   ├── main.ts                   # App entry point
│   ├── app.module.ts             # Root module
│   │
│   ├── auth/                     # AuthModule — register, login, JWT
│   ├── users/                    # UsersModule — user identity
│   ├── profiles/                 # ProfilesModule — biometric profile
│   ├── exercises/                # ExercisesModule — exercise catalogue
│   ├── workouts/                 # WorkoutsModule — session, set, timing
│   ├── body-measurements/        # BodyMeasurementsModule — composition
│   ├── nutrition/                # NutritionModule — food & drink
│   ├── calories/                 # CaloriesModule — BMR/TDEE/target
│   ├── analytics/                # AnalyticsModule — dashboard, trends
│   ├── insights/                 # InsightsModule — deterministic rules
│   │
│   └── common/
│       ├── enums/                # Shared enums (gender, goal, status…)
│       ├── filters/              # Global exception filters
│       ├── guards/               # Auth guards (JWT)
│       ├── interceptors/         # Response transform interceptor
│       └── pipes/                # Validation pipes
│
├── prisma/
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Migration history
│   └── seed.ts                   # Seed data (muscle groups, exercises)
│
├── test/                         # E2E tests
├── docker-compose.yml            # PostgreSQL container
├── .env                          # Local environment variables (git-ignored)
├── .env.example                  # Environment variable template
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## Business Rules Reference

Key business rules from the PRD implemented in the calculation engine:

| Rule   | Formula / Rule                                              |
| ------ | ----------------------------------------------------------- |
| BR-002 | `volume = weight_kg × reps`                                 |
| BR-003 | `Active Time = Σ set.duration_seconds`                      |
| BR-004 | `Rest Time = Σ set.rest_seconds`                            |
| BR-005 | `Transition Time = Σ workout_transition.duration_seconds`   |
| BR-006 | `Session Duration = completed_at - started_at`              |
| BR-007 | `Tracked Time = Active + Rest + Transition`                 |
| BR-008 | `Idle Time = Session Duration - Tracked Time` (min 0)       |
| BR-009 | `Active Ratio = Active Time / Session Duration × 100`       |
| BR-010 | `Daily Calories = Σ food.calories + Σ drink.calories`       |
| BR-011 | BMR via **Mifflin-St Jeor** formula                         |
| BR-012 | `TDEE = BMR × Activity Factor`                              |
| BR-013 | `Daily Target = TDEE + Goal Adjustment` (configurable)      |
| BR-015 | Body progress = comparison between consecutive measurements |
| BR-017 | CANCELLED workouts excluded from analytics                  |
| BR-018 | Derived analytics always recalculated from raw data         |
| BR-020 | Food calories come from manual user input (no food database)|

> All estimated calorie burn values use the **MET-based formula**:
> `Calories = MET × body_weight_kg × duration_hours`
> and must be labeled **"Estimated"** — never "Actual".

---

*Aligned with [`prd.md`](../prd.md) v1.0 and [`erd.dbml`](../erd.dbml) v2.0*
