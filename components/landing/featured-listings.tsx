import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/listing-card'

export async function FeaturedListings() {
  const service = createServiceClient()
  const { data: listings } = await service
    .from('listings')
    .select(`
      id, title, current_bid, starting_bid, ends_at, photos,
      bid_count, neighborhood,
      seller:profiles!seller_id(verification_status)
    `)
    .eq('status', 'ativo')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true })
    .limit(6)

  if (!listings || listings.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
        <p className="text-gray-400 text-sm">Nenhum anúncio ativo no momento.</p>
        <Link href="/anuncios" className="text-orange-500 text-sm font-semibold hover:underline mt-2 inline-block">
          Ver todos os anúncios
        </Link>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {listings.map((listing) => {
        const seller = Array.isArray(listing.seller) ? listing.seller[0] : listing.seller
        const photos = listing.photos as string[] | null
        return (
          <ListingCard
            key={listing.id}
            id={listing.id}
            title={listing.title}
            current_bid={listing.current_bid ?? 0}
            starting_bid={listing.starting_bid ?? 0}
            ends_at={listing.ends_at}
            bid_count={listing.bid_count ?? 0}
            cover_photo_url={photos?.[0] ?? null}
            neighborhood={listing.neighborhood ?? ''}
            seller_verified={seller?.verification_status === 'verified'}
          />
        )
      })}
    </div>
  )
}
