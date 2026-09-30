import { useEffect, useState } from 'react'
import {
  LoaderCircle,
  MessageSquareReply,
  RefreshCw,
  Star,
} from 'lucide-react'

import { ApiError } from './api/autenticacao'
import { getMyReviews, type BookReview } from './api/avaliacoes'
import './MyReviews.css'

export function MyReviews({ token }: { token: string }) {
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadReviews() {
    setLoading(true)
    setError(null)

    try {
      setReviews(await getMyReviews(token))
    } catch (loadError) {
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : 'Não foi possível carregar suas avaliações.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    getMyReviews(token)
      .then((nextReviews) => {
        if (active) setReviews(nextReviews)
      })
      .catch((loadError) => {
        if (!active) return
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : 'Não foi possível carregar suas avaliações.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  return (
    <section className="my-reviews workspace-content">
      <header className="my-reviews-heading">
        <div>
          <p className="section-label">Suas interações</p>
          <h1>Minhas avaliações</h1>
          <p>Acompanhe suas opiniões e as respostas recebidas.</p>
        </div>
        {!loading && reviews.length > 0 && (
          <span>{reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}</span>
        )}
      </header>

      {error && (
        <div className="my-reviews-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => void loadReviews()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {loading ? (
        <div className="my-reviews-loading" aria-label="Carregando avaliações">
          <LoaderCircle size={25} aria-hidden="true" />
          <span>Carregando avaliações</span>
        </div>
      ) : reviews.length ? (
        <div className="my-reviews-list">
          {reviews.map((review) => (
            <article className="my-review-card" key={review.id}>
              <div className="my-review-cover">
                {review.livro.urlCapa ? (
                  <img src={review.livro.urlCapa} alt={`Capa de ${review.livro.titulo}`} />
                ) : (
                  <Star size={25} aria-hidden="true" />
                )}
              </div>
              <div className="my-review-content">
                <header>
                  <div>
                    <h2>{review.livro.titulo}</h2>
                    <span className="my-review-stars" aria-label={`Nota ${review.nota} de 5`}>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <Star
                          key={value}
                          size={15}
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
                <p>{review.comentario ?? 'Avaliação sem comentário.'}</p>
                {review.resposta ? (
                  <div className="my-review-reply">
                    <MessageSquareReply size={18} aria-hidden="true" />
                    <div>
                      <strong>Resposta da biblioteca</strong>
                      <p>{review.resposta}</p>
                    </div>
                  </div>
                ) : (
                  <span className="awaiting-reply">Sem resposta da biblioteca</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : !error ? (
        <div className="my-reviews-empty">
          <Star size={28} aria-hidden="true" />
          <h2>Nenhuma avaliação publicada</h2>
          <p>Suas avaliações aparecerão aqui.</p>
        </div>
      ) : null}
    </section>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}
