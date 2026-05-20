'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const REASON_LABELS: Record<string, string> = {
  fraude: 'Fraude / golpe',
  item_proibido: 'Item proibido',
  foto_falsa: 'Foto falsa ou enganosa',
  preco_abusivo: 'Preço abusivo',
  spam: 'Spam',
  outro: 'Outro',
}

interface Report {
  id: string
  category: string
  description: string | null
  resolved: boolean
  created_at: string
  reporter: { id: string; full_name: string } | null
  listings: {
    id: string
    title: string
    status: string
    profiles: { full_name: string } | null
  } | null
}

export default function DenunciasPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reports')
      if (!res.ok) return
      const json = await res.json()
      setReports(json.reports ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleAction(id: string, action: 'dismiss' | 'remove_listing') {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      toast.success(action === 'dismiss' ? 'Denúncia arquivada.' : 'Anúncio removido.')
      load()
    } else {
      toast.error('Erro ao processar.')
    }
  }

  const filtered = filter === 'pending' ? reports.filter(r => !r.resolved) : reports

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Denúncias</h1>
        <div className="flex gap-2">
          {(['pending', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${filter === f ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {f === 'pending' ? 'Pendentes' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium">Nenhuma denúncia {filter === 'pending' ? 'pendente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const listing = Array.isArray(r.listings) ? r.listings[0] : r.listings
            const reporter = Array.isArray(r.reporter) ? r.reporter[0] : r.reporter
            const seller = listing && (Array.isArray((listing as { profiles: unknown }).profiles)
              ? ((listing as { profiles: { full_name: string }[] }).profiles)[0]
              : (listing as { profiles: { full_name: string } | null }).profiles)

            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        !r.resolved ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {!r.resolved ? 'Pendente' : 'Resolvida'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{REASON_LABELS[r.category] ?? r.category}</span>
                    </div>

                    {listing && (
                      <p className="text-sm font-medium text-gray-900 truncate">
                        Anúncio: {listing.title}
                        {seller && <span className="text-gray-400 font-normal"> — {seller.full_name}</span>}
                      </p>
                    )}

                    {r.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{r.description}</p>
                    )}

                    <p className="text-xs text-gray-400 mt-1">
                      Por {reporter?.full_name ?? 'Usuário'} •{' '}
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>

                  {listing && (
                    <a
                      href={`/anuncios/${listing.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {!r.resolved && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleAction(r.id, 'dismiss')}
                      className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Arquivar
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'remove_listing')}
                      className="flex items-center gap-1.5 text-sm text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover anúncio
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
