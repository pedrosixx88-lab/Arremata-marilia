'use client'

import { useEffect, useState } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { differenceInSeconds, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface BidTimerProps {
  endsAt: Date
  onExpire?: () => void
}

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return 'Encerrado'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`
  if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function calcSecondsLeft(endsAt: Date) {
  return Math.max(0, differenceInSeconds(endsAt, new Date()))
}

export function BidTimer({ endsAt, onExpire }: BidTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(() => calcSecondsLeft(endsAt))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calcSecondsLeft(endsAt)
      setSecondsLeft(remaining)
      if (remaining === 0) {
        clearInterval(interval)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [endsAt, onExpire])

  const isUrgent = secondsLeft > 0 && secondsLeft <= 120
  const isExpired = secondsLeft === 0

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500">
        <Clock className="w-4 h-4" />
        Encerrado
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm font-semibold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
      {isUrgent ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Clock className="w-4 h-4" />}
      <span>
        {secondsLeft > 3600 * 24
          ? `Termina ${formatDistanceToNow(endsAt, { addSuffix: true, locale: ptBR })}`
          : formatCountdown(secondsLeft)}
      </span>
      {isUrgent && (
        <span className="text-xs font-normal text-red-500 ml-1">Encerrando em breve!</span>
      )}
    </div>
  )
}
