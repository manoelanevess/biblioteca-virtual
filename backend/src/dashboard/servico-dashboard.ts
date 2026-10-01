import { prisma } from '../database/prisma.js'
import type { Prisma } from '../generated/prisma/client.js'
import {
  FormatoLivro,
  PerfilUsuario,
  StatusOferta,
  StatusPedido,
} from '../generated/prisma/enums.js'

const statusComVenda = [
  StatusPedido.PAGO,
  StatusPedido.ENVIADO,
  StatusPedido.CONCLUIDO,
]

const selecaoPedidoDashboard = {
  id: true,
  status: true,
  valorTotal: true,
  criadoEm: true,
  cliente: {
    select: { id: true, nome: true },
  },
  itens: {
    select: {
      quantidade: true,
      precoUnitario: true,
      oferta: {
        select: {
          edicao: {
            select: {
              formato: true,
              livro: {
                select: { id: true, titulo: true },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PedidoSelect

const selecaoOfertaDashboard = {
  id: true,
  status: true,
  estoque: true,
  edicao: {
    select: {
      formato: true,
      livro: {
        select: { id: true, titulo: true },
      },
    },
  },
  _count: {
    select: { visualizacoes: true },
  },
} satisfies Prisma.OfertaLivroSelect

type PedidoDashboard = Prisma.PedidoGetPayload<{
  select: typeof selecaoPedidoDashboard
}>

type OfertaDashboard = Prisma.OfertaLivroGetPayload<{
  select: typeof selecaoOfertaDashboard
}>

type LivroAgregado = {
  id: string
  titulo: string
  unidades: number
  faturamento: number
  visualizacoes: number
  formatos: Set<FormatoLivro>
}

export async function obterDashboard(
  usuarioId: string,
  perfil: PerfilUsuario,
  meses: number,
) {
  const filtroVendedor =
    perfil === PerfilUsuario.ADMINISTRADOR ? {} : { vendedorId: usuarioId }

  const [pedidos, ofertas] = await prisma.$transaction([
    prisma.pedido.findMany({
      where: {
        ...filtroVendedor,
        status: { in: statusComVenda },
      },
      select: selecaoPedidoDashboard,
      orderBy: { criadoEm: 'desc' },
    }),
    prisma.ofertaLivro.findMany({
      where: filtroVendedor,
      select: selecaoOfertaDashboard,
    }),
  ])

  return montarDashboard(pedidos, ofertas, meses)
}

export function montarDashboard(
  pedidos: PedidoDashboard[],
  ofertas: OfertaDashboard[],
  meses: number,
  agora = new Date(),
) {
  const faturamento = arredondarMoeda(
    pedidos.reduce((total, pedido) => total + Number(pedido.valorTotal), 0),
  )
  const unidadesVendidas = pedidos.reduce(
    (total, pedido) =>
      total +
      pedido.itens.reduce(
        (totalItens, item) => totalItens + item.quantidade,
        0,
      ),
    0,
  )
  const visualizacoes = ofertas.reduce(
    (total, oferta) => total + oferta._count.visualizacoes,
    0,
  )
  const estoqueBaixo = ofertas.filter(
    (oferta) =>
      oferta.status === StatusOferta.ATIVA &&
      oferta.edicao.formato === FormatoLivro.FISICO &&
      (oferta.estoque ?? 0) <= 5,
  )

  return {
    resumo: {
      faturamento,
      pedidos: pedidos.length,
      unidadesVendidas,
      visualizacoes,
      ofertasAtivas: ofertas.filter(
        ({ status }) => status === StatusOferta.ATIVA,
      ).length,
      estoqueBaixo: estoqueBaixo.length,
      ticketMedio: pedidos.length
        ? arredondarMoeda(faturamento / pedidos.length)
        : 0,
      taxaConversao: visualizacoes
        ? Math.round((pedidos.length / visualizacoes) * 1000) / 10
        : 0,
    },
    vendasMensais: montarVendasMensais(pedidos, meses, agora),
    vendasPorFormato: montarVendasPorFormato(pedidos),
    livrosMaisVendidos: montarRankingLivros(pedidos, ofertas),
    pedidosRecentes: pedidos.slice(0, 5).map((pedido) => ({
      id: pedido.id,
      cliente: pedido.cliente,
      status: pedido.status,
      valorTotal: Number(pedido.valorTotal),
      quantidadeItens: pedido.itens.reduce(
        (total, item) => total + item.quantidade,
        0,
      ),
      criadoEm: pedido.criadoEm,
    })),
    alertasEstoque: estoqueBaixo
      .sort((a, b) => (a.estoque ?? 0) - (b.estoque ?? 0))
      .slice(0, 5)
      .map((oferta) => ({
        ofertaId: oferta.id,
        livroId: oferta.edicao.livro.id,
        titulo: oferta.edicao.livro.titulo,
        estoque: oferta.estoque ?? 0,
      })),
  }
}

function montarVendasMensais(
  pedidos: PedidoDashboard[],
  quantidadeMeses: number,
  agora: Date,
) {
  const periodos = Array.from({ length: quantidadeMeses }, (_, indice) => {
    const deslocamento = quantidadeMeses - 1 - indice
    const data = new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth() - deslocamento, 1),
    )

    return {
      mes: chaveMes(data),
      faturamento: 0,
      pedidos: 0,
      unidades: 0,
    }
  })
  const periodosPorMes = new Map(periodos.map((periodo) => [periodo.mes, periodo]))

  for (const pedido of pedidos) {
    const periodo = periodosPorMes.get(chaveMes(pedido.criadoEm))
    if (!periodo) continue

    periodo.faturamento = arredondarMoeda(
      periodo.faturamento + Number(pedido.valorTotal),
    )
    periodo.pedidos += 1
    periodo.unidades += pedido.itens.reduce(
      (total, item) => total + item.quantidade,
      0,
    )
  }

  return periodos
}

function montarVendasPorFormato(pedidos: PedidoDashboard[]) {
  const formatos = new Map<FormatoLivro, { unidades: number; faturamento: number }>([
    [FormatoLivro.FISICO, { unidades: 0, faturamento: 0 }],
    [FormatoLivro.EBOOK, { unidades: 0, faturamento: 0 }],
  ])

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const formato = item.oferta.edicao.formato
      const resumo = formatos.get(formato)!
      resumo.unidades += item.quantidade
      resumo.faturamento = arredondarMoeda(
        resumo.faturamento + Number(item.precoUnitario) * item.quantidade,
      )
    }
  }

  return Array.from(formatos, ([formato, valores]) => ({ formato, ...valores }))
}

function montarRankingLivros(
  pedidos: PedidoDashboard[],
  ofertas: OfertaDashboard[],
) {
  const livros = new Map<string, LivroAgregado>()

  function obterLivro(id: string, titulo: string) {
    const existente = livros.get(id)
    if (existente) return existente

    const novoLivro: LivroAgregado = {
      id,
      titulo,
      unidades: 0,
      faturamento: 0,
      visualizacoes: 0,
      formatos: new Set(),
    }
    livros.set(id, novoLivro)
    return novoLivro
  }

  for (const oferta of ofertas) {
    const livro = obterLivro(oferta.edicao.livro.id, oferta.edicao.livro.titulo)
    livro.visualizacoes += oferta._count.visualizacoes
    livro.formatos.add(oferta.edicao.formato)
  }

  for (const pedido of pedidos) {
    for (const item of pedido.itens) {
      const dadosLivro = item.oferta.edicao.livro
      const livro = obterLivro(dadosLivro.id, dadosLivro.titulo)
      livro.unidades += item.quantidade
      livro.faturamento = arredondarMoeda(
        livro.faturamento + Number(item.precoUnitario) * item.quantidade,
      )
      livro.formatos.add(item.oferta.edicao.formato)
    }
  }

  return Array.from(livros.values())
    .sort(
      (a, b) =>
        b.unidades - a.unidades ||
        b.faturamento - a.faturamento ||
        b.visualizacoes - a.visualizacoes,
    )
    .slice(0, 5)
    .map(({ formatos, ...livro }) => ({
      ...livro,
      formatos: Array.from(formatos),
    }))
}

function chaveMes(data: Date) {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}

function arredondarMoeda(valor: number) {
  return Math.round(valor * 100) / 100
}
