'use client';

import { passwordStrength } from 'check-password-strength';
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
import { verifyPassword } from '@/actions';
import { useLanguage } from '../provider';

type RegisterForm = z.infer<ReturnType<typeof createRegisterSchema>>;

interface FormProps {
  cedula: string;
  flow: string;
  returnTo?: string;
}

export function Form({ cedula, flow, returnTo }: FormProps) {
  const [isPwned, setIsPwned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const { AlertError } = useSnackAlert();
  const { intl } = useLanguage();

  const [state, action] = useActionState(registerAccount, { message: '' });

  const {
    register,
    formState: { errors, isValid },
    setValue,
    resetField,
    watch,
    trigger,
  } = useForm<RegisterForm>({
    mode: 'onChange',
    resolver: zodResolver(createRegisterSchema(intl, cedula)),
  });

  const password = watch('password');

  useEffect(() => {
    if (state?.message) {
      setLoading(false);
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

  useEffect(() => {
    setIsPwned(false);

    if (!password) {
      resetField('password');
      resetField('passwordConfirm');
      setValue('passwordConfirm', '');
    }
  }, [password, resetField, setValue]);

  return (
    <>
      {loading ? <LoadingBackdrop /> : null}
      <form
        action={action}
        onSubmit={async (e) => {
          setLoading(true);
          if (!isValid) {
            e.preventDefault();

            await trigger();
            return false;
          }

          checkPwned(password).then(setIsPwned);
          e.currentTarget.requestSubmit();
        }}
      >
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={intl.step3.password.toggleVisibility}
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseDown={doNothing}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
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
              disabled={passwordStrength(password).id < 3}
              helperText={errors.passwordConfirm?.message}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={intl.step3.password.toggleVisibility}
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
                      onMouseDown={doNothing}
                      edge="end"
                    >
                      {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </GridItem>

          <GridItem lg={12} md={12}>
            <Collapse in={isPwned}>
              <Alert severity="warning">{intl.warnings.breachedPassword}</Alert>
            </Collapse>
          </GridItem>

          <GridItem lg={12} md={12}>
            <ButtonApp
              submit
              endIcon={<CheckCircleOutlineOutlined />}
              disabled={isPwned}
            >
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

async function checkPwned(password: string) {
  return verifyPassword(password).then((exposure) => exposure !== 0);
}
