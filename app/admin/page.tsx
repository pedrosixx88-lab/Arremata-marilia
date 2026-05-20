import { createClient } from '@/lib/supabase/server'

export default async function AdminPage() {
  const supabase = await createClient()

  const [{ count: pendingVerifications }, { count: totalUsers }] = await Promise.all([
    supabase
      .from('identity_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
  ])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Verificações pendentes</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{pendingVerifications ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Usuários cadastrados</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totalUsers ?? 0}</p>
        </div>
      </div>
    </main>
  )
}
