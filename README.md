# UMP · Pagamentos

PWA da Mocidade Presbiteriana. Os membros informam mensalidades e pagamentos de eventos enviando o comprovante, e a diretoria confere cada envio e marca como **pago** ou **não pago**.

**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Supabase (Auth, Postgres com RLS, Storage) · Web Push (VAPID) · service worker próprio (`public/sw.js`).

Tudo cabe nos planos gratuitos: Supabase Free, Vercel Hobby e Web Push sem nenhum serviço pago.

## Funcionalidades

| Membro | Diretoria (admin) |
| --- | --- |
| Cadastro/login, recuperação de senha | Fila de comprovantes em análise, com contador |
| Total em aberto, chave PIX com botão "Copiar" | Conferir comprovante (imagem/PDF), marcar **Pago**, **Não pago** (com motivo) ou voltar para análise |
| Informar pagamento: foto/print/PDF (fotos são comprimidas no aparelho) | Criar eventos e gerar as 12 mensalidades do ano |
| Histórico com status e motivo de recusa; reenviar quando "não pago" | Situação de cada membro por cobrança (quem falta pagar) |
| Notificações quando o pagamento é conferido | Promover admins, desativar membros, configurar PIX |

- **O primeiro usuário cadastrado vira administrador automaticamente.**
- As mensalidades contam a partir do mês em que o membro se cadastrou.
- A segurança fica no banco (RLS): o membro só vê os próprios pagamentos e comprovantes e não consegue alterar status, cobranças, PIX nem o próprio papel.

## Rodar localmente

Requisitos: Node 20+ e Docker (para o Supabase local).

```bash
npm install
npm run db:iniciar          # sobe o Supabase local e aplica supabase/migrations
cp .env.example .env.local  # preencha com as chaves exibidas pelo comando acima
npx web-push generate-vapid-keys   # cole as chaves VAPID no .env.local
npm run dev
```

Abra http://localhost:3000 e cadastre-se: você será o admin.

> O service worker roda também em `npm run dev`, mas o cache offline só funciona em produção (`npm run build && npm start`).
> Para testar notificações no celular é preciso HTTPS. Use o deploy ou `next dev --experimental-https`.

## Deploy (gratuito)

1. **Supabase:** crie um projeto em [supabase.com](https://supabase.com) e aplique o banco:
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```
2. Em **Authentication → URL Configuration**, defina o *Site URL* com o domínio do app e adicione `https://SEU-DOMINIO/auth/callback` em *Redirect URLs*.
3. **Vercel:** importe o repositório e configure as variáveis do `.env.example`: URL e chaves do Supabase (*Project Settings → API Keys*), as chaves VAPID e o `CRON_SECRET` (um texto longo e aleatório).
4. Acesse o site e cadastre a primeira conta, que será a do admin.

> **Projeto sempre ativo:** o Supabase Free pausa projetos com 7 dias de pouco uso. O `vercel.json` agenda o Vercel Cron (gratuito) para chamar `/api/manter-ativo` uma vez por dia. Essa rota faz uma consulta ao banco e só responde a quem envia o `CRON_SECRET`. Para conferir, veja em *Vercel → Settings → Cron Jobs*.

> O e-mail gratuito do Supabase tem limite baixo de envios por hora (confirmação de cadastro e recuperação de senha). Para uma mocidade costuma bastar. Se precisar de mais, configure um SMTP gratuito (por exemplo, Brevo ou Resend) em *Authentication → SMTP*.

## Instalação e notificações

- **Android / Chrome / Edge:** botão "Instalar" no app, ou menu do navegador → *Instalar app*.
- **iPhone (iOS 16.4+):** Safari → Compartilhar → *Adicionar à Tela de Início*. No iPhone, as notificações só funcionam com o app instalado.
- Para ativar, cada pessoa liga a chave em **Perfil → Notificações**.

Quem recebe notificação:

| Evento | Quem recebe |
| --- | --- |
| Membro envia comprovante | Admins |
| Admin marca pago / não pago | O membro |
| Nova cobrança criada (opcional) | Todos os membros ativos |

## Estrutura

```
supabase/migrations/      tabelas, RLS, gatilhos, bucket "comprovantes"
public/sw.js              service worker (offline + push)
scripts/gerar-icones.mjs  gera os ícones do PWA (npm run icones)
src/proxy.ts              sessão Supabase + proteção de rotas
src/lib/                  clientes Supabase, push, formatação, regras de cobrança
src/app/(auth)/           entrar, cadastrar, recuperar e nova senha
src/app/(app)/            início, pagar, histórico, perfil
src/app/(app)/admin/      comprovantes, cobranças, membros, PIX
```

Depois de alterar o banco, crie uma nova migration em `supabase/migrations/` e rode `npm run db:tipos`.
