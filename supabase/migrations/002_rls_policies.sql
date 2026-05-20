-- ============================================================
-- ArremataMarília — Row Level Security (RLS)
-- ============================================================

-- Habilitar RLS em todas as tabelas
alter table profiles enable row level security;
alter table listings enable row level security;
alter table bids enable row level security;
alter table auto_bids enable row level security;
alter table identity_verifications enable row level security;
alter table reviews enable row level security;
alter table messages enable row level security;
alter table disputes enable row level security;
alter table reports enable row level security;
alter table notifications enable row level security;
alter table notification_preferences enable row level security;
alter table favorites enable row level security;
alter table categories enable row level security;

-- Helper: verifica se o usuário é admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- CATEGORIES (leitura pública)
-- ============================================================
create policy "categories_read" on categories for select using (true);

-- ============================================================
-- PROFILES
-- ============================================================
create policy "profiles_read_public" on profiles
  for select using (true);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_all" on profiles
  for all using (is_admin());

-- ============================================================
-- LISTINGS
-- ============================================================
create policy "listings_read_active" on listings
  for select using (status = 'ativo' or seller_id = auth.uid() or is_admin());

create policy "listings_insert_verified" on listings
  for insert with check (
    auth.uid() = seller_id and
    exists (
      select 1 from profiles
      where id = auth.uid() and verification_status = 'verified'
    )
  );

create policy "listings_update_own" on listings
  for update using (auth.uid() = seller_id or is_admin());

create policy "listings_delete_admin" on listings
  for delete using (is_admin());

-- ============================================================
-- BIDS
-- ============================================================
create policy "bids_read" on bids
  for select using (
    exists (select 1 from listings where id = listing_id and status = 'ativo')
    or bidder_id = auth.uid()
    or is_admin()
  );

create policy "bids_insert_authenticated" on bids
  for insert with check (auth.uid() = bidder_id);

create policy "bids_admin_all" on bids
  for all using (is_admin());

-- ============================================================
-- AUTO BIDS
-- ============================================================
create policy "auto_bids_own" on auto_bids
  for all using (auth.uid() = bidder_id);

create policy "auto_bids_admin" on auto_bids
  for all using (is_admin());

-- ============================================================
-- IDENTITY VERIFICATIONS
-- ============================================================
create policy "identity_verifications_own" on identity_verifications
  for select using (auth.uid() = user_id or is_admin());

create policy "identity_verifications_insert" on identity_verifications
  for insert with check (auth.uid() = user_id);

create policy "identity_verifications_update_admin" on identity_verifications
  for update using (is_admin());

-- ============================================================
-- REVIEWS
-- ============================================================
create policy "reviews_read" on reviews
  for select using (true);

create policy "reviews_insert" on reviews
  for insert with check (auth.uid() = reviewer_id);

create policy "reviews_admin" on reviews
  for all using (is_admin());

-- ============================================================
-- MESSAGES
-- ============================================================
create policy "messages_own" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "messages_insert" on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from listings
      where id = listing_id
        and status = 'arremate_confirmado'
        and (seller_id = auth.uid() or winner_id = auth.uid())
    )
  );

-- ============================================================
-- DISPUTES
-- ============================================================
create policy "disputes_participants" on disputes
  for select using (
    auth.uid() = opener_id or
    auth.uid() = respondent_id or
    is_admin()
  );

create policy "disputes_insert" on disputes
  for insert with check (auth.uid() = opener_id);

create policy "disputes_update" on disputes
  for update using (
    auth.uid() = opener_id or
    auth.uid() = respondent_id or
    is_admin()
  );

-- ============================================================
-- REPORTS
-- ============================================================
create policy "reports_insert" on reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_admin" on reports
  for all using (is_admin());

create policy "reports_own_read" on reports
  for select using (auth.uid() = reporter_id or is_admin());

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create policy "notifications_own" on notifications
  for all using (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
create policy "notification_preferences_own" on notification_preferences
  for all using (auth.uid() = user_id);

-- ============================================================
-- FAVORITES
-- ============================================================
create policy "favorites_own" on favorites
  for all using (auth.uid() = user_id);
