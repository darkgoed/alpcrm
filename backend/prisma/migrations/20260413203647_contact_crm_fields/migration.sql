-- CreateEnum
CREATE TYPE "ContactLifecycleStage" AS ENUM ('lead', 'qualified', 'customer', 'inactive');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "company" TEXT,
ADD COLUMN     "lifecycle_stage" "ContactLifecycleStage" NOT NULL DEFAULT 'lead',
ADD COLUMN     "owner_id" TEXT;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
