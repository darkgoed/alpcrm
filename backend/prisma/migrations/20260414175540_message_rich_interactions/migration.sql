-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'sticker';
ALTER TYPE "MessageType" ADD VALUE 'location';
ALTER TYPE "MessageType" ADD VALUE 'contacts';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by_id" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "reactions" JSONB,
ADD COLUMN     "reply_to_message_id" TEXT;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
