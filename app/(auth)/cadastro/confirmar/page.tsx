import Link from 'next/link'
import { Mail } from 'lucide-react'

export default function ConfirmarEmailPage() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu e-mail</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enviamos um link de confirmação para o seu e-mail. Clique no link para ativar sua conta.
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Não recebeu? Verifique sua caixa de spam ou{' '}
        <Link href="/cadastro" className="text-orange-500 hover:underline">
          tente novamente
        </Link>
        .
      </p>
      <div className="flex flex-col gap-2 items-center">
        <Link
          href="/onboarding"
          className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-5 py-2.5 rounded-xl transition-colors"
        >
          Ver como funciona
        </Link>
        <Link
          href="/login"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Ir para o login
        </Link>
      </div>
    </div>
  )
}
