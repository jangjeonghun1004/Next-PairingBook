/*
  Warnings:

  - You are about to drop the `StoryLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StoryLike" DROP CONSTRAINT "StoryLike_story_id_fkey";

-- DropForeignKey
ALTER TABLE "StoryLike" DROP CONSTRAINT "StoryLike_user_id_fkey";

-- DropTable
DROP TABLE "StoryLike";

-- CreateTable
CREATE TABLE "UserLike" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "story_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserLike_user_id_idx" ON "UserLike"("user_id");

-- CreateIndex
CREATE INDEX "UserLike_story_id_idx" ON "UserLike"("story_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserLike_user_id_story_id_key" ON "UserLike"("user_id", "story_id");

-- AddForeignKey
ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLike" ADD CONSTRAINT "UserLike_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
