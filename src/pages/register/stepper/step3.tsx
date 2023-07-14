import { passwordStrength } from 'check-password-strength';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';
import { Crypto } from '@/helpers';
import { useRouter } from 'next/router';

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
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import PasswordLevel from '@/components/elements/passwordLevel';
import { useSnackbar } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { labels } from '@/constants/labels';

import {
  RegistrationFlow,
  UpdateRegistrationFlowBody
} from "@ory/client"

import ory from "../../../sdk"

interface IFormInputs {
  email: string;
  emailConfirm: string;
  password: string;
  passwordConfirm: string;
}

const schema = yup.object({
  email: yup
    .string()
    .trim()
    .email(labels.form.invalidEmail)
    .required(labels.form.requiredField),
  emailConfirm: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .oneOf([yup.ref('email')], 'Los correos no coinciden'),
  password: yup.string().required(labels.form.requiredField),
  passwordConfirm: yup
    .string()
    .required(labels.form.requiredField)
    .oneOf([yup.ref('password')], 'Las contraseñas no coinciden'),
});

export default function Step3({ handleNext, infoCedula }: any) {
  const router = useRouter();
  console.log(infoCedula)

  const [flow, setFlow] = useState<RegistrationFlow>();
  console.log(flow)

  const { flow: flowId, return_to: returnTo } = router.query
  console.log(router)

  const [loadingValidatingPassword, setLoadingValidatingPassword] =
    useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordLevel, setPasswordLevel] = useState<any>({});
  const [isPwned, setIsPwned] = useState(false);
  const { AlertError, AlertWarning } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    ory
      .createBrowserRegistrationFlow({
        returnTo: returnTo ? String(returnTo) : undefined,
      })
      .then(({ data: flow }) => {
        setFlow(flow)
      })
      .catch((err) => {
        // Couldn't create login flow
        // handle the error
      })
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleChangePassword = (password: string) => {
    const level = passwordStrength(password);
    setPasswordLevel(level);
    setValue('password', password);
    setIsPwned(false);
  };

  const onSubmit = (data: IFormInputs) => {
    if (isPwned) return;
    if (passwordLevel.id !== 3) return;
    setLoadingValidatingPassword(true);

    const password = Crypto.encrypt(data.password);

    if (!isPwned) {
      axios
        .get(`/api/pwned/${password}`)
        .then(async (res) => {
          console.log(res);
          const isPwnedIncludes = res.data === 0 ? false : true;
          setIsPwned(isPwnedIncludes);
          if (!isPwnedIncludes) {
            setLoadingValidatingPassword(false);
            setLoading(true);

            const node: any = flow?.ui.nodes.find((n: any) => n.attributes['name'] === "csrf_token");
            const csrf_token = node?.attributes.value as string;

            const obj: UpdateRegistrationFlowBody = {
              csrf_token: csrf_token,
              method: "password",
              password: data.password,
              traits: {
                email: data.email,
                // cedula: "00000000000",
                cedula: infoCedula.id,
                firstName: "ogtic",
                lastName: "ogtic",
              }
            }

            ory
              .updateRegistrationFlow({
                flow: String(flow?.id),
                updateRegistrationFlowBody: obj,
              })
              .then(async ({ data }: any) => {
                handleNext();

                if (data.continue_with) {
                  for (const item of data?.continue_with) {
                    switch (item.action) {
                      case "show_verification_ui":
                        // await router.push("/verification?flow=" + item?.flow.id)
                        return
                    }
                  }
                }
              })
              .catch((err: any) => {
                console.log("DATA ", err.response);

                if (err.response.data) {
                  console.log(err.response.data)
                  const messages = err.response.data.ui.messages;
                  const nodes = err.response.data.ui.nodes;
                  const errors = [];

                  if (messages && messages.length) {
                    const e = messages.filter((m: any) => m.type === "error").map((e: any) => e.text);
                    errors.push(e);
                  }

                  if (nodes && nodes.length) {
                    /// TODO: sacar los errores de los nodos retornados por ORY!!
                    const e = nodes.filter((node: any) => node.messages.length && node.messages.filter((x: any) => x.type === "error")).map((a: any) => a.messages);//.map((b: any) => b.text);
                    errors.push(e);
                  }
                  console.log("errores ORY ", errors)
                }
                // If the previous handler did not catch the error it's most likely a form validation error
                if (err.response?.status === 400) {
                  setFlow(err.response?.data)
                  return
                }
                return Promise.reject(err)
              })
              .finally(() => setLoading(false));
          }
        })
        .catch(() => {
          AlertWarning('No pudimos validar si la contraseña es segura.');
        })
        .finally(() => setLoadingValidatingPassword(false));
    }
  };

  // TODO: Use this Password UI approach https://stackblitz.com/edit/material-password-strength?file=Icons.js
  return (
    <>
      {loadingValidatingPassword && (
        <LoadingBackdrop text="Validando contraseña..." />
      )}
      {loading && <LoadingBackdrop text="Creando usuario..." />}

      <Typography component="div" color="primary" textAlign="center" p={2}>
        <Box sx={{ fontWeight: 'bold' }}>
          Para finalizar tu registro completa los siguientes campos:
        </Box>
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
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
            <PasswordLevel passwordLevel={passwordLevel} />
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
