'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { BadgeCheck, Clock, XCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadIdentityFile } from '@/lib/supabase/storage'
import { UploadField } from '@/components/identity/upload-form'
import type { VerificationStatus } from '@/types'

interface VerificationState {
  status: VerificationStatus | null
  rejection_reason: string | null
}

export default function VerificacaoPage() {
  const router = useRouter()
  const supabase = createClient()

  const [verification, setVerification] = useState<VerificationState | null>(null)
  const [isLoadingPage, setIsLoadingPage] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [document, setDocument] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('identity_verifications')
        .select('status, rejection_reason')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      setVerification(data ?? { status: null, rejection_reason: null })
      setIsLoadingPage(false)
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!document || !selfie || !userId) {
      toast.error('Envie os dois arquivos antes de continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      const [docPath, selfiePath] = await Promise.all([
        uploadIdentityFile(userId, 'document', document),
        uploadIdentityFile(userId, 'selfie', selfie),
      ])

      // Verifica se auto-aprovação está ativa
      const settingsRes = await fetch('/api/admin/settings')
      const settings = await settingsRes.json()
      const autoApprove: boolean = settings?.auto_approve_verifications ?? true

      const newStatus = autoApprove ? 'verified' : 'pending'

      const { error } = await supabase.from('identity_verifications').insert({
        user_id: userId,
        document_url: docPath,
        selfie_url: selfiePath,
        status: newStatus,
      })

      if (error) throw error

      // Atualiza o status no perfil
      await supabase
        .from('profiles')
        .update({ verification_status: newStatus })
        .eq('id', userId)

      if (autoApprove) {
        toast.success('Identidade verificada com sucesso! Você já pode anunciar.')
        router.push('/dashboard')
      } else {
        toast.success('Documentos enviados! Nossa equipe irá analisar em até 24h.')
        setVerification({ status: 'pending', rejection_reason: null })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao enviar documentos. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingPage) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Carregando...
        </div>
      </main>
    )
  }

  // Já verificado
  if (verification?.status === 'verified') {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <BadgeCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Identidade verificada!</h1>
          <p className="text-sm text-gray-500 mb-6">
            Sua conta está verificada. Você pode criar anúncios normalmente.
          </p>
          <button
            onClick={() => router.push('/anunciar')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
          >
            Criar anúncio
          </button>
        </div>
      </main>
    )
  }

  // Em análise
  if (verification?.status === 'pending') {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Clock className="w-12 h-12 text-orange-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Documentos em análise</h1>
          <p className="text-sm text-gray-500">
            Seus documentos foram recebidos. Nossa equipe irá analisar em até 24 horas. Você receberá um e-mail com o resultado.
          </p>
        </div>
      </main>
    )
  }

  // Reprovado — permite novo envio
  const isRejected = verification?.status === 'rejected'

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Verificação de identidade</h1>
        <p className="text-sm text-gray-500">
          Para anunciar no ArremataMarília, precisamos confirmar sua identidade.
        </p>
      </div>

      {isRejected && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Verificação reprovada</p>
            {verification.rejection_reason && (
              <p className="text-sm text-red-600 mt-0.5">{verification.rejection_reason}</p>
            )}
            <p className="text-sm text-red-600 mt-1">Envie novos documentos abaixo.</p>
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800">
          Envie fotos nítidas do seu documento (RG ou CNH) e uma selfie segurando o documento ao lado do rosto.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        <UploadField
          label="Documento (RG ou CNH)"
          hint="Foto da frente do documento com todos os dados legíveis."
          value={document}
          onChange={setDocument}
          disabled={isSubmitting}
        />

        <UploadField
          label="Selfie com documento"
          hint="Foto sua segurando o documento ao lado do rosto."
          value={selfie}
          onChange={setSelfie}
          disabled={isSubmitting}
        />

        <button
          type="submit"
          disabled={isSubmitting || !document || !selfie}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar documentos'}
        </button>
      </form>
    </main>
  )
}
