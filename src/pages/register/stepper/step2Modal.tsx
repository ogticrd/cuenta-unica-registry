import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import MasksOutlinedIcon from '@mui/icons-material/MasksOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

import Logo from "../../../../public/assets/logo.png"
import { Box } from '@mui/material';
import { ButtonApp } from '@/components/elements/button';
import { ContainerApp } from '@/components/elements/container';
import { GridContainer, GridItem } from '@/components/elements/grid';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Step2Modal({ open, handleClick, handleNextForm }: any) {

  const videoRef = React.useRef<HTMLVideoElement>(null);
  console.log(videoRef)

  // React.useEffect(() => {
  //   if (videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          const video = videoRef.current!;
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
          };
        })
        .catch((error) => {
          console.error('Error al acceder a la cámara:', error);
        });
  //   }
  // }, []);

  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClick}
        TransitionComponent={Transition}
      >
        <AppBar elevation={0} sx={{ position: 'absolute' }}>
          <Toolbar>
            <Box sx={{ flex: 1 }}>
              <img src={Logo.src} alt="logo" width="350" />
            </Box>
            <ButtonApp
              notFullWidth
              startIcon={<LogoutIcon />}
              variant='text'
              color='inherit'
              onClick={handleClick}
            >
              Salir
            </ButtonApp>
          </Toolbar>
        </AppBar>
        <div className="bg-primary" style={{ minHeight: "100vh", paddingTop: "80px" }}>
          <ContainerApp>
            <GridContainer
            spacing={5}
              flexDirection={{ xs: "column", sm: "row" }}
            >
              <GridItem sx={{ order: { xs: 2, sm: 1 } }} sm={12} md={4} lg={3}>
                <Typography color="white" fontSize="18px" fontWeight="bold" gutterBottom>
                  Para verificar realiza unas fotos de tu rostro, mantén la mirada adelante con gesto neutral.
                </Typography>
                <Typography color="white" fontWeight="400" fontSize={14} gutterBottom>
                  Hasta que el círculo se ponga verde.
                </Typography>

                <div className="py-1">
                  <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                    <MasksOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                    <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">No usar lentes, gorra o cubrir el rostro</Typography>
                  </div>

                  <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                    <SentimentSatisfiedAltOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                    <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">Acercar el rostro al circulo</Typography>
                  </div>

                  <div style={{ background: "#EFF7FF", borderRadius: "4px", padding: "10px 8px", marginBottom: "12px", display: "flex", alignItems: "center", flexDirection: "row" }}>
                    <LightModeOutlinedIcon sx={{ fontSize: "33px", marginRight: "12px" }} color="info" />
                    <Typography variant="body2" fontSize={14} color="primary" fontWeight="bold">Buscar buena iluminación sin reflejos</Typography>
                  </div>
                </div>

                <br />

                <ButtonApp 
                  color="inherit"
                  onClick={() => handleNextForm()}
                >
                  <span className="text-secondary" style={{fontWeight: "bold"}}>CONTINUAR</span>
                </ButtonApp>

              </GridItem>
              <GridItem sx={{ order: { xs: 1, sm: 2 } }} sm={12} md={8} lg={9}>
                  <video ref={videoRef} style={{height: "auto", width: "auto"}} autoPlay />
              </GridItem>
            </GridContainer>
          </ContainerApp>
        </div>
      </Dialog>
    </div>
  );
}