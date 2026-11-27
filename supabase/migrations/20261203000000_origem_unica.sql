-- Livro e relatório bancário passam a ser uma só origem ("Livro"), a pedido da tesouraria.
-- "App" continua separado: são os lançamentos automáticos de comprovantes aprovados.

update public.lancamentos set origem = 'Livro' where origem = 'Relatório bancário';

alter table public.lancamentos drop constraint if exists lancamentos_origem_check;
alter table public.lancamentos add constraint lancamentos_origem_check check (origem in ('Livro', 'App'));
