# PRD — ArremataMarília

## 1. CONTEXT & PROBLEM

Moradores de Marília não têm um canal local para vender qualquer item — usado, novo, excedente ou urgente — com disputa de preço. Plataformas nacionais como OLX e Mercado Livre não têm senso de comunidade local e não oferecem dinâmica de lances entre particulares.

Boas oportunidades ficam represadas em grupos de WhatsApp desorganizados e Facebook Marketplace sem controle de oferta, tempo ou confiança entre as partes.

## 2. PROPOSED SOLUTION

ArremataMarília é um marketplace hiperlocal de lances para Marília/SP. Qualquer pessoa pode anunciar qualquer item — novo, usado, artesanal, excedente — e compradores disputam por ofertas com prazo definido. O maior lance ao fim do timer fecha o negócio. A plataforma cobra comissão percentual sobre o arremate.

Para trazer credibilidade, a plataforma conta com verificação de identidade no cadastro (CPF + selfie), sistema de reputação com avaliações após cada arremate, moderação de anúncios antes da publicação e histórico público de transações por usuário. Isso diferencia a plataforma de grupos informais e cria confiança real entre desconhecidos.

## 3. FUNCTIONAL REQUIREMENTS

- Login e Autenticação
- Dashboards
- Multi usuário
- Permissões por usuário
- Parte premium (paga)
- Notificações
- Chat / Mensagens
- Relatórios e Exportação
- Upload de Arquivos
- Busca e Filtros
- Landing Page
- Onboarding do Usuário

### SISTEMA DE LANCES

- Cada anúncio tem um timer configurável pelo vendedor (ex: 12h, 24h, 48h, 7 dias)
- Lances em tempo real via Supabase Realtime — todos os participantes veem o lance atualizado instantaneamente sem recarregar a página
- Incremento mínimo de lance configurável por anúncio (ex: R$1, R$5, R$10)
- Lance automático (autobid): usuário define o valor máximo e o sistema dá lances automáticos até esse teto
- Histórico completo de lances por anúncio: quem deu, valor, horário
- Extensão automática do timer: se um lance for dado nos últimos 2 minutos, o timer estende mais 2 minutos (anti-sniping)
- Encerramento automático ao fim do timer — sistema notifica vencedor e vendedor imediatamente
- Lance mínimo definido pelo vendedor no momento do anúncio
- Reserva de preço opcional (lance mínimo oculto): anúncio só fecha se atingir o valor mínimo do vendedor

### ANÚNCIOS

- Qualquer usuário verificado pode anunciar qualquer item: novo, usado, artesanal, colecionável, excedente
- Upload de até 10 fotos por anúncio
- Título, descrição detalhada, categoria, bairro/localização dentro de Marília
- Opção de retirada presencial ou entrega combinada entre as partes
- Rascunho de anúncio salvo automaticamente
- Anúncio passa por moderação antes de ficar público (revisão manual ou por IA)
- Vendedor pode encerrar anúncio antecipadamente (com regras para evitar abuso)
- Status do anúncio visível: Em moderação / Ativo / Encerrado / Cancelado / Arremate confirmado

### MONETIZAÇÃO

- Comissão percentual sobre o valor do arremate (ex: 8–12%) cobrada do vendedor
- Plano premium pago: destaque do anúncio na home, mais fotos, timer estendido, badge de vendedor verificado premium
- Taxa de anúncio opcional para categorias de alto valor

### SEGURANÇA E CREDIBILIDADE

- Cadastro básico: e-mail + senha + CPF (validação de CPF real)
- Verificação de vendedor: upload de documento de identidade (RG ou CNH) + selfie segurando o documento — revisão manual antes de liberar para anunciar
- Compradores também podem ser verificados para maior credibilidade nos lances
- Sistema de reputação: após cada arremate, comprador e vendedor avaliam um ao outro (1–5 estrelas + comentário)
- Histórico público de reputação no perfil de cada usuário: total de arremates, nota média, avaliações recebidas
- Badge de usuário verificado visível em todos os anúncios e lances
- Denúncia de anúncio: qualquer usuário pode denunciar com categoria (fraude, item proibido, foto falsa, etc.)
- Denúncia de usuário: histórico de denúncias visível para os admins
- Bloqueio de usuário entre si (comprador pode bloquear vendedor e vice-versa)
- Sistema de disputas pós-arremate: canal formal para registrar problemas (não entregou, item diferente do anunciado) com prazo de resolução e possibilidade de suspensão do vendedor
- Lista de itens proibidos exibida no onboarding e no momento do anúncio
- Rate limiting nos lances para evitar bots

### NOTIFICAÇÕES

- Push (navegador) + e-mail para: lance superado, timer quase encerrando (1h antes), arremate vencido, arremate perdido, anúncio aprovado, anúncio reprovado com motivo, nova avaliação recebida, disputa aberta
- Preferências de notificação configuráveis pelo usuário

### DASHBOARD DO VENDEDOR

- Anúncios ativos com lances em tempo real
- Histórico de arremates com valor, comprador, data
- Resumo financeiro: total arrecadado, comissões pagas, a receber
- Avaliações recebidas
- Status de verificação de identidade

### DASHBOARD DO COMPRADOR

- Lances ativos com status (liderando / superado)
- Histórico de arremates ganhos e perdidos
- Itens salvos / favoritos
- Avaliações dadas e recebidas

### PAINEL ADMIN

- Fila de moderação de anúncios (aprovar / reprovar com motivo)
- Fila de verificação de identidade de vendedores
- Gestão de usuários: banir, suspender, verificar manualmente
- Visualização de disputas abertas e histórico de resolução
- Métricas gerais: anúncios ativos, arremates do dia, volume financeiro, novos cadastros

### BUSCA E FILTROS

- Busca por palavra-chave
- Filtro por categoria, bairro, faixa de preço atual, tempo restante, apenas verificados
- Ordenação: mais recentes, encerrando em breve, maior número de lances, menor preço atual

### CHAT

- Chat liberado somente após arremate confirmado entre vencedor e vendedor
- Histórico de conversa salvo
- Sem exposição de dados pessoais antes do arremate (número de telefone, endereço só compartilhado via chat após confirmação)

## 4. USER PERSONAS

### COMPRADOR
- Morador de Marília que busca oportunidades de compra por preço abaixo do mercado
- Navega pelos anúncios ativos, filtra por categoria e bairro, acompanha lances em tempo real
- Pode dar lances manuais ou ativar o autobid com teto de valor
- Recebe notificações quando é superado ou quando o timer está encerrando
- Após arremate vencido, acessa o chat com o vendedor para combinar entrega ou retirada
- Pode avaliar o vendedor após a transação e abrir disputa em caso de problema
- Perfil público com histórico de arremates e reputação

### VENDEDOR
- Morador de Marília que quer vender qualquer item com agilidade e preço justo definido pelo mercado
- Passa por verificação de identidade (documento + selfie) antes de anunciar
- Cria anúncios com fotos, descrição, lance mínimo, reserva de preço oculta e duração do timer
- Acompanha os lances em tempo real no dashboard
- Recebe notificação ao encerrar o anúncio com o vencedor e o valor final
- Paga comissão percentual sobre o valor do arremate apenas quando a venda acontece
- Pode contratar plano premium para destacar anúncios e aumentar visibilidade
- Perfil público com reputação, badge de verificado e histórico de vendas
- Pode abrir ou responder disputas pós-arremate

### USUÁRIO GERAL (não verificado)
- Pode se cadastrar, navegar e favoritar anúncios sem verificação
- Para dar lances precisa verificar e-mail
- Para anunciar precisa completar verificação de identidade completa
- Isso cria uma barreira de entrada que protege a credibilidade da plataforma

### ADMINISTRADOR / MODERADOR
- Equipe interna da plataforma (inicialmente o próprio fundador)
- Acessa painel admin completo com fila de moderação de anúncios novos
- Aprova ou reprova anúncios com motivo registrado (enviado por e-mail ao vendedor)
- Revisa documentos de verificação de identidade dos vendedores
- Gerencia usuários: pode suspender, banir ou verificar manualmente
- Acompanha disputas abertas entre compradores e vendedores e toma decisões de mediação
- Visualiza métricas gerais da plataforma: volume de arremates, novos cadastros, anúncios ativos, comissões geradas
- Pode editar ou remover qualquer anúncio denunciado

## 5. TECHNICAL STACK

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), React, TypeScript |
| Estilos | Tailwind CSS, shadcn/ui |
| Estado global | Zustand |
| Formulários | React Hook Form + Zod |
| Datas/timers | date-fns |
| Backend/DB | Supabase (PostgreSQL, Auth, Realtime, Storage, RLS) |
| Funções serverless | Supabase Edge Functions |
| E-mail | Resend + React Email |
| Deploy | Vercel |
| Pagamentos (fase 2) | Stripe ou Mercado Pago |
| Monitoramento (fase 2) | Sentry, Vercel Analytics |

### FRONTEND
- Next.js 14 com App Router — roteamento, SSR para SEO dos anúncios e Server Actions
- React — componentes de interface
- TypeScript — tipagem estática em todo o projeto para evitar bugs
- Tailwind CSS — estilização utilitária rápida
- shadcn/ui — componentes de UI prontos e customizáveis (modais, formulários, badges, toasts)
- Zustand — gerenciamento de estado global leve (lances em tempo real, notificações, sessão)
- React Hook Form + Zod — formulários com validação robusta (cadastro, anúncio, lance, verificação)
- date-fns — manipulação de datas e timers dos anúncios

### BACKEND / BANCO DE DADOS
- Supabase — plataforma principal:
  - PostgreSQL como banco de dados relacional
  - Supabase Auth — autenticação com e-mail/senha, confirmação de e-mail, recuperação de senha
  - Supabase Realtime — lances em tempo real via WebSocket (atualização instantânea sem polling)
  - Supabase Storage — armazenamento de fotos dos anúncios e documentos de verificação de identidade
  - Row Level Security (RLS) — políticas de segurança no banco: cada usuário só acessa seus próprios dados
  - Edge Functions — lógica serverless para: encerramento automático de anúncios, cálculo de comissão, extensão de timer anti-sniping, disparo de notificações

### HOSPEDAGEM E DEPLOY
- Vercel — deploy do frontend Next.js com CI/CD automático via GitHub
- Supabase Cloud — banco, auth, storage e realtime hospedados na infraestrutura do Supabase

### E-MAIL
- Resend — envio de e-mails transacionais: confirmação de cadastro, lance superado, arremate encerrado, anúncio aprovado/reprovado, abertura de disputa
- React Email — templates de e-mail em componentes React para manter consistência visual

### PAGAMENTOS (fase 2 — integrar após MVP)
- Stripe ou Mercado Pago — cobrança de comissão sobre arremates e planos premium
- Definir após validar o modelo com os primeiros usuários

### SEGURANÇA
- Supabase RLS em todas as tabelas sensíveis
- Validação de CPF via biblioteca brasileira (cpf-cnpj-validator)
- Upload de documentos armazenado em bucket privado no Supabase Storage (acesso apenas para admins)
- Rate limiting nos lances via Edge Function para bloquear bots
- Variáveis de ambiente seguras via Vercel para todas as chaves de API

### MONITORAMENTO (fase 2)
- Sentry — captura de erros em produção
- Vercel Analytics — métricas de uso e performance

### DESENVOLVIMENTO
- Claude Code — desenvolvimento principal assistido por IA
- GitHub — controle de versão
- ESLint + Prettier — padronização de código

## 6. DESIGN LANGUAGE

### REFERÊNCIAS FUNCIONAIS (como funciona)
- **eBay** — referência principal para a mecânica de lances: timer visível e destacado, histórico de ofertas por anúncio, extensão automática de prazo, badge de verificado, sistema de reputação com estrelas e comentários
- **OLX Brasil** — referência para a estrutura de navegação hiperlocal: categorias simples, filtro por cidade/bairro, card de anúncio direto com foto e preço
- **Mercado Livre** — referência para o sistema de reputação visual (termômetro de reputação, badges, histórico público), processo de disputa e mediação pós-venda, e estrutura de dashboard do vendedor

### REFERÊNCIAS VISUAIS (como parece)
- **Enjoei** — identidade visual amigável, humana e voltada para comunidade. Tipografia leve, cores suaves, tom de voz próximo e informal
- **Linear** — interface limpa, sem poluição visual, uso inteligente de espaço em branco, hierarquia tipográfica clara. Referência para o painel admin e dashboards internos
- **Airbnb** — cards de listagem bem construídos com foto em destaque, informações essenciais visíveis sem precisar abrir o anúncio, sistema de avaliações integrado naturalmente ao perfil do usuário

### DIRETRIZES VISUAIS
- Visual clean e moderno, sem parecer genérico ou institucional demais
- Timer do anúncio sempre visível e destacado — é o elemento mais importante da interface
- Badge de verificado e reputação visíveis em todos os cards de anúncio e perfis
- Paleta de cores: laranja ou verde como cor primária de ação (transmite energia e confiança), fundo neutro claro, tipografia sans-serif legível
- Mobile-first: maioria dos usuários de Marília vai acessar pelo celular
- Hierarquia clara nos cards: foto > título > lance atual > timer > número de lances
- Feedback visual imediato ao dar um lance (animação, toast de confirmação, atualização do valor em tempo real)
- Fluxo de onboarding simples e visual, explicando como funciona em 3 passos antes do cadastro
