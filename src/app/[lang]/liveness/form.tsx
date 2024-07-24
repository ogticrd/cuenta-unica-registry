'use client';

import {
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
  Divider,
} from '@mui/material';
import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { zodResolver } from '@hookform/resolvers/zod';
import Collapse from '@mui/material/Collapse';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';

import { ButtonApp, ButtonTextApp } from '@/components/elements/button';
import { GridContainer, GridItem } from '@/components/elements/grid';
import { createTermsSchema } from '@/common/validation-schemas';
import { LivenessModal } from '@/components/LivenessModal';
import { useLanguage } from '../provider';

import styles from './styles.module.css';

type TermsForm = z.infer<ReturnType<typeof createTermsSchema>>;
import theme from '@/components/themes/theme';

type Props = {
  cedula: string;
};

export function Form({ cedula }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { intl } = useLanguage();

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<TermsForm>({
    resolver: zodResolver(createTermsSchema(intl)),
  });

  const onSubmit = handleSubmit(() => setOpen(true));

  const conditions = [
    { text: intl.step2.camera, Icon: CameraAltOutlinedIcon },
    { text: intl.step2.face, Icon: SentimentSatisfiedOutlinedIcon },
    { text: intl.step2.photosensitivity, Icon: WarningAmberIcon },
  ];

  return (
    <form onSubmit={onSubmit}>
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

        <GridItem lg={12} md={12} sx={{ my: 1 }}>
          <FormGroup>
            <FormControlLabel
              color="error"
              style={{ display: 'flex', justifyContent: 'center' }}
              control={
                <Checkbox
                  color="error"
                  {...register('accepted', { required: true })}
                />
              }
              label={
                <>
                  <Link target="_blank" href="/terms">
                    <span
                      style={{
                        color: theme.palette.primary.main,
                        textDecoration: 'underline',
                        fontSize: '14px',
                      }}
                    >
                      {intl.terms.accept}
                    </span>
                  </Link>{' '}
                  <span style={{ color: theme.palette.secondary.main }}>*</span>
                </>
              }
            />
            <Collapse in={Boolean(errors.accepted)}>
              <Alert severity="info">{intl.terms.check}</Alert>
            </Collapse>
          </FormGroup>
        </GridItem>

        <GridItem lg={12} md={12}>
          <ButtonApp submit>{intl.actions.start}</ButtonApp>
          {open ? <LivenessModal cedula={cedula} setOpen={setOpen} /> : null}
        </GridItem>
      </GridContainer>

      <br />
      <GridContainer>
        <GridItem md={12} lg={12}>
          <Box textAlign="center">
            <ButtonTextApp
              startIcon={<ArrowCircleLeftOutlinedIcon />}
              onClick={router.back}
            >
              {intl.stepper.back}
            </ButtonTextApp>
          </Box>
        </GridItem>
      </GridContainer>
    </form>
  );
}
