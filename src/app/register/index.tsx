'use client';

import { useEffect } from 'react';

import BoxContentCenter from '@/components/elements/boxContentCenter';
import LandingChica2 from '../../../public/assets/landingChica.svg';
import { CardAuth } from '@/components/elements/cardAuth';
import { setCookie } from '../../actions';
import StepperRegister from './stepper';

export default function Index() {
  useEffect(() => {
    setCookie();
  }, []);

  return (
    <BoxContentCenter>
      <CardAuth
        title="Registrar Cuenta Única Ciudadana"
        landing={LandingChica2}
        landingWidth={450}
        landingHeight={400}
      >
        <StepperRegister />
      </CardAuth>
    </BoxContentCenter>
  );
}
