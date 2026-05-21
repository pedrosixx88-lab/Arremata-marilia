'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Gavel, Trophy, XCircle, ShoppingBag, LayoutDashboard } from 'lucide-react'
import { useRealtimeBids } from '@/hooks/use-realtime-bids'
import { BidTimer } from '@/components/bids/bid-timer'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface ActiveBid {
  id: string
  amount: number
  created_at: string
  is_auto: boolean
  listing: {
    id: string
    title: string
    current_bid: number
    bid_count: number
    ends_at: string
    photo_urls: string[]
    status: string
    min_increment: number
  } | null
}

interface ClosedListing {
  id: string
  title: string
  current_bid: number | null
  ends_at: string
  status: string
  photo_urls: string[]
}

// Card de lance ativo com Realtime
function ActiveBidCard({ bid }: { bid: ActiveBid }) {
  const listing = bid.listing

  const { currentBid, bidCount, endsAt } = useRealtimeBids(listing?.id ?? '', {
    currentBid: listing?.current_bid ?? 0,
    bidCount: listing?.bid_count ?? 0,
    bids: [],
    endsAt: new Date(listing?.ends_at ?? 0),
  })

  if (!listing) return null

  const isLeading = bid.amount >= currentBid

  return (
    <Link
      href={`/anuncios/${listing.id}`}
      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
        isLeading
          ? 'bg-green-50 border-green-200 hover:border-green-300'
          : 'bg-red-50 border-red-200 hover:border-red-300'
      }`}
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
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
            isLeading ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isLeading ? '✓ Liderando' : '↑ Superado'}
          </span>
          <span className="text-xs text-gray-400">{bidCount} lances</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          Seu lance: {formatCurrency(bid.amount)}
          {bid.is_auto && <span className="text-gray-400"> (auto)</span>}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-gray-900">{formatCurrency(currentBid)}</p>
        <BidTimer endsAt={new Date(endsAt)} />
      </div>
    </Link>
  )
}

interface DashboardData {
  activeBids: ActiveBid[]
  wonListings: ClosedListing[]
  lostListings: ClosedListing[]
}

export default function CompradorDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ativos' | 'ganhos' | 'perdidos'>('ativos')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/comprador')
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

  const activeBids = data?.activeBids ?? []
  const wonListings = data?.wonListings ?? []
  const lostListings = data?.lostListings ?? []
  const leading = activeBids.filter(b => {
    const listing = b.listing
    return listing && b.amount >= listing.current_bid
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-orange-500" />
            <h1 className="text-lg font-bold text-gray-900">Meus Lances</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/vendedor"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              Ver como vendedor
            </Link>
            <Link
              href="/anuncios"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Gavel className="w-4 h-4" />
              Ver anúncios
            </Link>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Lances ativos</p>
            <p className="text-2xl font-bold text-gray-900">{activeBids.length}</p>
          </div>
          <div className="bg-white border border-green-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Liderando</p>
            <p className="text-2xl font-bold text-green-600">{leading.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Arremates ganhos</p>
            <p className="text-2xl font-bold text-orange-600">{wonListings.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-xl w-fit">
          {(['ativos', 'ganhos', 'perdidos'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-1.5 rounded-lg transition-colors font-medium ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'ativos' ? `Em andamento (${activeBids.length})` :
               t === 'ganhos' ? `Ganhos (${wonListings.length})` :
               `Perdidos (${lostListings.length})`}
            </button>
          ))}
        </div>

        {/* Tab: Lances ativos */}
        {tab === 'ativos' && (
          <div className="space-y-2">
            {activeBids.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Gavel className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 mb-4">Você não tem lances em andamento.</p>
                <Link
                  href="/anuncios"
                  className="inline-flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  Explorar anúncios
                </Link>
              </div>
            ) : (
              activeBids.map(b => <ActiveBidCard key={b.id} bid={b} />)
            )}
          </div>
        )}

        {/* Tab: Arremates ganhos */}
        {tab === 'ganhos' && (
          <div className="space-y-2">
            {wonListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <Trophy className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Você ainda não ganhou nenhum arremate.</p>
              </div>
            ) : (
              wonListings.map(l => (
                <Link
                  key={l.id}
                  href={`/arremates/${l.id}`}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-orange-200 transition-colors"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {l.photo_urls?.[0] ? (
                      <Image src={l.photo_urls[0]} alt={l.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(l.ends_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-orange-600">{formatCurrency(l.current_bid ?? 0)}</p>
                    <span className="text-xs text-green-600 font-medium flex items-center gap-0.5 justify-end">
                      <Trophy className="w-3 h-3" /> Ganho
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Tab: Arremates perdidos */}
        {tab === 'perdidos' && (
          <div className="space-y-2">
            {lostListings.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Nenhum arremate perdido até agora.</p>
              </div>
            ) : (
              lostListings.map(l => (
                <div
                  key={l.id}
                  className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl opacity-70"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {l.photo_urls?.[0] ? (
                      <Image src={l.photo_urls[0]} alt={l.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(l.ends_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-gray-600">{formatCurrency(l.current_bid ?? 0)}</p>
                    <span className="text-xs text-gray-400 flex items-center gap-0.5 justify-end">
                      <XCircle className="w-3 h-3" /> Perdido
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
