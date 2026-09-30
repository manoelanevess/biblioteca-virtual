-- AlterTable
ALTER TABLE "Livro" ADD COLUMN "destaque" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Livro_destaque_idx" ON "Livro"("destaque");
