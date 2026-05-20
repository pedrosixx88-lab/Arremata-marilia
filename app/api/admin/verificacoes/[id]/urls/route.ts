import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin'
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: verification } = await supabase
    .from('identity_verifications')
    .select('document_url, selfie_url')
    .eq('id', id)
    .single()

  if (!verification) {
    return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  }

  const [docResult, selfieResult] = await Promise.all([
    supabase.storage.from('identity-docs').createSignedUrl(verification.document_url, 3600),
    supabase.storage.from('identity-docs').createSignedUrl(verification.selfie_url, 3600),
  ])

  return NextResponse.json({
    doc: docResult.data?.signedUrl ?? null,
    selfie: selfieResult.data?.signedUrl ?? null,
  })
}
