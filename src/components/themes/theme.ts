import { Poppins } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

const poppins = Poppins({
  weight: ['300', '400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#003876',
    },
    secondary: {
      main: '#EE2A24',
    },
    info: {
      main: '#0087FF',
      contrastText: '#6DB0E2',
    },
    background: {
      default: '#EFF7FF',
    },
  },

  typography: {
    fontFamily: poppins.style.fontFamily,
  },

  components: {
    MuiButton: {
      defaultProps: {
        sx: {
          borderRadius: '60px',
          height: '40px',
        },
      },
    },
    MuiInputLabel: {
      defaultProps: {
        sx: {
          fontSize: '16px',
          fontWeight: '400',
          color: '#003579',
          overflow: 'unset',

          '& span': {
            color: red[500],
          },
        },
      },
    },
    MuiFormLabel: {
      defaultProps: {
        sx: {
          fontSize: '16px',
          fontWeight: '400',

          '& span': {
            color: red[500],
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        sx: {
          '& .MuiInputBase-root': {
            background: '#ffffff',
          },
          '& fieldset': {
            borderColor: '#E6E7E8',
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: '#6DB0E2',
          },
        },
      },
    },
  },
});

export default theme;
