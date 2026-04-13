# Graph Report - .  (2026-04-13)

## Corpus Check
- 184 files · ~51,182 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 752 nodes · 1040 edges · 48 communities detected
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `ContactsService` - 18 edges
2. `ContactsController` - 14 edges
3. `WorkspacesService` - 13 edges
4. `WorkspacesController` - 13 edges
5. `PipelinesController` - 13 edges
6. `PipelinesService` - 13 edges
7. `UsersService` - 11 edges
8. `TeamsService` - 11 edges
9. `WhatsappService` - 11 edges
10. `TemplatesService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Contact Import and Tagging` --conceptually_related_to--> `Inbox and CRM Operations`  [INFERRED]
  backend/src/contacts/contacts.service.ts → ROADMAP.md
- `Minimal Context Editing` --semantically_similar_to--> `Operational Agent Guide`  [INFERRED] [semantically similar]
  CLAUDE.md → AGENTS.md
- `Template Conversation Initiation` --conceptually_related_to--> `Cloud API Completeness`  [INFERRED]
  backend/src/conversations/conversations.service.ts → ROADMAP.md
- `Conversation Access Control` --conceptually_related_to--> `Inbox and CRM Operations`  [INFERRED]
  backend/src/conversations/conversations.service.ts → ROADMAP.md
- `Security Hardening` --rationale_for--> `API Prefix and Raw Body`  [EXTRACTED]
  ROADMAP.md → backend/src/main.ts

## Hyperedges (group relationships)
- **CRM Kanban Full-Stack** — pipelines_service, hooks_usecontacts, features_crm_kanbanpage [INFERRED 0.85]
- **Automation Canvas Editing Flow** — app_automation_page, app_automation_id_page, flow_card_flowcard, app_automation_createflowdialog [EXTRACTED 0.95]
- **JWT Permission Path** — auth_service_token_signing, jwt_strategy_workspace_permissions_claims, permissions_guard_permission_claims [INFERRED 0.86]
- **Workspace CRM Surface** — contacts_module, contacts_controller_workspace_scoped_contacts, contacts_service_import_and_tagging, conversations_controller_workspace_scoped_conversations, conversations_service_access_control [INFERRED 0.90]
- **Automation Flow Stack** — automation_controller_workspace_scoped_flows, flows_service_workspace_scoped_flow_crud, flow_executor_trigger_and_state, flow_executor_message_and_delay_execution, flow_executor_stop_bot_on_reply [INFERRED 0.87]
- **Webhook Handling Path** — whatsapp_cloud_config, whatsapp_config_webhook_verification, main_api_prefix_and_raw_body, webhook_signature_guard_hmac_validation [INFERRED 0.88]
- **Operator Message Flow** — messages_controller, messages_service, events_gateway, whatsapp_service, scheduler_service, flow_executor_service [INFERRED 0.86]
- **Pipeline Management Surface** — pipelines_controller, pipelines_service, create_pipeline_dto, update_pipeline_dto, create_stage_dto, update_stage_dto, reorder_stages_dto, move_contact_dto [INFERRED 0.90]
- **Queue Processing Stack** — scheduler_service, auto_close_processor, follow_up_processor, flow_delay_processor [INFERRED 0.84]
- **Workspace Settings Full-Stack** — workspaces_controller, workspaces_service, update_workspace_settings_dto [INFERRED 0.88]
- **WhatsApp Webhook Payload Model** — whatsapp_webhook_payload, whatsapp_message, whatsapp_contact, whatsapp_status [EXTRACTED 1.00]
- **Conversation UI Message Flow** — conversation_thread_component, conversation_message_bubble_component, frontend_message_type [INFERRED 0.85]

## Communities

### Community 0 - "Agents UI"
Cohesion: 0.02
Nodes (8): close(), goToConversation(), FormControl(), useFormField(), getErrorMessage(), onSubmit(), getErrorMessage(), onSubmit()

### Community 1 - "Core Backend"
Cohesion: 0.04
Nodes (27): AppModule, AssignConversationDto, AutoCloseProcessor, AutomationModule, ConversationsModule, CreateTemplateDto, FlowDelayProcessor, FollowUpProcessor (+19 more)

### Community 2 - "Automation Settings"
Cohesion: 0.05
Nodes (16): CreateFollowUpRuleDto, Follow-Up Rule DTOs, CreateFollowUpRuleDto, UpdateFollowUpRuleDto, useAutomation Hook, useConversations Hook, useWorkspaceSettings Hook, API Axios Client (+8 more)

### Community 3 - "CRM Pipelines"
Cohesion: 0.05
Nodes (17): CRM Kanban Page (route), Create Pipeline DTO, Create Stage DTO, KanbanPage Feature Component, Move Contact DTO, CreatePipelineDto, CreateStageDto, MoveContactDto (+9 more)

### Community 4 - "Conversation Types"
Cohesion: 0.08
Nodes (11): ConversationMessageBubble Component, ConversationThread Component, Conversation Thread, Frontend Conversation Type, Frontend Message Type, InviteUserDto, UpdateUserDto, UsersController (+3 more)

### Community 5 - "Conversation Thread"
Cohesion: 0.06
Nodes (0): 

### Community 6 - "Contacts DTOs"
Cohesion: 0.07
Nodes (13): Add Tag DTO, AddTagDto, ContactFilterDto, CreateContactDto, UpdateContactDto, Contact Filter DTO, ContactImportProcessor, ContactsController (+5 more)

### Community 7 - "Workspace Security"
Cohesion: 0.09
Nodes (30): App Module Domain Wiring, JWT Module Registration, Token Signing, Workspace Bootstrap, Automation Flow Endpoints, Workspace Scoped Conversations, Conversation Access Control, Conversation Events and Bot State (+22 more)

### Community 8 - "Teams Management"
Cohesion: 0.1
Nodes (5): CreateTeamDto, TeamsController, TeamsModule, TeamsService, UpdateTeamDto

### Community 9 - "Permissions and Replies"
Cohesion: 0.09
Nodes (6): CreateQuickReplyDto, PermissionsGuard, QuickRepliesController, QuickRepliesModule, QuickRepliesService, UpdateQuickReplyDto

### Community 10 - "Roles Management"
Cohesion: 0.11
Nodes (5): CreateRoleDto, RolesController, RolesModule, RolesService, UpdateRolePermissionsDto

### Community 11 - "Automation CRUD"
Cohesion: 0.12
Nodes (5): AutomationController, CreateFlowDto, CreateFlowNodeDto, UpdateFlowDto, FlowsService

### Community 12 - "Auth Flow"
Cohesion: 0.12
Nodes (6): AuthController, AuthModule, AuthService, JwtStrategy, LoginDto, RegisterDto

### Community 13 - "Contacts Service"
Cohesion: 0.13
Nodes (1): ContactsService

### Community 14 - "Contacts Hooks"
Cohesion: 0.11
Nodes (0): 

### Community 15 - "Agents Hooks"
Cohesion: 0.12
Nodes (0): 

### Community 16 - "WhatsApp Inbound"
Cohesion: 0.25
Nodes (1): WhatsappService

### Community 17 - "Template Sync"
Cohesion: 0.29
Nodes (1): TemplatesService

### Community 18 - "Conversation Service"
Cohesion: 0.29
Nodes (1): ConversationsService

### Community 19 - "Permissions Catalog"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 20 - "Conversation Controller"
Cohesion: 0.22
Nodes (1): ConversationsController

### Community 21 - "Nest Boilerplate"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 22 - "Realtime Gateway"
Cohesion: 0.25
Nodes (1): EventsGateway

### Community 23 - "Flow Execution"
Cohesion: 0.39
Nodes (1): FlowExecutorService

### Community 24 - "Teams Hooks"
Cohesion: 0.25
Nodes (0): 

### Community 25 - "Automation UI"
Cohesion: 0.25
Nodes (8): CreateFlowDialog Component, NodeChip Component, NodeEditorPanel Component, Automation Canvas Page (route), Automation List Page (route), FlowCard Component, useFlow Hook, useFlows Hook

### Community 26 - "Scheduling"
Cohesion: 0.29
Nodes (1): SchedulerService

### Community 27 - "Messages Controller"
Cohesion: 0.4
Nodes (1): MessagesController

### Community 28 - "Messages Service"
Cohesion: 0.4
Nodes (1): MessagesService

### Community 29 - "WhatsApp Webhook"
Cohesion: 0.5
Nodes (1): WhatsappController

### Community 30 - "Permission Seeds"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Prisma Config"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Messages Module"
Cohesion: 1.0
Nodes (1): MessagesModule

### Community 33 - "Next Config"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Next Typings"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Legacy Message Bubble"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Tooltip UI"
Cohesion: 1.0
Nodes (1): Tooltip UI Component

### Community 37 - "Type Exports"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Contacts Route"
Cohesion: 1.0
Nodes (1): Contacts Page (route)

### Community 39 - "Settings Route"
Cohesion: 1.0
Nodes (1): Settings Page (route)

### Community 40 - "Date Utilities"
Cohesion: 1.0
Nodes (1): Date Utilities

### Community 41 - "Repo README"
Cohesion: 1.0
Nodes (1): NestJS Backend App (boilerplate README)

### Community 42 - "Uploaded Image"
Cohesion: 1.0
Nodes (1): TRIPZ

### Community 43 - "Globe Asset"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 44 - "Window Asset"
Cohesion: 1.0
Nodes (1): Browser Window Icon

### Community 45 - "Next Asset"
Cohesion: 1.0
Nodes (1): Next.js Logo

### Community 46 - "File Asset"
Cohesion: 1.0
Nodes (1): File Icon

### Community 47 - "Vercel Asset"
Cohesion: 1.0
Nodes (1): Vercel Logo

## Knowledge Gaps
- **81 isolated node(s):** `AppModule`, `TemplatesModule`, `CreateTemplateDto`, `QueuesModule`, `PrismaModule` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Permission Seeds`** (2 nodes): `permissions.seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prisma Config`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Messages Module`** (1 nodes): `MessagesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Typings`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Legacy Message Bubble`** (1 nodes): `MessageBubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tooltip UI`** (1 nodes): `Tooltip UI Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Type Exports`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contacts Route`** (1 nodes): `Contacts Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Route`** (1 nodes): `Settings Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Date Utilities`** (1 nodes): `Date Utilities`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Repo README`** (1 nodes): `NestJS Backend App (boilerplate README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Uploaded Image`** (1 nodes): `TRIPZ`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe Asset`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Window Asset`** (1 nodes): `Browser Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Asset`** (1 nodes): `Next.js Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Asset`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel Asset`** (1 nodes): `Vercel Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ContactsService` connect `Contacts Service` to `Contacts DTOs`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `App Module Domain Wiring` connect `Workspace Security` to `Contacts DTOs`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `AppModule`, `TemplatesModule`, `CreateTemplateDto` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agents UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Core Backend` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Automation Settings` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `CRM Pipelines` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._