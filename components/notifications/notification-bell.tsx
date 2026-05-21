'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, MessageSquare, Star, Gavel, CheckCheck, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, string> | null
  read_at: string | null
  created_at: string
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  new_message:  <MessageSquare className="w-4 h-4 text-blue-500" />,
  new_review:   <Star className="w-4 h-4 text-yellow-500" />,
  bid_placed:   <Gavel className="w-4 h-4 text-orange-500" />,
  bid_beaten:   <Gavel className="w-4 h-4 text-red-500" />,
  auction_won:  <Gavel className="w-4 h-4 text-green-500" />,
}

function notificationHref(n: Notification): string | null {
  const d = n.data
  if (!d) return null
  if (n.type === 'new_message' && d.listing_id) return `/mensagens/${d.listing_id}`
  if (n.type === 'new_review'  && d.listing_id) return `/arremates/${d.listing_id}`
  if (d.listing_id) return `/anuncios/${d.listing_id}`
  return null
}

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const json = await res.json() as { notifications: Notification[]; unreadCount: number }
    setNotifications(json.notifications)
    setUnread(json.unreadCount)
  }, [])

  useEffect(() => { void load() }, [load])

  // Realtime — novas notificações chegam sem F5
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as Notification
          setNotifications(prev => [n, ...prev].slice(0, 30))
          setUnread(prev => prev + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  // Fecha ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  async function markAllRead() {
    await fetch('/api/notifications/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    setUnread(0)
  }

  async function handleClick(n: Notification) {
    if (!n.read_at) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: n.id }),
      })
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x))
      setUnread(prev => Math.max(0, prev - 1))
    }
    const href = notificationHref(n)
    if (href) { setOpen(false); router.push(href) }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Botão sino */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
        aria-label="Notificações"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Notificações</h2>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-orange-500 hover:text-orange-700 flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar todas como lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhuma notificação ainda.</p>
              </div>
            ) : (
              notifications.map(n => {
                const isUnread = !n.read_at
                const href = notificationHref(n)
                return (
                  <button
                    key={n.id}
                    onClick={() => void handleClick(n)}
                    className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors ${
                      isUnread ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'
                    } ${href ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                      {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'} leading-snug`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {isUnread && (
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
