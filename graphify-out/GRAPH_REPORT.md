# Graph Report - .  (2026-04-15)

## Corpus Check
- 222 files · ~132,375 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1032 nodes · 1491 edges · 103 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `ContactsService` - 34 edges
2. `ContactsController` - 24 edges
3. `WhatsappService` - 21 edges
4. `Phone Number ID (CSID)` - 19 edges
5. `WorkspacesService` - 18 edges
6. `FlowExecutorService` - 17 edges
7. `FlowNodeRunnerService` - 17 edges
8. `ConversationsService` - 15 edges
9. `TemplatesService` - 14 edges
10. `WorkspacesController` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Create Team DTO` --shares_data_with--> `Teams Service`  [INFERRED]
  backend/src/teams/dto/create-team.dto.ts → backend/src/teams/teams.service.ts
- `Update Team DTO` --shares_data_with--> `Teams Service`  [INFERRED]
  backend/src/teams/dto/update-team.dto.ts → backend/src/teams/teams.service.ts
- `Create Quick Reply DTO` --shares_data_with--> `Quick Replies Service`  [INFERRED]
  backend/src/quick-replies/dto/create-quick-reply.dto.ts → backend/src/quick-replies/quick-replies.service.ts
- `Update Quick Reply DTO` --shares_data_with--> `Quick Replies Service`  [INFERRED]
  backend/src/quick-replies/dto/update-quick-reply.dto.ts → backend/src/quick-replies/quick-replies.service.ts
- `Update Role Permissions DTO` --shares_data_with--> `Roles Service`  [INFERRED]
  backend/src/roles/dto/update-role-permissions.dto.ts → backend/src/roles/roles.service.ts

## Hyperedges (group relationships)
- **CRM Kanban Full-Stack** — pipelines_service, hooks_usecontacts, features_crm_kanbanpage [INFERRED 0.85]
- **Automation Canvas Editing Flow** — app_automation_page, app_automation_id_page, flow_card_flowcard, app_automation_createflowdialog [EXTRACTED 0.95]
- **Phone Number Lifecycle: Register, Verify, Deregister** — request_code_api, verify_code_api, phone_registration_api, deregister_api [EXTRACTED 0.95]
- **Unified Error Handling with GraphAPIError and Rate Limits** — error_codes_doc, graph_api_error, rate_limiting [EXTRACTED 1.00]
- **All Phone-Number-ID Scoped APIs** — message_api, media_upload_api, marketing_messages_api, business_profile_api, qr_management_api, block_api, settings_api, commerce_settings_api, calling_api, business_encryption_api, business_compliance_api, groups_management_api, oba_status_api, phone_number_api [EXTRACTED 1.00]
- **Message Send Flow** — messages_controller, messages_service, whatsapp_service, events_gateway, scheduler_service, flow_executor_service [EXTRACTED 1.00]
- **Outbound Conversation Initiation Flow** — conversations_controller, conversations_service, whatsapp_service, events_gateway, initiate_conversation_dto [EXTRACTED 1.00]
- **WebSocket Realtime Layer** — events_gateway, conversations_service, messages_service, prisma_service [EXTRACTED 1.00]
- **BullMQ Queue Processors** — followup_processor, flowreplytimeout_processor, templatepoll_processor, scheduler_service, queues_constants [EXTRACTED 1.00]
- **WhatsApp Inbound Message Processing Flow** — whatsapp_controller, whatsapp_service, flow_executor_service, scheduler_service, events_gateway [EXTRACTED 1.00]
- **Pipeline Stage Change Automation** — pipelines_service, flow_executor_service, prisma_service [EXTRACTED 1.00]
- **AutomationCanvasPage renders FlowCanvas + FlowNodeEditor** — automation_canvas_page, flow_canvas_component, flow_node_editor_component [EXTRACTED 1.00]
- **DashboardLayout shell** — dashboard_layout, hook_use_auth, hook_use_browser_notifications [EXTRACTED 1.00]
- **Conversation Realtime Cluster** — conversationthread_conversationthread, usesocket_usesocket, useconversations_useconversation, messagebubble_conversationmessagebubble [INFERRED 0.85]
- **Settings Management Cluster** — settingsshell_settingsshell, templatessection_templatessection, interactivetemplates_interactivetemplatessection, whatsappaccounts_whatsappaccountssection, usetemplates_usetemplates, useinteractivetemplates_useinteractivetemplates, usewhatsappaccounts_usewhatsappaccounts [INFERRED 0.82]
- **Automation Flow Editor Cluster** — flowcanvas_flowcanvas, flowcard_flowcard, useautomation_useflows, useautomation_useflow, useautomation_flow, useautomation_flownodetype [INFERRED 0.88]
- **Contacts CRM Cluster** — contactspage_contactspage, usecontacts_usecontacts, usecontacts_usetags, usecontacts_usepipelines [INFERRED 0.85]

## Communities

### Community 0 - "Agent Settings UI"
Cohesion: 0.02
Nodes (23): formatTimelineDividerDate(), formatTimelineDividerDateTime(), close(), goToConversation(), FlowNode(), interactiveReplyHandles(), interactiveReplyPreview(), addButton() (+15 more)

### Community 1 - "App Wiring"
Cohesion: 0.04
Nodes (34): CRM Kanban Page (route), AppModule, Auto-Close Processor, AutomationModule, ContactImportProcessor, ContactsModule, ConversationsModule, Create Pipeline DTO (+26 more)

### Community 2 - "Controller DTO Layer"
Cohesion: 0.04
Nodes (32): AssignConversationDto, CreateInteractiveTemplateDto, Create Quick Reply DTO, Create Role DTO, Create Team DTO, CreateTemplateButtonDto, CreateTemplateDto, TemplateVariableExamplesDto (+24 more)

### Community 3 - "WhatsApp Cloud APIs"
Cohesion: 0.09
Nodes (37): WhatsApp Account Number API, Assigned Users Management API, Bearer Auth (OAuth Token), Block Users API, Business Compliance Information API, Business Compliance Info Schema, Business Encryption API, WhatsApp Business Profile API (+29 more)

### Community 4 - "Contacts Service"
Cohesion: 0.09
Nodes (2): calculateResponseMetrics(), ContactsService

### Community 5 - "Contacts Page UI"
Cohesion: 0.06
Nodes (3): handleSave(), handleSubmit(), normalizeCustomFields()

### Community 6 - "Conversation Frontend"
Cohesion: 0.08
Nodes (10): ConversationThread (page), DashboardSidebar, ConversationMessageBubble, assignConversation(), closeConversation(), sendMessage(), useConversation(), useConversations() (+2 more)

### Community 7 - "Contacts Hook API"
Cohesion: 0.08
Nodes (4): ContactsPage, useContacts(), usePipelines(), useTags()

### Community 8 - "Templates Settings UI"
Cohesion: 0.09
Nodes (10): addButton(), handleSave(), parseExamples(), removeButton(), set(), setButton(), TemplatesSection, useTemplates() (+2 more)

### Community 9 - "Contacts Controller"
Cohesion: 0.09
Nodes (1): ContactsController

### Community 10 - "Workspace Settings"
Cohesion: 0.1
Nodes (4): CreateWhatsappAccountDto, TestWhatsappConnectionDto, UpdateWhatsappAccountDto, WorkspacesService

### Community 11 - "WhatsApp Service"
Cohesion: 0.19
Nodes (1): WhatsappService

### Community 12 - "Interactive Templates UI"
Cohesion: 0.13
Nodes (10): buildPayload(), createEmptyForm(), formFromTemplate(), handleSubmit(), newListRow(), newListSection(), newReplyButton(), InteractiveMessageComposer (+2 more)

### Community 13 - "Auth Backend"
Cohesion: 0.13
Nodes (5): AuthController, AuthService, LoginDto, RefreshDto, Register DTO

### Community 14 - "Flow Execution"
Cohesion: 0.24
Nodes (1): FlowExecutorService

### Community 15 - "Flow Node Runner"
Cohesion: 0.25
Nodes (1): FlowNodeRunnerService

### Community 16 - "Conversations Service"
Cohesion: 0.26
Nodes (1): ConversationsService

### Community 17 - "Templates Service"
Cohesion: 0.24
Nodes (1): TemplatesService

### Community 18 - "Workspaces Controller"
Cohesion: 0.14
Nodes (1): WorkspacesController

### Community 19 - "Realtime Gateway"
Cohesion: 0.24
Nodes (1): EventsGateway

### Community 20 - "Pipelines Controller"
Cohesion: 0.15
Nodes (1): PipelinesController

### Community 21 - "Pipelines Service"
Cohesion: 0.15
Nodes (1): PipelinesService

### Community 22 - "Conversations Controller"
Cohesion: 0.18
Nodes (1): ConversationsController

### Community 23 - "Messages Service"
Cohesion: 0.35
Nodes (1): MessagesService

### Community 24 - "Users Controller"
Cohesion: 0.2
Nodes (1): UsersController

### Community 25 - "Webhook Signature Guard"
Cohesion: 0.36
Nodes (2): pruneReplayCache(), WebhookSignatureGuard

### Community 26 - "Flows Service"
Cohesion: 0.42
Nodes (1): FlowsService

### Community 27 - "Scheduler Service"
Cohesion: 0.22
Nodes (1): SchedulerService

### Community 28 - "Teams Controller"
Cohesion: 0.22
Nodes (1): TeamsController

### Community 29 - "Messages Controller"
Cohesion: 0.25
Nodes (2): getRequestBaseUrl(), MessagesController

### Community 30 - "Contact DTOs"
Cohesion: 0.22
Nodes (8): AddTagDto, BulkContactActionDto, ContactFilterDto, CreateContactDto, CreateSavedSegmentDto, MergeContactDto, SetOptInDto, UpdateContactDto

### Community 31 - "Nest App Boilerplate"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 32 - "Interactive Templates Service"
Cohesion: 0.39
Nodes (1): InteractiveTemplatesService

### Community 33 - "Permissions Backend"
Cohesion: 0.25
Nodes (2): PermissionsController, PermissionsService

### Community 34 - "Automation CRUD"
Cohesion: 0.25
Nodes (1): AutomationController

### Community 35 - "Workspace Hooks"
Cohesion: 0.25
Nodes (0): 

### Community 36 - "Teams Hooks"
Cohesion: 0.25
Nodes (0): 

### Community 37 - "Roles Hooks"
Cohesion: 0.29
Nodes (0): 

### Community 38 - "Auth Guards & Types"
Cohesion: 0.29
Nodes (7): AutomationController, CurrentUser Decorator, FlowsService, AuthenticatedUser Interface, JwtPayload Interface, JwtStrategy, PermissionsGuard

### Community 39 - "Interactive Templates API"
Cohesion: 0.33
Nodes (1): InteractiveTemplatesController

### Community 40 - "Quick Replies Hook"
Cohesion: 0.33
Nodes (0): 

### Community 41 - "Automation Canvas"
Cohesion: 0.33
Nodes (6): AutomationCanvasPage, FlowCanvas Component, FlowNodeEditor Component, useFlow Hook, NodeDraft Interface, ScrollArea UI Component

### Community 42 - "Shared CRM Types"
Cohesion: 0.33
Nodes (6): Contact Interface, Conversation Interface, Interactive Payload Interface, Message Interface, Message Kind Type, User Interface

### Community 43 - "Flow DTOs"
Cohesion: 0.4
Nodes (4): CreateFlowDto, CreateFlowEdgeDto, CreateFlowNodeDto, UpdateFlowDto

### Community 44 - "Flow Examples"
Cohesion: 0.4
Nodes (5): Flow: Menu Principal, Missing Node Type: send_media, Flow: Submenu, Flow: Resposta Imagem, Flow: Resposta Texto

### Community 45 - "Automation Module"
Cohesion: 0.5
Nodes (3): AutomationModule, FlowExecutorService, FlowNodeRunnerService

### Community 46 - "Queue Scheduling"
Cohesion: 0.5
Nodes (4): Queue: auto-close, Queue: flow-delay, Queue: follow-up, SchedulerService

### Community 47 - "Automation List UI"
Cohesion: 0.67
Nodes (3): CreateFlowDialog Component, Automation List Page (route), useFlows Hook

### Community 48 - "WhatsApp Setup Docs"
Cohesion: 0.67
Nodes (3): WhatsApp Cloud Config, Temporary Access Token, Webhook Verification Setup

### Community 49 - "Roadmap Overview"
Cohesion: 0.67
Nodes (3): Minimum Operational Base Definition, Roadmap Phase 1: WhatsApp Cloud API, Roadmap Phase 4: Security

### Community 50 - "Dashboard Auth Shell"
Cohesion: 0.67
Nodes (3): DashboardLayout, useAuth Hook (AuthContext), useBrowserNotifications Hook

### Community 51 - "Permissions Seed"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Flow Finalization"
Cohesion: 1.0
Nodes (2): Missing Node Type: close_conversation, Flow: Finalizar

### Community 53 - "Auth Core"
Cohesion: 1.0
Nodes (2): AuthController, AuthService

### Community 54 - "Prisma Config"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "JWT Registration"
Cohesion: 1.0
Nodes (1): JWT Module Registration

### Community 56 - "Messages Module"
Cohesion: 1.0
Nodes (1): MessagesModule

### Community 57 - "Follow-Up Rule DTO"
Cohesion: 1.0
Nodes (1): CreateFollowUpRuleDto

### Community 58 - "Follow-Up Update DTO"
Cohesion: 1.0
Nodes (1): UpdateFollowUpRuleDto

### Community 59 - "Workspace Settings DTO"
Cohesion: 1.0
Nodes (1): UpdateWorkspaceSettingsDto

### Community 60 - "Next Config"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Next Env Types"
Cohesion: 1.0
Nodes (0): 

### Community 62 - "Legacy Message Bubble"
Cohesion: 1.0
Nodes (0): 

### Community 63 - "Tooltip UI"
Cohesion: 1.0
Nodes (1): Tooltip UI Component

### Community 64 - "Barrel Export"
Cohesion: 1.0
Nodes (0): 

### Community 65 - "Contacts Route"
Cohesion: 1.0
Nodes (1): Contacts Page (route)

### Community 66 - "Settings Route"
Cohesion: 1.0
Nodes (1): Settings Page (route)

### Community 67 - "Date Utilities"
Cohesion: 1.0
Nodes (1): Date Utilities

### Community 68 - "Axios Client"
Cohesion: 1.0
Nodes (1): API Axios Client

### Community 69 - "Backend README"
Cohesion: 1.0
Nodes (1): NestJS Backend App (boilerplate README)

### Community 70 - "Tripz Asset"
Cohesion: 1.0
Nodes (1): TRIPZ

### Community 71 - "Globe Asset"
Cohesion: 1.0
Nodes (1): Globe Icon

### Community 72 - "Browser Asset"
Cohesion: 1.0
Nodes (1): Browser Window Icon

### Community 73 - "Next.js Asset"
Cohesion: 1.0
Nodes (1): Next.js Logo

### Community 74 - "File Asset"
Cohesion: 1.0
Nodes (1): File Icon

### Community 75 - "Vercel Asset"
Cohesion: 1.0
Nodes (1): Vercel Logo

### Community 76 - "Back to Menu Flow"
Cohesion: 1.0
Nodes (1): Flow: Voltar ao Menu

### Community 77 - "WhatsApp Hub"
Cohesion: 1.0
Nodes (1): WhatsappService (hub)

### Community 78 - "Flow Executor Hub"
Cohesion: 1.0
Nodes (1): FlowExecutorService (hub)

### Community 79 - "Contact Import Queue"
Cohesion: 1.0
Nodes (1): Queue: contact-import

### Community 80 - "Templates Poll Queue"
Cohesion: 1.0
Nodes (1): Queue: templates-poll

### Community 81 - "App Module"
Cohesion: 1.0
Nodes (1): AppModule

### Community 82 - "Refresh DTO"
Cohesion: 1.0
Nodes (1): RefreshDto

### Community 83 - "String Value Helper"
Cohesion: 1.0
Nodes (0): 

### Community 84 - "Create Flow DTO"
Cohesion: 1.0
Nodes (1): CreateFlowDto

### Community 85 - "System Permissions"
Cohesion: 1.0
Nodes (1): SYSTEM_PERMISSIONS Seed Data

### Community 86 - "Inbox CRM Roadmap"
Cohesion: 1.0
Nodes (1): Roadmap Phase 2: Inbox CRM

### Community 87 - "Automation Roadmap"
Cohesion: 1.0
Nodes (1): Roadmap Phase 3: Automation v2

### Community 88 - "Reliability Roadmap"
Cohesion: 1.0
Nodes (1): Roadmap Phase 5: Messaging Reliability

### Community 89 - "QA Observability Roadmap"
Cohesion: 1.0
Nodes (1): Roadmap Phase 6: Observability QA

### Community 90 - "Scale Roadmap"
Cohesion: 1.0
Nodes (1): Roadmap Phase 7: Scale Intelligence

### Community 91 - "Contact Import Constant"
Cohesion: 1.0
Nodes (1): CONTACT_IMPORT_QUEUE

### Community 92 - "Quick Replies Controller"
Cohesion: 1.0
Nodes (1): QuickRepliesController

### Community 93 - "Create Template DTO"
Cohesion: 1.0
Nodes (1): CreateTemplateDto

### Community 94 - "Follow-Up Job Data"
Cohesion: 1.0
Nodes (1): FollowUpJobData Interface

### Community 95 - "Reply Timeout Job Data"
Cohesion: 1.0
Nodes (1): FlowReplyTimeoutJobData Interface

### Community 96 - "WhatsApp Account Update DTO"
Cohesion: 1.0
Nodes (1): UpdateWhatsappAccountDto

### Community 97 - "WhatsApp Connection Test DTO"
Cohesion: 1.0
Nodes (1): TestWhatsappConnectionDto

### Community 98 - "Flow Canvas Type"
Cohesion: 1.0
Nodes (1): FlowCanvas

### Community 99 - "Settings Shell"
Cohesion: 1.0
Nodes (1): SettingsShell

### Community 100 - "Flow Type"
Cohesion: 1.0
Nodes (1): Flow (type)

### Community 101 - "Flow Node Type"
Cohesion: 1.0
Nodes (1): FlowNodeType (type)

### Community 102 - "Auth Response Type"
Cohesion: 1.0
Nodes (1): Auth Response Interface

## Knowledge Gaps
- **137 isolated node(s):** `AppModule`, `TemplatesModule`, `TemplateVariableExamplesDto`, `CreateTemplateButtonDto`, `CreateTemplateDto` (+132 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Permissions Seed`** (2 nodes): `permissions.seed.ts`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Finalization`** (2 nodes): `Missing Node Type: close_conversation`, `Flow: Finalizar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Core`** (2 nodes): `AuthController`, `AuthService`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Prisma Config`** (1 nodes): `prisma.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `JWT Registration`** (1 nodes): `JWT Module Registration`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Messages Module`** (1 nodes): `MessagesModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Rule DTO`** (1 nodes): `CreateFollowUpRuleDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Update DTO`** (1 nodes): `UpdateFollowUpRuleDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Workspace Settings DTO`** (1 nodes): `UpdateWorkspaceSettingsDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next Env Types`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Legacy Message Bubble`** (1 nodes): `MessageBubble.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tooltip UI`** (1 nodes): `Tooltip UI Component`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Barrel Export`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contacts Route`** (1 nodes): `Contacts Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Route`** (1 nodes): `Settings Page (route)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Date Utilities`** (1 nodes): `Date Utilities`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Axios Client`** (1 nodes): `API Axios Client`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Backend README`** (1 nodes): `NestJS Backend App (boilerplate README)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tripz Asset`** (1 nodes): `TRIPZ`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Globe Asset`** (1 nodes): `Globe Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Browser Asset`** (1 nodes): `Browser Window Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Asset`** (1 nodes): `Next.js Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `File Asset`** (1 nodes): `File Icon`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vercel Asset`** (1 nodes): `Vercel Logo`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Back to Menu Flow`** (1 nodes): `Flow: Voltar ao Menu`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WhatsApp Hub`** (1 nodes): `WhatsappService (hub)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Executor Hub`** (1 nodes): `FlowExecutorService (hub)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contact Import Queue`** (1 nodes): `Queue: contact-import`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Templates Poll Queue`** (1 nodes): `Queue: templates-poll`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `App Module`** (1 nodes): `AppModule`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Refresh DTO`** (1 nodes): `RefreshDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `String Value Helper`** (1 nodes): `stringValue()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Flow DTO`** (1 nodes): `CreateFlowDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `System Permissions`** (1 nodes): `SYSTEM_PERMISSIONS Seed Data`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Inbox CRM Roadmap`** (1 nodes): `Roadmap Phase 2: Inbox CRM`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Automation Roadmap`** (1 nodes): `Roadmap Phase 3: Automation v2`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reliability Roadmap`** (1 nodes): `Roadmap Phase 5: Messaging Reliability`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `QA Observability Roadmap`** (1 nodes): `Roadmap Phase 6: Observability QA`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scale Roadmap`** (1 nodes): `Roadmap Phase 7: Scale Intelligence`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Contact Import Constant`** (1 nodes): `CONTACT_IMPORT_QUEUE`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Quick Replies Controller`** (1 nodes): `QuickRepliesController`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Create Template DTO`** (1 nodes): `CreateTemplateDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Follow-Up Job Data`** (1 nodes): `FollowUpJobData Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Reply Timeout Job Data`** (1 nodes): `FlowReplyTimeoutJobData Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WhatsApp Account Update DTO`** (1 nodes): `UpdateWhatsappAccountDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WhatsApp Connection Test DTO`** (1 nodes): `TestWhatsappConnectionDto`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Canvas Type`** (1 nodes): `FlowCanvas`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Settings Shell`** (1 nodes): `SettingsShell`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Type`** (1 nodes): `Flow (type)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flow Node Type`** (1 nodes): `FlowNodeType (type)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Auth Response Type`** (1 nodes): `Auth Response Interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ContactsService` connect `Contacts Service` to `App Wiring`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `ContactsController` connect `Contacts Controller` to `Controller DTO Layer`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `WhatsappService` connect `WhatsApp Service` to `App Wiring`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `AppModule`, `TemplatesModule`, `TemplateVariableExamplesDto` to the rest of the system?**
  _137 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Settings UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `App Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Controller DTO Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._