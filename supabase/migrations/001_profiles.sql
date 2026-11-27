-- L&A: perfil básico vinculado à autenticação do Supabase.
-- Execute no SQL Editor do projeto antes de testar cadastro/login.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  marketing_opt_in boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Usuário pode visualizar o próprio perfil" on public.profiles;
create policy "Usuário pode visualizar o próprio perfil"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Usuário pode atualizar o próprio perfil" on public.profiles;
create policy "Usuário pode atualizar o próprio perfil"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, marketing_opt_in) on public.profiles to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opted_in boolean;
begin
  opted_in := case
    when new.raw_user_meta_data ->> 'marketing_opt_in' = 'true' then true
    else false
  end;

  insert into public.profiles (id, full_name, marketing_opt_in, marketing_consent_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    opted_in,
    case when opted_in then now() else null end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_profile_updated_at();
