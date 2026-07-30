-- CRM tasks and reminders.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references public.restaurants (id) on delete cascade,
  assigned_to uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  title text not null,
  description text,
  task_type text not null default 'custom'
    check (task_type in ('call', 'whatsapp', 'email', 'visit', 'send_offer', 'follow_up', 'custom')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  due_at timestamptz,
  completed_at timestamptz,
  completed_by uuid references public.profiles (id),
  related_offer_id uuid references public.offers (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_assigned_to_idx on public.tasks (assigned_to);
create index if not exists tasks_due_at_idx on public.tasks (due_at);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_restaurant_idx on public.tasks (restaurant_id);

alter table public.tasks enable row level security;

drop policy if exists "Authenticated users can read tasks" on public.tasks;
create policy "Authenticated users can read tasks"
  on public.tasks for select
  to authenticated
  using (auth.uid() is not null);

drop policy if exists "Authenticated users can create tasks" on public.tasks;
create policy "Authenticated users can create tasks"
  on public.tasks for insert
  to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update tasks" on public.tasks;
create policy "Authenticated users can update tasks"
  on public.tasks for update
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Admins can delete tasks" on public.tasks;
create policy "Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (public.is_sales_admin());
