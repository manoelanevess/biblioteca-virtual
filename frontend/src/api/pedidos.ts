import { ApiError } from './autenticacao'

export type EnderecoEntregaEntrada = {
  destinatario: string
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
}

export type CriarPedidoEntrada = {
  vendedorId: string
  itens: Array<{
    ofertaId: string
    quantidade: number
  }>
  enderecoEntrega?: EnderecoEntregaEntrada
}

export type PedidoCriado = {
  id: string
  status: 'PAGO'
  valorTotal: number
  criadoEm: string
}

export async function criarPedido(
  token: string,
  entrada: CriarPedidoEntrada,
) {
  let response: Response

  try {
    response = await fetch('/api/pedidos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(entrada),
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor.',
      'CONEXAO_INDISPONIVEL',
      0,
    )
  }

  const body = (await response.json().catch(() => null)) as
    | { pedido?: PedidoCriado; erro?: { codigo?: string; mensagem?: string } }
    | null

  if (!response.ok || !body?.pedido) {
    throw new ApiError(
      body?.erro?.mensagem ?? 'Não foi possível concluir a compra.',
      body?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      response.status,
    )
  }

  return body.pedido
}
