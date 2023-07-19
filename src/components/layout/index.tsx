import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Fab } from '@mui/material';

import NavBar from './navBar';
import Footer from './footer';

export default function Index({ children }: any) {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('sm'));

  return (
    <>
      <NavBar />
      <div style={{ padding: '50px 0px' }}>
        {children}
        <Fab
          onClick={() =>
            window.open(
              'https://docs.google.com/forms/d/e/1FAIpQLSexFmkoGsVbyRS90B1IwRoAjYg6R6mX8IAJiT1BExN9wT7yjA/viewform?usp=pp_url'
            )
          }
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
          {matches && 'Reportar'}
        </Fab>
      </div>
      <Footer />
    </>
  );
}
