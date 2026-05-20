'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bot, ChevronDown, ChevronUp } from 'lucide-react'

interface AutoBidFormProps {
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

export function AutoBidForm({ listingId, currentBid, minIncrement, isEnded, isLoggedIn, isSeller }: AutoBidFormProps) {
  const [open, setOpen] = useState(false)
  const [maxAmount, setMaxAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeAutoBid, setActiveAutoBid] = useState<number | null>(null)

  const minRequired = currentBid + minIncrement

  if (isEnded || isSeller || !isLoggedIn) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const value = parseFloat(maxAmount.replace(',', '.'))
    if (isNaN(value) || value < minRequired) {
      toast.error(`Teto mínimo: ${formatCurrency(minRequired)}`)
      return
    }

    setIsLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session.session?.access_token ?? ''

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/place-bid`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listing_id: listingId, amount: minRequired, max_amount: value }),
        }
      )

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao configurar lance automático.')
        return
      }

      setActiveAutoBid(value)
      setMaxAmount('')
      setOpen(false)
      toast.success(`Lance automático ativado até ${formatCurrency(value)}!`)
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCancel() {
    setActiveAutoBid(null)
    toast.info('Lance automático desativado.')
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-gray-500" />
          <span className="font-medium">Lance automático</span>
          {activeAutoBid && (
            <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full">
              ativo até {formatCurrency(activeAutoBid)}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-3">
            O sistema dará lances automáticos por você até o valor máximo definido, usando o incremento mínimo.
          </p>

          {activeAutoBid ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Teto ativo: <span className="font-semibold">{formatCurrency(activeAutoBid)}</span>
              </p>
              <button
                type="button"
                onClick={handleCancel}
                className="w-full text-sm text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
              >
                Cancelar lance automático
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min={minRequired}
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  placeholder={`Teto (mín. ${minRequired.toFixed(2)})`}
                  disabled={isLoading}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold px-3 py-2 rounded-lg text-sm transition-colors shrink-0"
              >
                <Bot className="w-3.5 h-3.5" />
                {isLoading ? '...' : 'Ativar'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
