import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const body = await req.json()
  const { action, note } = body

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 })
  }
  if (action === 'reject' && !note?.trim()) {
    return NextResponse.json({ error: 'Informe o motivo da reprovação.' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'ativo' : 'cancelado'

  const { error: updateError } = await supabase
    .from('listings')
    .update({
      status: newStatus,
      moderation_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('status', 'em_moderacao')

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar anúncio.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
