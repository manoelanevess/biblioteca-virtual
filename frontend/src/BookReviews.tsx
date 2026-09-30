import { useEffect, useState, type FormEvent } from 'react'
import {
  Check,
  LoaderCircle,
  MessageSquareReply,
  Star,
} from 'lucide-react'

import { ApiError } from './api/autenticacao'
import {
  getBookReviews,
  saveBookReview,
  type BookReview,
} from './api/avaliacoes'
import './BookReviews.css'

type BookReviewsProps = {
  bookId: string
  token: string | null
  currentUserId: string | null
  canReview: boolean
  onAuthenticationRequired?: () => void
}

export function BookReviews({
  bookId,
  token,
  currentUserId,
  canReview,
  onAuthenticationRequired,
}: BookReviewsProps) {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const ownReview = reviews.find(
    (review) => review.usuario.id === currentUserId,
  )

  useEffect(() => {
    let active = true

    getBookReviews(bookId)
      .then((nextReviews) => {
        if (!active) return
        setReviews(nextReviews)
        const nextOwnReview = nextReviews.find(
          (review) => review.usuario.id === currentUserId,
        )
        if (nextOwnReview) {
          setRating(nextOwnReview.nota)
          setComment(nextOwnReview.comentario ?? '')
        }
      })
      .catch((loadError) => {
        if (!active) return
        setError(getErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [bookId, currentUserId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token || rating === 0) return

    setSubmitting(true)
    setError(null)
    setSaved(false)

    try {
      const updatedReview = await saveBookReview(token, bookId, {
        nota: rating,
        comentario: comment,
      })
      setReviews((currentReviews) => [
        updatedReview,
        ...currentReviews.filter((review) => review.id !== updatedReview.id),
      ])
      setSaved(true)
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="book-reviews">
      <header className="reviews-heading">
        <div>
          <p className="section-label">Opiniões dos leitores</p>
          <h3>Avaliações</h3>
        </div>
        <span>
          {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
        </span>
      </header>

      {canReview && token ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-heading">
            <strong>{ownReview ? 'Atualize sua avaliação' : 'Avalie este livro'}</strong>
            {saved && (
              <span className="review-saved" role="status">
                <Check size={15} aria-hidden="true" />
                Avaliação salva
              </span>
            )}
          </div>
          <div className="rating-input" aria-label="Nota do livro">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={rating >= value ? 'selected' : undefined}
                onClick={() => {
                  setRating(value)
                  setSaved(false)
                }}
                aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`}
                aria-pressed={rating === value}
                disabled={submitting}
              >
                <Star size={22} fill="currentColor" aria-hidden="true" />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(event) => {
              setComment(event.target.value)
              setSaved(false)
            }}
            placeholder="Conte o que achou da leitura"
            maxLength={1000}
            disabled={submitting}
          />
          <button type="submit" disabled={submitting || rating === 0}>
            {submitting && (
              <LoaderCircle className="button-loader" size={17} aria-hidden="true" />
            )}
            {submitting ? 'Salvando' : ownReview ? 'Atualizar avaliação' : 'Publicar avaliação'}
          </button>
        </form>
      ) : !token ? (
        <button
          className="review-login"
          type="button"
          onClick={onAuthenticationRequired}
        >
          Entrar para avaliar
        </button>
      ) : null}

      {error && (
        <p className="reviews-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="reviews-loading" aria-label="Carregando avaliações">
          <LoaderCircle size={22} aria-hidden="true" />
        </div>
      ) : reviews.length ? (
        <div className="review-list">
          {reviews.map((review) => (
            <article className="review-item" key={review.id}>
              <header>
                <div>
                  <strong>{review.usuario.nome}</strong>
                  <span className="review-stars" aria-label={`Nota ${review.nota} de 5`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={14}
                        fill={review.nota >= value ? 'currentColor' : 'none'}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                </div>
                <time dateTime={review.atualizadoEm}>
                  {formatDate(review.atualizadoEm)}
                </time>
              </header>
              {review.comentario && <p>{review.comentario}</p>}
              {review.resposta && (
                <div className="library-reply">
                  <MessageSquareReply size={17} aria-hidden="true" />
                  <div>
                    <strong>Resposta da biblioteca</strong>
                    <p>{review.resposta}</p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="reviews-empty">Este livro ainda não recebeu avaliações.</p>
      )}
    </section>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : 'Não foi possível carregar as avaliações.'
}
