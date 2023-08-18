import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useState } from 'react';
import * as yup from 'yup';

import { GridContainer, GridItem } from '@/components/elements/grid';
import BoxContentCenter from '@/components/elements/boxContentCenter';
import LandingChico from '../../../../public/assets/landingChico.svg';
import { CardAuth } from '@/components/elements/cardAuth';
import { ButtonApp } from '@/components/elements/button';
import { FormControlApp } from '@/components/form/input';
import { InputApp } from '@/themes/form/input';
import { routes } from '@/constants/routes';
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
  const router = useRouter();

  const [dataItem] = useState<any>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const onSubmit = () => {
    router.push(routes.register.registered);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <BoxContentCenter>
        <CardAuth
          title="Confirmación de Cuenta"
          subTitle="¡Gracias por completar tu registro! Revisa tu correo electrónico y haz clic en el enlace de confirmación."
          landing={LandingChico}
          landingWidth={214}
          landingHeight={469}
          icon={
            <MarkEmailReadOutlinedIcon sx={{ fontSize: '58px' }} color="info" />
          }
        >
          <GridContainer>
            <GridItem md={12} lg={12}>
              <FormControlApp
                label="Hemos enviado una confirmación al siguiente correo:"
                msg={errors.email?.message}
              >
                <InputApp
                  defaultValue={dataItem.cedula}
                  placeholder="correo@confirmacion.com"
                  {...register('email')}
                />
              </FormControlApp>
            </GridItem>

            <GridItem md={12} lg={12}>
              <ButtonApp submit>REENVIAR CORREO</ButtonApp>
            </GridItem>
          </GridContainer>
        </CardAuth>
      </BoxContentCenter>
    </form>
  );
}
