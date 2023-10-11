import BoxContentCenter from '@/components/elements/boxContentCenter';
import { CardAuth } from '@/components/elements/cardAuth';
import StepperRegister from '../components/steppers';

import LandingChica2 from '../../public/assets/landingChica.svg';

export default async function Page() {
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
