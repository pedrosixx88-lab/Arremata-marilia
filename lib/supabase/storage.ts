import { createClient } from '@/lib/supabase/client'

const BUCKET = 'identity-docs'

export async function uploadIdentityFile(
  userId: string,
  type: 'document' | 'selfie',
  file: File
): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `${userId}/${type}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })

  if (error) throw new Error(error.message)

  return path
}

export async function getIdentityFileUrl(path: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 60 * 60) // 1 hora

  if (error || !data) throw new Error('Erro ao gerar URL do arquivo')

  return data.signedUrl
}
