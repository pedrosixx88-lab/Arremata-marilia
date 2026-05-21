import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Crown } from 'lucide-react'
import { AdminPremiumActions } from './premium-actions'

export default async function AdminPremiumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const service = createServiceClient()
  const { data: payments } = await service
    .from('premium_payments')
    .select(`id, amount, plan_months, status, method, created_at, expires_at, user:profiles!user_id(id, full_name, is_premium, premium_until)`)
    .order('created_at', { ascending: false })
    .limit(50)

  const list = (payments ?? []).map(p => ({
    ...p,
    user: Array.isArray(p.user) ? p.user[0] : p.user,
  }))

  const pending = list.filter(p => p.status === 'pendente')
  const processed = list.filter(p => p.status !== 'pendente')

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pendente:  { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-700' },
    aprovado:  { label: 'Aprovado',  color: 'bg-green-100 text-green-700' },
    recusado:  { label: 'Recusado',  color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Crown className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Planos Premium</h1>
            <p className="text-sm text-gray-500">{pending.length} pendente{pending.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Aguardando aprovação</h2>
            {pending.map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.user?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.plan_months} mês{p.plan_months > 1 ? 'es' : ''} • R$ {Number(p.amount).toFixed(2).replace('.', ',')} • {format(new Date(p.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">Pendente</span>
                </div>
                <AdminPremiumActions paymentId={p.id} />
              </div>
            ))}
          </div>
        )}

        {processed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Histórico</h2>
            {processed.map(p => {
              const s = STATUS_LABEL[p.status] ?? { label: p.status, color: 'bg-gray-100 text-gray-600' }
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.user?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.plan_months} mês{p.plan_months > 1 ? 'es' : ''} • R$ {Number(p.amount).toFixed(2).replace('.', ',')} • {format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${s.color}`}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}

        {list.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Crown className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Nenhuma solicitação Premium ainda.</p>
          </div>
        )}
      </div>
    </div>
  )
}
