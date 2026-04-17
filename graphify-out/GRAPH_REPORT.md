# Graph Report - backend/src + frontend/src  (2026-04-17)

## Corpus Check
- 210 files · ~86,701 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1090 nodes · 1759 edges · 46 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `ContactsService` - 34 edges
2. `ContactsController` - 24 edges
3. `WhatsappService` - 21 edges
4. `FlowNodeRunnerService` - 19 edges
5. `WorkspacesService` - 18 edges
6. `FlowExecutorService` - 17 edges
7. `ConversationsService` - 15 edges
8. `TemplatesService` - 14 edges
9. `WorkspacesController` - 14 edges
10. `EventsGateway` - 14 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Admin UI & Forms"
Cohesion: 0.02
Nodes (16): formatTimelineDividerDate(), formatTimelineDividerDateTime(), isRecord(), parseFlowJson(), addButton(), addRow(), removeButton(), set() (+8 more)

### Community 1 - "Backend Module Wiring"
Cohesion: 0.03
Nodes (34): AppModule, AuditModule, AuditService, AutoCloseProcessor, AutomationModule, ContactImportProcessor, ContactsModule, ConversationsModule (+26 more)

### Community 2 - "DTOs & Cross-Module Controllers"
Cohesion: 0.03
Nodes (32): AssignConversationDto, CreateFlowDto, CreateFlowEdgeDto, CreateFlowNodeDto, UpdateFlowDto, CreateInteractiveTemplateDto, CreateQuickReplyDto, CreateRoleDto (+24 more)

### Community 3 - "Conversation Sidebar UI"
Cohesion: 0.02
Nodes (11): close(), getMessagePreview(), goToConversation(), handleAddTag(), handleAssignmentSave(), handleContactSave(), handleMoveToPipeline(), handleRemoveFromPipeline() (+3 more)

### Community 4 - "Templates Section UI"
Cohesion: 0.05
Nodes (6): addButton(), handleSave(), parseExamples(), removeButton(), set(), setButton()

### Community 5 - "Pipeline DTOs"
Cohesion: 0.06
Nodes (10): CreatePipelineDto, CreateStageDto, MoveContactDto, ReorderStageItem, ReorderStagesDto, UpdatePipelineDto, UpdateStageDto, PipelinesController (+2 more)

### Community 6 - "Contacts Service"
Cohesion: 0.09
Nodes (2): calculateResponseMetrics(), ContactsService

### Community 7 - "Contacts Page UI"
Cohesion: 0.06
Nodes (3): handleSave(), handleSubmit(), normalizeCustomFields()

### Community 8 - "Contacts Controller"
Cohesion: 0.09
Nodes (1): ContactsController

### Community 9 - "Auth Module"
Cohesion: 0.11
Nodes (6): AuthController, AuthModule, AuthService, LoginDto, RefreshDto, RegisterDto

### Community 10 - "WhatsApp Service"
Cohesion: 0.18
Nodes (1): WhatsappService

### Community 11 - "Flow Node Runner"
Cohesion: 0.23
Nodes (1): FlowNodeRunnerService

### Community 12 - "Interactive Templates UI"
Cohesion: 0.15
Nodes (7): buildPayload(), createEmptyForm(), formFromTemplate(), handleSubmit(), newListRow(), newListSection(), newReplyButton()

### Community 13 - "Workspaces Service"
Cohesion: 0.14
Nodes (1): WorkspacesService

### Community 14 - "Flow Executor"
Cohesion: 0.24
Nodes (1): FlowExecutorService

### Community 15 - "App Logger"
Cohesion: 0.17
Nodes (3): AppLogger, buildEntry(), SentryExceptionFilter

### Community 16 - "Roles UI"
Cohesion: 0.15
Nodes (5): formatFallbackLabel(), PermissionCheckbox(), savePermissions(), setGroupPermissions(), togglePermission()

### Community 17 - "Conversations Service"
Cohesion: 0.26
Nodes (1): ConversationsService

### Community 18 - "Templates Service"
Cohesion: 0.24
Nodes (1): TemplatesService

### Community 19 - "Workspaces Controller"
Cohesion: 0.14
Nodes (1): WorkspacesController

### Community 20 - "Realtime Events Gateway"
Cohesion: 0.24
Nodes (1): EventsGateway

### Community 21 - "Messages Service"
Cohesion: 0.33
Nodes (1): MessagesService

### Community 22 - "Users Service"
Cohesion: 0.35
Nodes (1): UsersService

### Community 23 - "Teams Service"
Cohesion: 0.29
Nodes (1): TeamsService

### Community 24 - "Conversations Controller"
Cohesion: 0.18
Nodes (1): ConversationsController

### Community 25 - "Flows Service"
Cohesion: 0.4
Nodes (1): FlowsService

### Community 26 - "Users Controller"
Cohesion: 0.2
Nodes (1): UsersController

### Community 27 - "Permissions Module"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 28 - "Messages Controller"
Cohesion: 0.22
Nodes (2): getRequestBaseUrl(), MessagesController

### Community 29 - "Scheduler"
Cohesion: 0.22
Nodes (1): SchedulerService

### Community 30 - "Webhook Signature Guard"
Cohesion: 0.39
Nodes (2): pruneReplayCache(), WebhookSignatureGuard

### Community 31 - "Contact DTOs"
Cohesion: 0.22
Nodes (8): AddTagDto, BulkContactActionDto, ContactFilterDto, CreateContactDto, CreateSavedSegmentDto, MergeContactDto, SetOptInDto, UpdateContactDto

### Community 32 - "Roles Service"
Cohesion: 0.36
Nodes (1): RolesService

### Community 33 - "App Root"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 34 - "Interactive Templates Service"
Cohesion: 0.39
Nodes (1): InteractiveTemplatesService

### Community 35 - "Automation Controller"
Cohesion: 0.25
Nodes (1): AutomationController

### Community 36 - "Quick Replies Service"
Cohesion: 0.38
Nodes (1): QuickRepliesService

### Community 37 - "Roles Controller"
Cohesion: 0.29
Nodes (1): RolesController

### Community 38 - "WhatsApp Meta Client"
Cohesion: 0.47
Nodes (1): WhatsappMetaClient

### Community 39 - "Metrics Service"
Cohesion: 0.4
Nodes (1): MetricsService

### Community 40 - "Metrics Interceptor"
Cohesion: 0.5
Nodes (2): getRoutePath(), MetricsInterceptor

### Community 41 - "Env Validation"
Cohesion: 0.6
Nodes (4): getNodeEnv(), isProduction(), normalizeOptionalString(), validateEnv()

### Community 42 - "Health Controller"
Cohesion: 0.5
Nodes (1): HealthController

### Community 43 - "Encryption Service"
Cohesion: 0.5
Nodes (1): EncryptionService

### Community 44 - "WhatsApp Controller"
Cohesion: 0.5
Nodes (1): WhatsappController

### Community 45 - "Frontend Index"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **66 isolated node(s):** `TemplatesModule`, `TemplateVariableExamplesDto`, `CreateTemplateButtonDto`, `CreateTemplateDto`, `MetricsModule` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Frontend Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ContactsService` connect `Contacts Service` to `Backend Module Wiring`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `ContactsController` connect `Contacts Controller` to `DTOs & Cross-Module Controllers`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `WhatsappService` connect `WhatsApp Service` to `Backend Module Wiring`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **What connects `TemplatesModule`, `TemplateVariableExamplesDto`, `CreateTemplateButtonDto` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin UI & Forms` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Backend Module Wiring` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `DTOs & Cross-Module Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._