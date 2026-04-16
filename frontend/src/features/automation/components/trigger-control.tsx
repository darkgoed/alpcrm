'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Flow } from '@/hooks/useAutomation';
import { FLOW_TRIGGER_LABELS } from './flow-node-summary';

type Tag = { id: string; name: string };
type Pipeline = { id: string; name: string; stages: Array<{ id: string; name: string }> };

interface TriggerControlProps {
  triggerType: Flow['triggerType'];
  triggerValue: string;
  selectedTagId: string;
  selectedPipelineId: string;
  selectedStageId: string;
  tags: Tag[];
  pipelines: Pipeline[];
  onTriggerTypeChange: (v: Flow['triggerType']) => void;
  onTriggerValueChange: (v: string) => void;
  onTagChange: (id: string) => void;
  onPipelineChange: (id: string) => void;
  onStageChange: (id: string) => void;
}

const TRIGGER_TYPES: Flow['triggerType'][] = [
  'new_conversation',
  'keyword',
  'button_reply',
  'always',
  'tag_applied',
  'stage_changed',
];

export function TriggerControl({
  triggerType,
  triggerValue,
  selectedTagId,
  selectedPipelineId,
  selectedStageId,
  tags,
  pipelines,
  onTriggerTypeChange,
  onTriggerValueChange,
  onTagChange,
  onPipelineChange,
  onStageChange,
}: TriggerControlProps) {
  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId) ?? null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={triggerType} onValueChange={(v) => onTriggerTypeChange(v as Flow['triggerType'])}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_TYPES.map((t) => (
            <SelectItem key={t} value={t}>{FLOW_TRIGGER_LABELS[t]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(triggerType === 'keyword' || triggerType === 'button_reply') && (
        <Input
          value={triggerValue}
          onChange={(e) => onTriggerValueChange(e.target.value)}
          placeholder={triggerType === 'keyword' ? 'Ex: oi, suporte' : 'Payload do botão'}
          className="h-8 w-40 text-xs"
        />
      )}

      {triggerType === 'tag_applied' && (
        <Select value={selectedTagId || undefined} onValueChange={onTagChange}>
          <SelectTrigger className="h-8 w-44 text-xs">
            <SelectValue placeholder="Selecione a tag" />
          </SelectTrigger>
          <SelectContent>
            {tags.length === 0 ? (
              <SelectItem value="__none" disabled>Sem tags cadastradas</SelectItem>
            ) : (
              tags.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)
            )}
          </SelectContent>
        </Select>
      )}

      {triggerType === 'stage_changed' && (
        <>
          <Select
            value={selectedPipelineId || undefined}
            onValueChange={(v) => { onPipelineChange(v); onStageChange(''); }}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.length === 0 ? (
                <SelectItem value="__none" disabled>Sem pipelines</SelectItem>
              ) : (
                pipelines.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
              )}
            </SelectContent>
          </Select>

          <Select
            value={selectedStageId || undefined}
            onValueChange={onStageChange}
            disabled={!selectedPipeline}
          >
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent>
              {!selectedPipeline || selectedPipeline.stages.length === 0 ? (
                <SelectItem value="__none" disabled>Sem stages</SelectItem>
              ) : (
                selectedPipeline.stages.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
