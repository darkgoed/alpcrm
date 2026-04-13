import { SettingsShell } from '@/features/settings/components/settings-shell';
import { WorkspaceSection } from '@/features/settings/components/workspace-section';

export default function WorkspaceSettingsPage() {
  return (
    <SettingsShell>
      <WorkspaceSection />
    </SettingsShell>
  );
}
