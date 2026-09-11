-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "exercise";

-- CreateEnum
CREATE TYPE "exercise"."ExerciseType" AS ENUM ('STRENGTH', 'CARDIO_TREADMILL', 'CARDIO_GENERIC', 'BODYWEIGHT');

-- CreateEnum
CREATE TYPE "exercise"."EquipmentCategory" AS ENUM ('BARBELL', 'DUMBBELL', 'CABLE', 'MACHINE', 'SMITH', 'BODYWEIGHT', 'TREADMILL', 'STATIONARY_BIKE', 'STAIR_MASTER', 'ROWING_MACHINE', 'ELLIPTICAL', 'OTHER');

-- CreateTable
CREATE TABLE "exercise"."muscle_groups" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise"."exercises" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "equipment" "exercise"."EquipmentCategory" NOT NULL DEFAULT 'BARBELL',
    "exercise_type" "exercise"."ExerciseType" NOT NULL DEFAULT 'STRENGTH',
    "primary_muscle_group_id" UUID NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_name_key" ON "exercise"."muscle_groups"("name");

-- CreateIndex
CREATE INDEX "idx_exercises_user_deleted" ON "exercise"."exercises"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "idx_exercises_lookup" ON "exercise"."exercises"("primary_muscle_group_id", "equipment", "is_deleted");

-- AddForeignKey
ALTER TABLE "exercise"."exercises" ADD CONSTRAINT "exercises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise"."exercises" ADD CONSTRAINT "exercises_primary_muscle_group_id_fkey" FOREIGN KEY ("primary_muscle_group_id") REFERENCES "exercise"."muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
