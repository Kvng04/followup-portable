create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  opportunity text not null,
  value numeric(12,2) not null default 0,
  status text not null default 'New',
  follow_up date not null,
  notes text not null default '',
  source text not null default 'Other',
  created_at timestamptz not null default now(),

  constraint leads_status_check
    check (status in (
      'New',
      'Contacted',
      'Interested',
      'Proposal',
      'Negotiation',
      'Won',
      'Lost'
    )),

  constraint leads_source_check
    check (source in (
      'WhatsApp',
      'Instagram',
      'Referral',
      'Website',
      'Other'
    )),

  constraint leads_value_check
    check (value >= 0)
);

create index leads_user_id_idx
  on public.leads(user_id);

create index leads_follow_up_idx
  on public.leads(follow_up);

alter table public.leads enable row level security;

create policy "Users can view their own leads"
  on public.leads
  for select
  using (auth.uid() = user_id);

create policy "Users can create their own leads"
  on public.leads
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own leads"
  on public.leads
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own leads"
  on public.leads
  for delete
  using (auth.uid() = user_id);