import { ApiError } from './autenticacao'
import { apiUrl } from './base'

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
  precoAluguel: number | null
  estoque: number | null
  status: OfferStatus
  possuiArquivoDigital: boolean
  edicao: CatalogEdition & {
    livro: {
      id: string
      titulo: string
      urlCapa: string | null
      destaque: boolean
    }
  }
  metricas: {
    visualizacoes: number
    vendas: number
  }
  criadoEm: string
  atualizadoEm: string
}

export type PublicOffer = {
  id: string
  preco: number
  precoAluguel: number | null
  estoque: number | null
  vendedor: {
    id: string
    nome: string
  }
}

export type PublicEdition = CatalogEdition & {
  numeroPaginas: number | null
  precoInicial: number
  ofertas: PublicOffer[]
}

export type PublicBook = {
  id: string
  titulo: string
  sinopse: string | null
  urlCapa: string | null
  idioma: string
  destaque: boolean
  enriquecidoPorIa: boolean
  autores: CatalogAuthor[]
  categorias: CatalogCategory[]
  avaliacao: {
    media: number | null
    quantidade: number
  }
  edicoes: PublicEdition[]
}

export type PublicCategory = CatalogCategory & {
  descricao: string | null
}

export type CatalogPage = {
  livros: PublicBook[]
  paginacao: {
    pagina: number
    limite: number
    total: number
    totalPaginas: number
  }
}

export type PublicCatalogFilters = {
  termo?: string
  formato?: BookFormat
  categoriaId?: string
  destaque?: boolean
  ordenacao?: 'TITULO' | 'MAIS_RECENTES' | 'MELHOR_AVALIADOS' | 'MENOR_AVALIADOS'
  pagina?: number
  limite?: number
}

export type NewBookInput = {
  titulo: string
  sinopse?: string
  urlCapa?: string
  idioma: string
  destaque?: boolean
  enriquecidoPorIa?: boolean
  autorIds: string[]
  categoriaIds: string[]
}

export type BookSuggestion = {
  autorSugerido: string
  sinopse: string
  categoriaSugerida: string
  idioma: string
  editoraSugerida: string | null
  anoPublicacaoSugerido: number | null
  numeroPaginasSugerido: number | null
}

export type BookSuggestionInput = {
  titulo: string
  autor?: string
  isbn?: string
  formatos: BookFormat[]
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
      precoAluguel?: number
      estoque: number
    }
  | {
      edicaoId: string
      formato: 'EBOOK'
      preco: number
      precoAluguel?: number
      chaveArquivoDigital: string
    }

export async function getPublicBooks(filters: PublicCatalogFilters = {}) {
  const searchParams = new URLSearchParams()

  if (filters.termo) searchParams.set('termo', filters.termo)
  if (filters.formato) searchParams.set('formato', filters.formato)
  if (filters.categoriaId) {
    searchParams.set('categoriaId', filters.categoriaId)
  }
  if (filters.destaque !== undefined) {
    searchParams.set('destaque', String(filters.destaque))
  }
  if (filters.ordenacao) searchParams.set('ordenacao', filters.ordenacao)
  if (filters.pagina) searchParams.set('pagina', String(filters.pagina))
  if (filters.limite) searchParams.set('limite', String(filters.limite))

  const query = searchParams.toString()
  return publicCatalogRequest<CatalogPage>(`/livros${query ? `?${query}` : ''}`)
}

export async function getPublicBook(bookId: string) {
  const response = await publicCatalogRequest<{ livro: PublicBook }>(
    `/livros/${bookId}`,
  )
  return response.livro
}

export async function getPublicCategories() {
  const response = await publicCatalogRequest<{
    categorias: PublicCategory[]
  }>('/categorias')
  return response.categorias
}

export async function registerOfferView(offerId: string) {
  const storageKey = 'biblioteca-virtual-visitor'
  let sessionId = localStorage.getItem(storageKey)

  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem(storageKey, sessionId)
  }

  await fetch(apiUrl(`/api/catalogo/ofertas/${offerId}/visualizacoes`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessaoId: sessionId }),
  })
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

export async function getBookSuggestion(
  token: string,
  input: BookSuggestionInput,
) {
  const response = await catalogRequest<{ sugestao: BookSuggestion }>(
    '/livros/sugestao-ia',
    token,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
  return response.sugestao
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

export async function changeBookHighlight(
  token: string,
  bookId: string,
  destaque: boolean,
) {
  const response = await catalogRequest<{
    livro: { id: string; titulo: string; destaque: boolean }
  }>(`/livros/${bookId}/destaque`, token, {
    method: 'PATCH',
    body: JSON.stringify({ destaque }),
  })
  return response.livro
}

async function catalogRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(`/api/gerenciamento/catalogo${path}`), {
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

async function publicCatalogRequest<T>(path: string): Promise<T> {
  let response: Response

  try {
    response = await fetch(apiUrl(`/api/catalogo${path}`))
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
      apiError?.erro?.mensagem ?? 'Não foi possível carregar o catálogo.',
      apiError?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      response.status,
    )
  }

  return body as T
}
