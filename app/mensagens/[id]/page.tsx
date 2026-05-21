'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Send } from 'lucide-react'
import { useChatRealtime, type ChatMessage } from '@/hooks/use-chat-realtime'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ChatData {
  listing: { id: string; title: string }
  messages: ChatMessage[]
  currentUserId: string
  partnerId: string
}

export default function MensagensPage() {
  const params = useParams()
  const router = useRouter()
  const listingId = params.id as string

  const [data, setData] = useState<ChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/mensagens/${listingId}`)
    if (res.status === 401) { router.push('/login'); return }
    if (!res.ok) { router.push('/dashboard'); return }
    const json = await res.json() as ChatData
    setData(json)
    setLoading(false)
  }, [listingId, router])

  useEffect(() => { void load() }, [load])

  const { messages, setMessages } = useChatRealtime(listingId, data?.messages ?? [])

  // Sync initial messages when data loads
  useEffect(() => {
    if (data?.messages) setMessages(data.messages)
  }, [data?.messages, setMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput('')
    const res = await fetch(`/api/mensagens/${listingId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const json = await res.json() as { message: ChatMessage }
      // Add optimistically if realtime didn't pick it up yet
      setMessages((prev) =>
        prev.some((m) => m.id === json.message.id) ? prev : [...prev, json.message]
      )
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link href={`/arremates/${listingId}`} className="text-gray-500 hover:text-gray-800">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <p className="text-xs text-gray-400">Arremate</p>
          <h1 className="text-sm font-semibold text-gray-900 truncate">{data.listing.title}</h1>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg mx-auto w-full">
        {messages.length === 0 && (
          <p className="text-center text-sm text-gray-400 py-10">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === data.currentUserId
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                  isMine
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                }`}
              >
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMine ? 'text-orange-100' : 'text-gray-400'}`}>
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent max-h-32"
          />
          <button
            onClick={() => void handleSend()}
            disabled={!input.trim() || sending}
            className="w-10 h-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white flex items-center justify-center transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
