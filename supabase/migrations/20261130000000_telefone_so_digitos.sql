-- Celular salvo só com os 11 dígitos (DDD + número). A máscara "(xx) xxxxx-xxxx" fica na tela.

alter table public.profiles drop constraint if exists profiles_telefone_formato;

update public.profiles
set telefone = regexp_replace(telefone, '\D', '', 'g')
where telefone is not null;

alter table public.profiles
  add constraint profiles_telefone_formato
  check (telefone is null or telefone ~ '^[0-9]{11}$');
