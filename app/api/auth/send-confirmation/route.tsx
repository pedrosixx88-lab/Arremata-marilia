import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import { ConfirmEmailTemplate } from '@/emails/confirm-email'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, nome, confirmUrl } = await request.json()

    if (!email || !nome || !confirmUrl) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
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
