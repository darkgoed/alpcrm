-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('manual', 'import_csv', 'whatsapp_inbound');

-- CreateEnum
CREATE TYPE "ContactOptInStatus" AS ENUM ('unknown', 'opted_in', 'opted_out');

-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "opt_in_at" TIMESTAMP(3),
ADD COLUMN     "opt_in_status" "ContactOptInStatus" NOT NULL DEFAULT 'unknown',
ADD COLUMN     "source" "ContactSource" NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "unread_count" INTEGER NOT NULL DEFAULT 0;
