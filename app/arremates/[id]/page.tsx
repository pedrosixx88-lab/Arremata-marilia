import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Trophy, Star, MessageSquare, ChevronLeft, AlertTriangle } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default async function ArremateDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: listing } = await service
    .from('listings')
    .select(`
      id, title, current_bid, ends_at, status,
      seller:profiles!seller_id(id, full_name),
      winner:profiles!winner_id(id, full_name)
    `)
    .eq('id', id)
    .eq('status', 'arremate_confirmado')
    .single()

  if (!listing) notFound()

  const seller = Array.isArray(listing.seller) ? listing.seller[0] : listing.seller
  const winner = Array.isArray(listing.winner) ? listing.winner[0] : listing.winner

  const isSeller = seller?.id === user.id
  const isWinner = winner?.id === user.id

  if (!isSeller && !isWinner) notFound()

  // Verifica disputa existente
  const { count: disputeCount } = await service
    .from('disputes')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', id)
    .in('status', ['aberta', 'em_analise'])

  const hasOpenDispute = (disputeCount ?? 0) > 0

  // Verifica se já avaliou
  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', id)
    .eq('reviewer_id', user.id)

  const alreadyReviewed = (reviewCount ?? 0) > 0

  const otherParty = isSeller ? winner : seller
  const chatPartnerId = otherParty?.id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">{listing.title}</h1>
              <p className="text-sm text-gray-500">
                Arrematado em {format(new Date(listing.ends_at), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>

          {/* Valor */}
          <div className="bg-orange-50 rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor do arremate</span>
            <span className="text-xl font-bold text-orange-600">{formatCurrency(listing.current_bid ?? 0)}</span>
          </div>

          {/* Partes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Vendedor</span>
              <span className="font-medium text-gray-900">{seller?.full_name ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Arrematante</span>
              <span className="font-medium text-gray-900">{winner?.full_name ?? '—'}</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-3">
            {/* Botão avaliar */}
            {!alreadyReviewed ? (
              <Link
                href={`/arremates/${id}/avaliar`}
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                <Star className="w-4 h-4" />
                Avaliar {isSeller ? 'comprador' : 'vendedor'}
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 font-medium py-3 rounded-xl text-sm">
                <Star className="w-4 h-4" />
                Avaliação já enviada
              </div>
            )}

            {/* Botão chat */}
            {chatPartnerId && (
              <Link
                href={`/mensagens/${id}`}
                className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir conversa
              </Link>
            )}

            {/* Botão disputa */}
            {hasOpenDispute ? (
              <div className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-400 font-medium py-3 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4" />
                Disputa em aberto
              </div>
            ) : (
              <Link
                href={`/disputas/nova?listing_id=${id}`}
                className="flex items-center justify-center gap-2 w-full border border-red-200 hover:bg-red-50 text-red-600 font-medium py-3 rounded-xl text-sm transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                Abrir disputa
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
