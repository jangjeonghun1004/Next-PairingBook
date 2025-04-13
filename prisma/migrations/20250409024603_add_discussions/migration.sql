-- CreateTable
CREATE TABLE "Discussion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "book_title" TEXT NOT NULL,
    "book_author" TEXT NOT NULL,
    "tags" TEXT[],
    "image_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "author_id" TEXT NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Discussion_author_id_idx" ON "Discussion"("author_id");

-- CreateIndex
CREATE INDEX "Discussion_created_at_idx" ON "Discussion"("created_at");

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
