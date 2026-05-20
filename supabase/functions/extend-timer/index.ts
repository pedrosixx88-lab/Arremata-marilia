import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTENSION_MINUTES = 2

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { listing_id } = body

    if (!listing_id) {
      return json({ error: 'listing_id obrigatório.' }, 400)
    }

    const { data: listing } = await admin
      .from('listings')
      .select('id, ends_at, status')
      .eq('id', listing_id)
      .single()

    if (!listing || listing.status !== 'ativo') {
      return json({ error: 'Anúncio não encontrado ou não ativo.' }, 404)
    }

    const currentEndsAt = new Date(listing.ends_at)
    const now = new Date()

    // Só estende se o anúncio encerra nos próximos 2 minutos
    const msUntilEnd = currentEndsAt.getTime() - now.getTime()
    if (msUntilEnd > EXTENSION_MINUTES * 60 * 1000) {
      return json({ extended: false, reason: 'Mais de 2 minutos restantes.' }, 200)
    }

    // Nova data de encerramento: atual + EXTENSION_MINUTES minutos
    const newEndsAt = new Date(currentEndsAt.getTime() + EXTENSION_MINUTES * 60 * 1000)

    const { error } = await admin
      .from('listings')
      .update({ ends_at: newEndsAt.toISOString() })
      .eq('id', listing_id)

    if (error) {
      return json({ error: 'Erro ao estender o timer.' }, 500)
    }

    return json({ extended: true, new_ends_at: newEndsAt.toISOString() }, 200)
  } catch (err) {
    console.error('extend-timer error:', err)
    return json({ error: 'Erro interno.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
