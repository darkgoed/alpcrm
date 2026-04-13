# Graph Report - .  (2026-04-13)

## Corpus Check
- 186 files · ~60,044 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 762 nodes · 1063 edges · 53 communities detected
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.88)
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
- `Minimal Context Editing` --semantically_similar_to--> `Operational Agent Guide`  [INFERRED] [semantically similar]
  CLAUDE.md → AGENTS.md
- `Template Conversation Initiation` --conceptually_related_to--> `Cloud API Completeness`  [INFERRED]
  backend/src/conversations/conversations.service.ts → ROADMAP.md
- `Contact Import and Tagging` --conceptually_related_to--> `Inbox and CRM Operations`  [INFERRED]
  backend/src/contacts/contacts.service.ts → ROADMAP.md
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
- **WhatsApp Cloud Message API Surface** — whatsapp_cloud_message_api_doc, whatsapp_messages_endpoint, messages_service, whatsapp_service, templates_service, whatsapp_webhook_payload [INFERRED 0.90]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.03
Nodes (6): FormControl(), useFormField(), getErrorMessage(), onSubmit(), getErrorMessage(), onSubmit()

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (35): AppModule, AssignConversationDto, AutoCloseProcessor, AutomationModule, ConversationsModule, CreateTemplateDto, FlowDelayProcessor, FollowUpProcessor (+27 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (22): ConversationMessageBubble Component, ConversationThread Component, Conversation Thread, CreateQuickReplyDto, CreateRoleDto, CreateTeamDto, Frontend Conversation Type, Frontend Message Type (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (2): close(), goToConversation()

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (8): AddTagDto, ContactFilterDto, CreateContactDto, UpdateContactDto, ContactImportProcessor, ContactsController, ContactsModule, ContactsService

### Community 5 - "Community 5"
Cohesion: 0.05
Nodes (16): CreateFollowUpRuleDto, Follow-Up Rule DTOs, CreateFollowUpRuleDto, UpdateFollowUpRuleDto, useAutomation Hook, useConversations Hook, useWorkspaceSettings Hook, API Axios Client (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (17): CRM Kanban Page (route), Create Pipeline DTO, Create Stage DTO, KanbanPage Feature Component, Move Contact DTO, CreatePipelineDto, CreateStageDto, MoveContactDto (+9 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (35): Add Tag DTO, App Module Domain Wiring, JWT Module Registration, Token Signing, Automation Flow Endpoints, Contact Filter DTO, Workspace Scoped Contacts, Contact Import and Tagging (+27 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (7): AuthController, AuthModule, AuthService, Workspace Bootstrap, JwtStrategy, LoginDto, RegisterDto

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (5): AutomationController, CreateFlowDto, CreateFlowNodeDto, UpdateFlowDto, FlowsService

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (2): RolesController, RolesService

### Community 11 - "Community 11"
Cohesion: 0.35
Nodes (1): UsersService

### Community 12 - "Community 12"
Cohesion: 0.29
Nodes (1): TeamsService

### Community 13 - "Community 13"
Cohesion: 0.25
Nodes (1): WhatsappService

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (1): TemplatesService

### Community 15 - "Community 15"
Cohesion: 0.2
Nodes (1): UsersController

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (1): ConversationsService

### Community 17 - "Community 17"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (1): TeamsController

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (1): ConversationsController

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (0): 

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (1): EventsGateway

### Community 23 - "Community 23"
Cohesion: 0.39
Nodes (1): FlowExecutorService

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (0): 

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (8): CreateFlowDialog Component, NodeChip Component, NodeEditorPanel Component, Automation Canvas Page (route), Automation List Page (route), FlowCard Component, useFlow Hook, useFlows Hook

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (1): SchedulerService

### Community 27 - "Community 27"
Cohesion: 0.38
Nodes (1): QuickRepliesService

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 0.33
Nodes (1): TemplatesController

### Community 31 - "Community 31"
Cohesion: 0.33
Nodes (1): QuickRepliesController

### Community 32 - "Community 32"
Cohesion: 0.33
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 0.5
Nodes (1): WhatsappController

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): MessagesModule

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Tooltip UI Component

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (0): 

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): Contacts Page (route)

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Settings Page (route)

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): Date Utilities

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): NestJS Backend App (boilerplate README)

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): TRIPZ

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): Browser Window Icon

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Next.js Logo

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): File Icon

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Vercel Logo

## Knowledge Gaps
- **81 isolated node(s):** `AppModule`, `TemplatesModule`, `CreateTemplateDto`, `QueuesModule`, `PrismaModule` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 35`** (2 nodes): `permissions.seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `MessagesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `MessageBubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `Tooltip UI Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `Contacts Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Settings Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `Date Utilities`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `NestJS Backend App (boilerplate README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `TRIPZ`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Browser Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Next.js Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Vercel Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `App Module Domain Wiring` connect `Community 7` to `Community 4`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `AppModule`, `TemplatesModule`, `CreateTemplateDto` to the rest of the system?**
  _81 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._