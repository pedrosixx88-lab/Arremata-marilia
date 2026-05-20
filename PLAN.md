# PLAN — ArremataMarília — Milestones de Desenvolvimento

## Sequência de Entrega

```
M0 (Setup) → M1 (Auth) → M2 (Verificação) → M3 (Anúncios)
→ M4 (Lances RT) → M5 (Moderação) → M6 (Dashboards)
→ M7 (Reputação + Chat) → M8 (Notificações) → M9 (Disputas)
→ M10 (Landing + Onboarding) → M11 (Premium) → M12 (QA + Launch)
```

**MVP mínimo viável para primeiros usuários reais: M0 → M6**

---

## M0 — Setup & Fundação
**Objetivo:** Projeto rodando localmente com CI/CD configurado e banco modelado.

**Entregas:**
- Projeto Next.js 14 inicializado com TypeScript, Tailwind, shadcn/ui
- ESLint + Prettier configurados
- Repositório GitHub com branch strategy (main, develop, feature/*)
- Projeto Supabase criado (Cloud)
- Schema completo do banco definido e aplicado via migrations:
  - `users` (perfil estendido do Supabase Auth)
  - `listings` (anúncios)
  - `bids` (lances)
  - `categories`
  - `notifications`
  - `reviews` (avaliações)
  - `disputes` (disputas)
  - `messages` (chat)
  - `reports` (denúncias)
  - `identity_verifications` (documentos de identidade)
- RLS habilitado em todas as tabelas
- Buckets Supabase Storage: `listing-photos`, `identity-docs` (privado)
- Deploy base no Vercel com variáveis de ambiente configuradas
- Página `/` com placeholder "em breve"

**Verificação:** `next dev` roda sem erros, migrations aplicadas, Vercel deploy verde.

---

## M1 — Autenticação & Perfis
**Objetivo:** Usuário consegue se cadastrar, fazer login, confirmar e-mail e ver perfil básico.

**Entregas:**
- Cadastro com e-mail + senha + CPF (validação com `cpf-cnpj-validator`)
- Confirmação de conta por e-mail (Supabase Auth + Resend)
- Login / Logout
- Recuperação de senha por e-mail
- Perfil público do usuário: avatar, nome, membro desde, badge de verificado
- Edição de perfil (nome, foto)
- Middleware Next.js protegendo rotas autenticadas (`/dashboard`, `/anunciar`)
- Zustand store para sessão do usuário

**Arquivos críticos:**
- `app/(auth)/login/page.tsx`
- `app/(auth)/cadastro/page.tsx`
- `app/(auth)/recuperar-senha/page.tsx`
- `app/perfil/[id]/page.tsx`
- `lib/supabase/client.ts` e `server.ts`
- `lib/validators/auth.ts` (schemas Zod)
- `store/auth-store.ts`
- E-mail template: confirmação de cadastro

**Verificação:** Cadastro → confirmação e-mail → login → ver perfil → logout funcionando end-to-end.

---

## M2 — Verificação de Identidade (Vendedores)
**Objetivo:** Vendedores passam por verificação de identidade antes de anunciar.

**Entregas:**
- Fluxo de upload de documento (RG/CNH) + selfie segurando documento
- Armazenamento em bucket privado (acesso apenas admins)
- Status de verificação no perfil: Não verificado / Em análise / Verificado / Reprovado
- Badge "Verificado" visível no perfil quando aprovado
- Painel admin básico: fila de verificações pendentes, aprovar/reprovar com motivo
- E-mail notificando resultado da verificação (aprovado ou reprovado com motivo)
- Bloqueio de acesso a `/anunciar` para não verificados

**Arquivos críticos:**
- `app/verificacao/page.tsx`
- `app/admin/verificacoes/page.tsx`
- `components/identity/upload-form.tsx`
- `lib/supabase/storage.ts`
- E-mail templates: aprovado, reprovado

**Verificação:** Upload de doc → admin aprova → usuário recebe e-mail → badge aparece no perfil → pode acessar `/anunciar`.

---

## M3 — Anúncios (Criação e Listagem)
**Objetivo:** Vendedor verificado cria anúncios; qualquer pessoa navega e filtra anúncios.

**Entregas:**
- Formulário de criação de anúncio:
  - Título, descrição, categoria, bairro, lance mínimo, reserva de preço (oculta), timer (12h/24h/48h/7d), incremento mínimo, tipo de entrega
  - Upload de até 10 fotos (Supabase Storage, bucket `listing-photos`)
  - Rascunho salvo automaticamente (localStorage + Supabase)
- Anúncio entra em fila de moderação ao ser publicado (status: `em_moderacao`)
- Listagem pública de anúncios (apenas status `ativo`):
  - Grid de cards: foto, título, lance atual, timer, número de lances, badge verificado
  - Filtros: categoria, bairro, faixa de preço, tempo restante, apenas verificados
  - Busca por palavra-chave (full-text search PostgreSQL)
  - Ordenação: mais recentes, encerrando em breve, mais lances, menor preço
- Página de detalhe do anúncio (SSR para SEO):
  - Galeria de fotos, descrição completa, bairro, tipo de entrega
  - Seção de lances (placeholder para M4)
  - Perfil resumido do vendedor com reputação

**Arquivos críticos:**
- `app/anunciar/page.tsx`
- `app/anunciar/novo/page.tsx`
- `app/anuncios/page.tsx`
- `app/anuncios/[id]/page.tsx` (SSR)
- `components/listings/listing-card.tsx`
- `components/listings/listing-form.tsx`
- `components/listings/photo-uploader.tsx`
- `components/listings/filters.tsx`
- `lib/validators/listing.ts`

**Verificação:** Criar anúncio → entra em moderação → admin aprova → aparece na listagem → filtros funcionam → página de detalhe carrega com SSR.

---

## M4 — Sistema de Lances em Tempo Real
**Objetivo:** Compradores dão lances; todos veem atualizações instantâneas via Supabase Realtime.

**Entregas:**
- Form de lance na página de detalhe do anúncio (validação: lance ≥ atual + incremento)
- Rate limiting via Edge Function (bloquear bots)
- Lance automático (autobid): usuário define teto, sistema dá lances automáticos
- Supabase Realtime: channel por anúncio, atualiza lance atual e contagem para todos
- Timer com countdown em tempo real no cliente (date-fns)
- Extensão automática do timer: lance nos últimos 2 min → +2 min (anti-sniping via Edge Function)
- Histórico completo de lances: usuário, valor, horário
- Feedback visual: animação ao atualizar lance, toast de confirmação
- Encerramento automático ao fim do timer (Edge Function + pg_cron)
- Notificação ao vencedor e vendedor no encerramento
- Reserva de preço oculta: se não atingida, encerra sem venda

**Arquivos críticos:**
- `components/bids/bid-form.tsx`
- `components/bids/bid-history.tsx`
- `components/bids/bid-timer.tsx`
- `components/bids/autobid-form.tsx`
- `hooks/use-realtime-bids.ts`
- `supabase/functions/place-bid/index.ts`
- `supabase/functions/close-listing/index.ts`
- `supabase/functions/extend-timer/index.ts`

**Verificação:** 2 usuários no mesmo anúncio → lance dado → outro vê sem reload → timer estende com lance nos últimos 2 min → timer zera → encerramento automático → notificações enviadas.

---

## M5 — Moderação de Anúncios (Painel Admin)
**Objetivo:** Admin modera anúncios antes de ficarem públicos.

**Entregas:**
- Painel admin em `/admin` (rota protegida por role `admin`)
- Fila de moderação: aprovar → `ativo` + e-mail; reprovar com motivo → e-mail ao vendedor
- Lista de denúncias de anúncios: investigar, remover
- Lista de denúncias de usuários: suspender, banir
- Métricas gerais: anúncios ativos, arremates do dia, volume financeiro, novos cadastros
- Botão de denúncia em cada anúncio público (modal com categorias)

**Arquivos críticos:**
- `app/admin/layout.tsx`
- `app/admin/moderacao/page.tsx`
- `app/admin/denuncias/page.tsx`
- `app/admin/usuarios/page.tsx`
- `app/admin/metricas/page.tsx`
- `components/admin/listing-review-card.tsx`
- `components/reports/report-modal.tsx`

**Verificação:** Criar anúncio → fila admin → aprovar → listagem pública → denunciar → admin remove.

---

## M6 — Dashboards do Vendedor e Comprador
**Objetivo:** Usuários têm painéis personalizados com seus dados e atividades.

**Entregas:**

**Dashboard do Vendedor** (`/dashboard/vendedor`):
- Anúncios ativos com lances em tempo real
- Histórico de arremates: comprador, valor, data, status
- Resumo financeiro: total arrecadado, comissões estimadas, a receber
- Status de verificação de identidade com CTA para completar
- Avaliações recebidas

**Dashboard do Comprador** (`/dashboard/comprador`):
- Lances ativos: status (liderando / superado)
- Histórico de arremates ganhos e perdidos
- Itens salvos / favoritos
- Avaliações dadas e recebidas

**Arquivos críticos:**
- `app/dashboard/vendedor/page.tsx`
- `app/dashboard/comprador/page.tsx`
- `components/dashboard/seller-stats.tsx`
- `components/dashboard/active-listings.tsx`
- `components/dashboard/buyer-bids.tsx`
- `components/dashboard/favorites.tsx`
- `hooks/use-favorites.ts`

**Verificação:** Dar lance → aparece no dashboard como "liderando" → ser superado → status muda → vender → aparece no histórico do vendedor.

---

## M7 — Reputação, Avaliações e Chat Pós-Arremate
**Objetivo:** Após arremate confirmado, comprador e vendedor avaliam um ao outro e se comunicam via chat.

**Entregas:**
- Fluxo de avaliação pós-arremate: 1–5 estrelas + comentário (prazo 7 dias)
- Avaliação aparece no perfil após ambos avaliarem (ou prazo expirar)
- Reputação no perfil público: nota média, total de arremates, histórico
- Badge visual de reputação nos cards de anúncio
- Chat liberado somente após arremate confirmado (sem exposição de dados pessoais antes)
- Histórico de conversa salvo; notificação de nova mensagem

**Arquivos críticos:**
- `app/arremates/[id]/avaliar/page.tsx`
- `app/mensagens/[id]/page.tsx`
- `components/reviews/review-modal.tsx`
- `components/reviews/reputation-badge.tsx`
- `components/chat/message-thread.tsx`
- `hooks/use-chat-realtime.ts`

**Verificação:** Arremate encerra → ambos avaliam → avaliações no perfil público → chat disponível → mensagem enviada → notificação recebida.

---

## M8 — Notificações Completas
**Objetivo:** Sistema de notificações push (navegador) + e-mail para todos os eventos críticos.

**Entregas:**
- Web Push via Service Worker para todos os eventos:
  - Lance superado, timer encerrando (1h), arremate vencido/perdido, anúncio aprovado/reprovado, nova avaliação, disputa aberta, nova mensagem
- E-mails transacionais via Resend para os mesmos eventos
- Central de notificações no header (sino) com histórico
- Configurações de notificação por tipo (push e/ou e-mail)

**Arquivos críticos:**
- `app/configuracoes/notificacoes/page.tsx`
- `components/notifications/notification-bell.tsx`
- `components/notifications/notification-center.tsx`
- `lib/notifications/push.ts`
- `lib/notifications/email.ts`
- `supabase/functions/send-notification/index.ts`
- `emails/` — todos os templates React Email

**Verificação:** Ser superado → receber push + e-mail → desabilitar e-mail → ser superado novamente → só push.

---

## M9 — Disputas Pós-Arremate
**Objetivo:** Comprador ou vendedor pode abrir disputa formal em caso de problema.

**Entregas:**
- Botão "Abrir Disputa" após arremate (prazo 30 dias)
- Formulário: categoria + descrição + evidências (fotos)
- Painel admin de disputas: mediar, decidir, registrar resolução
- Vendedor tem 72h para responder
- Notificações para ambas as partes em cada atualização
- Histórico de disputas nos dashboards (não no perfil público)

**Arquivos críticos:**
- `app/disputas/nova/page.tsx`
- `app/disputas/[id]/page.tsx`
- `app/admin/disputas/page.tsx`
- `components/disputes/dispute-form.tsx`
- `components/disputes/dispute-timeline.tsx`

**Verificação:** Abrir disputa → vendedor notificado → responde → admin decide → ambas as partes notificadas → histórico no dashboard.

---

## M10 — Landing Page & Onboarding
**Objetivo:** Primeira impressão impecável, conversão de novos usuários, onboarding claro.

**Entregas:**
- Landing page pública (`/`):
  - Hero com proposta de valor + CTA de cadastro
  - "Como funciona" em 3 passos
  - Anúncios em destaque com timer ao vivo
  - Categorias populares
  - Seção de segurança/confiança
  - Footer com links legais
- Onboarding pós-cadastro (3 telas): boas-vindas → verificar e-mail → completar perfil
- Lista de itens proibidos no onboarding e no formulário de anúncio
- Página `/como-funciona` com FAQ

**Arquivos críticos:**
- `app/page.tsx`
- `app/como-funciona/page.tsx`
- `app/onboarding/page.tsx`
- `components/landing/hero.tsx`
- `components/landing/how-it-works.tsx`
- `components/landing/featured-listings.tsx`
- `components/onboarding/steps.tsx`

**Verificação:** `/` sem login → visual mobile/desktop → CTA → cadastro → onboarding 3 passos → listagem de anúncios.

---

## M11 — Plano Premium & Monetização
**Objetivo:** Vendedor pode contratar plano premium; comissão é calculada e registrada.

**Entregas:**
- Cálculo e registro de comissão no encerramento (8–12%)
- Plano premium: destaque na home, até 20 fotos, timer até 14 dias, badge "Premium"
- Integração de pagamento (Stripe ou Mercado Pago) para assinatura
- Página `/premium` com comparativo de planos
- Dashboard financeiro com comissões reais
- Relatórios exportáveis (CSV)

**Arquivos críticos:**
- `app/premium/page.tsx`
- `app/dashboard/vendedor/financeiro/page.tsx`
- `lib/payments/stripe.ts` (ou mercadopago)
- `supabase/functions/calculate-commission/index.ts`
- `components/premium/plan-comparison.tsx`

**Verificação:** Arremate encerra → comissão registrada → dashboard financeiro → assinar premium → badge nos anúncios → destaque na home.

---

## M12 — Qualidade, Performance & Lançamento
**Objetivo:** Plataforma estável, rápida e segura para o primeiro grupo de usuários reais.

**Entregas:**
- Testes E2E com Playwright (cadastro, anúncio → moderação → publicação, lance → encerramento → notificação)
- Lighthouse score ≥ 90 em performance e SEO nas páginas de anúncio
- SEO: Open Graph + Twitter Cards nas páginas de anúncio
- Sentry para captura de erros em produção
- Vercel Analytics ativado
- Rate limiting global em endpoints críticos
- Auditoria de RLS: todas as políticas verificadas
- Revisão de acessibilidade: foco, contraste, aria-labels
- Domínio customizado configurado na Vercel
- Seed de dados de demonstração

**Verificação:** Testes E2E no CI passam, Lighthouse ≥ 90, Sentry captura erro de teste, plataforma no domínio customizado com dados de demo.

---

## Decisões em Aberto

| Questão | Status |
|---|---|
| Pagamento: Stripe ou Mercado Pago? | Decidir no M11 (Mercado Pago tem melhor adoção no Brasil) |
| Autobid: M4 completo ou simplificado? | Incluído no M4, simplificar se necessário |
| pg_cron vs Edge Function agendada para encerrar anúncios | Avaliar no M4 |
| Moderação por IA vs apenas manual | Começa manual, IA como melhoria futura |
