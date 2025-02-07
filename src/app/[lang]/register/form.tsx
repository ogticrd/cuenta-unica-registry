'use client';

import React, { useEffect, useState, useActionState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

import {
  TextField,
  Alert,
  IconButton,
  InputAdornment,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';

import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { createRegisterSchema } from '@/common/validation-schemas';
import PasswordLevel from '@/components/elements/passwordLevel';
import { useSnackAlert } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { registerAccount } from './register.action';
import { localizeString } from '@/common/helpers';
import { useLanguage } from '../provider';

type RegisterForm = z.infer<ReturnType<typeof createRegisterSchema>>;

interface FormProps {
  cedula: string;
  flow: string;
  returnTo?: string;
}

export function Form({ cedula, flow, returnTo }: FormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const { AlertError } = useSnackAlert();
  const { intl } = useLanguage();

  const [state, action, pending] = useActionState(registerAccount, {
    message: '',
  });

  const {
    register,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    mode: 'onChange',
    resolver: zodResolver(createRegisterSchema(intl, cedula)),
  });

  const password = watch('password');

  useEffect(() => {
    if (state?.message) {
      const message = localizeString(intl, state.message) || state.message;

      Sentry.captureMessage(message, {
        user: { id: state?.meta?.cedula, email: watch('email') },
        extra: { state, error: state?.message },
        level: 'error',
      });

      AlertError(message);
    }
    // eslint-disable-next-line
  }, [state]);

  return (
    <>
      {pending ? <LoadingBackdrop /> : null}
      <form action={action}>
        <input type="hidden" name="flow" value={flow} />
        <input type="hidden" name="cedula" value={cedula} />
        <input type="hidden" name="return_to" value={returnTo || ''} />

        <GridContainer>
          <GridItem lg={12} md={12}>
            <Tooltip title={intl.step3.email.tooltip}>
              <TextField
                {...register('email')}
                required
                type="email"
                label={intl.step3.email.label}
                helperText={errors.email?.message}
                autoComplete="off"
                fullWidth
                onPaste={doNothing}
                onCopy={doNothing}
              />
            </Tooltip>
          </GridItem>

          <GridItem lg={12} md={12}>
            <TextField
              {...register('emailConfirm')}
              required
              type="email"
              color={errors.emailConfirm ? 'error' : 'primary'}
              label={intl.step3.email.confirm}
              error={Boolean(errors.emailConfirm)}
              helperText={errors.emailConfirm?.message}
              autoComplete="off"
              fullWidth
              onPaste={doNothing}
              onCopy={doNothing}
            />
          </GridItem>

          <GridItem lg={12} md={12}>
            <TextField
              {...register('password')}
              required
              type={showPassword ? 'text' : 'password'}
              label={intl.step3.password.label}
              color="primary"
              error={Boolean(errors.password)}
              placeholder="*********"
              helperText={errors.password?.message}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={intl.step3.password.toggleVisibility}
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={doNothing}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <PasswordLevel password={password} />
          </GridItem>

          <GridItem lg={12} md={12}>
            <TextField
              {...register('passwordConfirm')}
              required
              type={showPasswordConfirm ? 'text' : 'password'}
              label={intl.step3.password.confirm}
              color="primary"
              error={Boolean(errors.passwordConfirm)}
              placeholder="*********"
              disabled={Boolean(errors.password)}
              helperText={errors.passwordConfirm?.message}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={intl.step3.password.toggleVisibility}
                        onClick={() =>
                          setShowPasswordConfirm(!showPasswordConfirm)
                        }
                        onMouseDown={doNothing}
                        edge="end"
                        tabIndex={-1}
                      >
                        {showPasswordConfirm ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </GridItem>

          <GridItem lg={12} md={12}>
            {/* <Collapse in={isPwned}>
              <Alert severity="warning">{intl.warnings.breachedPassword}</Alert>
            </Collapse> */}
          </GridItem>

          <GridItem lg={12} md={12}>
            <ButtonApp submit endIcon={<CheckCircleOutlineOutlined />}>
              {intl.actions.create}
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}

function doNothing<T extends React.SyntheticEvent>(e: T) {
  e.preventDefault();
  return false;
}
