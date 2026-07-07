import { ReCaptchaProvider } from 'next-recaptcha-v3';
import { headers } from 'next/headers';

import LandingChica from '@public/assets/landingChica.svg';

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

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export default async function LanguageLayout({ children, params }: Props) {
  const { lang } = await params;
  const intl = await getDictionary(lang as Locale);

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '';
  const isVidRoute = pathname.includes('/vid');

  return (
    <>
      <OfficialHeader />

      <ThemeRegistry>
        <LanguageProvider intl={intl}>
          {!isVidRoute && <NavBar intl={intl} />}

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
          {!isVidRoute && <Footer intl={intl} />}
        </LanguageProvider>
      </ThemeRegistry>
    </>
  );
}
