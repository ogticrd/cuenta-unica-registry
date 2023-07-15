import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';

import React from 'react';
import { useState, useEffect } from 'react';

import { useSnackbar } from '@/components/elements/alert';
import { defaultLivenessDisplayText } from './displayText';

export function LivenessQuickStartReact({ handleNextForm, cedula }: any) {
  const next = handleNextForm;
  const id = cedula;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { AlertError } = useSnackbar();

  const fetchCreateLiveness = async () => {
    const response = await fetch(`/api/biometric`, { method: 'POST' });
    const { sessionId } = await response.json();

    setSessionId(sessionId);
    setLoading(false);
  };

  const onUserCancel = () => {
    setSessionId(null);
    fetchCreateLiveness();
  };

  const handleAnalysisComplete = async () => {
    const response = await fetch(
      `/api/biometric?sessionId=${sessionId}&cedula=${id}`
    );
    const data = await response.json();

    if (data.isMatch === true) {
      next();
    } else {
      setError(data.error);
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
      AlertError('No se ha podido validar correctamente la identidad.');
    }
    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <>
      <br />
      <ThemeProvider>
        {loading ? (
          <Loader />
        ) : (
          sessionId && (
            <FaceLivenessDetector
              sessionId={sessionId}
              region="us-east-1"
              onUserCancel={onUserCancel}
              onError={(error) => setError(error)}
              onAnalysisComplete={handleAnalysisComplete}
              disableInstructionScreen={false}
              displayText={defaultLivenessDisplayText}
            />
          )
        )}
      </ThemeProvider>
    </>
  );
}
