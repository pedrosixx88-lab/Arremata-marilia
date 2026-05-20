import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listingSchema } from '@/lib/validators/listing'

const BUCKET = 'listing-photos'
const MAX_PHOTOS = 10
const MAX_SIZE_BYTES = 10 * 1024 * 1024

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.verification_status !== 'verified') {
    return NextResponse.json({ error: 'Perfil não verificado.' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const reserve_raw = formData.get('reserve_price')
  const parsed = listingSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category_id: formData.get('category_id'),
    neighborhood: formData.get('neighborhood'),
    starting_bid: parseFloat(formData.get('starting_bid') as string),
    min_increment: parseFloat(formData.get('min_increment') as string),
    duration_hours: parseInt(formData.get('duration_hours') as string, 10),
    delivery_type: formData.get('delivery_type'),
    reserve_price:
      reserve_raw && reserve_raw !== 'null' && reserve_raw !== ''
        ? parseFloat(reserve_raw as string)
        : null,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const photoFiles = formData.getAll('photos') as File[]
  const validPhotos = photoFiles.filter((f) => f instanceof File && f.size > 0 && f.size <= MAX_SIZE_BYTES)

  if (validPhotos.length === 0) {
    return NextResponse.json({ error: 'Adicione ao menos uma foto.' }, { status: 400 })
  }

  for (const photo of validPhotos.slice(0, MAX_PHOTOS)) {
    if (!ALLOWED_MIME[photo.type]) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido.' }, { status: 400 })
    }
  }

  const photos = validPhotos.slice(0, MAX_PHOTOS)
  const uploadedPaths: string[] = []
  const photoUrls: string[] = []

  for (const photo of photos) {
    const ext = ALLOWED_MIME[photo.type]
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, photo, { contentType: photo.type, upsert: false })

    if (uploadError) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths)
      }
      return NextResponse.json({ error: 'Erro ao fazer upload de foto.' }, { status: 500 })
    }

    uploadedPaths.push(path)
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
    photoUrls.push(publicUrl)
  }

  const ends_at = new Date(Date.now() + data.duration_hours * 60 * 60 * 1000).toISOString()

  const { data: listing, error: insertError } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title: data.title,
      description: data.description,
      category_id: data.category_id,
      neighborhood: data.neighborhood,
      starting_bid: data.starting_bid,
      min_increment: data.min_increment,
      delivery_type: data.delivery_type,
      reserve_price: data.reserve_price,
      ends_at,
      photo_urls: photoUrls,
      status: 'em_moderacao',
    })
    .select('id')
    .single()

  if (insertError || !listing) {
    await supabase.storage.from(BUCKET).remove(uploadedPaths)
    return NextResponse.json({ error: 'Erro ao criar anúncio.' }, { status: 500 })
  }

  return NextResponse.json({ id: listing.id }, { status: 201 })
}
