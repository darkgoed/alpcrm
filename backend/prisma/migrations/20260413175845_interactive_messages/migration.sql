-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'interactive';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "interactive_payload" JSONB,
ADD COLUMN     "interactive_type" TEXT;
