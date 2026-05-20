'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginFormData } from '@/lib/validators/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.senha,
      })

      if (error) {
        // Usa error.code para não depender do texto da mensagem em inglês
        if (error.code === 'email_not_confirmed') {
          toast.error('Confirme seu e-mail antes de fazer login.')
        } else if (error.code === 'invalid_credentials') {
          toast.error('E-mail ou senha incorretos.')
        } else {
          toast.error('Erro ao fazer login. Tente novamente.')
        }
        return
      }

      toast.success('Bem-vindo de volta!')
      router.push('/anuncios')
      router.refresh()
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
      <p className="text-sm text-gray-500 mb-6">
        Não tem conta?{' '}
        <Link href="/cadastro" className="text-orange-500 hover:underline font-medium">
          Criar conta grátis
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="joao@exemplo.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading}
            {...register('email')}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Link href="/recuperar-senha" className="text-xs text-orange-500 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="senha"
            type="password"
            autoComplete="current-password"
            placeholder="Sua senha"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading}
            {...register('senha')}
          />
          {errors.senha && <p className="mt-1 text-xs text-red-500">{errors.senha.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
