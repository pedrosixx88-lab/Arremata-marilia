'use client'

import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy } from 'lucide-react'
import type { BidEntry } from '@/hooks/use-realtime-bids'

interface BidHistoryProps {
  bids: BidEntry[]
  currentUserId?: string
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function BidHistory({ bids, currentUserId }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-4">
        Nenhum lance ainda. Seja o primeiro!
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {bids.map((bid, index) => {
        const isLeading = index === 0
        const isOwn = currentUserId && bid.bidder_id === currentUserId
        const label = isOwn ? 'Você' : 'Comprador anônimo'

        return (
          <div
            key={bid.id}
            className={`flex items-center justify-between py-2 px-3 rounded-xl text-sm transition-colors ${
              isLeading ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              {isLeading && <Trophy className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
              <span className={`${isLeading ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                {label}
                {bid.is_auto && (
                  <span className="ml-1 text-xs text-gray-400">(auto)</span>
                )}
              </span>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${isLeading ? 'text-orange-600' : 'text-gray-700'}`}>
                {formatCurrency(bid.amount)}
              </span>
              <span className="block text-xs text-gray-400">
                {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
