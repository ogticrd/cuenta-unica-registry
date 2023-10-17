'use client';

import {
  Alert,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { RegistrationFlow, UpdateRegistrationFlowBody } from '@ory/client';
import { isUiNodeInputAttributes } from '@ory/integrations/ui';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useSearchParams, useRouter } from 'next/navigation';
import { SyntheticEvent, useEffect, useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import PasswordLevel from '@/components/elements/passwordLevel';
import { createRegisterSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { useSnackAlert } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { findCitizen, verifyPassword } from '@/actions';
import { ory } from '@/common/lib/ory';
import { useLanguage } from '../provider';
import { getPasswordStrength } from '@/components/elements/passwordLevel/options';

type RegisterForm = z.infer<ReturnType<typeof createRegisterSchema>>;
type Props = {
  cedula: string;
};

export function Form({ cedula }: Props) {
  const [flow, setFlow] = useState<RegistrationFlow>();
  const [passwordLevel, setPasswordLevel] = useState<any>({});
  const [passwordString, setPasswordString] = useState<string>('');
  const [isPwned, setIsPwned] = useState(false);
  const { AlertWarning, AlertError } = useSnackAlert();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('return_to');

  const { intl } = useLanguage();

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const { data: flow } = await ory.createBrowserRegistrationFlow({
          returnTo: returnTo ? String(returnTo) : undefined,
        });

        setFlow(flow);
      } catch (err: any) {
        AlertWarning(intl.errors.registration.flow);
        console.error(err.message || err);
      }
    };

    fetchFlow();
    // eslint-disable-next-line
  }, [returnTo]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterForm>({
    mode: 'onChange',
    resolver: zodResolver(createRegisterSchema({ intl })),
  });

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleChangePassword = (password: string) => {
    setPasswordString(password);
    setPasswordLevel(getPasswordStrength(password));
    setValue('password', password);
    setIsPwned(false);
  };

  const onSubmitHandler = async (form: RegisterForm) => {
    if (isPwned || passwordLevel.id !== 3) {
      return;
    }

    const password = form.password;

    try {
      const { data } = await verifyPassword(password);
      const isValidPassword = data !== 0;

      setIsPwned(isValidPassword);
    } catch (err: any) {
      AlertError(intl.errors.password.validation);

      return;
    }

    try {
      const citizen = await findCitizen(cedula, true);
      let csrfToken = '';

      if (flow && flow.ui && Array.isArray(flow.ui.nodes)) {
        const csrfNode = flow.ui.nodes.find(
          (node) =>
            isUiNodeInputAttributes(node.attributes) &&
            node.attributes.name === 'csrf_token',
        );

        if (csrfNode) {
          csrfToken = (csrfNode.attributes as any).value;
        }
      }

      const updateRegistrationFlowBody: UpdateRegistrationFlowBody = {
        csrf_token: csrfToken,
        method: 'password',
        password: form.password,
        traits: {
          email: form.email,
          username: citizen.id,
          name: {
            first: citizen.names,
            last: `${citizen.firstSurname} ${citizen.secondSurname}`,
          },
          birthdate: citizen.birthDate,
          gender: citizen.gender,
        },
      };

      await ory.updateRegistrationFlow({
        flow: String(flow?.id),
        updateRegistrationFlowBody,
      });

      if (returnTo) {
        window.location.href = returnTo;
        return;
      }

      router.push('confirmation');
    } catch (err: any) {
      if (err.response && err.response.data) {
        const errorData = err.response.data;

        console.error('errorData', errorData);

        const { ui } = errorData;

        const messages = ui.messages;
        const nodes = ui.nodes;

        const errors = [];

        if (messages && messages.length) {
          const e = messages
            .filter((m: any) => m.type === 'error')
            .map((e: any) => e.text);
          errors.push(e);
        }

        if (nodes && nodes.length) {
          // TODO: sacar los errores de los nodos retornados por ORY!!
          const e = nodes
            .filter(
              (node: any) =>
                node.messages.length &&
                node.messages.filter((x: any) => x.type === 'error'),
            )
            .map((a: any) => a.messages);
          errors.push(e);
        }

        console.error('errors', errors);
      }

      // If the previous handler did not catch the error it's most likely a form validation error
      if (err.response && err.response.status && err.response.status === 400) {
        setFlow(err.response?.data);

        return;
      }

      AlertError(intl.errors.createIdentity);
      return;
    }
  };

  // TODO: Use this Password UI approach https://stackblitz.com/edit/material-password-strength?file=Icons.js
  return (
    <form onSubmit={handleSubmit(onSubmitHandler)}>
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
            required
            type={showPassword ? 'text' : 'password'}
            label={intl.step3.password.label}
            color={errors.password ? 'error' : 'primary'}
            placeholder="*********"
            helperText={errors.password?.message}
            fullWidth
            {...register('password')}
            onChange={(e) => handleChangePassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={intl.step3.password.toggleVisibility}
                    onClick={() => setShowPassword(!showPassword)}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <PasswordLevel password={passwordString} />
        </GridItem>

        <GridItem lg={12} md={12}>
          <TextField
            required
            type={showPasswordConfirm ? 'text' : 'password'}
            label={intl.step3.password.confirm}
            color={errors.passwordConfirm ? 'error' : 'primary'}
            placeholder="*********"
            disabled={passwordLevel.id === 3 ? false : true}
            helperText={errors.passwordConfirm?.message}
            fullWidth
            {...register('passwordConfirm')}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={intl.step3.password.toggleVisibility}
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPasswordConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </GridItem>

        {isPwned && (
          <GridItem lg={12} md={12}>
            <Alert severity="warning">{intl.warnings.breachedPassword}</Alert>
          </GridItem>
        )}

        <GridItem lg={12} md={12}>
          <br />
          <ButtonApp
            submit
            endIcon={<CheckCircleOutlineOutlinedIcon />}
            disabled={isPwned}
          >
            {intl.actions.create}
          </ButtonApp>
        </GridItem>
      </GridContainer>
    </form>
  );
}

function doNothing<T extends SyntheticEvent<HTMLElement>>(e: T) {
  e.preventDefault();

  return false;
}
