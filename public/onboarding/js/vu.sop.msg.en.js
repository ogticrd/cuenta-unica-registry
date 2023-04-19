if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.msg == "undefined") { vu.sop.msg = function() {} }

vu.sop.msg.blurryImage = "Blurry Image"
vu.sop.msg.darkImage = "Not enough light"
vu.sop.msg.blurryFace = "Face too Blurry"
vu.sop.msg.darkFace = "Not enough light"
vu.sop.msg.faceAway = "Please, get your face closer to the camera"
vu.sop.msg.faceClose = "Please move your face slightly away from the camera"
vu.sop.msg.faceNotDetected = "Please, center your face"

vu.sop.msg.documentNotCentered = "Please, center your document"
vu.sop.msg.blurryDocument = "Document too Blurry"
vu.sop.msg.darkDocument = "Not enough light"
vu.sop.msg.documentAway = "Please, get your document closer to the camera"
vu.sop.msg.documentClose = "Please move your document slightly away from the camera"
vu.sop.msg.documentHasABrightSpot = "Glare detected on ID card"


vu.sop.msg.deviceNotSupported = "This device is not supported"
vu.sop.msg.browserOldVersion = "Please upgrade your browser for full support"
vu.sop.msg.browserUnsupported = "Please use Chrome, Safari or Edge"
vu.sop.msg.osOldVersion = "Please upgrade your OS for full support"

vu.sop.msg.userInputPlaceholder = "User E-Mail"
vu.sop.msg.userSendBtn = "Start"

vu.sop.msg.cameraDenied = "Must allow the browser to use the camera to continue";
vu.sop.msg.cameraAutoplayProtection = "Anti-Autoplay Video Anti-Autoplay prevents access to camera, please disable it and try again";
vu.sop.msg.cameraLowResolution = "Camera resolution is too low. Please, try on a different device";
vu.sop.msg.cameraError = "A undefined error occurred when accessing the camera, contact the administrator";

vu.sop.msg.userError = "An error occurred at the beginning of the resgiter, please try again";
vu.sop.msg.userComunicationError = "Communication with the server couldn't be established, please try again";
vu.sop.msg.userPleaseEnableAudio = "Please turn the sound off";

vu.sop.msg.addDocumentCameraIconMsg = "Camera";
vu.sop.msg.addDocumentFileIconMsg = "Upload files";
vu.sop.msg.addDocumentBottomText = "We require photos of your ID";

vu.sop.msg.addFrontDocumentFileUploadBottomMsg  = "ID Front";
vu.sop.msg.addFrontDocumentBottomMsg = "ID Front";
vu.sop.msg.addFrontDocumentComunicationError = "An error occurred while communicating with the API, please try again";
vu.sop.msg.addFrontDocumentPictureNotDetected = "Face within the ID wasn't detected, please try again";
vu.sop.msg.addFrontDocumentBarcodeNotDetected = "Barcode wasn't read, please try again";
vu.sop.msg.addFrontDocumentError = "An error occurred with the front image, please try again";
vu.sop.msg.addFrontApiErrorAntiSpoofing = "We couldn't authenticate the ID, please try again";
vu.sop.msg.addFrontApiErrorFrontAlreadyExist = "An error occurred with the image, please try again";

vu.sop.msg.addBackDocumentFileUploadBottomMsg  = "ID Back";
vu.sop.msg.addBackDocumentBottomMsg = "ID Back";
vu.sop.msg.addBackDocumentComunicationError = "An error occurred while communicating with the API, please try again";
vu.sop.msg.addBackDocumentPictureNotDetected = "Face within the ID wasn't detected, please try again";
vu.sop.msg.addBackDocumentBarcodeNotDetected = "Barcode wasn't read, please try again";
vu.sop.msg.addBackDocumentError = "An error occurred with the back image, please try again";
vu.sop.msg.addBackApiErrorAntiSpoofing = "We couldn't authenticate the document, please try again";
vu.sop.msg.addBackApiErrorFrontAlreadyExist = "An error occurred with the image, please try again";
vu.sop.msg.smallDocumentImg = "Image too small, please try with other image"
vu.sop.msg.badImageFormat = "Image format not supported, please use PNG or JPG"


vu.sop.msg.facePoint = "Follow the point";
vu.sop.msg.faceComunicationErrorRegister = "An error occurred while communicating with the API, please try again";
vu.sop.msg.faceComunicationErrorEndOperation = "An error occurred while communicating with the API, please try again"
vu.sop.msg.faceError = "A undefined error occurred, please contact the administrator";
vu.sop.msg.faceErrorUserNotExist = "User doesn't exist";
vu.sop.msg.faceErrorFailAuth = "Authentication failure, please try again";

vu.sop.msg.faceNoDocFrontImg = "The ID doesn't have the face image, please try again";
vu.sop.msg.faceNoSelfieFrontImg = "Error in the face image, please try again";

vu.sop.msg.faceGesturesSmile = "Smile showing teeth until the circle is green";
vu.sop.msg.faceGesturesEyeClose = "Close your eyes until you hear the signal";
vu.sop.msg.faceGesturesEyeRightClose = "Close your right eye until the circle is green";
vu.sop.msg.faceGesturesEyeLeftClose = "Close your left eye until the circle is green";
vu.sop.msg.faceGesturesLookLeft = "Look slightly to the right until the circle is green";
vu.sop.msg.faceGesturesLookRight = "Look slightly to the left until the cricle is green";
vu.sop.msg.faceGesturesLookUp = "Look slightly up until the circle is green";
vu.sop.msg.faceGesturesLookDown = "Look slightly down until the cricle is green";
vu.sop.msg.faceGesturesNone = "Look to the front with a neutral face until the circle is green";

vu.sop.msg.endOpApiBadScore = "Didn't pass the identity validations, please try again";
vu.sop.msg.endOpApiDocumentDataError = "Wrong document information, please trry again";
vu.sop.msg.endOpApiDocumentBackFrontError = "The information of front and back of the ID doesn't match, please try again";
vu.sop.msg.endOpApiDocumentBarcodeDoNotExist = "Barcode wasn't read, please again";
vu.sop.msg.endOpApiDocumentExpired = "Expired document, please try again";
vu.sop.msg.endOpApiPersonDataFail = "Person's identity wasn't analyzed, please try again";