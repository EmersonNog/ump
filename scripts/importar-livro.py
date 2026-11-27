"""
Importa o livro financeiro usado antes do app (planilha + painel HTML) para as tabelas
`socios` e `lancamentos`. Gera SQL no stdout; os dados não ficam no repositório (que é público).

Uso:
  python scripts/importar-livro.py "Ump_Livro_Financeiro.xlsx" "painel-financeiro-ump.html" > livro.sql
  psql "<url do banco>" -f livro.sql

- Sócios vêm da aba "Sócios" da planilha (ID, nome, situação, nascimento).
- Lançamentos vêm do painel HTML, que já traz as categorias padronizadas e a origem
  (Livro / Relatório bancário) que a planilha não tem. A planilha é usada para conferir valores e datas.
- Recusa importar de novo se o livro já tiver lançamentos que não vieram do app.
"""
import json
import sys
from datetime import date, datetime

import openpyxl


def sql(valor):
    if valor is None or valor == "":
        return "null"
    if isinstance(valor, (int, float)):
        return repr(round(float(valor), 2))
    if isinstance(valor, (date, datetime)):
        return f"'{valor:%Y-%m-%d}'"
    return "'" + str(valor).replace("'", "''") + "'"


def main(caminho_planilha, caminho_html):
    planilha = openpyxl.load_workbook(caminho_planilha, data_only=True)

    socios = [linha for linha in planilha["Sócios"].iter_rows(min_row=2, values_only=True) if linha[0]]
    ids_socios = {linha[0] for linha in socios}

    html = open(caminho_html, encoding="utf-8").read()
    inicio = html.index("const D=") + len("const D=")
    lancamentos, _ = json.JSONDecoder().raw_decode(html[inicio:])

    # Conferência com a planilha: mesma quantidade, datas e valores na mesma ordem.
    livro = [linha for linha in planilha["Livro Financeiro"].iter_rows(min_row=2, values_only=True) if linha[0]]
    if len(livro) != len(lancamentos):
        sys.exit(f"Planilha tem {len(livro)} lançamentos e o painel {len(lancamentos)}.")
    for n, (l, d) in enumerate(zip(livro, lancamentos), start=2):
        if l[0].strftime("%Y-%m-%d") != d[0] or abs(float(l[2]) - d[2]) > 0.001:
            sys.exit(f"Linha {n} diferente entre planilha e painel: {l[:3]} x {d[:3]}")

    print("begin;")
    print(
        "do $$ begin if exists (select 1 from public.lancamentos where pagamento_id is null) "
        "then raise exception 'O livro já tem lançamentos; importação cancelada.'; end if; end $$;"
    )
    for id_, nome, situacao, nascimento, *_ in socios:
        print(
            "insert into public.socios (id, nome, situacao, nascimento) values "
            f"({sql(id_)}, {sql(nome.strip())}, {sql(situacao)}, {sql(nascimento)}) "
            "on conflict (id) do update set nome = excluded.nome, situacao = excluded.situacao, nascimento = excluded.nascimento;"
        )
    for data_, detalhes, valor, categoria, forma, origem, socio in lancamentos:
        if not valor:
            continue
        print(
            "insert into public.lancamentos (data, detalhes, valor, categoria, forma, origem, socio_id, criado_por) values "
            f"({sql(data_)}, {sql(detalhes.strip() or 'Sem detalhes')}, {sql(valor)}, {sql(categoria or 'Sem categoria')}, "
            f"{sql(forma or 'Não informado')}, {sql(origem or 'Livro')}, {sql(socio if socio in ids_socios else None)}, null);"
        )
    print("commit;")
    print(f"-- {len(socios)} sócios, {len(lancamentos)} lançamentos", file=sys.stderr)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
