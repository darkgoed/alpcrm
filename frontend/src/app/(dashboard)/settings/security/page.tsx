import { SettingsShell } from '@/features/settings/components/settings-shell';
import { SecuritySection } from '@/features/settings/components/security-section';

export default function Page() {
  return (
    <SettingsShell>
      <SecuritySection />
    </SettingsShell>
  );
}
