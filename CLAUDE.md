# CLAUDE.md — CRM WhatsApp SaaS

## O que é este projeto

CRM multi-tenant para operações comerciais via WhatsApp. Cada empresa (workspace) tem seus próprios usuários, conversas, contatos e automações, completamente isolados por `workspace_id`. O sistema recebe mensagens via WhatsApp Cloud API (Meta), distribui para operadores humanos via round-robin, e pode executar fluxos de automação (bot) antes ou durante o atendimento.

Produção: `https://crm.alpdash.com.br` (API em `/api`, WebSocket em `/socket.io`)

---

## Stack técnica

| Camada       | Tecnologia                                            |
|--------------|-------------------------------------------------------|
| Backend      | NestJS 11, Node.js 22, TypeScript 5.7                |
| ORM          | Prisma 7 + `@prisma/adapter-pg` (driver adapter obrigatório) |
| Banco        | PostgreSQL 16 (Docker)                                |
| Filas        | BullMQ 5 + Redis 7 (Docker)                          |
| Realtime     | Socket.io 4 via `@nestjs/websockets`                 |
| Auth         | JWT (`@nestjs/jwt`) + RBAC com `PermissionsGuard`    |
| Frontend     | Next.js 16.2, React 19, TypeScript 5                 |
| Estilo       | Tailwind CSS v4 (sintaxe `@import "tailwindcss"`)    |
| UI           | Radix UI + shadcn/ui (componentes em `src/components/ui/`) |
| Data fetching| SWR 2 + Axios 1                                      |
| Formulários  | React Hook Form 7 + Zod 4                            |
| Infra        | Docker Compose (dev/staging), PM2 (produção)         |

---

## Estrutura de pastas

```
/var/www/crm-whatsapp/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Fonte da verdade do banco
│   │   ├── migrations/            # Nunca editar manualmente
│   │   └── seeds/
│   │       └── permissions.seed.ts  # Roda 1x para popular permissões
│   ├── src/
│   │   ├── app.module.ts          # Módulo raiz — registra todos os módulos
│   │   ├── main.ts                # Bootstrap — prefixo /api, ValidationPipe, rawBody
│   │   ├── prisma/                # PrismaService (singleton, driver adapter)
│   │   ├── auth/                  # JWT login/register, JWT Strategy
│   │   ├── common/
│   │   │   ├── decorators/        # @CurrentUser(), @RequirePermissions()
│   │   │   └── guards/            # JwtAuthGuard, PermissionsGuard, WebhookSignatureGuard
│   │   ├── gateway/               # EventsGateway (Socket.io) — rooms workspace: e conversation:
│   │   ├── queues/                # BullMQ: flow-delay, follow-up, auto-close
│   │   ├── whatsapp/              # Webhook Meta, envio de mensagens, round-robin
│   │   ├── automation/            # CRUD de flows + FlowExecutorService
│   │   ├── conversations/         # CRUD + assign/close/reopen + filtros RBAC
│   │   ├── messages/              # Enviar mensagem, paginação por cursor
│   │   ├── contacts/              # CRUD de contatos por workspace
│   │   ├── users/                 # Convidar, editar, roles de usuário
│   │   ├── roles/                 # CRUD de roles + permissões em lote
│   │   ├── permissions/           # Listar permissões do sistema
│   │   ├── teams/                 # CRUD de equipes + membros + round-robin
│   │   ├── pipelines/             # CRM Kanban (Pipeline → Stage → ContactPipeline)
│   │   └── workspaces/            # Configurações do workspace
│   └── dist/                      # Build gerado — nunca editar
│
└── frontend/
    └── src/
        ├── app/                   # Next.js App Router
        │   ├── (dashboard)/       # Route group — requer autenticação (layout.tsx verifica token)
        │   │   ├── page.tsx       # /  → dashboard-overview
        │   │   ├── conversations/ # /conversations e /conversations/[id]
        │   │   └── automation/    # /automation
        │   ├── login/             # /login
        │   └── register/          # /register
        ├── features/              # Feature-sliced: domain/components/
        │   ├── auth/              # login-form, register-form, auth-shell
        │   ├── conversations/     # conversation-thread, message-bubble, empty-state
        │   ├── automation/        # flow-card, flow-editor-dialog
        │   └── dashboard/         # dashboard-overview, dashboard-sidebar
        ├── components/
        │   └── ui/                # Primitivos shadcn/ui (Button, Card, Badge, etc.)
        ├── contexts/
        │   └── AuthContext.tsx    # Token JWT no localStorage (crm_token, crm_workspace, crm_permissions)
        ├── hooks/
        │   ├── useConversations.ts  # SWR — refreshInterval: 0 (atualizações só por socket)
        │   ├── useSocket.ts         # Subscrição Socket.io
        │   └── useAutomation.ts     # SWR para flows
        ├── lib/
        │   ├── api.ts             # Axios com interceptor de token e redirect em 401
        │   ├── socket.ts          # Singleton do Socket.io client
        │   └── dateUtils.ts       # formatDistanceToNow
        └── types/
            └── index.ts           # Tipos globais: User, Contact, Message, Conversation, AuthResponse
```

> **Nota:** `src/components/` (Sidebar.tsx, ConversationItem.tsx, MessageBubble.tsx) são componentes legados da fase inicial. Os equivalentes ativos vivem em `src/features/`. Não adicione código novo nos legados.

---

## Comandos importantes

### Infraestrutura
```bash
# Subir PostgreSQL 16 + Redis 7
cd /var/www/crm-whatsapp && docker compose up -d

# Verificar status
docker compose ps
```

### Backend
```bash
cd /var/www/crm-whatsapp/backend

npm run start:dev         # Dev com watch
npm run build             # Compilar para dist/
npm run start:prod        # Produção (node dist/main)
npm run lint              # ESLint com auto-fix
npm run test              # Jest (unit)
npm run test:e2e          # Jest e2e

# Prisma
npx prisma migrate dev --name <descricao>   # Nova migration após alterar schema
npx prisma migrate deploy                   # Aplicar migrations em produção
npx prisma studio                           # UI do banco no browser
npx ts-node prisma/seeds/permissions.seed.ts  # Seed de permissões (1x por banco novo)
```

### Frontend
```bash
cd /var/www/crm-whatsapp/frontend

npm run dev      # Dev em http://localhost:3001
npm run build    # Build de produção
npm run start    # Start produção na porta 3001
```

### PM2 (produção)
```bash
pm2 list
pm2 restart crm-backend
pm2 restart crm-frontend
pm2 logs crm-backend
```

---

## Padrões arquiteturais

### Multi-tenancy (CRÍTICO)
Todo dado pertence a um workspace. **Toda query Prisma no backend deve incluir `workspaceId`** no `where`. O `workspaceId` vem sempre do JWT (`req.user.workspaceId`) — nunca do body/params do cliente.

```ts
// CORRETO
this.prisma.conversation.findMany({ where: { workspaceId, ...filters } });

// ERRADO — vaza dados entre tenants
this.prisma.conversation.findMany({ where: { ...filters } });
```

### RBAC
- Permissões ficam no payload do JWT como array `permissions[]`
- Guard: `@UseGuards(JwtAuthGuard, PermissionsGuard)` + `@RequirePermissions('manage_flows')`
- Operadores comuns só veem conversas atribuídas a eles (`view_all_conversations` desbloqueia tudo)
- 12 permissões padrão definidas em `permissions.seed.ts`

### Módulos NestJS
Cada domínio (auth, conversations, whatsapp, etc.) é um módulo independente. Dependências circulares são resolvidas com `forwardRef(() => Service)` — já existe entre `WhatsappService` ↔ `TeamsService` e `FlowExecutorService` ↔ `SchedulerService`.

### Prisma v7 com driver adapter
**Obrigatório**: O `PrismaService` inicializa `PrismaPg` manualmente. Não usar `DATABASE_URL` no `schema.prisma` — a URL é passada via `Pool` no construtor. Não mudar esse padrão.

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
super({ adapter } as any);
```

### WebSocket (Socket.io)
- Namespace: `/ws`
- Auth: token no `handshake.auth.token`
- Rooms automáticas: `workspace:{workspaceId}` (ao conectar)
- Rooms manuais: `conversation:{id}` (emit `join_conversation`)
- Eventos emitidos pelos services: `new_message`, `message_status`, `conversation_updated`
- **Frontend não usa polling** — `refreshInterval: 0` no SWR. Dados em tempo real chegam pelo socket.

### Filas BullMQ
Três filas em `src/queues/`:
- `flow-delay` — executa nó de automação após delay (sobrevive a restart)
- `follow-up` — reenvio de mensagem após X horas sem resposta
- `auto-close` — encerra conversa inativa automaticamente

### Automação (Flow Engine)
- Flow tem `triggerType`: `new_conversation`, `keyword`, `always`
- Nós: `message` (envia texto), `delay` (aguarda ms via BullMQ), `condition` (futuro)
- Estado do contato no flow: `contact_flow_state` com `current_node_id`
- Bot para automaticamente quando operador humano responde (`stopBotForConversation`)

### Frontend — Feature-sliced
- Lógica de domínio fica em `src/features/{domain}/components/`
- Pages em `src/app/` são thin wrappers que importam de `features/`
- Hooks de dados em `src/hooks/` (SWR + mutações diretas via `api.*`)
- Tipos globais centralizados em `src/types/index.ts`
- Context de auth via `AuthContext` — token no `localStorage` com chaves `crm_token`, `crm_workspace`, `crm_permissions`

### Next.js 16 (versão com breaking changes)
**IMPORTANTE**: Este projeto usa Next.js 16.2, que tem APIs e convenções que diferem do que está no seu treinamento. Antes de escrever qualquer código Next.js, leia os docs em `frontend/node_modules/next/dist/docs/`. Respeite os avisos de deprecação.

`params` em Server/Client Components é agora uma `Promise<{...}>` — use `use(params)` para desempacotar no cliente, ou `await params` no servidor.

---

## Convenções de código

### Backend (NestJS/TypeScript)
- Nomenclatura de arquivos: `kebab-case.type.ts` (ex: `conversations.service.ts`, `create-flow.dto.ts`)
- DTOs com `class-validator`: `@IsString()`, `@IsEnum()`, etc. — `ValidationPipe` com `whitelist: true`
- Services usam `private prisma: PrismaService` por injeção de dependência — nunca instanciar diretamente
- Comentários de seção com `// ─── Título ───` (linha de 80 chars)
- Logger: `private readonly logger = new Logger(NomeDoServico.name)` — usar `this.logger.log/warn/error`
- Enums do Prisma importados de `@prisma/client` — não redefinir no TypeScript
- Prefixo global `/api` configurado no `main.ts` — não incluir no `@Controller()`

### Frontend (Next.js/React)
- Componentes de feature: `kebab-case.tsx` em `features/{domain}/components/`
- Exportações nomeadas (não default) para componentes de feature
- Páginas do App Router usam export default
- `'use client'` somente onde necessário (hooks, eventos de browser, socket)
- Estilo: Tailwind CSS v4 inline com `cn()` para classes condicionais
- Não usar `import React from 'react'` — React 19 não precisa
- `void` em chamadas async que não precisam de `await` no JSX (ex: `void handleSend()`)

### Tailwind CSS v4
A sintaxe mudou. O import é `@import "tailwindcss"` (não `@tailwind base/components/utilities`). Tokens de design via `@theme inline` com variáveis CSS. Não usar `tailwind.config.js` — configuração é inline no CSS.

---

## O que NUNCA fazer

1. **Nunca omitir `workspaceId` em queries Prisma** — vaza dados entre tenants.

2. **Nunca adicionar `DATABASE_URL` no `schema.prisma`** — o projeto usa driver adapter Prisma v7, a URL é passada programaticamente via `Pool`.

3. **Nunca editar arquivos em `backend/dist/`** — gerado pelo build, sobrescrito a cada `npm run build`.

4. **Nunca usar polling no frontend** — `refreshInterval: 0` é intencional. Atualizações chegam por Socket.io.

5. **Nunca adicionar código novo em `src/components/Sidebar.tsx`, `ConversationItem.tsx` ou `MessageBubble.tsx`** — são legados. Use `src/features/`.

6. **Nunca editar `prisma/migrations/` manualmente** — use `prisma migrate dev`.

7. **Nunca assumir que `params` é síncrono em Next.js 16** — é uma `Promise`, use `use(params)` no cliente.

8. **Nunca expor `workspaceId` ou `permissions` do JWT sem verificação** — o guard `JwtAuthGuard` popula `req.user`; use `@CurrentUser()` para acessar.

9. **Nunca fazer refatorações grandes sem perguntar** — o projeto está em desenvolvimento ativo com fases definidas no ROADMAP.md. Uma mudança de estrutura pode quebrar o fluxo de desenvolvimento.

10. **Nunca remover `rawBody` do `main.ts`** — necessário para validar a assinatura `X-Hub-Signature-256` do webhook Meta.

---

## Fluxo principal: mensagem recebida do WhatsApp

```
Meta Webhook POST /api/whatsapp/webhook
  → WebhookSignatureGuard valida X-Hub-Signature-256
  → WhatsappController → WhatsappService.processWebhook()
    → Identifica WhatsappAccount pelo phone_number_id
    → Upsert Contact (workspaceId + phone)
    → Busca ou cria Conversation (status: open)
      → Se nova: round-robin via TeamsService.getNextMember()
    → Salva Message (senderType: 'contact')
    → Atualiza lastMessageAt
    → Emite 'new_message' via EventsGateway → Socket.io
    → FlowExecutorService.triggerForConversation()
      → Verifica flows ativos do workspace
      → Executa nós: message → envia via WhatsApp API + salva no banco
                     delay  → agenda via BullMQ (flow-delay queue)
```

## Fluxo: operador responde

```
POST /api/messages  (JwtAuthGuard)
  → MessagesService.send()
    → FlowExecutorService.stopBotForConversation()  ← para o bot
    → WhatsappService.sendTextMessage()             ← envia pela API
    → Salva Message (senderType: 'user')
    → Emite 'new_message' via EventsGateway
```

---

## Variáveis de ambiente

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://crm:crm_secret_2024@localhost:5432/crm_whatsapp
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=...
JWT_EXPIRES_IN=7d
PORT=3000
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_APP_ID=...
WHATSAPP_APP_SECRET=...
```

### Frontend (`frontend/.env.local` — criar se não existir)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

---

## Roadmap
Detalhes de cada fase em `ROADMAP.md`. Antes de iniciar qualquer feature 
nova, leia a fase correspondente no roadmap para entender o escopo exato.

---

## Instruções de comportamento

- **Leia antes de modificar.** Nunca proponha mudanças em arquivos que não leu.
- **Pergunte antes de refatorar em larga escala.** Reorganizar pastas, mudar padrão de módulos ou alterar o schema do banco são mudanças que afetam todo o projeto — confirme com o usuário.
- **Prefira a solução mais simples** que resolve o problema. Não adicione abstrações para uso único.
- **Não adicione tratamento de erro para cenários impossíveis.** Os guards e o ValidationPipe já cobrem a borda. Não duplique validação que o framework já faz.
- **Mantenha o isolamento de tenant.** Em qualquer nova feature com dados de banco, sempre pergunte: "essa query filtra por `workspaceId`?".
- **Não invente URLs de API.** O prefixo é `/api` e os endpoints seguem o padrão NestJS dos controllers existentes.
- **Ao adicionar novo módulo NestJS**, registre-o em `app.module.ts` — ele não é carregado automaticamente.
- **Ao alterar o schema Prisma**, lembre o usuário de rodar `prisma migrate dev` e regenerar o client antes de usar os novos tipos.
- **Next.js 16 tem breaking changes** — verifique `node_modules/next/dist/docs/` se houver dúvida sobre uma API.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
