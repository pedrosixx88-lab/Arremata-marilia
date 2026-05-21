import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteContext { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const body = await req.json()
  const { status, resolution } = body

  const validStatuses = ['em_analise', 'resolvida', 'encerrada']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data: dispute } = await service
    .from('disputes')
    .select('id, listing_id, opener_id, respondent_id, status')
    .eq('id', id)
    .single()

  if (!dispute) return NextResponse.json({ error: 'Disputa não encontrada.' }, { status: 404 })

  const { error } = await service
    .from('disputes')
    .update({ status, resolution: resolution?.trim() || null, admin_id: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: 'Erro ao atualizar disputa.' }, { status: 500 })

  const { data: listing } = await service
    .from('listings')
    .select('title')
    .eq('id', dispute.listing_id)
    .single()

  const statusLabel: Record<string, string> = {
    em_analise: 'em análise',
    resolvida: 'resolvida',
    encerrada: 'encerrada',
  }

  const notifBody = `Sua disputa sobre "${listing?.title}" foi atualizada: ${statusLabel[status] ?? status}.`

  try {
    await service.from('notifications').insert([
      { user_id: dispute.opener_id, type: 'dispute_updated', title: 'Disputa atualizada', body: notifBody, data: { dispute_id: id, listing_id: dispute.listing_id } },
      { user_id: dispute.respondent_id, type: 'dispute_updated', title: 'Disputa atualizada', body: notifBody, data: { dispute_id: id, listing_id: dispute.listing_id } },
    ])
  } catch { /* non-critical */ }

  return NextResponse.json({ ok: true })
}
