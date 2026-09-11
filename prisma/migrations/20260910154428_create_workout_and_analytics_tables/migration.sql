-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "workout";

-- CreateEnum
CREATE TYPE "workout"."WorkoutStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "analytics"."RecordType" AS ENUM ('MAX_WEIGHT', 'MAX_REPS', 'MAX_VOLUME');

-- CreateTable
CREATE TABLE "workout"."routine_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL DEFAULT 'STRENGTH',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "routine_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout"."routine_template_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "routine_template_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "target_sets" INTEGER NOT NULL DEFAULT 3,
    "target_reps" INTEGER,
    "target_rest_seconds" INTEGER NOT NULL DEFAULT 90,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "routine_template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout"."workouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "routine_template_id" UUID,
    "name" VARCHAR(255) NOT NULL DEFAULT 'Sesi Latihan Gym',
    "status" "workout"."WorkoutStatus" NOT NULL DEFAULT 'PLANNED',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout"."workout_exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "order_index" SMALLINT NOT NULL,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout"."workout_sets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workout_exercise_id" UUID NOT NULL,
    "order_index" SMALLINT NOT NULL,
    "weight_kg" DECIMAL(6,3) NOT NULL DEFAULT 0,
    "reps" SMALLINT NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "rest_seconds" INTEGER NOT NULL DEFAULT 0,
    "incline_pct" DECIMAL(4,1),
    "speed_kmh" DECIMAL(4,1),
    "distance_km" DECIMAL(6,3),
    "calories_burned" INTEGER,
    "pace_min_per_km" VARCHAR(10),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "rpe" DECIMAL(3,1),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "workout_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."personal_records" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "exercise_id" UUID NOT NULL,
    "workout_set_id" UUID,
    "record_type" "analytics"."RecordType" NOT NULL,
    "value" DECIMAL(8,3) NOT NULL,
    "achieved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "personal_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_rte_template_order" ON "workout"."routine_template_exercises"("routine_template_id", "order_index");

-- CreateIndex
CREATE INDEX "idx_workouts_user_date_status" ON "workout"."workouts"("user_id", "created_at", "status", "is_deleted");

-- CreateIndex
CREATE INDEX "idx_we_workout_order" ON "workout"."workout_exercises"("workout_id", "order_index", "is_deleted");

-- CreateIndex
CREATE INDEX "idx_ws_exercise_order" ON "workout"."workout_sets"("workout_exercise_id", "order_index", "is_deleted");

-- CreateIndex
CREATE INDEX "idx_pr_user_exercise_type" ON "analytics"."personal_records"("user_id", "exercise_id", "record_type", "is_deleted");

-- AddForeignKey
ALTER TABLE "workout"."routine_template_exercises" ADD CONSTRAINT "routine_template_exercises_routine_template_id_fkey" FOREIGN KEY ("routine_template_id") REFERENCES "workout"."routine_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."routine_template_exercises" ADD CONSTRAINT "routine_template_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."workouts" ADD CONSTRAINT "workouts_routine_template_id_fkey" FOREIGN KEY ("routine_template_id") REFERENCES "workout"."routine_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workout"."workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout"."workout_sets" ADD CONSTRAINT "workout_sets_workout_exercise_id_fkey" FOREIGN KEY ("workout_exercise_id") REFERENCES "workout"."workout_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."personal_records" ADD CONSTRAINT "personal_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."personal_records" ADD CONSTRAINT "personal_records_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercise"."exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."personal_records" ADD CONSTRAINT "personal_records_workout_set_id_fkey" FOREIGN KEY ("workout_set_id") REFERENCES "workout"."workout_sets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
