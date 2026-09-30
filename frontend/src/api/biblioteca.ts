import { ApiError } from './autenticacao'
import type { BookFormat, CatalogAuthor, CatalogCategory } from './catalogo'

export type ReadingStatus = 'NAO_INICIADO' | 'LENDO' | 'CONCLUIDO'

export type LibraryItem = {
  id: string
  statusLeitura: ReadingStatus
  percentualLido: number
  paginaAtual: number | null
  ultimaLeituraEm: string | null
  adicionadoEm: string
  atualizadoEm: string
  edicao: {
    id: string
    isbn: string | null
    formato: BookFormat
    editora: string | null
    anoPublicacao: number | null
    numeroPaginas: number | null
    acessoDigitalDisponivel: boolean
    livro: {
      id: string
      titulo: string
      sinopse: string | null
      urlCapa: string | null
      autores: CatalogAuthor[]
      categorias: CatalogCategory[]
    }
  }
}

export type UpdateReadingProgressInput = {
  statusLeitura: ReadingStatus
  percentualLido: number
  paginaAtual?: number | null
}

export async function getPersonalLibrary(token: string) {
  const response = await libraryRequest<{ itens: LibraryItem[] }>('', token)
  return response.itens
}

export async function updateReadingProgress(
  token: string,
  itemId: string,
  input: UpdateReadingProgressInput,
) {
  const response = await libraryRequest<{ item: LibraryItem }>(
    `/${itemId}/progresso`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  )

  return response.item
}

async function libraryRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
) {
  let response: Response

  try {
    response = await fetch(`/api/biblioteca${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor.',
      'CONEXAO_INDISPONIVEL',
      0,
    )
  }

  const body = (await response.json().catch(() => null)) as
    | T
    | { erro?: { codigo?: string; mensagem?: string } }
    | null

  if (!response.ok) {
    const apiError = body as {
      erro?: { codigo?: string; mensagem?: string }
    } | null

    throw new ApiError(
      apiError?.erro?.mensagem ?? 'Não foi possível concluir a operação.',
      apiError?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      response.status,
    )
  }

  return body as T
}
