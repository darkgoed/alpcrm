import useSWR from 'swr';
import { api } from '@/lib/api';

export interface WhatsappAccount {
  id: string;
  name: string;
  phoneNumber: string;
  metaAccountId: string;
  wabaId: string;
  verifyToken: string;
  isActive: boolean;
}

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export function useWhatsappAccounts() {
  const { data, error, isLoading, mutate } = useSWR<WhatsappAccount[]>(
    '/workspaces/whatsapp-accounts',
    fetcher,
  );
  return { accounts: data ?? [], isLoading, error, mutate };
}

export async function createWhatsappAccount(payload: {
  name: string;
  phoneNumber: string;
  metaAccountId: string;
  wabaId: string;
  token: string;
  appSecret: string;
  verifyToken: string;
}) {
  const { data } = await api.post('/workspaces/whatsapp-accounts', payload);
  return data as WhatsappAccount;
}

export async function updateWhatsappAccount(id: string, payload: Partial<{
  name: string;
  phoneNumber: string;
  metaAccountId: string;
  wabaId: string;
  token: string;
  appSecret: string;
  verifyToken: string;
  isActive: boolean;
}>) {
  const { data } = await api.patch(`/workspaces/whatsapp-accounts/${id}`, payload);
  return data as WhatsappAccount;
}

export async function deleteWhatsappAccount(id: string) {
  await api.delete(`/workspaces/whatsapp-accounts/${id}`);
}

export async function testWhatsappConnection(phoneNumberId: string, token: string) {
  const { data } = await api.get(
    `https://graph.facebook.com/v18.0/${phoneNumberId}`,
    { headers: { Authorization: `Bearer ${token}` }, baseURL: '' },
  );
  return data as { id: string; display_phone_number: string; verified_name: string };
}
