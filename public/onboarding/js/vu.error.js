if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.error == "undefined") { vu.error = function() {} }

vu.error.LOAD_ERROR = 'LoadError';
vu.error.USER_ERROR = 'UserError';
vu.error.TAKE_DOCUMENT_FRONT_ERROR = 'TakeDocumentFrontError';
vu.error.TAKE_DOCUMENT_BACK_ERROR = 'TakeDocumentBackError';
vu.error.UPLOAD_DOCUMENT_FRONT_ERROR = 'UploadDocumentFrontError';
vu.error.UPLOAD_DOCUMENT_BACK_ERROR = 'UploadDocumentBackError';
vu.error.CAMERA_ERROR = 'CameraError';
vu.error.CAMERA_FACE_ERROR = 'CameraFaceError';
vu.error.FACE_AUTH_ERROR = 'FaceAuthError';

vu.error.LoadError = function(message) {
    this.name = vu.error.LOAD_ERROR;
    this.message = message;
}
vu.error.LoadError.prototype = Error.prototype;

vu.error.UserError = function(message) {
    this.name = vu.error.USER_ERROR;
    this.message = message;
}
vu.error.UserError.prototype = Error.prototype;

vu.error.TakeDocumentFrontError = function(message) {
    this.name = vu.error.TAKE_DOCUMENT_FRONT_ERROR;
    this.message = message;
}
vu.error.TakeDocumentFrontError.prototype = Error.prototype;

vu.error.TakeDocumentBackError = function(message) {
    this.name = vu.error.TAKE_DOCUMENT_BACK_ERROR;
    this.message = message;
}
vu.error.TakeDocumentBackError.prototype = Error.prototype;

vu.error.UploadDocumentFrontError = function(message) {
    this.name = vu.error.UPLOAD_DOCUMENT_FRONT_ERROR;
    this.message = message;
}
vu.error.UploadDocumentFrontError.prototype = Error.prototype;

vu.error.UploadDocumentBackError = function(message) {
    this.name = vu.error.UPLOAD_DOCUMENT_BACK_ERROR;
    this.message = message;
}
vu.error.UploadDocumentBackError.prototype = Error.prototype;

vu.error.CameraError = function(message) {
    this.name = vu.error.CAMERA_ERROR;
    this.message = message;
}
vu.error.CameraError.prototype = Error.prototype;

vu.error.CameraFaceError = function(message) {
    this.name = vu.error.CAMERA_FACE_ERROR;
    this.message = message;
}
vu.error.CameraFaceError.prototype = Error.prototype;

vu.error.FaceAuthError = function(message) {
    this.name = vu.error.FACE_AUTH_ERROR;
    this.message = message;
}
vu.error.FaceAuthError.prototype = Error.prototype;

vu.error.showError = async function(e) {
    console.log(e.name, e.message);
    if(e.name === vu.error.LOAD_ERROR) {
        if (e.message === 'browserOldVersion') {
            vu.sop.audio.play('vu.sop.audio.browserOldVersion');
            await vu.sop.ui.alertNoButton(vu.sop.msg.browserOldVersion)
        } else if (e.message === 'browserUnsupported') {
            vu.sop.audio.play('vu.sop.audio.browserUnsupported');
            await vu.sop.ui.alertNoButton(vu.sop.msg.browserUnsupported);
        } else if (e.message === 'osOldVersion') {
            vu.sop.audio.play('vu.sop.audio.osOldVersion');
            await vu.sop.ui.alertNoButton(vu.sop.msg.osOldVersion)
        } else if(e.message === 'deviceNotSupported') {
            vu.sop.audio.play('vu.sop.audio.deviceNotSupported');
            await vu.sop.ui.alertNoButton(vu.sop.msg.deviceNotSupported)
        }
    } else if(e.name === vu.error.USER_ERROR) {
        vu.sop.audio.play('vu.sop.audio.userError');
        await vu.sop.ui.alert(vu.sop.msg.userError);
    } else if(e.name === vu.error.TAKE_DOCUMENT_FRONT_ERROR) {
        if (e.message === 'addFrontApiError') {
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentComunicationError');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentComunicationError)
        } else if (e.message === 'documentPictureNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentPictureNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentPictureNotDetected)
        } else if (e.message === 'documentBarcodeNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentBarcodeNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentBarcodeNotDetected)
        } else if (e.message === 'addFrontApiErrorAntiSpoofing'){
            vu.sop.audio.play('vu.sop.audio.addFrontApiErrorAntiSpoofing');
            await vu.sop.ui.alert(vu.sop.msg.addFrontApiErrorAntiSpoofing)
        } else if (e.message === 'addFrontApiErrorFrontAlreadyExist'){
            vu.sop.audio.play('vu.sop.audio.addFrontApiErrorFrontAlreadyExist');
            await vu.sop.ui.alert(vu.sop.msg.addFrontApiErrorFrontAlreadyExist)
        } else {
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentError');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentError)
        }
    } else if(e.name === vu.error.TAKE_DOCUMENT_BACK_ERROR) {
        if (e.message === 'addBackApiError') {
            vu.sop.audio.play('vu.sop.audio.addBackDocumentComunicationError');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentComunicationError)
        } else if (e.message === 'documentPictureNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addBackDocumentPictureNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentPictureNotDetected)
        } else if (e.message === 'documentBarcodeNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addBackDocumentBarcodeNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentBarcodeNotDetected)
        } else if (e.message === 'addBackApiErrorAntiSpoofing'){
            vu.sop.audio.play('vu.sop.audio.addBackApiErrorAntiSpoofing');
            await vu.sop.ui.alert(vu.sop.msg.addBackApiErrorAntiSpoofing)
        } else if (e.message === 'addBackApiErrorFrontAlreadyExist'){
            vu.sop.audio.play('vu.sop.audio.addBackApiErrorFrontAlreadyExist');
            await vu.sop.ui.alert(vu.sop.msg.addBackApiErrorFrontAlreadyExist)
        } else {
            vu.sop.audio.play('vu.sop.audio.addBackDocumentError');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentError)
        }
    } else if(e.name === vu.error.CAMERA_ERROR) {
        if (e.message === 'denied') {
            vu.sop.audio.play('vu.sop.audio.cameraDenied');
            await vu.sop.ui.alert(vu.sop.msg.cameraDenied)
        } else if (e.message === 'autoplay') {
            vu.sop.audio.play('vu.sop.audio.cameraAutoplayProtection');
            await vu.sop.ui.alert(vu.sop.msg.cameraAutoplayProtection)
        } else if (e.message === 'lowResolution') {
            vu.sop.audio.play('vu.sop.audio.cameraLowResolution');
            await vu.sop.ui.alert(vu.sop.msg.cameraLowResolution)
        } else {
            vu.sop.audio.play('vu.sop.audio.cameraError');
            await vu.sop.ui.alert(vu.sop.msg.cameraError )
        }
    } else if(e.name === vu.error.CAMERA_FACE_ERROR) {
        if (e.message === 'denied') {
            vu.sop.audio.play('vu.sop.audio.cameraDenied');
            await vu.sop.ui.alert(vu.sop.msg.cameraDenied )
        } else if (e.message === 'autoplay') {
            vu.sop.audio.play('vu.sop.audio.cameraAutoplayProtection');
            await vu.sop.ui.alert(vu.sop.msg.cameraAutoplayProtection)
        } else if (e.message === 'registerApiError') {
            vu.sop.audio.play('vu.sop.audio.faceComunicationErrorRegister');
            await vu.sop.ui.alert(vu.sop.msg.faceComunicationErrorRegister)
        } else if (e.message === 'endOpApiError') {
            vu.sop.audio.play('vu.sop.audio.faceComunicationErrorEndOperation');
            await vu.sop.ui.alert(vu.sop.msg.faceComunicationErrorEndOperation)
        } else {
            vu.sop.audio.play('vu.sop.audio.faceError');
            await vu.sop.ui.alert(vu.sop.msg.faceError)
        }
    } else if(e.name === vu.error.FACE_AUTH_ERROR) {
        if (e.message === 'denied') {
            vu.sop.audio.play('vu.sop.audio.cameraDenied');
            await vu.sop.ui.alert(vu.sop.msg.cameraDenied );
        } else if (e.message === 'autoplay') {
            vu.sop.audio.play('vu.sop.audio.cameraAutoplayProtection');
            await vu.sop.ui.alert(vu.sop.msg.cameraAutoplayProtection);
        } else if (e.message === 'faceNoDocFrontImg') {
            vu.sop.audio.play('vu.sop.audio.faceNoDocFrontImg');
            await vu.sop.ui.alert(vu.sop.msg.faceNoDocFrontImg);
        } else if (e.message === 'faceNoSelfieFrontImg') {
            vu.sop.audio.play('vu.sop.audio.faceNoSelfieFrontImg');
            await vu.sop.ui.alert(vu.sop.msg.faceNoSelfieFrontImg);
        } else if (e.message === 'registerApiError') {
            vu.sop.audio.play('vu.sop.audio.faceComunicationErrorRegister');
            await vu.sop.ui.alert(vu.sop.msg.faceComunicationErrorRegister);
        } else if (e.message === 'endOpApiBadScore') {
            vu.sop.audio.play('vu.sop.audio.endOpApiBadScore');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiBadScore);
        } else if (e.message === 'endOpApiDocumentDataError') {
            vu.sop.audio.play('vu.sop.audio.endOpApiDocumentDataError');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiDocumentDataError);
        } else if (e.message === 'endOpApiDocumentBackFrontError') {
            vu.sop.audio.play('vu.sop.audio.endOpApiDocumentBackFrontError');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiDocumentBackFrontError);
        } else if (e.message === 'endOpApiDocumentBarcodeDoNotExist') {
            vu.sop.audio.play('vu.sop.audio.endOpApiDocumentBarcodeDoNotExist');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiDocumentBarcodeDoNotExist);
        } else if (e.message === 'endOpApiDocumentExpired') {
            vu.sop.audio.play('vu.sop.audio.endOpApiDocumentExpired');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiDocumentExpired);
        } else if (e.message === 'endOpApiPersonDataFail') {
            vu.sop.audio.play('vu.sop.audio.endOpApiPersonDataFail');
            await vu.sop.ui.alert(vu.sop.msg.endOpApiPersonDataFail);
        } else if (e.message === 'endOpApiError') {
            vu.sop.audio.play('vu.sop.audio.faceComunicationErrorEndOperation');
            await vu.sop.ui.alert(vu.sop.msg.faceComunicationErrorEndOperation );
        } else if (e.message === 'endOpApiBiometricFail') {
            vu.sop.audio.play('vu.sop.audio.faceNoSelfieFrontImg');
            await vu.sop.ui.alert(vu.sop.msg.faceNoSelfieFrontImg );
        } else if (e.message === 'userNotExist') {
            vu.sop.audio.play('vu.sop.audio.faceErrorUserNotExist');
            await vu.sop.ui.alert(vu.sop.msg.faceErrorUserNotExist)
        } else if (e.message === 'failAuth') {
            vu.sop.audio.play('vu.sop.audio.faceErrorFailAuth');
            await vu.sop.ui.alert(vu.sop.msg.faceErrorFailAuth)
        } else {
            vu.sop.audio.play('vu.sop.audio.faceError');
            await vu.sop.ui.alert(vu.sop.msg.faceError );
        }
    } else if(e.name === vu.error.UPLOAD_DOCUMENT_FRONT_ERROR) {
        if (e.message === 'addFrontApiError') {
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentComunicationError');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentComunicationError)
        } else if (e.message === 'documentPictureNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentPictureNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentPictureNotDetected)
        } else if (e.message === 'documentBarcodeNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentBarcodeNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentBarcodeNotDetected)
        } else if (e.message === 'addFrontApiErrorAntiSpoofing'){
            vu.sop.audio.play('vu.sop.audio.addFrontApiErrorAntiSpoofing');
            await vu.sop.ui.alert(vu.sop.msg.addFrontApiErrorAntiSpoofing)
        } else if (e.message === 'addFrontApiErrorFrontAlreadyExist'){
            vu.sop.audio.play('vu.sop.audio.addFrontApiErrorFrontAlreadyExist');
            await vu.sop.ui.alert(vu.sop.msg.addFrontApiErrorFrontAlreadyExist)
        } else if (e.message === 'smallDocumentImg'){
            vu.sop.audio.play('vu.sop.audio.smallDocumentImg');
            await vu.sop.ui.alert(vu.sop.msg.smallDocumentImg)
        } else if (e.message === 'badImageFormat'){
            vu.sop.audio.play('vu.sop.audio.badImageFormat');
            await vu.sop.ui.alert(vu.sop.msg.badImageFormat)
        } else {
            vu.sop.audio.play('vu.sop.audio.addFrontDocumentError');
            await vu.sop.ui.alert(vu.sop.msg.addFrontDocumentError)
        }
    } else if(e.name === vu.error.UPLOAD_DOCUMENT_BACK_ERROR) {
        if (e.message === 'addBackApiError') {
            vu.sop.audio.play('vu.sop.audio.addBackDocumentComunicationError');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentComunicationError)
        } else if (e.message === 'documentPictureNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addBackDocumentPictureNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentPictureNotDetected)
        } else if (e.message === 'documentBarcodeNotDetected'){
            vu.sop.audio.play('vu.sop.audio.addBackDocumentBarcodeNotDetected');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentBarcodeNotDetected)
        } else if (e.message === 'addBackApiErrorAntiSpoofing'){
            vu.sop.audio.play('vu.sop.audio.addBackApiErrorAntiSpoofing');
            await vu.sop.ui.alert(vu.sop.msg.addBackApiErrorAntiSpoofing)
        } else if (e.message === 'addBackApiErrorFrontAlreadyExist'){
            vu.sop.audio.play('vu.sop.audio.addBackApiErrorFrontAlreadyExist');
            await vu.sop.ui.alert(vu.sop.msg.addBackApiErrorFrontAlreadyExist)
        } else if (e.message === 'smallDocumentImg'){
            vu.sop.audio.play('vu.sop.audio.smallDocumentImg');
            await vu.sop.ui.alert(vu.sop.msg.smallDocumentImg)
        } else if (e.message === 'badImageFormat'){
            vu.sop.audio.play('vu.sop.audio.badImageFormat');
            await vu.sop.ui.alert(vu.sop.msg.badImageFormat)
        } else {
            vu.sop.audio.play('vu.sop.audio.addBackDocumentError');
            await vu.sop.ui.alert(vu.sop.msg.addBackDocumentError)
        }
    } 
}