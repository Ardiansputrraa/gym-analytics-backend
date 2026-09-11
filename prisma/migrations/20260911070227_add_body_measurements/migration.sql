-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "body";

-- CreateEnum
CREATE TYPE "body"."BodyCompositionStatus" AS ENUM ('FAT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'PR_COMPOSITION');

-- CreateTable
CREATE TABLE "body"."body_measurements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "measured_at" TIMESTAMPTZ(6) NOT NULL,
    "receipt_number" VARCHAR(50),
    "weight_kg" DECIMAL(6,3) NOT NULL,
    "skeletal_muscle_kg" DECIMAL(6,2),
    "body_fat_kg" DECIMAL(6,2),
    "body_fat_pct" DECIMAL(5,2),
    "fat_free_mass_kg" DECIMAL(6,2),
    "water_content_kg" DECIMAL(6,2),
    "protein_kg" DECIMAL(6,2),
    "mineral_kg" DECIMAL(6,2),
    "bmi" DECIMAL(5,2),
    "status" "body"."BodyCompositionStatus" DEFAULT 'MAINTENANCE',
    "evaluation" VARCHAR(255),
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "body_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_bm_user_date" ON "body"."body_measurements"("user_id", "measured_at", "is_deleted");

-- AddForeignKey
ALTER TABLE "body"."body_measurements" ADD CONSTRAINT "body_measurements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
