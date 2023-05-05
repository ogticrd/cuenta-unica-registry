import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { ThemeProvider } from "@aws-amplify/ui-react";
import React from "react";
import { LoadingProgress } from "../elements/loading";
import { AlertErrorMessage } from "../elements/alert";
import { View, Heading, Alert, Card, Text } from '@aws-amplify/ui-react';
import { defaultLivenessDisplayText } from './displayText'

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

  // const dictionary = {
  //   // use default strings for english
  //   en: null,
  //   es: {
  //     instructionsHeaderHeadingText: 'Verificación de vida',
  //     instructionsHeaderBodyText:
  //       'Pasará por un proceso de verificación facial para demostrar que es una persona real.',
  //     instructionListStepOneText:
  //       'Cuando aparezca un óvalo, rellena el óvalo con tu cara en 7 segundos.',
  //     instructionListStepTwoText: 'Maximiza el brillo de tu pantalla.',
  //     instructionListStepThreeText:
  //       'Asegúrese de que su cara no esté cubierta con gafas de sol o una máscara.',
  //     instructionListStepFourText:
  //       'Muévase a un lugar bien iluminado que no esté expuesto a la luz solar directa.',
  //     photosensitivyWarningHeadingText: 'Advertencia de fotosensibilidad',
  //     photosensitivyWarningBodyText:
  //       'Esta verificación muestra luces de colores. Tenga cuidado si es fotosensible.',
  //     instructionListHeadingText:
  //       'Siga las instrucciones para completar la verificación:',
  //     goodFitCaptionText: 'Buen ajuste',
  //     tooFarCaptionText: 'Demasiado lejos',
  //   },
  // };

  return (
    <>
      {error &&
        <AlertErrorMessage
          type="info"
          message="No se ha podido validar correctamente la identidad."
        />
      }
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
            // components={{
            //   Header: () => {
            //     return (
            //       <>
            //       asd
            //       </>
            //       // <View flex="1">
            //       //   <Heading>asd</Heading>
            //       //   <Text>
            //       //     Yasdasd
            //       //   </Text>
            //       // </View>
            //     );
            //   },
            //   PhotosensitiveWarning: (): JSX.Element => {
            //     return (
            //       <>
            //       asd
            //       </>
            //       // <Alert
            //       //   variation="warning"
            //       //   isDismissible={false}
            //       //   hasIcon={true}
            //       //   heading="Caution"
            //       // >
            //       //  asdasd
            //       // </Alert>
            //     );
            //   },
            //   Instructions: (): JSX.Element => {
            //     return (
            //       <>
            //       asd
            //       </>
            //       // <Card variation="elevated">
            //       //   asdasd
            //       //   <ol>
            //       //     <li>
            //       //       asdasdasdmask.
            //       //     </li>
            //       //     <li>
            //       //       Moasdasdas
            //       //     </li>
            //       //     <li>
            //       //       Fill oasdasdasdasdasdold for colored lights.
            //       //     </li>
            //       //   </ol>
            //       // </Card>
            //     );
            //   },
            //   ErrorView: ({ children } : any) => {
            //     return (
            //       <>
            //         <br />
            //         <AlertErrorMessage
            //           message="Comprobación fallida durante la cuenta atrás"
            //           type="error"
            //         />
            //          {/* <View flex="1" backgroundColor="white">
            //            <Heading color="black">adasdsd</Heading>
            //            {children}
            //            asdsd
            //         </View> */}
            //       </>
            //     );
            //   },
            // }}
          />
        )}
      </ThemeProvider>
    </>
  );
}
