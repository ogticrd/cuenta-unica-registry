import { useEffect, useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { Typography } from '@mui/material';

import { useLanguage } from '@/app/[lang]/provider';

interface IProps {
  text?: string;
}

export default function LoadingBackdrop({ text }: IProps) {
  const { intl } = useLanguage();

  const [open] = useState(true);
  const [displayText, setDisplayText] = useState(text || '');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayText(intl.loader.longWait);
    }, 4000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, []);

  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
      open={open}
    >
      <div style={{ textAlign: 'center' }}>
        <CircularProgress color="inherit" />
        {displayText ? <Typography>{displayText}</Typography> : null}
      </div>
    </Backdrop>
  );
}
