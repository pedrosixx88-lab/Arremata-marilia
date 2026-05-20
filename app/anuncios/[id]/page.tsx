import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, MapPin, Truck, ChevronLeft, Gavel } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BidsSection } from '@/components/bids/bids-section'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('listings')
    .select('title, description')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Anúncio não encontrado' }

  return {
    title: `${data.title} — ArremataMarília`,
    description: data.description.slice(0, 160),
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const DELIVERY_LABELS: Record<string, string> = {
  retirada: 'Somente retirada',
  entrega: 'Somente entrega',
  ambos: 'Retirada ou entrega',
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: listing }, { data: { user } }] = await Promise.all([
    supabase
      .from('listings')
      .select(`
        id,
        title,
        description,
        current_bid,
        starting_bid,
        reserve_price,
        min_increment,
        bid_count,
        ends_at,
        photo_urls,
        neighborhood,
        delivery_type,
        status,
        created_at,
        seller_id,
        category_id,
        profiles!seller_id (
          id,
          full_name,
          avatar_url,
          verification_status,
          reputation_score,
          total_sales,
          created_at
        ),
        categories!category_id (name)
      `)
      .eq('id', id)
      .single(),
    supabase.auth.getUser(),
  ])

  if (!listing || listing.status !== 'ativo') notFound()

  const seller = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles
  const category = Array.isArray(listing.categories) ? listing.categories[0] : listing.categories

  // Busca os últimos 20 lances para o histórico inicial
  const { data: recentBids } = await supabase
    .from('bids')
    .select('id, amount, created_at, bidder_id, is_auto')
    .eq('listing_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const initialBids = (recentBids ?? []).map((b) => ({
    id: b.id,
    amount: b.amount,
    created_at: b.created_at,
    bidder_id: b.bidder_id,
    is_auto: b.is_auto ?? false,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <Link
          href="/anuncios"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para anúncios
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Galeria de fotos */}
          <div className="space-y-2">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
              {listing.photo_urls?.[0] ? (
                <Image
                  src={listing.photo_urls[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Gavel className="w-16 h-16" />
                </div>
              )}
            </div>
            {listing.photo_urls && listing.photo_urls.length > 1 && (
              <div className="grid grid-cols-5 gap-1.5">
                {listing.photo_urls.slice(1).map((url: string, i: number) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <Image src={url} alt={`foto ${i + 2}`} fill className="object-cover" unoptimized />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info + lances */}
          <div className="space-y-4">
            <div>
              {category && (
                <p className="text-xs text-orange-500 font-medium uppercase tracking-wide mb-1">
                  {category.name}
                </p>
              )}
              <h1 className="text-xl font-bold text-gray-900">{listing.title}</h1>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {listing.neighborhood}
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  {DELIVERY_LABELS[listing.delivery_type] ?? listing.delivery_type}
                </span>
              </div>
            </div>

            {/* Seção de lances em tempo real */}
            <BidsSection
              listingId={listing.id}
              initialCurrentBid={listing.current_bid ?? listing.starting_bid}
              initialBidCount={listing.bid_count ?? 0}
              initialBids={initialBids}
              initialEndsAt={listing.ends_at}
              minIncrement={listing.min_increment}
              startingBid={listing.starting_bid}
              currentUserId={user?.id}
              sellerId={listing.seller_id}
            />

            {/* Vendedor */}
            {seller && (
              <Link
                href={`/perfil/${seller.id}`}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 shrink-0">
                  {seller.avatar_url ? (
                    <Image src={seller.avatar_url} alt={seller.full_name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                      {seller.full_name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">{seller.full_name}</p>
                    {seller.verification_status === 'verified' && (
                      <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {seller.total_sales ?? 0} vendas • membro desde{' '}
                    {format(new Date(seller.created_at), 'MMM yyyy', { locale: ptBR })}
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Descrição */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Descrição</h2>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{listing.description}</p>
        </div>
      </div>
    </div>
  )
}
