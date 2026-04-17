'use client';

import { useState, type DragEvent } from 'react';
import { AlertCircle, Check, Pencil, Plus, Phone, Layers, MoreHorizontal, Shield, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  usePipelines,
  useKanban,
  createPipeline,
  createStage,
  deletePipeline,
  deleteStage,
  moveContact,
  updateStage,
  type KanbanStage,
  type Contact,
} from '@/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';

type DraggingContact = {
  contactId: string;
  stageId: string;
};

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  contact,
  stages,
  pipelineId,
  currentStageId,
  onMoved,
  onDragStart,
  onDragEnd,
  isDragging,
  isMoving,
}: {
  contact: Contact;
  stages: KanbanStage[];
  pipelineId: string;
  currentStageId: string;
  onMoved: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isMoving: boolean;
}) {
  const name = contact.name ?? contact.phone;
  const initials = name.slice(0, 2).toUpperCase();
  const [moving, setMoving] = useState(false);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const dragDisabled = moving || isMoving;

  async function handleMove(stageId: string) {
    setMoving(true);
    setShowMoveMenu(false);
    try {
      await moveContact(pipelineId, contact.id, stageId);
      onMoved();
    } finally {
      setMoving(false);
    }
  }

  function handleCardDragStart(event: DragEvent<HTMLDivElement>) {
    if (dragDisabled) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', contact.id);
    setShowMoveMenu(false);
    onDragStart();
  }

  const otherStages = stages.filter((s) => s.id !== currentStageId);

  return (
    <div
      draggable={!dragDisabled}
      onDragStart={handleCardDragStart}
      onDragEnd={onDragEnd}
      className={`relative rounded-xl border border-border/70 bg-background p-3 shadow-sm transition-all hover:border-primary/30 ${
        isDragging ? 'cursor-grabbing opacity-45 ring-2 ring-primary/20' : 'cursor-grab'
      } ${isMoving ? 'pointer-events-none opacity-60' : ''}`}
    >
      <div className="flex items-start gap-2">
        <Avatar className="size-8 shrink-0 border border-border/70">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">{name}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Phone className="size-2.5" />
            {contact.phone}
          </p>
          {contact.contactTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {contact.contactTags.slice(0, 2).map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
          {contact.conversations.length > 0 && (
            <Badge variant="success" className="mt-1 text-[10px] px-1.5 py-0">conversa aberta</Badge>
          )}
        </div>
        <div className="relative">
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => setShowMoveMenu((v) => !v)}
            disabled={dragDisabled}
            title="Mover para stage"
            draggable={false}
          >
            <MoreHorizontal className="size-3" />
          </Button>
          {showMoveMenu && otherStages.length > 0 && (
            <div className="absolute right-0 top-7 z-10 min-w-36 rounded-xl border border-border/70 bg-background p-1 shadow-lg">
              <p className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mover para</p>
              {otherStages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleMove(s.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-accent"
                >
                  <span className="size-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stage Column ────────────────────────────────────────────────────────────

function StageColumn({
  stage,
  allStages,
  pipelineId,
  canManagePipelines,
  onMoved,
  onEditStage,
  onDeleteStage,
  onCancelEditStage,
  onSaveStage,
  draggingContact,
  dropStageId,
  onDragOverStage,
  onDropContact,
  onDragStartContact,
  onDragEndContact,
  isMovingContact,
  movingContactId,
  editingStageId,
  editingStageName,
  editingStageColor,
  onEditingStageNameChange,
  onEditingStageColorChange,
  isSavingStage,
  isDeletingStage,
}: {
  stage: KanbanStage;
  allStages: KanbanStage[];
  pipelineId: string;
  canManagePipelines: boolean;
  onMoved: () => void;
  onEditStage: (stage: KanbanStage) => void;
  onDeleteStage: (stage: KanbanStage) => void;
  onCancelEditStage: () => void;
  onSaveStage: (stageId: string) => void;
  draggingContact: DraggingContact | null;
  dropStageId: string | null;
  onDragOverStage: (stageId: string) => void;
  onDropContact: (stageId: string) => void;
  onDragStartContact: (contactId: string, stageId: string) => void;
  onDragEndContact: () => void;
  isMovingContact: boolean;
  movingContactId: string | null;
  editingStageId: string | null;
  editingStageName: string;
  editingStageColor: string;
  onEditingStageNameChange: (value: string) => void;
  onEditingStageColorChange: (value: string) => void;
  isSavingStage: boolean;
  isDeletingStage: boolean;
}) {
  const canDropHere = Boolean(draggingContact && draggingContact.stageId !== stage.id);
  const isDropTarget = canDropHere && dropStageId === stage.id;
  const isEditing = editingStageId === stage.id;
  const STAGE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];

  function handleStageDragOver(event: DragEvent<HTMLDivElement>) {
    if (!canDropHere || isMovingContact) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    onDragOverStage(stage.id);
  }

  function handleStageDrop(event: DragEvent<HTMLDivElement>) {
    if (!canDropHere || isMovingContact) return;
    event.preventDefault();
    onDropContact(stage.id);
  }

  return (
    <div
      onDragOver={handleStageDragOver}
      onDrop={handleStageDrop}
      className={`flex w-64 shrink-0 flex-col rounded-2xl border border-border/70 transition-colors ${
        isDropTarget ? 'border-primary/60 bg-primary/5' : 'bg-muted/20'
      }`}
    >
      <div
        className="flex items-center justify-between rounded-t-2xl border-b border-border/70 px-3 py-3"
        style={{ borderTop: `3px solid ${stage.color}` }}
      >
        {isEditing ? (
          <div className="w-full space-y-2">
            <Input
              value={editingStageName}
              onChange={(event) => onEditingStageNameChange(event.target.value)}
              className="h-8"
              placeholder="Nome do stage"
              autoFocus
            />
            <div className="flex flex-wrap gap-1">
              {STAGE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onEditingStageColorChange(color)}
                  className="size-5 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ background: color, borderColor: editingStageColor === color ? '#000' : 'transparent' }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-1">
              <Button type="button" size="icon" variant="ghost" className="size-7" onClick={onCancelEditStage}>
                <X className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                className="size-7"
                onClick={() => onSaveStage(stage.id)}
                disabled={isSavingStage || !editingStageName.trim()}
              >
                <Check className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{stage.name}</span>
              <Badge variant="secondary" className="text-[11px]">{stage.contactPipelines.length}</Badge>
            </div>
            {canManagePipelines ? (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => onEditStage(stage)}
                  title="Editar stage"
                  disabled={isDeletingStage}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive hover:text-destructive"
                  onClick={() => onDeleteStage(stage)}
                  title="Excluir stage"
                  disabled={isDeletingStage}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {isDropTarget && (
          <div className="rounded-xl border border-dashed border-primary/40 bg-background/80 px-3 py-2 text-center">
            <p className="text-[11px] font-medium text-primary">Solte aqui para mover</p>
          </div>
        )}
        {stage.contactPipelines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-xs text-muted-foreground">Nenhum contato</p>
          </div>
        ) : (
          stage.contactPipelines.map(({ contact }) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              stages={allStages}
              pipelineId={pipelineId}
              currentStageId={stage.id}
              onMoved={onMoved}
              onDragStart={() => onDragStartContact(contact.id, stage.id)}
              onDragEnd={onDragEndContact}
              isDragging={draggingContact?.contactId === contact.id}
              isMoving={isMovingContact && movingContactId === contact.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KanbanPage() {
  const { hasPermission } = useAuth();
  const canManagePipelines = hasPermission('manage_pipelines');
  const { pipelines, mutate: mutatePipelines, isLoading: loadingPipelines } = usePipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const activePipelineId = selectedPipelineId ?? pipelines[0]?.id ?? null;
  const activePipeline = pipelines.find((pipeline) => pipeline.id === activePipelineId) ?? null;
  const { kanban, mutate: mutateKanban, isLoading: loadingKanban } = useKanban(activePipelineId);

  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState('');
  const [showNewStage, setShowNewStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [draggingContact, setDraggingContact] = useState<DraggingContact | null>(null);
  const [dropStageId, setDropStageId] = useState<string | null>(null);
  const [movingContactId, setMovingContactId] = useState<string | null>(null);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [editingStageColor, setEditingStageColor] = useState('#6366f1');
  const [savingStage, setSavingStage] = useState(false);
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [deletingPipelineId, setDeletingPipelineId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'];
  const totalContacts =
    kanban?.stages.reduce((sum, stage) => sum + stage.contactPipelines.length, 0) ?? 0;

  function resetDragState() {
    setDraggingContact(null);
    setDropStageId(null);
  }

  function startEditingStage(stage: KanbanStage) {
    setErrorMessage(null);
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
    setEditingStageColor(stage.color);
  }

  function stopEditingStage() {
    setEditingStageId(null);
    setEditingStageName('');
    setEditingStageColor('#6366f1');
    setSavingStage(false);
  }

  async function handleCreatePipeline(e: React.FormEvent) {
    e.preventDefault();
    if (!canManagePipelines || !newPipelineName) return;
    setErrorMessage(null);
    const pipeline = await createPipeline(newPipelineName);
    await mutatePipelines();
    setSelectedPipelineId(pipeline.id);
    setNewPipelineName('');
    setShowNewPipeline(false);
  }

  async function handleCreateStage(e: React.FormEvent) {
    e.preventDefault();
    if (!canManagePipelines || !newStageName || !activePipelineId) return;
    setErrorMessage(null);
    await createStage(activePipelineId, { name: newStageName, color: newStageColor });
    await mutateKanban();
    setNewStageName('');
    setShowNewStage(false);
  }

  async function handleSaveStage(stageId: string) {
    if (!canManagePipelines || !activePipelineId || !editingStageName.trim()) return;

    setErrorMessage(null);
    setSavingStage(true);
    try {
      await updateStage(activePipelineId, stageId, {
        name: editingStageName.trim(),
        color: editingStageColor,
      });
      await mutateKanban();
      stopEditingStage();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Nao foi possivel atualizar o stage.');
      setSavingStage(false);
    }
  }

  async function handleDeleteStage(stage: KanbanStage) {
    if (!canManagePipelines || !activePipelineId) return;

    const hasContacts = stage.contactPipelines.length > 0;
    const confirmed = window.confirm(
      hasContacts
        ? `Excluir o stage "${stage.name}"? Isso falhara enquanto houver contatos nele.`
        : `Excluir o stage "${stage.name}"?`,
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setDeletingStageId(stage.id);
    try {
      await deleteStage(activePipelineId, stage.id);
      await mutateKanban();
      if (editingStageId === stage.id) {
        stopEditingStage();
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Nao foi possivel excluir o stage.');
    } finally {
      setDeletingStageId(null);
    }
  }

  async function handleDeletePipeline() {
    if (!canManagePipelines || !activePipelineId) return;

    if (!activePipeline) return;
    const confirmed = window.confirm(
      `Excluir o pipeline "${activePipeline.name}"? Os vinculos dos contatos com este pipeline serao removidos.`,
    );
    if (!confirmed) return;

    setErrorMessage(null);
    setDeletingPipelineId(activePipelineId);
    try {
      await deletePipeline(activePipelineId);
      const remainingPipelines = pipelines.filter((pipeline) => pipeline.id !== activePipelineId);
      setSelectedPipelineId(remainingPipelines[0]?.id ?? null);
      stopEditingStage();
      await mutatePipelines();
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message ?? 'Nao foi possivel excluir o pipeline.');
    } finally {
      setDeletingPipelineId(null);
    }
  }

  function handleDragStart(contactId: string, stageId: string) {
    setDraggingContact({ contactId, stageId });
    setDropStageId(null);
  }

  function handleDragEnd() {
    resetDragState();
  }

  async function handleDropContact(stageId: string) {
    if (!activePipelineId || !draggingContact) return;
    if (draggingContact.stageId === stageId) {
      resetDragState();
      return;
    }

    setMovingContactId(draggingContact.contactId);
    try {
      await moveContact(activePipelineId, draggingContact.contactId, stageId);
      await mutateKanban();
    } finally {
      setMovingContactId(null);
      resetDragState();
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/70 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="size-5 text-primary" />
          <div>
            <h1 className="text-base font-semibold text-foreground">Pipelines CRM</h1>
            <p className="text-xs text-muted-foreground">Arraste cards entre colunas ou use o menu de movimento.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pipelines.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPipelineId(p.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${activePipelineId === p.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
            >
              {p.name}
            </button>
          ))}
          {canManagePipelines ? (
            <Button size="sm" variant="outline" onClick={() => setShowNewPipeline((v) => !v)}>
              <Plus className="size-4" /> Pipeline
            </Button>
          ) : null}
          {canManagePipelines && activePipelineId ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => void handleDeletePipeline()}
              disabled={deletingPipelineId === activePipelineId}
            >
              <Trash2 className="size-4" /> Excluir pipeline
            </Button>
          ) : null}
        </div>
      </div>

      {/* New pipeline form */}
      {canManagePipelines && showNewPipeline && (
        <div className="border-b border-border/70 px-6 py-3">
          <form onSubmit={handleCreatePipeline} className="flex items-center gap-2 max-w-sm">
            <Input
              placeholder="Nome do pipeline"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              className="h-8"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!newPipelineName}>Criar</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewPipeline(false)}>Cancelar</Button>
          </form>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto px-6 py-4">
        {errorMessage ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="size-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {loadingPipelines || loadingKanban ? (
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-64 shrink-0 space-y-2">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            ))}
          </div>
        ) : !kanban ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center max-w-sm">
              <Layers className="mx-auto mb-3 size-10 text-muted-foreground opacity-40" />
              <p className="text-sm font-medium text-foreground">
                {pipelines.length === 0 ? 'Nenhum pipeline criado' : 'Selecione um pipeline'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {pipelines.length === 0
                  ? 'Crie um pipeline para organizar seus contatos em stages.'
                  : 'Escolha um pipeline no menu acima.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 h-full">
            {kanban.stages.map((stage) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                allStages={kanban.stages}
                pipelineId={kanban.id}
                canManagePipelines={canManagePipelines}
                onMoved={() => void mutateKanban()}
                onEditStage={startEditingStage}
                onDeleteStage={(stageItem) => void handleDeleteStage(stageItem)}
                onCancelEditStage={stopEditingStage}
                onSaveStage={(stageId) => void handleSaveStage(stageId)}
                draggingContact={draggingContact}
                dropStageId={dropStageId}
                onDragOverStage={setDropStageId}
                onDropContact={(targetStageId) => void handleDropContact(targetStageId)}
                onDragStartContact={handleDragStart}
                onDragEndContact={handleDragEnd}
                isMovingContact={movingContactId !== null}
                movingContactId={movingContactId}
                editingStageId={editingStageId}
                editingStageName={editingStageName}
                editingStageColor={editingStageColor}
                onEditingStageNameChange={setEditingStageName}
                onEditingStageColorChange={setEditingStageColor}
                isSavingStage={savingStage}
                isDeletingStage={deletingStageId === stage.id}
              />
            ))}

            {/* Adicionar stage */}
            {canManagePipelines ? (
              <div className="w-64 shrink-0">
                {showNewStage ? (
                  <form onSubmit={handleCreateStage} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 space-y-2">
                    <Input
                      placeholder="Nome do stage"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      className="h-8"
                      autoFocus
                    />
                    <div className="flex gap-1 flex-wrap">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewStageColor(c)}
                          className="size-5 rounded-full border-2 transition-transform hover:scale-110"
                          style={{ background: c, borderColor: newStageColor === c ? '#000' : 'transparent' }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="h-7 text-xs" disabled={!newStageName}>Criar</Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowNewStage(false)}>Cancelar</Button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowNewStage(true)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/20 py-4 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    <Plus className="size-4" /> Novo stage
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
