import { WhatsappAccountsSection } from '@/features/settings/components/whatsapp-accounts-section';
import { SettingsShell } from '@/features/settings/components/settings-shell';

export default function WhatsappSettingsPage() {
  return (
    <SettingsShell>
      <WhatsappAccountsSection />
    </SettingsShell>
  );
}
