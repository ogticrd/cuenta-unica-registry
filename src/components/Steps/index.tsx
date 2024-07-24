'use client';

import {
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { useLanguage } from '@/app/[lang]/provider';

type Props = { step: number };

export function Steps({ step }: Props) {
  const {
    intl: { step1, step2, step3 },
  } = useLanguage();

  const steps = [
    { title: step1.title, subtitle: step1.subtitle },
    { title: step2.title, subtitle: step2.subtitle },
    { title: step3.title, subtitle: step3.subtitle },
  ];

  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stepper
      alternativeLabel={mobile}
      sx={{ paddingBottom: '20px', borderBottom: '1px solid #9FD0FD' }}
      activeStep={step}
    >
      {steps.map(({ title, subtitle }, index) => (
        <Step key={index}>
          <StepLabel
            optional={<Typography variant="caption">{subtitle}</Typography>}
          >
            <span style={{ fontWeight: '700' }}>{title}</span>
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
