import Link from 'next/link'
import { ArrowRight, Gavel, ShieldCheck, Star, Package, Clock, AlertTriangle, CreditCard, MessageSquare, CheckCircle } from 'lucide-react'

export const metadata = {
  title: 'Como funciona — ArremataMarília',
  description: 'Entenda como comprar e vender com lances no ArremataMarília. Guia completo com FAQ.',
}

const SELLER_STEPS = [
  { icon: ShieldCheck, title: 'Verifique sua identidade', description: 'Faça upload do seu RG ou CNH + selfie. Nossa equipe analisa em até 24h. Necessário apenas uma vez.' },
  { icon: Package,     title: 'Crie seu anúncio',         description: 'Adicione fotos (até 10), título, descrição detalhada, lance mínimo, reserva de preço e duração (12h a 7 dias).' },
  { icon: Clock,       title: 'Acompanhe os lances',       description: 'Receba notificações a cada lance. Veja o histórico em tempo real pelo seu dashboard.' },
  { icon: Star,        title: 'Confirme e avalie',          description: 'Ao encerrar, entre em contato com o arrematante pelo chat. Combine a entrega e avalie a experiência.' },
]

const BUYER_STEPS = [
  { icon: Gavel,          title: 'Encontre um item',    description: 'Navegue por categorias ou use a busca. Filtre por bairro, preço ou tempo restante.' },
  { icon: CreditCard,     title: 'Dê seu lance',        description: 'O lance deve ser maior que o atual + incremento mínimo definido pelo vendedor. Sem taxa para dar lances.' },
  { icon: CheckCircle,    title: 'Vença o arremate',    description: 'Se ninguém superar seu lance até o fim, você ganha! Receberá uma notificação imediatamente.' },
  { icon: MessageSquare,  title: 'Combine a entrega',   description: 'Use o chat para combinar retirada ou entrega. Avalie o vendedor após a conclusão.' },
]

const FAQS = [
  {
    q: 'Preciso pagar para criar uma conta?',
    a: 'Não. Criar conta e dar lances é gratuito. A plataforma cobra uma comissão sobre o valor do arremate apenas quando a venda é concluída.',
  },
  {
    q: 'Como funciona a verificação de identidade?',
    a: 'Apenas vendedores precisam verificar a identidade. Basta enviar foto do RG ou CNH + uma selfie segurando o documento. Nossa equipe analisa em até 24 horas. O processo acontece uma única vez.',
  },
  {
    q: 'O que é a reserva de preço?',
    a: 'É um valor mínimo definido pelo vendedor que permanece oculto. Se o maior lance não atingir a reserva, o arremate encerra sem venda e o vendedor é notificado.',
  },
  {
    q: 'O que acontece se eu der um lance e for superado?',
    a: 'Você recebe uma notificação imediata e pode dar um lance maior. Também é possível configurar um lance automático (autobid) com teto máximo.',
  },
  {
    q: 'O timer pode ser estendido?',
    a: 'Sim. Se um lance for dado nos últimos 2 minutos, o timer é automaticamente estendido por mais 2 minutos. Isso evita "sniping" (lance de última hora) e garante uma disputa mais justa.',
  },
  {
    q: 'Como é feito o pagamento?',
    a: 'O pagamento é combinado diretamente entre vendedor e comprador via chat. A plataforma não intermedia o pagamento — sugerimos Pix ou dinheiro na entrega.',
  },
  {
    q: 'E se houver um problema após o arremate?',
    a: 'Tanto o comprador quanto o vendedor podem abrir uma disputa em até 30 dias após o arremate. Nossa equipe media o caso e dá uma resposta em até 72 horas.',
  },
  {
    q: 'Posso cancelar um lance?',
    a: 'Não. Ao dar um lance, você assume o compromisso de comprar caso vença o arremate. Lances são irreversíveis.',
  },
]

const PROHIBITED = [
  'Armas, munições e explosivos',
  'Drogas e substâncias controladas',
  'Animais silvestres',
  'Produtos falsificados ou pirateados',
  'Documentos falsos',
  'Dados pessoais de terceiros',
  'Serviços ilegais de qualquer natureza',
  'Itens roubados ou de origem duvidosa',
]

export default function ComoFuncionaPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-gradient-to-br from-orange-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Como funciona</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Guia completo para comprar e vender com segurança no ArremataMarília.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-20">

        {/* Para vendedores */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Para vendedores</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {SELLER_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{i + 1}. {step.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Para compradores */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Gavel className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Para compradores</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {BUYER_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={i} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{i + 1}. {step.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Itens proibidos */}
        <section id="itens-proibidos">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Itens proibidos</h2>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <p className="text-sm text-gray-600 mb-4">
              Os seguintes itens são estritamente proibidos na plataforma. Anúncios com esses itens serão removidos e a conta poderá ser suspensa.
            </p>
            <ul className="grid sm:grid-cols-2 gap-2">
              {PROHIBITED.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-red-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Perguntas frequentes</h2>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl p-5">
                <p className="font-bold text-gray-900 text-sm mb-2">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-orange-500 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-3">Pronto para começar?</h2>
          <p className="text-orange-100 mb-6 text-sm">Crie sua conta e comece a arrematar agora mesmo.</p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-orange-50 transition-colors"
          >
            Criar conta grátis <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  )
}
