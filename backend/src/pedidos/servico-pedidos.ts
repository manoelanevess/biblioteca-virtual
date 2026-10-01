import { prisma } from '../database/prisma.js'
import { ErroHttp } from '../errors/erro-http.js'
import type { Prisma } from '../generated/prisma/client.js'
import {
  FormatoLivro,
  StatusOferta,
  StatusPedido,
  TipoAcessoLivro,
  TipoPedido,
} from '../generated/prisma/enums.js'
import type { CriarPedidoEntrada } from '../schemas/pedidos.js'
import { ofertasPertencemAoVendedor } from '../schemas/pedidos.js'

const selecaoPedido = {
  id: true,
  status: true,
  tipo: true,
  valorTotal: true,
  devolucaoPrevista: true,
  devolvidoEm: true,
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
    const aluguel = entrada.tipo === TipoPedido.ALUGUEL
    const agora = new Date()
    const devolucaoPrevista = aluguel
      ? new Date(agora.getTime() + 14 * 24 * 60 * 60 * 1000)
      : null
    const ofertaIds = entrada.itens.map(({ ofertaId }) => ofertaId)
    const ofertas = await transacao.ofertaLivro.findMany({
      where: { id: { in: ofertaIds } },
      select: {
        id: true,
        vendedorId: true,
        preco: true,
        precoAluguel: true,
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

    if (aluguel && ofertas.some(({ precoAluguel }) => precoAluguel === null)) {
      throw new ErroHttp(
        409,
        'ALUGUEL_INDISPONIVEL',
        'Uma ou mais ofertas nao estao disponiveis para aluguel',
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

    if (
      aluguel &&
      entrada.itens.some(({ quantidade }) => quantidade !== 1)
    ) {
      throw new ErroHttp(
        400,
        'QUANTIDADE_ALUGUEL_INVALIDA',
        'Cada livro deve ser alugado com quantidade igual a um',
      )
    }

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

    if (ofertas.length > 0) {
      const acessosExistentes = await transacao.itemBiblioteca.findMany({
        where: {
          usuarioId: clienteId,
          edicaoId: {
            in: ofertas.map(({ edicao }) => edicao.id),
          },
        },
        select: {
          edicaoId: true,
          tipoAcesso: true,
          acessoExpiraEm: true,
        },
      })
      const edicoesDigitais = new Set(
        ofertasDigitais.map(({ edicao }) => edicao.id),
      )

      if (
        acessosExistentes.some(({ edicaoId, tipoAcesso }) =>
          aluguel
            ? tipoAcesso === TipoAcessoLivro.COMPRA
            : tipoAcesso === TipoAcessoLivro.COMPRA &&
              edicoesDigitais.has(edicaoId),
        )
      ) {
        throw new ErroHttp(
          409,
          'LIVRO_JA_ADQUIRIDO',
          aluguel
            ? 'Um dos livros selecionados ja pertence a sua biblioteca'
            : 'Um dos ebooks selecionados ja esta na sua biblioteca',
        )
      }

      if (
        acessosExistentes.some(
          ({ tipoAcesso, acessoExpiraEm }) =>
            tipoAcesso === TipoAcessoLivro.ALUGUEL &&
            (acessoExpiraEm === null || acessoExpiraEm > agora),
        )
      ) {
        throw new ErroHttp(
          409,
          'ALUGUEL_JA_ATIVO',
          aluguel
            ? 'Um dos livros selecionados ja possui um aluguel ativo'
            : 'Devolva o aluguel ativo antes de comprar este livro',
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
      const preco = aluguel ? oferta.precoAluguel! : oferta.preco
      return total + Math.round(Number(preco) * 100) * item.quantidade
    }, 0)

    const pedido = await transacao.pedido.create({
      data: {
        clienteId,
        vendedorId: entrada.vendedorId,
        status: StatusPedido.PAGO,
        tipo: entrada.tipo,
        valorTotal: valorTotalEmCentavos / 100,
        devolucaoPrevista,
        itens: {
          create: entrada.itens.map((item) => ({
            ofertaId: item.ofertaId,
            quantidade: item.quantidade,
            precoUnitario: aluguel
              ? ofertasPorId.get(item.ofertaId)!.precoAluguel!
              : ofertasPorId.get(item.ofertaId)!.preco,
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
          tipoAcesso: aluguel
            ? TipoAcessoLivro.ALUGUEL
            : TipoAcessoLivro.COMPRA,
          acessoExpiraEm: devolucaoPrevista,
        },
        update: aluguel
          ? {
              itemPedidoId: item.id,
              tipoAcesso: TipoAcessoLivro.ALUGUEL,
              acessoExpiraEm: devolucaoPrevista,
            }
          : {
              itemPedidoId: item.id,
              tipoAcesso: TipoAcessoLivro.COMPRA,
              acessoExpiraEm: null,
            },
      })
    }

    return mapearPedido(pedido)
  })
}

export async function devolverAluguel(clienteId: string, pedidoId: string) {
  return prisma.$transaction(async (transacao) => {
    const pedido = await transacao.pedido.findFirst({
      where: {
        id: pedidoId,
        clienteId,
        tipo: TipoPedido.ALUGUEL,
      },
      select: selecaoPedido,
    })

    if (!pedido) {
      throw new ErroHttp(
        404,
        'ALUGUEL_NAO_ENCONTRADO',
        'Aluguel nao encontrado',
      )
    }

    if (pedido.devolvidoEm) {
      throw new ErroHttp(
        409,
        'ALUGUEL_JA_DEVOLVIDO',
        'Este aluguel ja foi devolvido',
      )
    }

    const devolvidoEm = new Date()
    const atualizacao = await transacao.pedido.updateMany({
      where: {
        id: pedidoId,
        clienteId,
        tipo: TipoPedido.ALUGUEL,
        devolvidoEm: null,
      },
      data: {
        status: StatusPedido.CONCLUIDO,
        devolvidoEm,
      },
    })

    if (atualizacao.count !== 1) {
      throw new ErroHttp(
        409,
        'ALUGUEL_JA_DEVOLVIDO',
        'Este aluguel ja foi devolvido',
      )
    }

    for (const item of pedido.itens) {
      if (item.oferta.edicao.formato === FormatoLivro.FISICO) {
        await transacao.ofertaLivro.update({
          where: { id: item.oferta.id },
          data: { estoque: { increment: item.quantidade } },
        })
      }
    }

    await transacao.itemBiblioteca.updateMany({
      where: {
        itemPedidoId: { in: pedido.itens.map(({ id }) => id) },
        tipoAcesso: TipoAcessoLivro.ALUGUEL,
      },
      data: { acessoExpiraEm: devolvidoEm },
    })

    const pedidoAtualizado = await transacao.pedido.findUniqueOrThrow({
      where: { id: pedidoId },
      select: selecaoPedido,
    })

    return mapearPedido(pedidoAtualizado)
  })
}
