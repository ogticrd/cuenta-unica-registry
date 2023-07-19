import { Typography } from '@mui/material';
import React from 'react';

interface IProps {
  children: React.ReactNode;
  required?: boolean;
  notBold?: boolean;
  notGutterBottom?: boolean;
  noWrap?: boolean;
  textCenter?: boolean;
  colorPrimary?: boolean;
  bold?: boolean;
}

export const TextTitle = ({ children }: IProps) => {
  return (
    <Typography
      color="primary"
      sx={{ fontWeight: '500', fontSize: '34px', lineHeight: '48px' }}
      gutterBottom
    >
      {children}
    </Typography>
  );
};

export const TextSubTitle = ({ children }: IProps) => {
  return (
    <Typography
      color="primary"
      sx={{ fontWeight: '500', fontSize: '20px', lineHeight: '25px' }}
    >
      {children}
    </Typography>
  );
};

export const TextSubTitleBody = ({ children }: IProps) => {
  return (
    <Typography
      sx={{
        fontWeight: '400',
        color: '#433E3E',
        fontSize: '18px',
        lineHeight: '27.57px',
      }}
    >
      {children}
    </Typography>
  );
};

export const TextBody = ({ children, textCenter, bold }: IProps) => {
  return (
    <Typography
      color="primary"
      sx={{
        fontSize: '16px',
        fontWeight: `${bold ? '600' : '500'}`,
        textAlign: `${textCenter ? 'center' : 'left'}`,
      }}
    >
      {children}
    </Typography>
  );
};

export const TextBodyTiny = ({
  children,
  textCenter,
  colorPrimary,
}: IProps) => {
  return (
    <Typography
      color={`${colorPrimary ? 'primary' : '#231F20'}`}
      sx={{
        fontSize: '14px',
        fontWeight: '400',
        textAlign: `${textCenter ? 'center' : 'left'}`,
        lineHeight: '21px',
      }}
    >
      {children}
    </Typography>
  );
};
