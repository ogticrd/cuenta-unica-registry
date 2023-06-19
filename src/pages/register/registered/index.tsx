import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import BoxContentCenter from '@/components/elements/boxContentCenter';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LandingChico from '../../../../public/assets/landingChico.png';
import { TextBody } from '@/components/elements/typography';
import { CardAuth } from '@/components/elements/cardAuth';
import { ButtonApp } from '@/components/elements/button';
import { labels } from '@/constants/labels';

interface IFormInputs {
  email: string;
}

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .email(labels.form.invalidEmail)
    .required(labels.form.requiredField),
});

export default function Index() {
  const {
    formState: { },
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  return (
    <BoxContentCenter>
      <CardAuth
        title="Registro de Cuenta Exitoso"
        landing={LandingChico}
        landingWidth={175}
        icon={
          <CheckCircleOutlineOutlinedIcon
            sx={{ fontSize: '103px', color: '#2ECC71' }}
          />
        }
      >
        <GridContainer>
          <GridItem md={12} lg={12}>
            <br />
            <TextBody textCenter>
              Hemos enviado una confirmación a tu correo electrónico.
            </TextBody>
            <br />
            <TextBody textCenter>
              Revisa tu correo y haz clic en el enlace de confirmación, luego
              realizar tramites y solicitar servicios gubernamentales
              con una sola cuenta y contraseña.
            </TextBody>
            <br />
          </GridItem>

          <GridItem md={12} lg={12}>
            <ButtonApp
              onClick={() =>
                window.open(
                  'https://beta.auth.digital.gob.do/realms/master/account/'
                )
              }
            >
              IR A MI CUENTA
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </CardAuth>
    </BoxContentCenter>
  );
}
