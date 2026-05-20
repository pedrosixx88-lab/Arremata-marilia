import * as React from 'react'

interface Props {
  nome: string
  motivo: string
}

export function VerificationRejectedEmail({ nome, motivo }: Props) {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 560, margin: '0 auto', padding: '40px 24px', color: '#111827' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f97316', marginBottom: 8 }}>
        ArremataMarília
      </h1>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 8 }}>
        Atualização sobre sua verificação, {nome}
      </h2>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 16 }}>
        Infelizmente não foi possível verificar sua identidade com os documentos enviados.
      </p>
      <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#b91c1c', margin: 0 }}>
          <strong>Motivo:</strong> {motivo}
        </p>
      </div>
      <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 24 }}>
        Você pode enviar novos documentos a qualquer momento acessando a página de verificação.
      </p>
      <a
        href={`${process.env.NEXT_PUBLIC_APP_URL}/verificacao`}
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
        Reenviar documentos
      </a>
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '24px 0' }} />
      <p style={{ fontSize: 11, color: '#d1d5db' }}>
        ArremataMarília — O marketplace de lances de Marília/SP
      </p>
    </div>
  )
}
