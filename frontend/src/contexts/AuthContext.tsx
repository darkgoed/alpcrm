'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '@/lib/api';
import { AuthResponse } from '@/types';

interface AuthState {
  token: string | null;
  workspaceId: string | null;
  permissions: string[];
  mustChangePassword: boolean;
}

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    twoFactorCode?: string,
  ) => Promise<{ mustChangePassword: boolean }>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearMustChangePassword: () => void;
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
    mustChangePassword: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão do localStorage
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    const workspaceId = localStorage.getItem('crm_workspace');
    const permissions = JSON.parse(localStorage.getItem('crm_permissions') ?? '[]');
    const mustChangePassword =
      localStorage.getItem('crm_must_change_password') === '1';
    if (token && workspaceId) {
      setState({ token, workspaceId, permissions, mustChangePassword });
    }
    setIsLoading(false);
  }, []);

  const saveAuth = (data: AuthResponse) => {
    localStorage.setItem('crm_token', data.access_token);
    localStorage.setItem('crm_workspace', data.workspaceId);
    localStorage.setItem('crm_permissions', JSON.stringify(data.permissions));
    if (data.mustChangePassword) {
      localStorage.setItem('crm_must_change_password', '1');
    } else {
      localStorage.removeItem('crm_must_change_password');
    }
    setState({
      token: data.access_token,
      workspaceId: data.workspaceId,
      permissions: data.permissions,
      mustChangePassword: Boolean(data.mustChangePassword),
    });
  };

  const login = async (email: string, password: string, twoFactorCode?: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', {
      email,
      password,
      ...(twoFactorCode ? { twoFactorCode } : {}),
    });
    saveAuth(data);
    return { mustChangePassword: Boolean(data.mustChangePassword) };
  };

  const register = async (form: RegisterData) => {
    const { data } = await api.post<AuthResponse>('/auth/register', form);
    saveAuth(data);
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_workspace');
    localStorage.removeItem('crm_permissions');
    localStorage.removeItem('crm_must_change_password');
    setState({ token: null, workspaceId: null, permissions: [], mustChangePassword: false });
    window.location.href = '/login';
  };

  const clearMustChangePassword = () => {
    localStorage.removeItem('crm_must_change_password');
    setState((prev) => ({ ...prev, mustChangePassword: false }));
  };

  const hasPermission = (key: string) => state.permissions.includes(key);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        clearMustChangePassword,
        hasPermission,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth fora do AuthProvider');
  return ctx;
}
