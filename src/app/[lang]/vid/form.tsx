'use client';

import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Typography, Divider } from '@mui/material';
import { useState } from 'react';

import { GridContainer, GridItem } from '@/components/elements/grid';
import { LivenessModal } from '@/components/LivenessModal';
import { ButtonApp } from '@/components/elements/button';
import theme from '@/components/themes/theme';
import { useLanguage } from '../provider';

import styles from '../liveness/styles.module.css';

type Props = {
  cedula: string;
  redirectUri?: string;
  state?: string;
};

export function Form({ cedula, redirectUri, state }: Props) {
  const [open, setOpen] = useState(false);
  const { intl } = useLanguage();

  const conditions = [
    { text: intl.step2.camera, Icon: CameraAltOutlinedIcon },
    { text: intl.step2.face, Icon: SentimentSatisfiedOutlinedIcon },
    { text: intl.step2.photosensitivity, Icon: WarningAmberIcon },
  ];

  return (
    <GridContainer>
      {conditions.map(({ text: __html, Icon }, index) => (
        <GridItem lg={12} md={12} key={index}>
          <div className={styles.liveness_conditions}>
            <Icon
              sx={{
                fontSize: '45px',
                color: theme.palette.info.contrastText,
              }}
            />
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 2, borderColor: theme.palette.info.contrastText }}
            />
            <Typography
              variant="body2"
              color="primary"
              dangerouslySetInnerHTML={{ __html }}
            />
          </div>
        </GridItem>
      ))}

      <GridItem lg={12} md={12}>
        <ButtonApp onClick={() => setOpen(true)}>
          {intl.actions.start}
        </ButtonApp>
        {open ? (
          <LivenessModal
            cedula={cedula}
            setOpen={setOpen}
            redirectUri={redirectUri}
            state={state}
          />
        ) : null}
      </GridItem>
    </GridContainer>
  );
}
