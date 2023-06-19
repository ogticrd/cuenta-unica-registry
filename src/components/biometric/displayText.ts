export type HintDisplayText = {
  hintMoveFaceFrontOfCameraText?: string;
  hintTooManyFacesText?: string;
  hintFaceDetectedText?: string;
  hintCanNotIdentifyText?: string;
  hintTooCloseText?: string;
  hintTooFarText?: string;
  hintHoldFacePositionCountdownText?: string;
  hintConnectingText?: string;
  hintVerifyingText?: string;
  hintIlluminationTooBrightText?: string;
  hintIlluminationTooDarkText?: string;
  hintIlluminationNormalText?: string;
  hintHoldFaceForFreshnessText?: string;
};

export type CameraDisplayText = {
  cameraMinSpecificationsHeadingText?: string;
  cameraMinSpecificationsMessageText?: string;
  cameraNotFoundHeadingText?: string;
  cameraNotFoundMessageText?: string;
  retryCameraPermissionsText?: string;
};

export type InstructionDisplayText = {
  instructionsHeaderHeadingText?: string;
  instructionsHeaderBodyText?: string;
  instructionsBeginCheckText?: string;
  photosensitivyWarningHeadingText?: string;
  photosensitivyWarningBodyText?: string;
  photosensitivyWarningInfoText?: string;
  instructionListHeadingText?: string;
  goodFitCaptionText?: string;
  goodFitAltText?: string;
  tooFarCaptionText?: string;
  tooFarAltText?: string;
  instructionListStepOneText?: string;
  instructionListStepTwoText?: string;
  instructionListStepThreeText?: string;
  instructionListStepFourText?: string;
};

export type StreamDisplayText = {
  recordingIndicatorText?: string;
  cancelLivenessCheckText?: string;
};

export const defaultErrorDisplayText = {
  timeoutHeaderText: 'Se acabó el tiempo',
  timeoutMessageText:
    'La cara no llenó el óvalo dentro del límite de tiempo. Vuelva a intentarlo y llene completamente el óvalo con la cara en 7 segundos.',
  faceDistanceHeaderText: 'Comprobación fallida durante la cuenta regresiva',
  faceDistanceMessageText:
    'Evite acercarse durante la cuenta regresiva y asegúrese de que solo haya una cara frente a la cámara.',
  clientHeaderText: 'Error del cliente',
  clientMessageText: 'Verificación fallida debido a un problema con el cliente',
  serverHeaderText: 'Problema del servidor',
  serverMessageText:
    'No se puede completar la verificación debido a un problema con el servidor',
  landscapeHeaderText: 'Orientación horizontal no compatible',
  landscapeMessageText:
    'Gire su dispositivo a la orientación vertical (retrato).',
  portraitMessageText:
    'Asegúrese de que su dispositivo permanezca en orientación vertical (retrato) durante la verificación.',
  tryAgainText: 'Intentar otra vez',
};

export type ErrorDisplayTextFoo = typeof defaultErrorDisplayText;
export type ErrorDisplayText = Partial<ErrorDisplayTextFoo>;

export const defaultLivenessDisplayText: Required<LivenessDisplayText> = {
  instructionsHeaderHeadingText: 'Prueba de vida',
  instructionsHeaderBodyText:
    'Ahora va a realizar un proceso de verificación facial para demostrar que es una persona real.',
  instructionsBeginCheckText: 'Iniciar prueba',
  photosensitivyWarningHeadingText: 'Alerta de fotosensibilidad',
  photosensitivyWarningBodyText:
    'Esta comprobación muestra luces de colores. Tenga cuidado si es fotosensible.',
  photosensitivyWarningInfoText:
    'Un pequeño porcentaje de personas puede experimentar convulsiones epilépticas cuando se exponen a luces de colores. Tenga cuidado si usted o alguien de su familia tiene alguna condición epiléptica.',
  instructionListHeadingText: 'Siga las instrucciones para completar la verificación:',
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
  cameraMinSpecificationsHeadingText:
    'La cámara no cumple con las especificaciones mínimas',
  cameraMinSpecificationsMessageText:
    'La cámara debe admitir una resolución de al menos 320 * 240 y 15 fotogramas por segundo.',
  cameraNotFoundHeadingText: 'Cámara no accesible',
  cameraNotFoundMessageText:
    'Verifique que la cámara esté conectada y que los permisos de la cámara estén habilitados en la configuración antes de volver a intentarlo.',
  retryCameraPermissionsText: 'Procesar de nuevo',
  cancelLivenessCheckText: 'Cancelar prueba de vida',
  recordingIndicatorText: 'Grabando',
  hintMoveFaceFrontOfCameraText: 'Posicione la cara frente a la cámara',
  hintTooManyFacesText:
    'Asegúrese que solo una cara esté frente a la cámara',
  hintFaceDetectedText: 'Cara detectada',
  hintCanNotIdentifyText: 'No podemos identificar su cara frente a la cámara',
  hintTooCloseText: 'Muévase más atrás',
  hintTooFarText: 'Muévase más cerca',
  hintHoldFacePositionCountdownText:
    'Mantenga la posición de la cara durante la cuenta regresiva',
  hintConnectingText: 'Conectando...',
  hintVerifyingText: 'Verificando...',
  hintIlluminationTooBrightText: 'Muévase a un área con menos iluminación',
  hintIlluminationTooDarkText: 'Muévase a un área con mayor iluminación',
  hintIlluminationNormalText: 'Condiciones de iluminación correctas',
  hintHoldFaceForFreshnessText: 'Quédese quieto',
  ...defaultErrorDisplayText,
};

export interface LivenessDisplayText
  extends HintDisplayText,
    CameraDisplayText,
    InstructionDisplayText,
    ErrorDisplayText,
    StreamDisplayText {}
