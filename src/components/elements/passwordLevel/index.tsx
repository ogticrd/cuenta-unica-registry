import * as React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { Typography } from '@mui/material';

export default function PasswordLevel({ passwordLevel }: any) {
  return passwordLevel.length > 0 ? (
    <div style={{marginTop: "10px"}}>
      <div>
        <CheckCircleIcon
          color={passwordLevel.contains?.includes("lowercase") ? "success" : "disabled"}
          style={{ fontSize: "20px", marginBottom: "-4px", marginRight: "3px" }}
        />
        <Typography variant='caption' color="gray">
          Una letra minúscula
        </Typography>
      </div>
      <div>
        <CheckCircleIcon
          color={passwordLevel.contains?.includes("uppercase") ? "success" : "disabled"}
          style={{ fontSize: "20px", marginBottom: "-4px", marginRight: "3px" }}
        />
        <Typography variant='caption' color="gray">
          Una letra mayúscula
        </Typography>
      </div>
      <div>
        <CheckCircleIcon
          color={passwordLevel.contains?.includes("number") ? "success" : "disabled"}
          style={{ fontSize: "20px", marginBottom: "-4px", marginRight: "3px" }}
        />
        <Typography variant='caption' color="gray">
          Un número
        </Typography>
      </div>
      <div>
        <CheckCircleIcon
          color={passwordLevel.contains?.includes("symbol") ? "success" : "disabled"}
          style={{ fontSize: "20px", marginBottom: "-4px", marginRight: "3px" }}
        />
        <Typography variant='caption' color="gray">
          Un carácter especial
        </Typography>
      </div>
      <div>
        <CheckCircleIcon
          color={passwordLevel.length >= 10 ? "success" : "disabled"}
          style={{ fontSize: "20px", marginBottom: "-4px", marginRight: "3px" }}
        />
        <Typography variant='caption' color="gray">
          10 caracteres como mínimo
        </Typography>
      </div>

      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: '2%',
          marginBottom: '12px',
          marginTop: "10px"
        }}
      >
        {passwordLevel.id >= 0 && (
          <div
            style={{
              height: '8px',
              width: '20%',
              background: '#E05D56',
              borderRadius: '10px',
            }}
          />
        )}
        <div
          style={{
            height: '8px',
            width: '20%',
            background: `${passwordLevel.id >= 1 ? '#E0D256' : '#f1f1f1'}`,
            borderRadius: '10px',
          }}
        />
        <div
          style={{
            height: '8px',
            width: '20%',
            background: `${passwordLevel.id >= 2 ? '#B4E056' : '#f1f1f1'}`,
            borderRadius: '10px',
          }}
        />
        <div
          style={{
            height: '8px',
            width: '20%',
            background: `${passwordLevel.id >= 3 ? '#A3E056' : '#f1f1f1'}`,
            borderRadius: '10px',
          }}
        />
      </div>
      <Typography
        sx={{ fontWeight: '400', fontSize: '14px', color: '#707070' }}
      >
        Nivel de contraseña
        {passwordLevel.id === 0 && ' Muy Bajo'}
        {passwordLevel.id === 1 && ' Bajo'}
        {passwordLevel.id === 2 && ' Medio'}
        {passwordLevel.id === 3 && ' Fuerte'}
      </Typography>
    </div>
  ) : null;
}
