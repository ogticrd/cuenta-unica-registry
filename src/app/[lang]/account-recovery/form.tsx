'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Tooltip } from '@mui/material';
import React, { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';
import { z } from 'zod';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { createCedulaSchema } from '@/common/validation-schemas';
import { TextBodyTiny } from '@/components/elements/typography';
import { CustomTextMask } from '@/components/CustomTextMask';
import { useSnackAlert } from '@/components/elements/alert';
import { startAccountRecovery } from './recovery.action';
import { localizeString } from '@/common/helpers';
import { SubmitButton } from './submit.button';
import { LoadingAdornment } from './adornment';
import theme from '@/components/themes/theme';
import { useRecaptchaToken } from '@/hooks';
import { useLanguage } from '../provider';

type CedulaForm = z.infer<ReturnType<typeof createCedulaSchema>>;

export function Form() {
  const { AlertError } = useSnackAlert();
  const allowRef = React.useRef(false);
  const { intl } = useLanguage();

  const [state, action, pending] = useActionState(
    startAccountRecovery,
    undefined,
  );

  const {
    formState,
    setValue,
    register,
    trigger,
    clearErrors,
    watch,
    control,
  } = useForm<CedulaForm>({
    reValidateMode: 'onChange',
    resolver: zodResolver(createCedulaSchema(intl)),
  });

  const { ensureValidToken, hasFreshToken } = useRecaptchaToken({
    setValue,
    control,
  });

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

  React.useEffect(() => {
    if (state?.message) {
      const message = localizeString(intl, state.message) || state.message;

      Sentry.captureMessage(message, {
        user: { id: watch('cedula') },
        extra: { state, error: state?.message },
        level: 'error',
      });

      AlertError(message);
    }
    // eslint-disable-next-line
  }, [state]);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      // If this submit was re-triggered programmatically, allow it to proceed
      if (allowRef.current) {
        allowRef.current = false;
        return;
      }

      // Otherwise, intercept native submit while we validate
      e.preventDefault();

      if (pending) return;

      // Ensure form is valid; trigger validation if needed
      const isValid = formState.isValid || (await trigger());
      if (!isValid) return;

      // Ensure we have a fresh token before dispatching the server action
      const validToken = hasFreshToken ? true : await ensureValidToken();
      if (!validToken) {
        AlertError(intl.errors.recaptcha.issues);
        return;
      }

      // Give React a tick to flush hidden input updates to the DOM
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      // Re-submit natively so the form action context is preserved (useFormStatus works)
      allowRef.current = true;
      form?.requestSubmit();
    },
    [
      pending,
      formState.isValid,
      trigger,
      ensureValidToken,
      hasFreshToken,
      AlertError,
      intl,
    ],
  );

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" {...register('token')} />
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
              fullWidth
              slotProps={{
                input: {
                  inputComponent: CustomTextMask,
                  endAdornment: <LoadingAdornment />,
                },

                htmlInput: {
                  inputMode: 'numeric',
                },
              }}
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
              {intl.accountRecovery?.noAccount || "Don't have an account?"}
            </span>{' '}
            <Link href="/identification">
              <span
                style={{
                  color: theme.palette.info.main,
                  textDecoration: 'underline',
                }}
              >
                {intl.accountRecovery?.registerHere || 'Register here.'}
              </span>
            </Link>
          </TextBodyTiny>
        </GridItem>
      </GridContainer>
    </form>
  );
}
