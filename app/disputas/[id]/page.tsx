import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertTriangle, ChevronLeft, Clock } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  aberta:      { label: 'Aberta',      color: 'bg-yellow-100 text-yellow-700' },
  em_analise:  { label: 'Em análise',  color: 'bg-blue-100 text-blue-700' },
  resolvida:   { label: 'Resolvida',   color: 'bg-green-100 text-green-700' },
  encerrada:   { label: 'Encerrada',   color: 'bg-gray-100 text-gray-600' },
}

const CATEGORY_LABEL: Record<string, string> = {
  item_nao_entregue:    'Item não entregue',
  item_diferente:       'Item diferente do anunciado',
  item_danificado:      'Item danificado',
  pagamento_nao_recebido: 'Pagamento não recebido',
  nao_compareceu:       'Não compareceu para entrega',
  outro:                'Outro problema',
}

export default async function DisputaDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: dispute } = await service
    .from('disputes')
    .select(`
      id, listing_id, category, description, evidence_urls, status, resolution, created_at, updated_at,
      opener:profiles!opener_id(id, full_name),
      respondent:profiles!respondent_id(id, full_name),
      listing:listings!listing_id(id, title)
    `)
    .eq('id', id)
    .single()

  if (!dispute) notFound()

  const opener = Array.isArray(dispute.opener) ? dispute.opener[0] : dispute.opener
  const respondent = Array.isArray(dispute.respondent) ? dispute.respondent[0] : dispute.respondent
  const listing = Array.isArray(dispute.listing) ? dispute.listing[0] : dispute.listing

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const isParticipant = opener?.id === user.id || respondent?.id === user.id

  if (!isParticipant && !isAdmin) notFound()

  const statusInfo = STATUS_LABEL[dispute.status] ?? { label: dispute.status, color: 'bg-gray-100 text-gray-600' }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href={`/arremates/${dispute.listing_id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao arremate
        </Link>

        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-gray-900">Disputa</h1>
                <p className="text-sm text-gray-500 truncate">{listing?.title}</p>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Categoria</span>
                <span className="font-medium text-gray-900">{CATEGORY_LABEL[dispute.category] ?? dispute.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Aberta por</span>
                <span className="font-medium text-gray-900">{opener?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contra</span>
                <span className="font-medium text-gray-900">{respondent?.full_name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Aberta em</span>
                <span className="text-gray-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(new Date(dispute.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Descrição do problema</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{dispute.description}</p>
          </div>

          {/* Resolução (se houver) */}
          {dispute.resolution && (
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
              <h2 className="text-sm font-semibold text-green-800 mb-2">Resolução da mediação</h2>
              <p className="text-sm text-green-700 whitespace-pre-wrap leading-relaxed">{dispute.resolution}</p>
            </div>
          )}

          {/* Aviso aguardando */}
          {(dispute.status === 'aberta' || dispute.status === 'em_analise') && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-xs text-amber-700">
              Nossa equipe irá analisar a disputa e entrar em contato com ambas as partes em até 72 horas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
