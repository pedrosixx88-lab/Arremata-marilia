import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle } from 'lucide-react'
import { AdminDisputaActions } from './dispute-actions'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  aberta:      { label: 'Aberta',      color: 'bg-yellow-100 text-yellow-700' },
  em_analise:  { label: 'Em análise',  color: 'bg-blue-100 text-blue-700' },
  resolvida:   { label: 'Resolvida',   color: 'bg-green-100 text-green-700' },
  encerrada:   { label: 'Encerrada',   color: 'bg-gray-100 text-gray-600' },
}

const CATEGORY_LABEL: Record<string, string> = {
  item_nao_entregue:      'Item não entregue',
  item_diferente:         'Item diferente',
  item_danificado:        'Item danificado',
  pagamento_nao_recebido: 'Pagamento não recebido',
  nao_compareceu:         'Não compareceu',
  outro:                  'Outro',
}

export default async function AdminDisputasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const service = createServiceClient()
  const { data: disputes } = await service
    .from('disputes')
    .select(`
      id, category, status, resolution, created_at,
      opener:profiles!opener_id(id, full_name),
      respondent:profiles!respondent_id(id, full_name),
      listing:listings!listing_id(id, title)
    `)
    .order('created_at', { ascending: false })

  const list = (disputes ?? []).map(d => ({
    ...d,
    opener: Array.isArray(d.opener) ? d.opener[0] : d.opener,
    respondent: Array.isArray(d.respondent) ? d.respondent[0] : d.respondent,
    listing: Array.isArray(d.listing) ? d.listing[0] : d.listing,
  }))

  const open = list.filter(d => d.status === 'aberta' || d.status === 'em_analise')
  const closed = list.filter(d => d.status === 'resolvida' || d.status === 'encerrada')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Disputas</h1>
            <p className="text-sm text-gray-500">{open.length} em aberto</p>
          </div>
        </div>

        {open.length === 0 && closed.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <AlertTriangle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma disputa registrada.</p>
          </div>
        )}

        {open.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Em aberto</h2>
            {open.map(d => {
              const s = STATUS_LABEL[d.status] ?? { label: d.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{d.listing?.title ?? '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CATEGORY_LABEL[d.category] ?? d.category} •{' '}
                        {format(new Date(d.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-gray-400 mb-0.5">Aberta por</p>
                      <p className="font-medium text-gray-800">{d.opener?.full_name ?? '—'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-gray-400 mb-0.5">Contra</p>
                      <p className="font-medium text-gray-800">{d.respondent?.full_name ?? '—'}</p>
                    </div>
                  </div>

                  <Link
                    href={`/disputas/${d.id}`}
                    className="block text-xs text-blue-600 hover:underline"
                  >
                    Ver descrição completa →
                  </Link>

                  <AdminDisputaActions disputeId={d.id} currentStatus={d.status} currentResolution={d.resolution ?? ''} />
                </div>
              )
            })}
          </div>
        )}

        {closed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Encerradas</h2>
            {closed.map(d => {
              const s = STATUS_LABEL[d.status] ?? { label: d.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.listing?.title ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {CATEGORY_LABEL[d.category] ?? d.category} • {format(new Date(d.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
