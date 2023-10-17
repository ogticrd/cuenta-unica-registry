'use client';

import {
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Box,
} from '@mui/material';
import SentimentSatisfiedOutlinedIcon from '@mui/icons-material/SentimentSatisfiedOutlined';
import ArrowCircleLeftOutlinedIcon from '@mui/icons-material/ArrowCircleLeftOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useSnackAlert } from '@/components/elements/alert';

type TermsForm = z.infer<ReturnType<typeof createTermsSchema>>;

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
    // esto no iba
    resolver: zodResolver(createTermsSchema({ intl })),
  });

  const onSubmit = handleSubmit(() => setOpen(true));

  return (
    <form onSubmit={onSubmit}>
      <GridContainer>
        <GridItem lg={6} md={6}>
          <div
            style={{
              background: '#EFF7FF',
              borderRadius: '6px',
              padding: '30px 20px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <CameraAltOutlinedIcon
              sx={{ fontSize: '45px', marginRight: '12px' }}
              color="info"
            />
            <Typography
              variant="body2"
              color="primary"
              dangerouslySetInnerHTML={{
                __html: intl.step2.camera,
              }}
            />
          </div>
        </GridItem>

        <GridItem lg={6} md={6}>
          <div
            style={{
              background: '#EFF7FF',
              borderRadius: '6px',
              padding: '30px 20px',
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <SentimentSatisfiedOutlinedIcon
              sx={{ fontSize: '45px', marginRight: '12px' }}
              color="info"
            />
            <Typography
              variant="body2"
              color="primary"
              dangerouslySetInnerHTML={{
                __html: intl.step2.face,
              }}
            />
          </div>
        </GridItem>

        <GridItem lg={12} md={12}>
          <br />
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
                    {intl.terms.accept}
                  </Link>
                  <span className="text-error"> *</span>
                </>
              }
            />
            {errors.accepted ? (
              <Alert severity="info">{intl.terms.check}</Alert>
            ) : null}
          </FormGroup>
        </GridItem>

        <GridItem lg={12} md={12}>
          <ButtonApp submit>{intl.actions.start}</ButtonApp>
          {open && <LivenessModal cedula={cedula} setOpen={setOpen} />}
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
