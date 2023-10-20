import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { passwordStrength } from 'check-password-strength';
import { Typography, Box, Collapse } from '@mui/material';

import { useLanguage } from '@/app/[lang]/provider';

export default function PasswordLevel({ password }: { password: string }) {
  const { intl } = useLanguage();

  type Diversity = keyof typeof intl.step3.password.requirements;

  const strength = passwordStrength(password);
  const container: Array<Diversity> = strength.contains;

  if (strength.length >= 10) container.push('length');

  const requirements = Object.keys(
    intl.step3.password.requirements,
  ) as Array<Diversity>;

  return (
    <Collapse in={Boolean(password)}>
      <Box mt={2}>
        {requirements.map((name, index) => (
          <Requirement
            key={index}
            met={container.includes(name)}
            text={intl.step3.password.requirements[name]}
          />
        ))}
      </Box>
    </Collapse>
  );
}

type Props = { met: boolean; text: string };

const Requirement = ({ met, text }: Props) => (
  <Box display="flex" alignItems="center">
    <CheckCircleIcon
      color={met ? 'success' : 'disabled'}
      style={{ fontSize: '20px', marginRight: '3px' }}
    />
    <Typography variant="caption" color="gray">
      {text}
    </Typography>
  </Box>
);
