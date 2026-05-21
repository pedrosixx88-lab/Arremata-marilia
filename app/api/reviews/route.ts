import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json()
  const { listing_id, rating, comment } = body

  if (!listing_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const service = createServiceClient()

  // Usa service role — buyer (winner) não consegue ler arremate_confirmado por RLS
  const { data: listing } = await service
    .from('listings')
    .select('id, seller_id, winner_id, status')
    .eq('id', listing_id)
    .eq('status', 'arremate_confirmado')
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Arremate não encontrado ou não confirmado.' }, { status: 404 })
  }

  const isSeller = listing.seller_id === user.id
  const isWinner = listing.winner_id === user.id

  if (!isSeller && !isWinner) {
    return NextResponse.json({ error: 'Você não participou deste arremate.' }, { status: 403 })
  }

  // reviewee é a outra parte
  const reviewee_id = isSeller ? listing.winner_id : listing.seller_id

  if (!reviewee_id) {
    return NextResponse.json({ error: 'Não há vencedor definido.' }, { status: 400 })
  }

  // Verifica se já avaliou
  const { count } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listing_id)
    .eq('reviewer_id', user.id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Você já avaliou este arremate.' }, { status: 409 })
  }

  const { error } = await supabase.from('reviews').insert({
    listing_id,
    reviewer_id: user.id,
    reviewee_id,
    rating,
    comment: comment?.trim() || null,
  })

  if (error) return NextResponse.json({ error: 'Erro ao salvar avaliação.' }, { status: 500 })

  // Notifica o avaliado
  try {
    await supabase.from('notifications').insert({
      user_id: reviewee_id,
      type: 'new_review',
      title: 'Nova avaliação recebida',
      body: `Você recebeu uma avaliação de ${rating} estrela${rating !== 1 ? 's' : ''}.`,
      data: { listing_id },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true })
}
