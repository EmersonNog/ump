-- UMP · Controle de pagamentos (mensalidades e eventos)
-- Tabelas, RLS, gatilhos e bucket de comprovantes.

-- ───────────────────────── Tipos ─────────────────────────
create type public.papel as enum ('membro', 'admin');
create type public.cobranca_tipo as enum ('mensalidade', 'evento');
create type public.pagamento_status as enum ('em_analise', 'pago', 'nao_pago');

-- ───────────────────────── Perfis ─────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 2 and 120),
  email text not null,
  telefone text check (telefone is null or char_length(telefone) <= 30),
  papel public.papel not null default 'membro',
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- Cria o perfil ao cadastrar. O primeiro usuário do sistema vira admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome, email, telefone, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'telefone'), ''),
    case when exists (select 1 from public.profiles where papel = 'admin')
         then 'membro'::public.papel else 'admin'::public.papel end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Só admin altera papel/ativo; e-mail vem do Auth; nunca deixa o sistema sem admin.
create or replace function public.proteger_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.papel is distinct from old.papel or new.ativo is distinct from old.ativo)
     and auth.uid() is not null and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar papel ou situação.';
  end if;

  if auth.uid() is not null then
    new.email := old.email;
  end if;

  if old.papel = 'admin' and new.papel <> 'admin'
     and (select count(*) from public.profiles where papel = 'admin') <= 1 then
    raise exception 'O sistema precisa de pelo menos um administrador.';
  end if;

  return new;
end;
$$;

create trigger proteger_perfil
  before update on public.profiles
  for each row execute function public.proteger_perfil();

alter table public.profiles enable row level security;

create policy "perfil: ler o próprio ou admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "perfil: editar o próprio ou admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- ───────────────────────── Cobranças ─────────────────────────
create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  tipo public.cobranca_tipo not null,
  titulo text not null check (char_length(trim(titulo)) between 2 and 120),
  descricao text check (descricao is null or char_length(descricao) <= 1000),
  valor numeric(10, 2) not null check (valor > 0),
  -- Mensalidade: primeiro dia do mês de referência. Evento: nulo.
  competencia date check (
    (tipo = 'mensalidade' and competencia is not null and extract(day from competencia) = 1)
    or (tipo = 'evento' and competencia is null)
  ),
  vencimento date,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index cobrancas_mensalidade_unica
  on public.cobrancas (competencia) where tipo = 'mensalidade';

alter table public.cobrancas enable row level security;

create policy "cobrança: membros leem" on public.cobrancas
  for select to authenticated using (true);

create policy "cobrança: admin cria" on public.cobrancas
  for insert to authenticated with check ((select public.is_admin()));

create policy "cobrança: admin altera" on public.cobrancas
  for update to authenticated using ((select public.is_admin()));

create policy "cobrança: admin exclui" on public.cobrancas
  for delete to authenticated using ((select public.is_admin()));

-- ───────────────────────── Pagamentos ─────────────────────────
create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  cobranca_id uuid not null references public.cobrancas (id) on delete cascade,
  membro_id uuid not null references public.profiles (id) on delete cascade,
  valor numeric(10, 2) not null check (valor > 0),
  data_pagamento date not null,
  comprovante_path text not null,
  observacao text check (observacao is null or char_length(observacao) <= 500),
  status public.pagamento_status not null default 'em_analise',
  motivo text check (motivo is null or char_length(motivo) <= 500),
  revisado_por uuid references public.profiles (id) on delete set null,
  revisado_em timestamptz,
  created_at timestamptz not null default now()
);

-- Um envio válido (em análise ou pago) por membro e cobrança;
-- se recusado ("não pago"), o membro pode reenviar.
create unique index pagamentos_um_ativo_por_cobranca
  on public.pagamentos (cobranca_id, membro_id) where status <> 'nao_pago';

create index pagamentos_status_idx on public.pagamentos (status, created_at desc);
create index pagamentos_membro_idx on public.pagamentos (membro_id, created_at desc);

create or replace function public.registrar_revisao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.revisado_por := auth.uid();
    new.revisado_em := case when new.status = 'em_analise' then null else now() end;
    if new.status = 'em_analise' then
      new.revisado_por := null;
    end if;
  end if;
  return new;
end;
$$;

create trigger registrar_revisao
  before update on public.pagamentos
  for each row execute function public.registrar_revisao();

alter table public.pagamentos enable row level security;

create policy "pagamento: ler os próprios ou admin" on public.pagamentos
  for select to authenticated
  using (membro_id = (select auth.uid()) or (select public.is_admin()));

create policy "pagamento: membro envia" on public.pagamentos
  for insert to authenticated
  with check (
    membro_id = (select auth.uid())
    and status = 'em_analise'
    and motivo is null
    and revisado_por is null
    and revisado_em is null
    and split_part(comprovante_path, '/', 1) = (select auth.uid())::text
  );

create policy "pagamento: admin revisa" on public.pagamentos
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "pagamento: membro cancela enquanto em análise" on public.pagamentos
  for delete to authenticated
  using (
    (membro_id = (select auth.uid()) and status = 'em_analise')
    or (select public.is_admin())
  );

-- ───────────────────────── Configurações (PIX) ─────────────────────────
create table public.configuracoes (
  id smallint primary key default 1 check (id = 1),
  chave_pix text,
  favorecido text,
  instrucoes text check (instrucoes is null or char_length(instrucoes) <= 1000),
  updated_at timestamptz not null default now()
);

insert into public.configuracoes (id) values (1);

alter table public.configuracoes enable row level security;

create policy "config: membros leem" on public.configuracoes
  for select to authenticated using (true);

create policy "config: admin altera" on public.configuracoes
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ───────────────────────── Notificações push ─────────────────────────
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push: dono gerencia" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ───────────────────────── Storage: comprovantes ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes', 'comprovantes', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
);

create policy "comprovante: membro envia na própria pasta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'comprovantes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "comprovante: dono ou admin lê" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'comprovantes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );

create policy "comprovante: dono ou admin exclui" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'comprovantes'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin()))
  );
