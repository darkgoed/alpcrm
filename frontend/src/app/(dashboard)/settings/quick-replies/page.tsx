import { SettingsShell } from '@/features/settings/components/settings-shell';
import { QuickRepliesSection } from '@/features/settings/components/quick-replies-section';

export default function QuickRepliesSettingsPage() {
  return (
    <SettingsShell>
      <QuickRepliesSection />
    </SettingsShell>
  );
}
