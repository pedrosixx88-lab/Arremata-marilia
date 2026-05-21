'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, AlertTriangle } from 'lucide-react'

const CATEGORIES = [
  { value: 'item_nao_entregue', label: 'Item não entregue' },
  { value: 'item_diferente', label: 'Item diferente do anunciado' },
  { value: 'item_danificado', label: 'Item danificado' },
  { value: 'pagamento_nao_recebido', label: 'Pagamento não recebido' },
  { value: 'nao_compareceu', label: 'Não compareceu para entrega' },
  { value: 'outro', label: 'Outro problema' },
]

function NovaDisputaForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const listingId = searchParams.get('listing_id') ?? ''

  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [listingTitle, setListingTitle] = useState('')

  useEffect(() => {
    if (!listingId) return
    fetch(`/api/reviews/check?listing_id=${listingId}`)
      .then(r => r.json())
      .then(d => { if (d.title) setListingTitle(d.title) })
      .catch(() => {})
  }, [listingId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!category) { setError('Selecione a categoria do problema.'); return }
    if (description.trim().length < 20) { setError('Descreva o problema com pelo menos 20 caracteres.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/disputas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, category, description }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao abrir disputa.'); return }
      router.push(`/disputas/${json.dispute_id}`)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!listingId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Arremate não especificado.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href={`/arremates/${listingId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Abrir disputa</h1>
              {listingTitle && (
                <p className="text-sm text-gray-500 truncate max-w-xs">{listingTitle}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Qual é o problema?
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
              >
                <option value="">Selecione...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descrição detalhada
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="Descreva o problema com o máximo de detalhes possível..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
              Ao abrir uma disputa, a outra parte será notificada e terá 72 horas para responder.
              Nossa equipe irá mediar o caso.
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {submitting ? 'Abrindo disputa...' : 'Abrir disputa'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NovaDisputaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-sm text-gray-400">Carregando...</p></div>}>
      <NovaDisputaForm />
    </Suspense>
  )
}
