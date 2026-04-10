import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'CRM WhatsApp',
  description: 'CRM WhatsApp multi-tenant com inbox, automação e operação comercial em tempo real.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${manrope.variable} min-h-full font-[family-name:var(--font-manrope)]`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
