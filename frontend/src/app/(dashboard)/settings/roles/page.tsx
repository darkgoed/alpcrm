import { SettingsShell } from '@/features/settings/components/settings-shell';
import { RolesSection } from '@/features/settings/components/roles-section';

export default function RolesSettingsPage() {
  return (
    <SettingsShell>
      <RolesSection />
    </SettingsShell>
  );
}
