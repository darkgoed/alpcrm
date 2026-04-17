import useSWR from 'swr';
import { api } from '@/lib/api';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Contact {
  id: string;
  workspaceId: string;
  phone: string;
  name: string | null;
  email: string | null;
  company: string | null;
  customFields: Record<string, string>;
  source: 'manual' | 'import_csv' | 'whatsapp_inbound';
  lifecycleStage: 'lead' | 'qualified' | 'customer' | 'inactive';
  optInStatus: 'unknown' | 'opted_in' | 'opted_out';
  optInAt: string | null;
  optInSource: string | null;
  optInEvidence: string | null;
  createdAt: string;
  owner: { id: string; name: string } | null;
  contactTags: Array<{ tag: Tag }>;
  contactPipelines: Array<{ stageId: string; pipelineId: string; stage: { name: string; color: string } }>;
  conversations: Array<{ id: string; status: string }>;
}

export interface ContactFilters {
  search?: string;
  tagIds?: string[];
  pipelineId?: string;
  stageId?: string;
  conversationStatus?: 'open' | 'closed' | 'none';
}

export interface Stage {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  color: string;
}

export interface Pipeline {
  id: string;
  workspaceId: string;
  name: string;
  stages: Stage[];
}

export interface KanbanStage extends Stage {
  contactPipelines: Array<{
    contact: Contact;
  }>;
}

export interface KanbanPipeline extends Pipeline {
  stages: KanbanStage[];
}

export interface SavedSegment {
  id: string;
  name: string;
  filters: ContactFilters;
  createdAt: string;
  updatedAt: string;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

const EMPTY_CONTACTS: Contact[] = [];
const EMPTY_TAGS: Tag[] = [];
const EMPTY_PIPELINES: Pipeline[] = [];
const EMPTY_SEGMENTS: SavedSegment[] = [];

export function useContacts(filters?: ContactFilters) {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  for (const tagId of filters?.tagIds ?? []) {
    params.append('tagIds', tagId);
  }
  if (filters?.pipelineId) params.set('pipelineId', filters.pipelineId);
  if (filters?.stageId) params.set('stageId', filters.stageId);
  if (filters?.conversationStatus) {
    params.set('conversationStatus', filters.conversationStatus);
  }
  const qs = params.toString();

  const { data, mutate, error } = useSWR<Contact[]>(`/contacts${qs ? `?${qs}` : ''}`, fetcher);
  return { contacts: data ?? EMPTY_CONTACTS, mutate, error, isLoading: !data && !error };
}

export function useTags() {
  const { data, mutate, error } = useSWR<Tag[]>('/contacts/tags/list', fetcher);
  return { tags: data ?? EMPTY_TAGS, mutate, error };
}

export function useSavedSegments() {
  const { data, mutate, error } = useSWR<SavedSegment[]>(
    '/contacts/segments',
    fetcher,
  );
  return {
    segments: data ?? EMPTY_SEGMENTS,
    mutate,
    error,
    isLoading: !data && !error,
  };
}

export function usePipelines() {
  const { data, mutate, error } = useSWR<Pipeline[]>('/pipelines', fetcher);
  return { pipelines: data ?? EMPTY_PIPELINES, mutate, error, isLoading: !data && !error };
}

export function useKanban(pipelineId: string | null) {
  const { data, mutate, error } = useSWR<KanbanPipeline>(
    pipelineId ? `/pipelines/${pipelineId}/kanban` : null,
    fetcher,
  );
  return { kanban: data ?? null, mutate, error, isLoading: pipelineId ? !data && !error : false };
}

// ─── Mutações ────────────────────────────────────────────────────────────────

export async function createContact(dto: {
  phone: string;
  name?: string;
  email?: string;
  company?: string;
  customFields?: Record<string, string>;
  ownerId?: string;
  lifecycleStage?: 'lead' | 'qualified' | 'customer' | 'inactive';
}) {
  const r = await api.post('/contacts', dto);
  return r.data as Contact;
}

export async function updateContact(
  id: string,
  dto: {
    name?: string;
    email?: string;
    company?: string | null;
    customFields?: Record<string, string>;
    ownerId?: string | null;
    lifecycleStage?: 'lead' | 'qualified' | 'customer' | 'inactive';
  },
) {
  const r = await api.patch(`/contacts/${id}`, dto);
  return r.data as Contact;
}

export async function deleteContact(id: string) {
  await api.delete(`/contacts/${id}`);
}

export async function mergeContact(sourceContactId: string, targetContactId: string) {
  const r = await api.post(`/contacts/${sourceContactId}/merge`, { targetContactId });
  return r.data as Contact;
}

export async function addTag(contactId: string, tagId: string) {
  await api.post(`/contacts/${contactId}/tags`, { tagId });
}

export async function removeTag(contactId: string, tagId: string) {
  await api.delete(`/contacts/${contactId}/tags/${tagId}`);
}

export async function saveSegment(payload: {
  name: string;
  search?: string;
  tagIds?: string[];
  pipelineId?: string;
  stageId?: string;
  conversationStatus?: 'open' | 'closed' | 'none';
}) {
  const r = await api.post('/contacts/segments', payload);
  return r.data as SavedSegment;
}

export async function deleteSegment(id: string) {
  await api.delete(`/contacts/segments/${id}`);
}

export async function applyBulkContactAction(payload: {
  contactIds: string[];
  addTagIds?: string[];
  removeTagIds?: string[];
  ownerId?: string | null;
  clearOwner?: boolean;
  lifecycleStage?: 'lead' | 'qualified' | 'customer' | 'inactive';
  pipelineId?: string;
  stageId?: string;
}) {
  const r = await api.post('/contacts/bulk/actions', payload);
  return r.data as {
    updatedContacts: number;
    tagsAdded: number;
    tagsRemoved: number;
    movedToStage: number;
  };
}

// ─── Importação CSV ──────────────────────────────────────────────────────────

export interface ImportPreviewResult {
  toCreate: Array<{ phone: string; name?: string; email?: string }>;
  duplicates: string[];
  invalid: Array<{ row: number; phone: string; reason: string }>;
  totalRows: number;
}

export async function importPreview(file: File): Promise<ImportPreviewResult> {
  const form = new FormData();
  form.append('file', file);
  const r = await api.post('/contacts/import/preview', form);
  return r.data;
}

export async function importConfirm(
  rows: Array<{ phone: string; name?: string; email?: string }>,
): Promise<{ jobId: string; count: number }> {
  const r = await api.post('/contacts/import/confirm', { rows });
  return r.data;
}

export async function createTag(name: string, color: string) {
  const r = await api.post('/contacts/tags/create', { name, color });
  return r.data as Tag;
}

export async function createPipeline(name: string) {
  const r = await api.post('/pipelines', { name });
  return r.data as Pipeline;
}

export async function createStage(pipelineId: string, dto: { name: string; color?: string }) {
  const r = await api.post(`/pipelines/${pipelineId}/stages`, dto);
  return r.data as Stage;
}

export async function updateStage(
  pipelineId: string,
  stageId: string,
  dto: { name?: string; color?: string },
) {
  const r = await api.patch(`/pipelines/${pipelineId}/stages/${stageId}`, dto);
  return r.data as Stage;
}

export async function moveContact(pipelineId: string, contactId: string, stageId: string) {
  const r = await api.patch(`/pipelines/${pipelineId}/move`, { contactId, stageId });
  return r.data;
}

export async function removeContactFromPipeline(pipelineId: string, contactId: string) {
  await api.delete(`/pipelines/${pipelineId}/contacts/${contactId}`);
}

export async function setContactOptIn(
  contactId: string,
  dto: { status: 'opted_in' | 'opted_out'; source?: string; evidence?: string },
) {
  const r = await api.patch(`/contacts/${contactId}/opt-in`, dto);
  return r.data as Contact;
}

// ─── Notas internas ──────────────────────────────────────────────────────────

export interface ContactNote {
  id: string;
  contactId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
}

export function useContactNotes(contactId: string | null) {
  const { data, mutate, error } = useSWR<ContactNote[]>(
    contactId ? `/contacts/${contactId}/notes` : null,
    fetcher,
  );
  return { notes: data ?? [], mutate, error, isLoading: contactId ? !data && !error : false };
}

export async function createContactNote(contactId: string, content: string) {
  const r = await api.post(`/contacts/${contactId}/notes`, { content });
  return r.data as ContactNote;
}

export async function deleteContactNote(contactId: string, noteId: string) {
  await api.delete(`/contacts/${contactId}/notes/${noteId}`);
}
