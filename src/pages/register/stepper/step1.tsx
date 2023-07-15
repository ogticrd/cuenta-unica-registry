import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { Box, TextField, Typography, Tooltip } from '@mui/material';
import { forwardRef, useCallback, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useReCaptcha } from 'next-recaptcha-v3';
import { useForm } from 'react-hook-form';
import { IMaskInput } from 'react-imask';
import Link from 'next/link';
import axios from 'axios';

import {
  IDENTITY_ALREADY_EXISTS_ERROR,
  INVALID_CEDULA_ERROR,
  INVALID_CEDULA_NUMBER_ERROR,
  RECAPTCHA_ISSUES_ERROR,
  RECAPTCHA_VALIDATION_ERROR,
} from '@/constants';
import { GridContainer, GridItem } from '@/components/elements/grid';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { TextBodyTiny } from '@/components/elements/typography';
import { useSnackbar } from '@/components/elements/alert';
import { ButtonApp } from '@/components/elements/button';
import { CedulaInput, CustomProps } from './interfaces';
import { cedulaSchema } from './yup-schemas';
import { Validations } from '@/helpers';

const TextMaskCustom = forwardRef<HTMLElement, CustomProps>(
  function TextMaskCustom(props, ref: any) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="000-0000000-0"
        inputRef={ref}
        onAccept={(value: any) =>
          onChange({ target: { name: props.name, value } })
        }
        overwrite
      />
    );
  }
);

export default function Step1({ setInfoCedula, handleNext }: any) {
  const [valueCedula, setValueCedula] = useState('');
  const { AlertError, AlertWarning } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const { executeRecaptcha } = useReCaptcha();

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<CedulaInput>({
    reValidateMode: 'onSubmit',
    resolver: yupResolver(cedulaSchema),
  });

  const onCedulaChangeHandler = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue('cedula', event.target.value.replace(/-/g, ''));
    setValueCedula(event.target.value);
  };

  const handleSubmit = useCallback(
    async (data: CedulaInput) => {
      const cleanCedula = data?.cedula?.replace(/-/g, '');
      const luhnValidatedCedula = Validations.luhnCheck(cleanCedula);

      if (cleanCedula?.length !== 11 || !luhnValidatedCedula) {
        AlertError(INVALID_CEDULA_NUMBER_ERROR);

        return;
      }

      setLoading(true);

      // Generate ReCaptcha token
      const token = await executeRecaptcha('form_submit');

      if (!token) {
        AlertWarning(RECAPTCHA_ISSUES_ERROR);
        setLoading(false);

        return;
      }

      try {
        const {
          data: { isHuman },
        } = await axios.post<{ isHuman: boolean }>(
          '/api/recaptcha/assesments',
          {
            token,
          }
        );

        if (!isHuman) {
          return AlertError(RECAPTCHA_VALIDATION_ERROR);
        }

        const {
          data: { exists },
        } = await axios.get<{ exists: boolean }>(`/api/iam/${cleanCedula}`);

        if (exists) {
          return AlertError(IDENTITY_ALREADY_EXISTS_ERROR);
        }

        const { data: citizen } = await axios.get(
          `/api/citizens/${cleanCedula}`
        );

        setInfoCedula(citizen);
        handleNext();
      } catch (err: any) {
        console.error(err.message || err);

        return AlertError(INVALID_CEDULA_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [executeRecaptcha, handleNext, setInfoCedula, AlertWarning, AlertError]
  );

  return (
    <>
      {loading && <LoadingBackdrop text="Validando cédula..." />}

      <Typography component="div" color="primary" textAlign="center">
        <Box sx={{ fontWeight: 500, fontSize: '16px', my: 4 }}>
          Este es el primer paso para poder verificar tu identidad y crear tu
          cuenta ciudadana.
        </Box>
      </Typography>

      <form onSubmit={handleFormSubmit(handleSubmit)}>
        <GridContainer>
          <GridItem lg={12} md={12}>
            <Tooltip title="Para iniciar el proceso de validar tu identidad es necesario tu número de cédula.">
              <TextField
                required
                value={valueCedula}
                onChange={onCedulaChangeHandler}
                label="Número de cédula"
                placeholder="***-**00000-0"
                autoComplete="off"
                error={Boolean(errors.cedula)}
                helperText={errors?.cedula?.message}
                InputProps={{
                  inputComponent: TextMaskCustom as any,
                }}
                fullWidth
              />
            </Tooltip>
          </GridItem>

          <GridItem lg={12} md={12}>
            <br />
            <ButtonApp submit endIcon={<ArrowCircleRightOutlinedIcon />}>
              CONFIRMAR
            </ButtonApp>
          </GridItem>
        </GridContainer>

        <br />
        <GridContainer>
          <GridItem md={12} lg={12}>
            <TextBodyTiny textCenter>
              <Link
                href={'https://beta.auth.digital.gob.do/realms/master/account'}
                style={{ textDecoration: 'none' }}
              >
                <span className="text-secondary">¿Ya tienes una cuenta?</span>{' '}
                Inicia sesión aquí.
              </Link>
            </TextBodyTiny>
          </GridItem>
        </GridContainer>
      </form>
    </>
  );
}
