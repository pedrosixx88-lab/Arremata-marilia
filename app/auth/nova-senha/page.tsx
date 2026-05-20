'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { novaSenhaSchema, type NovaSenhaFormData } from '@/lib/validators/auth'

export default function NovaSenhaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NovaSenhaFormData>({
    resolver: zodResolver(novaSenhaSchema),
  })

  async function onSubmit(data: NovaSenhaFormData) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: data.senha })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Senha redefinida com sucesso!')
      router.push('/login')
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-orange-500">
            ArremataMarília
          </a>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Nova senha</h1>
          <p className="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
                Nova senha
              </label>
              <input
                id="senha"
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                disabled={isLoading}
                {...register('senha')}
              />
              {errors.senha && <p className="mt-1 text-xs text-red-500">{errors.senha.message}</p>}
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                autoComplete="new-password"
                placeholder="Repita a nova senha"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
                disabled={isLoading}
                {...register('confirmarSenha')}
              />
              {errors.confirmarSenha && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmarSenha.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {isLoading ? 'Salvando...' : 'Salvar nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
