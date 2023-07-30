import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';

import { defaultLivenessDisplayText } from './displayText';
import { useSnackbar } from '@/components/elements/alert';

export function LivenessQuickStartReact({ handleNextForm, cedula }: any) {
  const next = handleNextForm;
  const id = cedula;
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { AlertError } = useSnackbar();

  const fetchCreateLiveness = useCallback(async () => {
    try {
      const response = await fetch(`/api/biometric`, { method: 'POST' });
      const { sessionId } = await response.json();

      setSessionId(sessionId);
      setLoading(false);
    } catch (error) {
      console.error(error);
      AlertError('Error fetching biometric data');
    }
  }, [AlertError]);

  const onUserCancel = () => {
    setSessionId(null);
    fetchCreateLiveness();
  };

  const handleAnalysisComplete = async () => {
    try {
      const response = await fetch(
        `/api/biometric?sessionId=${sessionId}&cedula=${id}`
      );
      const data = await response.json();

      if (data.isMatch === true) {
        next();
      } else {
        // TODO: Validate if this was a confidence or a similarity error, to show the correct message
        AlertError(
          'No se ha podido validar su identidad. Si ha intentado varias veces, posiblemente tenga que actualizar su foto en la JCE'
        );
        setSessionId(null);
        fetchCreateLiveness();
      }
    } catch (error) {
      console.error(error);
      AlertError('Error during analysis');
    }
  };

  useEffect(() => {
    fetchCreateLiveness();
  }, [fetchCreateLiveness]);

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
