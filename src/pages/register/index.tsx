import LandingChica2 from '../../../public/assets/landingChica.png';
import { CardAuth } from '@/components/elements/cardAuth';
import StepperRegister from './stepper';
import BoxContentCenter from '@/components/elements/boxContentCenter';

export default function Index() {
  return (
    <BoxContentCenter>
      <CardAuth
        title="Registrar Cuenta Única Ciudadana"
        landing={LandingChica2}
        landingWidth={320}
        landingHeight={290}
      >
        <StepperRegister />
      </CardAuth>
    </BoxContentCenter>
  );
}
