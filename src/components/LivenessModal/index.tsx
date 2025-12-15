'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Dialog from '@mui/material/Dialog';
import { Box } from '@mui/material';
import Image from 'next/image';
import React from 'react';

import LogoWhite from '@public/assets/logo-white.svg';
import styles from './styles.module.css';

import { LivenessQuickStart } from '@/components/LivenessQuickStart';
import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '@/app/[lang]/provider';
import { LIVENESS_TIMEOUT_SECONDS } from '@/common';
import theme from '@/components/themes/theme';
import { Transition } from './Transition';

type Props = {
  cedula: string;
  setOpen: (isOpen: boolean) => void;
  redirectUri?: string;
  state?: string;
};

export function LivenessModal({ cedula, setOpen, redirectUri, state }: Props) {
  const closeModal = () => setOpen(false);
  const { intl } = useLanguage();

  React.useEffect(() => {
    const ms = LIVENESS_TIMEOUT_SECONDS * 1000;
    const timeout = setTimeout(() => window.location.reload(), ms);

    return () => clearTimeout(timeout);
  });

  return (
    <div>
      <Dialog
        fullScreen
        open={true}
        onClose={closeModal}
        slots={{
          transition: Transition,
        }}
        slotProps={{
          paper: {
            style: {
              backgroundColor: theme.palette.primary.main,
            },
          },
        }}
      >
        <div className={styles.layer_logo} />
        <AppBar elevation={0} sx={{ position: 'relative' }}>
          <div style={{ width: '100%', maxWidth: '1400px', margin: 'auto' }}>
            <Toolbar>
              <Box sx={{ flex: 1 }}>
                <Image src={LogoWhite.src} alt="logo" width="100" height="52" />
              </Box>
              <ButtonApp
                notFullWidth
                startIcon={<LogoutIcon />}
                variant="text"
                color="inherit"
                onClick={closeModal}
              >
                {intl.stepper.exit}
              </ButtonApp>
            </Toolbar>
          </div>
        </AppBar>
        <div className={styles.liveness_container}>
          <LivenessQuickStart cedula={cedula} redirectUri={redirectUri} state={state} />
        </div>
      </Dialog>
    </div>
  );
}
