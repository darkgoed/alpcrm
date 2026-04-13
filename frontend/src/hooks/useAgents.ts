'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export interface AgentRole {
  role: { id: string; name: string };
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  userRoles: AgentRole[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useAgents() {
  const { data, error, mutate, isLoading } = useSWR<Agent[]>('/users', fetcher);
  return { agents: data ?? [], error, mutate, isLoading };
}

export async function inviteAgent(dto: {
  name: string;
  email: string;
  password: string;
  roleId?: string;
}) {
  const res = await api.post('/users', dto);
  return res.data as Agent & { temporaryPassword: string };
}

export async function updateAgent(id: string, dto: { name?: string; isActive?: boolean }) {
  const res = await api.patch(`/users/${id}`, dto);
  return res.data as Agent;
}

export async function deactivateAgent(id: string) {
  const res = await api.patch(`/users/${id}/deactivate`);
  return res.data as Agent;
}

export async function resetAgentPassword(id: string) {
  const res = await api.patch(`/users/${id}/reset-password`);
  return res.data as { temporaryPassword: string };
}

export async function assignRole(userId: string, roleId: string) {
  const res = await api.post(`/users/${userId}/roles/${roleId}`);
  return res.data as Agent;
}

export async function removeRole(userId: string, roleId: string) {
  await api.delete(`/users/${userId}/roles/${roleId}`);
}
