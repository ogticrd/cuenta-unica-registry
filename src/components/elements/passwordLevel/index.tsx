import * as React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Typography } from '@mui/material';

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({
  met,
  text,
}) => (
  <div>
    <CheckCircleIcon
      color={met ? 'success' : 'disabled'}
      style={{ fontSize: '20px', marginBottom: '-4px', marginRight: '3px' }}
    />
    <Typography variant="caption" color="gray">
      {text}
    </Typography>
  </div>
);

const PASSWORD_LEVELS = ['Muy Bajo', ' Bajo', ' Medio', ' Fuerte'];
interface PasswordLevelProps {
  passwordLevel: {
    contains: string[];
    id: number;
    length: number;
  };
}

const PasswordLevel: React.FC<PasswordLevelProps> = ({ passwordLevel }) => {
  const requirements = [
    ['lowercase', 'Una letra minúscula'],
    ['uppercase', 'Una letra mayúscula'],
    ['number', 'Un número'],
    ['symbol', 'Un caracter especial'],
  ];

  return passwordLevel?.length > 0 ? (
    <div style={{ marginTop: '10px' }}>
      {requirements.map(([key, text], index) => (
        <PasswordRequirement
          key={index}
          met={passwordLevel.contains?.includes(key)}
          text={text}
        />
      ))}
      <PasswordRequirement
        met={passwordLevel.length >= 8}
        text="8 caracteres como mínimo"
      />
      <Typography
        sx={{ fontWeight: '400', fontSize: '14px', color: '#707070' }}
      >
        Nivel de contraseña
        {PASSWORD_LEVELS[passwordLevel.id]}
      </Typography>
    </div>
  ) : null;
};

export default PasswordLevel;
