'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export interface TeamMember {
  user: { id: string; name: string; email: string };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  color?: string;
  teamUsers: TeamMember[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useTeams() {
  const { data, error, mutate, isLoading } = useSWR<Team[]>('/teams', fetcher);
  return { teams: data ?? [], error, mutate, isLoading };
}

export async function createTeam(dto: { name: string; description?: string; color?: string }) {
  const res = await api.post('/teams', dto);
  return res.data as Team;
}

export async function updateTeam(id: string, dto: { name?: string; description?: string; color?: string }) {
  const res = await api.patch(`/teams/${id}`, dto);
  return res.data as Team;
}

export async function deleteTeam(id: string) {
  await api.delete(`/teams/${id}`);
}

export async function addTeamMember(teamId: string, userId: string) {
  const res = await api.post(`/teams/${teamId}/members/${userId}`);
  return res.data as Team;
}

export async function removeTeamMember(teamId: string, userId: string) {
  const res = await api.delete(`/teams/${teamId}/members/${userId}`);
  return res.data as Team;
}
