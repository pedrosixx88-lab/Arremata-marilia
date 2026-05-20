'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface Category {
  id: string
  name: string
}

interface FiltersProps {
  categories: Category[]
}

const SORT_OPTIONS = [
  { label: 'Mais recentes', value: 'recentes' },
  { label: 'Encerrando em breve', value: 'encerrando' },
  { label: 'Mais lances', value: 'mais_lances' },
  { label: 'Menor preço', value: 'menor_preco' },
]

export function Filters({ categories }: FiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('pagina')
      router.push(`/anuncios?${params.toString()}`)
    },
    [router, searchParams]
  )

  const current = {
    categoria: searchParams.get('categoria') ?? '',
    bairro: searchParams.get('bairro') ?? '',
    preco_min: searchParams.get('preco_min') ?? '',
    preco_max: searchParams.get('preco_max') ?? '',
    ordenar: searchParams.get('ordenar') ?? 'recentes',
    q: searchParams.get('q') ?? '',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
      {/* Busca */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Busca</label>
        <input
          type="text"
          placeholder="Buscar anúncios..."
          defaultValue={current.q}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('q', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => setParam('q', e.target.value)}
        />
      </div>

      {/* Categoria */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Categoria</label>
        <select
          value={current.categoria}
          onChange={(e) => setParam('categoria', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Bairro */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Bairro</label>
        <input
          type="text"
          placeholder="Ex: Centro..."
          defaultValue={current.bairro}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('bairro', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => setParam('bairro', e.target.value)}
        />
      </div>

      {/* Faixa de preço */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Faixa de preço</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Mín"
            defaultValue={current.preco_min}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            onBlur={(e) => setParam('preco_min', e.target.value)}
          />
          <input
            type="number"
            placeholder="Máx"
            defaultValue={current.preco_max}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            onBlur={(e) => setParam('preco_max', e.target.value)}
          />
        </div>
      </div>

      {/* Ordenação */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Ordenar por</label>
        <select
          value={current.ordenar}
          onChange={(e) => setParam('ordenar', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
