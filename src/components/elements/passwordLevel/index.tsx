import * as React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Typography } from '@mui/material';

interface PasswordRequirementProps {
  met: boolean;
  text: string;
}

const PasswordRequirement: React.FC<PasswordRequirementProps> = ({ met, text }) => (
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

interface ProgressBarProps {
  filled: boolean;
  color: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ filled, color }) => (
  <div
    style={{
      height: '8px',
      width: '20%',
      background: filled ? color : '#f1f1f1',
      borderRadius: '10px',
    }}
  />
);

const PASSWORD_LEVELS = [' Muy Bajo', ' Bajo', ' Medio', ' Fuerte'];
const ProgressBarColors = ['#E05D56', '#E0D256', '#B4E056', '#A3E056'];

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

      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: '2%',
          marginBottom: '12px',
          marginTop: '10px',
        }}
      >
        {ProgressBarColors.map((color, index) => (
          <ProgressBar
            key={index}
            filled={passwordLevel.id >= index}
            color={color}
          />
        ))}
      </div>
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
