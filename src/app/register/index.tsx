import BoxContentCenter from '@/components/elements/boxContentCenter';
import LandingChica2 from '../../../public/assets/landingChica.svg';
import { CardAuth } from '@/components/elements/cardAuth';
import StepperRegister from './stepper';

export default function Index() {
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
