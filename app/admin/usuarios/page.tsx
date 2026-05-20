'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, ShieldOff, UserX, UserCheck, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserProfile {
  id: string
  full_name: string
  email: string
  role: string
  verification_status: string
  is_premium: boolean
  total_sales: number
  total_purchases: number
  created_at: string
}

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin:     { label: 'Admin',     cls: 'bg-purple-100 text-purple-700' },
  user:      { label: 'Usuário',   cls: 'bg-gray-100 text-gray-600' },
  suspended: { label: 'Suspenso',  cls: 'bg-yellow-100 text-yellow-700' },
  banned:    { label: 'Banido',    cls: 'bg-red-100 text-red-700' },
}

const VERIFY_BADGE: Record<string, { label: string; cls: string }> = {
  verified:   { label: 'Verificado', cls: 'text-green-600' },
  pending:    { label: 'Pendente',   cls: 'text-yellow-600' },
  unverified: { label: 'Não verif.', cls: 'text-gray-400' },
  rejected:   { label: 'Reprovado', cls: 'text-red-500' },
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/usuarios')
      if (!res.ok) return
      const json = await res.json()
      setUsers(json.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleAction(userId: string, action: 'suspend' | 'ban' | 'restore') {
    const labels = { suspend: 'Suspender', ban: 'Banir', restore: 'Restaurar' }
    if (!confirm(`${labels[action]} este usuário?`)) return
    setActioning(userId)
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        toast.success(`Usuário ${labels[action].toLowerCase()}do com sucesso.`)
        load()
      } else {
        toast.error('Erro ao processar.')
      }
    } finally {
      setActioning(null)
    }
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-gray-900">Usuários</h1>
        <span className="text-sm text-gray-500">{users.length} cadastrado{users.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-12">Nenhum usuário encontrado.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => {
            const roleBadge = ROLE_BADGE[u.role] ?? ROLE_BADGE.user
            const verifyBadge = VERIFY_BADGE[u.verification_status] ?? VERIFY_BADGE.unverified
            const isActive = u.role === 'user' || u.role === 'admin'
            const isAdmin = u.role === 'admin'

            return (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                  {u.full_name?.[0]?.toUpperCase() ?? '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.full_name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadge.cls}`}>
                      {roleBadge.label}
                    </span>
                    {u.is_premium && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">Premium</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                    <span className={verifyBadge.cls}>
                      {verifyBadge.label === 'Verificado' ? <ShieldCheck className="w-3 h-3 inline mr-0.5" /> : null}
                      {verifyBadge.label}
                    </span>
                    <span>{u.total_sales} venda{u.total_sales !== 1 ? 's' : ''}</span>
                    <span>{u.total_purchases} compra{u.total_purchases !== 1 ? 's' : ''}</span>
                    <span>desde {format(new Date(u.created_at), 'MMM yyyy', { locale: ptBR })}</span>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive ? (
                      <button
                        onClick={() => handleAction(u.id, 'restore')}
                        disabled={actioning === u.id}
                        title="Restaurar acesso"
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(u.id, 'suspend')}
                          disabled={actioning === u.id}
                          title="Suspender"
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAction(u.id, 'ban')}
                          disabled={actioning === u.id}
                          title="Banir permanentemente"
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
