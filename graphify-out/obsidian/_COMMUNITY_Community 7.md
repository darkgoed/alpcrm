---
type: community
cohesion: 0.08
members: 35
---

# Community 7

**Cohesion:** 0.08 - loosely connected
**Members:** 35 nodes

## Members
- [[API Prefix and Raw Body]] - code - backend/src/main.ts
- [[Add Tag DTO]] - code - backend/src/contacts/dto/contact.dto.ts
- [[App Module Domain Wiring]] - code - backend/src/app.module.ts
- [[Automation Flow Endpoints]] - code - backend/src/automation/automation.controller.ts
- [[Cloud API Completeness]] - document - ROADMAP.md
- [[Contact Filter DTO]] - code - backend/src/contacts/dto/contact.dto.ts
- [[Contact Import and Tagging]] - code - backend/src/contacts/contacts.service.ts
- [[Conversation Access Control]] - code - backend/src/conversations/conversations.service.ts
- [[Conversation Events and Bot State]] - code - backend/src/conversations/conversations.service.ts
- [[Create Contact DTO]] - code - backend/src/contacts/dto/contact.dto.ts
- [[Flow Trigger and State]] - code - backend/src/automation/flow-executor.service.ts
- [[Inbox and CRM Operations]] - document - ROADMAP.md
- [[JWT Module Registration]] - code - backend/src/auth/auth.module.ts
- [[JWT Workspace and Permissions Claims]] - code - backend/src/auth/strategies/jwt.strategy.ts
- [[Message and Delay Execution]] - code - backend/src/automation/flow-executor.service.ts
- [[Messaging Reliability]] - document - ROADMAP.md
- [[Minimal Context Editing]] - document - CLAUDE.md
- [[Observability, Tests and Operation]] - document - ROADMAP.md
- [[Operational Agent Guide]] - document - AGENTS.md
- [[Permissions Guard]] - code - backend/src/common/guards/permissions.guard.ts
- [[Production Roadmap]] - document - ROADMAP.md
- [[Scale and Intelligence]] - document - ROADMAP.md
- [[Security Hardening]] - document - ROADMAP.md
- [[Stop Bot on Operator Reply]] - code - backend/src/automation/flow-executor.service.ts
- [[Template Conversation Initiation]] - code - backend/src/conversations/conversations.service.ts
- [[Temporary Access Token]] - document - whatsapp-config.md
- [[Tenant Isolation Rules]] - document - AGENTS.md
- [[Token Signing]] - code - backend/src/auth/auth.service.ts
- [[Update Contact DTO]] - code - backend/src/contacts/dto/contact.dto.ts
- [[Webhook HMAC Validation]] - code - backend/src/common/guards/webhook-signature.guard.ts
- [[Webhook Verification Setup]] - document - whatsapp-config.md
- [[WhatsApp Cloud Config]] - document - whatsapp-config.md
- [[Workspace Scoped Contacts]] - code - backend/src/contacts/contacts.controller.ts
- [[Workspace Scoped Conversations]] - code - backend/src/conversations/conversations.controller.ts
- [[Workspace Scoped Flow CRUD]] - code - backend/src/automation/flows.service.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Community_7
SORT file.name ASC
```

## Connections to other communities
- 3 edges to [[_COMMUNITY_Community 4]]
- 1 edge to [[_COMMUNITY_Community 8]]

## Top bridge nodes
- [[Contact Import and Tagging]] - degree 7, connects to 1 community
- [[App Module Domain Wiring]] - degree 6, connects to 1 community
- [[Workspace Scoped Contacts]] - degree 6, connects to 1 community
- [[Token Signing]] - degree 3, connects to 1 community