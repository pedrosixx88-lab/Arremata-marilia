import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const [
    { data: activeListings },
    { data: closedListings },
    { data: profile },
    { data: reviews },
  ] = await Promise.all([
    // Anúncios ativos do vendedor
    supabase
      .from('listings')
      .select('id, title, current_bid, starting_bid, bid_count, ends_at, photo_urls, status')
      .eq('seller_id', user.id)
      .eq('status', 'ativo')
      .order('ends_at', { ascending: true }),

    // Arremates encerrados (histórico)
    supabase
      .from('listings')
      .select(`
        id, title, current_bid, starting_bid, ends_at, status,
        winner:profiles!winner_id(id, full_name)
      `)
      .eq('seller_id', user.id)
      .in('status', ['arremate_confirmado', 'encerrado', 'cancelado'])
      .order('ends_at', { ascending: false })
      .limit(20),

    // Perfil do vendedor
    supabase
      .from('profiles')
      .select('full_name, verification_status, reputation_score, total_sales, is_premium')
      .eq('id', user.id)
      .single(),

    // Avaliações recebidas
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name)')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Total arrecadado (soma dos arremates confirmados)
  const totalEarned = (closedListings ?? [])
    .filter(l => l.status === 'arremate_confirmado')
    .reduce((sum, l) => sum + (l.current_bid ?? 0), 0)

  return NextResponse.json({
    activeListings: activeListings ?? [],
    closedListings: closedListings ?? [],
    profile: profile ?? null,
    reviews: reviews ?? [],
    totalEarned,
  })
}
