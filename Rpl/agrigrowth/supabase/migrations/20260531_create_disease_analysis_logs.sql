create table if not exists public.disease_analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracker_id uuid not null references public.trackers(id) on delete cascade,
  plant_type text not null,
  image_name text,
  image_mime_type text,
  status text not null,
  diagnosis text not null,
  severity text not null,
  urgency text not null,
  detected_as text,
  gejala jsonb not null default '[]'::jsonb,
  penyebab text,
  solusi jsonb not null default '[]'::jsonb,
  pencegahan jsonb not null default '[]'::jsonb,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists disease_analysis_logs_tracker_id_idx
  on public.disease_analysis_logs (tracker_id, created_at desc);

create index if not exists disease_analysis_logs_user_id_idx
  on public.disease_analysis_logs (user_id, created_at desc);

alter table public.disease_analysis_logs enable row level security;

create policy "Disease analysis select own rows"
  on public.disease_analysis_logs
  for select
  using (auth.uid() = user_id);

create policy "Disease analysis insert own rows"
  on public.disease_analysis_logs
  for insert
  with check (auth.uid() = user_id);

create policy "Disease analysis update own rows"
  on public.disease_analysis_logs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Disease analysis delete own rows"
  on public.disease_analysis_logs
  for delete
  using (auth.uid() = user_id);
