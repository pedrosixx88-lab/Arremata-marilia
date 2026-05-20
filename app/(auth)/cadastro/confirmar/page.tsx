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
      <Link
        href="/login"
        className="text-sm text-orange-500 hover:underline font-medium"
      >
        Voltar para o login
      </Link>
    </div>
  )
}
