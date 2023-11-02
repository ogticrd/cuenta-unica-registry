'use client';

import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Tooltip } from '@mui/material';
import { useReCaptcha } from 'next-recaptcha-v3';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

import {
  findCitizen,
  findIamCitizen,
  setCookie,
  validateRecaptcha,
} from '@/actions';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { createCedulaSchema } from '@/common/validation-schemas';
import { TextBodyTiny } from '@/components/elements/typography';
import { CustomTextMask } from '@/components/CustomTextMask';
import { useSnackAlert } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { Validations } from '@/common/helpers';
import theme from '@/components/themes/theme';
import { useLanguage } from '../provider';

type CedulaForm = z.infer<ReturnType<typeof createCedulaSchema>>;

export function Form() {
  const { AlertError, AlertWarning } = useSnackAlert();
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useReCaptcha();
  const router = useRouter();

  const { intl } = useLanguage();

  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CedulaForm>({
    reValidateMode: 'onSubmit',
    resolver: zodResolver(createCedulaSchema({ intl })),
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
      AlertError(intl.errors.cedula.invalid);
      setLoading(false);

      return;
    }

    const reCaptchaToken = await executeRecaptcha('form_submit');

    if (!reCaptchaToken) {
      AlertWarning(intl.errors.recaptcha.issues);
      setLoading(false);

      return;
    }

    try {
      const { isHuman } = await validateRecaptcha(reCaptchaToken);

      if (!isHuman) {
        return AlertError(intl.errors.recaptcha.validation);
      }

      const { exists } = await findIamCitizen(cedula);

      if (exists) {
        return AlertError(intl.errors.cedula.exists);
      }

      const citizen = await findCitizen(cedula);
      await setCookie('citizen', citizen);
      router.push('liveness');
    } catch (err: any) {
      Sentry.captureException(err.message || err);

      return AlertError(intl.errors.cedula.invalid);
    } finally {
      setLoading(false);
    }
  });

  return (
    <>
      {loading ? <LoadingBackdrop text={intl.loader.cedula} /> : null}

      <form onSubmit={onSubmit}>
        <GridContainer>
          <GridItem lg={12} md={12}>
            <Tooltip title={intl.step1.cedulaTooltip}>
              <TextField
                required
                value={cedulaFormValue}
                onChange={onChange}
                label={intl.step1.cedula}
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
              {intl.actions.confirm}
            </ButtonApp>
          </GridItem>
        </GridContainer>

        <br />
        <GridContainer>
          <GridItem md={12} lg={12}>
            <TextBodyTiny textCenter>
              <Link
                href={'https://mi.cuentaunica.gob.do/ui/login'}
                style={{ textDecoration: 'none' }}
              >
                <span style={{ color: theme.palette.primary.main }}>
                  {intl.alreadyRegistered}
                </span>{' '}
                <span
                  style={{
                    color: theme.palette.info.main,
                    textDecoration: 'underline',
                  }}
                >
                  {intl.actions.loginHere}
                </span>
              </Link>
            </TextBodyTiny>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
