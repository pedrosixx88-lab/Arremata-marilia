import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendVerificationApproved, sendVerificationRejected } from '@/lib/emails/send-verification-email'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { action, rejection_reason } = await request.json()
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const newStatus = action === 'approve' ? 'verified' : 'rejected'

  // Busca a verificação para obter user_id
  const { data: verification } = await supabase
    .from('identity_verifications')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!verification) {
    return NextResponse.json({ error: 'Verificação não encontrada' }, { status: 404 })
  }

  // Atualiza a verificação
  const { error: verError } = await supabase
    .from('identity_verifications')
    .update({
      status: newStatus,
      rejection_reason: action === 'reject' ? rejection_reason : null,
      reviewed_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .eq('id', id)

  if (verError) {
    return NextResponse.json({ error: verError.message }, { status: 500 })
  }

  // Atualiza o perfil do usuário
  await supabase
    .from('profiles')
    .update({ verification_status: newStatus })
    .eq('id', verification.user_id)

  // Envia e-mail de notificação
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', verification.user_id)
    .single()

  if (profile?.email && process.env.RESEND_API_KEY !== 'your_resend_api_key') {
    try {
      const nome = profile.full_name ?? 'Usuário'
      if (action === 'approve') {
        await sendVerificationApproved(profile.email, nome)
      } else {
        await sendVerificationRejected(profile.email, nome, rejection_reason ?? 'Documentos ilegíveis ou inválidos.')
      }
    } catch (emailErr) {
      console.error('[verificacoes] email error', emailErr)
    }
  }

  return NextResponse.json({ success: true })
}
