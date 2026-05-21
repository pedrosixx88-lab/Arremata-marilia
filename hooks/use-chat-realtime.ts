'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  sender_id: string
  created_at: string
  read_at: string | null
}

export function useChatRealtime(listingId: string, initialMessages: ChatMessage[]) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  useEffect(() => {
    if (!listingId) return
    const supabase = createClient()

    // Broadcast channel — não depende de RLS, funciona para ambas as partes
    const channel = supabase
      .channel(`chat-broadcast:${listingId}`, {
        config: { broadcast: { self: false } },
      })
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        addMessage(payload as ChatMessage)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listingId, addMessage])

  return { messages, setMessages }
}
