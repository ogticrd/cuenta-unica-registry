'use client';

import React, { createContext, use, useState } from 'react';
import Alert, { AlertProps } from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Grow from '@mui/material/Grow';

// Snackbar state and methods interface
interface SnackbarState {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
  open: boolean;
  content: string;
  severity: AlertProps['severity'];
}

interface SnackAlertMethods {
  AlertError: (text?: string) => void;
  AlertWarning: (text: string) => void;
  AlertSuccess: (text: string) => void;
}

interface SnackAlertProps {
  children: React.ReactNode;
}

// Create context for the alert methods
const SnackAlertContext = createContext<SnackAlertMethods | null>(null);

export const useSnackAlert = () => {
  const context = use(SnackAlertContext);
  if (!context) {
    throw new Error('useSnackAlert must be used within SnackAlert');
  }
  return context;
};

const SnackAlert: React.FC<SnackAlertProps> = ({ children }) => {
  const defaultSnackbarState: SnackbarState = {
    vertical: 'bottom',
    horizontal: 'left',
    open: false,
    content: '',
    severity: 'success' as AlertProps['severity'],
  };

  const [snackbar, setSnackbar] = useState<SnackbarState>(defaultSnackbarState);

  const handleClose = () => setSnackbar({ ...snackbar, open: false });

  const handleOpen = (data: Partial<SnackbarState>) =>
    setSnackbar({ ...snackbar, ...data, open: true });

  const AlertError = (
    text: string = 'Ocurrió un error al procesar la solicitud',
  ) => handleOpen({ content: text, severity: 'error' });

  const AlertWarning = (text: string) =>
    handleOpen({ content: text, severity: 'warning' });

  const AlertSuccess = (text: string = 'Proceso realizado correctamente') =>
    handleOpen({ content: text, severity: 'success' });

  const { vertical, horizontal, open, severity, content } = snackbar;

  return (
    <SnackAlertContext.Provider
      value={{ AlertError, AlertWarning, AlertSuccess }}
    >
      {children}
      <Grow in={open} style={{ transformOrigin: 'bottom left' }}>
        <Snackbar
          anchorOrigin={{ vertical, horizontal }}
          open={open}
          onClose={handleClose}
          key={`${vertical}-${horizontal}`}
        >
          <Alert
            onClose={handleClose}
            severity={severity}
            variant="filled"
            sx={{ maxWidth: '37rem', lineHeight: '1.4rem' }}
          >
            {content}
          </Alert>
        </Snackbar>
      </Grow>
    </SnackAlertContext.Provider>
  );
};

export default SnackAlert;
