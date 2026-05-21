import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Gavel, ShieldCheck, Star, ArrowRight, MapPin, Clock, TrendingUp, Package, Smartphone, Car, Home, Shirt, Dumbbell, BookOpen } from 'lucide-react'
import { FeaturedListings } from '@/components/landing/featured-listings'

export const metadata = {
  title: 'ArremataMarília — O marketplace de lances de Marília/SP',
  description: 'Compre e venda com lances em tempo real. A plataforma de arremates mais confiável de Marília e região.',
  openGraph: {
    title: 'ArremataMarília — O marketplace de lances de Marília/SP',
    description: 'Compre e venda com lances em tempo real.',
    type: 'website',
  },
}

const CATEGORIES = [
  { icon: Smartphone, label: 'Eletrônicos', slug: 'eletronicos', color: 'bg-blue-50 text-blue-600' },
  { icon: Car,        label: 'Veículos',    slug: 'veiculos',    color: 'bg-red-50 text-red-600' },
  { icon: Home,       label: 'Casa',        slug: 'casa',        color: 'bg-green-50 text-green-600' },
  { icon: Shirt,      label: 'Roupas',      slug: 'roupas',      color: 'bg-pink-50 text-pink-600' },
  { icon: Dumbbell,   label: 'Esportes',    slug: 'esportes',    color: 'bg-orange-50 text-orange-600' },
  { icon: BookOpen,   label: 'Livros',      slug: 'livros',      color: 'bg-yellow-50 text-yellow-600' },
  { icon: Package,    label: 'Outros',      slug: 'outros',      color: 'bg-gray-50 text-gray-600' },
]

const HOW_IT_WORKS = [
  {
    step: '1',
    icon: Package,
    title: 'Anuncie seu item',
    description: 'Crie seu anúncio em minutos. Adicione fotos, descrição e defina o lance mínimo e o tempo de duração.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    step: '2',
    icon: Gavel,
    title: 'Receba lances',
    description: 'Compradores dão lances em tempo real. Você acompanha tudo ao vivo pelo dashboard.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    step: '3',
    icon: Star,
    title: 'Arremate e avalie',
    description: 'Ao encerrar, vendedor e comprador combinam a entrega e avaliam a experiência.',
    color: 'bg-green-100 text-green-600',
  },
]

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Identidade verificada', description: 'Todos os vendedores passam por verificação de documentos antes de anunciar.' },
  { icon: Star,        title: 'Sistema de reputação',  description: 'Avaliações públicas após cada arremate. Compre de quem tem histórico comprovado.' },
  { icon: Gavel,       title: 'Mediação de disputas',  description: 'Qualquer problema pós-arremate? Nossa equipe media e resolve em até 72h.' },
  { icon: MapPin,      title: 'Hiperlocal',             description: 'Focado em Marília/SP. Negociações com pessoas da sua cidade.' },
]

async function getStats() {
  const service = createServiceClient()
  const [{ count: listings }, { count: users }] = await Promise.all([
    service.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    service.from('profiles').select('id', { count: 'exact', head: true }),
  ])
  return { listings: listings ?? 0, users: users ?? 0 }
}

export default async function HomePage() {
  const stats = await getStats().catch(() => ({ listings: 0, users: 0 }))

  return (
    <div className="min-h-screen bg-white">
      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-100/40 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <MapPin className="w-3.5 h-3.5" />
              Exclusivo para Marília/SP e região
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
              Compre e venda com{' '}
              <span className="text-orange-500">lances em tempo real</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              O marketplace de arremates de Marília. Anuncie em minutos, receba lances ao vivo e arremate com segurança.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl text-base transition-colors shadow-lg shadow-orange-200"
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/anuncios"
                className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3.5 rounded-xl text-base transition-colors"
              >
                Ver anúncios
              </Link>
            </div>

            {/* Stats */}
            {(stats.listings > 0 || stats.users > 0) && (
              <div className="flex gap-8 mt-10">
                {stats.listings > 0 && (
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.listings}</p>
                    <p className="text-sm text-gray-500">anúncios ativos</p>
                  </div>
                )}
                {stats.users > 0 && (
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">{stats.users}</p>
                    <p className="text-sm text-gray-500">usuários cadastrados</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Como funciona</h2>
          <p className="text-gray-500 text-lg">Simples, rápido e seguro. Em 3 passos.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="relative text-center group">
                <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-5 transition-transform group-hover:scale-110`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="absolute top-0 right-0 md:right-auto md:left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center hidden md:flex">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/como-funciona"
            className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-700 font-semibold text-sm transition-colors"
          >
            Ver guia completo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── ANÚNCIOS EM DESTAQUE ─────────────────────────────── */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Em destaque</h2>
              <p className="text-gray-500">Anúncios com encerramento em breve</p>
            </div>
            <Link
              href="/anuncios"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-orange-500 hover:text-orange-700 transition-colors"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <FeaturedListings />
          <div className="text-center mt-8 sm:hidden">
            <Link href="/anuncios" className="inline-flex items-center gap-1 text-sm font-semibold text-orange-500">
              Ver todos os anúncios <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIAS ───────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">Navegue por categoria</h2>
          <p className="text-gray-500">Encontre o que procura mais rápido</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <Link
                key={cat.slug}
                href={`/anuncios?categoria=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${cat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-gray-700 text-center">{cat.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ─── CONFIANÇA ────────────────────────────────────────── */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-white mb-3">Por que confiar na plataforma?</h2>
            <p className="text-gray-400 text-lg">Segurança e transparência em cada arremate</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-gray-800 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{item.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-10 md:p-16 text-center">
          <TrendingUp className="w-12 h-12 text-white/80 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Pronto para arrematar?
          </h2>
          <p className="text-orange-100 text-lg mb-8 max-w-md mx-auto">
            Crie sua conta gratuita e comece a dar lances agora mesmo.
          </p>
          <Link
            href="/cadastro"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-8 py-4 rounded-xl text-base hover:bg-orange-50 transition-colors shadow-xl"
          >
            Criar conta grátis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="text-base font-bold text-orange-500 mb-2">ArremataMarília</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                O marketplace de lances hiperlocal de Marília/SP. Compre e venda com segurança.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Plataforma</p>
              <ul className="space-y-2">
                <li><Link href="/anuncios" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Anúncios</Link></li>
                <li><Link href="/como-funciona" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Como funciona</Link></li>
                <li><Link href="/cadastro" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Criar conta</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Legal</p>
              <ul className="space-y-2">
                <li><Link href="/termos" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Política de privacidade</Link></li>
                <li><Link href="/como-funciona#itens-proibidos" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">Itens proibidos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-400">© 2026 ArremataMarília. Todos os direitos reservados.</p>
            <p className="text-xs text-gray-400">Marília/SP, Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
