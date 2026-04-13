import { SettingsShell } from '@/features/settings/components/settings-shell';
import { TeamsSection } from '@/features/settings/components/teams-section';

export default function TeamsSettingsPage() {
  return (
    <SettingsShell>
      <TeamsSection />
    </SettingsShell>
  );
}
