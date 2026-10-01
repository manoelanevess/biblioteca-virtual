import { ApiError } from './autenticacao'
import { apiUrl } from './base'

export type BookReview = {
  id: string
  nota: number
  comentario: string | null
  resposta: string | null
  respondidaEm: string | null
  criadoEm: string
  atualizadoEm: string
  usuario: {
    id: string
    nome: string
  }
  livro: {
    id: string
    titulo: string
    urlCapa: string | null
  }
}

export async function getBookReviews(bookId: string) {
  const response = await reviewsRequest<{ avaliacoes: BookReview[] }>(
    `/livros/${bookId}`,
  )
  return response.avaliacoes
}

export async function saveBookReview(
  token: string,
  bookId: string,
  input: { nota: number; comentario: string },
) {
  const response = await reviewsRequest<{ avaliacao: BookReview }>(
    `/livros/${bookId}`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )
  return response.avaliacao
}

export async function getMyReviews(token: string) {
  const response = await reviewsRequest<{ avaliacoes: BookReview[] }>(
    '/minhas',
    token,
  )
  return response.avaliacoes
}

export async function getManagedReviews(token: string) {
  const response = await reviewsRequest<{ avaliacoes: BookReview[] }>(
    '/gerenciamento',
    token,
  )
  return response.avaliacoes
}

export async function replyToReview(
  token: string,
  reviewId: string,
  resposta: string,
) {
  const response = await reviewsRequest<{ avaliacao: BookReview }>(
    `/${reviewId}/resposta`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ resposta }),
    },
  )
  return response.avaliacao
}

export async function deleteReview(token: string, reviewId: string) {
  await reviewsRequest<null>(`/${reviewId}`, token, { method: 'DELETE' })
}

async function reviewsRequest<T>(
  path: string,
  token?: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(`/api/avaliacoes${path}`), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  const body = response.status === 204
    ? null
    : ((await response.json().catch(() => null)) as
        | T
        | { erro?: { codigo?: string; mensagem?: string } }
        | null)

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
