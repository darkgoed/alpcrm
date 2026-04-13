import { SettingsShell } from '@/features/settings/components/settings-shell';
import { AgentsSection } from '@/features/settings/components/agents-section';

export default function AgentsSettingsPage() {
  return (
    <SettingsShell>
      <AgentsSection />
    </SettingsShell>
  );
}
