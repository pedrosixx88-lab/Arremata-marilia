import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// POST — solicitar upgrade premium (gera pagamento pendente)
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json()
  const { plan_months = 1 } = body

  if (![1, 3, 6, 12].includes(plan_months)) {
    return NextResponse.json({ error: 'Duração inválida.' }, { status: 400 })
  }

  const PRICE_PER_MONTH = 29.9
  const amount = +(PRICE_PER_MONTH * plan_months).toFixed(2)

  const service = createServiceClient()

  // Verifica se já tem pagamento pendente
  const { count } = await service
    .from('premium_payments')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pendente')

  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: 'Você já tem uma solicitação pendente.' }, { status: 409 })
  }

  const { data: payment, error } = await service
    .from('premium_payments')
    .insert({ user_id: user.id, amount, plan_months, method: 'pix' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao criar solicitação.' }, { status: 500 })

  // Notifica admins — busca primeiro admin
  try {
    const { data: admin } = await service
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single()

    if (admin) {
      await service.from('notifications').insert({
        user_id: admin.id,
        type: 'premium_request',
        title: 'Solicitação de Premium',
        body: `Um usuário solicitou upgrade para Premium (${plan_months} mês${plan_months > 1 ? 'es' : ''} — R$ ${amount.toFixed(2).replace('.', ',')}).`,
        data: { payment_id: payment.id, user_id: user.id },
      })
    }
  } catch { /* non-critical */ }

  return NextResponse.json({ payment_id: payment.id, amount })
}

// GET — status do plano premium do usuário
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('id', user.id)
    .single()

  const service = createServiceClient()
  const { data: payments } = await service
    .from('premium_payments')
    .select('id, amount, plan_months, status, created_at, expires_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    is_premium: profile?.is_premium ?? false,
    premium_until: profile?.premium_until ?? null,
    payments: payments ?? [],
  })
}
