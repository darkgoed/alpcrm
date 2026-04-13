'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';

export interface Permission {
  id: string;
  key: string;
}

export interface RolePermission {
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  rolePermissions: RolePermission[];
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useRoles() {
  const { data, error, mutate, isLoading } = useSWR<Role[]>('/roles', fetcher);
  return { roles: data ?? [], error, mutate, isLoading };
}

export function usePermissions() {
  const { data, isLoading } = useSWR<Permission[]>('/permissions', fetcher);
  return { permissions: data ?? [], isLoading };
}

export async function createRole(name: string) {
  const res = await api.post('/roles', { name });
  return res.data as Role;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]) {
  const res = await api.patch(`/roles/${roleId}/permissions`, { permissionIds });
  return res.data as Role;
}

export async function deleteRole(roleId: string) {
  await api.delete(`/roles/${roleId}`);
}
