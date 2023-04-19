if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.sop.audio == "undefined") { vu.sop.audio = function() {} }

 const sonidos = document.getElementById('sonidos');
vu.sop.disableBiometric = false;

vu.sop.operationIdValue = null;
vu.sop.operationGuidValue = null;
vu.sop.userNameValue = null;
vu.sop.lang = 'es';
vu.sop.flipDocumentCamera = 'auto';
vu.sop.barcodeOptional = true;
vu.sop.warmUpDocModelAsync = false;
vu.sop.faceOrientationModelWeights = 'BEST';        // VERYLIGHT LIGHT NORMAL BEST
vu.sop.recordProcess = false;

vu.sop.useTheSameCameraInDocAndFaceInPC = false
vu.sop.useTheSameCameraInDocAndFaceInMobile = false

vu.sop.setCameraOrientationInPC = 'auto'        // auto ( environment for document, user for selfie), environment, user
vu.sop.setCameraOrientationInMobile = 'auto'    // auto ( environment for document, user for selfie), environment, user

vu.sop.setDocumentBackgroudStyleMirror = false

vu.sop.setHEICFileFormatSupport = true
vu.sop.enableSelfieList = false

//------------------------------------------------------------------------------------------------------

vu.sop.preCacheFaceModelPromise = false;
vu.sop.HEICFileFormatSupportLibLoad = false;
vu.sop.load = async function(basePath) {
    try {
        if (vu.sop.setHEICFileFormatSupport) {
            vu.sop.HEICFileFormatSupportLibLoad = vu.sop.loadJs(basePath + '/js/libs/heic2any/heic2any.min.js');
        }

        let htmlLoad =  vu.sop.loadHtml(basePath + '/html/onboarding.html');
        let webRTCadapter =  vu.sop.loadJs(basePath + '/js/libs/webrtc/adapter-latest.js');
        let msgs =  vu.sop.loadJs(basePath + '/js/vu.sop.msg.'+ vu.sop.lang +'.js');
        let errors =  vu.sop.loadJs(basePath + '/js/vu.error.js');

        let tfJsLoad =  vu.sop.loadJs(basePath + '/js/libs/tensorflowjs/3.11.0/tf.min.js');
        await tfJsLoad;

        let tfJsWasmLoad =  vu.sop.loadJs(basePath + '/js/libs/tensorflowjs/3.11.0/tf-backend-wasm.min.js');

        await tfJsWasmLoad;
        await msgs;
        await errors;

        // Fill HTML Load
        document.getElementById('vu.sop').innerHTML = await htmlLoad;
        /*****************************************************************/

        if ( vu.sop.useGestures ) {
            vu.face.nncPath = basePath + '/js/libs/face/';
            if (vu.sop.preCacheFaceModelAsync) {
                console.log("Pre Cache Face Model - Enabled");
                vu.sop.preCacheFaceModelPromise = vu.sop.loadHtml(vu.face.nncPath + '/jeelizFaceTransferNNC.json');
            }
        } else {
            console.log('Challenge orientation model', vu.sop.faceOrientationModelWeights)
            if ( vu.sop.faceOrientationModelWeights == 'VERYLIGHT' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_VERYLIGHT_0.json';
            } else if ( vu.sop.faceOrientationModelWeights == 'LIGHT' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_DEFAULT.json';
            } else if ( vu.sop.faceOrientationModelWeights == 'NORMAL' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_LIGHT_0.json';
            }  else  {
                vu.face.nncPath = basePath + '/js/libs/face/NN_WIDEANGLES_0.json';
            }

            if (vu.sop.preCacheFaceModelAsync) {
                console.log("Pre Cache Face Model - Enabled");
                vu.sop.preCacheFaceModelPromise = vu.sop.loadHtml( vu.face.nncPath );
            }
        }
        if ( vu.sop.audio.enabled == false ) {
            console.log("Audio Load is disabled by conf");
            loadAudioLang = false
        } else {
            console.log("Audio Load is enabled by conf");
            loadAudioLang = true
        }
        if (loadAudioLang) {
            audioLangLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.audio.'+ vu.sop.lang +'.js');
        }
        let audioLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.audio.js');
        let cameraLoad =  vu.sop.loadJs(basePath + '/js/vu.camera.js');
        let blurDetectionLoad =  vu.sop.loadJs(basePath + '/js/libs/inspector-bokeh/dist/measure_blur.js');
        let picoLoad =  vu.sop.loadJs(basePath + '/js/libs/pico/pico.js');
        let documentLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.document.objectDetection.js');
        let apiLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.api.js');
        let sopUILoad =  vu.sop.loadJs(basePath + '/js/vu.sop.ui.js');
        let documentFaceLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.document.face.js');
        let documentUiLoad =  vu.sop.loadJs(basePath + '/js/vu.sop.document.ui.js');
        let imageLib =  vu.sop.loadJs(basePath + '/js/vu.image.js');
        let screenCapture =  vu.sop.loadJs(basePath + '/js/vu.screen.capture.js');
        let h264 =  vu.sop.loadJs(basePath + '/js/libs/h264-mp4-encoder/h264-mp4-encoder.web.js');
        let htm2canvas =  vu.sop.loadJs(basePath + '/js/libs/html2canvas/html2canvas.min.js');

        if (vu.sop.useGestures == true) {
            console.log('Loading challenge gestures')
            faceLoad =  vu.sop.loadJs(basePath + '/js/vu.face.gestures.js');
            faceUiGesturesLoad =  vu.sop.loadJs(basePath + '/js/vu.face.ui.gestures.js');
            faceLibLoad = vu.sop.loadJs(basePath + '/js/libs/face/jeelizFaceTransfer.js');
        } else if (vu.sop.useGestures == 'mixedChallenge'){
            console.log('Loading mixedChallenge mode')
            faceLoad =  vu.sop.loadJs(basePath + '/js/vu.face.mixedChallenge.js');
            faceObjectDetection =  vu.sop.loadJs(basePath + '/js/vu.sop.face.objectDetectionAndRotation.js');
            faceDirectionGesturesDetection =  vu.sop.loadJs(basePath + '/js/vu.sop.face.model.directionsAndGestures.js');
            faceMixedChallengeUi =  vu.sop.loadJs(basePath + '/js/vu.face.ui.mixedChallenge.js');
        } else {
            console.log('Loading challenge orientation')
            faceLoad =  vu.sop.loadJs(basePath + '/js/vu.face.orientation.js');
            faceLibLoad = vu.sop.loadJs(basePath + '/js/libs/face/jeelizFaceFilter.js');
        }

        faceUiLoad =  vu.sop.loadJs(basePath + '/js/vu.face.ui.js');
        //let faceUiGesturesLoad =  vu.sop.loadJs(basePath + '/js/vu.face.ui.gestures.js');
        let faceAuth =  vu.sop.loadJs(basePath + '/js/vu.face.auth.js');

        await webRTCadapter;
        await cameraLoad;
        await blurDetectionLoad;
        await picoLoad;
        await apiLoad;
        await sopUILoad;
        await documentLoad;
        await documentFaceLoad;
        await documentUiLoad;
        await faceAuth;
        await audioLoad;
        await faceUiLoad;
        await imageLib;
        await screenCapture;
        await h264;
        await htm2canvas;

        if (vu.sop.useGestures == true) {
            await faceUiGesturesLoad;
            await faceLoad;
            await faceLibLoad;
        } else if (vu.sop.useGestures == 'mixedChallenge') {
            await faceLoad;
            await faceObjectDetection;
            await faceDirectionGesturesDetection;
            await faceMixedChallengeUi;
        } else {
            await faceLoad;
            await faceUiLoad;
            await faceLibLoad;
        }

        if (loadAudioLang) {
            await audioLangLoad;
        }


        vu.sop.document.objectDetection.modelURL = basePath + '/js/models/document/model.json';
        vu.sop.document.face.cascadeUrl = basePath + '/js/libs/pico/facefinder.txt';

        document.getElementById('vu.sop.ui.userName').placeholder = vu.sop.msg.userInputPlaceholder
        document.getElementById('vu.sop.ui.userNameSendBtn').innerHTML = vu.sop.msg.userSendBtn

        vu.sop.ui.bottomTextBackGroundColor("rgba(0, 0, 0, 0.4)");
        await vu.sop.createLoadingImg();

    } catch (e) {
        console.log('Network Loading Error')
        console.log(e)
        throw new Error('NETWORK_ERROR');
    };

    try {
        if (!vu.sop.ui.isDeviceCompatible()) {
            throw new Error('deviceNotSupported');
        }

        vu.sop.ui.isBrowserCompatible();

        if(!vu.sop.ui.isSOCompatible()){
           throw new Error('osOldVersion');
        }

    } catch (e) {
        console.log(e)
        vu.sop.ui.hideWhiteLoading();
        vu.error.showError(new vu.error.LoadError(e.message));
        vu.sop.ui.showWhiteLoading()
    };
};


vu.sop.loadJs = function(url) {
    let promise = new Promise(function (resolve, reject) {
        let script = document.createElement('script');
        script.onload = function () {
            resolve(true);
        };
        script.onerror = function () {
            console.log("Error Loading", url)
            reject(true);
        };
        script.src = url;
        document.head.appendChild(script); //or something of the likes
    });
    return promise;
};


vu.sop.loadHtml = function(url) {
    let promise = new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const resp = xhr.responseText;
                    resolve(resp);
                } else {
                    const resp = xhr.responseText;
                    reject(resp);
                }
            } else {
                //console.log("xhr processing going on");
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    });
    return promise;
};

vu.sop.getBase64  = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = function(evt){
        fileFormat = file.name.substr(file.name.lastIndexOf('.') + 1).toUpperCase()
        console.log("Formato de la imagen:",fileFormat)
        supportedFormats = ['JPG', 'JPEG', 'PNG', 'WEBP', 'AV1']
        // HEIC Support
        if (vu.sop.setHEICFileFormatSupport) { supportedFormats.push('HEIC') }

        if (!supportedFormats.includes(fileFormat)) {
            reject(new Error('badImageFormat'))
        }
        img = new Image();
        if ( fileFormat == 'HEIC') {
            vu.sop.HEICFileFormatSupportLibLoad.then(function () {
                heic2any({
                    blob: file,
                    toType: "image/jpeg",
                }).then(function (resultBlob) {
                    url = URL.createObjectURL(resultBlob);
                    img.src = url;
                })
                .catch(function (x) {
                    reject(new Error('badImageFormat'))
                });
            }).catch(function (x) {
                reject(new Error('badImageFormat'))
            });
        } else {
            img.src = evt.target.result;
        }

        img.onload = function() {
            maxSize = 1990
            minSize = 720

            if (img.height < minSize || img.width < minSize ){
                reject(new Error('smallDocumentImg'))
            } else if (maxSize > img.height && maxSize > img.width ) {
                canvas = document.createElement('canvas');
                canvas.height = img.height;
                canvas.width = img.width;
                ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, img.width, img.height);
                result = canvas.toDataURL("image/jpeg", 0.9);
                resolve(result)
            } else {
                canvas = document.createElement('canvas');
                if (img.height > img.width) {
                    newHeight = maxSize
                    newWidth = Math.round((img.width * maxSize) / img.height)
                } else {
                    newHeight = Math.round((img.height * maxSize) / img.width)
                    newWidth = maxSize
                }
                console.log('Upload Img Resize from' , img.width, img.height, ' to ', newWidth, newHeight)
                canvas.height = newHeight;
                canvas.width = newWidth;
                ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                result = canvas.toDataURL("image/jpeg", 0.9);
                resolve(result)
            }
        }
    }
    //reader.onerror = error => reject(new Error('badImageFormat'));
    reader.onerror = function(evt){
        console.log('onerror', evt)
        reject(new Error('badImageFormat'));
    }
  });
};

vu.sop.videoResizeObserverAction = function(){
    if (document.getElementById('vu.sop.ui.video') !== null) {
        if (vu.sop.videoResizeRules == 'doc') {
            console.log('Video element change, applying styles: doc')
            vid = document.getElementById('vu.sop.ui.video')
            if (window.innerHeight > window.innerWidth) {
                // Si la pantalla esta en vertical
                if (vu.camera.isVerticalVideo()) {
                    // Si el video esta en vertical
                    if (vu.sop.videoResizeStyleFillContainer) {
                        console.log('Rules doc - Vertical Screen - Vertical video - fill yes')
                        vid.style.maxWidth = "inherit";
                        vid.style.maxHeight = "fit-content";
                        vid.style.width = "auto";
                        vid.style.height = "auto";
                    } else {
                        console.log('Rules doc - Vertical Screen - Vertical video - fill no')
                        vid.style.maxWidth = "100%";
                        vid.style.maxHeight = "inherit";
                        vid.style.width = "auto";
                        vid.style.height = "auto";
                    }
                } else {
                    if (vu.sop.videoResizeStyleFillContainer) {
                        console.log('Rules doc - Vertical Screen - Horizontal video - fill yes')
                        vid.style.maxWidth = "fit-content";
                        vid.style.maxHeight = "inherit";
                        vid.style.width = "auto";
                        vid.style.height = "auto";
                    } else {
                        console.log('Rules doc - Vertical Screen - Horizontal video - fill no')
                        vid.style.maxWidth = "100%";
                        vid.style.maxHeight = "inherit";
                        vid.style.width = "auto";
                        vid.style.height = "auto";
                    }
                }
            } else {
                if (vu.sop.videoResizeStyleFillContainer){
                    console.log('Rules doc - Horizontal Screen - Horizontal video - fill yes')
                    vid.style.maxWidth = "fit-content";
                    vid.style.maxHeight = "inherit";
                    vid.style.width = "auto";
                    vid.style.height = "auto";
                } else {
                    console.log('Rules doc - Horizontal Screen - Horizontal video - fill no')
                    // Si la pantalla esta en horizontal
                    vid.style.maxHeight = "100%";
                    vid.style.maxWidth = "100%";
                    vid.style.width = "auto";
                    vid.style.height = "auto";
                }
            }
            bg = document.getElementById('vu.sop.document.ui.background')
            bg.style.maxWidth = vu.camera.video.offsetWidth + "px";
            //bg.style.maxHeight = vu.camera.video.offsetHeight + "px";
        }
        if (vu.sop.videoResizeRules == 'face') {
            console.log('Video element change, applying styles: face')
            vid = document.getElementById('vu.sop.ui.video')
            vidContainer = document.getElementById("vu.sop.ui.videoContainer")

            if (window.innerHeight > window.innerWidth) {
                // Si la pantalla esta en vertical
                if (vu.camera.isVerticalVideo()) {
                    if (vu.sop.videoResizeStyleFillContainer) {
                        //alert('Rules face - Vertical Screen - Vertical video - fill yes')
                        console.log('Rules face - Vertical Screen - Vertical video - fill yes')
                        // Si el video esta en vertical
                        vid.style.maxWidth = "100%";
                        vid.style.maxHeight = "none";
                        vid.style.width = "100%";
                        vid.style.height = "auto";
                    } else {
                        //alert('Rules face - Vertical Screen - Vertical video - fill no')
                        console.log('Rules face - Vertical Screen - Vertical video - fill no')
                        // Si el video esta en vertical
                        vid.style.maxWidth = "100%";
                        vid.style.maxHeight = "inherit";
                        vid.style.width = "100%";
                        vid.style.height = "auto";
                    }
                } else {
                    if (vu.sop.videoResizeStyleFillContainer) {
                        // Si el video esta en horizontal
                        proportionVideo = vid.offsetHeight / vid.offsetWidth
                        proportionContainer = vidContainer.offsetHeight / vidContainer.offsetWidth

                        if ( proportionVideo < proportionContainer) {
                            console.log('Rules face - Vertical Screen - Horizontal video - fill yes - 1')
                            vid.style.maxWidth = "fit-content";
                            vid.style.maxHeight = "100%";
                            vid.style.width = "auto";
                            vid.style.height = "100%";
                        } else {
                            console.log('Rules face - Vertical Screen - Horizontal video - fill yes - 2')
                            vid.style.maxWidth = "100%";
                            vid.style.maxHeight = "fit-content";
                            vid.style.width = "100%";
                            vid.style.height = "auto";
                        }
                    } else {
                        console.log('Rules face - Vertical Screen - Horizontal video - fill no')
                        // Si el video esta en horizontal
                        vid.style.maxWidth = "inherit";
                        vid.style.maxHeight = "100%";
                        vid.style.width = "auto";
                        vid.style.height = "100%";
                    }
                }
            } else {
                // Si la pantalla esta en horizontal
                if (vu.camera.isVerticalVideo()) {
                    console.log('Rules face - Horizontal Screen - Vertical video - fill no')
                    // Si el video esta en vertical
                    vid.style.maxWidth = "100%";
                    vid.style.maxHeight = "inherit";
                    vid.style.width = "100%";
                    vid.style.height = "auto";
                } else {
                    // Si el video esta en horizontal
                    if (vu.sop.videoResizeStyleFillContainer) {
                        console.log('Rules face - Horizontal Screen - Horizontal video - fill yes')
                        vid.style.maxWidth = "fit-content";
                        vid.style.maxHeight = "100%";
                        vid.style.width = "auto";
                        vid.style.height = "100%";
                    } else {
                        console.log('Rules face - Horizontal Screen - Horizontal video - fill no')
                        vid.style.maxWidth = "inherit";
                        vid.style.maxHeight = "100%";
                        vid.style.width = "auto";
                        vid.style.height = "100%";
                    }
                }
            }
        }
    }

}

vu.sop.videoResizeRules = 'doc'
vu.sop.videoResizeStyleFillContainer = false
vu.sop.videoResizeObserver = new ResizeObserver(entries => {
    vu.sop.videoResizeObserverAction();
    setTimeout(vu.sop.videoResizeObserverAction, 100);
    setTimeout(vu.sop.videoResizeObserverAction, 500);
    setTimeout(vu.sop.videoResizeObserverAction, 1000);
});

//------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------------

if (typeof vu.sop.steps == "undefined") { vu.sop.steps = function() {} }

if (typeof vu.sop.screenRecorder == "undefined") { vu.sop.screenRecorder = function() {} }

vu.sop.screenRecorder.recorder;
vu.sop.screenRecorder.stream;

vu.sop.screenRecorder.sendVideo = false;
vu.sop.screenRecorder.videoReady = false;
vu.sop.screenRecorder.completeBlob;

vu.sop.startRecording = async function() {
    if(vu.sop.recordProcess === true) {
        if (vu.sop.ui.isMobile()) {
            vu.screen.capture.recordVideoStart();
        } else {
            // TODO - Mover screenRecorder a vu.screen.capture
            try {
                vu.sop.screenRecorder.stream = await navigator.mediaDevices.getDisplayMedia({
                    video: {mediaSource: "screen"}
                });
                vu.sop.screenRecorder.recorder = new MediaRecorder(vu.sop.screenRecorder.stream);
                const chunks = [];
                vu.sop.screenRecorder.recorder.ondataavailable = e => chunks.push(e.data);
                vu.sop.screenRecorder.recorder.onstop = e => {
                    try {
                        let videoType = chunks[0].type.split(';')[0];
                        vu.sop.screenRecorder.completeBlob = new Blob(chunks, { 'type' : 'video/mp4' });
                        vu.sop.screenRecorder.videoReady = true;
                    } catch (e) {
                        console.log("Video Stop");
                    }
                };
                vu.sop.screenRecorder.recorder.start();
            } catch (e) {
                console.log("video record error:", e)
                await vu.sop.ui.hideWhiteLoading()
                await vu.error.showError(new vu.error.UserError('startRecordingFail'));
                throw e;
            }
        }
    }
}

vu.sop.stopRecording = async function() {
    if (vu.sop.ui.isMobile()) {
        try {
            if (vu.screen.capture.doCaptureLoop) {
                return vu.screen.capture.recordVideoStop()
            } else {
                console.log("No Screen record active")
            }
        } catch(e){
            console.log("No Screen record active")
        }
    } else {
        // TODO - Mover screenRecorder a vu.screen.capture
        if( vu.sop.screenRecorder.sendVideo === false) {
            try {
                vu.sop.screenRecorder.stream.getTracks().forEach(track => {
                    track.stop();
                });
            } catch(e){
                console.log("No Screen record active")
            }
        }
        if(vu.sop.recordProcess === true) {
            if(vu.sop.screenRecorder.recorder !== undefined) {
                if(vu.sop.screenRecorder.recorder.state != "inactive") {
                    vu.sop.screenRecorder.recorder.stop();
                    vu.sop.screenRecorder.stream.getVideoTracks()[0].stop();
                    if( vu.sop.screenRecorder.sendVideo === true) {
                        while(vu.sop.screenRecorder.videoReady === false) {
                            await vu.sop.ui.sleep('100');
                        }
                        console.log(vu.sop.screenRecorder.completeBlob);
                        return await vu.sop.steps.addVideoResolve(vu.sop.screenRecorder.completeBlob);
                    } else {
                        while(vu.sop.screenRecorder.videoReady === false) {
                            await vu.sop.ui.sleep('100');
                        }
                        return vu.sop.screenRecorder.completeBlob;
                    }
                }
            }
        }
    }
}



//------------------------------------------------------------------------------------------------------
vu.sop.start = async function() {
    // Prepara la camara y librerias para userInput() document()
    await vu.sop.steps.loadLibsAndCamera();
    if (vu.sop.userNameValue == null) {
        // Pantalla de ingreso de usuario
        await vu.sop.steps.userInput();
    } else {
        // Saltamos la pantalla de ingreso del usuario
        await vu.sop.ui.user.doPreSetUser(vu.sop.userNameValue);
    }

    try {
        // Pantallas para subir los documentos
        //await vu.sop.steps.document();
        // Prepara la camara y librerias para authFace()

        await vu.sop.steps.loadLibsAndCameraFace();
        // Graba el proceso de prueba de vida
        await vu.sop.startRecording();
        // Pantalla de autenticacion
        return await vu.sop.steps.authFace()

    } catch (e) {
        vu.sop.screenRecorder.sendVideo = false;
        await vu.sop.stopRecording();
        return new Error(e.message)
    };
};

vu.sop.steps.documentPromiseResolve = null;
vu.sop.steps.documentPromiseReject = null;

vu.sop.steps.document = async function() {
    let promise = new Promise(function (resolve, reject) {
        vu.sop.steps.documentPromiseResolve = resolve;
        vu.sop.steps.documentPromiseReject = reject;
        vu.sop.ui.show("vu.sop.ui.documentSelectUploadMethod");
        let divContainer = vu.sop.ui.documentSelectUploadMethodDraw("vu.sop.steps.takePictureDocument()", "vu.sop.steps.uploadFrontDocumentPicture()");
        document.getElementById("vu.sop.ui.documentSelectUploadMethod").appendChild(divContainer);
        vu.sop.audio.play('vu.sop.audio.addDocumentBottomText');
        vu.sop.ui.showBottomText(vu.sop.msg.addDocumentBottomText)
    });
    return promise;
}

vu.sop.steps.takePictureDocument = async function() {
    vu.sop.ui.hide("vu.sop.ui.documentSelectUploadMethod");
    vu.sop.ui.hideBottomText();
    await vu.sop.steps.takePictureDocumentFront();
    await vu.sop.steps.takePictureDocumentBack();
    vu.sop.steps.documentPromiseResolve(true)
};

vu.sop.steps.uploadFrontDocumentPicture = async function() {
    vu.sop.ui.hide("vu.sop.ui.documentSelectUploadMethod");
    vu.sop.ui.hideBottomText();
    vu.sop.ui.show("vu.sop.ui.documentFileUploadFront");
    let divContainer = vu.sop.ui.documentFileUploadFrontDraw();
    document.getElementById("vu.sop.ui.documentFileUploadFront").appendChild(divContainer);
    vu.sop.audio.play('vu.sop.audio.addFrontDocumentBottomMsg');
    vu.sop.ui.showBottomText(vu.sop.msg.addFrontDocumentFileUploadBottomMsg);
    //vu.sop.steps.documentPromiseResolve(true)
};

vu.sop.steps.uploadFrontDocumentPictureResolve = async function(file) {
    while (true) {
        try {
            console.log(file);
            // Show faceLoad
            if (file.length < 1){
                break
            }
            frontDocumentImg = await vu.sop.getBase64(file[0]);
            vu.sop.ui.addFrontImg = frontDocumentImg;
            await vu.sop.ui.showWhiteLoading();
            response = await vu.sop.api.addFront(vu.sop.userNameValue,
                vu.sop.operationIdValue,
                vu.sop.operationGuidValue,
                frontDocumentImg);
            if (response.code != 909) {
                if (response.code === 910 || response.code === 9091 || response.code === 9097) {
                    throw new Error('addFrontApiErrorAntiSpoofing')
                } else if (response.code === 911) {
                    throw new Error('addFrontApiErrorFrontAlreadyExist')
                } else {
                    throw new Error('addFrontApiError')
                }
            }
            console.log(response)

            vu.sop.ui.addFrontResponse = response
            if ("addBackRequired" in response) {
                if (response.addBackRequired){
                    console.log("addBack is Required")
                    vu.sop.addBackRequired = response.addBackRequired;
                }
            }
            if ("addDocumentPictureRequired" in response) {
                if (response.addDocumentPictureRequired) {
                    console.log("addDocumentPicture is Required")
                    if (!response.documentPictureDetected) {
                        face = await vu.sop.document.face.do(vu.sop.ui.addFrontImg)
                        if ( face !== null) {
                            response = await vu.sop.api.addDocumentImage(vu.sop.userNameValue,
                                                                         vu.sop.operationIdValue,
                                                                         vu.sop.operationGuidValue,
                                                                         face);
                            console.log("face Resp",response)
                            if (response.code != 938) {
                                throw new Error('documentPictureNotDetected')
                            }
                        } else {
                            throw new Error('documentPictureNotDetected')
                        }
                    }
                }
            }
            if (vu.sop.barcodeOptional === false) {
                if ("containsBarcode" in response) {
                    if (response.containsBarcode) {
                        console.log("barcode is Required")
                        if (!response.barcodeDetected) {
                            throw new Error('documentBarcodeNotDetected')
                        }
                    }
                }
            }
            await vu.sop.ui.hideWhiteLoading();
            if (vu.sop.addBackRequired) {
                await vu.sop.steps.uploadBackDocumentPicture();
            } else {
                vu.sop.steps.documentPromiseResolve(true);
                await vu.sop.ui.hideWhiteLoading()
                vu.sop.ui.hide("vu.sop.ui.documentFileUploadFront");
                vu.sop.ui.hideBottomText();
            }
            break
        } catch (e) {
            document.getElementById('documentFileUploadFrontInput').value = null;
            //document.getElementById('documentFileUploadBackInput').value = null;

            await vu.sop.ui.hideWhiteLoading()
            console.log('vu.sop.ui.addFront', e)
            await vu.error.showError(new vu.error.UploadDocumentFrontError(e.message));

        }
    }
};

vu.sop.steps.uploadBackDocumentPicture = async function() {
    vu.sop.ui.hide("vu.sop.ui.documentFileUploadFront");
    vu.sop.ui.hideBottomText();
    vu.sop.ui.show("vu.sop.ui.documentFileUploadBack");
    let divContainer = vu.sop.ui.documentFileUploadBackDraw();
    document.getElementById("vu.sop.ui.documentFileUploadBack").appendChild(divContainer);
    vu.sop.audio.play('vu.sop.audio.addBackDocumentFileUploadBottomMsg');
    vu.sop.ui.showBottomText(vu.sop.msg.addBackDocumentFileUploadBottomMsg);
    //vu.sop.steps.documentPromiseResolve(true)
};


vu.sop.steps.uploadBackDocumentPictureResolve = async function(file) {
    while (true) {
        try {
            // Show faceLoad
            if (file.length < 1){
                break
            }
            backDocumentImg = await vu.sop.getBase64(file[0]);
            vu.sop.ui.addBackImg = backDocumentImg;
            await vu.sop.ui.showWhiteLoading()
            response = await vu.sop.api.addBack(vu.sop.userNameValue,
                vu.sop.operationIdValue,
                vu.sop.operationGuidValue,
                backDocumentImg);
            if (response.code != 912) {
                if (response.code === 913 || response.code === 9094 || response.code === 10200 ) {
                    throw new Error('addBackApiErrorAntiSpoofing')
                } else if (response.code === 914) {
                    throw new Error('addBackApiErrorFrontAlreadyExist')
                } else {
                    throw new Error('addBackApiError')
                }
            }

            if ("addDocumentPictureRequired" in response) {
                if (response.addDocumentPictureRequired){
                    console.log("addDocumentPicture is Required")
                    if(!response.documentPictureDetected) {
                        throw new Error('documentPictureNotDetected')
                    }
                }
            }
            if ( vu.sop.barcodeOptional === false ) {
                if (vu.sop.barcodeOptional === false) {
                    if ("containsBarcode" in response) {
                        if (response.containsBarcode) {
                            console.log("barcode is Required")
                            if (!response.barcodeDetected) {
                                throw new Error('documentBarcodeNotDetected')
                            }
                        }
                    }
                }
            }
            console.log(response)
            vu.sop.steps.documentPromiseResolve(true);
            await vu.sop.ui.hideWhiteLoading()
            vu.sop.ui.hide("vu.sop.ui.documentFileUploadBack");
            vu.sop.ui.hideBottomText();
            break
        } catch (e) {
            document.getElementById('documentFileUploadFrontInput').value = null;
            document.getElementById('documentFileUploadBackInput').value = null;
            await vu.sop.ui.hideWhiteLoading()
            console.log('vu.sop.ui.addBack', e)
            await vu.error.showError(new vu.error.UploadDocumentBackError(e.message));
        }
    }
};



// --------------------------------------------------------------------------------------------------

vu.sop.docObjectModelLoad = false;
vu.sop.docHaarLoad = false;
vu.sop.steps.loadLibsAndCamera = async function() {


    if ( vu.sop.warmUpDocModelAsync ) {
        // Load network
        vu.sop.docObjectModelLoad = vu.sop.document.objectDetection.loadModel();
        // Load HAAR
        vu.sop.docHaarLoad  = vu.sop.document.face.preLoad()
    } else {
        // Load network
        objectDetectionLoadPromise = await vu.sop.document.objectDetection.loadModel();
        // Load HAAR
        haarLoadPromise = await vu.sop.document.face.preLoad()
    }

    while (true) {
        try {
            await vu.sop.ui.showWhiteLoading();
            if (vu.sop.ui.isMobile()) {
                if (vu.sop.setCameraOrientationInMobile === 'auto') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'environment') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'user') {
                    vu.camera.config.orientation = 'user'
                }
            } else {
                if (vu.sop.setCameraOrientationInPC === 'auto') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'environment') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'user') {
                    vu.camera.config.orientation = 'user'
                }
            }

            vu.camera.config.previewResolution = 'highest'
            vu.camera.config.pictureResolution = 'highest'
            vu.camera.config.pictureForceLandscape = true;
            vu.camera.config.pictureForceLandscapeRotateClockwise = false;
            vu.camera.config.pictureFlash = true;
            vu.camera.config.pictureLessBlurry = false
            await vu.camera.start("vu.sop.ui.video");
            //vu.camera.setZoom(1.3)
            //vu.camera.setSharpness('lowest')
            //brightness = vu.camera.setBrightness('medium')

            if (vu.sop.flipDocumentCamera === 'auto') {
                if (vu.sop.ui.isMobile()) {
                    console.log('Flip Document configured to auto. Is mobile, mirroring screen')
                    vu.sop.ui.keepVideoHorizontal(vu.camera.video)
                }
            } else if (vu.sop.flipDocumentCamera) {
                console.log('Flip Document configured to true, mirroring screen')
                vu.sop.ui.flipVideoHorizontal(vu.camera.video)
            }

            vu.sop.videoResizeRules = 'doc'
            vu.sop.videoResizeObserver.observe(document.getElementById('vu.sop.ui.videoContainer'));

            if (vu.sop.setDocumentBackgroudStyleMirror) {
                vu.sop.ui.showMirrorBackground()
            }

            break
        } catch (e) {
            await vu.sop.ui.hideWhiteLoading();
            console.log(e)
            await vu.error.showError(new vu.error.CameraError(e.message));
        }
    }
    // End Load Model
    //await objectDetectionLoadPromise;
    // Load HAAR
    //await haarLoadPromise;
}



vu.sop.steps.userInput = async function() {
    // ----------------------------------------
    // User Screen - SOP newOperation
    await vu.sop.ui.hideWhiteLoading()
    while (true){
        try {
            if (vu.sop.audio.enabled) {
                await vu.sop.ui.showBottomText(vu.sop.msg.userPleaseEnableAudio);
            }
            await vu.sop.ui.user.start();
            if (vu.sop.audio.enabled) {
                await vu.sop.ui.hideBottomText();
            }
            break
        } catch (e) {
            console.log('vu.sop.ui.user',e);
            await vu.error.showError(new vu.error.UserError(e));

        };
    };
};

vu.sop.steps.addVideoResolve = async function(video) {
        await vu.sop.ui.showWhiteLoading();
        response = await vu.sop.api.addVideo(vu.sop.userNameValue,
            vu.sop.operationIdValue,
            vu.sop.operationGuidValue,
            video);

        console.log('add video respo: ',response)
        await vu.sop.ui.hideWhiteLoading();
        return response;
};



vu.sop.steps.takePictureDocumentFront = async function() {
    // ----------------------------------------
    // Document Front - SOP addFront
    //
    await vu.sop.ui.showLoading()

    if ( vu.sop.warmUpDocModelAsync ) {
        await vu.sop.docObjectModelLoad;
        await vu.sop.docHaarLoad;
    }

    // TODO mejorar esto, dirty fix
    vu.sop.document.ui.bgElement = document.getElementById('vu.sop.document.ui.background')
    vu.sop.document.ui.bgElement.style.backgroundImage = vu.sop.document.ui.bgInactive;
    vu.sop.ui.show("vu.sop.document.ui.background");
    vu.sop.audio.play('vu.sop.audio.addFrontDocumentBottomMsg');
    vu.sop.ui.showBottomText(vu.sop.msg.addFrontDocumentBottomMsg)
    await vu.sop.ui.sleep(50)
    var start = new Date();
    console.log('Warming Up Start')
    await vu.sop.document.objectDetection.predictAsync(vu.camera.video)
    var end  = new Date();
    var time = end.getTime() - start.getTime();
    console.log('Warming Up End - Time', time, 'ms')
    await vu.sop.ui.hideLoading()
    while (true) {
        try {
            // Show faceLoad
            frontDocumentImg = await vu.sop.document.ui.start('front');
            vu.sop.ui.addFrontImg = frontDocumentImg
            await vu.sop.ui.showLoading()
            response = await vu.sop.api.addFront(vu.sop.userNameValue,
                vu.sop.operationIdValue,
                vu.sop.operationGuidValue,
                frontDocumentImg);

            if (response.code != 909) {
                if (response.code === 910 || response.code === 9091 || response.code === 9112) {
                    throw new Error('addFrontApiErrorAntiSpoofing')
                } else if (response.code === 911) {
                    throw new Error('addFrontApiErrorFrontAlreadyExist')
                } else {
                    throw new Error('addFrontApiError')
                }
            }
            console.log(response)

            vu.sop.ui.addFrontResponse = response
            if ("addBackRequired" in response) {
                if (response.addBackRequired) {
                    console.log("addBack is Required")
                    vu.sop.addBackRequired = response.addBackRequired;
                }
            }
            if ("addDocumentPictureRequired" in response) {
                if (response.addDocumentPictureRequired) {
                    console.log("addDocumentPicture is Required")
                    if (!response.documentPictureDetected) {
                        face = await vu.sop.document.face.do(vu.sop.ui.addFrontImg)
                        if ( face !== null) {
                            response = await vu.sop.api.addDocumentImage(vu.sop.userNameValue,
                                                                         vu.sop.operationIdValue,
                                                                         vu.sop.operationGuidValue,
                                                                         face);
                            console.log("face Resp",response)
                            if (response.code != 938) {
                                throw new Error('documentPictureNotDetected')
                            }
                        } else {
                            throw new Error('documentPictureNotDetected')
                        }
                    }
                }
            }
            if ( vu.sop.barcodeOptional === false ) {
                if ("containsBarcode" in response) {
                    if (response.containsBarcode){
                        console.log("barcode is Required")
                        if(!response.barcodeDetected) {
                            throw new Error('documentBarcodeNotDetected')
                        }
                    }
                }
            }
            await vu.sop.ui.hideLoading()
            break
        } catch (e) {
            await vu.sop.ui.hideLoading()
            console.log('vu.sop.ui.addFront', e);
            await vu.error.showError(new vu.error.TakeDocumentFrontError(e.message));

        }
    }
    return true;
};

vu.sop.steps.takePictureDocumentBack = async function() {
    // ----------------------------------------
    // Document Back - SOP addBack
    //
    if (vu.sop.addBackRequired) {
        while (true) {
            try {
                backDocumentImg = await vu.sop.document.ui.start('back');
                vu.sop.ui.addBackImg = backDocumentImg;
                vu.sop.audio.play('vu.sop.audio.audioBeep');

                await vu.sop.ui.showLoading()
                response = await vu.sop.api.addBack(vu.sop.userNameValue,
                    vu.sop.operationIdValue,
                    vu.sop.operationGuidValue,
                    backDocumentImg);

                if (response.code != 912) {
                    if (response.code === 913 || response.code === 9094) {
                        throw new Error('addBackApiErrorAntiSpoofing')
                    } else if (response.code === 914) {
                        throw new Error('addBackApiErrorFrontAlreadyExist')
                    } else {
                        throw new Error('addBackApiError')
                    }
                }

                if ("addDocumentPictureRequired" in response) {
                    if (response.addDocumentPictureRequired) {
                        console.log("addDocumentPicture is Required")
                        if (!response.documentPictureDetected) {
                            throw new Error('documentPictureNotDetected')
                        }
                    }
                }
                if ( vu.sop.barcodeOptional === false ) {
                    if ("containsBarcode" in response) {
                        if (response.containsBarcode) {
                            console.log("barcode is Required")
                            if(!response.barcodeDetected) {
                                throw new Error('documentBarcodeNotDetected')
                            }
                        }
                    }
                }
                console.log(response)
                await vu.sop.ui.hideLoading()
                break
            } catch (e) {
                await vu.sop.ui.hideLoading()
                console.log('vu.sop.ui.addBack', e);
                await vu.error.showError(new vu.error.TakeDocumentBackError(e.message));
            }
        }
    }
    return true;
};

vu.sop.faceModelLoad = false;
vu.sop.steps.loadLibsAndCameraFace = async function() {

   while (true) {
        if (vu.sop.disableBiometric) { break }
        try {
            await vu.sop.ui.showLoading();
            if (vu.sop.setDocumentBackgroudStyleMirror) {
                vu.sop.ui.hideMirrorBackground()
            }
            vu.sop.videoResizeRules = 'face'
            vu.sop.videoResizeObserver.disconnect()
            vu.sop.videoResizeObserver.observe(document.getElementById('vu.sop.ui.videoContainer'));

            //vu.camera.setSharpness('lowest')
            //vu.camera.setZoom(1)
            //await faceLoadPromise;

            if (vu.sop.ui.isMobile()){
                if (vu.sop.setCameraOrientationInMobile === 'auto') {
                    vu.camera.config.orientation = 'user'
                } else if (vu.sop.setCameraOrientationInMobile === 'environment') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'user') {
                    vu.camera.config.orientation = 'user'
                }
                if (!vu.sop.useTheSameCameraInDocAndFaceInMobile) {
                    vu.camera.config.previewResolution = 'lowest'
                    vu.camera.config.pictureResolution = 'lowest'
                    vu.camera.config.pictureForceLandscape = false;
                    vu.camera.config.pictureFlash = false;
                    await vu.camera.start("vu.sop.ui.video");
                }
            } else {
                if (vu.sop.setCameraOrientationInPC === 'auto') {
                    vu.camera.config.orientation = 'user'
                } else if (vu.sop.setCameraOrientationInMobile === 'environment') {
                    vu.camera.config.orientation = 'environment'
                } else if (vu.sop.setCameraOrientationInMobile === 'user') {
                    vu.camera.config.orientation = 'user'
                }
                if (vu.sop.useTheSameCameraInDocAndFaceInPC === false) {
                    vu.camera.config.previewResolution = 'lowest'
                    vu.camera.config.pictureResolution = 'lowest'
                    vu.camera.config.pictureForceLandscape = false;
                    vu.camera.config.pictureFlash = false;
                    await vu.camera.start("vu.sop.ui.video");
                }
            }



            vu.sop.ui.flipVideoHorizontal(vu.camera.video)
            if (vu.sop.preCacheFaceModelAsync) {
                await vu.sop.preCacheFaceModelPromise;
            }
            await vu.face.load(vu.camera.video);
            break
        } catch (e) {
            await vu.sop.ui.hideLoading()
            await vu.error.showError(new vu.error.CameraError(e.message));
        }
   }
};


vu.sop.steps.authFace = async function() {
    // Do face
    while (true) {
        if (vu.sop.disableBiometric) {
            break
        }
        try {
            await vu.sop.ui.hideLoading();
            if (vu.sop.useGestures) {
                await vu.face.ui.gestures.start();
                pictures = await vu.face.ui.gestures.challengeStart();
            } else {
                await vu.face.ui.start();
                pictures = await vu.face.ui.challengeStart();
            }

            await vu.sop.ui.showLoading()
            picture = pictures[pictures.length-1]

            if(vu.sop.enableSelfieList === true){

                 if( vu.face.ui.picturesTags )
                        response = await vu.sop.api.registers(vu.sop.userNameValue,
                        vu.sop.operationIdValue,
                        vu.sop.operationGuidValue,
                        pictures, vu.face.ui.picturesTags);
                    else
                        response = await vu.sop.api.registers(vu.sop.userNameValue,
                            vu.sop.operationIdValue,
                            vu.sop.operationGuidValue,
                            pictures, vu.face.ui.gestures.picturesTags);

                if (response.code != 932) {
                    if (response.code === 935) {
                        throw new Error('faceNoDocFrontImg')
                    } else if (response.code === 936 || response.code === 1921) {
                        throw new Error('faceNoSelfieFrontImg')
                    } else {
                        throw new Error('registerApiError')
                    }
                }
            }else{
                response = await vu.sop.api.register(vu.sop.userNameValue,
                    vu.sop.operationIdValue,
                    vu.sop.operationGuidValue,
                    picture);
                if (response.code != 932) {
                    if (response.code === 935) {
                        throw new Error('faceNoDocFrontImg')
                    } else if (response.code === 936 || response.code === 1921) {
                        throw new Error('faceNoSelfieFrontImg')
                    } else {
                        throw new Error('registerApiError')
                    }
                }
            }

            if(vu.sop.recordProcess === true) {
                //sendVideo = true;
                response = await vu.sop.stopRecording()

                if(!response.includes("2000") || response === undefined ) {
                    console.log("addVideo fail:", response)
                    throw new Error('addVideoFail')
                }
            }

            response = await vu.sop.api.endOperation(vu.sop.userNameValue,
                vu.sop.operationIdValue, vu.sop.operationGuidValue)

            if (response.code != 903) {
                if (response.code === 904) {
                    throw new Error('endOpApiBadScore')
                } else if (response.code === 2001) {
                    throw new Error('endOpApiBiometricFail')
                } else if (response.code === 905) {
                    throw new Error('endOpApiDocumentDataError')
                } else if (response.code === 1907) {
                    throw new Error('endOpApiDocumentBackFrontError')
                } else if (response.code === 1910) {
                    throw new Error('endOpApiDocumentBarcodeDoNotExist')
                } else if (response.code === 1911) {
                    throw new Error('endOpApiDocumentExpired')
                } else if (response.code === 1913) {
                    throw new Error('endOpApiPersonDataFail')
                } else {
                    throw new Error('endOpApiError')
                }
            }

            await vu.sop.ui.hideLoading()
            break
        } catch (e) {
            vu.sop.screenRecorder.sendVideo = false;
            await vu.sop.stopRecording()
            await vu.sop.ui.hideLoading()
            console.log(e)
            await vu.error.showError(new vu.error.FaceAuthError(e.message));
            return new Error(e.message)
        }
    }
    // TODO - Testiar y mejorar
    if (vu.sop.disableBiometric) {
        response = await vu.sop.api.endOperation(vu.sop.userNameValue,
            vu.sop.operationIdValue, vu.sop.operationGuidValue)
        if (response.code != 1907 &&
            response.code != 903) {
            await vu.error.showError(new vu.error.FaceAuthError('faceError'));    
        }
    }
    return response
};

vu.sop.steps.captureSelfie = async function() {
    b64 = [];
    try {
        // Prepara la camara y librerias para reconocimiento
        await vu.sop.steps.loadLibsAndCameraFace();
        
        // Oculta las pantallas de Loading y muestra el video
        await vu.sop.ui.hideWhiteLoading();
        await vu.sop.ui.hideLoading();
        await vu.sop.ui.showVideo();
        
        if (vu.sop.useGestures) {
            await vu.face.ui.gestures.start();
            pictures = await vu.face.ui.gestures.challengeStart();
        } else {
            await vu.face.ui.start();
            pictures = await vu.face.ui.challengeStart();
        }
        
        //Parcea para obtener el base64 limpio
        for(let picture of pictures) {
            b64.push(picture.split(",")[1])
        }      

        //Detiene la camara
        vu.camera.stream.getTracks().forEach(function(track) {
            track.stop();
        });

        return b64;

    } catch (e) {
        throw new Error(e.message)
    };
};

vu.sop.loadingImgSrcDefault = "data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJjb2ciIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1jb2cgZmEtdy0xNiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00ODcuNCAzMTUuN2wtNDIuNi0yNC42YzQuMy0yMy4yIDQuMy00NyAwLTcwLjJsNDIuNi0yNC42YzQuOS0yLjggNy4xLTguNiA1LjUtMTQtMTEuMS0zNS42LTMwLTY3LjgtNTQuNy05NC42LTMuOC00LjEtMTAtNS4xLTE0LjgtMi4zTDM4MC44IDExMGMtMTcuOS0xNS40LTM4LjUtMjcuMy02MC44LTM1LjFWMjUuOGMwLTUuNi0zLjktMTAuNS05LjQtMTEuNy0zNi43LTguMi03NC4zLTcuOC0xMDkuMiAwLTUuNSAxLjItOS40IDYuMS05LjQgMTEuN1Y3NWMtMjIuMiA3LjktNDIuOCAxOS44LTYwLjggMzUuMUw4OC43IDg1LjVjLTQuOS0yLjgtMTEtMS45LTE0LjggMi4zLTI0LjcgMjYuNy00My42IDU4LjktNTQuNyA5NC42LTEuNyA1LjQuNiAxMS4yIDUuNSAxNEw2Ny4zIDIyMWMtNC4zIDIzLjItNC4zIDQ3IDAgNzAuMmwtNDIuNiAyNC42Yy00LjkgMi44LTcuMSA4LjYtNS41IDE0IDExLjEgMzUuNiAzMCA2Ny44IDU0LjcgOTQuNiAzLjggNC4xIDEwIDUuMSAxNC44IDIuM2w0Mi42LTI0LjZjMTcuOSAxNS40IDM4LjUgMjcuMyA2MC44IDM1LjF2NDkuMmMwIDUuNiAzLjkgMTAuNSA5LjQgMTEuNyAzNi43IDguMiA3NC4zIDcuOCAxMDkuMiAwIDUuNS0xLjIgOS40LTYuMSA5LjQtMTEuN3YtNDkuMmMyMi4yLTcuOSA0Mi44LTE5LjggNjAuOC0zNS4xbDQyLjYgMjQuNmM0LjkgMi44IDExIDEuOSAxNC44LTIuMyAyNC43LTI2LjcgNDMuNi01OC45IDU0LjctOTQuNiAxLjUtNS41LS43LTExLjMtNS42LTE0LjF6TTI1NiAzMzZjLTQ0LjEgMC04MC0zNS45LTgwLTgwczM1LjktODAgODAtODAgODAgMzUuOSA4MCA4MC0zNS45IDgwLTgwIDgweiI+PC9wYXRoPjwvc3ZnPg==";
vu.sop.loadingImgSrc = '';
vu.sop.loadingImgStyle = '';

vu.sop.createLoadingImg = async function() {
    var imgElem = document.createElement("img");
    //Si no se asigno una imagen a la carga, asigna la imagen por defecto
    if(!vu.sop.loadingImgSrc) {
        imgElem.src = vu.sop.loadingImgSrcDefault;
        imgElem.className = "vu.sop.ui.loadingImg";
    } else {
        imgElem.src = vu.sop.loadingImgSrc;
        imgElem.style = vu.sop.loadingImgStyle;
    }
    
    //Agrega la imagen al html
    document.getElementById("vu.sop.ui.whiteLoadingImg").appendChild(imgElem);
    document.getElementById("vu.sop.ui.loadingImg").appendChild(imgElem.cloneNode());
}
