import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  BookCheck,
  BookMarked,
  BookOpenText,
  Check,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  TabletSmartphone,
  X,
} from 'lucide-react'

import { ApiError } from './api/autenticacao'
import {
  getPersonalLibrary,
  updateReadingProgress,
  type LibraryItem,
  type ReadingStatus,
} from './api/biblioteca'
import type { BookFormat } from './api/catalogo'
import './PersonalLibrary.css'

type StatusFilter = 'TODOS' | ReadingStatus
type FormatFilter = 'TODOS' | BookFormat

type ProgressDraft = {
  statusLeitura: ReadingStatus
  percentualLido: number
  paginaAtual: string
}

type PersonalLibraryProps = {
  token: string
  firstName: string
}

const statusLabels: Record<ReadingStatus, string> = {
  NAO_INICIADO: 'Não iniciado',
  LENDO: 'Lendo',
  CONCLUIDO: 'Concluído',
}

export function PersonalLibrary({ token, firstName }: PersonalLibraryProps) {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('TODOS')
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('TODOS')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null)

  async function loadLibrary() {
    setLoading(true)
    setError(null)

    try {
      setItems(await getPersonalLibrary(token))
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : 'Não foi possível carregar sua biblioteca.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    getPersonalLibrary(token)
      .then((libraryItems) => {
        if (active) {
          setItems(libraryItems)
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof ApiError
              ? loadError.message
              : 'Não foi possível carregar sua biblioteca.',
          )
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [token])

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus =
          statusFilter === 'TODOS' || item.statusLeitura === statusFilter
        const matchesFormat =
          formatFilter === 'TODOS' || item.edicao.formato === formatFilter

        return matchesStatus && matchesFormat
      }),
    [formatFilter, items, statusFilter],
  )

  function handleItemUpdated(updatedItem: LibraryItem) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    )
    setEditingItem(null)
    setSuccess('Progresso de leitura atualizado.')
  }

  return (
    <div className="personal-library">
      <header className="library-heading">
        <div>
          <p className="section-label">Minha biblioteca</p>
          <h1>Sua estante, {firstName}.</h1>
          <p>Acompanhe suas leituras e retome cada história de onde parou.</p>
        </div>
        {!loading && items.length > 0 && (
          <span className="library-count">
            {items.length} {items.length === 1 ? 'livro' : 'livros'}
          </span>
        )}
      </header>

      {success && (
        <div className="library-notice success" role="status">
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
        <div className="library-notice error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadLibrary()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="library-loading" aria-live="polite">
          <LoaderCircle size={26} aria-hidden="true" />
          <span>Organizando sua estante...</span>
        </div>
      ) : items.length === 0 && !error ? (
        <div className="empty-library">
          <span className="empty-library-icon" aria-hidden="true">
            <BookMarked size={28} />
          </span>
          <h2>Sua estante está vazia</h2>
          <p>Os livros adquiridos aparecerão nesta área.</p>
        </div>
      ) : (
        <>
          <LibraryFilters
            status={statusFilter}
            format={formatFilter}
            onStatusChange={setStatusFilter}
            onFormatChange={setFormatFilter}
          />

          {filteredItems.length === 0 ? (
            <div className="library-filter-empty">
              <BookOpenText size={28} aria-hidden="true" />
              <h2>Nenhum livro neste filtro</h2>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('TODOS')
                  setFormatFilter('TODOS')
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="library-grid">
              {filteredItems.map((item) => (
                <LibraryCard
                  item={item}
                  key={item.id}
                  onEdit={() => {
                    setSuccess(null)
                    setEditingItem(item)
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {editingItem && (
        <ProgressDialog
          token={token}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onComplete={handleItemUpdated}
        />
      )}
    </div>
  )
}

function LibraryFilters({
  status,
  format,
  onStatusChange,
  onFormatChange,
}: {
  status: StatusFilter
  format: FormatFilter
  onStatusChange: (status: StatusFilter) => void
  onFormatChange: (format: FormatFilter) => void
}) {
  return (
    <div className="library-filters">
      <div className="library-segmented" aria-label="Filtrar por leitura">
        {(
          [
            ['TODOS', 'Todos'],
            ['NAO_INICIADO', 'Não iniciados'],
            ['LENDO', 'Em leitura'],
            ['CONCLUIDO', 'Concluídos'],
          ] as const
        ).map(([value, label]) => (
          <button
            type="button"
            className={status === value ? 'active' : undefined}
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
            key={value}
          >
            {label}
          </button>
        ))}
      </div>

      <select
        className="library-format-filter"
        value={format}
        onChange={(event) => onFormatChange(event.target.value as FormatFilter)}
        aria-label="Filtrar por formato"
      >
        <option value="TODOS">Todos os formatos</option>
        <option value="FISICO">Livro físico</option>
        <option value="EBOOK">E-book</option>
      </select>
    </div>
  )
}

function LibraryCard({ item, onEdit }: { item: LibraryItem; onEdit: () => void }) {
  const book = item.edicao.livro
  const authors = book.autores.map((author) => author.nome).join(', ')
  const formatLabel = item.edicao.formato === 'EBOOK' ? 'E-book' : 'Físico'

  return (
    <article className="library-card">
      <div className="library-cover">
        {book.urlCapa ? (
          <img src={book.urlCapa} alt={`Capa de ${book.titulo}`} />
        ) : (
          <span aria-hidden="true">
            <BookOpenText size={32} />
          </span>
        )}
      </div>

      <div className="library-card-content">
        <div className="library-card-meta">
          <span className={`reading-status ${item.statusLeitura.toLowerCase()}`}>
            {statusLabels[item.statusLeitura]}
          </span>
          <span className="edition-format">
            {item.edicao.formato === 'EBOOK' ? (
              <TabletSmartphone size={14} aria-hidden="true" />
            ) : (
              <FileText size={14} aria-hidden="true" />
            )}
            {formatLabel}
          </span>
        </div>

        <div>
          <h2>{book.titulo}</h2>
          <p className="library-authors">{authors || 'Autor não informado'}</p>
        </div>

        <div className="library-progress">
          <div>
            <span>Progresso</span>
            <strong>{item.percentualLido}%</strong>
          </div>
          <div className="library-progress-track" aria-hidden="true">
            <span style={{ width: `${item.percentualLido}%` }} />
          </div>
          {item.paginaAtual !== null && item.edicao.numeroPaginas !== null && (
            <small>
              Página {item.paginaAtual} de {item.edicao.numeroPaginas}
            </small>
          )}
        </div>

        <footer>
          <span>
            Adicionado em{' '}
            {new Intl.DateTimeFormat('pt-BR').format(
              new Date(item.adicionadoEm),
            )}
          </span>
          <button type="button" onClick={onEdit}>
            <Pencil size={15} aria-hidden="true" />
            Atualizar leitura
          </button>
        </footer>
      </div>
    </article>
  )
}

function ProgressDialog({
  token,
  item,
  onClose,
  onComplete,
}: {
  token: string
  item: LibraryItem
  onClose: () => void
  onComplete: (item: LibraryItem) => void
}) {
  const [draft, setDraft] = useState<ProgressDraft>({
    statusLeitura: item.statusLeitura,
    percentualLido: item.percentualLido,
    paginaAtual: item.paginaAtual === null ? '' : String(item.paginaAtual),
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const totalPages = item.edicao.numeroPaginas

  function changeStatus(statusLeitura: ReadingStatus) {
    setDraft((current) => ({
      ...current,
      statusLeitura,
      percentualLido:
        statusLeitura === 'NAO_INICIADO'
          ? 0
          : statusLeitura === 'CONCLUIDO'
            ? 100
            : Math.min(99, Math.max(1, current.percentualLido)),
      paginaAtual:
        statusLeitura === 'NAO_INICIADO'
          ? ''
          : statusLeitura === 'CONCLUIDO' && totalPages !== null
            ? String(totalPages)
            : current.paginaAtual,
    }))
  }

  function changePercentage(value: number) {
    const percentualLido = Math.min(100, Math.max(0, value))
    setDraft((current) => ({
      ...current,
      percentualLido,
      statusLeitura:
        percentualLido === 0
          ? 'NAO_INICIADO'
          : percentualLido === 100
            ? 'CONCLUIDO'
            : 'LENDO',
      paginaAtual: percentualLido === 0 ? '' : current.paginaAtual,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const updatedItem = await updateReadingProgress(token, item.id, {
        statusLeitura: draft.statusLeitura,
        percentualLido: draft.percentualLido,
        paginaAtual: draft.paginaAtual === '' ? null : Number(draft.paginaAtual),
      })
      onComplete(updatedItem)
    } catch (updateError) {
      setError(
        updateError instanceof ApiError
          ? updateError.message
          : 'Não foi possível atualizar o progresso.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="progress-dialog-overlay" role="presentation">
      <section
        className="progress-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-dialog-title"
      >
        <header>
          <div>
            <p className="section-label">Progresso de leitura</p>
            <h2 id="progress-dialog-title">{item.edicao.livro.titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Fechar"
            title="Fechar"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          <label className="progress-field">
            <span>Status</span>
            <select
              value={draft.statusLeitura}
              onChange={(event) =>
                changeStatus(event.target.value as ReadingStatus)
              }
              disabled={submitting}
            >
              <option value="NAO_INICIADO">Não iniciado</option>
              <option value="LENDO">Lendo</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </label>

          <label className="progress-field progress-percentage-field">
            <span>
              Porcentagem lida <strong>{draft.percentualLido}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={draft.percentualLido}
              onChange={(event) => changePercentage(Number(event.target.value))}
              disabled={submitting}
            />
          </label>

          {totalPages !== null && (
            <label className="progress-field">
              <span>Página atual</span>
              <input
                type="number"
                min="0"
                max={totalPages}
                value={draft.paginaAtual}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    paginaAtual: event.target.value,
                  }))
                }
                placeholder={`Até ${totalPages}`}
                disabled={submitting || draft.statusLeitura === 'NAO_INICIADO'}
              />
            </label>
          )}

          {error && (
            <p className="progress-error" role="alert">
              {error}
            </p>
          )}

          <footer>
            <button
              className="progress-cancel"
              type="button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              className="progress-save"
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <LoaderCircle className="button-loader" size={18} />
              ) : (
                <BookCheck size={18} aria-hidden="true" />
              )}
              Salvar progresso
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
