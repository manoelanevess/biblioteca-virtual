import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import {
  FormatoLivro,
  StatusOferta,
} from '../generated/prisma/enums.js'
import type { ListarLivrosEntrada } from '../schemas/catalogo.js'

const ofertaDisponivelWhere = {
  status: StatusOferta.ATIVA,
  OR: [
    { estoque: { gt: 0 } },
    { edicao: { formato: FormatoLivro.EBOOK } },
  ],
} satisfies Prisma.OfertaLivroWhereInput

function criarFiltroEdicao(
  formato?: FormatoLivro,
): Prisma.EdicaoLivroWhereInput {
  return {
    ...(formato ? { formato } : {}),
    ofertas: { some: ofertaDisponivelWhere },
  }
}

function criarSelecaoLivro(formato?: FormatoLivro) {
  return {
    id: true,
    titulo: true,
    sinopse: true,
    urlCapa: true,
    idioma: true,
    destaque: true,
    autores: {
      select: {
        autor: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { autor: { nome: 'asc' as const } },
    },
    categorias: {
      select: {
        categoria: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { categoria: { nome: 'asc' as const } },
    },
    edicoes: {
      where: criarFiltroEdicao(formato),
      orderBy: [
        { formato: 'asc' as const },
        { anoPublicacao: 'desc' as const },
      ],
      select: {
        id: true,
        isbn: true,
        formato: true,
        editora: true,
        anoPublicacao: true,
        numeroPaginas: true,
        ofertas: {
          where: ofertaDisponivelWhere,
          orderBy: { preco: 'asc' as const },
          select: {
            id: true,
            preco: true,
            estoque: true,
            vendedor: {
              select: { id: true, nome: true },
            },
          },
        },
      },
    },
    avaliacoes: {
      select: { nota: true },
    },
  } satisfies Prisma.LivroSelect
}

type LivroConsultado = Prisma.LivroGetPayload<{
  select: ReturnType<typeof criarSelecaoLivro>
}>

function mapearLivro(livro: LivroConsultado) {
  const somaNotas = livro.avaliacoes.reduce(
    (total, avaliacao) => total + avaliacao.nota,
    0,
  )
  const media = livro.avaliacoes.length
    ? Math.round((somaNotas / livro.avaliacoes.length) * 10) / 10
    : null

  return {
    id: livro.id,
    titulo: livro.titulo,
    sinopse: livro.sinopse,
    urlCapa: livro.urlCapa,
    idioma: livro.idioma,
    destaque: livro.destaque,
    autores: livro.autores.map(({ autor }) => autor),
    categorias: livro.categorias.map(({ categoria }) => categoria),
    avaliacao: {
      media,
      quantidade: livro.avaliacoes.length,
    },
    edicoes: livro.edicoes.map((edicao) => ({
      id: edicao.id,
      isbn: edicao.isbn,
      formato: edicao.formato,
      editora: edicao.editora,
      anoPublicacao: edicao.anoPublicacao,
      numeroPaginas: edicao.numeroPaginas,
      precoInicial: Number(edicao.ofertas[0]!.preco),
      ofertas: edicao.ofertas.map((oferta) => ({
        id: oferta.id,
        preco: Number(oferta.preco),
        estoque: oferta.estoque,
        vendedor: oferta.vendedor,
      })),
    })),
  }
}

export async function listarLivros(entrada: ListarLivrosEntrada) {
  const filtroEdicao = criarFiltroEdicao(entrada.formato)
  const termoIsbn = entrada.termo?.replace(/[ -]/g, '')
  const where: Prisma.LivroWhereInput = {
    edicoes: { some: filtroEdicao },
    ...(entrada.destaque === undefined
      ? {}
      : { destaque: entrada.destaque }),
    ...(entrada.categoriaId
      ? { categorias: { some: { categoriaId: entrada.categoriaId } } }
      : {}),
    ...(entrada.termo
      ? {
          OR: [
            {
              titulo: {
                contains: entrada.termo,
                mode: 'insensitive',
              },
            },
            {
              autores: {
                some: {
                  autor: {
                    nome: {
                      contains: entrada.termo,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
            {
              categorias: {
                some: {
                  categoria: {
                    nome: {
                      contains: entrada.termo,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            },
            {
              edicoes: {
                some: {
                  ...filtroEdicao,
                  isbn: { contains: termoIsbn },
                },
              },
            },
          ],
        }
      : {}),
  }
  const pular = (entrada.pagina - 1) * entrada.limite
  const total = await prisma.livro.count({ where })
  const livros = await prisma.livro.findMany({
    where,
    select: criarSelecaoLivro(entrada.formato),
    orderBy: { titulo: 'asc' },
    skip: pular,
    take: entrada.limite,
  })

  return {
    livros: livros.map(mapearLivro),
    paginacao: {
      pagina: entrada.pagina,
      limite: entrada.limite,
      total,
      totalPaginas: Math.ceil(total / entrada.limite),
    },
  }
}

export async function obterLivro(livroId: string) {
  const livro = await prisma.livro.findFirst({
    where: {
      id: livroId,
      edicoes: { some: criarFiltroEdicao() },
    },
    select: criarSelecaoLivro(),
  })

  if (!livro) {
    throw new ErroHttp(404, 'LIVRO_NAO_ENCONTRADO', 'Livro nao encontrado')
  }

  return mapearLivro(livro)
}

export async function listarCategorias() {
  return prisma.categoria.findMany({
    where: {
      livros: {
        some: {
          livro: {
            edicoes: { some: criarFiltroEdicao() },
          },
        },
      },
    },
    select: {
      id: true,
      nome: true,
      descricao: true,
    },
    orderBy: { nome: 'asc' },
  })
}
