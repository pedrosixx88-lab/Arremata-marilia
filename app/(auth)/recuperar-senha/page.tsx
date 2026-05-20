'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { recuperarSenhaSchema, type RecuperarSenhaFormData } from '@/lib/validators/auth'

export default function RecuperarSenhaPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecuperarSenhaFormData>({
    resolver: zodResolver(recuperarSenhaSchema),
  })

  async function onSubmit(data: RecuperarSenhaFormData) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/nova-senha`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setEnviado(true)
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (enviado) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">E-mail enviado!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha.
          Verifique também sua caixa de spam.
        </p>
        <Link href="/login" className="text-sm text-orange-500 hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Recuperar senha</h1>
      <p className="text-sm text-gray-500 mb-6">
        Informe seu e-mail e enviaremos um link para redefinir sua senha.
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          {isLoading ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/login" className="text-sm text-gray-500 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
