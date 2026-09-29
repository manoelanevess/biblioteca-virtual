import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import {
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackageOpen,
  Search,
  Star,
  TabletSmartphone,
  X,
} from 'lucide-react'
import { ApiError } from './api/autenticacao'
import {
  getPublicBook,
  getPublicBooks,
  getPublicCategories,
  type BookFormat,
  type PublicBook,
  type PublicCategory,
  type PublicEdition,
} from './api/catalogo'
import './CustomerCatalog.css'

type FormatFilter = 'TODOS' | BookFormat

const emptyPagination = {
  pagina: 1,
  limite: 8,
  total: 0,
  totalPaginas: 0,
}

export function CustomerCatalog() {
  const [books, setBooks] = useState<PublicBook[]>([])
  const [categories, setCategories] = useState<PublicCategory[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchDraft, setSearchDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [format, setFormat] = useState<FormatFilter>('TODOS')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailReloadVersion, setDetailReloadVersion] = useState(0)

  useEffect(() => {
    let active = true

    getPublicCategories()
      .then((nextCategories) => {
        if (active) setCategories(nextCategories)
      })
      .catch(() => {
        if (active) setCategories([])
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    getPublicBooks({
      termo: searchTerm || undefined,
      formato: format === 'TODOS' ? undefined : format,
      categoriaId: categoryId || undefined,
      pagina: page,
      limite: emptyPagination.limite,
    })
      .then((result) => {
        if (!active) return
        setBooks(result.livros)
        setPagination(result.paginacao)
      })
      .catch((loadError: unknown) => {
        if (!active) return
        setBooks([])
        setPagination({ ...emptyPagination, pagina: page })
        setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [categoryId, format, page, reloadVersion, searchTerm])

  useEffect(() => {
    if (!selectedBookId) return

    let active = true

    getPublicBook(selectedBookId)
      .then((book) => {
        if (active) setSelectedBook(book)
      })
      .catch((loadError: unknown) => {
        if (active) setDetailError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })

    return () => {
      active = false
    }
  }, [detailReloadVersion, selectedBookId])

  useEffect(() => {
    if (!selectedBookId) return

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedBookId(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedBookId])

  const hasFilters = Boolean(searchTerm || categoryId || format !== 'TODOS')
  const resultLabel = useMemo(() => {
    if (loading) return 'Buscando livros'
    if (pagination.total === 1) return '1 livro encontrado'
    return `${pagination.total} livros encontrados`
  }, [loading, pagination.total])

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextTerm = searchDraft.trim()

    prepareCatalogLoad()
    setPage(1)
    setSearchTerm(nextTerm.length >= 2 ? nextTerm : '')
  }

  function clearFilters() {
    prepareCatalogLoad()
    setSearchDraft('')
    setSearchTerm('')
    setFormat('TODOS')
    setCategoryId('')
    setPage(1)
  }

  function prepareCatalogLoad() {
    setLoading(true)
    setError(null)
  }

  function openDetail(bookId: string) {
    setSelectedBook(null)
    setDetailError(null)
    setDetailLoading(true)
    setSelectedBookId(bookId)
  }

  function closeDetail() {
    setSelectedBookId(null)
    setSelectedBook(null)
    setDetailError(null)
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) closeDetail()
  }

  return (
    <section className="customer-catalog">
      <header className="catalog-heading">
        <div>
          <p className="section-label">Explore o catálogo</p>
          <h1>Encontre sua próxima leitura</h1>
          <p>Compare formatos e ofertas de livros físicos e digitais.</p>
        </div>
        <span className="catalog-result-count" role="status">
          {resultLabel}
        </span>
      </header>

      <div className="catalog-filters">
        <form className="public-search" onSubmit={handleSearch}>
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Título, autor, categoria ou ISBN"
            aria-label="Pesquisar no catálogo"
          />
          <button type="submit">Buscar</button>
        </form>

        <div className="filter-row">
          <div className="format-filter" aria-label="Filtrar por formato">
            {(
              [
                ['TODOS', 'Todos'],
                ['FISICO', 'Físicos'],
                ['EBOOK', 'E-books'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={format === value ? 'active' : undefined}
                aria-pressed={format === value}
                onClick={() => {
                  prepareCatalogLoad()
                  setFormat(value)
                  setPage(1)
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            className="category-filter"
            value={categoryId}
            onChange={(event) => {
              prepareCatalogLoad()
              setCategoryId(event.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas as categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              className="clear-filters"
              type="button"
              onClick={clearFilters}
            >
              <X size={16} aria-hidden="true" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="catalog-feedback error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              prepareCatalogLoad()
              setReloadVersion((version) => version + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="public-catalog-loading" aria-label="Carregando livros">
          <LoaderCircle size={26} aria-hidden="true" />
          <span>Carregando catálogo</span>
        </div>
      ) : books.length ? (
        <>
          <div className="book-grid">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onOpen={() => openDetail(book.id)}
              />
            ))}
          </div>

          {pagination.totalPaginas > 1 && (
            <nav className="catalog-pagination" aria-label="Paginação">
              <button
                type="button"
                onClick={() => {
                  prepareCatalogLoad()
                  setPage((current) => current - 1)
                }}
                disabled={page === 1}
                aria-label="Página anterior"
                title="Página anterior"
              >
                <ChevronLeft size={19} aria-hidden="true" />
              </button>
              <span>
                Página <strong>{pagination.pagina}</strong> de{' '}
                {pagination.totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => {
                  prepareCatalogLoad()
                  setPage((current) => current + 1)
                }}
                disabled={page === pagination.totalPaginas}
                aria-label="Próxima página"
                title="Próxima página"
              >
                <ChevronRight size={19} aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="public-catalog-empty">
          <span aria-hidden="true">
            <PackageOpen size={29} />
          </span>
          <h2>{hasFilters ? 'Nenhum livro encontrado' : 'Catálogo vazio'}</h2>
          <p>
            {hasFilters
              ? 'Tente outros termos ou ajuste os filtros.'
              : 'Os livros publicados pelos vendedores aparecerão aqui.'}
          </p>
          {hasFilters && (
            <button type="button" onClick={clearFilters}>
              Ver todo o catálogo
            </button>
          )}
        </div>
      )}

      {selectedBookId && (
        <div
          className="book-detail-overlay"
          role="presentation"
          onMouseDown={handleBackdropClick}
        >
          <section
            className="book-detail"
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-detail-title"
          >
            <button
              className="detail-close"
              type="button"
              onClick={closeDetail}
              aria-label="Fechar detalhes"
              title="Fechar detalhes"
            >
              <X size={20} aria-hidden="true" />
            </button>

            {detailLoading ? (
              <div className="detail-loading" aria-label="Carregando detalhes">
                <LoaderCircle size={26} aria-hidden="true" />
              </div>
            ) : detailError ? (
              <div className="detail-error" role="alert">
                <p>{detailError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setDetailLoading(true)
                    setDetailError(null)
                    setDetailReloadVersion((version) => version + 1)
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            ) : selectedBook ? (
              <BookDetail book={selectedBook} />
            ) : null}
          </section>
        </div>
      )}
    </section>
  )
}

function BookCard({ book, onOpen }: { book: PublicBook; onOpen: () => void }) {
  const lowestPrice = Math.min(
    ...book.edicoes.map((edition) => edition.precoInicial),
  )
  const formats = [...new Set(book.edicoes.map((edition) => edition.formato))]

  return (
    <article className="book-card">
      <BookCover book={book} />
      <div className="book-card-content">
        <div className="book-card-meta">
          <span>{book.categorias[0]?.nome ?? 'Literatura'}</span>
          <Rating book={book} />
        </div>
        <h2>{book.titulo}</h2>
        <p className="book-authors">{formatAuthors(book)}</p>
        <p className="book-synopsis">
          {book.sinopse ?? 'Sinopse ainda não informada.'}
        </p>
        <div className="book-formats" aria-label="Formatos disponíveis">
          {formats.map((availableFormat) => (
            <FormatLabel key={availableFormat} format={availableFormat} />
          ))}
        </div>
        <footer>
          <span>
            a partir de <strong>{formatCurrency(lowestPrice)}</strong>
          </span>
          <button type="button" onClick={onOpen}>
            Ver detalhes
          </button>
        </footer>
      </div>
    </article>
  )
}

function BookDetail({ book }: { book: PublicBook }) {
  return (
    <div className="book-detail-content">
      <div className="detail-summary">
        <BookCover book={book} large />
        <div>
          <p className="section-label">
            {book.categorias.map((category) => category.nome).join(' · ') ||
              'Literatura'}
          </p>
          <h2 id="book-detail-title">{book.titulo}</h2>
          <p className="detail-authors">{formatAuthors(book)}</p>
          <Rating book={book} expanded />
          <p className="detail-synopsis">
            {book.sinopse ?? 'Sinopse ainda não informada.'}
          </p>
        </div>
      </div>

      <div className="edition-list">
        <h3>Edições e ofertas</h3>
        {book.edicoes.map((edition) => (
          <EditionOffers key={edition.id} edition={edition} />
        ))}
      </div>
    </div>
  )
}

function EditionOffers({ edition }: { edition: PublicEdition }) {
  const metadata = [
    edition.editora,
    edition.anoPublicacao ? String(edition.anoPublicacao) : null,
    edition.numeroPaginas ? `${edition.numeroPaginas} páginas` : null,
    edition.isbn ? `ISBN ${edition.isbn}` : null,
  ].filter(Boolean)

  return (
    <section className="edition-item">
      <header>
        <FormatLabel format={edition.formato} />
        <span>{metadata.join(' · ') || 'Dados editoriais não informados'}</span>
      </header>
      <div className="offer-list">
        {edition.ofertas.map((offer) => (
          <div className="public-offer" key={offer.id}>
            <span>
              <strong>{offer.vendedor.nome}</strong>
              <small>
                {edition.formato === 'FISICO'
                  ? `${offer.estoque} em estoque`
                  : 'Acesso digital'}
              </small>
            </span>
            <strong>{formatCurrency(offer.preco)}</strong>
          </div>
        ))}
      </div>
    </section>
  )
}

function BookCover({ book, large = false }: { book: PublicBook; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(book.urlCapa && !imageFailed)

  return (
    <div className={`public-book-cover${large ? ' large' : ''}`}>
      {showImage ? (
        <img
          src={book.urlCapa ?? undefined}
          alt={`Capa de ${book.titulo}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">
          <BookOpen size={large ? 34 : 27} />
          <strong>{getCoverMark(book.titulo)}</strong>
        </span>
      )}
    </div>
  )
}

function FormatLabel({ format }: { format: BookFormat }) {
  return (
    <span className={`public-format ${format.toLowerCase()}`}>
      {format === 'FISICO' ? (
        <BookText size={14} aria-hidden="true" />
      ) : (
        <TabletSmartphone size={14} aria-hidden="true" />
      )}
      {format === 'FISICO' ? 'Físico' : 'E-book'}
    </span>
  )
}

function Rating({ book, expanded = false }: { book: PublicBook; expanded?: boolean }) {
  if (book.avaliacao.media === null) {
    return <span className="book-rating muted">Sem avaliações</span>
  }

  return (
    <span className="book-rating">
      <Star size={14} fill="currentColor" aria-hidden="true" />
      <strong>{book.avaliacao.media.toLocaleString('pt-BR')}</strong>
      {expanded && (
        <small>
          ({book.avaliacao.quantidade}{' '}
          {book.avaliacao.quantidade === 1 ? 'avaliação' : 'avaliações'})
        </small>
      )}
    </span>
  )
}

function formatAuthors(book: PublicBook) {
  return book.autores.map((author) => author.nome).join(', ') || 'Autor não informado'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function getCoverMark(title: string) {
  return title
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar o catálogo.'
}
