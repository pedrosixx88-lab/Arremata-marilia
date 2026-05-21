'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Gavel, ShieldCheck, ShieldAlert, Star,
  Package, CheckCircle, XCircle, Clock, Plus, LayoutDashboard,
} from 'lucide-react'
import { useRealtimeBids } from '@/hooks/use-realtime-bids'
import { BidTimer } from '@/components/bids/bid-timer'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ActiveListing {
  id: string
  title: string
  current_bid: number | null
  starting_bid: number
  bid_count: number
  ends_at: string
  photo_urls: string[]
  status: string
}

interface ClosedListing {
  id: string
  title: string
  current_bid: number | null
  starting_bid: number
  ends_at: string
  status: string
  winner: { id: string; full_name: string } | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { full_name: string } | null
}

interface Profile {
  full_name: string
  verification_status: string
  reputation_score: number | null
  total_sales: number
  is_premium: boolean
}

interface DashboardData {
  activeListings: ActiveListing[]
  closedListings: ClosedListing[]
  profile: Profile | null
  reviews: Review[]
  totalEarned: number
}

// Mini-card de anúncio ativo com lance em tempo real
function ActiveListingCard({ listing }: { listing: ActiveListing }) {
  const { currentBid, bidCount, endsAt } = useRealtimeBids(listing.id, {
    currentBid: listing.current_bid ?? listing.starting_bid,
    bidCount: listing.bid_count,
    bids: [],
    endsAt: new Date(listing.ends_at),
  })

  return (
    <Link
      href={`/anuncios/${listing.id}`}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-orange-200 transition-colors"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {listing.photo_urls?.[0] ? (
          <Image src={listing.photo_urls[0]} alt={listing.title} fill className="object-cover" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gavel className="w-5 h-5 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{listing.title}</p>
        <p className="text-base font-bold text-orange-600">{formatCurrency(currentBid)}</p>
        <p className="text-xs text-gray-400">{bidCount} lance{bidCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="shrink-0 text-right">
        <BidTimer endsAt={new Date(endsAt)} />
      </div>
    </Link>
  )
}

const STATUS_LABEL: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  arremate_confirmado: { label: 'Arrematado', icon: <CheckCircle className="w-3.5 h-3.5" />, cls: 'text-green-600' },
  encerrado:          { label: 'Encerrado',   icon: <XCircle className="w-3.5 h-3.5" />,    cls: 'text-gray-400' },
  cancelado:          { label: 'Cancelado',   icon: <XCircle className="w-3.5 h-3.5" />,    cls: 'text-red-400' },
}

export default function VendedorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ativos' | 'historico' | 'avaliacoes'>('ativos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/vendedor')
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Carregando dashboard...</p>
      </div>
    )
  }

  const profile = data?.profile
  const totalEarned = data?.totalEarned ?? 0
  const activeListings = data?.activeListings ?? []
  const closedListings = data?.closedListings ?? []
  const reviews = data?.reviews ?? []
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-orange-500" />
            <h1 className="text-lg font-bold text-gray-900">Meu Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/comprador"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Ver como comprador
            </Link>
            <Link
              href="/anunciar"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo anúncio
            </Link>
          </div>
        </div>

        {/* Status de verificação */}
        {profile?.verification_status !== 'verified' && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">Conta não verificada</p>
              <p className="text-xs text-yellow-600">Verifique sua identidade para poder anunciar e transmitir mais confiança.</p>
            </div>
            <Link
              href="/verificacao"
              className="text-sm font-semibold text-yellow-700 hover:text-yellow-900 whitespace-nowrap"
            >
              Verificar agora →
            </Link>
          </div>
        )}

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Anúncios ativos</p>
            <p className="text-2xl font-bold text-gray-900">{activeListings.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Total arrecadado</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalEarned)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Vendas realizadas</p>
            <p className="text-2xl font-bold text-gray-900">{profile?.total_sales ?? 0}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Avaliação média</p>
            <p className="text-2xl font-bold text-gray-900">
              {avgRating !== null ? avgRating.toFixed(1) : '—'}
              {avgRating !== null && <span className="text-sm text-yellow-400 ml-1">★</span>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {(['ativos', 'historico', 'avaliacoes'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors font-medium ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'ativos' ? `Ativos (${activeListings.length})` : t === 'historico' ? 'Histórico' : 'Avaliações'}
            </button>
          ))}
        </div>

        {/* Tab: Anúncios ativos */}
        {tab === 'ativos' && (
          <div className="space-y-2">
            {activeListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Package className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 mb-4">Você não tem anúncios ativos no momento.</p>
                <Link
                  href="/anunciar"
                  className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar primeiro anúncio
                </Link>
              </div>
            ) : (
              activeListings.map(l => <ActiveListingCard key={l.id} listing={l} />)
            )}
          </div>
        )}

        {/* Tab: Histórico */}
        {tab === 'historico' && (
          <div className="space-y-2">
            {closedListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Clock className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhum arremate finalizado ainda.</p>
              </div>
            ) : (
              closedListings.map(l => {
                const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.encerrado
                const winner = Array.isArray(l.winner) ? l.winner[0] : l.winner
                return (
                  <div key={l.id} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className={`flex items-center gap-1 font-medium ${st.cls}`}>
                          {st.icon}{st.label}
                        </span>
                        {winner && (
                          <span className="text-gray-400">• Arrematante: {winner.full_name}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(l.ends_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-gray-900">
                        {formatCurrency(l.current_bid ?? l.starting_bid)}
                      </p>
                      {l.status === 'arremate_confirmado' && (
                        <p className="text-xs text-green-600 font-medium">
                          {formatCurrency((l.current_bid ?? 0) * 0.9)} líquido
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab: Avaliações */}
        {tab === 'avaliacoes' && (
          <div className="space-y-2">
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Star className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhuma avaliação recebida ainda.</p>
              </div>
            ) : (
              reviews.map(r => {
                const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
                return (
                  <div key={r.id} className="p-4 bg-white border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{reviewer?.full_name ?? 'Usuário'}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Badge verificado no rodapé */}
        {profile?.verification_status === 'verified' && (
          <div className="mt-6 flex items-center gap-2 text-sm text-green-600">
            <ShieldCheck className="w-4 h-4" />
            <span>Conta verificada — os compradores confiam mais em você.</span>
          </div>
        )}
      </div>
    </div>
  )
}
