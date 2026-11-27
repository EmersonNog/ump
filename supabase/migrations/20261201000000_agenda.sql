-- Agenda da UMP: a diretoria cadastra programações em dias do calendário
-- e cada membro confirma se vai ou não.

create table public.agenda_eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(trim(titulo)) between 2 and 120),
  data date not null,
  hora time,
  local text check (local is null or char_length(local) <= 120),
  descricao text check (descricao is null or char_length(descricao) <= 1000),
  criado_por uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index agenda_eventos_data on public.agenda_eventos (data);

alter table public.agenda_eventos enable row level security;

create policy "agenda: membros leem" on public.agenda_eventos
  for select to authenticated using (true);

create policy "agenda: admin cria" on public.agenda_eventos
  for insert to authenticated with check ((select public.is_admin()));

create policy "agenda: admin altera" on public.agenda_eventos
  for update to authenticated using ((select public.is_admin()));

create policy "agenda: admin exclui" on public.agenda_eventos
  for delete to authenticated using ((select public.is_admin()));

-- Resposta de cada membro: vai (true) ou não vai (false). Sem linha = ainda não respondeu.
create table public.agenda_presencas (
  evento_id uuid not null references public.agenda_eventos (id) on delete cascade,
  membro_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  vai boolean not null,
  updated_at timestamptz not null default now(),
  primary key (evento_id, membro_id)
);

alter table public.agenda_presencas enable row level security;

-- Todos veem as respostas (para mostrar quantos vão); nomes só aparecem para quem pode ler os perfis (admin).
create policy "presença: membros leem" on public.agenda_presencas
  for select to authenticated using (true);

create policy "presença: membro responde por si" on public.agenda_presencas
  for insert to authenticated with check (membro_id = (select auth.uid()));

create policy "presença: membro muda a própria resposta" on public.agenda_presencas
  for update to authenticated
  using (membro_id = (select auth.uid()))
  with check (membro_id = (select auth.uid()));

create policy "presença: membro remove a própria resposta" on public.agenda_presencas
  for delete to authenticated using (membro_id = (select auth.uid()));
