import { Resend } from 'resend'
import { render } from '@react-email/render'
import { VerificationApprovedEmail } from '@/emails/verification-approved'
import { VerificationRejectedEmail } from '@/emails/verification-rejected'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationApproved(email: string, nome: string) {
  const html = await render(<VerificationApprovedEmail nome={nome} />)
  return resend.emails.send({
    from: 'ArremataMarília <noreply@arrematemarilia.com.br>',
    to: email,
    subject: 'Sua identidade foi verificada — ArremataMarília',
    html,
  })
}

export async function sendVerificationRejected(email: string, nome: string, motivo: string) {
  const html = await render(<VerificationRejectedEmail nome={nome} motivo={motivo} />)
  return resend.emails.send({
    from: 'ArremataMarília <noreply@arrematemarilia.com.br>',
    to: email,
    subject: 'Atualização sobre sua verificação — ArremataMarília',
    html,
  })
}
