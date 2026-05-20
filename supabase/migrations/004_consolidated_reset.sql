-- ============================================================
-- ArremataMarília — Migration consolidada (idempotente)
-- Execute no SQL Editor do Supabase para garantir que tudo
-- está criado corretamente. Seguro para rodar múltiplas vezes.
-- ============================================================

-- ============================================================
-- EXTENSÕES
-- ============================================================
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS (cria apenas se não existir)
-- ============================================================
do $$ begin
  create type user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_status as enum ('draft', 'em_moderacao', 'ativo', 'encerrado', 'cancelado', 'arremate_confirmado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type dispute_status as enum ('aberta', 'em_analise', 'resolvida', 'encerrada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type delivery_type as enum ('retirada', 'entrega', 'ambos');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  cpf text unique,
  role user_role not null default 'user',
  verification_status verification_status not null default 'unverified',
  is_premium boolean not null default false,
  premium_until timestamptz,
  reputation_score numeric(3,2) not null default 0,
  total_sales int not null default 0,
  total_purchases int not null default 0,
  neighborhood text,
  blocked_users uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  created_at timestamptz not null default now()
);

insert into categories (name, slug, icon) values
  ('Eletrônicos', 'eletronicos', '📱'),
  ('Móveis e Decoração', 'moveis-decoracao', '🛋️'),
  ('Roupas e Calçados', 'roupas-calcados', '👕'),
  ('Veículos', 'veiculos', '🚗'),
  ('Esportes e Lazer', 'esportes-lazer', '⚽'),
  ('Ferramentas', 'ferramentas', '🔧'),
  ('Brinquedos e Jogos', 'brinquedos-jogos', '🧸'),
  ('Livros e Mídia', 'livros-midia', '📚'),
  ('Artesanato', 'artesanato', '🎨'),
  ('Outros', 'outros', '📦')
on conflict (slug) do nothing;

-- ============================================================
-- LISTINGS
-- ============================================================
create table if not exists listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category_id uuid not null references categories(id),
  neighborhood text not null,
  status listing_status not null default 'draft',
  starting_bid numeric(10,2) not null,
  current_bid numeric(10,2),
  reserve_price numeric(10,2),
  min_increment numeric(10,2) not null default 1,
  delivery_type delivery_type not null default 'retirada',
  ends_at timestamptz not null,
  photo_urls text[] not null default '{}',
  bid_count int not null default 0,
  winner_id uuid references profiles(id),
  is_featured boolean not null default false,
  moderation_note text,
  search_vector tsvector,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_status_idx on listings(status);
create index if not exists listings_seller_idx on listings(seller_id);
create index if not exists listings_ends_at_idx on listings(ends_at);
create index if not exists listings_category_idx on listings(category_id);
create index if not exists listings_search_idx on listings using gin(search_vector);
create index if not exists listings_neighborhood_idx on listings(neighborhood);

-- Full-text search trigger
create or replace function listings_search_vector_update()
returns trigger as $$
begin
  new.search_vector := to_tsvector('portuguese',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.neighborhood, '')
  );
  return new;
end;
$$ language plpgsql;

drop trigger if exists listings_search_vector_trigger on listings;
create trigger listings_search_vector_trigger
  before insert or update on listings
  for each row execute function listings_search_vector_update();

-- ============================================================
-- BIDS (lances)
-- ============================================================
create table if not exists bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  is_auto boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists bids_listing_idx on bids(listing_id);
create index if not exists bids_bidder_idx on bids(bidder_id);
create index if not exists bids_created_at_idx on bids(listing_id, created_at desc);

-- ============================================================
-- AUTO BIDS (lances automáticos)
-- ============================================================
create table if not exists auto_bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  max_amount numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(listing_id, bidder_id)
);

create index if not exists auto_bids_listing_idx on auto_bids(listing_id, is_active);

-- ============================================================
-- IDENTITY VERIFICATIONS
-- ============================================================
create table if not exists identity_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  document_url text not null,
  selfie_url text not null,
  status verification_status not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- REVIEWS (avaliações)
-- ============================================================
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(listing_id, reviewer_id)
);

create index if not exists reviews_reviewee_idx on reviews(reviewee_id);

create or replace function update_reputation()
returns trigger as $$
begin
  update profiles
  set reputation_score = (
    select round(avg(rating)::numeric, 2)
    from reviews
    where reviewee_id = new.reviewee_id
  )
  where id = new.reviewee_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists reviews_update_reputation on reviews;
create trigger reviews_update_reputation
  after insert on reviews
  for each row execute function update_reputation();

-- ============================================================
-- MESSAGES (chat pós-arremate)
-- ============================================================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists messages_listing_idx on messages(listing_id);
create index if not exists messages_participants_idx on messages(sender_id, receiver_id);

-- ============================================================
-- DISPUTES (disputas pós-arremate)
-- ============================================================
create table if not exists disputes (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  opener_id uuid not null references profiles(id) on delete cascade,
  respondent_id uuid not null references profiles(id) on delete cascade,
  category text not null,
  description text not null,
  evidence_urls text[] not null default '{}',
  status dispute_status not null default 'aberta',
  resolution text,
  admin_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_listing_idx on disputes(listing_id);
create index if not exists disputes_status_idx on disputes(status);

-- ============================================================
-- REPORTS (denúncias)
-- ============================================================
create table if not exists reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  reported_user_id uuid references profiles(id) on delete cascade,
  category text not null,
  description text,
  resolved boolean not null default false,
  resolved_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists reports_listing_idx on reports(listing_id);
create index if not exists reports_user_idx on reports(reported_user_id);
create index if not exists reports_resolved_idx on reports(resolved);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on notifications(user_id, read_at) where read_at is null;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
create table if not exists notification_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  bid_outbid_push boolean not null default true,
  bid_outbid_email boolean not null default true,
  timer_ending_push boolean not null default true,
  timer_ending_email boolean not null default false,
  auction_won_push boolean not null default true,
  auction_won_email boolean not null default true,
  auction_lost_push boolean not null default true,
  auction_lost_email boolean not null default false,
  listing_approved_push boolean not null default true,
  listing_approved_email boolean not null default true,
  listing_rejected_push boolean not null default true,
  listing_rejected_email boolean not null default true,
  new_review_push boolean not null default true,
  new_review_email boolean not null default false,
  dispute_push boolean not null default true,
  dispute_email boolean not null default true,
  new_message_push boolean not null default true,
  new_message_email boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FAVORITES
-- ============================================================
create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create index if not exists favorites_user_idx on favorites(user_id);

-- ============================================================
-- APP SETTINGS (chave-valor para configurações admin)
-- ============================================================
create table if not exists app_settings (
  key   text primary key,
  value text not null
);

insert into app_settings (key, value)
values ('auto_approve_verifications', 'true')
on conflict (key) do nothing;

-- ============================================================
-- TRIGGERS: updated_at automático
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();

drop trigger if exists listings_updated_at on listings;
create trigger listings_updated_at before update on listings for each row execute function set_updated_at();

drop trigger if exists identity_verifications_updated_at on identity_verifications;
create trigger identity_verifications_updated_at before update on identity_verifications for each row execute function set_updated_at();

drop trigger if exists disputes_updated_at on disputes;
create trigger disputes_updated_at before update on disputes for each row execute function set_updated_at();

-- ============================================================
-- TRIGGER: criar perfil ao cadastrar usuário
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'nome',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
exception when others then
  raise log 'handle_new_user error: % %', sqlerrm, sqlstate;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- RLS — Habilitar em todas as tabelas
-- ============================================================
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
alter table app_settings enable row level security;

-- ============================================================
-- RLS HELPER
-- ============================================================
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- ============================================================
-- RLS POLICIES (drop + recreate para garantir estado limpo)
-- ============================================================

-- CATEGORIES
drop policy if exists "categories_read" on categories;
create policy "categories_read" on categories for select using (true);

-- PROFILES
drop policy if exists "profiles_read_public" on profiles;
create policy "profiles_read_public" on profiles for select using (true);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

drop policy if exists "profiles_admin_all" on profiles;
create policy "profiles_admin_all" on profiles for all using (is_admin());

-- LISTINGS
drop policy if exists "listings_read_active" on listings;
create policy "listings_read_active" on listings
  for select using (status = 'ativo' or seller_id = auth.uid() or is_admin());

drop policy if exists "listings_insert_verified" on listings;
create policy "listings_insert_verified" on listings
  for insert with check (
    auth.uid() = seller_id and
    exists (select 1 from profiles where id = auth.uid() and verification_status = 'verified')
  );

drop policy if exists "listings_update_own" on listings;
create policy "listings_update_own" on listings
  for update using (auth.uid() = seller_id or is_admin());

drop policy if exists "listings_delete_admin" on listings;
create policy "listings_delete_admin" on listings for delete using (is_admin());

-- BIDS
drop policy if exists "bids_read" on bids;
create policy "bids_read" on bids
  for select using (
    exists (select 1 from listings where id = listing_id and status = 'ativo')
    or bidder_id = auth.uid()
    or is_admin()
  );

drop policy if exists "bids_insert_authenticated" on bids;
create policy "bids_insert_authenticated" on bids
  for insert with check (auth.uid() = bidder_id);

drop policy if exists "bids_admin_all" on bids;
create policy "bids_admin_all" on bids for all using (is_admin());

-- AUTO BIDS
drop policy if exists "auto_bids_own" on auto_bids;
create policy "auto_bids_own" on auto_bids for all using (auth.uid() = bidder_id);

drop policy if exists "auto_bids_admin" on auto_bids;
create policy "auto_bids_admin" on auto_bids for all using (is_admin());

-- IDENTITY VERIFICATIONS
drop policy if exists "identity_verifications_own" on identity_verifications;
create policy "identity_verifications_own" on identity_verifications
  for select using (auth.uid() = user_id or is_admin());

drop policy if exists "identity_verifications_insert" on identity_verifications;
create policy "identity_verifications_insert" on identity_verifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "identity_verifications_update_admin" on identity_verifications;
create policy "identity_verifications_update_admin" on identity_verifications
  for update using (is_admin());

-- REVIEWS
drop policy if exists "reviews_read" on reviews;
create policy "reviews_read" on reviews for select using (true);

drop policy if exists "reviews_insert" on reviews;
create policy "reviews_insert" on reviews for insert with check (auth.uid() = reviewer_id);

drop policy if exists "reviews_admin" on reviews;
create policy "reviews_admin" on reviews for all using (is_admin());

-- MESSAGES
drop policy if exists "messages_own" on messages;
create policy "messages_own" on messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages_insert" on messages;
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

-- DISPUTES
drop policy if exists "disputes_participants" on disputes;
create policy "disputes_participants" on disputes
  for select using (auth.uid() = opener_id or auth.uid() = respondent_id or is_admin());

drop policy if exists "disputes_insert" on disputes;
create policy "disputes_insert" on disputes for insert with check (auth.uid() = opener_id);

drop policy if exists "disputes_update" on disputes;
create policy "disputes_update" on disputes
  for update using (auth.uid() = opener_id or auth.uid() = respondent_id or is_admin());

-- REPORTS
drop policy if exists "reports_insert" on reports;
create policy "reports_insert" on reports for insert with check (auth.uid() = reporter_id);

drop policy if exists "reports_admin" on reports;
create policy "reports_admin" on reports for all using (is_admin());

drop policy if exists "reports_own_read" on reports;
create policy "reports_own_read" on reports
  for select using (auth.uid() = reporter_id or is_admin());

-- NOTIFICATIONS
drop policy if exists "notifications_own" on notifications;
create policy "notifications_own" on notifications for all using (auth.uid() = user_id);

-- NOTIFICATION PREFERENCES
drop policy if exists "notification_preferences_own" on notification_preferences;
create policy "notification_preferences_own" on notification_preferences
  for all using (auth.uid() = user_id);

-- FAVORITES
drop policy if exists "favorites_own" on favorites;
create policy "favorites_own" on favorites for all using (auth.uid() = user_id);

-- APP SETTINGS
drop policy if exists "app_settings_admin_all" on app_settings;
create policy "app_settings_admin_all" on app_settings for all using (is_admin());

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('identity-docs', 'identity-docs', false)
on conflict (id) do nothing;

-- Storage policies — identity-docs
drop policy if exists "identity_docs_upload_own" on storage.objects;
create policy "identity_docs_upload_own" on storage.objects
  for insert with check (
    bucket_id = 'identity-docs' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "identity_docs_read_admin" on storage.objects;
create policy "identity_docs_read_admin" on storage.objects
  for select using (bucket_id = 'identity-docs' and is_admin());

-- Storage policies — listing-photos
drop policy if exists "listing_photos_read_public" on storage.objects;
create policy "listing_photos_read_public" on storage.objects
  for select using (bucket_id = 'listing-photos');

drop policy if exists "listing_photos_upload_authenticated" on storage.objects;
create policy "listing_photos_upload_authenticated" on storage.objects
  for insert with check (
    bucket_id = 'listing-photos' and auth.role() = 'authenticated'
  );

drop policy if exists "listing_photos_delete_own" on storage.objects;
create policy "listing_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'listing-photos' and auth.uid() = owner::uuid
  );
