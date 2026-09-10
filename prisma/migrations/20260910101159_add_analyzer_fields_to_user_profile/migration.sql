-- AlterTable
ALTER TABLE "profile"."user_profiles" ADD COLUMN     "body_fat_kg" DECIMAL(5,2),
ADD COLUMN     "body_fat_pct" DECIMAL(4,2),
ADD COLUMN     "fat_free_mass_kg" DECIMAL(5,2),
ADD COLUMN     "mineral_kg" DECIMAL(5,2),
ADD COLUMN     "protein_kg" DECIMAL(5,2),
ADD COLUMN     "skeletal_muscle_kg" DECIMAL(5,2),
ADD COLUMN     "water_content_kg" DECIMAL(5,2);
