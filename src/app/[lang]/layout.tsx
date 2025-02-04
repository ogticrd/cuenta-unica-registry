import { GoogleTagManager } from '@next/third-parties/google';
import { ReCaptchaProvider } from 'next-recaptcha-v3';
import type { Metadata, Viewport } from 'next';

import LandingChica from '@public/assets/landingChica.svg';
import '@aws-amplify/ui-react/styles.css';
import '@public/fonts/poppins_wght.css';
import '@/styles/globals.css';

import BoxContentCenter from '@/components/elements/boxContentCenter';
import ThemeRegistry from '@/components/themes/ThemeRegistry';
import { CardAuth } from '@/components/elements/cardAuth';
import SnackAlert from '@/components/elements/alert';
import { getDictionary } from '@/dictionaries';
import OfficialHeader from '@/components/OfficialHeader';
import UserFeedback from '@/components/layout/userFeedback';
import { LanguageProvider } from './provider';
import { Locale } from '@/i18n-config';
import Footer from '@/components/layout/footer';
import NavBar from '@/components/layout/navBar';

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

type Props = { children: React.ReactNode; params: Promise<{ lang: Locale }> };

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  const intl = await getDictionary(lang);

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? '';

  return (
    <html lang={lang}>
      <GoogleTagManager gtmId={gtmId} />

      <body suppressHydrationWarning={true}>
        <OfficialHeader />

        <ThemeRegistry>
          <LanguageProvider intl={intl}>
            <NavBar intl={intl} />

            <div style={{ padding: '50px 0px' }}>
              <ReCaptchaProvider language={lang} useEnterprise>
                <SnackAlert>
                  <BoxContentCenter>
                    <CardAuth
                      title={intl.common.title}
                      landing={LandingChica}
                      landingWidth={312}
                      landingHeight={267}
                    >
                      {children}
                    </CardAuth>
                  </BoxContentCenter>
                </SnackAlert>
              </ReCaptchaProvider>
            </div>

            <UserFeedback />
            <Footer intl={intl} />
          </LanguageProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
