'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Dialog from '@mui/material/Dialog';
import { Box } from '@mui/material';
import Image from 'next/image';

import LogoWhite from '@public/assets/logo-white.svg';
import styles from './styles.module.css';

import { LivenessQuickStart } from '@/components/LivenessQuickStart';
import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '@/app/[lang]/provider';
import theme from '@/components/themes/theme';
import { Transition } from './Transition';

type Props = {
  cedula: string;
  source: 'registration' | 'vid';
  flowId?: string;
  setOpen: (isOpen: boolean) => void;
  redirectUri?: string;
  state?: string;
};

export function LivenessModal({
  cedula,
  source,
  flowId,
  setOpen,
  redirectUri,
  state,
}: Props) {
  const closeModal = () => setOpen(false);
  const { intl } = useLanguage();

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
          <LivenessQuickStart
            cedula={cedula}
            source={source}
            flowId={flowId}
            redirectUri={redirectUri}
            state={state}
          />
        </div>
      </Dialog>
    </div>
  );
}
