-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FlowNodeType" ADD VALUE 'wait_for_reply';
ALTER TYPE "FlowNodeType" ADD VALUE 'branch';
ALTER TYPE "FlowNodeType" ADD VALUE 'tag_contact';
ALTER TYPE "FlowNodeType" ADD VALUE 'move_stage';
ALTER TYPE "FlowNodeType" ADD VALUE 'assign_to';
ALTER TYPE "FlowNodeType" ADD VALUE 'send_template';
ALTER TYPE "FlowNodeType" ADD VALUE 'webhook_call';

-- AlterEnum
ALTER TYPE "FlowTriggerType" ADD VALUE 'button_reply';

-- AlterTable
ALTER TABLE "contact_flow_state" ADD COLUMN     "reply_timeout_at" TIMESTAMP(3),
ADD COLUMN     "variables" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "waiting_for_reply" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "flows" ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "flow_edges" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "label" TEXT,

    CONSTRAINT "flow_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_execution_logs" (
    "id" TEXT NOT NULL,
    "flow_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "node_id" TEXT,
    "event" TEXT NOT NULL,
    "detail" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flow_execution_logs_flow_id_contact_id_idx" ON "flow_execution_logs"("flow_id", "contact_id");

-- CreateIndex
CREATE INDEX "flow_execution_logs_contact_id_created_at_idx" ON "flow_execution_logs"("contact_id", "created_at");

-- AddForeignKey
ALTER TABLE "flow_edges" ADD CONSTRAINT "flow_edges_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_edges" ADD CONSTRAINT "flow_edges_from_node_id_fkey" FOREIGN KEY ("from_node_id") REFERENCES "flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_edges" ADD CONSTRAINT "flow_edges_to_node_id_fkey" FOREIGN KEY ("to_node_id") REFERENCES "flow_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_execution_logs" ADD CONSTRAINT "flow_execution_logs_flow_id_fkey" FOREIGN KEY ("flow_id") REFERENCES "flows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_execution_logs" ADD CONSTRAINT "flow_execution_logs_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_execution_logs" ADD CONSTRAINT "flow_execution_logs_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "flow_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
