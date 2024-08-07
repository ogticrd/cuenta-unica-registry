'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Tooltip } from '@mui/material';
import { useReCaptcha } from 'next-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { useFormState } from 'react-dom';
import Link from 'next/link';
import React from 'react';
import { z } from 'zod';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { createCedulaSchema } from '@/common/validation-schemas';
import { TextBodyTiny } from '@/components/elements/typography';
import { CustomTextMask } from '@/components/CustomTextMask';
import { useSnackAlert } from '@/components/elements/alert';
import { identifyAccount } from './identify.action';
import { SubmitButton } from './submit.button';
import { LoadingAdornment } from './adornment';
import theme from '@/components/themes/theme';
import { useLanguage } from '../provider';
import { LOGIN_URL } from '@/common';

type CedulaForm = z.infer<ReturnType<typeof createCedulaSchema>>;

export function Form() {
  const { AlertError } = useSnackAlert();
  const { executeRecaptcha, loaded } = useReCaptcha();
  const { intl } = useLanguage();

  const { formState, setValue, register, trigger, clearErrors } =
    useForm<CedulaForm>({
      reValidateMode: 'onChange',
      resolver: zodResolver(createCedulaSchema(intl)),
    });

  const [state, action] = useFormState(identifyAccount, { message: '' });

  const onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    const cedula = target.value.replace(/-/g, '');
    setValue('cedula', cedula);

    if (formState.errors.cedula) {
      clearErrors('cedula');
    }

    if (cedula.length === 11) {
      trigger('cedula');
    }
  };

  const [token, setToken] = React.useState('');
  React.useEffect(() => {
    if (loaded && !token) {
      executeRecaptcha('form_submit')
        .then(setToken)
        .catch(() => '');
    }
  }, [token, loaded, executeRecaptcha]);

  React.useEffect(() => {
    if (state.message) {
      const message: string =
        state.message.split('.').reduce<any>((prev, k) => prev[k], { intl }) ||
        state.message;

      AlertError(message);
    }
    // eslint-disable-next-line
  }, [state]);

  return (
    <form
      action={action}
      onSubmit={async (e) => {
        if (!formState.isValid) {
          e.preventDefault();
          trigger();
          return false;
        }

        await executeRecaptcha('form_submit').then(setToken);

        e.currentTarget?.requestSubmit();
      }}
    >
      <input type="hidden" name="token" value={token} />
      <input type="hidden" {...register('cedula')} />

      <GridContainer>
        <GridItem lg={12} md={12}>
          <Tooltip title={intl.step1.cedulaTooltip}>
            <TextField
              required
              onChange={onChange}
              label={intl.step1.cedula}
              placeholder="***-**00000-0"
              autoComplete="off"
              error={Boolean(formState.errors.cedula)}
              helperText={formState.errors?.cedula?.message}
              inputProps={{
                inputMode: 'numeric',
              }}
              InputProps={{
                inputComponent: CustomTextMask,
                endAdornment: <LoadingAdornment />,
              }}
              fullWidth
            />
          </Tooltip>
        </GridItem>

        <GridItem lg={12} md={12} sx={{ my: 3 }}>
          <SubmitButton />
        </GridItem>
      </GridContainer>

      <GridContainer>
        <GridItem md={12} lg={12}>
          <TextBodyTiny textCenter>
            <span style={{ color: theme.palette.primary.main }}>
              {intl.alreadyRegistered}
            </span>{' '}
            <Link href={LOGIN_URL}>
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
  );
}
