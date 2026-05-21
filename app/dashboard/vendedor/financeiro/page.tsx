import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Crown, ChevronLeft, TrendingUp, DollarSign, Clock } from 'lucide-react'

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function FinanceiroPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const [{ data: profileData }, { data: commissions }] = await Promise.all([
    service.from('profiles').select('is_premium, premium_until, full_name').eq('id', user.id).single(),
    service
      .from('commissions')
      .select(`id, sale_amount, rate, commission_amount, status, created_at, listing:listings!listing_id(id, title)`)
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const list = commissions ?? []
  const totalSales = list.reduce((a, c) => a + Number(c.sale_amount), 0)
  const totalCommission = list.reduce((a, c) => a + Number(c.commission_amount), 0)
  const pendingCommission = list.filter(c => c.status === 'pendente').reduce((a, c) => a + Number(c.commission_amount), 0)

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
    pago:     { label: 'Pago',     color: 'bg-green-100 text-green-700' },
    isento:   { label: 'Isento',   color: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dashboard/vendedor" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6">
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Financeiro</h1>
            <p className="text-sm text-gray-500 mt-0.5">Histórico de comissões e plano</p>
          </div>
          {profileData?.is_premium ? (
            <div className="flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full">
              <Crown className="w-3.5 h-3.5" />
              Premium
              {profileData.premium_until && (
                <span className="font-normal">até {format(new Date(profileData.premium_until), 'dd/MM/yy', { locale: ptBR })}</span>
              )}
            </div>
          ) : (
            <Link
              href="/premium"
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
            >
              <Crown className="w-3.5 h-3.5" />
              Assinar Premium
            </Link>
          )}
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Total vendido</span>
            </div>
            <p className="text-xl font-black text-gray-900">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">Comissões</span>
            </div>
            <p className="text-xl font-black text-gray-900">{formatCurrency(totalCommission)}</p>
            <p className="text-xs text-gray-400 mt-1">10% por arremate</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500 uppercase tracking-wide">A pagar</span>
            </div>
            <p className="text-xl font-black text-yellow-600">{formatCurrency(pendingCommission)}</p>
          </div>
        </div>

        {/* Histórico de comissões */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Histórico de comissões</h2>
          </div>

          {list.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">Nenhum arremate com comissão registrada ainda.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {list.map((c) => {
                const listing = Array.isArray(c.listing) ? c.listing[0] : c.listing
                const s = STATUS_LABEL[c.status] ?? { label: c.status, color: 'bg-gray-100 text-gray-600' }
                return (
                  <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{listing?.title ?? '—'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })} •{' '}
                        Venda: {formatCurrency(Number(c.sale_amount))} • Taxa: {(Number(c.rate) * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(Number(c.commission_amount))}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
