'use client';

import useMediaQuery from '@mui/material/useMediaQuery';
import Typography from '@mui/material/Typography';
import React, { useState, Fragment } from 'react';
import { useTheme } from '@mui/material/styles';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
// TODO: Use the <Link> component for navigation unless we have a specific requirement for using useRouter
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import Box from '@mui/material/Box';

import { routes } from '@/constants/routes';
import Step1 from './step1';
import Step2 from './step2';
import Step3 from './step3';

const steps = ['Identificación', 'Verificación', 'Registro'];
const optionalLabels = [
  'ID del usuario',
  'Prueba de vida',
  'Cuenta de usuario',
];

export default function StepperRegister() {
  const router = useRouter();
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set<number>());
  const [infoCedula, setInfoCedula] = useState({});

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      return router.push(routes.register.registered);
    }

    if (skipped.has(activeStep)) {
      const newSkipped = new Set(skipped.values());
      newSkipped.delete(activeStep);
      setSkipped(newSkipped);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const getStepComponent = () => {
    switch (activeStep) {
      case 0:
        return <Step1 setInfoCedula={setInfoCedula} handleNext={handleNext} />;
      case 1:
        return (
          <Step2
            infoCedula={infoCedula}
            handleNext={handleNext}
            handleReset={handleReset}
          />
        );
      case 2:
        return <Step3 infoCedula={infoCedula} handleNext={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper
        alternativeLabel={!matches}
        sx={{ paddingBottom: '20px', borderBottom: '1px solid #9FD0FD' }}
        activeStep={activeStep}
      >
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              optional={
                <Typography variant="caption">
                  {optionalLabels[index]}
                </Typography>
              }
            >
              <span style={{ fontWeight: '700' }}>{label}</span>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            All steps completed - you&apos;re finished
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </Fragment>
      ) : (
        <div style={{ margin: '0px 25px' }}>{getStepComponent()}</div>
      )}
    </Box>
  );
}
