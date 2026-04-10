'use client';

import { DashboardOverview } from '@/features/dashboard/components/dashboard-overview';
import { useFlows } from '@/hooks/useAutomation';
import { useConversations } from '@/hooks/useConversations';

export default function DashboardHome() {
  const { conversations } = useConversations();
  const { flows } = useFlows();

  return <DashboardOverview conversations={conversations} flows={flows} />;
}
