import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import {
  FormatoLivro,
  StatusOferta,
  StatusPedido,
} from '../generated/prisma/enums.js'
import type { CriarPedidoEntrada } from '../schemas/pedidos.js'
import { ofertasPertencemAoVendedor } from '../schemas/pedidos.js'

const selecaoPedido = {
  id: true,
  status: true,
  valorTotal: true,
  criadoEm: true,
  vendedor: {
    select: { id: true, nome: true },
  },
  enderecoEntrega: {
    select: {
      destinatario: true,
      cep: true,
      logradouro: true,
      numero: true,
      complemento: true,
      bairro: true,
      cidade: true,
      estado: true,
    },
  },
  itens: {
    select: {
      id: true,
      quantidade: true,
      precoUnitario: true,
      oferta: {
        select: {
          id: true,
          edicao: {
            select: {
              id: true,
              formato: true,
              livro: {
                select: { id: true, titulo: true, urlCapa: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PedidoSelect

type PedidoCriado = Prisma.PedidoGetPayload<{
  select: typeof selecaoPedido
}>

function mapearPedido(pedido: PedidoCriado) {
  return {
    ...pedido,
    valorTotal: Number(pedido.valorTotal),
    itens: pedido.itens.map((item) => ({
      ...item,
      precoUnitario: Number(item.precoUnitario),
    })),
  }
}

export async function criarPedido(
  clienteId: string,
  entrada: CriarPedidoEntrada,
) {
  if (clienteId === entrada.vendedorId) {
    throw new ErroHttp(
      400,
      'COMPRA_PROPRIA_NAO_PERMITIDA',
      'Nao e possivel comprar uma oferta da propria loja',
    )
  }

  return prisma.$transaction(async (transacao) => {
    const ofertaIds = entrada.itens.map(({ ofertaId }) => ofertaId)
    const ofertas = await transacao.ofertaLivro.findMany({
      where: { id: { in: ofertaIds } },
      select: {
        id: true,
        vendedorId: true,
        preco: true,
        estoque: true,
        status: true,
        edicao: {
          select: { id: true, formato: true },
        },
      },
    })

    if (ofertas.length !== ofertaIds.length) {
      throw new ErroHttp(
        404,
        'OFERTA_NAO_ENCONTRADA',
        'Uma ou mais ofertas nao foram encontradas',
      )
    }

    if (!ofertasPertencemAoVendedor(entrada.vendedorId, ofertas)) {
      throw new ErroHttp(
        400,
        'VENDEDOR_DIVERGENTE',
        'Todas as ofertas do pedido devem pertencer ao mesmo vendedor',
      )
    }

    if (ofertas.some(({ status }) => status !== StatusOferta.ATIVA)) {
      throw new ErroHttp(
        409,
        'OFERTA_INDISPONIVEL',
        'Uma ou mais ofertas nao estao disponiveis para compra',
      )
    }

    const itensPorOferta = new Map(
      entrada.itens.map((item) => [item.ofertaId, item]),
    )
    const ofertasFisicas = ofertas.filter(
      ({ edicao }) => edicao.formato === FormatoLivro.FISICO,
    )
    const ofertasDigitais = ofertas.filter(
      ({ edicao }) => edicao.formato === FormatoLivro.EBOOK,
    )

    if (ofertasFisicas.length > 0 && !entrada.enderecoEntrega) {
      throw new ErroHttp(
        400,
        'ENDERECO_OBRIGATORIO',
        'Informe o endereco de entrega para comprar livros fisicos',
      )
    }

    if (
      ofertasDigitais.some(
        ({ id }) => itensPorOferta.get(id)!.quantidade !== 1,
      )
    ) {
      throw new ErroHttp(
        400,
        'QUANTIDADE_EBOOK_INVALIDA',
        'Cada ebook deve ser comprado com quantidade igual a um',
      )
    }

    if (ofertasDigitais.length > 0) {
      const ebookAdquirido = await transacao.itemBiblioteca.findFirst({
        where: {
          usuarioId: clienteId,
          edicaoId: {
            in: ofertasDigitais.map(({ edicao }) => edicao.id),
          },
        },
        select: { id: true },
      })

      if (ebookAdquirido) {
        throw new ErroHttp(
          409,
          'EBOOK_JA_ADQUIRIDO',
          'Um dos ebooks selecionados ja esta na sua biblioteca',
        )
      }
    }

    for (const oferta of ofertasFisicas) {
      const quantidade = itensPorOferta.get(oferta.id)!.quantidade
      const atualizacao = await transacao.ofertaLivro.updateMany({
        where: {
          id: oferta.id,
          vendedorId: entrada.vendedorId,
          status: StatusOferta.ATIVA,
          estoque: { gte: quantidade },
        },
        data: { estoque: { decrement: quantidade } },
      })

      if (atualizacao.count !== 1) {
        throw new ErroHttp(
          409,
          'ESTOQUE_INSUFICIENTE',
          'O estoque de uma das ofertas nao atende a quantidade solicitada',
        )
      }
    }

    const ofertasPorId = new Map(ofertas.map((oferta) => [oferta.id, oferta]))
    const valorTotalEmCentavos = entrada.itens.reduce((total, item) => {
      const oferta = ofertasPorId.get(item.ofertaId)!
      return total + Math.round(Number(oferta.preco) * 100) * item.quantidade
    }, 0)

    const pedido = await transacao.pedido.create({
      data: {
        clienteId,
        vendedorId: entrada.vendedorId,
        status: StatusPedido.PAGO,
        valorTotal: valorTotalEmCentavos / 100,
        itens: {
          create: entrada.itens.map((item) => ({
            ofertaId: item.ofertaId,
            quantidade: item.quantidade,
            precoUnitario: ofertasPorId.get(item.ofertaId)!.preco,
          })),
        },
        ...(entrada.enderecoEntrega
          ? { enderecoEntrega: { create: entrada.enderecoEntrega } }
          : {}),
      },
      select: selecaoPedido,
    })

    for (const item of pedido.itens) {
      await transacao.itemBiblioteca.upsert({
        where: {
          usuarioId_edicaoId: {
            usuarioId: clienteId,
            edicaoId: item.oferta.edicao.id,
          },
        },
        create: {
          usuarioId: clienteId,
          edicaoId: item.oferta.edicao.id,
          itemPedidoId: item.id,
        },
        update: {},
      })
    }

    return mapearPedido(pedido)
  })
}
