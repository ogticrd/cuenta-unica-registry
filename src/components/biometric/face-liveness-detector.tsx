import {
  FaceLivenessDetector,
} from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { useState, useEffect } from 'react';
import React from 'react';

import { defaultLivenessDisplayText } from './displayText';
import { useSnackbar } from '@/components/elements/alert';

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
      console.error(error);
      AlertError('No se ha podido validar su identidad. Si ha intentado varias veces, posiblemente tenga que actualizar su foto en la JCE');
    }
    // TODO: AlertError is causing re-rendering issues. But not adding it causes eslint error.
    // eslint-disable-next-line
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
              onError={(livenessError) => {
                console.error({
                  state: livenessError.state,
                  error: livenessError.error,
                });
              }}
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
