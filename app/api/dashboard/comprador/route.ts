import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const service = createServiceClient()

  // Lances ativos do comprador (anúncios ainda em andamento)
  const { data: activeBids } = await supabase
    .from('bids')
    .select(`
      id, amount, created_at, is_auto,
      listing:listings!listing_id(
        id, title, current_bid, bid_count, ends_at, photo_urls, status, min_increment
      )
    `)
    .eq('bidder_id', user.id)
    .order('created_at', { ascending: false })

  // Deduplica por listing — mantém apenas o lance mais recente por anúncio
  const seenListings = new Set<string>()
  const uniqueActiveBids = (activeBids ?? []).filter(b => {
    const listing = Array.isArray(b.listing) ? b.listing[0] : b.listing
    if (!listing || listing.status !== 'ativo') return false
    if (seenListings.has(listing.id)) return false
    seenListings.add(listing.id)
    return true
  })

  // Arremates ganhos pelo comprador — usa service role pois a RLS restringe winner_id
  const { data: wonListings } = await service
    .from('listings')
    .select('id, title, current_bid, ends_at, status, photo_urls, seller:profiles!seller_id(full_name)')
    .eq('winner_id', user.id)
    .order('ends_at', { ascending: false })
    .limit(20)

  // Lances em anúncios já encerrados onde o comprador participou mas não ganhou
  const { data: lostBids } = await supabase
    .from('bids')
    .select(`
      listing:listings!listing_id(
        id, title, current_bid, ends_at, status, winner_id
      )
    `)
    .eq('bidder_id', user.id)
    .order('created_at', { ascending: false })

  const seenLost = new Set<string>()
  const lostListings = (lostBids ?? [])
    .map(b => Array.isArray(b.listing) ? b.listing[0] : b.listing)
    .filter(l => l && ['arremate_confirmado', 'encerrado'].includes(l.status) && l.winner_id !== user.id)
    .filter(l => {
      if (!l || seenLost.has(l.id)) return false
      seenLost.add(l.id)
      return true
    })
    .slice(0, 10)

  return NextResponse.json({
    activeBids: uniqueActiveBids,
    wonListings: wonListings ?? [],
    lostListings,
  })
}
