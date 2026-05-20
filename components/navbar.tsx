'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { User, LogOut, LayoutDashboard, BadgeCheck, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth-store'
import type { Profile } from '@/types'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile, setUser, setSession, setProfile, setLoading, reset } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setSession(session)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setProfile(data as Profile)
      }
      setLoading(false)
    }
    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user)
        setSession(session)
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        if (data) setProfile(data as Profile)
      } else {
        reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    reset()
    toast.success('Você saiu da conta.')
    router.push('/')
    router.refresh()
  }

  const isVerified = profile?.verification_status === 'verified'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="text-lg font-bold text-orange-500 hover:text-orange-600 transition-colors shrink-0">
          ArremataMarília
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/anuncios"
                className="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Anúncios
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-xs overflow-hidden shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (profile?.full_name ?? user.email ?? '?').charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate">
                    {profile?.full_name ?? user.email}
                  </span>
                  {isVerified && (
                    <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-gray-400" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/perfil/${user.id}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Meu perfil
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
