import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BadgeCheck, Star, Package, CalendarDays } from 'lucide-react'

interface PerfilPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PerfilPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', id)
    .single()

  return {
    title: profile?.full_name
      ? `${profile.full_name} — ArremataMarília`
      : 'Perfil — ArremataMarília',
  }
}

export default async function PerfilPage({ params }: PerfilPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const memberSince = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: true,
    locale: ptBR,
  })

  const isVerified = profile.verification_status === 'verified'
  const displayName: string = profile.full_name ?? 'Usuário'

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-3xl font-bold text-orange-500">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verificado
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <CalendarDays className="w-4 h-4" />
                Membro {memberSince}
              </div>

              {profile.total_sales > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Package className="w-4 h-4" />
                  {profile.total_sales} arremate{profile.total_sales !== 1 ? 's' : ''}
                </div>
              )}

              {profile.reputation_score !== null && profile.reputation_score > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {Number(profile.reputation_score).toFixed(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {profile.neighborhood && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-700">Bairro:</span> {profile.neighborhood}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
