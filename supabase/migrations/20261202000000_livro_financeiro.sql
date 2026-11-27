-- Livro financeiro da UMP (substitui a planilha) e lista de sócios.
-- Só a diretoria lê e altera. Os dados da planilha são importados por scripts/importar-livro.py
-- (ficam fora do repositório, que é público).

create table public.socios (
  id text primary key check (id ~ '^UMP-[0-9]{3}$'),
  nome text not null check (char_length(trim(nome)) between 2 and 160),
  situacao text,
  nascimento date,
  created_at timestamptz not null default now()
);

alter table public.socios enable row level security;

create policy "sócio: admin lê" on public.socios
  for select to authenticated using ((select public.is_admin()));
create policy "sócio: admin cria" on public.socios
  for insert to authenticated with check ((select public.is_admin()));
create policy "sócio: admin altera" on public.socios
  for update to authenticated using ((select public.is_admin()));
create policy "sócio: admin exclui" on public.socios
  for delete to authenticated using ((select public.is_admin()));

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  detalhes text not null check (char_length(trim(detalhes)) between 1 and 300),
  -- Entrada = positivo, saída = negativo.
  valor numeric(12, 2) not null check (valor <> 0),
  categoria text not null default 'Sem categoria' check (char_length(trim(categoria)) between 1 and 60),
  forma text not null default 'Não informado' check (forma in ('Pix', 'Cartão', 'Dinheiro', 'Não informado')),
  origem text not null default 'Livro' check (origem in ('Livro', 'Relatório bancário', 'App')),
  socio_id text references public.socios (id) on delete set null,
  -- Preenchido quando o lançamento veio de um comprovante aprovado no app.
  pagamento_id uuid unique references public.pagamentos (id) on delete cascade,
  criado_por uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index lancamentos_data on public.lancamentos (data);

alter table public.lancamentos enable row level security;

create policy "lançamento: admin lê" on public.lancamentos
  for select to authenticated using ((select public.is_admin()));
create policy "lançamento: admin cria" on public.lancamentos
  for insert to authenticated with check ((select public.is_admin()));
create policy "lançamento: admin altera" on public.lancamentos
  for update to authenticated using ((select public.is_admin()));
create policy "lançamento: admin exclui" on public.lancamentos
  for delete to authenticated using ((select public.is_admin()));

-- Comprovante marcado como "pago" entra sozinho no livro; se voltar para análise ou for recusado, sai.
create or replace function public.lancar_pagamento_no_livro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
  v_cobranca record;
begin
  if new.status = 'pago' and (tg_op = 'INSERT' or old.status is distinct from 'pago') then
    select nome into v_nome from public.profiles where id = new.membro_id;
    select tipo, titulo, competencia into v_cobranca from public.cobrancas where id = new.cobranca_id;

    insert into public.lancamentos (data, detalhes, valor, categoria, forma, origem, socio_id, pagamento_id, criado_por)
    values (
      new.data_pagamento,
      coalesce(v_nome, 'Membro') || ' · ' || case
        when v_cobranca.tipo = 'mensalidade' then 'mensalidade ' || to_char(v_cobranca.competencia, 'MM/YYYY')
        else coalesce(v_cobranca.titulo, 'evento')
      end,
      new.valor,
      case when v_cobranca.tipo = 'mensalidade' then 'Anuidade' else 'Programação' end,
      'Pix',
      'App',
      (select s.id from public.socios s where lower(s.nome) = lower(v_nome) limit 1),
      new.id,
      new.revisado_por
    )
    on conflict (pagamento_id) do nothing;
  elsif tg_op = 'UPDATE' and old.status = 'pago' and new.status is distinct from 'pago' then
    delete from public.lancamentos where pagamento_id = new.id;
  end if;
  return new;
end;
$$;

create trigger pagamentos_livro
  after insert or update of status on public.pagamentos
  for each row execute function public.lancar_pagamento_no_livro();
