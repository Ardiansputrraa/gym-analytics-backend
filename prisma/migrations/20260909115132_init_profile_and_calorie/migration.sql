-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "calorie";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "profile";

-- CreateEnum
CREATE TYPE "profile"."Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "profile"."ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "profile"."FitnessGoal" AS ENUM ('FAT_LOSS', 'MAINTENANCE', 'MUSCLE_GAIN');

-- CreateEnum
CREATE TYPE "profile"."DietPace" AS ENUM ('RELAXED', 'STANDARD', 'EXTREME');

-- CreateTable
CREATE TABLE "profile"."user_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "age" SMALLINT NOT NULL,
    "gender" "profile"."Gender" NOT NULL,
    "height_cm" DECIMAL(5,2) NOT NULL,
    "weight_kg" DECIMAL(6,3) NOT NULL,
    "activity_level" "profile"."ActivityLevel" NOT NULL,
    "fitness_goal" "profile"."FitnessGoal" NOT NULL,
    "diet_pace" "profile"."DietPace" NOT NULL DEFAULT 'STANDARD',
    "check_in_interval_days" SMALLINT NOT NULL DEFAULT 30,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calorie"."daily_calorie_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "bmr" DECIMAL(8,2) NOT NULL,
    "activity_factor" DECIMAL(4,3) NOT NULL,
    "tdee" DECIMAL(8,2) NOT NULL,
    "fitness_goal" "profile"."FitnessGoal" NOT NULL DEFAULT 'MAINTENANCE',
    "diet_pace" "profile"."DietPace" NOT NULL DEFAULT 'STANDARD',
    "goal_adjustment" INTEGER NOT NULL DEFAULT 0,
    "target_calories" INTEGER NOT NULL,
    "protein_grams" INTEGER,
    "carbs_grams" INTEGER,
    "fat_grams" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "daily_calorie_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "profile"."user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "idx_dct_user_date" ON "calorie"."daily_calorie_targets"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_calorie_targets_user_id_date_key" ON "calorie"."daily_calorie_targets"("user_id", "date");

-- AddForeignKey
ALTER TABLE "profile"."user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calorie"."daily_calorie_targets" ADD CONSTRAINT "daily_calorie_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
