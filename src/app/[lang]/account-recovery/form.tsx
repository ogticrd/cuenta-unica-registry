'use client';

import { TextField, Tooltip } from '@mui/material';
import React, { useActionState } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { useCedulaForm } from '@/hooks/useCedulaForm';
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

export function Form() {
  const { AlertError } = useSnackAlert();
  const allowRef = React.useRef(false);
  const inputRevision = React.useRef(0);
  const [validatingCedula, setValidatingCedula] = React.useState(false);
  const { intl } = useLanguage();

  const [state, action, pending] = useActionState(
    startAccountRecovery,
    undefined,
  );

  const {
    formState,
    setValue,
    register,
    setError,
    control,
    cedula,
    validateInput,
    checkingCedula,
    canSubmitCedula,
    canRetryCedula,
    cedulaReceipt,
  } = useCedulaForm(intl);

  const { generateToken } = useRecaptchaToken({
    setValue,
    control,
  });

  const onChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    inputRevision.current += 1;
    void validateInput(target.value.replace(/-/g, ''));
  };

  React.useEffect(() => {
    if (state?.message) {
      const message = localizeString(intl, state.message) || state.message;

      if (state.message === 'errors.cedula.invalid') {
        setError('cedula', { type: 'server', message });
      }

      Sentry.captureMessage(message, {
        tags: { form: 'account_recovery' },
        extra: { error: state?.message },
        level: 'error',
      });

      AlertError(message);
    }
    // eslint-disable-next-line
  }, [state]);

  const handleSubmit = React.useCallback(
    async (e: React.SubmitEvent<HTMLFormElement>) => {
      const form = e.currentTarget;
      // If this submit was re-triggered programmatically, allow it to proceed
      if (allowRef.current) {
        allowRef.current = false;
        return;
      }

      // Otherwise, intercept native submit while we validate
      e.preventDefault();

      if (pending || validatingCedula || !canSubmitCedula) return;

      const revision = inputRevision.current;
      setValidatingCedula(true);

      try {
        // Reuse the completed schema check; exception lookups are deduplicated.
        const isValid = await validateInput(cedula);
        if (!isValid) return;

        // reCAPTCHA tokens are single-use, even when the server rejects the form.
        const validToken = await generateToken();
        if (inputRevision.current !== revision) return;
        if (!validToken) {
          AlertError(intl.errors.recaptcha.issues);
          return;
        }

        // Give React a tick to flush hidden input updates to the DOM
        await new Promise<void>((resolve) => setTimeout(resolve, 0));

        // Cancel even if the user changed the ID and then restored it.
        if (inputRevision.current !== revision) return;

        // Re-submit natively so the form action context is preserved (useFormStatus works)
        allowRef.current = true;
        form?.requestSubmit();
      } finally {
        setValidatingCedula(false);
      }
    },
    [
      pending,
      validatingCedula,
      canSubmitCedula,
      validateInput,
      cedula,
      generateToken,
      AlertError,
      intl,
    ],
  );

  return (
    <form action={action} onSubmit={handleSubmit}>
      <input type="hidden" {...register('token')} />
      <input type="hidden" {...register('cedula')} />
      <input type="hidden" name="cedulaValidation" value={cedulaReceipt} />

      <GridContainer>
        <GridItem lg={12} md={12}>
          <Tooltip title={intl.step1.cedulaTooltip}>
            <TextField
              required
              value={cedula}
              onChange={onChange}
              label={intl.step1.cedula}
              placeholder="***-**00000-0"
              autoComplete="off"
              error={Boolean(formState.errors.cedula)}
              helperText={
                checkingCedula
                  ? intl.loader.cedula
                  : formState.errors?.cedula?.message
              }
              fullWidth
              slotProps={{
                input: {
                  inputComponent: CustomTextMask,
                  endAdornment: (
                    <LoadingAdornment
                      pending={checkingCedula}
                      retryLabel={intl.actions.retry}
                      onRetry={
                        canRetryCedula
                          ? () => void validateInput(cedula, true)
                          : undefined
                      }
                    />
                  ),
                },

                htmlInput: {
                  inputMode: 'numeric',
                },
              }}
            />
          </Tooltip>
        </GridItem>

        <GridItem lg={12} md={12} sx={{ my: 3 }}>
          <SubmitButton
            disabled={!canSubmitCedula || validatingCedula || pending}
          />
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
