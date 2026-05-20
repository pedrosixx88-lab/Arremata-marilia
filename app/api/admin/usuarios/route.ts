import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, verification_status, is_premium, total_sales, total_purchases, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ users: users ?? [] })
}
