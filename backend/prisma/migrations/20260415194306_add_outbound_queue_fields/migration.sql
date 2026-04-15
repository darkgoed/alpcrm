/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageStatus" ADD VALUE 'queued';
ALTER TYPE "MessageStatus" ADD VALUE 'sending';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "failure_reason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "messages_external_id_key" ON "messages"("external_id");
