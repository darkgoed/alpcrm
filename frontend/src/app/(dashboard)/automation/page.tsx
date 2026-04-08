'use client';

import { useState } from 'react';
import {
  useFlows, createFlow, updateFlow, deleteFlow, toggleFlow,
  Flow, FlowNode,
} from '@/hooks/useAutomation';
import {
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp,
  MessageSquare, Clock, Save, X,
} from 'lucide-react';

// ─── Flow Editor Modal ────────────────────────────────────────────────────────

interface NodeDraft {
  type: 'message' | 'delay';
  config: Record<string, any>;
  order: number;
}

function FlowModal({
  flow,
  onClose,
  onSaved,
}: {
  flow?: Flow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(flow?.name ?? '');
  const [triggerType, setTriggerType] = useState<Flow['triggerType']>(flow?.triggerType ?? 'new_conversation');
  const [triggerValue, setTriggerValue] = useState(flow?.triggerValue ?? '');
  const [nodes, setNodes] = useState<NodeDraft[]>(
    flow?.nodes.map((n) => ({ type: n.type as 'message' | 'delay', config: n.config, order: n.order })) ?? [],
  );
  const [saving, setSaving] = useState(false);

  function addNode(type: 'message' | 'delay') {
    setNodes((prev) => [
      ...prev,
      {
        type,
        config: type === 'message' ? { content: '' } : { ms: 5000 },
        order: prev.length,
      },
    ]);
  }

  function updateNode(idx: number, config: Record<string, any>) {
    setNodes((prev) => prev.map((n, i) => (i === idx ? { ...n, config } : n)));
  }

  function removeNode(idx: number) {
    setNodes((prev) => prev.filter((_, i) => i !== idx).map((n, i) => ({ ...n, order: i })));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: any = {
        name,
        triggerType,
        triggerValue: triggerType === 'keyword' ? triggerValue : undefined,
        nodes,
      };
      if (flow) {
        await updateFlow(flow.id, payload);
      } else {
        await createFlow(payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{flow ? 'Editar Flow' : 'Novo Flow'}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Nome */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Nome do Flow</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Gatilho</label>
            <select
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as Flow['triggerType'])}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="new_conversation">Nova conversa</option>
              <option value="keyword">Palavra-chave</option>
              <option value="always">Sempre (toda mensagem)</option>
            </select>
            {triggerType === 'keyword' && (
              <input
                value={triggerValue}
                onChange={(e) => setTriggerValue(e.target.value)}
                placeholder="Ex: oi, olá, info"
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>

          {/* Nós */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">Mensagens e delays</label>

            {nodes.length === 0 && (
              <p className="text-xs text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-lg">
                Adicione nós abaixo
              </p>
            )}

            <div className="space-y-2">
              {nodes.map((node, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {node.type === 'message' ? (
                        <MessageSquare size={14} className="text-green-500" />
                      ) : (
                        <Clock size={14} className="text-blue-500" />
                      )}
                      <span className="text-xs font-medium text-gray-700">
                        {node.type === 'message' ? `Mensagem ${idx + 1}` : `Delay ${idx + 1}`}
                      </span>
                    </div>
                    <button onClick={() => removeNode(idx)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {node.type === 'message' ? (
                    <textarea
                      value={node.config.content ?? ''}
                      onChange={(e) => updateNode(idx, { content: e.target.value })}
                      placeholder="Texto da mensagem..."
                      rows={2}
                      className="w-full text-sm border border-gray-100 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={Math.round((node.config.ms ?? 5000) / 1000)}
                        onChange={(e) => updateNode(idx, { ms: Number(e.target.value) * 1000 })}
                        className="w-20 text-sm border border-gray-100 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <span className="text-xs text-gray-500">segundos</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => addNode('message')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-green-300 text-green-600 text-xs font-medium rounded-xl hover:bg-green-50 transition-colors"
              >
                <MessageSquare size={13} /> Mensagem
              </button>
              <button
                onClick={() => addNode('delay')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-dashed border-blue-300 text-blue-600 text-xs font-medium rounded-xl hover:bg-blue-50 transition-colors"
              >
                <Clock size={13} /> Delay
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Flow Card ────────────────────────────────────────────────────────────────

function FlowCard({ flow, onEdit, onRefresh }: { flow: Flow; onEdit: () => void; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const triggerLabel: Record<Flow['triggerType'], string> = {
    new_conversation: 'Nova conversa',
    keyword: `Keyword: "${flow.triggerValue}"`,
    always: 'Sempre',
  };

  async function handleToggle() {
    setToggling(true);
    try { await toggleFlow(flow.id); onRefresh(); } finally { setToggling(false); }
  }

  async function handleDelete() {
    if (!confirm(`Excluir flow "${flow.name}"?`)) return;
    setDeleting(true);
    try { await deleteFlow(flow.id); onRefresh(); } finally { setDeleting(false); }
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${flow.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
          <Zap size={14} className={flow.isActive ? 'text-green-600' : 'text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{flow.name}</p>
          <p className="text-xs text-gray-400">{triggerLabel[flow.triggerType]} · {flow.nodes.length} nó{flow.nodes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleToggle}
            disabled={toggling}
            title={flow.isActive ? 'Desativar' : 'Ativar'}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            {flow.isActive
              ? <ToggleRight size={20} className="text-green-500" />
              : <ToggleLeft size={20} className="text-gray-400" />}
          </button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg text-xs font-medium">
            Editar
          </button>
          <button onClick={handleDelete} disabled={deleting} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded((v) => !v)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && flow.nodes.length > 0 && (
        <div className="px-4 pb-3 border-t border-gray-50">
          <div className="pt-2 space-y-1.5">
            {flow.nodes.map((node, i) => (
              <div key={node.id} className="flex items-start gap-2">
                <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${node.type === 'message' ? 'bg-green-50' : 'bg-blue-50'}`}>
                  {node.type === 'message'
                    ? <MessageSquare size={11} className="text-green-500" />
                    : <Clock size={11} className="text-blue-500" />}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">
                    {node.type === 'message' ? 'Mensagem' : 'Delay'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {node.type === 'message'
                      ? (node.config.content || '(vazio)')
                      : `${(node.config.ms ?? 0) / 1000}s`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AutomationPage() {
  const { flows, mutate, isLoading } = useFlows();
  const [modal, setModal] = useState<'create' | Flow | null>(null);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
            <Zap size={15} className="text-green-600" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Automação</h1>
            <p className="text-xs text-gray-400">Flows de resposta automática</p>
          </div>
        </div>
        <button
          onClick={() => setModal('create')}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} /> Novo Flow
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {isLoading ? (
          <div className="flex justify-center pt-16">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : flows.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 text-gray-400">
            <Zap size={48} className="opacity-20 mb-4" />
            <p className="text-lg font-medium">Nenhum flow criado</p>
            <p className="text-sm mt-1">Crie seu primeiro flow de automação</p>
            <button
              onClick={() => setModal('create')}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Plus size={15} /> Criar Flow
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs text-gray-400 mb-1">{flows.length} flow{flows.length !== 1 ? 's' : ''}</p>
            {flows.map((flow) => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onEdit={() => setModal(flow)}
                onRefresh={mutate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <FlowModal
          flow={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={mutate}
        />
      )}
    </div>
  );
}
