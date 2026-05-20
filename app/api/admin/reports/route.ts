import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const { data: reports } = await supabase
    .from('reports')
    .select(`
      id, category, description, resolved, created_at,
      reporter:profiles!reporter_id(id, full_name),
      listings(id, title, status, seller_id, profiles!seller_id(full_name))
    `)
    .order('created_at', { ascending: false })

  return NextResponse.json({ reports: reports ?? [] })
}
