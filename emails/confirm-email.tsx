import * as React from 'react'

interface ConfirmEmailProps {
  nome: string
  confirmUrl: string
}

export function ConfirmEmailTemplate({ nome, confirmUrl }: ConfirmEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 560, margin: '0 auto', padding: '40px 24px', color: '#111827' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>
        ArremataMarília
      </h1>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        Confirme seu e-mail, {nome}!
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
        Obrigado por criar sua conta no ArremataMarília. Clique no botão abaixo para confirmar seu
        endereço de e-mail e ativar sua conta.
      </p>
      <a
        href={confirmUrl}
        style={{
          display: 'inline-block',
          backgroundColor: '#f97316',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          padding: '12px 24px',
          borderRadius: 8,
          textDecoration: 'none',
          marginBottom: 24,
        }}
      >
        Confirmar e-mail
      </a>
      <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.6 }}>
        Se você não criou uma conta, ignore este e-mail. O link expira em 24 horas.
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />
      <p style={{ fontSize: 11, color: '#d1d5db' }}>
        ArremataMarília — O marketplace de lances de Marília/SP
      </p>
    </div>
  )
}
