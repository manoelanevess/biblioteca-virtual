import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import { FormatoLivro, StatusLeitura } from '../generated/prisma/enums.js'
import type { AtualizarProgressoEntrada } from '../schemas/biblioteca.js'

const selecaoItemBiblioteca = {
  id: true,
  statusLeitura: true,
  percentualLido: true,
  paginaAtual: true,
  ultimaLeituraEm: true,
  adicionadoEm: true,
  atualizadoEm: true,
  itemPedido: {
    select: {
      oferta: {
        select: { chaveArquivoDigital: true },
      },
    },
  },
  edicao: {
    select: {
      id: true,
      isbn: true,
      formato: true,
      editora: true,
      anoPublicacao: true,
      numeroPaginas: true,
      livro: {
        select: {
          id: true,
          titulo: true,
          sinopse: true,
          urlCapa: true,
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
        },
      },
    },
  },
} satisfies Prisma.ItemBibliotecaSelect

type ItemBibliotecaConsultado = Prisma.ItemBibliotecaGetPayload<{
  select: typeof selecaoItemBiblioteca
}>

function mapearItemBiblioteca(item: ItemBibliotecaConsultado) {
  const { itemPedido, edicao, ...progresso } = item

  return {
    ...progresso,
    edicao: {
      id: edicao.id,
      isbn: edicao.isbn,
      formato: edicao.formato,
      editora: edicao.editora,
      anoPublicacao: edicao.anoPublicacao,
      numeroPaginas: edicao.numeroPaginas,
      acessoDigitalDisponivel:
        edicao.formato === FormatoLivro.EBOOK &&
        Boolean(itemPedido?.oferta.chaveArquivoDigital),
      livro: {
        ...edicao.livro,
        autores: edicao.livro.autores.map(({ autor }) => autor),
        categorias: edicao.livro.categorias.map(
          ({ categoria }) => categoria,
        ),
      },
    },
  }
}

export async function listarBiblioteca(usuarioId: string) {
  const itens = await prisma.itemBiblioteca.findMany({
    where: { usuarioId },
    select: selecaoItemBiblioteca,
    orderBy: [{ atualizadoEm: 'desc' }, { adicionadoEm: 'desc' }],
  })

  return itens.map(mapearItemBiblioteca)
}

export async function atualizarProgresso(
  usuarioId: string,
  itemBibliotecaId: string,
  entrada: AtualizarProgressoEntrada,
) {
  const itemAtual = await prisma.itemBiblioteca.findFirst({
    where: { id: itemBibliotecaId, usuarioId },
    select: {
      id: true,
      edicao: {
        select: { numeroPaginas: true },
      },
    },
  })

  if (!itemAtual) {
    throw new ErroHttp(
      404,
      'ITEM_BIBLIOTECA_NAO_ENCONTRADO',
      'Livro nao encontrado na sua biblioteca',
    )
  }

  if (
    entrada.paginaAtual !== undefined &&
    entrada.paginaAtual !== null &&
    itemAtual.edicao.numeroPaginas !== null &&
    entrada.paginaAtual > itemAtual.edicao.numeroPaginas
  ) {
    throw new ErroHttp(
      400,
      'PAGINA_ATUAL_INVALIDA',
      'A pagina atual nao pode ultrapassar o total de paginas da edicao',
    )
  }

  const item = await prisma.itemBiblioteca.update({
    where: { id: itemAtual.id },
    data: {
      statusLeitura: entrada.statusLeitura,
      percentualLido: entrada.percentualLido,
      ...(entrada.statusLeitura === StatusLeitura.NAO_INICIADO
        ? { paginaAtual: null, ultimaLeituraEm: null }
        : {
            ...(entrada.paginaAtual !== undefined
              ? { paginaAtual: entrada.paginaAtual }
              : {}),
            ultimaLeituraEm: new Date(),
          }),
    },
    select: selecaoItemBiblioteca,
  })

  return mapearItemBiblioteca(item)
}
