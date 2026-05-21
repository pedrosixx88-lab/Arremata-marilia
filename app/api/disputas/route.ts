import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  // 3 disputas por hora por usuário
  if (!rateLimit(`disputa:${user.id}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 })
  }

  const body = await req.json()
  const { listing_id, category, description } = body

  if (!listing_id || !category || !description?.trim()) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const service = createServiceClient()

  // Verifica participação no arremate
  const { data: listing } = await service
    .from('listings')
    .select('seller_id, winner_id, status, title')
    .eq('id', listing_id)
    .eq('status', 'arremate_confirmado')
    .single()

  if (!listing) return NextResponse.json({ error: 'Arremate não encontrado.' }, { status: 404 })

  const isSeller = listing.seller_id === user.id
  const isWinner = listing.winner_id === user.id
  if (!isSeller && !isWinner) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  // Verifica se já existe disputa aberta para este arremate
  const { count } = await service
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listing_id)
    .in('status', ['aberta', 'em_analise'])

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Já existe uma disputa em aberto para este arremate.' }, { status: 409 })
  }

  const respondent_id = isSeller ? listing.winner_id : listing.seller_id

  const { data: dispute, error } = await service
    .from('disputes')
    .insert({ listing_id, opener_id: user.id, respondent_id, category, description: description.trim() })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao abrir disputa.' }, { status: 500 })

  // Notifica o respondente
  try {
    await service.from('notifications').insert({
      user_id: respondent_id,
      type: 'dispute_opened',
      title: 'Disputa aberta',
      body: `Uma disputa foi aberta sobre "${listing.title}".`,
      data: { listing_id, dispute_id: dispute.id },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({ dispute_id: dispute.id })
}
