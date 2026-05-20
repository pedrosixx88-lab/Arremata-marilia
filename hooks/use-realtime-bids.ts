'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BidEntry {
  id: string
  amount: number
  created_at: string
  bidder_id: string
  is_auto: boolean
}

interface RealtimeBidsState {
  currentBid: number
  bidCount: number
  bids: BidEntry[]
  endsAt: Date
}

export function useRealtimeBids(
  listingId: string,
  initial: { currentBid: number; bidCount: number; bids: BidEntry[]; endsAt: Date }
) {
  const [state, setState] = useState<RealtimeBidsState>(initial)

  const addBid = useCallback((bid: BidEntry) => {
    setState((prev) => ({
      ...prev,
      currentBid: bid.amount,
      bidCount: prev.bidCount + 1,
      bids: [bid, ...prev.bids].slice(0, 50),
    }))
  }, [])

  const updateEndsAt = useCallback((endsAt: string) => {
    setState((prev) => ({ ...prev, endsAt: new Date(endsAt) }))
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`listing:${listingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `listing_id=eq.${listingId}` },
        (payload) => {
          addBid(payload.new as BidEntry)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `id=eq.${listingId}`,
        },
        (payload) => {
          if (payload.new.ends_at) {
            updateEndsAt(payload.new.ends_at as string)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId, addBid, updateEndsAt])

  return state
}
