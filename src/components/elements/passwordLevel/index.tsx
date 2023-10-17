import { passwordStrength } from 'check-password-strength';
import { Typography, Box } from '@mui/material';

import { useLanguage } from '@/app/[lang]/provider';
import { getPasswordStrength } from './options';

type Props = { password: string };

export default function PasswordLevel({ password }: Props) {
  const strength = getPasswordStrength(password);
  const colors = ['#e05d56', '#e09856', '#e0d256', '#b5df56', '#a3e056'];

  const { intl } = useLanguage();
  type Level = keyof typeof intl.step3.password.levels;

  return (
    <>
      <Box
        mt={1}
        px={1}
        sx={{
          width: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 1,
        }}
      >
        {colors.map((color, index) => (
          <>
            <Box
              bgcolor={index > strength.id ? '#e4e4e7' : color}
              sx={{
                height: '.5rem',
                borderRadius: 2,
              }}
            />
          </>
        ))}
      </Box>
      <Typography variant="caption" color="gray" mt={1} px={1}>
        {intl.step3.password.strength}{' '}
        {intl.step3.password.levels[strength.value as Level]}
      </Typography>
    </>
  );
}
