import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ListingForm } from '@/components/listings/listing-form'

export const metadata = { title: 'Criar Anúncio — ArremataMarília' }

export default async function AnunciarPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('verification_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.verification_status !== 'verified') {
    redirect('/verificacao')
  }

  const { data: categoriesData } = await supabase.from('categories').select('id, name').order('name')
  const categories = categoriesData ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Criar anúncio</h1>
          <p className="text-sm text-gray-500 mt-1">Preencha os detalhes do item que deseja leiloar.</p>
        </div>
        <ListingForm categories={categories} />
      </div>
    </div>
  )
}
