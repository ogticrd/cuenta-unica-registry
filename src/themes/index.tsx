import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#003876",
    },
    secondary: {
      main: "#EE2A24",
    },
    info: {
      main: "#0087FF",
    },
    background: {
      default: "#EFF7FF",
    },
  },

  typography: {
    fontFamily: ["Poppins", "sans-serif"].join(","),
  },
  
  components: {
    MuiInputLabel: {
      defaultProps: {
        sx: {
          fontSize: "16px",
          fontWeight: "400",
          color: "#003579",
          overflow: "unset",

          "& span": {
            color: red[500],
          },
        },
      },
    },
    MuiFormLabel: {
      defaultProps: {
        sx: {
          fontSize: "16px",
          fontWeight: "400",

          "& span": {
            color: red[500],
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        sx: {
          '& .MuiInputBase-root': {
            background: '#F8F8F8',
          },
        }
      }
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: "#0087FF",
          },
        },
      },
    }
  },
});
