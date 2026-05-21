import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const service = createServiceClient()
  const { data: payments } = await service
    .from('premium_payments')
    .select(`
      id, amount, plan_months, status, method, created_at, expires_at,
      user:profiles!user_id(id, full_name, is_premium, premium_until)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ payments: payments ?? [] })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const { payment_id, action } = body // action: 'approve' | 'reject'

  if (!payment_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: payment } = await service
    .from('premium_payments')
    .select('id, user_id, plan_months, status')
    .eq('id', payment_id)
    .single()

  if (!payment) return NextResponse.json({ error: 'Pagamento não encontrado.' }, { status: 404 })
  if (payment.status !== 'pendente') return NextResponse.json({ error: 'Pagamento já processado.' }, { status: 409 })

  if (action === 'approve') {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + payment.plan_months)

    await service
      .from('premium_payments')
      .update({ status: 'aprovado', approved_by: user.id, approved_at: new Date().toISOString(), expires_at: expiresAt.toISOString() })
      .eq('id', payment_id)

    await service
      .from('profiles')
      .update({ is_premium: true, premium_until: expiresAt.toISOString() })
      .eq('id', payment.user_id)

    try {
      await service.from('notifications').insert({
        user_id: payment.user_id,
        type: 'premium_approved',
        title: 'Premium ativado!',
        body: `Seu plano Premium foi ativado por ${payment.plan_months} mês${payment.plan_months > 1 ? 'es' : ''}.`,
        data: { payment_id },
      })
    } catch { /* non-critical */ }

  } else {
    await service
      .from('premium_payments')
      .update({ status: 'recusado', approved_by: user.id, approved_at: new Date().toISOString() })
      .eq('id', payment_id)

    try {
      await service.from('notifications').insert({
        user_id: payment.user_id,
        type: 'premium_rejected',
        title: 'Solicitação Premium recusada',
        body: 'Sua solicitação de Premium foi recusada. Entre em contato para mais informações.',
        data: { payment_id },
      })
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ ok: true })
}
