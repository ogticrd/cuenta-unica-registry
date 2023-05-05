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
      "La cara no llenó el óvalo dentro del límite de tiempo. Vuelva a intentarlo y llene completamente el óvalo con la cara en 7 segundos.",
    faceDistanceHeaderText: 'Comprobación fallida durante la cuenta atrás',
    faceDistanceMessageText:
      'Evite acercarse durante la cuenta regresiva y asegúrese de que solo una cara esté frente a la cámara.',
    clientHeaderText: 'Error del cliente',
    clientMessageText: 'Verificación fallida debido a un problema con el cliente',
    serverHeaderText: 'Problema del servidor',
    serverMessageText: 'No se puede completar la verificación debido a un problema con el servidor',
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
    instructionsHeaderHeadingText: 'Liveness check',
    instructionsHeaderBodyText:
      'You will go through a face verification process to prove that you are a real person.',
    instructionsBeginCheckText: 'Begin check',
    photosensitivyWarningHeadingText: 'Photosensitivity warning',
    photosensitivyWarningBodyText:
      'This check displays colored lights. Use caution if you are photosensitive.',
    photosensitivyWarningInfoText:
      'A small percentage of individuals may experience epileptic seizures when exposed to colored lights. Use caution if you, or anyone in your family, have an epileptic condition.',
    instructionListHeadingText: 'Follow the instructions to complete the check:',
    goodFitCaptionText: 'Good fit',
    goodFitAltText:
      "Ilustration of a person's face, perfectly fitting inside of an oval.",
    tooFarCaptionText: 'Too far',
    tooFarAltText:
      "Illustration of a person's face inside of an oval; there is a gap between the perimeter of the face and the boundaries of the oval.",
    instructionListStepOneText:
      'When an oval appears, fill the oval with your face within 7 seconds.',
    instructionListStepTwoText: "Maximize your screen's brightness.",
    instructionListStepThreeText:
      'Make sure your face is not covered with sunglasses or a mask.',
    instructionListStepFourText:
      'Move to a well-lit place that is not in direct sunlight.',
    cameraMinSpecificationsHeadingText:
      'Camera does not meet minimum specifications',
    cameraMinSpecificationsMessageText:
      'Camera must support at least 320*240 resolution and 15 frames per second.',
    cameraNotFoundHeadingText: 'Camera not accessible.',
    cameraNotFoundMessageText:
      'Verifique que la cámara esté conectada y que los permisos de la cámara estén habilitados en la configuración antes de volver a intentarlo.',
    retryCameraPermissionsText: 'Procesar de nuevo',
    cancelLivenessCheckText: 'Cancelar comprobación de vitalidad',
    recordingIndicatorText: 'Grabación',
    hintMoveFaceFrontOfCameraText: 'Mover la cara frente a la cámara',
    hintTooManyFacesText: 'Asegúrese de que solo una cara esté frente a la cámara',
    hintFaceDetectedText: 'Cara detectada',
    hintCanNotIdentifyText: 'Mover la cara frente a la cámara',
    hintTooCloseText: 'Muévete mas atrás',
    hintTooFarText: 'Muévete mas cerca',
    hintHoldFacePositionCountdownText: 'Mantener la posición de la cara durante la cuenta regresiva',
    hintConnectingText: 'Conectando...',
    hintVerifyingText: 'Verificando...',
    hintIlluminationTooBrightText: 'Mover al área de atenuación',
    hintIlluminationTooDarkText: 'Mover a un área más brillante',
    hintIlluminationNormalText: 'Condiciones de iluminación normales',
    hintHoldFaceForFreshnessText: 'Quédate quieto',
    ...defaultErrorDisplayText,
  };
  
  export interface LivenessDisplayText
    extends HintDisplayText,
      CameraDisplayText,
      InstructionDisplayText,
      ErrorDisplayText,
      StreamDisplayText {}