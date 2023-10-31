'use client';

import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Amplify } from 'aws-amplify';

import { useSnackAlert } from '@/components/elements/alert';
import { useLanguage } from '@/app/[lang]/provider';
import { useLocalizedText } from './localizedText';
import { unwrap } from '@/common/helpers';
import awsExports from '@/aws-exports';

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
      .then(({ sessionId }) => setSessionId(sessionId));

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
    fetchCreateLiveness().catch((error) => {
      console.error(error);
      setError(error);
    });
  }, []);

  useEffect(() => {
    if (!error) return;

    const message: string =
      error.message.split('.').reduce<any>((prev, k) => prev[k], { intl }) ||
      error.message ||
      intl.errors.unknown;

    AlertError(message);

    if (!error.message) {
      console.error(error);
    }

    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line
  }, [error]);

  return (
    <ThemeProvider>
      {loading ? (
        <div
          style={{
            width: '100%',
            height: '55vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Loader />
        </div>
      ) : sessionId ? (
        <FaceLivenessDetector
          sessionId={sessionId}
          region="us-east-1"
          onUserCancel={onUserCancel}
          onError={console.error}
          onAnalysisComplete={handleAnalysisComplete}
          disableInstructionScreen={false}
          displayText={displayText}
        />
      ) : null}
    </ThemeProvider>
  );
}
