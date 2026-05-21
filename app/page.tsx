import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { ArrowRight, ShieldCheck, Star, Gavel, MapPin, ChevronRight } from 'lucide-react'
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
  { label: 'Eletrônicos', slug: 'eletronicos' },
  { label: 'Veículos',    slug: 'veiculos' },
  { label: 'Casa',        slug: 'casa' },
  { label: 'Roupas',      slug: 'roupas' },
  { label: 'Esportes',    slug: 'esportes' },
  { label: 'Livros',      slug: 'livros' },
  { label: 'Outros',      slug: 'outros' },
]

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Anuncie',
    description: 'Crie seu anúncio com fotos, descrição, lance mínimo e duração. Vendedores verificados têm prioridade.',
  },
  {
    number: '02',
    title: 'Receba lances',
    description: 'Compradores disputam em tempo real. Acompanhe cada lance ao vivo pelo seu dashboard.',
  },
  {
    number: '03',
    title: 'Arremate',
    description: 'O maior lance vence. Vendedor e comprador se conectam pelo chat para combinar a entrega.',
  },
]

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Identidade verificada',  description: 'Todo vendedor envia documentos antes de anunciar.' },
  { icon: Star,        title: 'Reputação pública',      description: 'Avaliações reais após cada arremate concluído.' },
  { icon: Gavel,       title: 'Mediação de disputas',   description: 'Problemas resolvidos pela nossa equipe em até 72h.' },
  { icon: MapPin,      title: 'Hiperlocal',              description: 'Pessoas reais de Marília e região.' },
]

async function getStats() {
  try {
    const service = createServiceClient()
    const [{ count: listings }, { count: users }] = await Promise.all([
      service.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
      service.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    return { listings: listings ?? 0, users: users ?? 0 }
  } catch {
    return { listings: 0, users: 0 }
  }
}

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-white">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-full mb-8">
              <MapPin className="w-3 h-3" />
              Exclusivo para Marília/SP e região
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
              Compre e venda<br />
              <span className="text-orange-500">com lances.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-xl leading-relaxed">
              O marketplace de arremates de Marília. Anuncie em minutos, receba lances ao vivo e feche negócio com segurança.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/cadastro"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/anuncios"
                className="inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
              >
                Ver anúncios
              </Link>
            </div>

            {(stats.listings > 0 || stats.users > 0) && (
              <div className="flex gap-10 mt-14 pt-10 border-t border-gray-100">
                {stats.listings > 0 && (
                  <div>
                    <p className="text-3xl font-black text-gray-900">{stats.listings}</p>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Anúncios ativos</p>
                  </div>
                )}
                {stats.users > 0 && (
                  <div>
                    <p className="text-3xl font-black text-gray-900">{stats.users}</p>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">Usuários</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── COMO FUNCIONA ────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">Como funciona</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Simples. Rápido. Seguro.</h2>
            </div>
            <Link
              href="/como-funciona"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0"
            >
              Ver guia completo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.number} className="bg-white p-8">
                <p className="text-5xl font-black text-gray-100 mb-6 leading-none">{item.number}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ANÚNCIOS EM DESTAQUE ─────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">Encerram em breve</p>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900">Em destaque</h2>
            </div>
            <Link
              href="/anuncios"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <FeaturedListings />
          <div className="text-center mt-8 sm:hidden">
            <Link href="/anuncios" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
              Ver todos os anúncios <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CATEGORIAS ───────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="mb-10">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-3">Categorias</p>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900">Navegue por categoria</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/anuncios?categoria=${cat.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-50 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 hover:border-orange-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
              >
                {cat.label}
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONFIANÇA ────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="mb-14">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-3">Segurança</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Por que confiar?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title}>
                  <div className="w-8 h-8 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section>
        <div className="max-w-6xl mx-auto px-4 py-24">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-4">Comece agora</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Pronto para arrematar?
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Crie sua conta gratuitamente e comece a dar lances hoje mesmo.
            </p>
            <Link
              href="/cadastro"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
            >
              Criar conta grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <p className="text-base font-black text-gray-900 mb-2">ArremataMarília</p>
              <p className="text-xs text-gray-400 leading-relaxed max-w-xs">
                O marketplace de lances hiperlocal de Marília/SP. Compre e venda com segurança e transparência.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">Plataforma</p>
              <ul className="space-y-2.5">
                <li><Link href="/anuncios" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Anúncios</Link></li>
                <li><Link href="/como-funciona" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Como funciona</Link></li>
                <li><Link href="/cadastro" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Criar conta</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-4">Legal</p>
              <ul className="space-y-2.5">
                <li><Link href="/termos" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Termos de uso</Link></li>
                <li><Link href="/privacidade" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Privacidade</Link></li>
                <li><Link href="/como-funciona#itens-proibidos" className="text-xs text-gray-400 hover:text-gray-800 transition-colors">Itens proibidos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-gray-300">© 2026 ArremataMarília. Todos os direitos reservados.</p>
            <p className="text-xs text-gray-300">Marília/SP, Brasil</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
