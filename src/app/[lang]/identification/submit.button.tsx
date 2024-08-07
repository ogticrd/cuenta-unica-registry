import ArrowCircleRightOutlined from '@mui/icons-material/ArrowCircleRightOutlined';
import { useFormStatus } from 'react-dom';

import { ButtonApp } from '@/components/elements/button';
import { useLanguage } from '../provider';

export function SubmitButton() {
  const status = useFormStatus();
  const { intl } = useLanguage();

  return (
    <ButtonApp
      submit
      endIcon={<ArrowCircleRightOutlined />}
      disabled={status.pending}
    >
      {intl.actions.confirm}
    </ButtonApp>
  );
}
