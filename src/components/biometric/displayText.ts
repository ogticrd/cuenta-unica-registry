import {
  LivenessDisplayText,
  HintDisplayText,
  CameraDisplayText,
  InstructionDisplayText,
  StreamDisplayText,
  ErrorDisplayText,
} from '@aws-amplify/ui-react-liveness/dist/types/components/FaceLivenessDetector/displayText';

import { getDisplayText } from '@aws-amplify/ui-react-liveness/dist/types/components/FaceLivenessDetector/utils/getDisplayText';

export const defaultHintDisplayText: Required<HintDisplayText> = {
  hintMoveFaceFrontOfCameraText: 'Posicione la cara frente a la cámara',
  hintTooManyFacesText: 'Asegúrese que solo una cara esté frente a la cámara',
  hintFaceDetectedText: 'Cara detectada',
  hintCanNotIdentifyText: 'No podemos identificar su cara frente a la cámara',
  hintTooCloseText: 'Aléjese un poco más',
  hintTooFarText: 'Acérquese un poco más',
  hintHoldFacePositionCountdownText: 'Mantenga la posición de la cara',
  hintConnectingText: 'Conectando...',
  hintVerifyingText: 'Verificando...',
  hintIlluminationTooBrightText: 'El área está muy iluminada',
  hintIlluminationTooDarkText: 'El área está muy oscura',
  hintIlluminationNormalText: 'Condiciones de iluminación correctas',
  hintHoldFaceForFreshnessText: 'Quédese quieto',
};

export const defaultCameraDisplayText: Required<CameraDisplayText> = {
  cameraMinSpecificationsHeadingText:
    'La cámara no cumple con las especificaciones mínimas',
  cameraMinSpecificationsMessageText:
    'La cámara debe admitir una resolución de al menos 320 * 240 y 15 fotogramas por segundo.',
  cameraNotFoundHeadingText: 'Cámara no accesible',
  cameraNotFoundMessageText:
    'Verifique que la cámara esté conectada y que los permisos de la cámara estén habilitados en la configuración antes de volver a intentarlo.',
  retryCameraPermissionsText: 'Procesar de nuevo',
};

export const defaultInstructionDisplayText: Required<InstructionDisplayText> = {
  instructionsHeaderHeadingText: 'Verificación facial',
  instructionsHeaderBodyText:
    'Ahora va a realizar un proceso de verificación facial para demostrar que es una persona real.',
  instructionsBeginCheckText: 'Iniciar verificación',
  photosensitivyWarningHeadingText: 'Alerta de fotosensibilidad',
  photosensitivyWarningBodyText:
    'Esta verificación muestra luces de colores. Tenga cuidado si es fotosensible.',
  photosensitivyWarningInfoText:
    'Un pequeño porcentaje de personas puede experimentar convulsiones epilépticas cuando se exponen a luces de colores. Tenga cuidado si usted o alguien de su familia tiene alguna condición epiléptica.',
  instructionListHeadingText:
    'Siga las instrucciones para completar la verificación:',
  goodFitCaptionText: 'Bien encajado',
  goodFitAltText:
    'Ilustración de la cara de una persona, encajando perfectamente dentro de un óvalo.',
  tooFarCaptionText: 'Demasiado lejos',
  tooFarAltText:
    'Ilustración de la cara de una persona dentro de un óvalo; hay un espacio entre el perímetro de la cara y los límites del óvalo.',
  instructionListStepOneText:
    'Cuando el óvalo aparezca, llénelo con su cara en 7 segundos.',
  instructionListStepTwoText: 'Maximice el brillo de su pantalla.',
  instructionListStepThreeText:
    'Asegúrese de que su cara no esté cubierta con gafas de sol o una máscara.',
  instructionListStepFourText:
    'Muévase a un lugar bien iluminado que no esté expuesto a la luz solar directa.',
};

export const defaultStreamDisplayText: Required<StreamDisplayText> = {
  recordingIndicatorText: 'Grabando',
  cancelLivenessCheckText: 'Cancelar',
};

export const defaultErrorDisplayText: Required<ErrorDisplayText> = {
  timeoutHeaderText: 'Se acabó el tiempo',
  timeoutMessageText:
    'La cara no llenó el óvalo dentro del límite de tiempo. Vuelva a intentarlo y llene completamente el óvalo con la cara en 7 segundos.',
  faceDistanceHeaderText: 'Se detectó movimiento de la cara',
  faceDistanceMessageText: 'Evite acercarse durante la conexión.',
  multipleFacesHeaderText: 'Se detectaron múltiples caras',
  multipleFacesMessageText: 'Solo una cara debe estar frente a la cámara.',
  clientHeaderText: 'Error del cliente',
  clientMessageText: 'Verificación fallida debido a un problema con el cliente',
  serverHeaderText: 'Problema con el servidor',
  serverMessageText:
    'No se puede completar la verificación debido a un problema con el servidor',
  landscapeHeaderText: 'Orientación horizontal no compatible',
  landscapeMessageText:
    'Gire su dispositivo a la orientación vertical (retrato).',
  portraitMessageText:
    'Asegúrese de que su dispositivo permanezca en orientación vertical (retrato) durante la verificación.',
  tryAgainText: 'Intentar otra vez',
};

const defaultLivenessDisplayText: Required<LivenessDisplayText> = {
  ...defaultHintDisplayText,
  ...defaultCameraDisplayText,
  ...defaultInstructionDisplayText,
  ...defaultStreamDisplayText,
  ...defaultErrorDisplayText,
};

export const displayText = getDisplayText(defaultLivenessDisplayText);
