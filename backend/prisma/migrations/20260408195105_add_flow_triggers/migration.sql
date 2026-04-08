-- CreateEnum
CREATE TYPE "FlowTriggerType" AS ENUM ('new_conversation', 'keyword', 'always');

-- AlterTable
ALTER TABLE "flows" ADD COLUMN     "trigger_type" "FlowTriggerType" NOT NULL DEFAULT 'new_conversation',
ADD COLUMN     "trigger_value" TEXT;
