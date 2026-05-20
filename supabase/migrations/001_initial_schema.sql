-- ============================================================
-- ArremataMarília — Schema inicial
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "unaccent";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('user', 'admin');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type listing_status as enum ('draft', 'em_moderacao', 'ativo', 'encerrado', 'cancelado', 'arremate_confirmado');
create type dispute_status as enum ('aberta', 'em_analise', 'resolvida', 'encerrada');
create type delivery_type as enum ('retirada', 'entrega', 'ambos');

-- ============================================================
-- PROFILES (extensão do auth.users)
-- ============================================================

create table profiles (
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

create table categories (
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
  ('Outros', 'outros', '📦');

-- ============================================================
-- LISTINGS (anúncios)
-- ============================================================

create table listings (
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

-- Índices para busca e performance
create index listings_status_idx on listings(status);
create index listings_seller_idx on listings(seller_id);
create index listings_ends_at_idx on listings(ends_at);
create index listings_category_idx on listings(category_id);
create index listings_search_idx on listings using gin(search_vector);
create index listings_neighborhood_idx on listings(neighborhood);

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

create trigger listings_search_vector_trigger
  before insert or update on listings
  for each row execute function listings_search_vector_update();

-- ============================================================
-- BIDS (lances)
-- ============================================================

create table bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  is_auto boolean not null default false,
  created_at timestamptz not null default now()
);

create index bids_listing_idx on bids(listing_id);
create index bids_bidder_idx on bids(bidder_id);
create index bids_created_at_idx on bids(listing_id, created_at desc);

-- ============================================================
-- AUTO BIDS (lances automáticos)
-- ============================================================

create table auto_bids (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  bidder_id uuid not null references profiles(id) on delete cascade,
  max_amount numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(listing_id, bidder_id)
);

create index auto_bids_listing_idx on auto_bids(listing_id, is_active);

-- ============================================================
-- IDENTITY VERIFICATIONS
-- ============================================================

create table identity_verifications (
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

create table reviews (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  reviewer_id uuid not null references profiles(id) on delete cascade,
  reviewee_id uuid not null references profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(listing_id, reviewer_id)
);

create index reviews_reviewee_idx on reviews(reviewee_id);

-- Atualiza reputação do usuário ao receber avaliação
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

create trigger reviews_update_reputation
  after insert on reviews
  for each row execute function update_reputation();

-- ============================================================
-- MESSAGES (chat pós-arremate)
-- ============================================================

create table messages (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references listings(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_listing_idx on messages(listing_id);
create index messages_participants_idx on messages(sender_id, receiver_id);

-- ============================================================
-- DISPUTES (disputas pós-arremate)
-- ============================================================

create table disputes (
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

create index disputes_listing_idx on disputes(listing_id);
create index disputes_status_idx on disputes(status);

-- ============================================================
-- REPORTS (denúncias)
-- ============================================================

create table reports (
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

create index reports_listing_idx on reports(listing_id);
create index reports_user_idx on reports(reported_user_id);
create index reports_resolved_idx on reports(resolved);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id, read_at) where read_at is null;

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================

create table notification_preferences (
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

create table favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);

create index favorites_user_idx on favorites(user_id);

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles for each row execute function set_updated_at();
create trigger listings_updated_at before update on listings for each row execute function set_updated_at();
create trigger identity_verifications_updated_at before update on identity_verifications for each row execute function set_updated_at();
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
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into notification_preferences (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
