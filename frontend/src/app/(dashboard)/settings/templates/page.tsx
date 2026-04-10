import { TemplatesSection } from '@/features/settings/components/templates-section';
import { SettingsShell } from '@/features/settings/components/settings-shell';

export default function TemplatesSettingsPage() {
  return (
    <SettingsShell>
      <TemplatesSection />
    </SettingsShell>
  );
}
