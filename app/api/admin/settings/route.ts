import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Usa a tabela de profiles do admin como store simples de settings via metadata
// Settings ficam em uma linha da tabela app_settings (criada via upsert)
// Por simplicidade, usamos o Supabase como key-value store via tabela dedicada

async function isAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return data?.role === 'admin'
}

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'auto_approve_verifications')
    .maybeSingle()

  const auto = data?.value !== 'false' // default true

  return NextResponse.json({ auto_approve_verifications: auto })
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const supabase = await createClient()

  await supabase.from('app_settings').upsert(
    { key: 'auto_approve_verifications', value: String(body.auto_approve_verifications) },
    { onConflict: 'key' }
  )

  return NextResponse.json({ success: true })
}
