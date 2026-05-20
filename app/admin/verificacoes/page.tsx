'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { BadgeCheck, XCircle, Clock, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react'

interface Verification {
  id: string
  user_id: string
  document_url: string
  selfie_url: string
  status: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  } | null
}

export default function VerificacoesPage() {
  const [verifications, setVerifications] = useState<Verification[]>([])
  const [autoApprove, setAutoApprove] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<Record<string, string>>({})
  const [signedUrls, setSignedUrls] = useState<Record<string, { doc: string; selfie: string }>>({})

  const loadData = useCallback(async () => {
    const [verRes, settingsRes] = await Promise.all([
      fetch('/api/admin/verificacoes'),
      fetch('/api/admin/settings'),
    ])
    const verData = await verRes.json()
    const settingsData = await settingsRes.json()

    setVerifications(verData.verifications ?? [])
    setAutoApprove(settingsData.auto_approve_verifications ?? true)

    // Busca URLs assinadas para cada verificação
    const urls: Record<string, { doc: string; selfie: string }> = {}
    for (const v of verData.verifications ?? []) {
      const res = await fetch(`/api/admin/verificacoes/${v.id}/urls`)
      if (res.ok) {
        const data = await res.json()
        urls[v.id] = data
      }
    }
    setSignedUrls(urls)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function toggleAutoApprove() {
    const newVal = !autoApprove
    setAutoApprove(newVal)
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_approve_verifications: newVal }),
    })
    toast.success(newVal ? 'Auto-aprovação ativada.' : 'Moderação manual ativada.')
  }

  async function handleDecision(id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !rejectionReason[id]?.trim()) {
      toast.error('Informe o motivo da reprovação.')
      return
    }
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/verificacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejection_reason: action === 'reject' ? rejectionReason[id] : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(action === 'approve' ? 'Verificação aprovada.' : 'Verificação reprovada.')
      setVerifications((prev) => prev.filter((v) => v.id !== id))
    } catch {
      toast.error('Erro ao processar. Tente novamente.')
    } finally {
      setProcessingId(null)
    }
  }

  const pending = verifications.filter((v) => v.status === 'pending')

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verificações de identidade</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pendente{pending.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Toggle auto-aprovação */}
        <button
          onClick={toggleAutoApprove}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {autoApprove ? (
            <>
              <ToggleRight className="w-5 h-5 text-emerald-500" />
              Auto-aprovação: ON
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-gray-400" />
              Auto-aprovação: OFF
            </>
          )}
        </button>
      </div>

      {autoApprove && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
          Auto-aprovação está <strong>ativa</strong> — novos envios são aprovados instantaneamente. A fila abaixo mostra apenas envios anteriores à ativação.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <BadgeCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma verificação pendente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-4 h-4 text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {v.profiles?.full_name ?? 'Sem nome'}
                  </p>
                  <p className="text-xs text-gray-400">{v.profiles?.email}</p>
                </div>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(v.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {(['doc', 'selfie'] as const).map((type) => {
                  const url = signedUrls[v.id]?.[type]
                  return (
                    <div key={type}>
                      <p className="text-xs font-medium text-gray-500 mb-1 capitalize">
                        {type === 'doc' ? 'Documento' : 'Selfie'}
                      </p>
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 h-40">
                        {url ? (
                          <>
                            <Image src={url} alt={type} fill className="object-contain" unoptimized />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-gray-200 hover:bg-gray-50"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                            </a>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-xs text-gray-400">
                            Carregando...
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Motivo da reprovação (obrigatório para reprovar)"
                  value={rejectionReason[v.id] ?? ''}
                  onChange={(e) =>
                    setRejectionReason((prev) => ({ ...prev, [v.id]: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDecision(v.id, 'approve')}
                    disabled={processingId === v.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    <BadgeCheck className="w-4 h-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleDecision(v.id, 'reject')}
                    disabled={processingId === v.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reprovar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
