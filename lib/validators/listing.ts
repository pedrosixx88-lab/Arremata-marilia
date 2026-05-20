import { z } from 'zod'

export const TIMER_OPTIONS = [
  { label: '12 horas', value: 12 },
  { label: '24 horas', value: 24 },
  { label: '48 horas', value: 48 },
  { label: '7 dias', value: 168 },
] as const

export const DELIVERY_OPTIONS = [
  { label: 'Somente retirada', value: 'retirada' },
  { label: 'Somente entrega', value: 'entrega' },
  { label: 'Retirada ou entrega', value: 'ambos' },
] as const

const VALID_DURATIONS = [12, 24, 48, 168] as const

export const listingSchema = z
  .object({
    title: z
      .string()
      .min(10, 'Título deve ter ao menos 10 caracteres')
      .max(100, 'Título deve ter no máximo 100 caracteres'),
    description: z
      .string()
      .min(20, 'Descrição deve ter ao menos 20 caracteres')
      .max(2000, 'Descrição deve ter no máximo 2000 caracteres'),
    category_id: z.string().uuid('Selecione uma categoria'),
    neighborhood: z
      .string()
      .min(2, 'Informe o bairro')
      .max(80, 'Bairro muito longo'),
    starting_bid: z
      .number({ error: 'Informe o lance mínimo' })
      .min(1, 'Lance mínimo deve ser ao menos R$ 1,00'),
    reserve_price: z
      .number({ error: 'Valor inválido' })
      .min(1, 'Reserva deve ser ao menos R$ 1,00')
      .optional()
      .nullable(),
    min_increment: z
      .number({ error: 'Informe o incremento mínimo' })
      .min(1, 'Incremento mínimo deve ser ao menos R$ 1,00'),
    duration_hours: z
      .number({ error: 'Duração inválida' })
      .refine((v) => (VALID_DURATIONS as readonly number[]).includes(v), 'Duração inválida'),
    delivery_type: z.enum(['retirada', 'entrega', 'ambos']),
  })
  .refine(
    (data) => !data.reserve_price || data.reserve_price >= data.starting_bid,
    {
      message: 'Preço de reserva deve ser maior ou igual ao lance mínimo',
      path: ['reserve_price'],
    }
  )

export type ListingFormData = z.infer<typeof listingSchema>
