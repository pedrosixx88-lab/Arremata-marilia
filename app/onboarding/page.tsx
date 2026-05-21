'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Gavel, Mail, User, ArrowRight, CheckCircle, Package, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  {
    id: 1,
    icon: Gavel,
    title: 'Bem-vindo ao ArremataMarília!',
    subtitle: 'O marketplace de lances de Marília/SP',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    id: 2,
    icon: Mail,
    title: 'Confirme seu e-mail',
    subtitle: 'Verifique sua caixa de entrada',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 3,
    icon: User,
    title: 'Complete seu perfil',
    subtitle: 'Últimos detalhes para começar',
    color: 'bg-green-100 text-green-600',
  },
]

const HOW_ITEMS = [
  { icon: Package, text: 'Vendedores anunciam com fotos e lance mínimo' },
  { icon: Gavel,   text: 'Compradores dão lances em tempo real' },
  { icon: Star,    text: 'Ao encerrar, o maior lance vence — simples assim' },
]

function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto">
        <Gavel className="w-10 h-10 text-orange-500" />
      </div>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          Bem-vindo ao ArremataMarília!
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          A plataforma de lances hiperlocal de Marília/SP. Aqui você compra e vende com segurança.
        </p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3">
        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Como funciona</p>
        {HOW_ITEMS.map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-sm text-gray-700">{item.text}</p>
            </div>
          )
        })}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
      >
        Começar <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function Step2({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center space-y-8">
      <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto">
        <Mail className="w-10 h-10 text-blue-500" />
      </div>

      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Confirme seu e-mail</h2>
        <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
          Enviamos um link de confirmação para o seu e-mail. Clique nele para ativar sua conta.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">Verifique sua caixa de entrada e spam</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">O link expira em 24 horas</p>
        </div>
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">Após confirmar, você poderá dar lances normalmente</p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={onNext}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          Já confirmei meu e-mail <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Pular por agora
        </button>
      </div>
    </div>
  )
}

function Step3({ onFinish }: { onFinish: () => void }) {
  const [fullName, setFullName] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && (fullName.trim() || neighborhood.trim())) {
        const updates: Record<string, string> = {}
        if (fullName.trim()) updates.full_name = fullName.trim()
        if (neighborhood.trim()) updates.neighborhood = neighborhood.trim()
        await supabase.from('profiles').update(updates).eq('id', user.id)
      }
    } finally {
      setSaving(false)
      onFinish()
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <User className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Complete seu perfil</h2>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Essas informações aparecem para outros usuários e aumentam sua credibilidade.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nome completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Seu nome"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Bairro preferido (opcional)
          </label>
          <input
            type="text"
            value={neighborhood}
            onChange={e => setNeighborhood(e.target.value)}
            placeholder="Ex: Centro, Fragata, Palmital..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
        >
          {saving ? 'Salvando...' : 'Finalizar'}
          {!saving && <CheckCircle className="w-4 h-4" />}
        </button>
        <button
          onClick={onFinish}
          className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Pular por agora
        </button>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  function handleFinish() {
    router.push('/anuncios')
  }

  const progress = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">Passo {step} de {STEPS.length}</p>
            <Link href="/anuncios" className="text-xs text-gray-400 hover:text-gray-600">
              Pular tudo
            </Link>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s) => (
              <div key={s.id} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full transition-colors ${s.id <= step ? 'bg-orange-500' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
          {step === 1 && <Step1 onNext={() => setStep(2)} />}
          {step === 2 && <Step2 onNext={() => setStep(3)} />}
          {step === 3 && <Step3 onFinish={handleFinish} />}
        </div>
      </div>
    </div>
  )
}
