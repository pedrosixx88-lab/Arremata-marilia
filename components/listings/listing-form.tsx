'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PhotoUploader } from './photo-uploader'
import { listingSchema, type ListingFormData, TIMER_OPTIONS, DELIVERY_OPTIONS } from '@/lib/validators/listing'

interface Category {
  id: string
  name: string
}

interface ListingFormProps {
  categories: Category[]
}

export function ListingForm({ categories }: ListingFormProps) {
  const router = useRouter()
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      duration_hours: 24,
      delivery_type: 'ambos',
      min_increment: 10,
    },
  })

  async function onSubmit(data: ListingFormData) {
    if (photos.length === 0) {
      toast.error('Adicione ao menos uma foto ao anúncio.')
      return
    }

    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null && v !== undefined) formData.append(k, String(v))
      })
      photos.forEach((photo) => formData.append('photos', photo))

      const res = await fetch('/api/listings', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar anúncio.')
        return
      }

      toast.success('Anúncio enviado para moderação!')
      router.push('/dashboard')
    } catch {
      toast.error('Erro ao enviar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startingBid = watch('starting_bid')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Fotos */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Fotos</h2>
        <PhotoUploader files={photos} onChange={setPhotos} disabled={isSubmitting} />
      </section>

      {/* Informações básicas */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Informações do item</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            type="text"
            placeholder="Ex: iPhone 13 128GB Azul — excelente estado"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            disabled={isSubmitting}
            {...register('title')}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            rows={5}
            placeholder="Descreva o item com detalhes: estado de conservação, acessórios inclusos, motivo da venda..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 resize-none"
            disabled={isSubmitting}
            {...register('description')}
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 bg-white"
              disabled={isSubmitting}
              {...register('category_id')}
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
            <input
              type="text"
              placeholder="Ex: Centro, Vila Nova..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={isSubmitting}
              {...register('neighborhood')}
            />
            {errors.neighborhood && <p className="mt-1 text-xs text-red-500">{errors.neighborhood.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de entrega</label>
          <div className="flex gap-3 flex-wrap">
            {DELIVERY_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="radio" value={opt.value} {...register('delivery_type')} className="accent-orange-500" />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Configurações do lance */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Configurações do lance</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lance mínimo (R$)</label>
            <input
              type="number"
              min={1}
              step={0.01}
              placeholder="0,00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={isSubmitting}
              {...register('starting_bid', { valueAsNumber: true })}
            />
            {errors.starting_bid && <p className="mt-1 text-xs text-red-500">{errors.starting_bid.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incremento mínimo (R$)
            </label>
            <input
              type="number"
              min={1}
              step={1}
              placeholder="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
              disabled={isSubmitting}
              {...register('min_increment', { valueAsNumber: true })}
            />
            {errors.min_increment && <p className="mt-1 text-xs text-red-500">{errors.min_increment.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preço de reserva (R$) <span className="text-gray-400 font-normal">— opcional, oculto para compradores</span>
          </label>
          <input
            type="number"
            min={startingBid ?? 1}
            step={0.01}
            placeholder="Deixe vazio para não usar"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            disabled={isSubmitting}
            {...register('reserve_price', { valueAsNumber: true, setValueAs: (v) => v === '' || isNaN(v) ? null : Number(v) })}
          />
          {errors.reserve_price && <p className="mt-1 text-xs text-red-500">{errors.reserve_price.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duração do leilão</label>
          <div className="flex gap-3 flex-wrap">
            {TIMER_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  {...register('duration_hours', { valueAsNumber: true })}
                  className="accent-orange-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
      </section>

      <button
        type="submit"
        disabled={isSubmitting || photos.length === 0}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
      >
        {isSubmitting ? 'Enviando para moderação...' : 'Publicar anúncio'}
      </button>
    </form>
  )
}
