import { Alert, Modal, TextField, Typography } from '@mui/material';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as Sentry from '@sentry/nextjs';
import Fade from '@mui/material/Fade';
import Collapse from '@mui/material/Collapse';
import { useState } from 'react';
import { z } from 'zod';

import { createReportSchema } from '@/common/validation-schemas';
import { GridContainer, GridItem } from '../elements/grid';
import { useLanguage } from '@/app/[lang]/provider';
import { CustomTextMask } from '../CustomTextMask';
import { ButtonApp } from '../elements/button';

type Props = { open: boolean; onClose: () => void };
type Report = z.infer<ReturnType<typeof createReportSchema>>;

export default function UserFeedbackModal({ open, onClose }: Props) {
  const { intl } = useLanguage();
  const [sent, setSent] = useState(false);

  const {
    handleSubmit,
    formState: { errors },
    register,
    reset,
  } = useForm<Report>({
    resolver: zodResolver(createReportSchema(intl)),
  });

  const sendFeedback = handleSubmit(
    ({ cedula, email, comments, name = '' }) => {
      Sentry.captureFeedback({
        email,
        message: comments,
        name,
        associatedEventId: Sentry.captureMessage('User feedback', {
          user: { id: cedula.replace(/-/g, ''), email },
        }),
      });

      setTimeout(() => setSent(true), 213);
      setTimeout(closeModal, 2300);
    },
  );

  const closeModal = () => {
    setSent(false);
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={closeModal}
      closeAfterTransition
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Fade in={open}>
        <form
          onSubmit={sendFeedback}
          style={{
            backgroundColor: 'white',
            width: 500,
            padding: 30,
            borderRadius: '10px',
          }}
        >
          <GridContainer spacing={3}>
            <GridItem
              lg={12}
              md={12}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <Typography fontSize={20} color="primary">
                {intl.bug.title}
              </Typography>
              {/* <IconButton aria-label={intl.actions.close}>
              <CloseTwoToneIcon />
            </IconButton> */}
            </GridItem>

            <GridItem lg={12} md={12} sx={{ mt: 3 }}>
              <TextField
                required
                {...register('cedula')}
                label={intl.bug.cedula}
                autoComplete="off"
                placeholder="***-**00000-0"
                disabled={sent}
                error={Boolean(errors.cedula)}
                helperText={errors?.cedula?.message}
                fullWidth
                slotProps={{
                  input: {
                    inputComponent: CustomTextMask,
                  },

                  htmlInput: {
                    inputMode: 'numeric',
                  },
                }}
              />
            </GridItem>

            <GridItem lg={12} md={12}>
              <TextField
                {...register('name')}
                label={intl.bug.name}
                autoComplete="off"
                disabled={sent}
                fullWidth
              />
            </GridItem>

            <GridItem lg={12} md={12}>
              <TextField
                {...register('email')}
                required
                type="email"
                label={intl.step3.email.label}
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                autoComplete="off"
                disabled={sent}
                fullWidth
              />
            </GridItem>

            <GridItem lg={12} md={12}>
              <TextField
                {...register('comments')}
                required
                label={intl.bug.comments}
                error={Boolean(errors.comments)}
                helperText={errors.comments?.message}
                autoComplete="off"
                multiline
                rows={4}
                disabled={sent}
                fullWidth
              />
            </GridItem>

            <GridItem lg={12} md={12}>
              <Collapse in={sent}>
                <Alert variant="standard" severity="success">
                  {intl.bug.sent}
                </Alert>
              </Collapse>
            </GridItem>

            <GridItem lg={12} md={12} sx={{ mt: 1 }}>
              <ButtonApp disabled={sent} submit>
                {intl.bug.report}
              </ButtonApp>
            </GridItem>
          </GridContainer>
        </form>
      </Fade>
    </Modal>
  );
}
