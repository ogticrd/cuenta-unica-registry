'use client';
import {
  Alert,
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import { RegistrationFlow, UpdateRegistrationFlowBody } from '@ory/client';
import { isUiNodeInputAttributes } from '@ory/integrations/ui';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Visibility from '@mui/icons-material/Visibility';
import { yupResolver } from '@hookform/resolvers/yup';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

import {
  CREATE_BROWSER_REGISTRATION_FLOW_ERROR,
  CREATE_IDENTITY_ERROR,
  VALIDATE_PASSWORD_ERROR,
} from '../../../constants';
import { GridContainer, GridItem } from '@/components/elements/grid';
import PasswordLevel, {
  calculatePasswordStrength,
} from '@/components/elements/passwordLevel';
import { CitizenCompleteData, Step3Form } from '../../../common/interfaces';
import { useSnackAlert } from '@/components/elements/alert';
import { step3Schema } from '../../../common/yup-schemas';
import { ButtonApp } from '@/components/elements/button';
import { Crypto } from '@/helpers';
import { ory } from '@/lib/ory';

export default function Step3({ handleNext, infoCedula }: any) {
  const [flow, setFlow] = useState<RegistrationFlow>();
  // TODO: validate this flowId on account verification
  const [passwordLevel, setPasswordLevel] = useState<any>({});
  const [passwordString, setPasswordString] = useState<string>('');
  const [isPwned, setIsPwned] = useState(false);
  const { AlertWarning, AlertError } = useSnackAlert();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const searchParams = useSearchParams();
  const returnTo = searchParams?.get('return_to');

  useEffect(() => {
    const fetchFlow = async () => {
      try {
        const { data: flow } = await ory.createBrowserRegistrationFlow({
          returnTo: returnTo ? String(returnTo) : undefined,
        });

        setFlow(flow);
      } catch (err: any) {
        AlertWarning(CREATE_BROWSER_REGISTRATION_FLOW_ERROR);
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
  } = useForm<Step3Form>({
    mode: 'onChange',
    resolver: yupResolver(step3Schema),
  });

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const handleChangePassword = (password: string) => {
    setPasswordString(password);
    setPasswordLevel(calculatePasswordStrength(password));
    setValue('password', password);
    setIsPwned(false);
  };

  const onSubmitHandler = async (form: Step3Form) => {
    if (isPwned || passwordLevel.id !== 3) {
      return;
    }

    const password = Crypto.encrypt(form.password);

    try {
      const { data } = await axios.get<number>(`/api/pwned/${password}`);

      const isValidPassword = data !== 0;
      setIsPwned(isValidPassword);
    } catch (err: any) {
      AlertError(VALIDATE_PASSWORD_ERROR);

      return;
    }

    try {
      const { data: citizen } = await axios.get<CitizenCompleteData>(
        `/api/citizens/${infoCedula.id}?validated=true`,
      );

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

      const {
        data: { continue_with },
      } = await ory.updateRegistrationFlow({
        flow: String(flow?.id),
        updateRegistrationFlowBody,
      });

      if (returnTo) {
        window.location.href = returnTo;
        return;
      }

      handleNext();

      if (continue_with) {
        for (const item of continue_with) {
          switch (item.action) {
            case 'show_verification_ui':
              // TODO: check more about this line
              // await router.push("/verification?flow=" + item?.flow.id)
              return;
          }
        }
      }
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

      AlertError(CREATE_IDENTITY_ERROR);
      return;
    }
  };

  // TODO: Use this Password UI approach https://stackblitz.com/edit/material-password-strength?file=Icons.js
  return (
    <>
      <Typography
        component="div"
        color="primary"
        textAlign="center"
        sx={{ my: 4, fontSize: '16px' }}
      >
        <Box sx={{ fontWeight: 500 }}>
          Para finalizar tu registro completa los siguientes campos:
        </Box>
      </Typography>

      <form onSubmit={handleSubmit(onSubmitHandler)}>
        <GridContainer>
          <GridItem lg={12} md={12}>
            <Tooltip title="Correo personal">
              <TextField
                {...register('email')}
                required
                type="email"
                label="Correo Electrónico"
                helperText={errors.email?.message}
                autoComplete="off"
                fullWidth
                onPaste={(e) => {
                  e.preventDefault();
                  return false;
                }}
                onCopy={(e) => {
                  e.preventDefault();
                  return false;
                }}
              />
            </Tooltip>
          </GridItem>

          <GridItem lg={12} md={12}>
            <TextField
              {...register('emailConfirm')}
              required
              type="email"
              label="Confirma tu Correo Electrónico"
              helperText={errors.emailConfirm?.message}
              autoComplete="off"
              fullWidth
              onPaste={(e) => {
                e.preventDefault();
                return false;
              }}
              onCopy={(e) => {
                e.preventDefault();
                return false;
              }}
            />
          </GridItem>

          <GridItem lg={12} md={12}>
            <TextField
              required
              type={showPassword ? 'text' : 'password'}
              label="Contraseña"
              placeholder="*********"
              helperText={errors.password?.message}
              fullWidth
              {...register('password')}
              onChange={(e) => handleChangePassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
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
              label="Confirma tu Contraseña"
              placeholder="*********"
              disabled={passwordLevel.id === 3 ? false : true}
              helperText={errors.passwordConfirm?.message}
              fullWidth
              {...register('passwordConfirm')}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() =>
                        setShowPasswordConfirm(!showPasswordConfirm)
                      }
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
              <Alert severity="warning">
                Esta contraseña ha estado en filtraciones de datos, por eso no
                se considera segura. Te recomendamos eligir otra contraseña.
              </Alert>
            </GridItem>
          )}

          <GridItem lg={12} md={12}>
            <br />
            <ButtonApp
              submit
              endIcon={<CheckCircleOutlineOutlinedIcon />}
              disabled={isPwned}
            >
              CREAR CUENTA ÚNICA
            </ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
