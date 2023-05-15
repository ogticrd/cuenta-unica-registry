import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';
import { passwordStrength } from 'check-password-strength';

import { AlertError, AlertWarning } from '@/components/elements/alert';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { TextBody } from '@/components/elements/typography';
import { FormControlApp } from '@/components/form/input';
import { ButtonApp } from '@/components/elements/button';
import { InputApp } from '@/themes/form/input';
import { labels } from '@/constants/labels';
import PasswordLevel from '@/components/elements/passwordLevel';

interface IFormInputs {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
}

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .email(labels.form.invalidEmail)
    .required(labels.form.requiredField),
  emailConfirm: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .oneOf([yup.ref('email')], 'Los correos no coinciden'),
  password: yup.string().required(labels.form.requiredField),
  passwordConfirm: yup
    .string()
    .required(labels.form.requiredField)
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

export default function Step3({ handleNext, infoCedula }: any) {
  const [loading, setLoading] = useState(false);
  const [passwordLevel, setPasswordLevel] = useState<any>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<IFormInputs>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const handleChangePassword = (password: string) => {
    const level = passwordStrength(password);
    setPasswordLevel(level);
    setValue('password', password);
  };

  const onSubmit = (data: IFormInputs) => {
    if (passwordLevel.id !== 3) return;
    setLoading(true);

    axios
      .post('/api/iam', {
        email: data.email,
        username: infoCedula.id,
        password: data.password,
      })
      .then(() => {
        handleNext();
      })
      .catch((err) => {
        if (err?.response?.status === 409) {
          AlertWarning('El correo electrónico ya está registrado.');
        } else {
          AlertError();
        }
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {loading && <LoadingBackdrop text="Estamos creando tu usuario..." />}
      <br />
      <TextBody textCenter bold>
        Para finalizar tu registro completa los siguientes campos:
      </TextBody>

      <form onSubmit={handleSubmit(onSubmit)}>
        <GridContainer marginY>
          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Correo Electrónico"
              msg={errors.email?.message}
              tooltip="Correo personal"
              tooltipText="Para completar tu cuenta única ciudadana es necesario proporcionar tu correo electrónico, asegúrate esté correctamente escrito y que sea de tu uso cotidiano. Aquí recibirás información importante sobre tu cuenta."
              required
            >
              <InputApp
                placeholder="Coloca tu correo electrónico"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                {...register('email')}
              />
            </FormControlApp>
          </GridItem>

          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Confirma tu Correo Electrónico"
              msg={errors.emailConfirm?.message}
              required
            >
              <InputApp
                placeholder="Coloca tu correo electrónico"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                {...register('emailConfirm')}
              />
            </FormControlApp>
          </GridItem>

          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Contraseña"
              msg={errors.password?.message}
              tooltip="Su contraseña debe contener:"
              tooltipText={
                <>
                  <b>
                    Al menos 8 caracteres de largo
                    <br />
                    Al menos 3 de los siguientes:
                  </b>
                  <li>Letras minúsculas (a-z)</li>
                  <li>Letras mayúsculas (A-Z)</li>
                  <li>Números (0-9)</li>
                  <li>Caracteres especiales (por ejemplo, !@#$%^&*)</li>
                </>
              }
              required
            >
              <InputApp
                placeholder="*********"
                type="password"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                {...register('password')}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChangePassword(e.target.value)
                }
              />
            </FormControlApp>
            <PasswordLevel passwordLevel={passwordLevel} />
          </GridItem>

          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Confirma tu Contraseña"
              msg={errors.passwordConfirm?.message}
              required
            >
              <InputApp
                placeholder="*********"
                type="password"
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                {...register('passwordConfirm')}
                disabled={passwordLevel.id === 3 ? false : true}
              />
            </FormControlApp>
          </GridItem>

          <GridItem md={12} lg={12}>
            <ButtonApp
              submit
              disabled={
                Object.values(getValues()).every(
                  (value: any) =>
                    value !== null && value !== undefined && value !== ''
                ) === false
                  ? true
                  : false
              }
            >
              ACEPTAR Y CONFIRMAR
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
