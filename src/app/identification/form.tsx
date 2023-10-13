'use client';

import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Tooltip } from '@mui/material';
import { useReCaptcha } from 'next-recaptcha-v3';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

import {
  IDENTITY_ALREADY_EXISTS_ERROR,
  INVALID_CEDULA_ERROR,
  INVALID_CEDULA_NUMBER_ERROR,
  RECAPTCHA_ISSUES_ERROR,
  RECAPTCHA_VALIDATION_ERROR,
} from '@/common/constants';
import {
  findCitizen,
  findIamCitizen,
  setCookie,
  validateRecaptcha,
} from '@/actions';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { CedulaValidationSchema } from '@/common/validation-schemas';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { TextBodyTiny } from '@/components/elements/typography';
import { CustomTextMask } from '@/components/CustomTextMask';
import { useSnackAlert } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { Validations, unwrap } from '@/common/helpers';

type CedulaForm = z.infer<typeof CedulaValidationSchema>;

export function Form() {
  const { AlertError, AlertWarning } = useSnackAlert();
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useReCaptcha();
  const router = useRouter();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CedulaForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(CedulaValidationSchema),
  });

  const cedulaFormValue = watch('cedula', '');

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valueWithoutHyphens = event.target.value.replace(/-/g, '');
    setValue('cedula', valueWithoutHyphens);
  };

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);

    const cedula = data.cedula.replace(/-/g, '');
    const isValidByLuhn = Validations.luhnCheck(cedula);

    if (!isValidByLuhn) {
      AlertError(INVALID_CEDULA_NUMBER_ERROR);
      setLoading(false);

      return;
    }

    const reCaptchaToken = await executeRecaptcha('form_submit');

    if (!reCaptchaToken) {
      AlertWarning(RECAPTCHA_ISSUES_ERROR);
      setLoading(false);

      return;
    }

    try {
      const { isHuman } = await validateRecaptcha(reCaptchaToken);

      if (!isHuman) {
        return AlertError(RECAPTCHA_VALIDATION_ERROR);
      }

      const { exists } = await findIamCitizen(cedula);

      if (exists) {
        return AlertError(IDENTITY_ALREADY_EXISTS_ERROR);
      }

      const citizen = await findCitizen(cedula);
      await setCookie('citizen', citizen);
      router.push('liveness');
    } catch (err: any) {
      console.error(err.message || err);

      return AlertError(INVALID_CEDULA_ERROR);
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      {loading && (
        <LoadingBackdrop text="Espere un momento, estamos validando su cédula." />
      )}

      <form onSubmit={onSubmit}>
        <GridContainer>
          <GridItem lg={12} md={12}>
            <Tooltip title="Para iniciar el proceso de validar tu identidad es necesario tu número de cédula.">
              <TextField
                required
                value={cedulaFormValue}
                onChange={onChange}
                label="Número de cédula"
                placeholder="***-**00000-0"
                autoComplete="off"
                error={Boolean(errors.cedula)}
                helperText={errors?.cedula?.message}
                inputProps={{
                  inputMode: 'numeric',
                }}
                InputProps={{
                  inputComponent: CustomTextMask,
                }}
                fullWidth
              />
            </Tooltip>
          </GridItem>

          <GridItem lg={12} md={12}>
            <br />
            <ButtonApp submit endIcon={<ArrowCircleRightOutlinedIcon />}>
              CONFIRMAR
            </ButtonApp>
          </GridItem>
        </GridContainer>

        <br />
        <GridContainer>
          <GridItem md={12} lg={12}>
            <TextBodyTiny textCenter>
              <Link
                href={'https://ogtic.gob.do'}
                style={{ textDecoration: 'none' }}
              >
                <span className="text-secondary">¿Ya tienes una cuenta?</span>{' '}
                Inicia sesión aquí.
              </Link>
            </TextBodyTiny>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
function verifyReCaptcha(
  reCaptchaToken: string,
): { isHuman: any } | PromiseLike<{ isHuman: any }> {
  throw new Error('Function not implemented.');
}
