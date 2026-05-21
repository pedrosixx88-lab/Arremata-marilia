import { notFound } from 'next/navigation'
import Image from 'next/image'
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

  const [{ data: profile }, { data: reviews }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, verification_status, reputation_score, total_sales, neighborhood, created_at')
      .eq('id', id)
      .single(),
    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer:profiles!reviewer_id(full_name)')
      .eq('reviewee_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

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
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={80}
                height={80}
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

      {/* Avaliações */}
      {reviews && reviews.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Avaliações recebidas ({reviews.length})
          </h2>
          <div className="space-y-4">
            {reviews.map((r) => {
              const reviewer = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
              return (
                <div key={r.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900">{reviewer?.full_name ?? 'Usuário'}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
