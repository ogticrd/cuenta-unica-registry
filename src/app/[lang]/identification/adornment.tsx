'use client';

import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useFormStatus } from 'react-dom';

export function LoadingAdornment({
  pending = false,
  onRetry,
  retryLabel,
}: {
  pending?: boolean;
  onRetry?: () => void;
  retryLabel: string;
}) {
  const status = useFormStatus();
  const loading = pending || status.pending;

  if (!loading && !onRetry) return null;

  return (
    <InputAdornment position="end">
      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <Tooltip title={retryLabel}>
          <IconButton
            type="button"
            edge="end"
            aria-label={retryLabel}
            onClick={onRetry}
          >
            <ReplayIcon />
          </IconButton>
        </Tooltip>
      )}
    </InputAdornment>
  );
}
