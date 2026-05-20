import Link from 'next/link'
import Image from 'next/image'
import { Clock, Gavel, ShieldCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ListingCardProps {
  id: string
  title: string
  current_bid: number
  starting_bid: number
  ends_at: string
  bid_count: number
  cover_photo_url: string | null
  neighborhood: string
  seller_verified: boolean
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getTimeLeft(endsAt: string) {
  const end = new Date(endsAt)
  const now = new Date()
  if (end <= now) return 'Encerrado'
  return formatDistanceToNow(end, { addSuffix: false, locale: ptBR })
}

export function ListingCard({
  id,
  title,
  current_bid,
  starting_bid,
  ends_at,
  bid_count,
  cover_photo_url,
  neighborhood,
  seller_verified,
}: ListingCardProps) {
  const displayBid = current_bid > 0 ? current_bid : starting_bid
  const timeLeft = getTimeLeft(ends_at)
  const isEnded = timeLeft === 'Encerrado'
  const isEnding = !isEnded && new Date(ends_at).getTime() - Date.now() < 2 * 60 * 60 * 1000

  return (
    <Link href={`/anuncios/${id}`} className="group block">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          {cover_photo_url ? (
            <Image
              src={cover_photo_url}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Gavel className="w-10 h-10" />
            </div>
          )}
          {seller_verified && (
            <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 text-xs font-medium text-green-600">
              <ShieldCheck className="w-3 h-3" />
              Verificado
            </span>
          )}
        </div>

        <div className="p-3 space-y-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{title}</p>
          <p className="text-xs text-gray-400">{neighborhood}</p>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">{bid_count > 0 ? 'Lance atual' : 'Lance mínimo'}</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(displayBid)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{bid_count} {bid_count === 1 ? 'lance' : 'lances'}</p>
            </div>
          </div>

          <div className={`flex items-center gap-1 text-xs font-medium ${isEnding ? 'text-red-500' : 'text-gray-500'}`}>
            <Clock className="w-3 h-3" />
            {isEnded ? 'Encerrado' : `Termina em ${timeLeft}`}
          </div>
        </div>
      </div>
    </Link>
  )
}
