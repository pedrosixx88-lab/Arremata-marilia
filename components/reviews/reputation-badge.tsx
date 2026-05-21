import { Star } from 'lucide-react'

interface ReputationBadgeProps {
  score: number | null
  totalSales: number
  size?: 'sm' | 'md'
}

export function ReputationBadge({ score, totalSales, size = 'md' }: ReputationBadgeProps) {
  if (!score) return null

  const stars = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
  const text = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={`flex items-center gap-1 ${text} text-gray-600`}>
      <Star className={`${stars} text-yellow-400 fill-yellow-400`} />
      <span className="font-semibold">{score.toFixed(1)}</span>
      <span className="text-gray-400">({totalSales} venda{totalSales !== 1 ? 's' : ''})</span>
    </div>
  )
}
