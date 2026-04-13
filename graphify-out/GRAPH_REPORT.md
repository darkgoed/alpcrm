# Graph Report - clippings/Whatsapp Cloud API  (2026-04-13)

## Corpus Check
- Corpus is ~45,479 words - fits in a single context window. You may not need a graph.

## Summary
- 301 nodes · 344 edges · 45 communities detected
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `Phone Number ID (CSID)` - 19 edges
2. `TeamsService` - 11 edges
3. `TeamsController` - 9 edges
4. `EventsGateway` - 8 edges
5. `RolesService` - 8 edges
6. `PrismaService` - 7 edges
7. `RolesController` - 7 edges
8. `Phone Number Verify Code API` - 6 edges
9. `WhatsApp Business Account Phone Number API` - 6 edges
10. `WhatsApp Cloud API Error Codes` - 6 edges

## Surprising Connections (you probably didn't know these)
- `KanbanPage Feature Component` --shares_data_with--> `PipelinesService`  [INFERRED]
  frontend/src/features/crm/components/kanban-page.tsx → backend/src/pipelines/pipelines.service.ts
- `useAutomation Hook` --shares_data_with--> `FlowExecutorService`  [INFERRED]
  frontend/src/hooks/useAutomation.ts → backend/src/automation/flow-executor.service.ts
- `Business Compliance Information API` --semantically_similar_to--> `Official Business Account Status API`  [INFERRED] [semantically similar]
  clippings/Whatsapp Cloud API/WhatsApp Business Cloud API - Business Compliance Information API.md → clippings/Whatsapp Cloud API/WhatsApp Business Account Official Business Account Status API.md
- `WhatsApp Business Account Phone Number API` --semantically_similar_to--> `WhatsApp Account Number API`  [INFERRED] [semantically similar]
  clippings/Whatsapp Cloud API/WhatsApp Business Account Phone Number API.md → clippings/Whatsapp Cloud API/WhatsApp Business API - WhatsApp Account Number API.md
- `QR Code Management API` --semantically_similar_to--> `QR Code Individual API`  [INFERRED] [semantically similar]
  clippings/Whatsapp Cloud API/WhatsApp Cloud API - WhatsApp Business QR Code Management API.md → clippings/Whatsapp Cloud API/WhatsApp Cloud API - WhatsApp Business QR Code API.md

## Hyperedges (group relationships)
- **BullMQ Queue Processing Pattern** — queues_SchedulerService, queues_FlowDelayProcessor, queues_FollowUpProcessor, queues_AutoCloseProcessor [EXTRACTED 0.95]
- **Operator Reply Flow** — messages_MessagesService, whatsapp_WhatsappService, queues_SchedulerService [EXTRACTED 0.95]
- **Flow Execution Pipeline** — automation_flowexecutor, queues_SchedulerService, queues_FlowDelayProcessor [EXTRACTED 0.95]
- **CRM Kanban Full-Stack** — pipelines_service, hooks_usecontacts, features_crm_kanbanpage [INFERRED 0.85]
- **Automation Canvas Editing Flow** — app_automation_page, app_automation_id_page, flow_card_flowcard, app_automation_createflowdialog [EXTRACTED 0.95]
- **Phone Number Lifecycle: Register, Verify, Deregister** — request_code_api, verify_code_api, phone_registration_api, deregister_api [EXTRACTED 0.95]
- **All Phone-Number-ID Scoped APIs** — message_api, media_upload_api, marketing_messages_api, business_profile_api, qr_management_api, block_api, settings_api, commerce_settings_api, calling_api, business_encryption_api, business_compliance_api, groups_management_api, oba_status_api, phone_number_api [EXTRACTED 1.00]
- **Unified Error Handling with GraphAPIError and Rate Limits** — error_codes_doc, graph_api_error, rate_limiting [EXTRACTED 1.00]

## Communities

### Community 0 - "Frontend UI Components"
Cohesion: 0.05
Nodes (6): FormControl(), useFormField(), getErrorMessage(), onSubmit(), getErrorMessage(), onSubmit()

### Community 1 - "WhatsApp Cloud API Endpoints"
Cohesion: 0.09
Nodes (37): WhatsApp Account Number API, Assigned Users Management API, Bearer Auth (OAuth Token), Block Users API, Business Compliance Information API, Business Compliance Info Schema, Business Encryption API, WhatsApp Business Profile API (+29 more)

### Community 2 - "NestJS DTOs & Decorators"
Cohesion: 0.08
Nodes (9): CreateRoleDto, CreateTeamDto, JwtAuthGuard, PermissionsGuard, RolesController, RolesModule, TeamsModule, UpdateRolePermissionsDto (+1 more)

### Community 3 - "Auth Controller"
Cohesion: 0.12
Nodes (6): AuthController, AuthModule, AuthService, JwtStrategy, LoginDto, RegisterDto

### Community 4 - "WebSocket Events Gateway"
Cohesion: 0.1
Nodes (4): EventsGateway, GatewayModule, WebhookSignatureGuard, WhatsappController

### Community 5 - "Frontend Pages & Features"
Cohesion: 0.11
Nodes (17): CRM Kanban Page (route), FlowExecutorService, AutomationModule, ConversationMessageBubble Component, KanbanPage Feature Component, useAutomation Hook, useConversations Hook, useWorkspaceSettings Hook (+9 more)

### Community 6 - "Auth Context & Layout"
Cohesion: 0.14
Nodes (0): 

### Community 7 - "Teams Service"
Cohesion: 0.29
Nodes (1): TeamsService

### Community 8 - "Permissions Controller"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 9 - "Teams Controller"
Cohesion: 0.22
Nodes (1): TeamsController

### Community 10 - "App Controller"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 11 - "Roles Service"
Cohesion: 0.36
Nodes (1): RolesService

### Community 12 - "Automation UI"
Cohesion: 0.25
Nodes (8): CreateFlowDialog Component, NodeChip Component, NodeEditorPanel Component, Automation Canvas Page (route), Automation List Page (route), FlowCard Component, useFlow Hook, useFlows Hook

### Community 13 - "Flow DTOs"
Cohesion: 0.5
Nodes (3): CreateFlowDto, CreateFlowNodeDto, UpdateFlowDto

### Community 14 - "Permissions Seed"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Users Module"
Cohesion: 1.0
Nodes (1): UsersModule

### Community 16 - "Invite User DTO"
Cohesion: 1.0
Nodes (1): InviteUserDto

### Community 17 - "Update User DTO"
Cohesion: 1.0
Nodes (1): UpdateUserDto

### Community 18 - "Assign Conversation DTO"
Cohesion: 1.0
Nodes (1): AssignConversationDto

### Community 19 - "Send Message DTO"
Cohesion: 1.0
Nodes (1): SendMessageDto

### Community 20 - "Prisma Config"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "E2E Tests"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Flow Delay Processor"
Cohesion: 1.0
Nodes (1): FlowDelayProcessor

### Community 23 - "Follow-Up Processor"
Cohesion: 1.0
Nodes (1): FollowUpProcessor

### Community 24 - "Queues Module"
Cohesion: 1.0
Nodes (1): QueuesModule

### Community 25 - "Auto-Close Processor"
Cohesion: 1.0
Nodes (1): AutoCloseProcessor

### Community 26 - "Messages Module"
Cohesion: 1.0
Nodes (1): MessagesModule

### Community 27 - "Create Contact DTO"
Cohesion: 1.0
Nodes (1): CreateContactDto

### Community 28 - "Update Contact DTO"
Cohesion: 1.0
Nodes (1): UpdateContactDto

### Community 29 - "Add Tag DTO"
Cohesion: 1.0
Nodes (1): AddTagDto

### Community 30 - "Contact Filter DTO"
Cohesion: 1.0
Nodes (1): ContactFilterDto

### Community 31 - "WhatsApp Module"
Cohesion: 1.0
Nodes (1): WhatsappModule

### Community 32 - "Workspaces Module"
Cohesion: 1.0
Nodes (1): WorkspacesModule

### Community 33 - "Follow-Up Rule DTO"
Cohesion: 1.0
Nodes (1): FollowUpRule DTOs

### Community 34 - "Pipelines Module"
Cohesion: 1.0
Nodes (1): PipelinesModule

### Community 35 - "Pipelines DTO"
Cohesion: 1.0
Nodes (1): Pipeline DTOs

### Community 36 - "Automation Controller"
Cohesion: 1.0
Nodes (1): AutomationController

### Community 37 - "Flows Service"
Cohesion: 1.0
Nodes (1): FlowsService

### Community 38 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Next.js Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Message Bubble"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "UI Tooltip"
Cohesion: 1.0
Nodes (1): Tooltip UI Component

### Community 42 - "Contacts Page"
Cohesion: 1.0
Nodes (1): Contacts Page (route)

### Community 43 - "Settings Page"
Cohesion: 1.0
Nodes (1): Settings Page (route)

### Community 44 - "NestJS App Readme"
Cohesion: 1.0
Nodes (1): NestJS Backend App (boilerplate README)

## Knowledge Gaps
- **61 isolated node(s):** `FlowDelayProcessor`, `FollowUpProcessor`, `QueuesModule`, `AutoCloseProcessor`, `PrismaModule` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Permissions Seed`** (2 nodes): `permissions.seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Users Module`** (2 nodes): `users.module.ts`, `UsersModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Invite User DTO`** (2 nodes): `invite-user.dto.ts`, `InviteUserDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Update User DTO`** (2 nodes): `update-user.dto.ts`, `UpdateUserDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Assign Conversation DTO`** (2 nodes): `assign-conversation.dto.ts`, `AssignConversationDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Send Message DTO`** (2 nodes): `send-message.dto.ts`, `SendMessageDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prisma Config`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `E2E Tests`** (1 nodes): `app.e2e-spec.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Delay Processor`** (1 nodes): `FlowDelayProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Processor`** (1 nodes): `FollowUpProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Queues Module`** (1 nodes): `QueuesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auto-Close Processor`** (1 nodes): `AutoCloseProcessor`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Messages Module`** (1 nodes): `MessagesModule`
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
- **Thin community `Workspaces Module`** (1 nodes): `WorkspacesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Rule DTO`** (1 nodes): `FollowUpRule DTOs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pipelines Module`** (1 nodes): `PipelinesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pipelines DTO`** (1 nodes): `Pipeline DTOs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Automation Controller`** (1 nodes): `AutomationController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flows Service`** (1 nodes): `FlowsService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Env Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Message Bubble`** (1 nodes): `MessageBubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `UI Tooltip`** (1 nodes): `Tooltip UI Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contacts Page`** (1 nodes): `Contacts Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Page`** (1 nodes): `Settings Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `NestJS App Readme`** (1 nodes): `NestJS Backend App (boilerplate README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PrismaService` connect `Frontend Pages & Features` to `Permissions Controller`, `NestJS DTOs & Decorators`, `Auth Controller`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `TeamsService` connect `Teams Service` to `NestJS DTOs & Decorators`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `FlowDelayProcessor`, `FollowUpProcessor`, `QueuesModule` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `WhatsApp Cloud API Endpoints` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `NestJS DTOs & Decorators` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Auth Controller` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._