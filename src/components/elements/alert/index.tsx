import React, { createContext, useContext, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

interface SnackbarContextProps {
  openSnackbar: (message: string, severity: AlertProps['severity']) => void;
}

// Create context with default undefined value
const SnackbarContext = createContext<SnackbarContextProps | undefined>(
  undefined,
);

interface SnackbarProviderProps {
  children?: React.ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [snackbarConfig, setSnackbarConfig] = useState({
    open: false,
    message: '',
    severity: 'success' as AlertProps['severity'],
  });

  // Open snackbar
  const openSnackbar = (message: string, severity: AlertProps['severity']) => {
    setSnackbarConfig({ open: true, message, severity });
  };

  // Close snackbar
  const closeSnackbar = () => {
    setSnackbarConfig((prevState) => ({ ...prevState, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ openSnackbar }}>
      <Snackbar
        open={snackbarConfig.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
      >
        <MuiAlert
          onClose={closeSnackbar}
          severity={snackbarConfig.severity}
          variant="filled"
        >
          {snackbarConfig.message}
        </MuiAlert>
      </Snackbar>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }

  const { openSnackbar } = context;

  return {
    AlertError: (text?: string) =>
      openSnackbar(
        text || 'Ocurrió un error al procesar la solicitud',
        'error',
      ),
    AlertWarning: (text: string) => openSnackbar(text, 'warning'),
    AlertSuccess: (text: string) =>
      openSnackbar(text || 'Proceso realizado correctamente', 'success'),
  };
};
