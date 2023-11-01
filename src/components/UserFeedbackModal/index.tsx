import { InputAdornment, Modal, TextField } from '@mui/material';
import EmailTwoToneIcon from '@mui/icons-material/EmailTwoTone';

import { GridContainer, GridItem } from '../elements/grid';
import { useLanguage } from '@/app/[lang]/provider';
import { ButtonApp } from '../elements/button';

type Props = { open: boolean };

export default function UserFeedbackModal({ open }: Props) {
  const { intl } = useLanguage();

  const sendFeedback = () => {};

  return (
    <Modal
      open={open}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <form
        onSubmit={sendFeedback}
        style={{
          backgroundColor: 'white',
          height: 500,
          width: 500,
          padding: 20,
        }}
      >
        <GridContainer>
          <GridItem lg={12} md={12}>
            <TextField
              //   {...register('email')}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailTwoToneIcon color="primary" />
                  </InputAdornment>
                ),
              }}
              type="email"
              label={intl.step3.email.label}
              //   helperText={errors.email?.message}
              autoComplete="off"
              fullWidth
            />
          </GridItem>
          <GridItem lg={12} md={12}>
            <ButtonApp submit>{intl.bug.report}</ButtonApp>
          </GridItem>
        </GridContainer>
      </form>
    </Modal>
  );
}
