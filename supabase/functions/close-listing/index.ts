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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const { listing_id } = body

    // Se chamado sem listing_id específico, processa todos os vencidos
    const query = admin
      .from('listings')
      .select('id, title, seller_id, current_bid, reserve_price, bid_count, ends_at')
      .eq('status', 'ativo')
      .lte('ends_at', new Date().toISOString())

    if (listing_id) {
      query.eq('id', listing_id)
    }

    const { data: listings, error } = await query
    if (error) {
      return json({ error: 'Erro ao buscar anúncios.' }, 500)
    }

    const results = []

    for (const listing of (listings ?? [])) {
      const hasReserve = listing.reserve_price != null
      const reserveMet = !hasReserve || (listing.current_bid ?? 0) >= listing.reserve_price!
      const hasBids = (listing.bid_count ?? 0) > 0

      if (!hasBids || !reserveMet) {
        // Encerra sem venda
        await admin
          .from('listings')
          .update({ status: 'encerrado' })
          .eq('id', listing.id)

        // Notifica vendedor: sem vencedor
        await admin.from('notifications').insert({
          user_id: listing.seller_id,
          type: 'listing_closed_no_sale',
          title: 'Anúncio encerrado sem venda',
          body: `Seu anúncio "${listing.title}" encerrou ${!hasBids ? 'sem lances' : 'sem atingir o preço de reserva'}.`,
          data: { listing_id: listing.id },
        })

        results.push({ listing_id: listing.id, outcome: 'no_sale' })
        continue
      }

      // Busca o lance vencedor (maior valor, mais antigo em caso de empate)
      const { data: winnerBid } = await admin
        .from('bids')
        .select('bidder_id, amount')
        .eq('listing_id', listing.id)
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (!winnerBid) {
        await admin.from('listings').update({ status: 'encerrado' }).eq('id', listing.id)
        results.push({ listing_id: listing.id, outcome: 'no_sale' })
        continue
      }

      // Marca anúncio como arremate_confirmado com vencedor
      await admin
        .from('listings')
        .update({
          status: 'arremate_confirmado',
          winner_id: winnerBid.bidder_id,
          final_price: winnerBid.amount,
        })
        .eq('id', listing.id)

      // Notifica vencedor
      await admin.from('notifications').insert({
        user_id: winnerBid.bidder_id,
        type: 'auction_won',
        title: 'Você venceu o leilão!',
        body: `Parabéns! Você arrematou "${listing.title}" por R$ ${winnerBid.amount.toFixed(2).replace('.', ',')}. Entre em contato com o vendedor.`,
        data: { listing_id: listing.id },
      })

      // Notifica vendedor
      await admin.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'listing_sold',
        title: 'Seu anúncio foi arrematado!',
        body: `"${listing.title}" foi arrematado por R$ ${winnerBid.amount.toFixed(2).replace('.', ',')}.`,
        data: { listing_id: listing.id, winner_id: winnerBid.bidder_id },
      })

      results.push({ listing_id: listing.id, outcome: 'sold', winner_id: winnerBid.bidder_id, final_price: winnerBid.amount })
    }

    return json({ processed: results.length, results }, 200)
  } catch (err) {
    console.error('close-listing error:', err)
    return json({ error: 'Erro interno.' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
