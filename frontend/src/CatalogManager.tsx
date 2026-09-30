import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  BookCopy,
  BookOpenCheck,
  Check,
  CirclePause,
  CirclePlay,
  Eye,
  LoaderCircle,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react'
import { ApiError } from './api/autenticacao'
import {
  changeBookHighlight,
  changeOfferStatus,
  createAuthor,
  createBook,
  createCategory,
  createEdition,
  createOffer,
  getCatalogReferences,
  getManagedOffers,
  type BookFormat,
  type CatalogEdition,
  type CatalogReferences,
  type ManagedOffer,
  type OfferStatus,
} from './api/catalogo'
import './CatalogManager.css'

type CatalogManagerProps = {
  token: string
}

type StatusFilter = 'TODAS' | OfferStatus
type ReferenceKind = 'autor' | 'categoria'
type RegistrationStep = 1 | 2 | 3

export function CatalogManager({ token }: CatalogManagerProps) {
  const [references, setReferences] = useState<CatalogReferences | null>(null)
  const [offers, setOffers] = useState<ManagedOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODAS')
  const [editorOpen, setEditorOpen] = useState(false)
  const [changingOfferId, setChangingOfferId] = useState<string | null>(null)
  const [changingBookId, setChangingBookId] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    Promise.all([getCatalogReferences(token), getManagedOffers(token)])
      .then(([nextReferences, nextOffers]) => {
        if (!active) return
        setReferences(nextReferences)
        setOffers(nextOffers)
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  async function handleStatusChange(offer: ManagedOffer) {
    const nextStatus = offer.status === 'ATIVA' ? 'INATIVA' : 'ATIVA'
    setChangingOfferId(offer.id)
    setError(null)

    try {
      const updatedOffer = await changeOfferStatus(
        token,
        offer.id,
        nextStatus,
      )
      setOffers((currentOffers) =>
        currentOffers.map((currentOffer) =>
          currentOffer.id === offer.id ? updatedOffer : currentOffer,
        ),
      )
      setSuccess(
        nextStatus === 'ATIVA'
          ? 'Oferta publicada no catálogo.'
          : 'Oferta retirada do catálogo.',
      )
    } catch (statusError) {
      setError(getErrorMessage(statusError))
    } finally {
      setChangingOfferId(null)
    }
  }

  async function handleRegistrationFinished() {
    setEditorOpen(false)
    setSuccess('Livro e oferta cadastrados como rascunho.')
    setLoading(true)

    try {
      const [nextReferences, nextOffers] = await Promise.all([
        getCatalogReferences(token),
        getManagedOffers(token),
      ])
      setReferences(nextReferences)
      setOffers(nextOffers)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  async function handleHighlightChange(offer: ManagedOffer) {
    const book = offer.edicao.livro
    const nextHighlight = !book.destaque
    setChangingBookId(book.id)
    setError(null)

    try {
      await changeBookHighlight(token, book.id, nextHighlight)
      setOffers((currentOffers) =>
        currentOffers.map((currentOffer) =>
          currentOffer.edicao.livro.id === book.id
            ? {
                ...currentOffer,
                edicao: {
                  ...currentOffer.edicao,
                  livro: {
                    ...currentOffer.edicao.livro,
                    destaque: nextHighlight,
                  },
                },
              }
            : currentOffer,
        ),
      )
      setSuccess(
        nextHighlight
          ? 'Livro adicionado aos destaques.'
          : 'Livro removido dos destaques.',
      )
    } catch (highlightError) {
      setError(getErrorMessage(highlightError))
    } finally {
      setChangingBookId(null)
    }
  }

  const filteredOffers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return offers.filter((offer) => {
      const matchesStatus =
        statusFilter === 'TODAS' || offer.status === statusFilter
      const matchesSearch =
        !normalizedSearch ||
        offer.edicao.livro.titulo
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch) ||
        offer.edicao.isbn?.includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [offers, search, statusFilter])

  const metrics = useMemo(
    () => ({
      total: offers.length,
      active: offers.filter((offer) => offer.status === 'ATIVA').length,
      views: offers.reduce(
        (total, offer) => total + offer.metricas.visualizacoes,
        0,
      ),
      sales: offers.reduce((total, offer) => total + offer.metricas.vendas, 0),
    }),
    [offers],
  )

  return (
    <section className="catalog-manager">
      <header className="manager-heading">
        <div>
          <p className="section-label">Área do vendedor</p>
          <h1>Catálogo da loja</h1>
          <p>Acompanhe suas ofertas e mantenha os livros disponíveis.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => setEditorOpen(true)}
          disabled={loading || !references}
        >
          <Plus size={18} aria-hidden="true" />
          Novo livro
        </button>
      </header>

      {success && (
        <div className="manager-notice success-notice" role="status">
          <Check size={18} aria-hidden="true" />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            aria-label="Fechar aviso"
            title="Fechar aviso"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <div className="manager-notice error-notice" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Fechar erro"
            title="Fechar erro"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="metric-grid" aria-label="Resumo do catálogo">
        <Metric
          icon={<BookCopy size={20} />}
          label="Ofertas"
          value={metrics.total}
        />
        <Metric
          icon={<BookOpenCheck size={20} />}
          label="Publicadas"
          value={metrics.active}
        />
        <Metric icon={<Eye size={20} />} label="Visualizações" value={metrics.views} />
        <Metric
          icon={<ShoppingBag size={20} />}
          label="Vendas"
          value={metrics.sales}
        />
      </div>

      <div className="offer-section">
        <div className="offer-toolbar">
          <div className="offer-title">
            <h2>Suas ofertas</h2>
            <span>{filteredOffers.length}</span>
          </div>

          <div className="offer-controls">
            <label className="catalog-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar título ou ISBN"
                aria-label="Buscar ofertas"
              />
            </label>
            <select
              className="status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              aria-label="Filtrar ofertas por status"
            >
              <option value="TODAS">Todos os status</option>
              <option value="ATIVA">Publicadas</option>
              <option value="RASCUNHO">Rascunhos</option>
              <option value="INATIVA">Inativas</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="catalog-loading" aria-label="Carregando catálogo">
            <LoaderCircle size={24} aria-hidden="true" />
          </div>
        ) : filteredOffers.length ? (
          <div className="offer-table-wrapper">
            <table className="offer-table">
              <thead>
                <tr>
                  <th>Livro</th>
                  <th>Formato</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Desempenho</th>
                  <th>Status</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => (
                  <OfferRow
                    key={offer.id}
                    offer={offer}
                    changing={changingOfferId === offer.id}
                    changingHighlight={
                      changingBookId === offer.edicao.livro.id
                    }
                    onStatusChange={() => void handleStatusChange(offer)}
                    onHighlightChange={() =>
                      void handleHighlightChange(offer)
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="catalog-empty">
            <span aria-hidden="true">
              <Package size={27} />
            </span>
            <h3>{offers.length ? 'Nenhuma oferta encontrada' : 'Catálogo vazio'}</h3>
            <p>
              {offers.length
                ? 'Ajuste a busca ou o filtro para ver outras ofertas.'
                : 'Cadastre o primeiro livro para começar a vender.'}
            </p>
          </div>
        )}
      </div>

      {editorOpen && references && (
        <RegistrationPanel
          token={token}
          references={references}
          onReferencesChange={setReferences}
          onClose={() => setEditorOpen(false)}
          onFinished={() => void handleRegistrationFinished()}
        />
      )}
    </section>
  )
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: number
}) {
  return (
    <article className="metric-item">
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value.toLocaleString('pt-BR')}</strong>
      </div>
    </article>
  )
}

function OfferRow({
  offer,
  changing,
  changingHighlight,
  onStatusChange,
  onHighlightChange,
}: {
  offer: ManagedOffer
  changing: boolean
  changingHighlight: boolean
  onStatusChange: () => void
  onHighlightChange: () => void
}) {
  const isActive = offer.status === 'ATIVA'

  return (
    <tr>
      <td>
        <div className="book-cell">
          <span className="book-thumbnail" aria-hidden="true">
            {offer.edicao.livro.urlCapa ? (
              <img src={offer.edicao.livro.urlCapa} alt="" />
            ) : (
              <BookCopy size={19} />
            )}
          </span>
          <span>
            <strong>{offer.edicao.livro.titulo}</strong>
            <small>{offer.edicao.isbn ?? 'Sem ISBN'}</small>
          </span>
        </div>
      </td>
      <td>
        <span className={`format-badge ${offer.edicao.formato.toLowerCase()}`}>
          {offer.edicao.formato === 'FISICO' ? 'Físico' : 'E-book'}
        </span>
      </td>
      <td className="numeric-cell">{formatCurrency(offer.preco)}</td>
      <td className="numeric-cell">
        {offer.edicao.formato === 'FISICO' ? offer.estoque : 'Digital'}
      </td>
      <td>
        <span className="performance-cell">
          <small>{offer.metricas.visualizacoes} visualizações</small>
          <small>{offer.metricas.vendas} vendas</small>
        </span>
      </td>
      <td>
        <span className={`status-badge ${offer.status.toLowerCase()}`}>
          {formatStatus(offer.status)}
        </span>
      </td>
      <td className="row-action-cell">
        <div className="row-actions">
          <button
            className={`row-action highlight-action${
              offer.edicao.livro.destaque ? ' active' : ''
            }`}
            type="button"
            onClick={onHighlightChange}
            disabled={changingHighlight}
            aria-pressed={offer.edicao.livro.destaque}
            aria-label={
              offer.edicao.livro.destaque
                ? 'Remover livro dos destaques'
                : 'Adicionar livro aos destaques'
            }
            title={
              offer.edicao.livro.destaque
                ? 'Remover dos destaques'
                : 'Adicionar aos destaques'
            }
          >
            {changingHighlight ? (
              <LoaderCircle className="button-loader" size={18} />
            ) : (
              <Star
                size={18}
                fill={
                  offer.edicao.livro.destaque ? 'currentColor' : 'none'
                }
              />
            )}
          </button>
          <button
            className="row-action"
            type="button"
            onClick={onStatusChange}
            disabled={changing}
            aria-label={isActive ? 'Desativar oferta' : 'Publicar oferta'}
            title={isActive ? 'Desativar oferta' : 'Publicar oferta'}
          >
            {changing ? (
              <LoaderCircle className="button-loader" size={18} />
            ) : isActive ? (
              <CirclePause size={18} />
            ) : (
              <CirclePlay size={18} />
            )}
          </button>
        </div>
      </td>
    </tr>
  )
}

type RegistrationPanelProps = {
  token: string
  references: CatalogReferences
  onReferencesChange: (references: CatalogReferences) => void
  onClose: () => void
  onFinished: () => void
}

function RegistrationPanel({
  token,
  references,
  onReferencesChange,
  onClose,
  onFinished,
}: RegistrationPanelProps) {
  const [step, setStep] = useState<RegistrationStep>(1)
  const [format, setFormat] = useState<BookFormat>('FISICO')
  const [book, setBook] = useState<{ id: string; title: string } | null>(null)
  const [edition, setEdition] = useState<CatalogEdition | null>(null)
  const [referenceKind, setReferenceKind] = useState<ReferenceKind | null>(null)
  const [referenceName, setReferenceName] = useState('')
  const [selectedAuthorId, setSelectedAuthorId] = useState(
    references.autores[0]?.id ?? '',
  )
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    references.categorias[0]?.id ?? '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [referenceSubmitting, setReferenceSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const formData = new FormData(event.currentTarget)

    try {
      if (step === 1) {
        const title = getRequiredValue(formData, 'title')
        const createdBook = await createBook(token, {
          titulo: title,
          sinopse: getOptionalValue(formData, 'synopsis'),
          urlCapa: getOptionalValue(formData, 'coverUrl'),
          idioma: getRequiredValue(formData, 'language'),
          destaque: formData.get('highlight') === 'on',
          autorIds: [getRequiredValue(formData, 'authorId')],
          categoriaIds: [getRequiredValue(formData, 'categoryId')],
        })
        setBook({ id: createdBook.id, title })
        setStep(2)
        return
      }

      if (step === 2 && book) {
        const createdEdition = await createEdition(token, {
          livroId: book.id,
          formato: format,
          isbn: getOptionalValue(formData, 'isbn'),
          editora: getOptionalValue(formData, 'publisher'),
          anoPublicacao: getOptionalNumber(formData, 'publicationYear'),
          numeroPaginas: getOptionalNumber(formData, 'pageCount'),
        })
        setEdition(createdEdition)
        setStep(3)
        return
      }

      if (step === 3 && edition) {
        const price = Number(getRequiredValue(formData, 'price'))
        await createOffer(
          token,
          format === 'FISICO'
            ? {
                edicaoId: edition.id,
                formato: 'FISICO',
                preco: price,
                estoque: Number(getRequiredValue(formData, 'stock')),
              }
            : {
                edicaoId: edition.id,
                formato: 'EBOOK',
                preco: price,
                chaveArquivoDigital: getRequiredValue(formData, 'digitalKey'),
              },
        )
        onFinished()
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReferenceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!referenceKind) return

    setReferenceSubmitting(true)
    setError(null)

    try {
      if (referenceKind === 'autor') {
        const author = await createAuthor(token, referenceName)
        onReferencesChange({
          ...references,
          autores: [...references.autores, author].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR'),
          ),
        })
        setSelectedAuthorId(author.id)
      } else {
        const category = await createCategory(token, referenceName)
        onReferencesChange({
          ...references,
          categorias: [...references.categorias, category].sort((a, b) =>
            a.nome.localeCompare(b.nome, 'pt-BR'),
          ),
        })
        setSelectedCategoryId(category.id)
      }
      setReferenceKind(null)
      setReferenceName('')
    } catch (referenceError) {
      setError(getErrorMessage(referenceError))
    } finally {
      setReferenceSubmitting(false)
    }
  }

  return (
    <div className="editor-overlay" role="presentation">
      <aside
        className="registration-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-title"
      >
        <header className="registration-header">
          <div>
            <span>Cadastro de catálogo</span>
            <h2 id="registration-title">Novo livro</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar cadastro"
            title="Fechar cadastro"
          >
            <X size={20} />
          </button>
        </header>

        <ol className="registration-steps" aria-label="Etapas do cadastro">
          <StepItem number={1} label="Livro" current={step} />
          <StepItem number={2} label="Edição" current={step} />
          <StepItem number={3} label="Oferta" current={step} />
        </ol>

        {error && (
          <p className="registration-error" role="alert">
            {error}
          </p>
        )}

        <form className="registration-form" key={step} onSubmit={handleSubmit}>
          {step === 1 && (
            <>
              <FormHeading
                title="Dados do livro"
                description="Informações compartilhadas entre as edições."
              />
              <Field label="Título">
                <input name="title" maxLength={200} required autoFocus />
              </Field>
              <Field label="Sinopse">
                <textarea name="synopsis" rows={4} maxLength={5000} />
              </Field>
              <div className="form-grid">
                <Field label="Autor">
                  <select
                    name="authorId"
                    value={selectedAuthorId}
                    onChange={(event) => setSelectedAuthorId(event.target.value)}
                    required
                  >
                    {!references.autores.length && (
                      <option value="">Cadastre um autor</option>
                    )}
                    {references.autores.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <ReferenceButton
                  label="Novo autor"
                  onClick={() => setReferenceKind('autor')}
                />
              </div>
              <div className="form-grid">
                <Field label="Categoria">
                  <select
                    name="categoryId"
                    value={selectedCategoryId}
                    onChange={(event) =>
                      setSelectedCategoryId(event.target.value)
                    }
                    required
                  >
                    {!references.categorias.length && (
                      <option value="">Cadastre uma categoria</option>
                    )}
                    {references.categorias.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                </Field>
                <ReferenceButton
                  label="Nova categoria"
                  onClick={() => setReferenceKind('categoria')}
                />
              </div>
              <div className="form-grid equal-columns">
                <Field label="Idioma">
                  <input name="language" defaultValue="pt-BR" maxLength={10} required />
                </Field>
                <Field label="URL da capa" optional>
                  <input name="coverUrl" type="url" placeholder="https://" />
                </Field>
              </div>
              <label className="highlight-option">
                <input name="highlight" type="checkbox" />
                <span>
                  <Star size={17} aria-hidden="true" />
                  Exibir como destaque
                </span>
              </label>
            </>
          )}

          {step === 2 && book && (
            <>
              <FormHeading
                title="Dados da edição"
                description={book.title}
              />
              <div className="format-control" role="group" aria-label="Formato do livro">
                <button
                  type="button"
                  className={format === 'FISICO' ? 'active' : undefined}
                  onClick={() => setFormat('FISICO')}
                >
                  Livro físico
                </button>
                <button
                  type="button"
                  className={format === 'EBOOK' ? 'active' : undefined}
                  onClick={() => setFormat('EBOOK')}
                >
                  E-book
                </button>
              </div>
              <Field label="ISBN" optional>
                <input name="isbn" inputMode="numeric" maxLength={17} />
              </Field>
              <Field label="Editora" optional>
                <input name="publisher" maxLength={160} />
              </Field>
              <div className="form-grid equal-columns">
                <Field label="Ano de publicação" optional>
                  <input
                    name="publicationYear"
                    type="number"
                    min={1450}
                    max={new Date().getFullYear() + 1}
                  />
                </Field>
                <Field label="Número de páginas" optional>
                  <input name="pageCount" type="number" min={1} max={100000} />
                </Field>
              </div>
            </>
          )}

          {step === 3 && book && edition && (
            <>
              <FormHeading
                title="Condições da oferta"
                description={`${book.title} · ${format === 'FISICO' ? 'Livro físico' : 'E-book'}`}
              />
              <Field label="Preço">
                <span className="money-input">
                  <span>R$</span>
                  <input
                    name="price"
                    type="number"
                    min={0}
                    max={99999999.99}
                    step="0.01"
                    required
                    autoFocus
                  />
                </span>
              </Field>
              {format === 'FISICO' ? (
                <Field label="Quantidade em estoque">
                  <input name="stock" type="number" min={0} required />
                </Field>
              ) : (
                <Field label="Identificador do arquivo digital">
                  <input
                    name="digitalKey"
                    placeholder="ebooks/nome-do-arquivo.epub"
                    maxLength={500}
                    required
                  />
                </Field>
              )}
              <div className="draft-note">
                <Package size={18} aria-hidden="true" />
                <p>
                  A oferta será salva como rascunho. Você poderá publicá-la na
                  lista após revisar os dados.
                </p>
              </div>
            </>
          )}

          <footer className="registration-footer">
            <button type="button" className="secondary-action" onClick={onClose}>
              Fechar
            </button>
            <button className="primary-action" type="submit" disabled={submitting}>
              {submitting ? (
                <LoaderCircle className="button-loader" size={18} />
              ) : step === 3 ? (
                'Criar rascunho'
              ) : (
                'Salvar e continuar'
              )}
            </button>
          </footer>
        </form>

        {referenceKind && (
          <form className="reference-form" onSubmit={handleReferenceSubmit}>
            <header>
              <strong>
                {referenceKind === 'autor' ? 'Novo autor' : 'Nova categoria'}
              </strong>
              <button
                type="button"
                onClick={() => setReferenceKind(null)}
                aria-label="Cancelar"
                title="Cancelar"
              >
                <X size={17} />
              </button>
            </header>
            <input
              value={referenceName}
              onChange={(event) => setReferenceName(event.target.value)}
              minLength={2}
              maxLength={referenceKind === 'autor' ? 160 : 100}
              placeholder="Nome"
              required
              autoFocus
            />
            <button className="primary-action" type="submit" disabled={referenceSubmitting}>
              {referenceSubmitting ? (
                <LoaderCircle className="button-loader" size={18} />
              ) : (
                'Adicionar'
              )}
            </button>
          </form>
        )}
      </aside>
    </div>
  )
}

function StepItem({
  number,
  label,
  current,
}: {
  number: RegistrationStep
  label: string
  current: RegistrationStep
}) {
  const completed = current > number

  return (
    <li className={current === number ? 'active' : completed ? 'completed' : undefined}>
      <span>{completed ? <Check size={14} /> : number}</span>
      {label}
    </li>
  )
}

function FormHeading({ title, description }: { title: string; description: string }) {
  return (
    <header className="form-heading">
      <h3>{title}</h3>
      <p>{description}</p>
    </header>
  )
}

function Field({
  label,
  optional = false,
  children,
}: {
  label: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label className="catalog-field">
      <span>
        {label}
        {optional && <small>Opcional</small>}
      </span>
      {children}
    </label>
  )
}

function ReferenceButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="reference-button" type="button" onClick={onClick}>
      <Plus size={16} aria-hidden="true" />
      {label}
    </button>
  )
}

function getRequiredValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? '').trim()
}

function getOptionalValue(formData: FormData, name: string) {
  const value = getRequiredValue(formData, name)
  return value || undefined
}

function getOptionalNumber(formData: FormData, name: string) {
  const value = getOptionalValue(formData, name)
  return value ? Number(value) : undefined
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível concluir a operação. Tente novamente.'
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatStatus(status: OfferStatus) {
  const labels: Record<OfferStatus, string> = {
    ATIVA: 'Publicada',
    RASCUNHO: 'Rascunho',
    INATIVA: 'Inativa',
  }
  return labels[status]
}
