import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ConfirmEmailTemplate } from '@/emails/confirm-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  // Rejeita chamadas sem o segredo interno (previne spam abuse)
  const authHeader = request.headers.get('x-internal-secret')
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { email, nome, confirmUrl } = await request.json()

    if (!email || !nome || !confirmUrl) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    // Garante que confirmUrl é do próprio domínio (previne redirect spoofing)
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL!
    if (!confirmUrl.startsWith(allowedOrigin)) {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 })
    }

    const html = await render(<ConfirmEmailTemplate nome={nome} confirmUrl={confirmUrl} />)

    const { error } = await resend.emails.send({
      from: 'ArremataMarília <noreply@arrematemarilia.com.br>',
      to: email,
      subject: 'Confirme seu e-mail — ArremataMarília',
      html,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[send-confirmation]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
