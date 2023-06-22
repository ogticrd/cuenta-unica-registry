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
              // components={{
              //   Header: () => {
              //     return (
              //       <View flex="1">
              //         <Heading>Verificación de vida</Heading>
              //         <Text>
              //           Pasará por un proceso de verificación facial para demostrar que es una persona real.
              //         </Text>
              //       </View>
              //     );
              //   },
              //   PhotosensitiveWarning: (): JSX.Element => {
              //     return (
              //       <Alert
              //         variation="info"
              //         isDismissible={false}
              //         hasIcon={true}
              //         heading="Advertencia de fotosensibilidad"
              //       >
              //         Esta verificación muestra luces de colores. Tenga cuidado si es fotosensible.
              //       </Alert>
              //     );
              //   },
              //   Instructions: (): JSX.Element => {
              //     return (
              //       <Card color="white">
              //         Siga las instrucciones para completar la verificación:
              //         <ol>
              //           <li>
              //             Cuando aparezca un óvalo, rellena el óvalo con tu cara en 7 segundos.
              //           </li>
              //           <li>
              //             Maximiza el brillo de tu pantalla.
              //           </li>
              //           <li>
              //             Asegúrese de que su cara no esté cubierta con gafas de sol o una máscara.
              //           </li>
              //           <li>
              //             Muévase a un lugar bien iluminado que no esté expuesto a la luz solar directa.
              //           </li>
              //         </ol>
              //       </Card>
              //     );
              //   },
              //   // ErrorView: ({ children }) => {
              //   //   return (
              //   //     <View flex="1" backgroundColor="white">
              //   //       <Heading color="black">Error</Heading>
              //   //       {children}
              //   //     </View>
              //   //   );
              //   // },
              // }}
            />
          )
        )}
      </ThemeProvider>
    </>
  );
}
