import { Alert, AlertTitle } from '@mui/material';
import { getDictionary } from '@/dictionaries';
import { Locale } from '@/i18n-config';

interface RecoveryBannerProps {
  lang: Locale;
}

export async function RecoveryBanner({ lang }: RecoveryBannerProps) {
  const intl = await getDictionary(lang);

  return (
    <Alert
      severity="info"
      sx={{
        mb: 3,
        '& .MuiAlert-message': {
          width: '100%',
        },
      }}
    >
      <AlertTitle sx={{ fontWeight: 600 }}>
        {intl.accountRecovery?.title || 'Account Recovery'}
      </AlertTitle>
      {intl.accountRecovery?.banner ||
        'Recovery Mode: You will need to verify your identity with a liveness check.'}
    </Alert>
  );
}
