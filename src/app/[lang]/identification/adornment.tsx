import { CircularProgress } from '@mui/material';
import { useFormStatus } from 'react-dom';

export function LoadingAdornment() {
  const status = useFormStatus();

  if (!status.pending) return null;

  return (
    <div style={{ display: 'flex' }}>
      <CircularProgress size={28} />
    </div>
  );
}
