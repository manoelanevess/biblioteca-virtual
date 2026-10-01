import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import {
  FormatoLivro,
  StatusPedido,
  StatusOferta,
} from '../generated/prisma/enums.js'
import type {
  AlterarDestaqueLivroEntrada,
  AlterarStatusOfertaEntrada,
  CriarAutorEntrada,
  CriarCategoriaEntrada,
  CriarEdicaoEntrada,
  CriarLivroEntrada,
  CriarOfertaEntrada,
} from '../schemas/catalogo.js'

const selecaoLivroGerenciado = {
  id: true,
  titulo: true,
  sinopse: true,
  urlCapa: true,
  idioma: true,
  destaque: true,
  enriquecidoPorIa: true,
  autores: {
    select: { autor: { select: { id: true, nome: true } } },
  },
  categorias: {
    select: { categoria: { select: { id: true, nome: true } } },
  },
  criadoEm: true,
} as const

const selecaoOfertaGerenciada = {
  id: true,
  preco: true,
  precoAluguel: true,
  estoque: true,
  status: true,
  chaveArquivoDigital: true,
  criadoEm: true,
  atualizadoEm: true,
  edicao: {
    select: {
      id: true,
      isbn: true,
      formato: true,
      livro: {
        select: {
          id: true,
          titulo: true,
          urlCapa: true,
          destaque: true,
        },
      },
    },
  },
  _count: {
    select: {
      visualizacoes: true,
      itensPedido: {
        where: {
          pedido: {
            status: {
              in: [
                StatusPedido.PAGO,
                StatusPedido.ENVIADO,
                StatusPedido.CONCLUIDO,
              ],
            },
          },
        },
      },
    },
  },
} satisfies Prisma.OfertaLivroSelect

function mapearLivroGerenciado(
  livro: Awaited<ReturnType<typeof criarLivroNoBanco>>,
) {
  return {
    ...livro,
    autores: livro.autores.map(({ autor }) => autor),
    categorias: livro.categorias.map(({ categoria }) => categoria),
  }
}

function mapearOfertaGerenciada(
  oferta: Awaited<ReturnType<typeof buscarOfertaDoVendedor>>,
) {
  if (!oferta) {
    return null
  }

  return {
    id: oferta.id,
    preco: Number(oferta.preco),
    precoAluguel:
      oferta.precoAluguel === null ? null : Number(oferta.precoAluguel),
    estoque: oferta.estoque,
    status: oferta.status,
    possuiArquivoDigital: Boolean(oferta.chaveArquivoDigital),
    edicao: oferta.edicao,
    metricas: {
      visualizacoes: oferta._count.visualizacoes,
      vendas: oferta._count.itensPedido,
    },
    criadoEm: oferta.criadoEm,
    atualizadoEm: oferta.atualizadoEm,
  }
}

function criarLivroNoBanco(entrada: CriarLivroEntrada) {
  return prisma.livro.create({
    data: {
      titulo: entrada.titulo,
      sinopse: entrada.sinopse,
      urlCapa: entrada.urlCapa,
      idioma: entrada.idioma,
      destaque: entrada.destaque,
      enriquecidoPorIa: entrada.enriquecidoPorIa,
      autores: {
        create: entrada.autorIds.map((autorId) => ({
          autor: { connect: { id: autorId } },
        })),
      },
      categorias: {
        create: entrada.categoriaIds.map((categoriaId) => ({
          categoria: { connect: { id: categoriaId } },
        })),
      },
    },
    select: selecaoLivroGerenciado,
  })
}

function buscarOfertaDoVendedor(ofertaId: string, vendedorId: string) {
  return prisma.ofertaLivro.findFirst({
    where: { id: ofertaId, vendedorId },
    select: selecaoOfertaGerenciada,
  })
}

export async function criarAutor(entrada: CriarAutorEntrada) {
  const autorExistente = await prisma.autor.findFirst({
    where: { nome: { equals: entrada.nome, mode: 'insensitive' } },
    select: { id: true },
  })

  if (autorExistente) {
    throw new ErroHttp(409, 'AUTOR_JA_EXISTE', 'Este autor ja esta cadastrado')
  }

  return prisma.autor.create({
    data: entrada,
    select: { id: true, nome: true, biografia: true, criadoEm: true },
  })
}

export async function criarCategoria(entrada: CriarCategoriaEntrada) {
  const categoriaExistente = await prisma.categoria.findFirst({
    where: { nome: { equals: entrada.nome, mode: 'insensitive' } },
    select: { id: true },
  })

  if (categoriaExistente) {
    throw new ErroHttp(
      409,
      'CATEGORIA_JA_EXISTE',
      'Esta categoria ja esta cadastrada',
    )
  }

  return prisma.categoria.create({
    data: entrada,
    select: { id: true, nome: true, descricao: true, criadoEm: true },
  })
}

export async function listarReferenciasCatalogo() {
  const [autores, categorias, livros] = await Promise.all([
    prisma.autor.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.categoria.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.livro.findMany({
      select: {
        id: true,
        titulo: true,
        edicoes: {
          select: {
            id: true,
            isbn: true,
            formato: true,
            editora: true,
            anoPublicacao: true,
          },
          orderBy: { criadoEm: 'desc' },
        },
      },
      orderBy: { titulo: 'asc' },
    }),
  ])

  return { autores, categorias, livros }
}

export async function criarLivro(entrada: CriarLivroEntrada) {
  const [quantidadeAutores, quantidadeCategorias] = await Promise.all([
    prisma.autor.count({ where: { id: { in: entrada.autorIds } } }),
    prisma.categoria.count({ where: { id: { in: entrada.categoriaIds } } }),
  ])

  if (quantidadeAutores !== entrada.autorIds.length) {
    throw new ErroHttp(
      400,
      'AUTORES_INVALIDOS',
      'Um ou mais autores nao foram encontrados',
    )
  }

  if (quantidadeCategorias !== entrada.categoriaIds.length) {
    throw new ErroHttp(
      400,
      'CATEGORIAS_INVALIDAS',
      'Uma ou mais categorias nao foram encontradas',
    )
  }

  return mapearLivroGerenciado(await criarLivroNoBanco(entrada))
}

export async function alterarDestaqueLivro(
  livroId: string,
  entrada: AlterarDestaqueLivroEntrada,
) {
  const livro = await prisma.livro.findUnique({
    where: { id: livroId },
    select: { id: true },
  })

  if (!livro) {
    throw new ErroHttp(404, 'LIVRO_NAO_ENCONTRADO', 'Livro nao encontrado')
  }

  return prisma.livro.update({
    where: { id: livroId },
    data: { destaque: entrada.destaque },
    select: { id: true, titulo: true, destaque: true },
  })
}

export async function criarEdicao(entrada: CriarEdicaoEntrada) {
  const [livro, edicaoComIsbn] = await Promise.all([
    prisma.livro.findUnique({
      where: { id: entrada.livroId },
      select: { id: true },
    }),
    entrada.isbn
      ? prisma.edicaoLivro.findUnique({
          where: { isbn: entrada.isbn },
          select: { id: true },
        })
      : null,
  ])

  if (!livro) {
    throw new ErroHttp(404, 'LIVRO_NAO_ENCONTRADO', 'Livro nao encontrado')
  }

  if (edicaoComIsbn) {
    throw new ErroHttp(409, 'ISBN_EM_USO', 'Este ISBN ja esta cadastrado')
  }

  return prisma.edicaoLivro.create({
    data: entrada,
    select: {
      id: true,
      livroId: true,
      isbn: true,
      formato: true,
      editora: true,
      anoPublicacao: true,
      numeroPaginas: true,
      criadoEm: true,
    },
  })
}

export async function criarOferta(
  vendedorId: string,
  entrada: CriarOfertaEntrada,
) {
  const [edicao, ofertaExistente] = await Promise.all([
    prisma.edicaoLivro.findUnique({
      where: { id: entrada.edicaoId },
      select: { id: true, formato: true },
    }),
    prisma.ofertaLivro.findUnique({
      where: {
        vendedorId_edicaoId: {
          vendedorId,
          edicaoId: entrada.edicaoId,
        },
      },
      select: { id: true },
    }),
  ])

  if (!edicao) {
    throw new ErroHttp(404, 'EDICAO_NAO_ENCONTRADA', 'Edicao nao encontrada')
  }

  if (edicao.formato !== entrada.formato) {
    throw new ErroHttp(
      400,
      'FORMATO_DIVERGENTE',
      'O formato informado nao corresponde ao formato da edicao',
    )
  }

  if (ofertaExistente) {
    throw new ErroHttp(
      409,
      'OFERTA_JA_EXISTE',
      'Voce ja possui uma oferta para esta edicao',
    )
  }

  const oferta = await prisma.ofertaLivro.create({
    data: {
      vendedorId,
      edicaoId: entrada.edicaoId,
      preco: entrada.preco,
      precoAluguel: entrada.precoAluguel ?? null,
      estoque:
        entrada.formato === FormatoLivro.FISICO ? entrada.estoque : null,
      chaveArquivoDigital:
        entrada.formato === FormatoLivro.EBOOK
          ? entrada.chaveArquivoDigital
          : null,
    },
    select: selecaoOfertaGerenciada,
  })

  return mapearOfertaGerenciada(oferta)
}

export async function listarOfertasDoVendedor(vendedorId: string) {
  const ofertas = await prisma.ofertaLivro.findMany({
    where: { vendedorId },
    select: selecaoOfertaGerenciada,
    orderBy: { criadoEm: 'desc' },
  })

  return ofertas.map(mapearOfertaGerenciada)
}

export async function alterarStatusOferta(
  vendedorId: string,
  ofertaId: string,
  entrada: AlterarStatusOfertaEntrada,
) {
  const oferta = await buscarOfertaDoVendedor(ofertaId, vendedorId)

  if (!oferta) {
    throw new ErroHttp(404, 'OFERTA_NAO_ENCONTRADA', 'Oferta nao encontrada')
  }

  if (
    entrada.status === StatusOferta.ATIVA &&
    oferta.edicao.formato === FormatoLivro.FISICO &&
    (!oferta.estoque || oferta.estoque <= 0)
  ) {
    throw new ErroHttp(
      400,
      'ESTOQUE_INSUFICIENTE',
      'Informe um estoque maior que zero antes de ativar a oferta',
    )
  }

  if (
    entrada.status === StatusOferta.ATIVA &&
    oferta.edicao.formato === FormatoLivro.EBOOK &&
    !oferta.chaveArquivoDigital
  ) {
    throw new ErroHttp(
      400,
      'ARQUIVO_DIGITAL_AUSENTE',
      'Informe o arquivo digital antes de ativar a oferta',
    )
  }

  const ofertaAtualizada = await prisma.ofertaLivro.update({
    where: { id: ofertaId },
    data: { status: entrada.status },
    select: selecaoOfertaGerenciada,
  })

  return mapearOfertaGerenciada(ofertaAtualizada)
}
