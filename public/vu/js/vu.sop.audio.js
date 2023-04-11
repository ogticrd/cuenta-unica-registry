/* Autogenerado por el script update_speech_files.py */
if (typeof vu == "undefined") {vu = function() {}}
if (typeof vu.sop == "undefined") {vu.sop = function() {}}
if (typeof vu.sop.audio == "undefined") {vu.sop.audio = function() {}}

if (typeof vu.sop.audio == "undefined") {
    vu.sop.audio.enabled = true
}

vu.sop.audio.snd = new Audio("data:audio/mp3;base64,"+vu.sop.audio.userError);
vu.sop.audio.play = function (base64) {
   if (vu.sop.audio.enabled) {
       document.getElementById(base64).play();
       console.log(document.getElementById(base64).play());
   }
}

vu.sop.audio.reproducir = function (){
    document.getElementById('vu.sop.audio.audioBeep').play();
    document.getElementById('vu.sop.audio.audioBeep').pause();
    document.getElementById('vu.sop.audio.facePoint').play();
    document.getElementById('vu.sop.audio.facePoint').pause();
    document.getElementById('vu.sop.audio.addFrontDocumentBottomMsg').play();
    document.getElementById('vu.sop.audio.addFrontDocumentBottomMsg').pause();
    document.getElementById('vu.sop.audio.addDocumentBottomText').play();
    document.getElementById('vu.sop.audio.addDocumentBottomText').pause();

    document.getElementById('vu.sop.audio.faceGesturesSmile').play();
    document.getElementById('vu.sop.audio.faceGesturesSmile').pause();
    document.getElementById('vu.sop.audio.faceGesturesLookLeft').play();
    document.getElementById('vu.sop.audio.faceGesturesLookLeft').pause();
    document.getElementById('vu.sop.audio.faceGesturesNone').play();
    document.getElementById('vu.sop.audio.faceGesturesNone').pause();
    document.getElementById('vu.sop.audio.faceGesturesLookRight').play();
    document.getElementById('vu.sop.audio.faceGesturesLookRight').pause();
    document.getElementById('vu.sop.audio.faceGesturesEyeClose').play();
    document.getElementById('vu.sop.audio.faceGesturesEyeClose').pause();
    document.getElementById('vu.sop.audio.faceGesturesEyeRightClose').play();
    document.getElementById('vu.sop.audio.faceGesturesEyeRightClose').pause();
    document.getElementById('vu.sop.audio.faceGesturesEyeLeftClose').play();
    document.getElementById('vu.sop.audio.faceGesturesEyeLeftClose').pause();
    document.getElementById('vu.sop.audio.faceGesturesLookUp').play();
    document.getElementById('vu.sop.audio.faceGesturesLookUp').pause();
    document.getElementById('vu.sop.audio.faceGesturesLookDown').play();
    document.getElementById('vu.sop.audio.faceGesturesLookDown').pause();

    document.getElementById('vu.sop.audio.endOpApiBadScore').play();
    document.getElementById('vu.sop.audio.endOpApiBadScore').pause();
    document.getElementById('vu.sop.audio.faceComunicationErrorRegister').play();
    document.getElementById('vu.sop.audio.faceComunicationErrorRegister').pause();
    document.getElementById('vu.sop.audio.faceComunicationErrorEndOperation').play();
    document.getElementById('vu.sop.audio.faceComunicationErrorEndOperation').pause();
    document.getElementById('vu.sop.audio.faceNoSelfieFrontImg').play();
    document.getElementById('vu.sop.audio.faceNoSelfieFrontImg').pause();
    document.getElementById('vu.sop.audio.endOpApiDocumentDataError').play();
    document.getElementById('vu.sop.audio.endOpApiDocumentDataError').pause();
    document.getElementById('vu.sop.audio.endOpApiDocumentBackFrontError').play();
    document.getElementById('vu.sop.audio.endOpApiDocumentBackFrontError').pause();
    document.getElementById('vu.sop.audio.endOpApiDocumentBarcodeDoNotExist').play();
    document.getElementById('vu.sop.audio.endOpApiDocumentBarcodeDoNotExist').pause();
    document.getElementById('vu.sop.audio.endOpApiDocumentExpired').play();
    document.getElementById('vu.sop.audio.endOpApiDocumentExpired').pause();
    document.getElementById('vu.sop.audio.endOpApiPersonDataFail').play();
    document.getElementById('vu.sop.audio.endOpApiPersonDataFail').pause();

    document.getElementById('vu.sop.audio.addFrontDocumentComunicationError').play();
    document.getElementById('vu.sop.audio.addFrontDocumentComunicationError').pause();
    document.getElementById('vu.sop.audio.addFrontDocumentPictureNotDetected').play();
    document.getElementById('vu.sop.audio.addFrontDocumentPictureNotDetected').pause();
    document.getElementById('vu.sop.audio.addFrontDocumentBarcodeNotDetected').play();
    document.getElementById('vu.sop.audio.addFrontDocumentBarcodeNotDetected').pause();
    document.getElementById('vu.sop.audio.addFrontDocumentError').play();
    document.getElementById('vu.sop.audio.addFrontDocumentError').pause();
    document.getElementById('vu.sop.audio.addFrontApiErrorAntiSpoofing').play();
    document.getElementById('vu.sop.audio.addFrontApiErrorAntiSpoofing').pause();
    document.getElementById('vu.sop.audio.addFrontApiErrorFrontAlreadyExist').play();
    document.getElementById('vu.sop.audio.addFrontApiErrorFrontAlreadyExist').pause();
    document.getElementById('vu.sop.audio.smallDocumentImg').play();
    document.getElementById('vu.sop.audio.smallDocumentImg').pause();
    document.getElementById('vu.sop.audio.badImageFormat').play();
    document.getElementById('vu.sop.audio.badImageFormat').pause();

    document.getElementById('vu.sop.audio.addBackDocumentFileUploadBottomMsg').play();
    document.getElementById('vu.sop.audio.addBackDocumentFileUploadBottomMsg').pause();
    document.getElementById('vu.sop.audio.addBackDocumentBottomMsg').play();
    document.getElementById('vu.sop.audio.addBackDocumentBottomMsg').pause();
    document.getElementById('vu.sop.audio.addBackDocumentComunicationError').play();
    document.getElementById('vu.sop.audio.addBackDocumentComunicationError').pause();
    document.getElementById('vu.sop.audio.addBackDocumentPictureNotDetected').play();
    document.getElementById('vu.sop.audio.addBackDocumentPictureNotDetected').pause();
    document.getElementById('vu.sop.audio.addBackDocumentBarcodeNotDetected').play();
    document.getElementById('vu.sop.audio.addBackDocumentBarcodeNotDetected').pause();
    document.getElementById('vu.sop.audio.addBackDocumentError').play();
    document.getElementById('vu.sop.audio.addBackDocumentError').pause();
    document.getElementById('vu.sop.audio.addBackApiErrorAntiSpoofing').play();
    document.getElementById('vu.sop.audio.addBackApiErrorAntiSpoofing').pause();
    document.getElementById('vu.sop.audio.addBackApiErrorFrontAlreadyExist').play();
    document.getElementById('vu.sop.audio.addBackApiErrorFrontAlreadyExist').pause();

    document.getElementById('vu.sop.audio.browserOldVersion').play();
    document.getElementById('vu.sop.audio.browserOldVersion').pause();
    document.getElementById('vu.sop.audio.browserUnsupported').play();
    document.getElementById('vu.sop.audio.browserUnsupported').pause();
    document.getElementById('vu.sop.audio.osOldVersion').play();
    document.getElementById('vu.sop.audio.osOldVersion').pause();
    document.getElementById('vu.sop.audio.deviceNotSupported').play();
    document.getElementById('vu.sop.audio.deviceNotSupported').pause();

    document.getElementById('vu.sop.audio.cameraDenied').play();
    document.getElementById('vu.sop.audio.cameraDenied').pause();
    document.getElementById('vu.sop.audio.cameraAutoplayProtection').play();
    document.getElementById('vu.sop.audio.cameraAutoplayProtection').pause();
    document.getElementById('vu.sop.audio.cameraLowResolution').play();
    document.getElementById('vu.sop.audio.cameraLowResolution').pause();
    document.getElementById('vu.sop.audio.cameraError').play();
    document.getElementById('vu.sop.audio.cameraError').pause();

    document.getElementById('vu.sop.audio.faceError').play();
    document.getElementById('vu.sop.audio.faceError').pause();
    document.getElementById('vu.sop.audio.faceNoDocFrontImg').play();
    document.getElementById('vu.sop.audio.faceNoDocFrontImg').pause();
    document.getElementById('vu.sop.audio.faceErrorUserNotExist').play();
    document.getElementById('vu.sop.audio.faceErrorUserNotExist').pause();
    document.getElementById('vu.sop.audio.faceErrorFailAuth').play();
    document.getElementById('vu.sop.audio.faceErrorFailAuth').pause();

    document.getElementById('vu.sop.audio.userError').play();
    document.getElementById('vu.sop.audio.userError').pause();
}
