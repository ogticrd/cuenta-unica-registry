import Image from 'next/image'
import Script from 'next/script'

import Logo from "../../../public/assets/logo.png"

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import AppsIcon from '@mui/icons-material/Apps';

export default function Index() {
    console.log(Logo)
    return (
        <>
            <Script src="https://cdn.jsdelivr.net/gh/opticrd/official-header/main.js" defer />
            {/* <official-header></official-header> */}
            <Box sx={{ flexGrow: 1 }}>
                <AppBar position="static">
                    <Toolbar>
                        {/* <IconButton
                            size="large"
                            edge="start"
                            color="inherit"
                            aria-label="menu"
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton> */}
                        {/* <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            News
                        </Typography> */}
                        <div style={{flexGrow: 1}}>
                            <img src={Logo.src} alt="logo" width="350" />
                        </div>
                        <AppsIcon fontSize='large' />
                    </Toolbar>
                </AppBar>
            </Box>
        </>
    );
}
