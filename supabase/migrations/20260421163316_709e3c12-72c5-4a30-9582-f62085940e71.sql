-- =========================================================
-- Shared updated_at trigger
-- =========================================================
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- profiles
-- =========================================================
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text,
  bio text,
  avatar_url text,
  tip_wallet text not null,
  socials jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,30}$'),
  constraint tip_wallet_format check (tip_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  constraint bio_length check (char_length(bio) <= 300),
  constraint display_name_length check (char_length(display_name) <= 60)
);

create index profiles_username_idx on public.profiles (username);
create index profiles_tip_wallet_idx on public.profiles (lower(tip_wallet));

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  using (auth.uid() = user_id);

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at_column();

-- =========================================================
-- auth_nonces  (SIWE wallet sign-in)
-- =========================================================
create table public.auth_nonces (
  nonce text primary key,
  wallet_address text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index auth_nonces_wallet_idx on public.auth_nonces (lower(wallet_address));
create index auth_nonces_expires_idx on public.auth_nonces (expires_at);

alter table public.auth_nonces enable row level security;
-- No policies => only service role (edge functions) can read/write.

-- =========================================================
-- receipts
-- =========================================================
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  recipient_profile_id uuid references public.profiles(id) on delete set null,
  recipient_wallet text not null,
  sender_wallet text not null,
  sender_user_id uuid references auth.users(id) on delete set null,
  token_symbol text not null,
  token_address text not null,
  amount text not null,
  message text,
  tx_hash text not null unique,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint recipient_wallet_format check (recipient_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  constraint sender_wallet_format check (sender_wallet ~ '^0x[a-fA-F0-9]{40}$'),
  constraint tx_hash_format check (tx_hash ~ '^0x[a-fA-F0-9]{64}$'),
  constraint message_length check (char_length(message) <= 140)
);

create index receipts_recipient_profile_idx on public.receipts (recipient_profile_id, created_at desc);
create index receipts_sender_wallet_idx on public.receipts (lower(sender_wallet), created_at desc);
create index receipts_tx_hash_idx on public.receipts (tx_hash);

alter table public.receipts enable row level security;

-- Public can view non-hidden receipts.
create policy "Public receipts are viewable by everyone"
  on public.receipts for select
  using (hidden = false);

-- Sender (if signed in) can always view their own receipts, even hidden ones.
create policy "Senders can view their own receipts"
  on public.receipts for select
  using (auth.uid() = sender_user_id);

-- Anyone (signed-in or not) can insert a receipt after sending a tip.
-- We constrain sender_user_id to match the caller when present.
create policy "Anyone can log a receipt"
  on public.receipts for insert
  with check (
    sender_user_id is null
    or sender_user_id = auth.uid()
  );

-- Only the sender (when signed in) can toggle hidden.
create policy "Senders can update their own receipts"
  on public.receipts for update
  using (auth.uid() = sender_user_id)
  with check (auth.uid() = sender_user_id);