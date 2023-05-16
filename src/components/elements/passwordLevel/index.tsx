import * as React from 'react';
import { Typography } from '@mui/material';

export default function PasswordLevel({ passwordLevel }: any) {
  return passwordLevel.length > 0 ? (
    <>
      <div
        style={{
          width: '100%',
          display: 'flex',
          gap: '6.66%',
          marginBottom: '12px',
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
        {passwordLevel.id >= 1 && (
          <div
            style={{
              height: '8px',
              width: '20%',
              background: '#E0D256',
              borderRadius: '10px',
            }}
          />
        )}
        {passwordLevel.id >= 2 && (
          <div
            style={{
              height: '8px',
              width: '20%',
              background: '#B4E056',
              borderRadius: '10px',
            }}
          />
        )}
        {passwordLevel.id >= 3 && (
          <div
            style={{
              height: '8px',
              width: '20%',
              background: '#A3E056',
              borderRadius: '10px',
            }}
          />
        )}
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
    </>
  ) : null;
}
