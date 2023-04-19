if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.msg == "undefined") { vu.sop.msg = function() {} }

vu.sop.msg.blurryImage = "Imagen Borrosa"
vu.sop.msg.darkImage = "No hay suficiente iluminación"
vu.sop.msg.blurryFace = "Rostro muy borroso"
vu.sop.msg.darkFace = "No hay suficiente iluminación"
vu.sop.msg.faceAway = "Acerque el rostro a la cámara"
vu.sop.msg.faceClose = "Aleje el rostro de la cámara"
vu.sop.msg.faceNotDetected = "Centre su rostro"

vu.sop.msg.documentNotCentered = "Por favor, centre su documento"
vu.sop.msg.blurryDocument = "Documento muy borroso"
vu.sop.msg.darkDocument = "No hay suficiente iluminación"
vu.sop.msg.documentAway = "Acerque el documento a la cámara"
vu.sop.msg.documentClose = "Aleje el documento de la cámara"
vu.sop.msg.documentHasABrightSpot = "Demasiado brillo en el documento"


vu.sop.msg.deviceNotSupported = "Este dispositivo no esta soportado"
vu.sop.msg.browserOldVersion = "Por favor actualice su navegador"
vu.sop.msg.browserUnsupported = "Por favor use Chrome, Safari o Edge"
vu.sop.msg.osOldVersion = "Por favor actualice su sistema operativo"

vu.sop.msg.userInputPlaceholder = "Cedula"
vu.sop.msg.userSendBtn = "Iniciar"

vu.sop.msg.cameraDenied = "Debe aceptar los permisos de la camara del navegador para continuar";
vu.sop.msg.cameraAutoplayProtection = "Video Anti-Autoplay evito el acceso a la camara, por favor, deshabilitelo y reintente";
vu.sop.msg.cameraLowResolution = "La resolución de la cámara no es suficiente. Por favor, intente con otro dispositivo";
vu.sop.msg.cameraError = "Ocurrió un error no determinado accediendo a la camara, contacte al administrador";

vu.sop.msg.userError = "Ocurrió un error en el inicio de la registracion, por favor, reintente";
vu.sop.msg.userComunicationError = "No se pudo comunicar con el servidor, por favor, reintente";
vu.sop.msg.userPleaseEnableAudio = "Por favor, habilite el sonido";

vu.sop.msg.addDocumentCameraIconMsg = "Camara";
vu.sop.msg.addDocumentFileIconMsg = "Subir archivos";
vu.sop.msg.addDocumentBottomText = "Requerimos fotos de su documento";

vu.sop.msg.addFrontDocumentFileUploadBottomMsg  = "Frente del documento";
vu.sop.msg.addFrontDocumentBottomMsg = "Frente del documento";
vu.sop.msg.addFrontDocumentComunicationError = "Ocurrió un error comunicándose con la API, por favor, reintente";
vu.sop.msg.addFrontDocumentPictureNotDetected = "No se pudo detectar el rostro en el documento, por favor, reintente";
vu.sop.msg.addFrontDocumentBarcodeNotDetected = "No se pudo leer el codigo de barras, por favor, reintente";
vu.sop.msg.addFrontDocumentError = "Ocurrio un error en la imagen del frente, por favor, reintente";
vu.sop.msg.addFrontApiErrorAntiSpoofing = "No podemos autenticar el documento, por favor, reintente";
vu.sop.msg.addFrontApiErrorFrontAlreadyExist = "Ocurrió un error con la imagen, por favor, reintente";

vu.sop.msg.addBackDocumentFileUploadBottomMsg  = "Dorso del documento";
vu.sop.msg.addBackDocumentBottomMsg = "Dorso del documento";
vu.sop.msg.addBackDocumentComunicationError = "Ocurrió un error comunicándose con la API, por favor, reintente";
vu.sop.msg.addBackDocumentPictureNotDetected = "No se pudo detectar el rostro en el documento, por favor, reintente";
vu.sop.msg.addBackDocumentBarcodeNotDetected = "No se puedo leer el codigo de barras, por favor, reintente";
vu.sop.msg.addBackDocumentError = "Ocurrió un error en la imagen del dorso, por favor, reintente";
vu.sop.msg.addBackApiErrorAntiSpoofing = "No podemos autenticar el documento, por favor, reintente";
vu.sop.msg.addBackApiErrorFrontAlreadyExist = "Ocurrió un error con la imagen, por favor, reintente";
vu.sop.msg.smallDocumentImg = "Imagen con resolución muy chica, intente con otra imagen"
vu.sop.msg.badImageFormat = "Formato de imagen no soportado, por favor use PNG or JPG"


vu.sop.msg.facePoint = "Siga el punto con la cabeza";
vu.sop.msg.faceComunicationErrorRegister = "Error comunicándose con la API, por favor, reintente";
vu.sop.msg.faceComunicationErrorEndOperation = "Error comunicándose con la API, por favor, reintente"
vu.sop.msg.faceError = "Ocurrió un error no determinado, contacte al administrador";
vu.sop.msg.faceErrorUserNotExist = "Usuario no existe";
vu.sop.msg.faceErrorFailAuth = "Fallo de autenticación, por favor, reintente";

vu.sop.msg.faceNoDocFrontImg = "El documento no tiene la imagen del rostro, por favor, reintente";
vu.sop.msg.faceNoSelfieFrontImg = "Error en la imagen del rostro, por favor, reintente";

vu.sop.msg.faceGesturesSmile = "Sonría mostrando los dientes hasta que el circulo se ponga verde";
vu.sop.msg.faceGesturesEyeClose = "Cierre los ojos hasta escuchar el bip";
vu.sop.msg.faceGesturesEyeRightClose = "Cierre el ojo derecho hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesEyeLeftClose = "Cierre el ojo izquierdo hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesLookLeft = "Mire ligeramente a la derecha hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesLookRight = "Mire ligeramente a la izquierda hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesLookUp = "Mire ligeramente arriba hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesLookDown = "Mire ligeramente abajo hasta que el círculo se ponga verde";
vu.sop.msg.faceGesturesNone = "Mire hacia adelante con un gesto neutral hasta que el círculo se ponga verde";

vu.sop.msg.endOpApiBadScore = "No supero las validaciones de identidad, por favor, reintente";
vu.sop.msg.endOpApiDocumentDataError = "Información del documento erronea, por favor, reintente";
vu.sop.msg.endOpApiDocumentBackFrontError = "La información entre el frente y dorso del documento no coincide, por favor, reintente";
vu.sop.msg.endOpApiDocumentBarcodeDoNotExist = "No se pudo leer el código de barras, por favor, reintente";
vu.sop.msg.endOpApiDocumentExpired = "Documento expirado, por favor, reintente";
vu.sop.msg.endOpApiPersonDataFail = "No se pudo analizar la información de la persona, por favor, reintente";
