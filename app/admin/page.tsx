import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, Gavel, Users, AlertTriangle, TrendingUp, Clock } from 'lucide-react'

function StatCard({ label, value, sub, icon: Icon, accent = false }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ComponentType<{ className?: string }>
  accent?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`p-2 rounded-lg ${accent ? 'bg-orange-100' : 'bg-gray-100'}`}>
        <Icon className={`w-5 h-5 ${accent ? 'text-orange-500' : 'text-gray-500'}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${accent ? 'text-orange-500' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: pendingVerifications },
    { count: totalUsers },
    { count: pendingModeration },
    { count: activeListings },
    { count: todayClosedListings },
    { count: pendingReports },
    { data: recentListings },
  ] = await Promise.all([
    supabase.from('identity_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'em_moderacao'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('listings').select('*', { count: 'exact', head: true })
      .eq('status', 'arremate_confirmado')
      .gte('updated_at', today.toISOString()),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('listings')
      .select('id, title, status, created_at, profiles!seller_id(full_name)')
      .eq('status', 'em_moderacao')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão geral</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Anúncios para moderar" value={pendingModeration ?? 0} icon={Clock} accent={(pendingModeration ?? 0) > 0} />
        <StatCard label="Verificações pendentes" value={pendingVerifications ?? 0} icon={ShieldCheck} accent={(pendingVerifications ?? 0) > 0} />
        <StatCard label="Denúncias abertas" value={pendingReports ?? 0} icon={AlertTriangle} accent={(pendingReports ?? 0) > 0} />
        <StatCard label="Anúncios ativos" value={activeListings ?? 0} icon={Gavel} />
        <StatCard label="Arremates hoje" value={todayClosedListings ?? 0} icon={TrendingUp} />
        <StatCard label="Usuários cadastrados" value={totalUsers ?? 0} icon={Users} />
      </div>

      {recentListings && recentListings.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Aguardando moderação</h2>
          <div className="space-y-2">
            {recentListings.map((l) => {
              const seller = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
              return (
                <a
                  key={l.id}
                  href="/admin/moderacao"
                  className="flex items-center justify-between bg-white border border-orange-200 rounded-xl px-4 py-3 hover:bg-orange-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{l.title}</p>
                    <p className="text-xs text-gray-400">{seller?.full_name ?? 'Vendedor'}</p>
                  </div>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pendente</span>
                </a>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
