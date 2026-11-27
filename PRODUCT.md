# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Membros da UMP Jóquei** (Mocidade Presbiteriana da IP Jóquei, aprox. 15–35 anos). Abrem o app no celular (site responsivo ou PWA instalado) e também no navegador do computador para: ver o que devem, pagar via Pix, enviar o comprovante e consultar o histórico.
- **Diretoria / tesouraria** (administradores). Mesmos aparelhos e contextos. Conferem comprovantes, marcam "pago" ou "não pago" com motivo, criam cobranças (eventos e mensalidades do ano) e acompanham quem está em dia.

## Product Purpose

Substituir o fluxo atual de comprovantes soltos no grupo do WhatsApp + planilha. Sucesso: nenhum membro precisa mandar comprovante no grupo, e a diretoria sabe quem pagou o quê sem caçar mensagens.

## Positioning

Ferramenta interna e própria da UMP Jóquei: cobranças da mocidade, Pix fixo da UMP com o valor de cada cobrança já preenchido, comprovante anexado à cobrança certa e conferência pela diretoria no mesmo lugar.

## Operating Context

- Pagamento sempre por Pix para uma conta fixa da UMP (código copia e cola definido em `src/lib/pix.ts`).
- Mensalidades mensais (geradas por ano) e eventos avulsos (ex.: acampamento). Mensalidades contam a partir do mês de cadastro do membro.
- Fluxo do comprovante: membro envia → "em análise" → diretoria marca "pago" ou "não pago" (motivo obrigatório; membro pode reenviar).
- Notificações push (gratuitas) avisam a diretoria de novos comprovantes e o membro quando o pagamento é conferido.
- Uso frequentemente rápido e no celular; também no desktop. Tema claro e escuro (escolha do usuário ou automático).

## Capabilities and Constraints

- Next.js (App Router) + Supabase (Auth, Postgres com RLS, Storage) + Web Push; hospedado na Vercel; PWA instalável.
- Tudo deve permanecer em planos gratuitos.
- Idioma: português do Brasil.
- Termos do produto: mensalidade, evento, cobrança, comprovante, em aberto, em análise, pago, não pago, diretoria.

## Brand Commitments

- Nome: **UMP Jóquei**. A identidade é obrigatória e o app deve ser reconhecível como da UMP Jóquei.
- **Emblema oficial da União de Mocidade Presbiteriana** (tocha vermelha + estrela azul com "UMP") é obrigatório no app (pedido do usuário). Original: `scripts/marca/ump-logo-original.png`; versões sem fundo em `public/marca/` (clara e escura, com o azul trocado por branco).
- Marca em anel com o texto "ump·jóquei·ump·jóquei·" (asset: `public/icons/anel.svg`, gerado por `scripts/gerar-icones.mjs`).
- Cores dos cartazes oficiais: laranja `#FF6600` e azul royal `#0027CA`, com branco.
- Referências fornecidas pela UMP: cartazes de eventos (Thanksgiving, Estudo Liderança, Day Camp, UMP Move, Roda Viva).
- Pedido explícito do usuário: interface leve (sem laranja gritante em grandes áreas) e sem "cara de IA".

## Evidence on Hand

- Sem depoimentos, números de uso ou métricas. Não inventar.

## Product Principles

1. O membro resolve o pagamento em poucos toques: ver o que deve, copiar o Pix, anexar o comprovante.
2. A diretoria vê a situação de todos sem precisar abrir o WhatsApp.
3. Clareza de estado: cada cobrança mostra sem ambiguidade se está em aberto, em análise, paga ou recusada (e por quê).
4. Funciona igual no celular, no PWA e no navegador do computador.
