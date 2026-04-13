# AGENTS.md — CRM WhatsApp SaaS

## Purpose

Operational guide for AI agents. Optimize for small-scope work, preserve tenant isolation, and avoid rereading the whole repo.

## Fast Entry Map

- Incoming message -> `WhatsappService.processWebhook`
- Send message -> `MessagesService.send`
- Automation -> `FlowExecutorService.triggerForConversation`
- Realtime -> `EventsGateway`
- Frontend conversation -> `conversation-thread.tsx`

## Session Start

Read in this order:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `graphify-out/GRAPH_REPORT.md`
4. `graphify-out/wiki/index.md` if it exists
5. Only the files on the execution path you will touch
6. `ROADMAP.md` only for new features or structural changes
7. `frontend/node_modules/next/dist/docs/` only when a Next.js 16 API is unclear

Do not read the whole repository by default. Start from the smallest relevant slice.

## Project Snapshot

Multi-tenant CRM for WhatsApp operations. Each workspace owns its users, conversations, contacts, automation, queues, and settings. Backend is NestJS + Prisma + BullMQ + Socket.io. Frontend is Next.js App Router + SWR + Axios + Tailwind v4.

## Stack

- Backend: NestJS 11, Node.js 22, TypeScript 5.7
- ORM: Prisma 7 with `@prisma/adapter-pg`
- Database: PostgreSQL 16
- Queues: BullMQ 5 + Redis 7
- Realtime: Socket.io 4
- Auth: JWT + RBAC guards
- Frontend: Next.js 16.2, React 19, TypeScript 5
- Styling: Tailwind CSS v4
- UI: Radix UI + shadcn/ui
- Data fetching: SWR 2 + Axios 1

## Where To Start

By topic:

- Bootstrap: `backend/src/main.ts`, `backend/src/app.module.ts`
- Prisma/db: `backend/prisma/schema.prisma`, `backend/src/prisma/prisma.service.ts`
- Auth/RBAC: `backend/src/auth/`, `backend/src/common/guards/`, `backend/src/common/decorators/`
- WhatsApp ingest/send: `backend/src/whatsapp/whatsapp.service.ts`
- Conversations/messages: `backend/src/conversations/`, `backend/src/messages/`
- Automation: `backend/src/automation/flow-executor.service.ts`, `backend/src/automation/flows.service.ts`
- Queues: `backend/src/queues/`
- Realtime: `backend/src/gateway/events.gateway.ts`, `frontend/src/hooks/useSocket.ts`
- Frontend routing/layout: `frontend/src/app/(dashboard)/`, `frontend/src/features/`
- Settings/templates/accounts: `backend/src/workspaces/`, `backend/src/templates/`, `frontend/src/features/settings/`

High-coupling nodes from graphify:

- `WhatsappService`
- `FlowExecutorService`
- `ConversationsService`
- `TeamsService`
- `UsersService`
- `EventsGateway`
- `PipelinesService`

If a change touches messages, assignment, automation, or realtime, inspect the related hub before editing.

## Real Architecture

- Backend is domain-modular NestJS. Modules are manually registered in `backend/src/app.module.ts`.
- Prisma access is centralized through `PrismaService`.
- Workspace isolation is enforced in service-layer queries, not by a global ORM plugin.
- RBAC is enforced with `JwtAuthGuard`, `PermissionsGuard`, and JWT `permissions[]`.
- WhatsApp inbound flow enters at webhook controller, then `WhatsappService`.
- Operator outbound flow enters at `MessagesService`.
- Automation execution is in `FlowExecutorService`; delays and follow-ups go through `SchedulerService` and BullMQ processors.
- Frontend pages in `src/app/` are thin wrappers; real UI lives in `src/features/`.
- Frontend data flow is SWR + direct mutations + socket events. No polling for conversations.

## Critical Invariants

### Multi-tenant

- Every backend Prisma query must scope by `workspaceId` when applicable.
- `workspaceId` must come from JWT / `@CurrentUser()`, never from client input.
- Includes, joins, events, queue jobs, and follow-up actions must stay inside validated workspace scope.
- Do not add `workspaceId` to DTOs unless there is a strong server-side reason and it is ignored from client input.

### Prisma

- Keep Prisma v7 driver adapter pattern in `backend/src/prisma/prisma.service.ts`.
- Do not put `DATABASE_URL` in `schema.prisma`.
- Do not edit `backend/prisma/migrations/` manually.

### Backend

- Keep global `/api` prefix in `backend/src/main.ts`.
- Do not remove `rawBody`; Meta webhook signature validation depends on it.
- Prefer adding logic in existing domain modules over cross-cutting helpers.
- When adding a module, register it in `backend/src/app.module.ts`.

### Frontend

- Put new domain UI in `frontend/src/features/{domain}/components/`.
- Keep `frontend/src/app/` pages thin.
- Do not add new code to legacy components in `frontend/src/components/Sidebar.tsx`, `ConversationItem.tsx`, `MessageBubble.tsx`.
- Keep conversation updates socket-driven; do not introduce polling.
- Next.js 16 route `params` are promises. Use current repo pattern.

## Main Flows

### Incoming WhatsApp message

`WhatsappController` -> `WhatsappService.processWebhook()` -> account lookup -> contact upsert -> open conversation lookup/create -> optional round-robin via `TeamsService.getNextMember()` -> message create -> conversation timestamp update -> queue scheduling -> websocket emit -> automation trigger

### Operator reply

`MessagesController` -> `MessagesService.send()` -> permission/lock check -> stop bot -> cancel follow-up -> optimistic message create -> websocket emit -> WhatsApp API send -> status update/failure handling

### Automation

`FlowExecutorService.triggerForConversation()` loads active flows for workspace, matches trigger, persists `contactFlowState`, executes node chain, and delegates delays to `SchedulerService`.

### Queues

- `flow-delay`: resume flow after delay
- `follow-up`: send configured follow-up after inactivity
- `auto-close`: close inactive conversations
- `contact-import`: CSV import processing
- `templates-poll`: template status polling

## Task Sizing

- Small: bug, field, UI tweak -> stay within 1-2 files
- Medium: flow change -> follow execution path
- Large: feature -> consult `ROADMAP.md`

Default to Small unless clearly proven otherwise by code dependencies.

## Commands

Infra:

```bash
docker compose up -d
docker compose ps
```

Backend:

```bash
cd backend
npm run start:dev
npm run build
npm run lint
npm run test
npm run test:e2e
npx prisma migrate dev --name <name>
npx ts-node prisma/seeds/permissions.seed.ts
```

Frontend:

```bash
cd frontend
npm run dev
npm run build
```

## Agent Scope

### Backend Agent

- Work inside one domain module unless the flow proves otherwise
- Check controller -> service -> Prisma query -> gateway/queue side effects
- Re-verify `workspaceId`, RBAC, and queue/event payloads before finishing

### Frontend Agent

- Start from route wrapper, then move to feature component and hook
- Prefer existing hooks in `frontend/src/hooks/`
- Preserve `AuthContext`, Axios interceptor, SWR, and socket integration
- Confirm Next.js 16 semantics before changing router params or App Router behavior

### Queue/Automation Agent

- Inspect `FlowExecutorService`, `SchedulerService`, and the relevant processor together
- Check idempotency and delayed-job behavior
- Confirm operator replies still stop active bots and cancel follow-ups

## Token Discipline

- Read graphify first, then only the execution path.
- Do not open files outside the active path unless a coupling signal appears.
- Prefer `rg` and `wc -l` before opening large files.
- For large files, read targeted sections instead of full file dumps.
- If a task is local, keep context local. Do not summarize unrelated modules.

## Stop Conditions

Stop reading more files when:

- The exact function to change is identified
- The change is contained within one module/service/component
- No obvious cross-module side effects are detected

Do not expand context beyond this point.
If unsure, stop expanding and proceed with the safest local assumption.

## Known Hotspots

- `backend/src/whatsapp/whatsapp.service.ts` is a hub for inbound flow and side effects.
- `backend/src/automation/flow-executor.service.ts` mixes flow state, sending, and scheduling.
- `frontend/src/features/conversations/components/conversation-thread.tsx` is large and carries multiple UI responsibilities.
- `frontend/src/features/settings/components/settings-page.tsx` and `frontend/src/features/crm/components/kanban-page.tsx` are large feature surfaces.
- Repo still contains legacy frontend components alongside feature-sliced code. Do not extend the legacy path.

## Do Not

- Do not omit `workspaceId` in backend data access.
- Do not trust client-provided `workspaceId`.
- Do not add new polling loops to the frontend.
- Do not edit generated files in `backend/dist/`.
- Do not manually edit Prisma migrations.
- Do not refactor structure broadly unless the user asked for it.
- Do not assume Next.js pre-16 behavior for App Router APIs.

## Validation

- Backend changes: run `npm run lint` and the smallest useful test/build command.
- Frontend changes: run `npm run build` or targeted validation for touched area.
- If schema changed, remind the user to run migration and client generation flow.
- If code files changed, rebuild graphify at the end:

```bash
   python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
   ```
