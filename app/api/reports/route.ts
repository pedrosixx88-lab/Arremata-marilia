import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Faça login para denunciar.' }, { status: 401 })

  const body = await req.json()
  const { listing_id, reason, description } = body

  if (!listing_id || !reason) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  // Evita denúncia duplicada do mesmo usuário no mesmo anúncio
  const { count } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listing_id)
    .eq('reporter_id', user.id)

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Você já denunciou este anúncio.' }, { status: 409 })
  }

  const { error } = await supabase.from('reports').insert({
    listing_id,
    reporter_id: user.id,
    category: reason,
    description: description || null,
    resolved: false,
  })

  if (error) return NextResponse.json({ error: 'Erro ao registrar denúncia.' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
