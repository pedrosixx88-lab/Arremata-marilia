import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  }

  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      description,
      neighborhood,
      delivery_type,
      starting_bid,
      reserve_price,
      min_increment,
      ends_at,
      photo_urls,
      created_at,
      profiles!seller_id (full_name, verification_status),
      categories!category_id (name)
    `)
    .eq('status', 'em_moderacao')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar anúncios.' }, { status: 500 })
  }

  return NextResponse.json({ listings: listings ?? [] })
}
