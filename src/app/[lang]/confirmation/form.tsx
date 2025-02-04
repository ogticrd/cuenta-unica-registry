'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { TextField, Tooltip } from '@mui/material';
import React, { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { createConfirmationSchema } from '@/common/validation-schemas';
import { useSnackAlert } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { verifyUser } from '../register/register.action';
import { useLanguage } from '../provider';

type Confirmation = z.infer<ReturnType<typeof createConfirmationSchema>>;
type Props = { defaultValue: string };

export function ConfirmationForm({ defaultValue }: Props) {
  const { intl } = useLanguage();
  const { AlertError } = useSnackAlert();
  const {
    register,
    formState: { errors, isValid },
    clearErrors,
    trigger,
  } = useForm<Confirmation>({
    reValidateMode: 'onChange',
    resolver: zodResolver(createConfirmationSchema(intl)),
  });

  const [state, action] = useActionState(verifyUser, { message: '' });

  React.useEffect(() => {
    if (state.message) {
      AlertError(state.message);
    }
    // eslint-disable-next-line
  }, [state]);

  return (
    <form
      action={action}
      onSubmit={async (e) => {
        if (!isValid) {
          e.preventDefault();

          await trigger();
          return false;
        }

        e.currentTarget.requestSubmit();
      }}
    >
      <GridContainer>
        <GridItem lg={12} md={12}>
          <Tooltip title={intl.step3.email.tooltip}>
            <TextField
              {...register('email')}
              required
              type="email"
              label={intl.step3.email.label}
              value={defaultValue ?? ''}
              helperText={errors.email?.message}
              error={Boolean(errors.email)}
              onChange={() => clearErrors('email')}
              fullWidth
            />
          </Tooltip>
        </GridItem>

        <GridItem lg={12} md={12} sx={{ mt: 2 }}>
          <ButtonApp submit>{intl.actions.resendEmail}</ButtonApp>
        </GridItem>
      </GridContainer>
    </form>
  );
}
