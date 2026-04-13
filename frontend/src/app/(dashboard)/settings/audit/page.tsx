import { SettingsShell } from '@/features/settings/components/settings-shell';
import { AuditSection } from '@/features/settings/components/audit-section';

export default function AuditSettingsPage() {
  return (
    <SettingsShell>
      <AuditSection />
    </SettingsShell>
  );
}
