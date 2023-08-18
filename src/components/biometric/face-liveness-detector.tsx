'use client';

import React from 'react';
import { useState, useEffect } from 'react';

import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import awsExports from '@/aws-exports';

import { displayText } from './displayText';
import { useSnackbar } from '@/components/elements/alert';

import { UNIDENTIFIED_ERROR } from '@/constants';

Amplify.configure(awsExports);

export function LivenessQuickStartReact({ handleNextForm, cedula }: any) {
  const next = handleNextForm;
  const id = cedula;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { AlertError } = useSnackbar();

  const fetchCreateLiveness: () => Promise<void> = async () => {
    const response = await fetch(`/api/biometric`, { method: 'POST' });
    await new Promise((r) => setTimeout(r, 2000));
    const { sessionId } = await response.json();

    setSessionId(sessionId);
    setLoading(false);
  };

  const onUserCancel = () => {
    setSessionId(null);
    fetchCreateLiveness();
  };

  const handleAnalysisComplete: () => Promise<void> = async () => {
    const response = await fetch(
      `/api/biometric?sessionId=${sessionId}&cedula=${id}`,
    );
    const data = await response.json();

    if (data.isMatch === true) {
      next();
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
    if (error) {
      AlertError(error.message || UNIDENTIFIED_ERROR);
      if (!error.message) {
        console.error(error);
      }
    }
    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line
  }, [error]);

  return (
    <ThemeProvider>
      {loading ? (
        <Loader />
      ) : (
        sessionId && (
          <FaceLivenessDetector
            sessionId={sessionId}
            region="us-east-1"
            onUserCancel={onUserCancel}
            onError={(livenessError) => {
              console.error({
                state: livenessError.state,
                error: livenessError.error,
              });
            }}
            onAnalysisComplete={handleAnalysisComplete}
            disableInstructionScreen={false}
            displayText={displayText}
          />
        )
      )}
    </ThemeProvider>
  );
}
