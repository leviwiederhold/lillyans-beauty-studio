-- Link client_forms to the client/profile record and track completion + timestamps.
-- All additive + idempotent so it is safe to run against an existing table.

alter table public.client_forms
  add column if not exists client_id        uuid references public.clients(id) on delete set null,
  add column if not exists status           text not null default 'completed',
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists updated_at       timestamptz not null default now();

create index if not exists client_forms_client_id_idx on public.client_forms(client_id);

-- Keep updated_at fresh on edits (e.g. when an admin marks a form reviewed).
drop trigger if exists touch_client_forms_updated_at on public.client_forms;
create trigger touch_client_forms_updated_at
  before update on public.client_forms
  for each row execute function public.touch_updated_at();
