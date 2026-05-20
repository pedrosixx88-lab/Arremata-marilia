import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Não autenticado.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verifica sessão do usuário via token JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return json({ error: 'Sessão inválida.' }, 401)
    }

    const body = await req.json()
    const { listing_id, amount, max_amount } = body

    if (!listing_id || typeof amount !== 'number') {
      return json({ error: 'Dados inválidos.' }, 400)
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey)

    // Busca anúncio com lock para evitar race condition
    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, status, ends_at, current_bid, min_increment, seller_id, bid_count')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return json({ error: 'Anúncio não encontrado.' }, 404)
    }

    if (listing.status !== 'ativo') {
      return json({ error: 'Este anúncio não está ativo.' }, 400)
    }

    if (new Date(listing.ends_at) <= new Date()) {
      return json({ error: 'Este leilão já foi encerrado.' }, 400)
    }

    if (listing.seller_id === user.id) {
      return json({ error: 'Você não pode dar lances no seu próprio anúncio.' }, 400)
    }

    const minBid = (listing.current_bid ?? 0) + listing.min_increment
    if (amount < minBid) {
      return json({ error: `Lance mínimo é R$ ${minBid.toFixed(2).replace('.', ',')}` }, 400)
    }

    // Rate limiting: máx. 1 lance por 5s por usuário por anúncio
    const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
    const { count } = await admin
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', listing_id)
      .eq('bidder_id', user.id)
      .gte('created_at', fiveSecondsAgo)

    if ((count ?? 0) > 0) {
      return json({ error: 'Aguarde alguns segundos antes de dar outro lance.' }, 429)
    }

    // Insere o lance
    const isAuto = !!max_amount
    const { data: bid, error: bidError } = await admin
      .from('bids')
      .insert({
        listing_id,
        bidder_id: user.id,
        amount,
        is_auto: isAuto,
      })
      .select()
      .single()

    if (bidError) {
      return json({ error: 'Erro ao registrar lance.' }, 500)
    }

    // Atualiza current_bid e bid_count no anúncio
    await admin
      .from('listings')
      .update({
        current_bid: amount,
        bid_count: (listing.bid_count ?? 0) + 1,
      })
      .eq('id', listing_id)

    // Salva/atualiza autobid se max_amount foi informado
    if (max_amount && typeof max_amount === 'number' && max_amount >= amount) {
      await admin
        .from('auto_bids')
        .upsert(
          { listing_id, bidder_id: user.id, max_amount },
          { onConflict: 'listing_id,bidder_id' }
        )
    }

    // Anti-sniping: se lance nos últimos 2 minutos, dispara extend-timer
    const endsAt = new Date(listing.ends_at)
    const twoMinutesFromNow = new Date(Date.now() + 2 * 60 * 1000)
    if (endsAt <= twoMinutesFromNow) {
      // Invoca extend-timer em background (fire-and-forget)
      fetch(`${supabaseUrl}/functions/v1/extend-timer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ listing_id }),
      }).catch(() => {})
    }

    // Processa autobids de outros usuários que possam superar este lance
    const { data: otherAutoBids } = await admin
      .from('auto_bids')
      .select('bidder_id, max_amount')
      .eq('listing_id', listing_id)
      .neq('bidder_id', user.id)
      .gt('max_amount', amount)
      .order('max_amount', { ascending: false })
      .limit(1)

    if (otherAutoBids && otherAutoBids.length > 0) {
      const top = otherAutoBids[0]
      const counterAmount = Math.min(amount + listing.min_increment, top.max_amount)

      await admin.from('bids').insert({
        listing_id,
        bidder_id: top.bidder_id,
        amount: counterAmount,
        is_auto: true,
      })

      await admin
        .from('listings')
        .update({ current_bid: counterAmount, bid_count: (listing.bid_count ?? 0) + 2 })
        .eq('id', listing_id)
    }

    return json({ bid }, 200)
  } catch (err) {
    console.error('place-bid error:', err)
    return json({ error: 'Erro interno.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
