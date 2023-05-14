import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import React from 'react';
import { useState, useEffect } from 'react';

import { defaultLivenessDisplayText } from './displayText';

export function LivenessQuickStartReact({ handleNextForm, cedula }: any) {
  const next = handleNextForm;
  const id = cedula;
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<{
    sessionId: string;
  } | null>(null);

  useEffect(() => {
    const fetchCreateLiveness = async () => {
      const response = await fetch(`/api/biometric`, { method: 'POST' });
      const { sessionId } = await response.json();

      setSessionId(sessionId);
      setLoading(false);
    };

    fetchCreateLiveness();
  }, []);

  const onUserCancel = () => {
    setError(null);
  };

  const handleAnalysisComplete = async () => {
    const response = await fetch(
      `/api/biometric?sessionId=${sessionId}&cedula=${id}`
    );
    const data = await response.json();

    if (data.match === true) {
      next();
    } else {
      setError(error);
    }
  };

  return (
    <ThemeProvider>
      {loading ? (
        <Loader />
      ) : (
        sessionId && (
          <FaceLivenessDetector
            sessionId={sessionId?.sessionId}
            region="us-east-1"
            onUserCancel={onUserCancel}
            onError={(error) => setError(error.message)}
            onAnalysisComplete={handleAnalysisComplete}
            disableInstructionScreen={true}
            displayText={defaultLivenessDisplayText}
          />
        )
      )}
    </ThemeProvider>
  );
}
