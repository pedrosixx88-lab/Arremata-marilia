'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { CheckCircle, XCircle, Eye, ChevronDown, ChevronUp } from 'lucide-react'

interface Listing {
  id: string
  title: string
  description: string
  neighborhood: string
  delivery_type: string
  starting_bid: number
  reserve_price: number | null
  min_increment: number
  ends_at: string
  photo_urls: string[]
  created_at: string
  profiles: {
    full_name: string
    verification_status: string
  } | null
  categories: {
    name: string
  } | null
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ListingReviewCard({
  listing,
  onAction,
}: {
  listing: Listing
  onAction: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handle(action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectNote.trim()) {
      toast.error('Informe o motivo da reprovação.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/moderacao/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: rejectNote || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao processar.')
        return
      }
      toast.success(action === 'approve' ? 'Anúncio aprovado!' : 'Anúncio reprovado.')
      onAction()
    } catch {
      toast.error('Erro ao processar.')
    } finally {
      setLoading(false)
    }
  }

  const seller = listing.profiles
  const category = listing.categories

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="flex gap-4 p-4">
        {/* Foto capa */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          {listing.photo_urls?.[0] ? (
            <Image src={listing.photo_urls[0]} alt={listing.title} fill className="object-cover" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">?</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-snug">{listing.title}</p>
              {category && <p className="text-xs text-orange-500 mt-0.5">{category.name}</p>}
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
            <span>{listing.neighborhood}</span>
            <span>Lance mín: {formatCurrency(listing.starting_bid)}</span>
            {listing.reserve_price && <span>Reserva: {formatCurrency(listing.reserve_price)}</span>}
            <span>Incremento: {formatCurrency(listing.min_increment)}</span>
          </div>

          {seller && (
            <p className="mt-1 text-xs text-gray-400">
              Vendedor: <span className="font-medium text-gray-700">{seller.full_name}</span>
              {seller.verification_status === 'verified' && (
                <span className="ml-1 text-green-600">✓ Verificado</span>
              )}
            </p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
          <p className="text-sm text-gray-700 whitespace-pre-line">{listing.description}</p>

          {listing.photo_urls && listing.photo_urls.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {listing.photo_urls.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={url} alt={`foto ${i + 1}`} fill className="object-cover" unoptimized />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ações */}
      <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handle('approve')}
          disabled={loading}
          className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Aprovar
        </button>

        {!showRejectInput ? (
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={loading}
            className="flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Reprovar
          </button>
        ) : (
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Motivo da reprovação"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={() => handle('reject')}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => { setShowRejectInput(false); setRejectNote('') }}
              className="text-gray-400 hover:text-gray-600 px-2"
            >
              Cancelar
            </button>
          </div>
        )}

        <a
          href={`/anuncios/${listing.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 ml-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver
        </a>
      </div>
    </div>
  )
}

export default function ModeracaoPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/moderacao')
      if (!res.ok) return
      const json = await res.json()
      setListings(json.listings ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Moderação de Anúncios</h1>
        <span className="text-sm text-gray-500">{listings.length} pendente{listings.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="font-medium">Nenhum anúncio para moderar</p>
          <p className="text-sm mt-1">Todos os anúncios foram revisados.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <ListingReviewCard key={l.id} listing={l} onAction={load} />
          ))}
        </div>
      )}
    </div>
  )
}
