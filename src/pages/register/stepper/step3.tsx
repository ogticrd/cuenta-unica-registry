import { passwordStrength } from 'check-password-strength';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import * as yup from 'yup';
import axios from 'axios';
import { Crypto } from '@/helpers';

import PasswordLevel from '@/components/elements/passwordLevel';
import { useSnackbar } from '@/components/elements/alert';
import { labels } from '@/constants/labels';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

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
  const [loadingValidatingPassword, setLoadingValidatingPassword] =
    useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [passwordLevel, setPasswordLevel] = useState<any>({});
  const [isPwned, setIsPwned] = useState(false);
  const { AlertError, AlertWarning } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    mode: 'onChange',
    resolver: yupResolver(schema),
  });

  const handleClickShowPassword = () => setShowPassword((show) => !show);

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
        .then((res) => {
          console.log(res);
          const isPwnedIncludes = res.data === 0 ? false : true;
          setIsPwned(isPwnedIncludes);
          if (!isPwnedIncludes) {
            setLoadingValidatingPassword(false);
            setLoading(true);
            axios
              .post('/api/iam', {
                email: data.email,
                username: infoCedula.id,
                password,
              })
              .then(() => {
                handleNext();
              })
              .catch((err) => {
                if (err?.response?.status === 409) {
                  AlertError('Esta cédula/correo ya está registrado.');
                } else {
                  AlertError();
                }
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
      <div>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loadingValidatingPassword}
        >
          <CircularProgress color="inherit" />
          <Typography variant="subtitle1">Validando contraseña...</Typography>
        </Backdrop>
      </div>
      <div>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
          <Typography variant="subtitle1">Creando usuario...</Typography>
        </Backdrop>
      </div>
      <Typography component="div" color="primary" textAlign="center" p={2}>
        <Box sx={{ fontWeight: 'bold' }}>
          Para finalizar tu registro completa los siguientes campos:
        </Box>
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Tooltip title="Correo personal">
              <TextField
                {...register('email')}
                required
                type="email"
                label="Correo Electrónico"
                helperText={errors.email?.message}
                fullWidth
              />
            </Tooltip>
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              label="Confirma tu Correo Electrónico"
              helperText={errors.emailConfirm?.message}
              fullWidth
              {...register('emailConfirm')}
            />
          </Grid>

          <Grid item xs={12}>
            <Tooltip
              title={
                <>
                  <b>
                    Al menos 8 caracteres de largo
                    <br />
                    Al menos 3 de los siguientes:
                  </b>
                  <li>Letras minúsculas (a-z)</li>
                  <li>Letras mayúsculas (A-Z)</li>
                  <li>Números (0-9)</li>
                  <li>Caracteres especiales (por ejemplo, !@#$%^&*)</li>
                </>
              }
            >
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
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
            <PasswordLevel passwordLevel={passwordLevel} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              required
              type="password"
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
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {isPwned && (
            <Grid item xs={12}>
              <Snackbar>
                <Typography variant="body2" color="error">
                  Esta contraseña ha estado en filtraciones de datos, por eso no
                  se considera segura. Te recomendamos eligir otra contraseña.
                </Typography>
              </Snackbar>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button variant="contained" color="primary" type="submit" fullWidth>
              CREAR CUENTA ÚNICA
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
}
