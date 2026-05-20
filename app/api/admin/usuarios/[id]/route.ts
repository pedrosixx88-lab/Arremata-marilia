import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const { action } = body // 'suspend' | 'ban' | 'restore'

  const roleMap: Record<string, string> = { suspend: 'suspended', ban: 'banned', restore: 'user' }
  const newRole = roleMap[action]
  if (!newRole) return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })

  await supabase.from('profiles').update({ role: newRole }).eq('id', id)

  // Ban permanente: desativa a conta no Auth
  if (action === 'ban') {
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminClient.auth.admin.updateUserById(id, { ban_duration: '876600h' })
  }

  if (action === 'restore') {
    const adminClient = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await adminClient.auth.admin.updateUserById(id, { ban_duration: 'none' })
  }

  return NextResponse.json({ ok: true })
}
