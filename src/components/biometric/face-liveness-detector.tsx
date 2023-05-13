import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { ThemeProvider } from "@aws-amplify/ui-react";
import React from "react";
import { LoadingProgress } from "../elements/loading";
import { AlertErrorMessage } from "../elements/alert";
import { defaultLivenessDisplayText } from "./displayText";

export function LivenessQuickStartReact({ handleNextForm, cedula }: any) {
  const next = handleNextForm;
  const id = cedula;
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<boolean>(false);
  const [sessionId, setSessionId] = React.useState<string>("");

  React.useEffect(() => {
    const fetchCreateLiveness = async () => {
      const response = await fetch(`/api/biometric`, { method: "POST" });
      const { sessionId } = await response.json();

      setSessionId(sessionId);
      setLoading(false);
    };

    fetchCreateLiveness();
  }, []);

  const handleAnalysisComplete = async () => {
    const response = await fetch(
      `/api/biometric?sessionId=${sessionId}&cedula=${id}`
    );
    const data = await response.json();

    if (data.match) {
      next();
    } else {
      setError(true);
    }
  };

  return (
    <>
      {error && (
        <AlertErrorMessage
          type="info"
          message="No se ha podido validar correctamente la identidad."
        />
      )}
      <br />
      <ThemeProvider>
        {loading ? (
          <LoadingProgress />
        ) : (
          <FaceLivenessDetector
            sessionId={sessionId}
            region="us-east-1"
            onAnalysisComplete={handleAnalysisComplete}
            disableInstructionScreen={true}
            displayText={defaultLivenessDisplayText}
          />
        )}
      </ThemeProvider>
    </>
  );
}
