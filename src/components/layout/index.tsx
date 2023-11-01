'use client';

import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Fab } from '@mui/material';

import { useLanguage } from '@/app/[lang]/provider';
import NavBar from './navBar';
import Footer from './footer';
import UserFeedbackModal from '../UserFeedbackModal';
import { useState } from 'react';

export default function Index({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));
  const { intl } = useLanguage();

  const [open, setOpen] = useState(false);

  return (
    <>
      <NavBar />

      <div style={{ padding: '50px 0px' }}>
        {children}
        <Fab
          onClick={() => {
            // window.open(
            //   'https://docs.google.com/forms/d/e/1FAIpQLSexFmkoGsVbyRS90B1IwRoAjYg6R6mX8IAJiT1BExN9wT7yjA/viewform?usp=pp_url',
            // );

            setOpen(true);
          }}
          size={matches ? 'large' : 'small'}
          variant={matches ? 'extended' : 'circular'}
          sx={{
            position: 'fixed',
            top: matches ? '40vh' : '80vh',
            right: matches ? '40px' : '5px',
            background: 'white',
            textTransform: 'none',
            fontWeight: 'bold',
            color: theme.palette.primary.main,
          }}
        >
          <BugReportOutlinedIcon sx={{ mr: matches ? 1 : 0 }} color="info" />
          <UserFeedbackModal open={open} />
          {/* {matches && intl.bug.report} */}
        </Fab>
      </div>
      <Footer />
    </>
  );
}
