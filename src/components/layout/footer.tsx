'use client';

import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import { IconButton, Typography } from '@mui/material';
import Image from 'next/image';

import logoOGTIC from '../../../public/assets/logoOGTIC.svg';
import { GridContainer, GridItem } from '../elements/grid';
import logoGOB from '../../../public/assets/logoGOB.svg';
import logoWhite from '../../../public/assets/logo-white.svg';
import DivGrow from '../elements/divGrow';
import theme from '../themes/theme';

export default function Index() {
  return (
    <>
      <div style={{ background: theme.palette.primary.main, padding: '75px 25px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '1400px',
            margin: 'auto',
            padding: '0px 24px',
          }}
        >
          <GridContainer spacing={4}>
            <GridItem md={12} lg={2}>
              <Image src={logoGOB.src} alt="logo" width="198" height="80" />
            </GridItem>
            <GridItem md={12} lg={2}>
              <Image
                src={logoWhite.src}
                alt="logo"
                width="166"
                height="82"
              />
            </GridItem>
            <GridItem md={12} lg={8}>
              <GridContainer spacing={4}>
                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    CONÓCENOS
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Oficina Gubernamental de Tecnologías de la Información y
                    Comunicación (OGTIC)
                  </Typography>
                </GridItem>

                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    CONTÁCTANOS
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Tel: (809)-286-1009
                  </Typography>
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Fax: (809)-732-5465
                  </Typography>
                  <Typography color="white" fontWeight="400" fontSize="16">
                    info@ogtic.gob.do
                  </Typography>
                </GridItem>

                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    BÚSCANOS
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Oficina Gubernamental de Tecnologías de la Información y
                    Comunicación (OGTIC) Av. Rómulo Betancourt #311, Edificio
                    Corporativo Vista 311, Santo Domingo, República Dominicana.
                  </Typography>
                </GridItem>

                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    INFÓRMATE
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Términos de Uso Política de Privacidad Preguntas Frecuentes
                  </Typography>
                </GridItem>
              </GridContainer>
            </GridItem>
          </GridContainer>
        </div>
      </div>

      <div style={{ background: 'white', padding: '12.5px 25px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '1400px',
            margin: 'auto',
            padding: '0px 24px',
          }}
        >
          <GridContainer>
            <GridItem md={6} lg={6}>
              <div style={{ marginTop: '8px' }}>
                <Typography variant="caption" fontWeight="600" color="primary">
                  © {new Date().getFullYear()} Todos los Derechos Reservados.
                  Desarrollado por
                </Typography>
                <Image
                  style={{
                    marginBottom: '-10px',
                    marginLeft: '5px',
                    cursor: 'pointer',
                  }}
                  src={logoOGTIC.src}
                  alt="logo ogtic"
                  width="55"
                  height="29"
                  onClick={() => window.open('https://ogtic.gob.do/')}
                />
              </div>
            </GridItem>

            <GridItem md={6} lg={6}>
              <DivGrow>
                <div style={{ display: 'flex' }}>
                  <Typography
                    sx={{ margin: 'auto', marginRight: '10px' }}
                    variant="body2"
                    fontWeight="bold"
                    color="primary"
                  >
                    SÍGUENOS
                  </Typography>

                  <IconButton color="primary">
                    <FacebookIcon />
                  </IconButton>

                  <IconButton color="primary">
                    <YouTubeIcon />
                  </IconButton>

                  <IconButton color="primary">
                    <TwitterIcon />
                  </IconButton>

                  <IconButton color="primary">
                    <InstagramIcon />
                  </IconButton>
                </div>
              </DivGrow>
            </GridItem>
          </GridContainer>
        </div>
      </div>
    </>
  );
}
