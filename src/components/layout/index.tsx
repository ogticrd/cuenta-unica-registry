import Container from '@mui/material/Container';
import { Fab } from '@mui/material';
import LiveHelpOutlinedIcon from '@mui/icons-material/LiveHelpOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

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
          <Fab size={matches ? 'large' : 'small'} variant={matches ? 'extended' : 'circular'} sx={{ marginTop: '-140px', marginRight: '10px' , float: 'right', background: 'white', textTransform: 'none', fontWeight: 'bold', color: theme.palette.primary.main }}>
            <LiveHelpOutlinedIcon sx={{ mr: matches ? 1 : 0 }} color='info' />
            {matches && 'Reportar'}
          </Fab>
      </div>
      <Footer />
    </>
  );
}
