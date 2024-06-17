import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import { IconButton, Typography } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import TwitterIcon from '@mui/icons-material/Twitter';
import Image from 'next/image';
import Link from 'next/link';

import logoWhite from '@public/assets/logo-white.svg';
import logoOGTIC from '@public/assets/logoOGTIC.svg';
import logoGOB from '@public/assets/logoGOB.svg';

import { GridContainer, GridItem } from '../elements/grid';
import type { getDictionary } from '@/dictionaries';
import DivGrow from '../elements/divGrow';

import styles from './styles.module.css';

type Props = { intl: Awaited<ReturnType<typeof getDictionary>> };

export default async function Footer({ intl }: Props) {
  return (
    <footer>
      <div className={styles.footer}>
        <div className={styles.footer_container}>
          <GridContainer spacing={4}>
            <GridItem md={12} lg={2}>
              <Image src={logoGOB.src} alt="logo" width="198" height="80" />
            </GridItem>
            <GridItem md={12} lg={2}>
              <Image src={logoWhite.src} alt="logo" width="166" height="82" />
            </GridItem>
            <GridItem md={12} lg={8}>
              <GridContainer spacing={4}>
                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    {intl.footer.knowUs}
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Oficina Gubernamental de Tecnologías de la Información y
                    Comunicación (OGTIC)
                  </Typography>
                </GridItem>

                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    {intl.footer.contact}
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
                    {intl.footer.findUs}
                  </Typography>
                  <br />
                  <Typography color="white" fontWeight="400" fontSize="16">
                    Ave. Rómulo Betancourt #311, Edificio Corporativo Vista 311,
                    Santo Domingo, República Dominicana.
                  </Typography>
                </GridItem>

                <GridItem md={6} lg={3}>
                  <Typography fontWeight="500" fontSize={16} color="white">
                    {intl.footer.info}
                  </Typography>
                  <br />
                  <Link
                    href="/terms"
                    target="_blank"
                    style={{ textDecoration: 'none' }}
                  >
                    <Typography color="white" fontWeight="400" fontSize="16">
                      {intl.common.terms}
                    </Typography>
                  </Link>
                  <Typography color="white" fontWeight="400" fontSize="16">
                    {intl.common.policy}
                  </Typography>
                  <Typography color="white" fontWeight="400" fontSize="16">
                    {intl.common.faq}
                  </Typography>
                </GridItem>
              </GridContainer>
            </GridItem>
          </GridContainer>
        </div>
      </div>

      <div style={{ background: 'white', padding: '12.5px 25px' }}>
        <div className={styles.footer_container}>
          <GridContainer>
            <GridItem md={6} lg={6}>
              <div style={{ marginTop: '8px' }}>
                <Typography variant="caption" fontWeight="600" color="primary">
                  © {new Date().getFullYear()} {intl.footer.rightsReserved}{' '}
                  {intl.footer.developedBy}
                </Typography>
                <Link href="https://ogtic.gob.do/" target="_blank">
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
                  />
                </Link>
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
                    {intl.footer.followUs}
                  </Typography>

                  <Link href="https://www.facebook.com/Ogticrd" target="_blank">
                    <IconButton color="primary">
                      <FacebookIcon />
                    </IconButton>
                  </Link>

                  <Link href="https://www.youtube.com/@OGTICRD" target="_blank">
                    <IconButton color="primary">
                      <YouTubeIcon />
                    </IconButton>
                  </Link>

                  <Link href="https://twitter.com/ogticrdo" target="_blank">
                    <IconButton color="primary">
                      <TwitterIcon />
                    </IconButton>
                  </Link>

                  <Link
                    href="https://www.instagram.com/ogticrd"
                    target="_blank"
                  >
                    <IconButton color="primary">
                      <InstagramIcon />
                    </IconButton>
                  </Link>
                </div>
              </DivGrow>
            </GridItem>
          </GridContainer>
        </div>
      </div>
    </footer>
  );
}
