-- Push notifications support

create table if not exists push_subscriptions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'admin',
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

create policy "Users manage own subscriptions"
  on push_subscriptions
  using (user_id = auth.uid());

create table if not exists notifications (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'admin',
  title text not null,
  body text,
  data jsonb,
  url text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users update own notifications"
  on notifications for update
  using (user_id = auth.uid());

-- Enable realtime for notification delivery
alter publication supabase_realtime add table notifications;

-- Enable realtime for business events
alter table leads replica identity full;
alter table clients replica identity full;
alter table projects replica identity full;
alter table tasks replica identity full;
alter table meetings replica identity full;
alter table business_payments replica identity full;

-- Ensure tables are in the realtime publication
do $$
begin
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'leads';
  if not found then
    alter publication supabase_realtime add table leads;
  end if;
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'clients';
  if not found then
    alter publication supabase_realtime add table clients;
  end if;
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'projects';
  if not found then
    alter publication supabase_realtime add table projects;
  end if;
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tasks';
  if not found then
    alter publication supabase_realtime add table tasks;
  end if;
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'meetings';
  if not found then
    alter publication supabase_realtime add table meetings;
  end if;
  perform * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'business_payments';
  if not found then
    alter publication supabase_realtime add table business_payments;
  end if;
end
$$;
