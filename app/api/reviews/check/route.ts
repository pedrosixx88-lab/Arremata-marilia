import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const listing_id = req.nextUrl.searchParams.get('listing_id')
  if (!listing_id) return NextResponse.json({ error: 'listing_id obrigatório.' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const service = createServiceClient()

  const [{ data: listing }, { count }] = await Promise.all([
    service
      .from('listings')
      .select('title, seller_id, winner_id, status')
      .eq('id', listing_id)
      .single(),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listing_id)
      .eq('reviewer_id', user.id),
  ])

  const isParticipant = listing?.seller_id === user.id || listing?.winner_id === user.id

  return NextResponse.json({
    title: listing?.title ?? '',
    status: listing?.status ?? '',
    is_participant: isParticipant,
    already_reviewed: (count ?? 0) > 0,
  })
}
