import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/listing-card'
import { Filters } from '@/components/listings/filters'

export const metadata = { title: 'Anúncios — ArremataMarília' }

interface SearchParams {
  q?: string
  categoria?: string
  bairro?: string
  preco_min?: string
  preco_max?: string
  ordenar?: string
  pagina?: string
}

const PAGE_SIZE = 20

async function ListingsGrid({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`
      id,
      title,
      current_bid,
      starting_bid,
      ends_at,
      bid_count,
      photo_urls,
      neighborhood,
      profiles!seller_id (verification_status)
    `)
    .eq('status', 'ativo')

  if (searchParams.q) {
    query = query.textSearch('search_vector', searchParams.q, { config: 'portuguese' })
  }
  if (searchParams.categoria) {
    query = query.eq('category_id', searchParams.categoria)
  }
  if (searchParams.bairro) {
    query = query.ilike('neighborhood', `%${searchParams.bairro}%`)
  }
  if (searchParams.preco_min) {
    const min = parseFloat(searchParams.preco_min)
    if (!isNaN(min)) query = query.gte('starting_bid', min)
  }
  if (searchParams.preco_max) {
    const max = parseFloat(searchParams.preco_max)
    if (!isNaN(max)) query = query.lte('starting_bid', max)
  }

  switch (searchParams.ordenar) {
    case 'encerrando':
      query = query.order('ends_at', { ascending: true })
      break
    case 'mais_lances':
      query = query.order('bid_count', { ascending: false })
      break
    case 'menor_preco':
      query = query.order('starting_bid', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  const page = Math.max(1, parseInt(searchParams.pagina ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  query = query.range(from, from + PAGE_SIZE - 1)

  const { data: listings } = await query

  if (!listings || listings.length === 0) {
    return (
      <div className="col-span-full text-center py-16 text-gray-400">
        <p className="text-lg font-medium">Nenhum anúncio encontrado</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou volte mais tarde.</p>
      </div>
    )
  }

  return (
    <>
      {listings.map((l) => {
        const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
        return (
          <ListingCard
            key={l.id}
            id={l.id}
            title={l.title}
            current_bid={l.current_bid ?? 0}
            starting_bid={l.starting_bid}
            ends_at={l.ends_at}
            bid_count={l.bid_count}
            cover_photo_url={l.photo_urls?.[0] ?? null}
            neighborhood={l.neighborhood}
            seller_verified={profile?.verification_status === 'verified'}
          />
        )
      })}
    </>
  )
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('id, name').order('name')
  return data ?? []
}

export default async function AnunciosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const resolvedParams = await searchParams
  const categories = await getCategories()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Anúncios</h1>

        <div className="flex gap-6">
          {/* Sidebar filters */}
          <aside className="hidden md:block w-64 shrink-0">
            <Suspense>
              <Filters categories={categories} />
            </Suspense>
          </aside>

          {/* Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <Suspense
                fallback={
                  <div className="col-span-full text-center py-16 text-gray-400">
                    Carregando anúncios...
                  </div>
                }
              >
                <ListingsGrid searchParams={resolvedParams} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
