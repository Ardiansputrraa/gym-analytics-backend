-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "nutrition";

-- CreateEnum
CREATE TYPE "nutrition"."NutritionType" AS ENUM ('FOOD', 'DRINK');

-- CreateTable
CREATE TABLE "nutrition"."food_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" "nutrition"."NutritionType" NOT NULL DEFAULT 'FOOD',
    "default_serving_unit" VARCHAR(50) NOT NULL DEFAULT 'gram',
    "default_serving_size" DECIMAL(8,2) NOT NULL DEFAULT 100.0,
    "calories_per_serving" INTEGER NOT NULL DEFAULT 0,
    "protein_per_serving" DECIMAL(7,2) NOT NULL DEFAULT 0.0,
    "fat_per_serving" DECIMAL(7,2) NOT NULL DEFAULT 0.0,
    "carbs_per_serving" DECIMAL(7,2) NOT NULL DEFAULT 0.0,
    "water_ml_per_serving" INTEGER DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition"."nutrition_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "food_item_id" UUID,
    "consumed_at" TIMESTAMPTZ(6) NOT NULL,
    "type" "nutrition"."NutritionType" NOT NULL DEFAULT 'FOOD',
    "name" VARCHAR(255) NOT NULL,
    "calories" INTEGER NOT NULL DEFAULT 0,
    "quantity" DECIMAL(8,3) NOT NULL DEFAULT 1.0,
    "unit" VARCHAR(50) NOT NULL DEFAULT 'porsi',
    "protein_g" DECIMAL(7,2),
    "carbs_g" DECIMAL(7,2),
    "fat_g" DECIMAL(7,2),
    "water_ml" INTEGER,
    "notes" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "nutrition_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "food_items_name_key" ON "nutrition"."food_items"("name");

-- CreateIndex
CREATE INDEX "idx_food_items_name" ON "nutrition"."food_items"("name", "is_deleted");

-- CreateIndex
CREATE INDEX "idx_ne_user_date" ON "nutrition"."nutrition_entries"("user_id", "consumed_at", "is_deleted");

-- AddForeignKey
ALTER TABLE "nutrition"."nutrition_entries" ADD CONSTRAINT "nutrition_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition"."nutrition_entries" ADD CONSTRAINT "nutrition_entries_food_item_id_fkey" FOREIGN KEY ("food_item_id") REFERENCES "nutrition"."food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
