import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  // Busca dados do anúncio e vendedor para o e-mail
  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, seller_id, profiles!seller_id(full_name, email)')
    .eq('id', id)
    .eq('status', 'em_moderacao')
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Anúncio não encontrado ou já moderado.' }, { status: 404 })
  }

  const { error: updateError } = await supabase
    .from('listings')
    .update({
      status: newStatus,
      moderation_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar anúncio.' }, { status: 500 })
  }

  // Envia e-mail ao vendedor
  const seller = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
  if (seller?.email && process.env.RESEND_API_KEY) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (action === 'approve') {
      await resend.emails.send({
        from: 'ArremataMarília <noreply@arrematemarilia.com.br>',
        to: seller.email,
        subject: '✅ Seu anúncio foi aprovado!',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#ea580c">ArremataMarília</h2>
            <h3>Seu anúncio foi aprovado! 🎉</h3>
            <p>Olá, <strong>${seller.full_name}</strong>!</p>
            <p>Ótima notícia: seu anúncio <strong>"${listing.title}"</strong> foi revisado e aprovado pela nossa equipe. Ele já está disponível para receber lances.</p>
            <a href="${appUrl}/anuncios/${listing.id}" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
              Ver meu anúncio
            </a>
            <p style="margin-top:24px;color:#6b7280;font-size:13px">Boa sorte no leilão!</p>
          </div>
        `,
      }).catch(() => {})
    } else {
      await resend.emails.send({
        from: 'ArremataMarília <noreply@arrematemarilia.com.br>',
        to: seller.email,
        subject: '❌ Seu anúncio foi reprovado',
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#ea580c">ArremataMarília</h2>
            <h3>Anúncio reprovado</h3>
            <p>Olá, <strong>${seller.full_name}</strong>!</p>
            <p>Infelizmente seu anúncio <strong>"${listing.title}"</strong> não foi aprovado pela nossa equipe.</p>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;font-weight:600;color:#dc2626">Motivo:</p>
              <p style="margin:8px 0 0;color:#374151">${note}</p>
            </div>
            <p>Se tiver dúvidas ou acreditar que houve um engano, entre em contato com nosso suporte.</p>
            <a href="${appUrl}/anunciar" style="display:inline-block;background:#ea580c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">
              Criar novo anúncio
            </a>
          </div>
        `,
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true })
}
