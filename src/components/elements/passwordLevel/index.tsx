import * as React from 'react';
import { passwordStrength, DiversityType, Result } from 'check-password-strength';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Typography, Box } from '@mui/material';

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({
  met,
  text,
}) => (
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

const PASSWORD_LEVELS = [' Muy Bajo', ' Bajo', ' Medio', ' Fuerte'];

interface PasswordLevelProps {
  password: string;
}

export const calculatePasswordStrength = (password: string): Result<string> => {
  return passwordStrength(password);
}

const PasswordLevel: React.FC<PasswordLevelProps> = ({ password }) => {
  const passwordStrengthResult = calculatePasswordStrength(password);

  const containsRequirementsMet = passwordStrengthResult.contains || [];
  const lengthRequirementMet = passwordStrengthResult.length >= 10;

  const requirements: { [key in DiversityType]: string } = {
    lowercase: 'Una letra minúscula',
    uppercase: 'Una letra mayúscula',
    symbol: 'Un caracter especial',
    number: 'Un número',
  };

  if (!password) return null;

  return (
    <Box mt={2}>
      {Object.entries(requirements).map(([key, text], index) => (
        <PasswordRequirement
          key={index}
          met={containsRequirementsMet.includes(key as DiversityType)}
          text={text}
        />
      ))}
      <PasswordRequirement
        met={lengthRequirementMet}
        text="10 caracteres como mínimo"
      />
      <Typography
        sx={{ fontWeight: '400', fontSize: '14px', color: '#707070' }}
      >
        Nivel de contraseña
        {PASSWORD_LEVELS[passwordStrengthResult.id]}
      </Typography>
    </Box>
  );
};

export default PasswordLevel;
