import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShieldCheck, Users, LayoutDashboard, ListChecks } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-100">
          <p className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Admin</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">ArremataMarília</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-gray-400" />
            Visão geral
          </Link>
          <Link
            href="/admin/verificacoes"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            Verificações
          </Link>
          <Link
            href="/admin/moderacao"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <ListChecks className="w-4 h-4 text-gray-400" />
            Moderação
          </Link>
          <Link
            href="/admin/usuarios"
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4 text-gray-400" />
            Usuários
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
