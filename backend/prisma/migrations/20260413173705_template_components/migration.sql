-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "last_contact_message_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "message_templates" ADD COLUMN     "buttons" JSONB,
ADD COLUMN     "footer_text" TEXT,
ADD COLUMN     "header_format" TEXT,
ADD COLUMN     "header_media_handle" TEXT,
ADD COLUMN     "header_text" TEXT,
ADD COLUMN     "variable_examples" JSONB;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "file_name" TEXT,
ADD COLUMN     "file_size" INTEGER,
ADD COLUMN     "mime_type" TEXT;
