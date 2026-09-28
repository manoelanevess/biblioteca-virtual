import { ApiError } from './autenticacao'

export type BookFormat = 'FISICO' | 'EBOOK'
export type OfferStatus = 'RASCUNHO' | 'ATIVA' | 'INATIVA'

export type CatalogAuthor = {
  id: string
  nome: string
}

export type CatalogCategory = {
  id: string
  nome: string
}

export type CatalogEdition = {
  id: string
  isbn: string | null
  formato: BookFormat
  editora: string | null
  anoPublicacao: number | null
}

export type CatalogReferenceBook = {
  id: string
  titulo: string
  edicoes: CatalogEdition[]
}

export type CatalogReferences = {
  autores: CatalogAuthor[]
  categorias: CatalogCategory[]
  livros: CatalogReferenceBook[]
}

export type ManagedOffer = {
  id: string
  preco: number
  estoque: number | null
  status: OfferStatus
  possuiArquivoDigital: boolean
  edicao: CatalogEdition & {
    livro: {
      id: string
      titulo: string
      urlCapa: string | null
    }
  }
  metricas: {
    visualizacoes: number
    vendas: number
  }
  criadoEm: string
  atualizadoEm: string
}

export type NewBookInput = {
  titulo: string
  sinopse?: string
  urlCapa?: string
  idioma: string
  autorIds: string[]
  categoriaIds: string[]
}

export type NewEditionInput = {
  livroId: string
  isbn?: string
  formato: BookFormat
  editora?: string
  anoPublicacao?: number
  numeroPaginas?: number
}

export type NewOfferInput =
  | {
      edicaoId: string
      formato: 'FISICO'
      preco: number
      estoque: number
    }
  | {
      edicaoId: string
      formato: 'EBOOK'
      preco: number
      chaveArquivoDigital: string
    }

export async function getCatalogReferences(token: string) {
  return catalogRequest<CatalogReferences>('/referencias', token)
}

export async function getManagedOffers(token: string) {
  const response = await catalogRequest<{ ofertas: ManagedOffer[] }>(
    '/ofertas',
    token,
  )
  return response.ofertas
}

export async function createAuthor(token: string, nome: string) {
  const response = await catalogRequest<{ autor: CatalogAuthor }>(
    '/autores',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ nome }),
    },
  )
  return response.autor
}

export async function createCategory(token: string, nome: string) {
  const response = await catalogRequest<{ categoria: CatalogCategory }>(
    '/categorias',
    token,
    {
      method: 'POST',
      body: JSON.stringify({ nome }),
    },
  )
  return response.categoria
}

export async function createBook(token: string, input: NewBookInput) {
  const response = await catalogRequest<{ livro: { id: string } }>(
    '/livros',
    token,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return response.livro
}

export async function createEdition(token: string, input: NewEditionInput) {
  const response = await catalogRequest<{ edicao: CatalogEdition }>(
    '/edicoes',
    token,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return response.edicao
}

export async function createOffer(token: string, input: NewOfferInput) {
  const response = await catalogRequest<{ oferta: ManagedOffer }>(
    '/ofertas',
    token,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return response.oferta
}

export async function changeOfferStatus(
  token: string,
  offerId: string,
  status: OfferStatus,
) {
  const response = await catalogRequest<{ oferta: ManagedOffer }>(
    `/ofertas/${offerId}/status`,
    token,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
  )
  return response.oferta
}

async function catalogRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(`/api/gerenciamento/catalogo${path}`, {
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
