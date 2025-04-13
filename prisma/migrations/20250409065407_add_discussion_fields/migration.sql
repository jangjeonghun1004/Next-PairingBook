-- AlterTable
ALTER TABLE "Discussion" ADD COLUMN     "is_public" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_participants" INTEGER DEFAULT 10,
ADD COLUMN     "scheduled_at" TIMESTAMP(3);
