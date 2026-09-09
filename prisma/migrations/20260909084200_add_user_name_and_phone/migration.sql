-- AlterTable
ALTER TABLE "users" ADD COLUMN "name" VARCHAR(255) NOT NULL DEFAULT '',
ADD COLUMN "phone" VARCHAR(20);

-- AlterTable to remove default from name
ALTER TABLE "users" ALTER COLUMN "name" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
