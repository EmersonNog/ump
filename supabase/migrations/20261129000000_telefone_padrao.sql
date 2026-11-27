-- Celular sempre no padrão "xx xxxxx-xxxx" (DDD + 9 dígitos).
-- Normaliza o que já existe e passa a exigir o formato no banco.

with numeros as (
  select id, regexp_replace(telefone, '\D', '', 'g') as n
  from public.profiles
  where telefone is not null
),
normalizados as (
  select
    id,
    case
      when length(n) = 13 and n like '55%' then substr(n, 3)
      when length(n) = 11 then n
      -- Número antigo de celular sem o nono dígito (ex.: 86 9985-3576): acrescenta o 9.
      when length(n) = 10 and substr(n, 3, 1) in ('6', '7', '8', '9') then substr(n, 1, 2) || '9' || substr(n, 3)
      else null
    end as n
  from numeros
)
update public.profiles p
set telefone = case
  when z.n is null then null
  else substr(z.n, 1, 2) || ' ' || substr(z.n, 3, 5) || '-' || substr(z.n, 8, 4)
end
from normalizados z
where p.id = z.id;

alter table public.profiles drop constraint if exists profiles_telefone_check;
alter table public.profiles
  add constraint profiles_telefone_formato
  check (telefone is null or telefone ~ '^[0-9]{2} [0-9]{5}-[0-9]{4}$');
