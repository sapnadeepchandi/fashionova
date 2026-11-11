-- Fashionova database schema (PostgreSQL 14+ / Supabase)
-- Safe to run more than once.

create extension if not exists pgcrypto;

-- ---------- media ----------
create table if not exists images (
  id          uuid primary key default gen_random_uuid(),
  mime        text not null,
  width       int,
  height      int,
  bytes       int not null,
  data        bytea not null,
  alt         text default '',
  created_at  timestamptz not null default now()
);

-- ---------- admin users ----------
create table if not exists admin_users (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  name            text not null,
  password_hash   text not null,
  role            text not null check (role in ('owner','manager','staff')),
  active          boolean not null default true,
  session_version int not null default 1,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists login_attempts (
  id         bigserial primary key,
  scope      text not null,       -- 'admin' | 'customer'
  identifier text not null,       -- email or ip
  success    boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_lookup on login_attempts (scope, identifier, created_at desc);

-- ---------- catalogue ----------
create table if not exists categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text not null default '',
  image_id     uuid references images(id) on delete set null,
  sort_order   int not null default 0,
  show_in_nav  boolean not null default true,
  show_on_home boolean not null default true,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text not null default '',
  details      text not null default '',       -- one bullet per line
  price        numeric(10,2) not null check (price >= 0),
  sale_price   numeric(10,2) check (sale_price is null or sale_price >= 0),
  heel         text not null default '',
  material     text not null default '',
  is_new       boolean not null default false,
  is_bestseller boolean not null default false,
  is_featured  boolean not null default false,
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists product_categories (
  product_id  uuid not null references products(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists product_images (
  product_id uuid not null references products(id) on delete cascade,
  image_id   uuid not null references images(id) on delete cascade,
  sort_order int not null default 0,
  primary key (product_id, image_id)
);

create table if not exists product_colors (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name       text not null,
  hex        text not null,
  sort_order int not null default 0,
  unique (product_id, name)
);

-- one row per colour x size, holds the stock
create table if not exists product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  color      text not null,
  size       int  not null check (size between 35 and 42),
  stock      int  not null default 0 check (stock >= 0),
  sku        text,
  unique (product_id, color, size)
);
create index if not exists variants_product on product_variants(product_id);

-- ---------- customers ----------
create table if not exists customers (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  name           text not null default '',
  phone          text not null default '',
  password_hash  text,                     -- null = guest checkout only
  address_line1  text not null default '',
  address_line2  text not null default '',
  city           text not null default '',
  postcode       text not null default '',
  country        text not null default '',
  marketing_opt_in boolean not null default false,
  session_version int not null default 1,
  created_at     timestamptz not null default now()
);

-- ---------- promotions ----------
create table if not exists discount_codes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  description  text not null default '',
  kind         text not null check (kind in ('percent','fixed')),
  value        numeric(10,2) not null check (value > 0),
  min_order    numeric(10,2) not null default 0,
  starts_at    timestamptz,
  expires_at   timestamptz,
  usage_limit  int,
  used_count   int not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text not null default '',
  percent_off  numeric(5,2) not null check (percent_off > 0 and percent_off < 100),
  category_id  uuid references categories(id) on delete cascade,  -- null = whole store
  announcement text not null default '',
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ---------- orders ----------
create sequence if not exists order_number_seq start 10001;

create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  number          text not null unique default ('FN-' || nextval('order_number_seq')),
  access_token    text not null default encode(gen_random_bytes(16),'hex'),
  customer_id     uuid references customers(id) on delete set null,
  email           text not null,
  name            text not null,
  phone           text not null,
  address_line1   text not null,
  address_line2   text not null default '',
  city            text not null,
  postcode        text not null,
  country         text not null,
  notes           text not null default '',
  shipping_method text not null,
  subtotal        numeric(10,2) not null,
  discount        numeric(10,2) not null default 0,
  shipping        numeric(10,2) not null default 0,
  total           numeric(10,2) not null,
  discount_code   text,
  status          text not null default 'pending'
                  check (status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method  text not null check (payment_method in ('cod','bank_transfer','card')),
  payment_status  text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  stock_deducted  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists orders_created on orders(created_at desc);
create index if not exists orders_status on orders(status);
create index if not exists orders_customer on orders(customer_id);

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  variant_id  uuid references product_variants(id) on delete set null,
  name        text not null,
  color       text not null,
  size        int  not null,
  qty         int  not null check (qty > 0),
  unit_price  numeric(10,2) not null,
  image_id    uuid
);
create index if not exists order_items_order on order_items(order_id);

create table if not exists order_events (
  id         bigserial primary key,
  order_id   uuid not null references orders(id) on delete cascade,
  kind       text not null,          -- status | payment | stock | note
  message    text not null,
  actor      text not null default 'system',
  created_at timestamptz not null default now()
);

-- ---------- content & settings ----------
create table if not exists site_content (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null default '',
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- Supabase exposes the public schema through its REST API. This app talks to the
-- database directly from the server, so lock the tables against the anon/authenticated
-- API roles when they exist.
do $$
declare t text;
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    for t in select tablename from pg_tables where schemaname = 'public' loop
      execute format('alter table public.%I enable row level security', t);
    end loop;
  end if;
end $$;
