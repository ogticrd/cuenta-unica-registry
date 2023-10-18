'use client';

import {
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

type Props = {
  step: number;
};

export function Steps({ step }: Props) {
  const steps = ['Identificación', 'Verificación', 'Registro'];
  const stepDetails = [
    'DNI del usuario',
    'Prueba de vida',
    'Cuenta de usuario',
  ];

  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <Stepper
      alternativeLabel={!matches}
      sx={{ paddingBottom: '20px', borderBottom: '1px solid #9FD0FD' }}
      activeStep={step}
    >
      {steps.map((step, index) => (
        <Step key={step}>
          <StepLabel
            optional={
              <Typography variant="caption">{stepDetails[index]}</Typography>
            }
          >
            <span style={{ fontWeight: '700' }}>{step}</span>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
