'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  disputeId: string
  currentStatus: string
  currentResolution: string
}

export function AdminDisputaActions({ disputeId, currentStatus, currentResolution }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [resolution, setResolution] = useState(currentResolution)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/disputas/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, resolution }),
      })
      if (res.ok) { setSaved(true); router.refresh() }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 border-t border-gray-100 pt-4">
      <div className="flex gap-3">
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="aberta">Aberta</option>
          <option value="em_analise">Em análise</option>
          <option value="resolvida">Resolvida</option>
          <option value="encerrada">Encerrada</option>
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
        </button>
      </div>
      <textarea
        value={resolution}
        onChange={e => setResolution(e.target.value)}
        rows={2}
        placeholder="Resolução / observação do admin (opcional)..."
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
      />
    </div>
  )
}
