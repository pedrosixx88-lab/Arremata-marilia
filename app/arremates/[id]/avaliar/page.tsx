'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Star, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function AvaliarPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [listingTitle, setListingTitle] = useState('')

  const checkStatus = useCallback(async () => {
    const res = await fetch(`/api/reviews/check?listing_id=${id}`)
    if (res.ok) {
      const data = await res.json()
      setListingTitle(data.title ?? '')
      setAlreadyReviewed(data.already_reviewed ?? false)
    }
  }, [id])

  useEffect(() => { void checkStatus() }, [checkStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Selecione uma nota de 1 a 5 estrelas.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: id, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao enviar avaliação.'); return }
      toast.success('Avaliação enviada com sucesso!')
      router.push(`/arremates/${id}`)
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  if (alreadyReviewed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-3">⭐</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Você já avaliou este arremate</h2>
          <p className="text-sm text-gray-500 mb-6">Sua avaliação já foi registrada.</p>
          <Link href="/dashboard" className="text-sm text-orange-500 hover:text-orange-600 font-medium">
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Avaliar arremate</h1>
          {listingTitle && (
            <p className="text-sm text-gray-500 mb-6 truncate">{listingTitle}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Estrelas */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Sua nota</p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHovered(s)}
                    onMouseLeave={() => setHovered(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        s <= (hovered || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-200'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {['', 'Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentário <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Conte como foi a experiência com este arremate..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
            </div>

            <button
              type="submit"
              disabled={loading || rating === 0}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar avaliação'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
