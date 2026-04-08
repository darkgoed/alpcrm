'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  workspaceId: string | null;
  permissions: string[];
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  hasPermission: (key: string) => boolean;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  workspaceName: string;
  workspaceSlug: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    workspaceId: null,
    permissions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do localStorage
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    const workspaceId = localStorage.getItem('crm_workspace');
    const permissions = JSON.parse(localStorage.getItem('crm_permissions') ?? '[]');
    if (token && workspaceId) {
      setState({ token, workspaceId, permissions });
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (data: AuthResponse) => {
    localStorage.setItem('crm_token', data.access_token);
    localStorage.setItem('crm_workspace', data.workspaceId);
    localStorage.setItem('crm_permissions', JSON.stringify(data.permissions));
    setState({
      token: data.access_token,
      workspaceId: data.workspaceId,
      permissions: data.permissions,
    });
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    saveAuth(data);
  };

  const register = async (form: RegisterData) => {
    const { data } = await api.post<AuthResponse>('/auth/register', form);
    saveAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_workspace');
    localStorage.removeItem('crm_permissions');
    setState({ token: null, workspaceId: null, permissions: [] });
    window.location.href = '/login';
  };

  const hasPermission = (key: string) => state.permissions.includes(key);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, hasPermission, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
