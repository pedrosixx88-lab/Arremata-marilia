import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const service = createServiceClient()
  const { data: commissions } = await service
    .from('commissions')
    .select(`
      id, sale_amount, rate, commission_amount, status, created_at,
      listing:listings!listing_id(id, title),
      seller:profiles!seller_id(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  const total = (commissions ?? []).reduce((acc, c) => acc + Number(c.commission_amount), 0)
  const pending = (commissions ?? []).filter(c => c.status === 'pendente').reduce((acc, c) => acc + Number(c.commission_amount), 0)

  return NextResponse.json({ commissions: commissions ?? [], total, pending })
}

// Calcula e registra comissão de um arremate (chamada internamente no encerramento)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const { listing_id } = await req.json()
  if (!listing_id) return NextResponse.json({ error: 'listing_id obrigatório.' }, { status: 400 })

  const service = createServiceClient()
  const { data: listing } = await service
    .from('listings')
    .select('id, title, current_bid, seller_id, winner_id, status')
    .eq('id', listing_id)
    .single()

  if (!listing || listing.status !== 'arremate_confirmado') {
    return NextResponse.json({ error: 'Arremate não confirmado.' }, { status: 400 })
  }

  // Verifica se comissão já foi calculada
  const { count } = await service
    .from('commissions')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listing_id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Comissão já registrada.' }, { status: 409 })
  }

  const rate = 0.10 // 10%
  const sale_amount = listing.current_bid ?? 0
  const commission_amount = +(sale_amount * rate).toFixed(2)

  const { data: commission, error } = await service
    .from('commissions')
    .insert({ listing_id, seller_id: listing.seller_id, winner_id: listing.winner_id, sale_amount, rate, commission_amount })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao registrar comissão.' }, { status: 500 })

  return NextResponse.json({ commission_id: commission.id, commission_amount })
}
