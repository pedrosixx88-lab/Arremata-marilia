-- Fix: winner should be able to read their won listings
drop policy if exists "listings_read_active" on listings;
create policy "listings_read_active" on listings
  for select using (
    status = 'ativo'
    or seller_id = auth.uid()
    or winner_id = auth.uid()
    or is_admin()
  );
