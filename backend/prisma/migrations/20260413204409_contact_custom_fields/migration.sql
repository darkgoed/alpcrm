-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "custom_fields" JSONB NOT NULL DEFAULT '{}';
