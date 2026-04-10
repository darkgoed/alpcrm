-- AlterTable
ALTER TABLE "whatsapp_accounts" ADD COLUMN     "app_secret" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "verify_token" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "waba_id" TEXT NOT NULL DEFAULT '';
