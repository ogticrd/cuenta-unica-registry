import { TransitionProps } from "@mui/material/transitions";
import { ThemeProvider } from "@aws-amplify/ui-react";
import LogoutIcon from "@mui/icons-material/Logout";
import Toolbar from "@mui/material/Toolbar";
import AppBar from "@mui/material/AppBar";
import Dialog from "@mui/material/Dialog";
import Slide from "@mui/material/Slide";
import { Box } from "@mui/material";
import { forwardRef } from "react";
import Image from "next/image";

import { LivenessQuickStartReact } from "@/components/biometric/face-liveness-detector";
import { ContainerApp } from "@/components/elements/container";
import { ButtonApp } from "@/components/elements/button";
import Logo from "../../../../public/assets/logo.png";

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Step2Modal({
  open,
  handleClick,
  handleNextForm,
  identity,
}: any) {
  return (
    <div>
      <Dialog
        fullScreen
        open={true}
        onClose={handleClick}
        TransitionComponent={Transition}
      >
        <AppBar elevation={0} sx={{ position: "absolute" }}>
          <Toolbar>
            <Box sx={{ flex: 1 }}>
              <Image src={Logo.src} alt="logo" width="200" height="40" />
            </Box>
            <ButtonApp
              notFullWidth
              startIcon={<LogoutIcon />}
              variant="text"
              color="inherit"
              onClick={handleClick}
            >
              Salir
            </ButtonApp>
          </Toolbar>
        </AppBar>
        <div
          className="bg-primary"
          style={{ minHeight: "100vh", paddingTop: "100px" }}
        >
          <ContainerApp>
            {/* <GridContainer> */}
            {/* <GridItem> */}
            <ThemeProvider>
              <LivenessQuickStartReact
                handleNextForm={handleNextForm}
                cedula={identity.payload.id}
              />
            </ThemeProvider>
            {/* </GridItem> */}
            {/* </GridContainer> */}
          </ContainerApp>
        </div>
      </Dialog>
    </div>
  );
}
