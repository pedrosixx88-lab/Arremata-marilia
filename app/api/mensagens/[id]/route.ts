import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: listing_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const service = createServiceClient()

  // Usa service role para buscar o arremate — buyer (winner) não consegue ler por RLS
  const { data: listing } = await service
    .from('listings')
    .select('id, title, seller_id, winner_id, status')
    .eq('id', listing_id)
    .eq('status', 'arremate_confirmado')
    .single()

  if (!listing) return NextResponse.json({ error: 'Arremate não encontrado.' }, { status: 404 })

  const isParticipant = listing.seller_id === user.id || listing.winner_id === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, sender_id, created_at, read_at')
    .eq('listing_id', listing_id)
    .order('created_at', { ascending: true })

  // Marca como lidas as mensagens recebidas
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('listing_id', listing_id)
    .eq('receiver_id', user.id)
    .is('read_at', null)

  const partnerId = listing.seller_id === user.id ? listing.winner_id : listing.seller_id

  return NextResponse.json({
    listing: { id: listing.id, title: listing.title },
    messages: messages ?? [],
    currentUserId: user.id,
    partnerId,
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: listing_id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const body = await req.json()
  const content = body.content?.trim()
  if (!content) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 })

  const service = createServiceClient()
  const { data: listing } = await service
    .from('listings')
    .select('seller_id, winner_id, title, status')
    .eq('id', listing_id)
    .eq('status', 'arremate_confirmado')
    .single()

  if (!listing) return NextResponse.json({ error: 'Arremate não encontrado.' }, { status: 404 })

  const isParticipant = listing.seller_id === user.id || listing.winner_id === user.id
  if (!isParticipant) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const receiver_id = listing.seller_id === user.id ? listing.winner_id : listing.seller_id

  // Usa service role no INSERT para evitar falha na subquery RLS de messages_insert
  const { data: message, error } = await service
    .from('messages')
    .insert({ listing_id, sender_id: user.id, receiver_id, content })
    .select('id, content, sender_id, created_at, read_at')
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao enviar mensagem.' }, { status: 500 })

  // Broadcast via Realtime REST API — não precisa de WebSocket no servidor
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        body: JSON.stringify({
          messages: [
            {
              topic: `chat-broadcast:${listing_id}`,
              event: 'new_message',
              payload: message,
            },
          ],
        }),
      }
    )
  } catch { /* non-critical */ }

  // Notifica o receptor
  try {
    await service.from('notifications').insert({
      user_id: receiver_id,
      type: 'new_message',
      title: 'Nova mensagem',
      body: `Você recebeu uma mensagem sobre "${listing.title}".`,
      data: { listing_id },
    })
  } catch { /* non-critical */ }

  return NextResponse.json({ message })
}
