-- AlterTable
ALTER TABLE "calorie"."daily_calorie_targets" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "identity"."otp_tokens" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "identity"."users" DROP COLUMN "role",
ADD COLUMN     "is_admin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "profile"."user_profiles" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "identity"."UserRole";
