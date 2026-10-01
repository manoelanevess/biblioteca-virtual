import { ApiError } from './autenticacao'
import { apiUrl } from './base'
import type { BookFormat } from './catalogo'

export type DashboardPeriod = 6 | 12

export type SellerDashboardData = {
  resumo: {
    faturamento: number
    pedidos: number
    unidadesVendidas: number
    visualizacoes: number
    ofertasAtivas: number
    estoqueBaixo: number
    ticketMedio: number
    taxaConversao: number
  }
  vendasMensais: Array<{
    mes: string
    faturamento: number
    pedidos: number
    unidades: number
  }>
  vendasPorFormato: Array<{
    formato: BookFormat
    unidades: number
    faturamento: number
  }>
  livrosMaisVendidos: Array<{
    id: string
    titulo: string
    unidades: number
    faturamento: number
    visualizacoes: number
    formatos: BookFormat[]
  }>
  pedidosRecentes: Array<{
    id: string
    cliente: {
      id: string
      nome: string
    }
    status: 'PAGO' | 'ENVIADO' | 'CONCLUIDO'
    valorTotal: number
    quantidadeItens: number
    criadoEm: string
  }>
  alertasEstoque: Array<{
    ofertaId: string
    livroId: string
    titulo: string
    estoque: number
  }>
}

export async function getSellerDashboard(
  token: string,
  period: DashboardPeriod,
) {
  let response: Response

  try {
    response = await fetch(apiUrl(`/api/dashboard?meses=${period}`), {
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor.',
      'CONEXAO_INDISPONIVEL',
      0,
    )
  }

  const body = (await response.json().catch(() => null)) as
    | { dashboard?: SellerDashboardData; erro?: { codigo?: string; mensagem?: string } }
    | null

  if (!response.ok || !body?.dashboard) {
    throw new ApiError(
      body?.erro?.mensagem ?? 'Não foi possível carregar o dashboard.',
      body?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      response.status,
    )
  }

  return body.dashboard
}
