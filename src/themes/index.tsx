import { createTheme } from '@mui/material/styles';
// import Red from '@mui/material/colors/red';

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
                    fontSize: "20px",
                    color: '#166fb9',
                    whiteSpace: 'normal',
                    overflow: 'unset',
                    fontWeight: "bold",

                    // "& span": {
                    //     color: Red[500]
                    // }
                },
            },
        },
    //     MuiFormLabel: {
    //         defaultProps: {
    //             sx: {
    //                 fontSize: "15px",
    //                 fontWeight: "600",
    //                 lineHeight: "29px",
    //                 color: '#404040',
    //                 whiteSpace: 'normal',

    //                 "& span": {
    //                     color: Red[500]
    //                 }
    //             },
    //         },
    //     },
    MuiButton: {
        defaultProps: {
            sx: {
                borderRadius: "20px"
            }
        }
    },
    },
});