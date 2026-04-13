-- AlterTable
ALTER TABLE "workspace_settings" ADD COLUMN     "business_hours" JSONB,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'pt_BR',
ADD COLUMN     "logo_url" TEXT,
ADD COLUMN     "out_of_hours_message" TEXT,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
