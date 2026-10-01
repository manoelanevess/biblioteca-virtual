-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('COMPRA', 'ALUGUEL');

-- CreateEnum
CREATE TYPE "TipoAcessoLivro" AS ENUM ('COMPRA', 'ALUGUEL');

-- AlterTable
ALTER TABLE "OfertaLivro" ADD COLUMN "precoAluguel" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Pedido"
ADD COLUMN "tipo" "TipoPedido" NOT NULL DEFAULT 'COMPRA',
ADD COLUMN "devolucaoPrevista" TIMESTAMP(3),
ADD COLUMN "devolvidoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ItemBiblioteca"
ADD COLUMN "tipoAcesso" "TipoAcessoLivro" NOT NULL DEFAULT 'COMPRA',
ADD COLUMN "acessoExpiraEm" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Pedido_tipo_devolucaoPrevista_idx" ON "Pedido"("tipo", "devolucaoPrevista");
