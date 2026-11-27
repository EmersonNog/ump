"""
Importa o livro financeiro da planilha da tesouraria para as tabelas `socios` e `lancamentos`.
Gera SQL no stdout; os dados não ficam no repositório (que é público).

Uso:
  python scripts/importar-livro.py "Ump_Livro_Financeiro.xlsx" > livro.sql
  python scripts/importar-livro.py "Ump_Livro_Financeiro.xlsx" --substituir > livro.sql   # troca a base atual
  psql "<url do banco>" -v ON_ERROR_STOP=1 -f livro.sql

- Aba "Sócios": ID, nome, situação, nascimento (atualiza quem já existe).
- Aba "Livro Financeiro": data, detalhes, valor (+ entrada / − saída), categoria, forma, ID do sócio.
  Categorias têm só a primeira letra padronizada ("invest" → "Invest"); "??" ou vazio vira "Sem categoria".
- Sem --substituir, recusa importar se o livro já tiver lançamentos que não vieram do app.
  Com --substituir, apaga esses lançamentos e grava os da planilha. Os lançamentos do app (comprovantes
  aprovados) são mantidos.
"""
import sys
from datetime import date, datetime

import openpyxl

FORMAS = {"pix": "Pix", "cartão": "Cartão", "cartao": "Cartão", "dinheiro": "Dinheiro"}


def sql(valor):
    if valor is None or valor == "":
        return "null"
    if isinstance(valor, (int, float)):
        return repr(round(float(valor), 2))
    if isinstance(valor, (date, datetime)):
        return f"'{valor:%Y-%m-%d}'"
    return "'" + str(valor).replace("'", "''") + "'"


def categoria(valor):
    texto = str(valor or "").strip()
    if not texto or set(texto) <= {"?"}:
        return "Sem categoria"
    return texto[0].upper() + texto[1:]


def main(caminho, substituir):
    planilha = openpyxl.load_workbook(caminho, data_only=True)
    socios = [linha for linha in planilha["Sócios"].iter_rows(min_row=2, values_only=True) if linha[0]]
    ids_socios = {linha[0] for linha in socios}
    livro = [linha for linha in planilha["Livro Financeiro"].iter_rows(min_row=2, values_only=True) if linha[0]]

    print("begin;")
    if substituir:
        print("delete from public.lancamentos where pagamento_id is null;")
    else:
        print(
            "do $$ begin if exists (select 1 from public.lancamentos where pagamento_id is null) "
            "then raise exception 'O livro já tem lançamentos; use --substituir para trocar.'; end if; end $$;"
        )
    for id_, nome, situacao, nascimento, *_ in socios:
        print(
            "insert into public.socios (id, nome, situacao, nascimento) values "
            f"({sql(id_)}, {sql(nome.strip())}, {sql(situacao)}, {sql(nascimento)}) "
            "on conflict (id) do update set nome = excluded.nome, situacao = excluded.situacao, nascimento = excluded.nascimento;"
        )
    gravados = 0
    for n, (data_, detalhes, valor, _tipo, cat, forma, socio, *_) in enumerate(livro, start=2):
        if not isinstance(data_, (date, datetime)):
            sys.exit(f"Linha {n}: data inválida ({data_!r}).")
        if not valor:
            continue
        print(
            "insert into public.lancamentos (data, detalhes, valor, categoria, forma, origem, socio_id, criado_por) values "
            f"({sql(data_)}, {sql(str(detalhes or '').strip() or 'Sem detalhes')}, {sql(valor)}, {sql(categoria(cat))}, "
            f"{sql(FORMAS.get(str(forma or '').strip().lower(), 'Não informado'))}, 'Livro', "
            f"{sql(socio if socio in ids_socios else None)}, null);"
        )
        gravados += 1
    print("commit;")
    print(f"-- {len(socios)} sócios, {gravados} lançamentos, saldo {sum(float(l[2] or 0) for l in livro):.2f}", file=sys.stderr)


if __name__ == "__main__":
    argumentos = [a for a in sys.argv[1:] if a != "--substituir"]
    if len(argumentos) != 1:
        sys.exit(__doc__)
    main(argumentos[0], "--substituir" in sys.argv[1:])
