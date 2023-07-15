import { forwardRef, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useReCaptcha } from 'next-recaptcha-v3';
import { CitizensBasicInformationResponse } from '@/pages/api/types';
import axios from 'axios';
import { useSnackbar } from '@/components/elements/alert';
import ArrowCircleRightOutlinedIcon from '@mui/icons-material/ArrowCircleRightOutlined';
import { Box, TextField, Typography, Tooltip } from '@mui/material';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { ButtonApp } from '@/components/elements/button';
import { IMaskInput } from 'react-imask';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { labels } from '@/constants/labels';
import LoadingBackdrop from '@/components/elements/loadingBackdrop';
import { TextBodyTiny } from '@/components/elements/typography';
import Link from 'next/link';
interface IFormInputs {
  cedula: string;
}

const schema = yup.object({
  cedula: yup
    .string()
    .trim()
    .required(labels.form.requiredField)
    .min(11, 'Debe contener 11 dígitos')
    .max(11, 'Debe contener 11 dígitos'),
});

interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
}

const TextMaskCustom = forwardRef<HTMLElement, CustomProps>(
  function TextMaskCustom(props, ref: any) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="000-0000000-0"
        // definitions={{
        //   '#': /[1-9]/,
        // }}
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
  const [loading, setLoading] = useState(false);

  const [valueCedula, setValueCedula] = useState('');

  const luhnCheck = (num: string) => {
    const arr = (num + '')
      .split('')
      .reverse()
      .map((x) => parseInt(x));
    const lastDigit = arr.splice(0, 1)[0];
    let sum = arr.reduce(
      (acc, val, i) =>
        i % 2 !== 0 ? acc + val : acc + (val * 2 > 9 ? val * 2 - 9 : val * 2),
      0
    );
    sum += lastDigit;
    return sum % 10 === 0;
  };

  const {
    handleSubmit: handleFormSubmit,
    formState: { errors },
    setValue,
  } = useForm<IFormInputs>({
    reValidateMode: 'onSubmit',
    // shouldFocusError: false,
    resolver: yupResolver(schema),
  });

  const { executeRecaptcha } = useReCaptcha();
  const { AlertError, AlertWarning } = useSnackbar();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue('cedula', event.target.value.replace(/-/g, ''));
    setValueCedula(event.target.value);
  };

  const handleSubmit = useCallback(
    async (data: IFormInputs) => {
      const cleanCedula = data?.cedula?.replace(/-/g, '');
      if (cleanCedula?.length !== 11 || !luhnCheck(cleanCedula)) {
        AlertError('Por favor introduzca un número de cédula válido.');
        return;
      }
      setLoading(true);
      // Generate ReCaptcha token
      const token = await executeRecaptcha('form_submit');

      if (!token) {
        AlertWarning(
          'Problemas con el reCaptcha, intente nuevamente más tarde'
        );
        setLoading(false);
        return;
      }

      try {
        const response = await axios.post('/api/recaptcha/assesments', {
          token,
        });
        if (response.data && response.data.isHuman === true) {
          const responseCedula = await fetch(`/api/iam/${cleanCedula}`);
          if (responseCedula.status !== 200) {
            throw new Error('Failed to fetch iam data');
          }
          const { exists } = await responseCedula.json();
          if (exists) {
            console.log(exists);
            return AlertWarning('Su Cédula ya se encuentra registrada.');
          }
          const response = await fetch(`/api/citizens/${cleanCedula}`);
          if (response.status !== 200) {
            throw new Error('Failed to fetch citizen data');
          }
          const citizen: CitizensBasicInformationResponse =
            await response.json();
          setInfoCedula(citizen);
          handleNext();
        }
        if (response.data && response.data.isHuman === false) {
          AlertWarning(
            'No podemos validar si eres un humano, intenta desde otro navegador o dispositivo.'
          );
        }
      } catch (err) {
        console.error(err);
        // AlertError('Esta cédula es correcta, pero no hemos podido validarla.');
        AlertError('No hemos podido validar su Cédula');
      } finally {
        setLoading(false);
      }
    },
    [executeRecaptcha, handleNext, setInfoCedula, AlertWarning, AlertError]
  );

  return (
    // TODO: Validate this loading approach with Backdrop
    <>
      {/* <div>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
          <Typography variant="subtitle1">Validando cédula...</Typography>
        </Backdrop>
      </div> */}
      {loading && <LoadingBackdrop text="Validando cédula..." />}

      <Typography component="div" color="primary" textAlign="center">
        <Box sx={{fontWeight: 500, fontSize: "16px", my: 4}}>
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
                onChange={handleChange}
                label="Número de Cédula"
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
