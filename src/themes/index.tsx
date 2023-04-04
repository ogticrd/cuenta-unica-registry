import { createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

export const theme = createTheme({
    palette: {
        // mode: 'dark',

        primary: {
            main: "#002D62",
        },
        secondary: {
            main: "#EE2A24"
        },
        info: {
            main: "#0087FF"
        },
        background: {
            default: "#EFF7FF",
        },
    },

    typography: {
        fontFamily: [
            'Poppins',
            'sans-serif',
        ].join(','),
    },

    components: {
        //     MuiAppBar: {
        //         styleOverrides: {
        //             colorPrimary: {
        //                 backgroundColor: "white",
        //                 boxShadow: "none",
        //                 borderBottom: "1px solid rgba(0, 0, 0, 0.12)"
        //             }
        //         }
        //     },
        MuiInputLabel: {
            defaultProps: {
                sx: {
                    fontSize: "16px",
                    fontWeight: "400",
                    color: '#003579',
                    // whiteSpace: 'normal',
                    overflow: 'unset',

                    "& span": {
                        color: red[500]
                    }
                },
            },
        },
            MuiFormLabel: {
                defaultProps: {
                    sx: {
                        fontSize: "16px",
                        fontWeight: "400",
        //                 lineHeight: "29px",
        //                 color: '#404040',
        //                 whiteSpace: 'normal',

                        "& span": {
                            color: red[500]
                        }
                    },
                },
            },

        // MuiButton: {
        //     defaultProps: {
        //         sx: {
        //             borderRadius: "50px",
        //         }
        //     }
        // },
    },
});