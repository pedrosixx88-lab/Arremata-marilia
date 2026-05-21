import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const service = createServiceClient()
  const { data: dispute } = await service
    .from('disputes')
    .select(`
      id, listing_id, category, description, evidence_urls, status, resolution, created_at, updated_at,
      opener:profiles!opener_id(id, full_name),
      respondent:profiles!respondent_id(id, full_name),
      admin:profiles!admin_id(id, full_name),
      listing:listings!listing_id(id, title)
    `)
    .eq('id', id)
    .single()

  if (!dispute) return NextResponse.json({ error: 'Disputa não encontrada.' }, { status: 404 })

  const opener = Array.isArray(dispute.opener) ? dispute.opener[0] : dispute.opener
  const respondent = Array.isArray(dispute.respondent) ? dispute.respondent[0] : dispute.respondent

  const isParticipant = opener?.id === user.id || respondent?.id === user.id

  // Check admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  if (!isParticipant && !isAdmin) {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  return NextResponse.json({ dispute: { ...dispute, opener, respondent } })
}
