import { GoogleTagManager } from '@next/third-parties/google';
import type { Metadata, Viewport } from 'next';

import '@aws-amplify/ui-react/styles.css';
import '@public/fonts/poppins_wght.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Cuenta Única - Registro',
  description: 'Plataforma de Registro para creación de tu Cuenta Única',
  keywords:
    'Cuenta Única, Registro, Plataforma de Autenticación, Gobierno Dominicano, República Dominicana',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

type Props = { children: React.ReactNode };

export default function RootLayout({ children }: Props) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? '';

  return (
    <html lang="es">
      <GoogleTagManager gtmId={gtmId} />

      <body suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
