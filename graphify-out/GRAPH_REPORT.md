# Graph Report - backend/src + frontend/src  (2026-04-17)

## Corpus Check
- 216 files · ~87,065 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1110 nodes · 1792 edges · 55 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## God Nodes (most connected - your core abstractions)
1. `ContactsController` - 24 edges
2. `WhatsappService` - 21 edges
3. `FlowNodeRunnerService` - 19 edges
4. `WorkspacesService` - 18 edges
5. `FlowExecutorService` - 17 edges
6. `ConversationsService` - 15 edges
7. `TemplatesService` - 14 edges
8. `WorkspacesController` - 14 edges
9. `EventsGateway` - 14 edges
10. `PipelinesController` - 13 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Admin/Settings UI"
Cohesion: 0.02
Nodes (19): isRecord(), parseFlowJson(), addButton(), addRow(), removeButton(), set(), updateButton(), updateRow() (+11 more)

### Community 1 - "Backend Module Wiring & Processors"
Cohesion: 0.03
Nodes (39): AppModule, AutoCloseProcessor, AutomationModule, AddTagDto, BulkContactActionDto, ContactFilterDto, CreateContactDto, CreateSavedSegmentDto (+31 more)

### Community 2 - "DTOs & Cross-Module Controllers"
Cohesion: 0.03
Nodes (32): AssignConversationDto, AuditModule, AuditService, CreateInteractiveTemplateDto, CreateQuickReplyDto, CreateRoleDto, CreateTeamDto, CreateFollowUpRuleDto (+24 more)

### Community 3 - "Conversation Thread UI"
Cohesion: 0.02
Nodes (13): formatTimelineDividerDate(), formatTimelineDividerDateTime(), close(), getMessagePreview(), goToConversation(), handleAddTag(), handleAssignmentSave(), handleContactSave() (+5 more)

### Community 4 - "Contacts Page UI"
Cohesion: 0.06
Nodes (3): handleSave(), handleSubmit(), normalizeCustomFields()

### Community 5 - "Frontend Hooks & API Client"
Cohesion: 0.07
Nodes (0): 

### Community 6 - "Templates Section UI"
Cohesion: 0.09
Nodes (6): addButton(), handleSave(), parseExamples(), removeButton(), set(), setButton()

### Community 7 - "Contacts Controller"
Cohesion: 0.09
Nodes (1): ContactsController

### Community 8 - "Auth Module"
Cohesion: 0.11
Nodes (6): AuthController, AuthModule, AuthService, LoginDto, RefreshDto, RegisterDto

### Community 9 - "WhatsApp Service"
Cohesion: 0.18
Nodes (1): WhatsappService

### Community 10 - "Flow Node Runner"
Cohesion: 0.23
Nodes (1): FlowNodeRunnerService

### Community 11 - "Workspaces Service"
Cohesion: 0.14
Nodes (1): WorkspacesService

### Community 12 - "Flow Executor"
Cohesion: 0.24
Nodes (1): FlowExecutorService

### Community 13 - "Conversations Service"
Cohesion: 0.26
Nodes (1): ConversationsService

### Community 14 - "Templates Service"
Cohesion: 0.24
Nodes (1): TemplatesService

### Community 15 - "Workspaces Controller"
Cohesion: 0.14
Nodes (1): WorkspacesController

### Community 16 - "Realtime Events Gateway"
Cohesion: 0.24
Nodes (1): EventsGateway

### Community 17 - "Pipelines Controller"
Cohesion: 0.15
Nodes (1): PipelinesController

### Community 18 - "Pipelines Service"
Cohesion: 0.15
Nodes (1): PipelinesService

### Community 19 - "Interactive Templates UI"
Cohesion: 0.24
Nodes (7): buildPayload(), createEmptyForm(), formFromTemplate(), handleSubmit(), newListRow(), newListSection(), newReplyButton()

### Community 20 - "Messages Service"
Cohesion: 0.33
Nodes (1): MessagesService

### Community 21 - "Users Service"
Cohesion: 0.35
Nodes (1): UsersService

### Community 22 - "Teams Service"
Cohesion: 0.29
Nodes (1): TeamsService

### Community 23 - "Conversations Controller"
Cohesion: 0.18
Nodes (1): ConversationsController

### Community 24 - "Flows Service"
Cohesion: 0.4
Nodes (1): FlowsService

### Community 25 - "Users Controller"
Cohesion: 0.2
Nodes (1): UsersController

### Community 26 - "Permissions Module"
Cohesion: 0.22
Nodes (3): PermissionsController, PermissionsModule, PermissionsService

### Community 27 - "Messages Controller"
Cohesion: 0.22
Nodes (2): getRequestBaseUrl(), MessagesController

### Community 28 - "Contacts Service (Core)"
Cohesion: 0.29
Nodes (2): calculateResponseMetrics(), ContactsService

### Community 29 - "Scheduler"
Cohesion: 0.22
Nodes (1): SchedulerService

### Community 30 - "Community 30"
Cohesion: 0.22
Nodes (1): TeamsController

### Community 31 - "Community 31"
Cohesion: 0.39
Nodes (2): pruneReplayCache(), WebhookSignatureGuard

### Community 32 - "Community 32"
Cohesion: 0.36
Nodes (2): AppLogger, buildEntry()

### Community 33 - "Community 33"
Cohesion: 0.36
Nodes (1): RolesService

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (2): AppController, AppService

### Community 35 - "Community 35"
Cohesion: 0.39
Nodes (1): InteractiveTemplatesService

### Community 36 - "Community 36"
Cohesion: 0.32
Nodes (1): ContactImportService

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (7): CreatePipelineDto, CreateStageDto, MoveContactDto, ReorderStageItem, ReorderStagesDto, UpdatePipelineDto, UpdateStageDto

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (1): AutomationController

### Community 39 - "Community 39"
Cohesion: 0.38
Nodes (1): QuickRepliesService

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (1): ContactTagsService

### Community 41 - "Community 41"
Cohesion: 0.43
Nodes (1): ContactNotesService

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (1): ContactSegmentsService

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (1): InteractiveTemplatesController

### Community 44 - "Community 44"
Cohesion: 0.53
Nodes (1): ContactMergeService

### Community 45 - "Community 45"
Cohesion: 0.47
Nodes (1): WhatsappMetaClient

### Community 46 - "Community 46"
Cohesion: 0.4
Nodes (1): MetricsService

### Community 47 - "Community 47"
Cohesion: 0.5
Nodes (2): getRoutePath(), MetricsInterceptor

### Community 48 - "Community 48"
Cohesion: 0.6
Nodes (4): getNodeEnv(), isProduction(), normalizeOptionalString(), validateEnv()

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (4): CreateFlowDto, CreateFlowEdgeDto, CreateFlowNodeDto, UpdateFlowDto

### Community 50 - "Community 50"
Cohesion: 0.5
Nodes (1): HealthController

### Community 51 - "Community 51"
Cohesion: 0.5
Nodes (1): PrismaService

### Community 52 - "Community 52"
Cohesion: 0.67
Nodes (1): ContactBulkService

### Community 53 - "Community 53"
Cohesion: 0.5
Nodes (1): WhatsappController

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **66 isolated node(s):** `TemplatesModule`, `TemplateVariableExamplesDto`, `CreateTemplateButtonDto`, `CreateTemplateDto`, `MetricsModule` (+61 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 54`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ContactsController` connect `Contacts Controller` to `Backend Module Wiring & Processors`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `WhatsappService` connect `WhatsApp Service` to `Backend Module Wiring & Processors`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `FlowNodeRunnerService` connect `Flow Node Runner` to `Backend Module Wiring & Processors`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `TemplatesModule`, `TemplateVariableExamplesDto`, `CreateTemplateButtonDto` to the rest of the system?**
  _66 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin/Settings UI` be split into smaller, more focused modules?**
  _Cohesion score 0.02 - nodes in this community are weakly interconnected._
- **Should `Backend Module Wiring & Processors` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._
- **Should `DTOs & Cross-Module Controllers` be split into smaller, more focused modules?**
  _Cohesion score 0.03 - nodes in this community are weakly interconnected._