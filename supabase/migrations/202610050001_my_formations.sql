-- v1.8.0 マイ編成・Qookka所持情報同期
-- 私有データはブラウザから直接読ませず、Edge Function経由だけで扱う。

create table if not exists public.user_private_owner_links (
  auth_user_id uuid primary key,
  owner_key text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.user_owned_generals (
  owner_key text not null,
  qookka_id text not null,
  name text not null,
  inherent_tactic_name text not null default '',
  dupe_count smallint not null default 0 check (dupe_count between 0 and 5),
  qookka_level smallint,
  is_owned boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_key, qookka_id)
);

create table if not exists public.user_owned_tactics (
  owner_key text not null,
  qookka_id text not null,
  name text not null,
  is_owned boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_key, qookka_id)
);

create table if not exists public.user_inventory_imports (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  snapshot_id text not null,
  general_count integer not null default 0,
  tactic_count integer not null default 0,
  added_generals jsonb not null default '[]'::jsonb,
  removed_generals jsonb not null default '[]'::jsonb,
  added_tactics jsonb not null default '[]'::jsonb,
  removed_tactics jsonb not null default '[]'::jsonb,
  imported_at timestamptz not null default now()
);

create index if not exists user_inventory_imports_owner_idx
  on public.user_inventory_imports(owner_key, imported_at desc);

create table if not exists public.user_formations (
  id uuid primary key default gen_random_uuid(),
  owner_key text not null,
  name text not null,
  troop_type text not null default '',
  troop_level smallint check (troop_level is null or troop_level between 1 and 10),
  note text not null default '',
  is_shared boolean not null default false,
  share_token text unique,
  shared_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_formations_owner_idx
  on public.user_formations(owner_key, updated_at desc);
create index if not exists user_formations_share_idx
  on public.user_formations(share_token)
  where is_shared = true and share_token is not null;

create table if not exists public.user_formation_members (
  id uuid primary key default gen_random_uuid(),
  formation_id uuid not null references public.user_formations(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  general_qookka_id text not null default '',
  general_name text not null default '',
  tactic_1_qookka_id text not null default '',
  tactic_1_name text not null default '',
  tactic_2_qookka_id text not null default '',
  tactic_2_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (formation_id, slot)
);

-- Publishable keyからの直接アクセスを防ぐ。Edge Functionのservice roleはRLSを迂回する。
alter table public.user_private_owner_links enable row level security;
alter table public.user_owned_generals enable row level security;
alter table public.user_owned_tactics enable row level security;
alter table public.user_inventory_imports enable row level security;
alter table public.user_formations enable row level security;
alter table public.user_formation_members enable row level security;
