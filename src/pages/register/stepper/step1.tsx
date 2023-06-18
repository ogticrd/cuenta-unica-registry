import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useCallback, useState } from 'react';
import { useReCaptcha } from 'next-recaptcha-v3';
import * as yup from 'yup';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { CitizensBasicInformationResponse } from '@/pages/api/types';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { TextBody } from '@/components/elements/typography';
import { AlertWarning } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { FormControlApp } from '@/components/form/input';
import { InputApp } from '@/themes/form/input';
import { labels } from '@/constants/labels';

interface IFormInputs {
  cedula: string;
}

const schema = yup.object({
  cedula: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .min(11, 'Debe contener 11 dígitos'),
});

export default function Step1({ setInfoCedula, handleNext }: any) {
  const [loading, setLoading] = useState(false);

  const handleChange = (e: any) => {
    const cedulaValue = e.target.value
      .replace(/\D/g, '')
      .match(/(\d{0,3})(\d{0,7})(\d{0,1})/);
    e.target.value = !cedulaValue[2]
      ? cedulaValue[1]
      : `${cedulaValue[1]}-${cedulaValue[2]}${`${
          cedulaValue[3] ? `-${cedulaValue[3]}` : ''
        }`}${`${cedulaValue[4] ? `-${cedulaValue[4]}` : ''}`}`;
    const numbers = e.target.value.replace(/(\D)/g, '');
    setValue('cedula', numbers);
  };

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  // Import 'executeRecaptcha' using 'useReCaptcha' hook
  const { executeRecaptcha } = useReCaptcha();

  const handleSubmit = useCallback(
    async (data: IFormInputs) => {
      setLoading(true);

      // Generate ReCaptcha token
      const token = await executeRecaptcha('form_submit');

      if (!token) {
        AlertWarning(
          'Problemas con el reCaptcha, intente nuevamente más tarde'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/citizens/${data.cedula}`);
        if (response.status !== 200) {
          throw new Error('Failed to fetch citizen data');
        }
        const citizen: CitizensBasicInformationResponse = await response.json();
        setInfoCedula(citizen);
        handleNext();
      } catch (err) {
        AlertWarning('Parece que ha introducido una cédula inválida.');
      } finally {
        setLoading(false);
      }
    },
    [executeRecaptcha, handleNext, setInfoCedula]
  );

  return (
    <>
      {loading && <LoadingBackdrop />}
      <br />
      <TextBody textCenter>
        Este es el primer paso para poder verificar tu identidad y crear tu
        cuenta ciudadana.
      </TextBody>

      <form onSubmit={handleFormSubmit(handleSubmit)}>
        <GridContainer marginY>
          <GridItem md={12} lg={12}>
            <FormControlApp
              label="Número de Cédula"
              msg={errors.cedula?.message}
              tooltip="Identidad de Usuario"
              tooltipText="Para iniciar el proceso de validar tu identidad es necesario tu número de cédula."
              required
            >
              <InputApp
                placeholder="*** - **00000 - 0"
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
                autoComplete="off"
                onChange={(e) => handleChange(e)}
              />
            </FormControlApp>
          </GridItem>

          <GridItem md={12} lg={12}>
            <ButtonApp submit>CONFIRMAR</ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
