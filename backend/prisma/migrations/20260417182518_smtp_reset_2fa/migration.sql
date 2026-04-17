-- AlterTable
ALTER TABLE "users" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "two_factor_pending_secret" TEXT,
ADD COLUMN     "two_factor_secret" TEXT;

-- AlterTable
ALTER TABLE "workspace_settings" ADD COLUMN     "smtp_from_email" TEXT,
ADD COLUMN     "smtp_from_name" TEXT,
ADD COLUMN     "smtp_host" TEXT,
ADD COLUMN     "smtp_pass" TEXT,
ADD COLUMN     "smtp_port" INTEGER,
ADD COLUMN     "smtp_secure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smtp_user" TEXT;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
