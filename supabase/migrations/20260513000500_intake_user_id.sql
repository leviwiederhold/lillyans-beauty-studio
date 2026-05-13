alter table public.intake_forms
add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists intake_forms_user_id_idx on public.intake_forms (user_id);

drop policy if exists "intake forms users read own by user id" on public.intake_forms;
create policy "intake forms users read own by user id"
on public.intake_forms
for select
using (user_id = auth.uid());
