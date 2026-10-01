import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  Check,
  Clock3,
  LoaderCircle,
  MessageSquareReply,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react'

import { ApiError } from './api/autenticacao'
import {
  deleteReview,
  getManagedReviews,
  replyToReview,
  type BookReview,
} from './api/avaliacoes'
import './ReviewManager.css'

type ReviewFilter = 'TODAS' | 'PENDENTES' | 'RESPONDIDAS'

export function ReviewManager({ token }: { token: string }) {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ReviewFilter>('TODAS')
  const [replyingTo, setReplyingTo] = useState<BookReview | null>(null)
  const [deletingReview, setDeletingReview] = useState<BookReview | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadReviews() {
    setLoading(true)
    setError(null)

    try {
      setReviews(await getManagedReviews(token))
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    getManagedReviews(token)
      .then((nextReviews) => {
        if (active) setReviews(nextReviews)
      })
      .catch((loadError) => {
        if (active) setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  const metrics = useMemo(() => {
    const pending = reviews.filter((review) => !review.resposta).length
    const average = reviews.length
      ? reviews.reduce((total, review) => total + review.nota, 0) /
        reviews.length
      : 0

    return {
      total: reviews.length,
      pending,
      answered: reviews.length - pending,
      average,
    }
  }, [reviews])

  const filteredReviews = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    return reviews.filter((review) => {
      const matchesFilter =
        filter === 'TODAS' ||
        (filter === 'PENDENTES' && !review.resposta) ||
        (filter === 'RESPONDIDAS' && Boolean(review.resposta))
      const matchesSearch =
        !normalizedSearch ||
        review.livro.titulo
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch) ||
        review.usuario.nome
          .toLocaleLowerCase('pt-BR')
          .includes(normalizedSearch)

      return matchesFilter && matchesSearch
    })
  }, [filter, reviews, search])

  async function handleReply(
    event: FormEvent<HTMLFormElement>,
    review: BookReview,
  ) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const formData = new FormData(event.currentTarget)

    try {
      const updatedReview = await replyToReview(
        token,
        review.id,
        String(formData.get('resposta') ?? ''),
      )
      setReviews((currentReviews) =>
        currentReviews.map((currentReview) =>
          currentReview.id === review.id ? updatedReview : currentReview,
        ),
      )
      setReplyingTo(null)
      setSuccess('Resposta enviada ao cliente.')
    } catch (replyError) {
      setError(getErrorMessage(replyError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(review: BookReview) {
    setSubmitting(true)
    setError(null)

    try {
      await deleteReview(token, review.id)
      setReviews((currentReviews) =>
        currentReviews.filter((currentReview) => currentReview.id !== review.id),
      )
      setDeletingReview(null)
      setSuccess('Avaliação excluída.')
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="review-manager workspace-content">
      <header className="review-manager-heading">
        <div>
          <p className="section-label">Área restrita</p>
          <h1>Avaliações dos clientes</h1>
          <p>Acompanhe os comentários e responda em nome da biblioteca.</p>
        </div>
      </header>

      {success && (
        <div className="review-manager-notice success" role="status">
          <Check size={17} aria-hidden="true" />
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess(null)} aria-label="Fechar aviso">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      {error && (
        <div className="review-manager-notice error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Fechar erro">
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="review-metrics" aria-label="Resumo das avaliações">
        <ReviewMetric label="Avaliações" value={metrics.total.toString()} icon={<MessageSquareReply size={19} />} />
        <ReviewMetric label="Pendentes" value={metrics.pending.toString()} icon={<Clock3 size={19} />} />
        <ReviewMetric label="Respondidas" value={metrics.answered.toString()} icon={<Check size={19} />} />
        <ReviewMetric label="Nota média" value={metrics.average.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} icon={<Star size={19} />} />
      </div>

      <div className="review-management-panel">
        <div className="review-manager-toolbar">
          <div className="review-manager-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar livro ou cliente"
              aria-label="Buscar avaliações"
            />
          </div>
          <div className="review-filter" aria-label="Filtrar avaliações">
            {(
              [
                ['TODAS', 'Todas'],
                ['PENDENTES', 'Pendentes'],
                ['RESPONDIDAS', 'Respondidas'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'active' : undefined}
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="review-manager-loading" aria-label="Carregando avaliações">
            <LoaderCircle size={25} aria-hidden="true" />
          </div>
        ) : filteredReviews.length ? (
          <div className="managed-review-list">
            {filteredReviews.map((review) => (
              <ManagedReview
                key={review.id}
                review={review}
                onReply={() => {
                  setSuccess(null)
                  setReplyingTo(review)
                }}
                onDelete={() => {
                  setSuccess(null)
                  setDeletingReview(review)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="review-manager-empty">
            <MessageSquareReply size={27} aria-hidden="true" />
            <h2>Nenhuma avaliação encontrada</h2>
            {reviews.length === 0 && (
              <button type="button" onClick={() => void loadReviews()}>
                <RefreshCw size={16} aria-hidden="true" />
                Atualizar
              </button>
            )}
          </div>
        )}
      </div>

      {replyingTo && (
        <ReplyDialog
          review={replyingTo}
          submitting={submitting}
          onClose={() => setReplyingTo(null)}
          onSubmit={(event) => void handleReply(event, replyingTo)}
        />
      )}

      {deletingReview && (
        <DeleteDialog
          review={deletingReview}
          submitting={submitting}
          onClose={() => setDeletingReview(null)}
          onConfirm={() => void handleDelete(deletingReview)}
        />
      )}
    </section>
  )
}

function ReviewMetric({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <article>
      <span aria-hidden="true">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </article>
  )
}

function ManagedReview({
  review,
  onReply,
  onDelete,
}: {
  review: BookReview
  onReply: () => void
  onDelete: () => void
}) {
  return (
    <article className="managed-review">
      <header>
        <div>
          <strong>{review.livro.titulo}</strong>
          <span>por {review.usuario.nome}</span>
        </div>
        <time dateTime={review.atualizadoEm}>{formatDate(review.atualizadoEm)}</time>
      </header>
      <div className="managed-review-rating" aria-label={`Nota ${review.nota} de 5`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            size={15}
            fill={review.nota >= value ? 'currentColor' : 'none'}
            aria-hidden="true"
          />
        ))}
      </div>
      <p>{review.comentario ?? 'Avaliação sem comentário.'}</p>
      {review.resposta && (
        <div className="managed-review-reply">
          <strong>Resposta atual</strong>
          <p>{review.resposta}</p>
        </div>
      )}
      <footer>
        <span className={review.resposta ? 'answered' : 'pending'}>
          {review.resposta ? 'Respondida' : 'Aguardando resposta'}
        </span>
        <div>
          <button type="button" onClick={onReply}>
            <MessageSquareReply size={16} aria-hidden="true" />
            {review.resposta ? 'Editar resposta' : 'Responder'}
          </button>
          <button
            className="delete-review"
            type="button"
            onClick={onDelete}
            aria-label={`Excluir avaliação de ${review.usuario.nome}`}
            title="Excluir avaliação"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  )
}

function ReplyDialog({
  review,
  submitting,
  onClose,
  onSubmit,
}: {
  review: BookReview
  submitting: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="review-dialog-overlay" role="presentation">
      <section className="review-dialog" role="dialog" aria-modal="true" aria-labelledby="reply-title">
        <header>
          <div>
            <p className="section-label">Resposta da biblioteca</p>
            <h2 id="reply-title">{review.livro.titulo}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Fechar">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <blockquote>{review.comentario ?? 'Avaliação sem comentário.'}</blockquote>
        <form onSubmit={onSubmit}>
          <label>
            <span>Resposta</span>
            <textarea
              name="resposta"
              defaultValue={review.resposta ?? ''}
              minLength={2}
              maxLength={1000}
              disabled={submitting}
              required
            />
          </label>
          <footer>
            <button type="button" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting && <LoaderCircle className="button-loader" size={17} aria-hidden="true" />}
              {submitting ? 'Enviando' : 'Enviar resposta'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function DeleteDialog({
  review,
  submitting,
  onClose,
  onConfirm,
}: {
  review: BookReview
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="review-dialog-overlay" role="presentation">
      <section className="review-dialog delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-review-title">
        <header>
          <div>
            <p className="section-label">Moderação</p>
            <h2 id="delete-review-title">Excluir avaliação?</h2>
          </div>
        </header>
        <p>A avaliação de {review.usuario.nome} será removida do livro {review.livro.titulo}.</p>
        <footer>
          <button type="button" onClick={onClose} disabled={submitting}>Cancelar</button>
          <button className="danger" type="button" onClick={onConfirm} disabled={submitting}>
            {submitting ? 'Excluindo' : 'Excluir avaliação'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível concluir a operação.'
}
