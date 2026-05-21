'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle } from 'lucide-react'

export function AdminPremiumActions({ paymentId }: { paymentId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      await fetch('/api/admin/premium', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, action }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-3 pt-2 border-t border-gray-100">
      <button
        onClick={() => handle('approve')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <CheckCircle className="w-4 h-4" />
        {loading === 'approve' ? 'Aprovando...' : 'Aprovar'}
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <XCircle className="w-4 h-4" />
        {loading === 'reject' ? 'Recusando...' : 'Recusar'}
      </button>
    </div>
  )
}
