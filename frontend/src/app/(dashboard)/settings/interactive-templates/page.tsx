import { InteractiveTemplatesSection } from '@/features/settings/components/interactive-templates-section';
import { SettingsShell } from '@/features/settings/components/settings-shell';

export default function InteractiveTemplatesSettingsPage() {
  return (
    <SettingsShell>
      <InteractiveTemplatesSection />
    </SettingsShell>
  );
}
