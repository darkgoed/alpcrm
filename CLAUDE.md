# CLAUDE.md — CRM WhatsApp SaaS

## Goal

Work with minimal context, low token usage, and consistent edits. Optimize for the smallest safe change, not for completeness.

---

## Session Start

Always in this order:

1. Read `AGENTS.md`
2. Read `graphify-out/GRAPH_REPORT.md`
3. Locate the execution path with `rg` before opening any file
4. Open only files on that path
5. Stop when the edit location is identified

Use `ROADMAP.md` only for new features, structural changes, or scope disputes — never for bug fixes or small edits.

---

## Reading Strategy

### Start narrow

- `rg` first, then open files — never open speculatively
- Check file size before reading: if > 200 lines, search for the target function first
- Open controller/page wrapper → backing service/hook → side effects only if flow crosses them
- Read sections, not whole files

### Good default paths

| Task | Path |
|------|------|
| Backend API change | controller → service → Prisma query → side effects |
| Frontend page change | `src/app/.../page.tsx` → feature component → hook → `lib/api.ts` |
| Automation/queue change | flow executor → scheduler → processor |
| New module | `app.module.ts` → controller → service → Prisma schema |
| Permission change | guard → decorator → service layer |

### Expand only if

- The change touches messages, automation, assignment, or realtime
- The service emits socket events or schedules BullMQ jobs
- The change affects auth, permissions, or workspace isolation
- The route is a thin wrapper and real logic is elsewhere

### Run reads in parallel

When multiple independent files are needed, issue all read/search calls in a single message — do not wait for one before starting the next.

---

## When To Ask

Ask only if:

- The task implies a broad refactor
- The change conflicts with tenant isolation or current architecture
- Two valid directions exist with product-level impact
- A schema or module-boundary change is required but not explicit in the request

Otherwise: assume the smallest safe interpretation and proceed.

**Confidence threshold:**

- > 80% → proceed
- 50–80% → proceed with safest assumption, state it in one sentence
- < 50% → ask

---

## Editing Rules

- Smallest patch that fits existing patterns
- Follow existing module boundaries and naming
- No abstractions for single use
- No comments unless the logic is genuinely non-obvious
- No refactoring of working code unless requested
- No new files unless strictly necessary — prefer editing existing ones

---

## File Size and God Node Strategy

Graphify identifies god nodes by edge count. Dense, single-responsibility files produce better graphs and are easier to navigate.

**Limits:**

| File type | Max lines |
|-----------|-----------|
| Service | ~250 |
| Controller | ~150 |
| Processor / scheduler | ~150 |
| Frontend feature component | ~200 |
| Hook | ~120 |

**When a file exceeds its limit:**

Extract a cohesive, nameable responsibility into a sibling file in the same module directory. Name by domain, not by size:

- `whatsapp.service.ts` → `whatsapp-media.service.ts`, `whatsapp-send.service.ts`
- `conversation-thread.tsx` → `conversation-composer.tsx`, `conversation-header.tsx`

Register the child as a NestJS provider and inject it into the parent — this creates an explicit graph edge.

**Never split just to reduce line count.** Only split when a distinct, nameable responsibility can be fully isolated.

---

## Roadmap Update Rule

After implementing any roadmap item, mark it `[x]` in `ROADMAP.md` before closing the task.

- Mark each item when completed — do not batch.
- If partially implemented: leave `[ ]` and add `<!-- parcial: o que falta -->` inline.
- The roadmap must always reflect the current state of the code.

---

## Validation Sequence

Run in this order after each change:

1. **Backend change** → `npm run lint` (scoped to touched files) → `npm run build` if structural
2. **Frontend change** → `npm run build`
3. **Schema change** → tell the user to run:
   ```bash
   cd backend
   npx prisma migrate dev --name <descricao>
   # prisma generate runs automatically after migrate dev
   ```
<!-- 4. **After any code file change** → rebuild graphify:
   ```bash
   python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
   ``` -->

### On lint/build failure

- Read the error, identify the root cause
- Fix the smallest thing that resolves it
- Do not bypass hooks (`--no-verify`) or disable lint rules globally
- Do not retry blindly — diagnose first

---

## Do Not

- Do not read raw generated output (`backend/dist/`, `graphify-out/`) unless explicitly needed
- Do not trust memory over the current codebase — read the file
- Do not do repo-wide analysis for a local change
- Do not push or commit unless the user explicitly asks
- Do not add `workspaceId` to DTOs — it comes from JWT only
- Do not manually edit Prisma migrations
- Do not introduce polling loops in the frontend
- Do not extend legacy components (`Sidebar.tsx`, `ConversationItem.tsx`, `MessageBubble.tsx`)
