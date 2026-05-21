'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Crown, Zap, ArrowRight, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PLANS = [
  { months: 1,  label: '1 mês',   price: 29.90, badge: null },
  { months: 3,  label: '3 meses', price: 79.90, badge: 'Mais popular', savings: 'Economize R$ 9,80' },
  { months: 6,  label: '6 meses', price: 149.90, badge: null, savings: 'Economize R$ 29,50' },
  { months: 12, label: '1 ano',   price: 279.90, badge: 'Melhor valor', savings: 'Economize R$ 78,90' },
]

const BENEFITS = [
  'Badge "Vendedor Premium" nos anúncios e perfil',
  'Destaque na página inicial (posição prioritária)',
  'Até 20 fotos por anúncio (vs 10 do plano grátis)',
  'Duração de até 14 dias por anúncio (vs 7 dias)',
  'Suporte prioritário em disputas',
]

interface PremiumStatus {
  is_premium: boolean
  premium_until: string | null
  payments: { id: string; amount: number; plan_months: number; status: string; created_at: string }[]
}

export default function PremiumPage() {
  const [selected, setSelected] = useState(3)
  const [status, setStatus] = useState<PremiumStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/premium')
      .then(r => r.json())
      .then(d => setStatus(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSubscribe() {
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_months: selected }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao processar.'); return }
      setSuccess(true)
      // Recarrega status
      const r2 = await fetch('/api/premium')
      setStatus(await r2.json())
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-sm text-gray-400">Carregando...</p></div>
  }

  const hasPending = status?.payments.some(p => p.status === 'pendente')

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="border-b border-gray-100 bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Crown className="w-3.5 h-3.5" />
            Plano Premium
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            Venda mais.<br />Destaque-se.
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Anúncios em destaque, mais fotos, mais tempo. Tudo que você precisa para fechar mais arremates.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Já é premium */}
        {status?.is_premium && status.premium_until && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-10 flex items-center gap-4">
            <Crown className="w-8 h-8 text-orange-500 shrink-0" />
            <div>
              <p className="font-bold text-orange-900">Você já é Premium!</p>
              <p className="text-sm text-orange-700 mt-0.5">
                Válido até {format(new Date(status.premium_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        )}

        {/* Pendente */}
        {hasPending && !status?.is_premium && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10 flex items-center gap-4">
            <Clock className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <p className="font-bold text-blue-900">Solicitação em análise</p>
              <p className="text-sm text-blue-700 mt-0.5">Seu pagamento está sendo verificado. Você será notificado em breve.</p>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-10 flex items-center gap-4">
            <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
            <div>
              <p className="font-bold text-green-900">Solicitação enviada!</p>
              <p className="text-sm text-green-700 mt-0.5">Envie o comprovante de Pix para ativarmos seu plano. Você será notificado em breve.</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-10">
          {/* Benefícios */}
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">O que está incluído</p>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Benefícios Premium</h2>
            <ul className="space-y-3">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-900">Pagamento via Pix</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Após confirmar, você receberá os dados para pagamento. Nossa equipe ativa o plano em até 2 horas úteis após a confirmação.
              </p>
            </div>
          </div>

          {/* Planos */}
          <div>
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">Escolha o plano</p>
            <h2 className="text-2xl font-black text-gray-900 mb-6">Planos disponíveis</h2>
            <div className="space-y-3 mb-6">
              {PLANS.map((plan) => (
                <button
                  key={plan.months}
                  onClick={() => setSelected(plan.months)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left ${
                    selected === plan.months
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      selected === plan.months ? 'border-orange-500' : 'border-gray-300'
                    }`}>
                      {selected === plan.months && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{plan.label}</span>
                      {plan.savings && <span className="ml-2 text-xs text-green-600 font-medium">{plan.savings}</span>}
                    </div>
                    {plan.badge && (
                      <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">{plan.badge}</span>
                    )}
                  </div>
                  <span className="text-base font-black text-gray-900">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
                {error}
              </div>
            )}

            {!status?.is_premium && !hasPending && !success && (
              <button
                onClick={handleSubscribe}
                disabled={submitting}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? 'Processando...' : 'Assinar Premium'}
                {!submitting && <ArrowRight className="w-4 h-4" />}
              </button>
            )}

            <p className="text-xs text-gray-400 text-center mt-3">
              Cancele a qualquer momento. Sem fidelidade.
            </p>
          </div>
        </div>

        {/* Comparativo */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-gray-900 mb-8 text-center">Grátis vs Premium</h2>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-950 text-white">
              <div className="p-4 text-sm font-semibold">Funcionalidade</div>
              <div className="p-4 text-sm font-semibold text-center border-l border-gray-700">Grátis</div>
              <div className="p-4 text-sm font-semibold text-center border-l border-gray-700 text-orange-400">Premium</div>
            </div>
            {[
              ['Fotos por anúncio', '10', '20'],
              ['Duração máxima', '7 dias', '14 dias'],
              ['Destaque na home', '—', '✓'],
              ['Badge no perfil', '—', '✓'],
              ['Suporte em disputas', 'Normal', 'Prioritário'],
              ['Anúncios simultâneos', 'Ilimitado', 'Ilimitado'],
              ['Dar lances', '✓', '✓'],
            ].map(([feat, free, premium], i) => (
              <div key={feat} className={`grid grid-cols-3 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="p-4 text-sm text-gray-700">{feat}</div>
                <div className="p-4 text-sm text-center text-gray-500 border-l border-gray-100">{free}</div>
                <div className="p-4 text-sm text-center font-semibold text-orange-600 border-l border-gray-100">{premium}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-10">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
