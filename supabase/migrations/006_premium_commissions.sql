-- Tabela de comissões por arremate
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  winner_id uuid references profiles(id) on delete set null,
  sale_amount numeric(12,2) not null,
  rate numeric(5,4) not null, -- ex: 0.10 = 10%
  commission_amount numeric(12,2) not null,
  status text not null default 'pendente' check (status in ('pendente', 'pago', 'isento')),
  created_at timestamptz not null default now()
);

-- Tabela de pagamentos de plano premium
create table if not exists premium_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  plan_months int not null default 1,
  method text not null default 'manual', -- manual | pix | cartao
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table commissions enable row level security;
alter table premium_payments enable row level security;

-- Vendedor lê suas próprias comissões
create policy "commissions_seller_read" on commissions
  for select using (seller_id = auth.uid());

-- Admin lê tudo
create policy "commissions_admin_read" on commissions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "commissions_admin_all" on commissions
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Usuário lê seus próprios pagamentos premium
create policy "premium_payments_user_read" on premium_payments
  for select using (user_id = auth.uid());

create policy "premium_payments_admin_all" on premium_payments
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Índices
create index if not exists idx_commissions_seller on commissions(seller_id);
create index if not exists idx_commissions_listing on commissions(listing_id);
create index if not exists idx_premium_payments_user on premium_payments(user_id);
