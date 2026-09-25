-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PerfilUsuario" AS ENUM ('CLIENTE', 'VENDEDOR', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "FormatoLivro" AS ENUM ('FISICO', 'EBOOK');

-- CreateEnum
CREATE TYPE "StatusOferta" AS ENUM ('RASCUNHO', 'ATIVA', 'INATIVA');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('PENDENTE', 'PAGO', 'ENVIADO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusLeitura" AS ENUM ('NAO_INICIADO', 'LENDO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "ModoBusca" AS ENUM ('TRADICIONAL', 'INTELIGENTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "PerfilUsuario" NOT NULL DEFAULT 'CLIENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Autor" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "biografia" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Autor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Livro" (
    "id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "sinopse" TEXT,
    "urlCapa" TEXT,
    "idioma" TEXT NOT NULL DEFAULT 'pt-BR',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Livro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivroAutor" (
    "livroId" UUID NOT NULL,
    "autorId" UUID NOT NULL,

    CONSTRAINT "LivroAutor_pkey" PRIMARY KEY ("livroId","autorId")
);

-- CreateTable
CREATE TABLE "LivroCategoria" (
    "livroId" UUID NOT NULL,
    "categoriaId" UUID NOT NULL,

    CONSTRAINT "LivroCategoria_pkey" PRIMARY KEY ("livroId","categoriaId")
);

-- CreateTable
CREATE TABLE "EdicaoLivro" (
    "id" UUID NOT NULL,
    "livroId" UUID NOT NULL,
    "isbn" TEXT,
    "formato" "FormatoLivro" NOT NULL,
    "editora" TEXT,
    "anoPublicacao" INTEGER,
    "numeroPaginas" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EdicaoLivro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfertaLivro" (
    "id" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "edicaoId" UUID NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "estoque" INTEGER,
    "chaveArquivoDigital" TEXT,
    "status" "StatusOferta" NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaLivro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" UUID NOT NULL,
    "clienteId" UUID NOT NULL,
    "vendedorId" UUID NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'PENDENTE',
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPedido" (
    "id" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "ofertaId" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "precoUnitario" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "ItemPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnderecoEntrega" (
    "id" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "destinatario" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,

    CONSTRAINT "EnderecoEntrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemBiblioteca" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "edicaoId" UUID NOT NULL,
    "itemPedidoId" UUID,
    "statusLeitura" "StatusLeitura" NOT NULL DEFAULT 'NAO_INICIADO',
    "percentualLido" INTEGER NOT NULL DEFAULT 0,
    "paginaAtual" INTEGER,
    "ultimaLeituraEm" TIMESTAMP(3),
    "adicionadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemBiblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Avaliacao" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "livroId" UUID NOT NULL,
    "nota" INTEGER NOT NULL,
    "comentario" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorito" (
    "usuarioId" UUID NOT NULL,
    "livroId" UUID NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorito_pkey" PRIMARY KEY ("usuarioId","livroId")
);

-- CreateTable
CREATE TABLE "VisualizacaoOferta" (
    "id" UUID NOT NULL,
    "ofertaId" UUID NOT NULL,
    "usuarioId" UUID,
    "sessaoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisualizacaoOferta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultaBusca" (
    "id" UUID NOT NULL,
    "usuarioId" UUID,
    "termoOriginal" TEXT NOT NULL,
    "modo" "ModoBusca" NOT NULL DEFAULT 'TRADICIONAL',
    "filtrosInterpretados" JSONB,
    "quantidadeResultados" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultaBusca_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_perfil_idx" ON "Usuario"("perfil");

-- CreateIndex
CREATE INDEX "Autor_nome_idx" ON "Autor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nome_key" ON "Categoria"("nome");

-- CreateIndex
CREATE INDEX "Livro_titulo_idx" ON "Livro"("titulo");

-- CreateIndex
CREATE INDEX "LivroAutor_autorId_idx" ON "LivroAutor"("autorId");

-- CreateIndex
CREATE INDEX "LivroCategoria_categoriaId_idx" ON "LivroCategoria"("categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "EdicaoLivro_isbn_key" ON "EdicaoLivro"("isbn");

-- CreateIndex
CREATE INDEX "EdicaoLivro_livroId_idx" ON "EdicaoLivro"("livroId");

-- CreateIndex
CREATE INDEX "EdicaoLivro_formato_idx" ON "EdicaoLivro"("formato");

-- CreateIndex
CREATE INDEX "OfertaLivro_edicaoId_idx" ON "OfertaLivro"("edicaoId");

-- CreateIndex
CREATE INDEX "OfertaLivro_status_idx" ON "OfertaLivro"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OfertaLivro_vendedorId_edicaoId_key" ON "OfertaLivro"("vendedorId", "edicaoId");

-- CreateIndex
CREATE INDEX "Pedido_clienteId_criadoEm_idx" ON "Pedido"("clienteId", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_vendedorId_criadoEm_idx" ON "Pedido"("vendedorId", "criadoEm");

-- CreateIndex
CREATE INDEX "Pedido_status_idx" ON "Pedido"("status");

-- CreateIndex
CREATE INDEX "ItemPedido_ofertaId_idx" ON "ItemPedido"("ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPedido_pedidoId_ofertaId_key" ON "ItemPedido"("pedidoId", "ofertaId");

-- CreateIndex
CREATE UNIQUE INDEX "EnderecoEntrega_pedidoId_key" ON "EnderecoEntrega"("pedidoId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemBiblioteca_itemPedidoId_key" ON "ItemBiblioteca"("itemPedidoId");

-- CreateIndex
CREATE INDEX "ItemBiblioteca_edicaoId_idx" ON "ItemBiblioteca"("edicaoId");

-- CreateIndex
CREATE INDEX "ItemBiblioteca_statusLeitura_idx" ON "ItemBiblioteca"("statusLeitura");

-- CreateIndex
CREATE UNIQUE INDEX "ItemBiblioteca_usuarioId_edicaoId_key" ON "ItemBiblioteca"("usuarioId", "edicaoId");

-- CreateIndex
CREATE INDEX "Avaliacao_livroId_idx" ON "Avaliacao"("livroId");

-- CreateIndex
CREATE UNIQUE INDEX "Avaliacao_usuarioId_livroId_key" ON "Avaliacao"("usuarioId", "livroId");

-- CreateIndex
CREATE INDEX "Favorito_livroId_idx" ON "Favorito"("livroId");

-- CreateIndex
CREATE INDEX "VisualizacaoOferta_ofertaId_criadoEm_idx" ON "VisualizacaoOferta"("ofertaId", "criadoEm");

-- CreateIndex
CREATE INDEX "VisualizacaoOferta_usuarioId_idx" ON "VisualizacaoOferta"("usuarioId");

-- CreateIndex
CREATE INDEX "ConsultaBusca_usuarioId_idx" ON "ConsultaBusca"("usuarioId");

-- CreateIndex
CREATE INDEX "ConsultaBusca_modo_criadoEm_idx" ON "ConsultaBusca"("modo", "criadoEm");

-- AddForeignKey
ALTER TABLE "LivroAutor" ADD CONSTRAINT "LivroAutor_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivroAutor" ADD CONSTRAINT "LivroAutor_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Autor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivroCategoria" ADD CONSTRAINT "LivroCategoria_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivroCategoria" ADD CONSTRAINT "LivroCategoria_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EdicaoLivro" ADD CONSTRAINT "EdicaoLivro_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaLivro" ADD CONSTRAINT "OfertaLivro_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfertaLivro" ADD CONSTRAINT "OfertaLivro_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "EdicaoLivro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPedido" ADD CONSTRAINT "ItemPedido_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaLivro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnderecoEntrega" ADD CONSTRAINT "EnderecoEntrega_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBiblioteca" ADD CONSTRAINT "ItemBiblioteca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBiblioteca" ADD CONSTRAINT "ItemBiblioteca_edicaoId_fkey" FOREIGN KEY ("edicaoId") REFERENCES "EdicaoLivro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemBiblioteca" ADD CONSTRAINT "ItemBiblioteca_itemPedidoId_fkey" FOREIGN KEY ("itemPedidoId") REFERENCES "ItemPedido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Avaliacao" ADD CONSTRAINT "Avaliacao_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorito" ADD CONSTRAINT "Favorito_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "Livro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualizacaoOferta" ADD CONSTRAINT "VisualizacaoOferta_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaLivro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisualizacaoOferta" ADD CONSTRAINT "VisualizacaoOferta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultaBusca" ADD CONSTRAINT "ConsultaBusca_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
