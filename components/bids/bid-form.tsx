'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Gavel } from 'lucide-react'

interface BidFormProps {
  listingId: string
  currentBid: number
  minIncrement: number
  isEnded: boolean
  isLoggedIn: boolean
  isSeller: boolean
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function BidForm({ listingId, currentBid, minIncrement, isEnded, isLoggedIn, isSeller }: BidFormProps) {
  const router = useRouter()
  const minBid = currentBid + minIncrement
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const value = parseFloat(amount.replace(',', '.'))
    if (isNaN(value) || value < minBid) {
      toast.error(`Lance mínimo: ${formatCurrency(minBid)}`)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/place-bid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await getAccessToken()}`,
          },
          body: JSON.stringify({ listing_id: listingId, amount: value }),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao registrar lance.')
        return
      }

      toast.success(`Lance de ${formatCurrency(value)} registrado!`)
      setAmount('')
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isEnded) {
    return (
      <div className="pt-2 border-t border-orange-200">
        <p className="text-sm text-gray-500 text-center font-medium">Este leilão foi encerrado.</p>
      </div>
    )
  }

  if (isSeller) {
    return (
      <div className="pt-2 border-t border-orange-200">
        <p className="text-xs text-gray-400 text-center">Você é o vendedor deste anúncio.</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="pt-2 border-t border-orange-200">
        <p className="text-sm text-gray-600 text-center mb-2">
          <a href="/login" className="text-orange-500 font-medium hover:underline">Faça login</a> para dar um lance
        </p>
        <p className="text-xs text-gray-400 text-center">Lance mínimo: {formatCurrency(minBid)}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="pt-2 border-t border-orange-200 space-y-2">
      <p className="text-xs text-gray-500">
        Lance mínimo: <span className="font-semibold text-gray-800">{formatCurrency(minBid)}</span>
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">R$</span>
          <input
            type="number"
            step="0.01"
            min={minBid}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={minBid.toFixed(2)}
            disabled={isLoading}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors shrink-0"
        >
          <Gavel className="w-4 h-4" />
          {isLoading ? 'Enviando...' : 'Dar lance'}
        </button>
      </div>
    </form>
  )
}

async function getAccessToken(): Promise<string> {
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? ''
}
