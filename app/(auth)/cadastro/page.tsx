'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { cadastroSchema, type CadastroFormData } from '@/lib/validators/auth'

export default function CadastroPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
  })

  async function onSubmit(data: CadastroFormData) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.senha,
        options: {
          data: {
            nome: data.nome,
            cpf: data.cpf,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.code === 'user_already_exists') {
          toast.error('Este e-mail já está cadastrado. Faça login ou recupere sua senha.')
        } else {
          toast.error('Erro ao criar conta. Tente novamente.')
        }
        return
      }

      toast.success('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      router.push('/cadastro/confirmar')
    } catch {
      toast.error('Ocorreu um erro. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Criar conta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Já tem conta?{' '}
        <Link href="/login" className="text-orange-500 hover:underline font-medium">
          Entrar
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo
          </label>
          <input
            id="nome"
            type="text"
            autoComplete="name"
            placeholder="João da Silva"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading}
            {...register('nome')}
          />
          {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome.message}</p>}
        </div>

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
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50"
            disabled={isLoading}
            {...register('cpf')}
          />
          {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf.message}</p>}
        </div>

        <div>
          <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
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
            Confirmar senha
          </label>
          <input
            id="confirmarSenha"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a senha"
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
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm mt-2"
        >
          {isLoading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-4 text-xs text-gray-400 text-center">
        Ao criar uma conta, você concorda com nossos{' '}
        <Link href="/termos" className="underline hover:text-gray-600">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/privacidade" className="underline hover:text-gray-600">
          Política de Privacidade
        </Link>
        .
      </p>
    </div>
  )
}
