-- Execute uma vez no Editor SQL do Supabase para armazenar endereços.
alter table public.profiles
  add column if not exists postal_code text not null default '',
  add column if not exists state text not null default '',
  add column if not exists street text not null default '',
  add column if not exists street_number text not null default '',
  add column if not exists complement text not null default '',
  add column if not exists neighborhood text not null default '',
  add column if not exists city text not null default '';
grant update (full_name, marketing_opt_in, postal_code, state, street, street_number, complement, neighborhood, city)
  on public.profiles to authenticated;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare opted_in boolean;
begin
  opted_in := coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false') = 'true';
  insert into public.profiles (id, full_name, marketing_opt_in, marketing_consent_at, postal_code, state, street, street_number, complement, neighborhood, city)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), opted_in,
    case when opted_in then now() else null end,
    coalesce(new.raw_user_meta_data ->> 'postal_code', ''),
    coalesce(new.raw_user_meta_data ->> 'state', ''),
    coalesce(new.raw_user_meta_data ->> 'street', ''),
    coalesce(new.raw_user_meta_data ->> 'street_number', ''),
    coalesce(new.raw_user_meta_data ->> 'complement', ''),
    coalesce(new.raw_user_meta_data ->> 'neighborhood', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''));
  return new;
end;
$$;