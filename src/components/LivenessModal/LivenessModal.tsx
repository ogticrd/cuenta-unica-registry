'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Dialog from '@mui/material/Dialog';
import { Box } from '@mui/material';
import Image from 'next/image';

import { LivenessQuickStart } from '@/components/LivenessQuickStart';
import { ButtonApp } from '@/components/elements/button';
import Logo from '../../../public/assets/logo.svg';
import theme from '@/components/themes/theme';
import { Transition } from './Transition';
import { useLanguage } from '@/app/[lang]/provider';

type Props = {
  cedula: string;
  setOpen: (isOpen: boolean) => void;
};

export function LivenessModal({ cedula, setOpen }: Props) {
  const closeModal = () => setOpen(false);
  const { intl } = useLanguage();

  return (
    <div>
      <Dialog
        fullScreen
        open={true}
        onClose={closeModal}
        TransitionComponent={Transition}
        PaperProps={{
          style: {
            backgroundColor: theme.palette.primary.main,
          },
        }}
      >
        <AppBar elevation={0} sx={{ position: 'absolute' }}>
          <div style={{ width: '100%', maxWidth: '1400px', margin: 'auto' }}>
            <Toolbar>
              <Box sx={{ flex: 1 }}>
                <Image src={Logo.src} alt="logo" width="200" height="48" />
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
        <div className="bg-primary" style={{ paddingTop: '100px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '700px',
              margin: 'auto',
              padding: '0 10px',
            }}
          >
            <LivenessQuickStart cedula={cedula} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
