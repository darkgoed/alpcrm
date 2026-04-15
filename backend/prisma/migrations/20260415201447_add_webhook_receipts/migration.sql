-- CreateTable
CREATE TABLE "webhook_receipts" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_receipts_processed_at_idx" ON "webhook_receipts"("processed_at");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_receipts_event_id_event_type_key" ON "webhook_receipts"("event_id", "event_type");
