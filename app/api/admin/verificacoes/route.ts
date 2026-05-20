import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function GET() {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: verifications } = await supabase
    .from('identity_verifications')
    .select('id, user_id, document_url, selfie_url, status, created_at, profiles(full_name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return NextResponse.json({ verifications: verifications ?? [] })
}
