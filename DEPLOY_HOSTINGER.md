# Deploy do MerxTax na Hostinger

Este projeto já está preparado para usar o fluxo padrão de **Node.js App** da Hostinger conectado ao GitHub.

## Configuração recomendada

| Campo | Valor |
|---|---|
| Tipo | Node.js App |
| Repositório | `Lirolla/merxtax` |
| Branch | `main` |
| Install command | `npm install` |
| Build command | `npm run build` |
| Start command | `npm run start` |
| Node.js | `22.x` |
| Output directory | deixar em branco para Next.js detectado automaticamente |
| Entry file | deixar em branco para Next.js detectado automaticamente |

## Variáveis obrigatórias antes do primeiro deploy

Você deve preencher no painel da Hostinger, no mínimo, estas variáveis:

| Variável | Obrigatória para subir? | Observação |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Sim | URL final do domínio |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave server-side do Supabase |
| `STRIPE_SECRET_KEY` | Recomendado | Necessária para checkout |
| `STRIPE_WEBHOOK_SECRET` | Depois | Necessária quando o webhook do Stripe for ativado |
| `HMRC_BASE_URL` | Se HMRC for ativado | Sandbox: `https://test-api.service.hmrc.gov.uk` |
| `HMRC_CLIENT_ID` | Se HMRC for ativado | Credencial do HMRC |
| `HMRC_CLIENT_SECRET` | Se HMRC for ativado | Credencial do HMRC |
| `HMRC_REDIRECT_URI` | Se HMRC for ativado | Ex.: `https://seu-dominio.com/auth/callback` |
| `HMRC_SANDBOX` | Se HMRC for ativado | `true` para teste |

## Ordem prática

Primeiro conecte o GitHub e configure as variáveis essenciais de **Supabase** e `NEXT_PUBLIC_APP_URL`. Depois faça o primeiro deploy. Em seguida, valide login e dashboard. Só depois ative Stripe webhook e HMRC em produção.
