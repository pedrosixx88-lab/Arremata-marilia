'use client'

import { useState } from 'react'
import { BidTimer } from './bid-timer'
import { BidForm } from './bid-form'
import { BidHistory } from './bid-history'
import { AutoBidForm } from './autobid-form'
import { useRealtimeBids, type BidEntry } from '@/hooks/use-realtime-bids'

interface BidsSectionProps {
  listingId: string
  initialCurrentBid: number
  initialBidCount: number
  initialBids: BidEntry[]
  initialEndsAt: string
  minIncrement: number
  startingBid: number
  currentUserId?: string
  sellerId: string
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function BidsSection({
  listingId,
  initialCurrentBid,
  initialBidCount,
  initialBids,
  initialEndsAt,
  minIncrement,
  startingBid,
  currentUserId,
  sellerId,
}: BidsSectionProps) {
  const [isExpired, setIsExpired] = useState(false)

  const { currentBid, bidCount, bids, endsAt } = useRealtimeBids(listingId, {
    currentBid: initialCurrentBid,
    bidCount: initialBidCount,
    bids: initialBids,
    endsAt: new Date(initialEndsAt),
  })

  const isLoggedIn = !!currentUserId
  const isSeller = currentUserId === sellerId
  const displayBid = currentBid ?? startingBid

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
      {/* Lance atual */}
      <div>
        <p className="text-xs text-gray-500">{bidCount > 0 ? 'Lance atual' : 'Lance mínimo'}</p>
        <p className="text-3xl font-bold text-gray-900 transition-all">{formatCurrency(displayBid)}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {bidCount} {bidCount === 1 ? 'lance' : 'lances'} • Incremento mínimo: {formatCurrency(minIncrement)}
        </p>
      </div>

      {/* Timer */}
      <BidTimer endsAt={endsAt} onExpire={() => setIsExpired(true)} />

      {/* Formulário de lance */}
      <BidForm
        listingId={listingId}
        currentBid={displayBid}
        minIncrement={minIncrement}
        isEnded={isExpired || endsAt <= new Date()}
        isLoggedIn={isLoggedIn}
        isSeller={isSeller}
      />

      {/* Lance automático */}
      <AutoBidForm
        listingId={listingId}
        currentBid={displayBid}
        minIncrement={minIncrement}
        isEnded={isExpired || endsAt <= new Date()}
        isLoggedIn={isLoggedIn}
        isSeller={isSeller}
      />

      {/* Histórico */}
      {bids.length > 0 && (
        <div className="pt-2 border-t border-orange-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Histórico de lances</h3>
          <BidHistory bids={bids} currentUserId={currentUserId} />
        </div>
      )}
    </div>
  )
}
