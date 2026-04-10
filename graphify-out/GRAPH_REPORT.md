# Graph Report - .  (2026-04-10)

## Corpus Check
- Corpus is ~36,705 words - fits in a single context window. You may not need a graph.

## Summary
- 608 nodes · 824 edges · 57 communities detected
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 12,500 input · 2,800 output

## God Nodes (most connected - your core abstractions)
1. `PipelinesController` - 13 edges
2. `PipelinesService` - 13 edges
3. `ContactsService` - 12 edges
4. `ContactsController` - 12 edges
5. `TeamsService` - 11 edges
6. `UsersService` - 10 edges
7. `UsersController` - 9 edges
8. `TeamsController` - 9 edges
9. `ConversationsService` - 9 edges
10. `ConversationsController` - 8 edges

## Surprising Connections (you probably didn't know these)
- `Rationale: Canvas Route Replaces Flow Editor Dialog` --rationale_for--> `Automation Canvas Page (route)`  [EXTRACTED]
  ROADMAP.md → frontend/src/app/(dashboard)/automation/[id]/page.tsx
- `useAutomation Hook` --shares_data_with--> `FlowExecutorService`  [INFERRED]
  frontend/src/hooks/useAutomation.ts → backend/src/automation/flow-executor.service.ts
- `Rationale: Dual Sidebar Layout` --rationale_for--> `DashboardLayout Component`  [EXTRACTED]
  ROADMAP.md → frontend/src/app/(dashboard)/layout.tsx
- `FlowExecutorService` --calls--> `SchedulerService`  [EXTRACTED]
  backend/src/automation/flow-executor.service.ts → backend/src/queues/scheduler.service.ts
- `FollowUpProcessor` --shares_data_with--> `ConversationsService`  [INFERRED]
  backend/src/queues/follow-up.processor.ts → backend/src/conversations/conversations.service.ts

## Hyperedges (group relationships)
- **BullMQ Queue Processing Pattern** — queues_SchedulerService, queues_FlowDelayProcessor, queues_FollowUpProcessor, queues_AutoCloseProcessor [EXTRACTED 0.95]
- **Operator Reply Flow** — messages_MessagesService, whatsapp_WhatsappService, queues_SchedulerService [EXTRACTED 0.95]
- **Flow Execution Pipeline** — automation_flowexecutor, queues_SchedulerService, queues_FlowDelayProcessor [EXTRACTED 0.95]
- **Workspace Settings Full-Stack** — workspaces_service, workspaces_controller, hooks_useworkspacesettings [INFERRED 0.88]
- **CRM Kanban Full-Stack** — pipelines_service, hooks_usecontacts, features_crm_kanbanpage [INFERRED 0.85]
- **Dashboard App Shell Layout System** — dashboard_layout_dashboardlayout, dashboard_sidebar_navrail, dashboard_sidebar_contextsidebar, dashboard_layout_mobiledrawer [EXTRACTED 1.00]
- **Automation Canvas Editing Flow** — app_automation_page, app_automation_id_page, flow_card_flowcard, app_automation_createflowdialog [EXTRACTED 0.95]
- **Settings Page Passive Automation UI** — settings_page_settingspage, settings_page_autoclosesection, settings_page_followupsection [EXTRACTED 1.00]

## Communities

### Community 0 - "Frontend UI Primitives"
Cohesion: 0.03
Nodes (8): close(), goToConversation(), FormControl(), useFormField(), getErrorMessage(), onSubmit(), getErrorMessage(), onSubmit()

### Community 1 - "NestJS Backend Core"
Cohesion: 0.06
Nodes (18): AppModule, AssignConversationDto, AutoCloseProcessor, FlowExecutorService, AutomationModule, ConversationsModule, CreateFlowDto, CreateFlowNodeDto (+10 more)

### Community 2 - "RBAC, Teams & Guards"
Cohesion: 0.06
Nodes (14): CreateRoleDto, CreateTeamDto, InviteUserDto, JwtAuthGuard, MessagesController, PermissionsGuard, RolesController, RolesModule (+6 more)

### Community 3 - "Frontend Auth & Data Layer"
Cohesion: 0.05
Nodes (0): 

### Community 4 - "CRM Pipeline DTOs"
Cohesion: 0.06
Nodes (10): CreatePipelineDto, CreateStageDto, MoveContactDto, ReorderStageItem, ReorderStagesDto, UpdatePipelineDto, UpdateStageDto, PipelinesController (+2 more)

### Community 5 - "Frontend Feature Pages"
Cohesion: 0.06
Nodes (18): Contacts Page (route), CRM Kanban Page (route), ConversationMessageBubble Component, ContactsPage Feature Component, KanbanPage Feature Component, CreateFollowUpRuleDto, UpdateFollowUpRuleDto, useAutomation Hook (+10 more)

### Community 6 - "Contact Management DTOs"
Cohesion: 0.07
Nodes (7): AddTagDto, ContactFilterDto, CreateContactDto, UpdateContactDto, ContactsController, ContactsModule, ContactsService

### Community 7 - "Auth Controller"
Cohesion: 0.12
Nodes (6): AuthController, AuthModule, AuthService, JwtStrategy, LoginDto, RegisterDto

### Community 8 - "CRM Data Hooks"
Cohesion: 0.12
Nodes (0): 

### Community 9 - "Teams Service"
Cohesion: 0.29
Nodes (1): TeamsService

### Community 10 - "Users Service"
Cohesion: 0.36
Nodes (1): UsersService

### Community 11 - "Permissions Module"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 12 - "Teams Controller"
Cohesion: 0.22
Nodes (1): TeamsController

### Community 13 - "Conversations Service"
Cohesion: 0.33
Nodes (1): ConversationsService

### Community 14 - "Users Controller"
Cohesion: 0.22
Nodes (1): UsersController

### Community 15 - "Message Routing & Auto-Close"
Cohesion: 0.25
Nodes (9): ConversationsController, ConversationsService, MessagesController, MessagesService, AutoCloseProcessor, FollowUpProcessor, Queue Name Constants, SchedulerService (+1 more)

### Community 16 - "Dashboard Layout Shell"
Cohesion: 0.22
Nodes (9): DashboardLayout Component, MobileDrawer Component, ContextSidebar Component, ConversationListItem Component, GlobalSearch Component, InboxRail Component, NavRail Component, useMessageSearch Hook (+1 more)

### Community 17 - "Automation Canvas UI"
Cohesion: 0.22
Nodes (9): CreateFlowDialog Component, NodeChip Component, NodeEditorPanel Component, Automation Canvas Page (route), Automation List Page (route), FlowCard Component, useFlow Hook, useFlows Hook (+1 more)

### Community 18 - "App Boilerplate"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 19 - "Conversations Controller"
Cohesion: 0.25
Nodes (1): ConversationsController

### Community 20 - "WhatsApp Webhook Handler"
Cohesion: 0.36
Nodes (1): WhatsappService

### Community 21 - "Real-time Events Gateway"
Cohesion: 0.25
Nodes (1): EventsGateway

### Community 22 - "Roles Service"
Cohesion: 0.36
Nodes (1): RolesService

### Community 23 - "Automation Flow Executor"
Cohesion: 0.39
Nodes (1): FlowExecutorService

### Community 24 - "Automation CRUD Controller"
Cohesion: 0.25
Nodes (1): AutomationController

### Community 25 - "Flows CRUD Service"
Cohesion: 0.43
Nodes (1): FlowsService

### Community 26 - "BullMQ Scheduler"
Cohesion: 0.29
Nodes (1): SchedulerService

### Community 27 - "Messages Service"
Cohesion: 0.4
Nodes (1): MessagesService

### Community 28 - "Prisma Database Layer"
Cohesion: 0.5
Nodes (1): PrismaService

### Community 29 - "Settings Page UI"
Cohesion: 0.5
Nodes (4): Settings Page (route), AutoCloseSection Component, FollowUpSection Component, SettingsPage Component

### Community 30 - "Product Roadmap"
Cohesion: 0.5
Nodes (4): Phase 10 - SaaS Production Readiness (Planned), Phase 8 - Frontend Unificado (In Progress), Phase 9 - Audit Logs and LGPD Compliance (Planned), Rationale: Consolidate Frontend Before SaaS

### Community 31 - "Permissions Seed"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Contacts API"
Cohesion: 1.0
Nodes (2): ContactsController, ContactsService

### Community 33 - "Prisma Config"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Next.js Types"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Global Types Index"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Backend README"
Cohesion: 1.0
Nodes (1): NestJS Backend App (boilerplate README)

### Community 38 - "App Module"
Cohesion: 1.0
Nodes (1): AppModule

### Community 39 - "Queues Module"
Cohesion: 1.0
Nodes (1): QueuesModule

### Community 40 - "Flow Delay Processor"
Cohesion: 1.0
Nodes (1): FlowDelayProcessor

### Community 41 - "Conversations Module"
Cohesion: 1.0
Nodes (1): ConversationsModule

### Community 42 - "Messages Module"
Cohesion: 1.0
Nodes (1): MessagesModule

### Community 43 - "Contacts Module"
Cohesion: 1.0
Nodes (1): ContactsModule

### Community 44 - "Create Contact DTO"
Cohesion: 1.0
Nodes (1): CreateContactDto

### Community 45 - "Update Contact DTO"
Cohesion: 1.0
Nodes (1): UpdateContactDto

### Community 46 - "Add Tag DTO"
Cohesion: 1.0
Nodes (1): AddTagDto

### Community 47 - "Contact Filter DTO"
Cohesion: 1.0
Nodes (1): ContactFilterDto

### Community 48 - "WhatsApp Module"
Cohesion: 1.0
Nodes (1): WhatsappModule

### Community 49 - "Follow-Up Rule DTOs"
Cohesion: 1.0
Nodes (1): FollowUpRule DTOs

### Community 50 - "Workspace Settings DTO"
Cohesion: 1.0
Nodes (1): UpdateWorkspaceSettingsDto

### Community 51 - "Pipeline DTOs"
Cohesion: 1.0
Nodes (1): Pipeline DTOs

### Community 52 - "Flows Service (singleton)"
Cohesion: 1.0
Nodes (1): FlowsService

### Community 53 - "Automation Controller (singleton)"
Cohesion: 1.0
Nodes (1): AutomationController

### Community 54 - "Tooltip Component"
Cohesion: 1.0
Nodes (1): Tooltip UI Component

### Community 55 - "Conversation Thread"
Cohesion: 1.0
Nodes (1): ConversationThread Component

### Community 56 - "Follow-Up Rules Hook"
Cohesion: 1.0
Nodes (1): useFollowUpRules Hook

## Knowledge Gaps
- **89 isolated node(s):** `AppModule`, `QueuesModule`, `PrismaModule`, `UsersModule`, `InviteUserDto` (+84 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Permissions Seed`** (2 nodes): `permissions.seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contacts API`** (2 nodes): `ContactsController`, `ContactsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prisma Config`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Global Types Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend README`** (1 nodes): `NestJS Backend App (boilerplate README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Module`** (1 nodes): `AppModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Queues Module`** (1 nodes): `QueuesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Delay Processor`** (1 nodes): `FlowDelayProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Conversations Module`** (1 nodes): `ConversationsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Messages Module`** (1 nodes): `MessagesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contacts Module`** (1 nodes): `ContactsModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Contact DTO`** (1 nodes): `CreateContactDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update Contact DTO`** (1 nodes): `UpdateContactDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Add Tag DTO`** (1 nodes): `AddTagDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contact Filter DTO`** (1 nodes): `ContactFilterDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WhatsApp Module`** (1 nodes): `WhatsappModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Rule DTOs`** (1 nodes): `FollowUpRule DTOs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workspace Settings DTO`** (1 nodes): `UpdateWorkspaceSettingsDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pipeline DTOs`** (1 nodes): `Pipeline DTOs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flows Service (singleton)`** (1 nodes): `FlowsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Automation Controller (singleton)`** (1 nodes): `AutomationController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tooltip Component`** (1 nodes): `Tooltip UI Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Conversation Thread`** (1 nodes): `ConversationThread Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Rules Hook`** (1 nodes): `useFollowUpRules Hook`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FlowExecutorService` connect `NestJS Backend Core` to `Frontend Feature Pages`, `Message Routing & Auto-Close`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `AppModule`, `QueuesModule`, `PrismaModule` to the rest of the system?**
  _89 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend UI Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `NestJS Backend Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `RBAC, Teams & Guards` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Frontend Auth & Data Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `CRM Pipeline DTOs` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._