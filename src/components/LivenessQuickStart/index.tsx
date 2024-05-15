'use client';

import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { ThemeProvider } from '@aws-amplify/ui-react';
import React, { useState, useEffect } from 'react';
import { CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import * as Sentry from '@sentry/nextjs';
import { Amplify } from 'aws-amplify';

import { useSnackAlert } from '@/components/elements/alert';
import { useLanguage } from '@/app/[lang]/provider';
import { useLocalizedText } from './localizedText';
import { unwrap } from '@/common/helpers';
import awsExports from '@/aws-exports';

import styles from './styles.module.css';

Amplify.configure(awsExports);

type Props = { cedula: string };

export function LivenessQuickStart({ cedula }: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { AlertError } = useSnackAlert();
  const router = useRouter();

  const { intl } = useLanguage();

  const displayText = useLocalizedText({ intl });

  const fetchCreateLiveness: () => Promise<void> = async () => {
    await fetch(`/api/biometric`, { method: 'POST' })
      .then(unwrap)
      .then(({ sessionId }) => setSessionId(sessionId))
      .catch(({ error, state }) => {
        Sentry.captureMessage(error.message, {
          user: { id: cedula },
          extra: { state, error },
          level: 'error',
        });

        setError(error);
      })
      .catch(Sentry.captureException);

    setLoading(false);
  };

  const onUserCancel = () => {
    setSessionId(null);
    fetchCreateLiveness();
  };

  const handleAnalysisComplete: () => Promise<void> = async () => {
    const data = await fetch(`/api/biometric/${sessionId}/${cedula}`).then(
      unwrap,
    );

    if (data?.isMatch === true) {
      router.push('register');
    } else {
      setError(data);
      setSessionId(null);
      fetchCreateLiveness();
    }
  };

  useEffect(() => {
    fetchCreateLiveness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!error) return;

    const message: string =
      error.message.split('.').reduce<any>((prev, k) => prev[k], { intl }) ||
      error.message ||
      intl.errors.unknown;

    AlertError(message);

    if (!error.message) {
      Sentry.captureException(error);
    }

    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line
  }, [error]);

  return (
    <ThemeProvider>
      {loading ? (
        <div className={styles.liveness_container}>
          <CircularProgress sx={{ color: 'white' }} />
        </div>
      ) : sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1"
          onUserCancel={onUserCancel}
          onError={({ error, state }) => {
            let message = error.message;

            if (message.includes('{"Message"')) {
              message = JSON.parse(message).Message?.split(':')[0];
            }

            if (message.includes('Signature')) {
              AlertError(intl.liveness.error.signature);
            }

            if (state === 'CAMERA_ACCESS_ERROR') {
              AlertError(intl.liveness.camera.notFound.heading);
            }

            Sentry.captureMessage(message, {
              user: { id: cedula },
              extra: { state, error },
              level: 'error',
            });
          }}
          onAnalysisComplete={handleAnalysisComplete}
          disableInstructionScreen={false}
          displayText={displayText}
        />
      ) : null}
    </ThemeProvider>
  );
}
