import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const { action } = body // 'dismiss' | 'remove_listing' | 'warn_user'

  const { data: report } = await supabase
    .from('reports')
    .select('listing_id')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'Denúncia não encontrada.' }, { status: 404 })

  if (action === 'remove_listing' && report.listing_id) {
    await supabase.from('listings').update({ status: 'cancelado' }).eq('id', report.listing_id)
  }

  await supabase.from('reports').update({ resolved: true, resolved_by: user.id }).eq('id', id)

  return NextResponse.json({ ok: true })
}
