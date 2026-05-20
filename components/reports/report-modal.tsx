'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Flag, X } from 'lucide-react'

const REASONS = [
  { value: 'fraude',        label: 'Fraude / golpe' },
  { value: 'item_proibido', label: 'Item proibido' },
  { value: 'foto_falsa',    label: 'Foto falsa ou enganosa' },
  { value: 'preco_abusivo', label: 'Preço abusivo' },
  { value: 'spam',          label: 'Spam / repetido' },
  { value: 'outro',         label: 'Outro' },
]

interface ReportModalProps {
  listingId: string
  isLoggedIn: boolean
}

export function ReportModal({ listingId, isLoggedIn }: ReportModalProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { toast.error('Selecione um motivo.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listingId, reason, description }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? 'Erro ao enviar.'); return }
      toast.success('Denúncia enviada. Nossa equipe irá analisar.')
      setOpen(false)
      setReason('')
      setDescription('')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        <Flag className="w-3.5 h-3.5" />
        Denunciar anúncio
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Denunciar anúncio</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Motivo</p>
                <div className="space-y-2">
                  {REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="accent-orange-500"
                      />
                      <span className="text-sm text-gray-700">{r.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalhes <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Descreva o problema com mais detalhes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !reason}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar denúncia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
