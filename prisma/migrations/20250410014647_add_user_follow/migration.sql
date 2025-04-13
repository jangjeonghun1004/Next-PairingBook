/*
  Warnings:

  - You are about to drop the column `is_public` on the `Discussion` table. All the data in the column will be lost.
  - Added the required column `privacy` to the `Discussion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "is_public",
ADD COLUMN     "privacy" TEXT NOT NULL,
ADD COLUMN     "topics" TEXT[];

-- CreateTable
CREATE TABLE "DiscussionParticipant" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "discussion_id" UUID NOT NULL,

    CONSTRAINT "DiscussionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollow" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,

    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscussionParticipant_user_id_idx" ON "DiscussionParticipant"("user_id");

-- CreateIndex
CREATE INDEX "DiscussionParticipant_discussion_id_idx" ON "DiscussionParticipant"("discussion_id");

-- CreateIndex
CREATE INDEX "DiscussionParticipant_status_idx" ON "DiscussionParticipant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DiscussionParticipant_user_id_discussion_id_key" ON "DiscussionParticipant"("user_id", "discussion_id");

-- CreateIndex
CREATE INDEX "UserFollow_follower_id_idx" ON "UserFollow"("follower_id");

-- CreateIndex
CREATE INDEX "UserFollow_following_id_idx" ON "UserFollow"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollow_follower_id_following_id_key" ON "UserFollow"("follower_id", "following_id");

-- AddForeignKey
ALTER TABLE "DiscussionParticipant" ADD CONSTRAINT "DiscussionParticipant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionParticipant" ADD CONSTRAINT "DiscussionParticipant_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
