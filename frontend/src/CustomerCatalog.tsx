import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import {
  ArrowLeft,
  BookOpen,
  BookText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  MapPin,
  PackageOpen,
  Search,
  ShoppingBag,
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
  type PublicOffer,
} from './api/catalogo'
import {
  criarPedido,
  type EnderecoEntregaEntrada,
  type PedidoCriado,
} from './api/pedidos'
import { BookReviews } from './BookReviews'
import './CustomerCatalog.css'

type FormatFilter = 'TODOS' | BookFormat
type CatalogOrder =
  | 'TITULO'
  | 'MAIS_RECENTES'
  | 'MELHOR_AVALIADOS'
  | 'MENOR_AVALIADOS'

const emptyPagination = {
  pagina: 1,
  limite: 8,
  total: 0,
  totalPaginas: 0,
}

const brazilianStates = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

type CustomerCatalogProps = {
  token: string | null
  currentUserId: string | null
  canReview?: boolean
  onAuthenticationRequired?: () => void
}

type CheckoutSelection = {
  book: PublicBook
  edition: PublicEdition
  offer: PublicOffer
}

export function CustomerCatalog({
  token,
  currentUserId,
  canReview = false,
  onAuthenticationRequired,
}: CustomerCatalogProps) {
  const [books, setBooks] = useState<PublicBook[]>([])
  const [categories, setCategories] = useState<PublicCategory[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchDraft, setSearchDraft] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [format, setFormat] = useState<FormatFilter>('TODOS')
  const [categoryId, setCategoryId] = useState('')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [order, setOrder] = useState<CatalogOrder>('TITULO')
  const [page, setPage] = useState(1)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<PublicBook | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailReloadVersion, setDetailReloadVersion] = useState(0)
  const [checkout, setCheckout] = useState<CheckoutSelection | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PedidoCriado | null>(
    null,
  )

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
      destaque: featuredOnly || undefined,
      ordenacao: order,
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
  }, [categoryId, featuredOnly, format, order, page, reloadVersion, searchTerm])

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

  const hasFilters = Boolean(
    searchTerm || categoryId || format !== 'TODOS' || featuredOnly,
  )
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
    setFeaturedOnly(false)
    setOrder('TITULO')
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
    setCheckout(null)
    setPurchaseResult(null)
    setSelectedBookId(bookId)
  }

  function closeDetail() {
    setSelectedBookId(null)
    setSelectedBook(null)
    setDetailError(null)
    setCheckout(null)
    setPurchaseResult(null)
  }

  function startCheckout(
    book: PublicBook,
    edition: PublicEdition,
    offer: PublicOffer,
  ) {
    if (!token) {
      onAuthenticationRequired?.()
      return
    }

    setPurchaseResult(null)
    setCheckout({ book, edition, offer })
  }

  function finishPurchase(pedido: PedidoCriado) {
    setPurchaseResult(pedido)
    setCheckout(null)
    prepareCatalogLoad()
    setReloadVersion((version) => version + 1)
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

          <select
            className="order-filter"
            value={order}
            onChange={(event) => {
              prepareCatalogLoad()
              setOrder(event.target.value as CatalogOrder)
              setPage(1)
            }}
            aria-label="Ordenar livros"
          >
            <option value="TITULO">Título: A-Z</option>
            <option value="MAIS_RECENTES">Mais recentes</option>
            <option value="MELHOR_AVALIADOS">Melhores avaliações</option>
            <option value="MENOR_AVALIADOS">Menores avaliações</option>
          </select>

          <button
            className={`featured-filter${featuredOnly ? ' active' : ''}`}
            type="button"
            aria-pressed={featuredOnly}
            onClick={() => {
              prepareCatalogLoad()
              setFeaturedOnly((current) => !current)
              setPage(1)
            }}
          >
            <Star
              size={16}
              fill={featuredOnly ? 'currentColor' : 'none'}
              aria-hidden="true"
            />
            Destaques
          </button>

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
            aria-labelledby={
              purchaseResult
                ? 'purchase-success-title'
                : checkout
                  ? 'checkout-title'
                  : 'book-detail-title'
            }
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

            {purchaseResult ? (
              <PurchaseSuccess
                pedido={purchaseResult}
                onClose={closeDetail}
              />
            ) : checkout ? (
              token ? (
                <PurchaseCheckout
                  token={token}
                  selection={checkout}
                  onBack={() => setCheckout(null)}
                  onComplete={finishPurchase}
                />
              ) : null
            ) : detailLoading ? (
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
              <BookDetail
                book={selectedBook}
                token={token}
                currentUserId={currentUserId}
                authenticated={Boolean(token)}
                canReview={canReview}
                onAuthenticationRequired={onAuthenticationRequired}
                onBuy={(edition, offer) =>
                  startCheckout(selectedBook, edition, offer)
                }
              />
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

type BookDetailProps = {
  book: PublicBook
  token: string | null
  currentUserId: string | null
  authenticated: boolean
  canReview: boolean
  onAuthenticationRequired?: () => void
  onBuy: (edition: PublicEdition, offer: PublicOffer) => void
}

function BookDetail({
  book,
  token,
  currentUserId,
  authenticated,
  canReview,
  onAuthenticationRequired,
  onBuy,
}: BookDetailProps) {
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
          <EditionOffers
            key={edition.id}
            edition={edition}
            currentUserId={currentUserId}
            authenticated={authenticated}
            onBuy={(offer) => onBuy(edition, offer)}
          />
        ))}
      </div>

      <BookReviews
        bookId={book.id}
        token={token}
        currentUserId={currentUserId}
        canReview={canReview}
        onAuthenticationRequired={onAuthenticationRequired}
      />
    </div>
  )
}

type EditionOffersProps = {
  edition: PublicEdition
  currentUserId: string | null
  authenticated: boolean
  onBuy: (offer: PublicOffer) => void
}

function EditionOffers({
  edition,
  currentUserId,
  authenticated,
  onBuy,
}: EditionOffersProps) {
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
        {edition.ofertas.map((offer) => {
          const isOwnOffer = offer.vendedor.id === currentUserId
          const isUnavailable =
            edition.formato === 'FISICO' && (offer.estoque ?? 0) <= 0

          return (
            <div className="public-offer" key={offer.id}>
              <span>
                <strong>{offer.vendedor.nome}</strong>
                <small>
                  {edition.formato === 'FISICO'
                    ? `${offer.estoque} em estoque`
                    : 'Acesso digital'}
                </small>
              </span>
              <div className="public-offer-actions">
                <strong>{formatCurrency(offer.preco)}</strong>
                <button
                  type="button"
                  onClick={() => onBuy(offer)}
                  disabled={isOwnOffer || isUnavailable}
                  title={isOwnOffer ? 'Esta oferta pertence a você' : undefined}
                >
                  {isOwnOffer
                    ? 'Sua oferta'
                    : authenticated
                      ? 'Comprar'
                      : 'Entrar para comprar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type PurchaseCheckoutProps = {
  token: string
  selection: CheckoutSelection
  onBack: () => void
  onComplete: (pedido: PedidoCriado) => void
}

function PurchaseCheckout({
  token,
  selection,
  onBack,
  onComplete,
}: PurchaseCheckoutProps) {
  const { book, edition, offer } = selection
  const isPhysical = edition.formato === 'FISICO'
  const maximumQuantity = isPhysical ? (offer.estoque ?? 1) : 1
  const [quantity, setQuantity] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)
  const total = offer.preco * quantity

  async function handlePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setPurchaseError(null)

    const formData = new FormData(event.currentTarget)
    let enderecoEntrega: EnderecoEntregaEntrada | undefined

    if (isPhysical) {
      const complemento = String(formData.get('complemento') ?? '').trim()
      enderecoEntrega = {
        destinatario: String(formData.get('destinatario') ?? ''),
        cep: String(formData.get('cep') ?? '').replace(/\D/g, ''),
        logradouro: String(formData.get('logradouro') ?? ''),
        numero: String(formData.get('numero') ?? ''),
        ...(complemento ? { complemento } : {}),
        bairro: String(formData.get('bairro') ?? ''),
        cidade: String(formData.get('cidade') ?? ''),
        estado: String(formData.get('estado') ?? ''),
      }
    }

    try {
      const pedido = await criarPedido(token, {
        vendedorId: offer.vendedor.id,
        itens: [{ ofertaId: offer.id, quantidade: quantity }],
        enderecoEntrega,
      })
      onComplete(pedido)
    } catch (error) {
      setPurchaseError(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível concluir a compra.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="purchase-checkout">
      <header className="checkout-heading">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          aria-label="Voltar para os detalhes"
          title="Voltar para os detalhes"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </button>
        <div>
          <p className="section-label">Finalizar compra</p>
          <h2 id="checkout-title">Revise seu pedido</h2>
        </div>
      </header>

      <form className="checkout-form" onSubmit={handlePurchase}>
        <section className="checkout-product" aria-label="Item do pedido">
          <BookCover book={book} />
          <div>
            <FormatLabel format={edition.formato} />
            <h3>{book.titulo}</h3>
            <p>{formatAuthors(book)}</p>
            <small>Vendido por {offer.vendedor.nome}</small>
          </div>
          <strong>{formatCurrency(offer.preco)}</strong>
        </section>

        {isPhysical ? (
          <>
            <div className="checkout-section-heading">
              <span aria-hidden="true">
                <MapPin size={18} />
              </span>
              <div>
                <h3>Endereço de entrega</h3>
                <p>Informe onde o livro físico deve ser entregue.</p>
              </div>
            </div>

            <div className="checkout-fields">
              <label className="checkout-field checkout-field-wide">
                <span>Destinatário</span>
                <input
                  name="destinatario"
                  type="text"
                  autoComplete="name"
                  maxLength={160}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>CEP</span>
                <input
                  name="cep"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[0-9]{8}"
                  maxLength={8}
                  placeholder="00000000"
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field checkout-field-street">
                <span>Logradouro</span>
                <input
                  name="logradouro"
                  type="text"
                  autoComplete="address-line1"
                  maxLength={200}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>Número</span>
                <input
                  name="numero"
                  type="text"
                  autoComplete="address-line2"
                  maxLength={20}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>Complemento</span>
                <input
                  name="complemento"
                  type="text"
                  maxLength={120}
                  disabled={submitting}
                />
              </label>
              <label className="checkout-field">
                <span>Bairro</span>
                <input
                  name="bairro"
                  type="text"
                  maxLength={120}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field checkout-field-city">
                <span>Cidade</span>
                <input
                  name="cidade"
                  type="text"
                  autoComplete="address-level2"
                  maxLength={120}
                  disabled={submitting}
                  required
                />
              </label>
              <label className="checkout-field">
                <span>Estado</span>
                <select
                  name="estado"
                  autoComplete="address-level1"
                  defaultValue=""
                  disabled={submitting}
                  required
                >
                  <option value="" disabled>
                    UF
                  </option>
                  {brazilianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        ) : (
          <div className="digital-delivery">
            <TabletSmartphone size={22} aria-hidden="true" />
            <div>
              <h3>Acesso digital</h3>
              <p>O ebook será vinculado à sua biblioteca após a compra.</p>
            </div>
          </div>
        )}

        <footer className="checkout-footer">
          {isPhysical && (
            <label className="checkout-quantity">
              <span>Quantidade</span>
              <input
                type="number"
                min={1}
                max={maximumQuantity}
                value={quantity}
                onChange={(event) =>
                  setQuantity(
                    Math.min(
                      maximumQuantity,
                      Math.max(1, Number(event.target.value) || 1),
                    ),
                  )
                }
                disabled={submitting}
              />
            </label>
          )}
          <div className="checkout-total">
            <span>Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
          <button type="submit" disabled={submitting}>
            {submitting ? (
              <LoaderCircle className="button-loader" size={18} aria-hidden="true" />
            ) : (
              <ShoppingBag size={18} aria-hidden="true" />
            )}
            {submitting ? 'Finalizando' : 'Finalizar compra'}
          </button>
        </footer>

        {purchaseError && (
          <p className="checkout-error" role="alert">
            {purchaseError}
          </p>
        )}
      </form>
    </div>
  )
}

function PurchaseSuccess({
  pedido,
  onClose,
}: {
  pedido: PedidoCriado
  onClose: () => void
}) {
  return (
    <div className="purchase-success">
      <span className="purchase-success-icon" aria-hidden="true">
        <CheckCircle2 size={34} />
      </span>
      <p className="section-label">Pedido aprovado</p>
      <h2 id="purchase-success-title">Compra concluída</h2>
      <p>Seu pedido foi registrado com sucesso.</p>
      <div className="purchase-receipt">
        <span>Pedido #{pedido.id.slice(0, 8).toUpperCase()}</span>
        <strong>{formatCurrency(pedido.valorTotal)}</strong>
      </div>
      <button type="button" onClick={onClose}>
        Continuar explorando
      </button>
    </div>
  )
}

function BookCover({ book, large = false }: { book: PublicBook; large?: boolean }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(book.urlCapa && !imageFailed)

  return (
    <div className={`public-book-cover${large ? ' large' : ''}`}>
      {book.destaque && (
        <span className="featured-book-badge">
          <Star size={13} fill="currentColor" aria-hidden="true" />
          Destaque
        </span>
      )}
      {showImage ? (
        <img
          src={book.urlCapa ?? undefined}
          alt={`Capa de ${book.titulo}`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="book-cover-placeholder" aria-hidden="true">
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
