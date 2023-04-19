if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.face.auth == "undefined") { vu.face.auth = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.audio == "undefined") { vu.sop.audio = function() {} }

vu.face.auth.userNameValue;

vu.face.lang  = 'es';
vu.face.auth.warmUpFaceModelAsync = false;
vu.face.auth.faceOrientationModelWeights = 'BEST';        // VERYLIGHT LIGHT NORMAL BEST

vu.face.auth.useHighResolutionSettingsInPCCamera = false
vu.face.auth.useHighResolutionSettingsInMobileCamera = false
vu.face.auth.registrationFlow = false
vu.face.auth.enableSelfieList = false


vu.face.auth.load = async function(basePath) {
    try {
        let htmlLoad = vu.face.auth.loadHtml(basePath + '/html/face.html');
        let webRTCadapter = vu.face.auth.loadJs(basePath + '/js/libs/webrtc/adapter-latest.js');

        /* Pre conf */
        if (vu.face.useGestures == true) {
            vu.face.nncPath = basePath + '/js/libs/face/'
        } else if (vu.face.useGestures == 'mixedChallenge'){
            let tfJsLoad =  vu.face.auth.loadJs(basePath + '/js/libs/tensorflowjs/3.11.0/tf.min.js');
            await tfJsLoad;
            let tfJsWasmLoad = vu.face.auth.loadJs(basePath + '/js/libs/tensorflowjs/3.11.0/tf-backend-wasm.min.js');
            await tfJsWasmLoad;
            vu.face.auth.useHighResolutionSettingsInPCCamera = true
            vu.face.auth.useHighResolutionSettingsInMobileCamera = true
        } else {
            console.log('Challenge orientation model', vu.face.auth.faceOrientationModelWeights)
            if ( vu.face.auth.faceOrientationModelWeights == 'VERYLIGHT' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_VERYLIGHT_0.json';
            } else if ( vu.face.auth.faceOrientationModelWeights == 'LIGHT' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_DEFAULT.json';
            } else if ( vu.face.auth.faceOrientationModelWeights == 'NORMAL' ) {
                vu.face.nncPath = basePath + '/js/libs/face/NN_LIGHT_0.json';
            }  else  {
                vu.face.nncPath = basePath + '/js/libs/face/NN_WIDEANGLES_0.json';
            }
        }

        if ( vu.sop.audio.enabled == false ) {
            console.log("Audio Load is disabled by conf");
            loadAudioLang = false
        } else {
            console.log("Audio Load is enabled by conf");
            loadAudioLang = true
        }

        document.getElementById('vu.sop').innerHTML = await htmlLoad;
        /* ----------------------------------------------------------------------------- */
        if (loadAudioLang) {
            audioLangLoad =  vu.face.auth.loadJs(basePath + '/js/vu.sop.audio.'+ vu.face.lang +'.js');
        }
        let msgs =  vu.face.auth.loadJs(basePath + '/js/vu.sop.msg.'+ vu.face.lang +'.js');
        let errors =  vu.face.auth.loadJs(basePath + '/js/vu.error.js');
        let audioLoad =  vu.face.auth.loadJs(basePath + '/js/vu.sop.audio.js');
        let cameraLoad =  vu.face.auth.loadJs(basePath + '/js/vu.camera.js');
        let blurDetectionLoad =  vu.face.auth.loadJs(basePath + '/js/libs/inspector-bokeh/dist/measure_blur.js');
        let sopUILoad =  vu.face.auth.loadJs(basePath + '/js/vu.sop.ui.js');
        let apiLoad =  vu.face.auth.loadJs(basePath + '/js/vu.sop.api.js');
        let faceUiLoad =  vu.face.auth.loadJs(basePath + '/js/vu.face.ui.js');
        let imageLib =  vu.face.auth.loadJs(basePath + '/js/vu.image.js');
        let screenCapture =  vu.face.auth.loadJs(basePath + '/js/vu.screen.capture.js');
        let h264 =  vu.face.auth.loadJs(basePath + '/js/libs/h264-mp4-encoder/h264-mp4-encoder.web.js');
        let htm2canvas =  vu.face.auth.loadJs(basePath + '/js/libs/html2canvas/html2canvas.min.js');

        if (vu.face.useGestures == true) {
            console.log('Loading challenge gestures')
            faceLoad =  vu.face.auth.loadJs(basePath + '/js/vu.face.gestures.js');
            faceUiGesturesLoad =  vu.face.auth.loadJs(basePath + '/js/vu.face.ui.gestures.js');
            faceLibLoad = vu.face.auth.loadJs(basePath + '/js/libs/face/jeelizFaceTransfer.js');
        } else if (vu.face.useGestures == 'mixedChallenge'){
            console.log('Loading mixedChallenge mode')
            faceLoad =  vu.face.auth.loadJs(basePath + '/js/vu.face.mixedChallenge.js');
            faceObjectDetection =  vu.face.auth.loadJs(basePath + '/js/vu.sop.face.objectDetectionAndRotation.js');
            faceDirectionGesturesDetection =  vu.face.auth.loadJs(basePath + '/js/vu.sop.face.model.directionsAndGestures.js');
            faceMixedChallengeUi =  vu.face.auth.loadJs(basePath + '/js/vu.face.ui.mixedChallenge.js');
        } else {
            console.log('Loading challenge orientation')
            faceLoad =  vu.face.auth.loadJs(basePath + '/js/vu.face.orientation.js');
            faceLibLoad = vu.face.auth.loadJs(basePath + '/js/libs/face/jeelizFaceFilter.js');
        }
        /* ----------------------------------------------------------------------------- */
        await webRTCadapter;
        await msgs;
        await errors;
        await cameraLoad;
        await blurDetectionLoad;
        await sopUILoad;
        await apiLoad;
        await screenCapture;
        await h264;
        await htm2canvas;
        if (vu.face.useGestures == true) {
            await faceUiGesturesLoad;
            await faceLoad;
            await faceLibLoad;
        } else if (vu.face.useGestures == 'mixedChallenge') {
            await faceLoad;
            await faceObjectDetection;
            await faceDirectionGesturesDetection;
            await faceMixedChallengeUi;
        } else {
            await faceLoad;
            await faceUiLoad;
            await faceLibLoad;
        }
        await audioLoad;
        if (loadAudioLang) {
            await audioLangLoad;
        }
        await imageLib;

        document.getElementById('vu.sop.ui.userName').placeholder = vu.sop.msg.userInputPlaceholder
        document.getElementById('vu.sop.ui.userNameSendBtn').innerHTML = vu.sop.msg.userSendBtn

        vu.sop.ui.bottomTextBackGroundColor("rgba(0, 0, 0, 0.4)");
        await vu.face.auth.createLoadingImg();

    } catch (e) {
        console.log('Network Loading Error')
        console.log(e)
        throw new Error('NETWORK_ERROR');
    }

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
        await vu.error.showError(new vu.error.LoadError(e.message));
        
    };
}

vu.face.auth.loadJs = function(url) {
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

vu.face.auth.loadHtml = function(url) {
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


vu.face.auth.videoResizeObserver = new ResizeObserver(entries => {
    console.log('Video element change, applying styles: face')
    vid = document.getElementById('vu.sop.ui.video')

    if(window.innerHeight > window.innerWidth) {
        // Si la pantalla esta en vertical
        if (vu.camera.isVerticalVideo()) {
            // Si el video esta en vertical
            vid.style.maxWidth = "100%";
            vid.style.maxHeight = "none";
            vid.style.width = "100%";
            vid.style.height = "auto";
        } else {
            // Si el video esta en horizontal
            vid.style.maxWidth = "none";
            vid.style.maxHeight = "100%";
            vid.style.width = "auto";
            vid.style.height = "100%";
        }
    } else {
        // Si la pantalla esta en horizontal
        if (vu.camera.isVerticalVideo()) {
            // Si el video esta en vertical
            vid.style.maxWidth = "100%";
            vid.style.maxHeight = "none";
            vid.style.width = "100%";
            vid.style.height = "auto";
        } else {
            // Si el video esta en horizontal
            vid.style.maxWidth = "none";
            vid.style.maxHeight = "100%";
            vid.style.width = "auto";
            vid.style.height = "100%";
        }
    }
});

/**************************************/


vu.face.auth.userDo  = async function() {
    vu.sop.audio.reproducir();
    await vu.sop.ui.disabled('vu.sop.ui.userNameSendBtn');
    await vu.sop.ui.showWhiteLoading();
    let userName = document.getElementById("vu.sop.ui.userName").value;
    vu.face.auth.userNameValue = userName;
    vu.sop.ui.user.start.resolve(true)
};

vu.face.auth.faceModelLoad = false;
vu.face.auth.start = async function() {
    while (true) {
        //try {
            await vu.sop.ui.showWhiteLoading();
            vu.face.auth.videoResizeObserver.observe(document.getElementById('vu.sop.ui.videoContainer'));

            if (vu.sop.ui.isMobile){
                if (vu.face.auth.useHighResolutionSettingsInMobileCamera) {
                    vu.camera.config.previewResolution = 'highest'
                    vu.camera.config.pictureResolution = 'highest'
                }
            } else {
                if (vu.face.auth.useHighResolutionSettingsInPCCamera) {
                    vu.camera.config.previewResolution = 'highest'
                    vu.camera.config.pictureResolution = 'highest'
                }
            }
            vu.camera.config.orientation = 'user'

            await vu.camera.start("vu.sop.ui.video");

            vu.sop.ui.flipVideoHorizontal(vu.camera.video)
            console.log('Warming Up Start')
            if ( vu.face.auth.warmUpFaceModelAsync ) {
                vu.face.auth.faceModelLoad = vu.face.load(vu.camera.video);
            } else {
                await vu.face.load(vu.camera.video);
            }
            break
        /*} catch (e) {
            await vu.sop.ui.hideWhiteLoading();
            console.log(e)
            await vu.error.showError(new vu.error.CameraError(e.message));
            
        }*/
    }


    while (true){
        try {
            if (vu.face.auth.userNameValue == null) {
                // Oculta la pantalla de espera, para mostrar la pantalla de ingreso de usuario
                await vu.sop.ui.hideLoading();
                await vu.sop.ui.hideWhiteLoading()
                // Espera a que se resuelva la pantalla del usuario
                await vu.sop.ui.user.start()
            } else {
                await vu.sop.ui.user.doPreSetUser(vu.face.auth.userNameValue)
            }

            if ( vu.face.auth.warmUpFaceModelAsync ) { await vu.face.auth.faceModelLoad };
            await vu.sop.ui.user.hide()
            break
        } catch (e) {
            console.log('vu.sop.ui.user', e)
            await vu.error.showError(new vu.error.FaceAuthError('registerApiError'));
        }
    }

    // ----------------------------------------
    // FACE
    //
    // Do face
    while (true) {
        try {
            await vu.sop.ui.hideLoading();
            await vu.sop.ui.hideWhiteLoading()

            await vu.sop.ui.showVideo()
            if (vu.face.useGestures) {
                await vu.face.ui.gestures.start();
                pictures = await vu.face.ui.gestures.challengeStart();
            } else {
                await vu.face.ui.start();
                pictures = await vu.face.ui.challengeStart();
            }

            await vu.sop.ui.showLoading()
            lastPic = pictures[(pictures.length - 1)]

            if (vu.face.auth.registrationFlow) {
                if(vu.face.auth.enableSelfieList===true){
                    if( vu.face.ui.picturesTags.length > 0 )
                        response = await vu.sop.api.faceRegisters(vu.face.auth.userNameValue,
                        pictures,
                        vu.face.ui.picturesTags);
                    else
                        response = await vu.sop.api.faceRegisters(vu.face.auth.userNameValue,
                        pictures,
                        vu.face.ui.gestures.picturesTags);

                }else{
                    response = await vu.sop.api.faceRegister(vu.face.auth.userNameValue, lastPic);
                }
                if (response.code == '2001') {
                        throw new Error('registerApiError')
                }  else if(response.code != '932') {
                        throw new Error('registerApiError')
                }

            } else {
                console.log("Enable selfie list " + vu.face.auth.enableSelfieList)
                if(vu.face.auth.enableSelfieList===true){
                    if( vu.face.ui.picturesTags.length > 0 )
                        response = await vu.sop.api.faceLoginList(vu.face.auth.userNameValue,
                        pictures,
                        vu.face.ui.picturesTags);
                    else
                        response = await vu.sop.api.faceLoginList(vu.face.auth.userNameValue,
                        pictures,
                        vu.face.ui.gestures.picturesTags);

                    if (response.code == '1001') {
                        throw new Error('userNotExist')
                    } else if(response.code == '2001') {
                        throw new Error('failAuth')
                    } else if(response.code != '1002') {
                        throw new Error('failAuth')
                    }
                }else{
                    response = await vu.sop.api.faceLogin(vu.face.auth.userNameValue, lastPic);

                    if (response.code == '1001') {
                        throw new Error('userNotExist')
                    } else if(response.code == '2001') {
                        throw new Error('failAuth')
                    } else if(response.code != '1002') {
                        throw new Error('failAuth')
                    }
                }
            }
            await vu.sop.ui.hideLoading()
            break
        } catch (e) {
            await vu.sop.ui.hideLoading()
            console.log(e)
            let msg = 'faceError'
            if(e.code !== undefined) {
                if (e.code == '1001') {
                    msg = 'userNotExist'
                } else if(e.code == '2001') {
                    msg = 'failAuth'
                } else if(e.message !== undefined) {
                    msg = e.message;
                }
            } else if (e.message !== undefined) {
                msg = e.message;
            }
            await vu.error.showError(new vu.error.FaceAuthError(msg));
        }
    }
    //vu.sop.ui.show('vu.sop.ui.endScreen')
    return response

}

vu.face.auth.loadingImgSrcDefault = "data:image/svg+xml;base64,PHN2ZyBhcmlhLWhpZGRlbj0idHJ1ZSIgZm9jdXNhYmxlPSJmYWxzZSIgZGF0YS1wcmVmaXg9ImZhcyIgZGF0YS1pY29uPSJjb2ciIGNsYXNzPSJzdmctaW5saW5lLS1mYSBmYS1jb2cgZmEtdy0xNiIgcm9sZT0iaW1nIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik00ODcuNCAzMTUuN2wtNDIuNi0yNC42YzQuMy0yMy4yIDQuMy00NyAwLTcwLjJsNDIuNi0yNC42YzQuOS0yLjggNy4xLTguNiA1LjUtMTQtMTEuMS0zNS42LTMwLTY3LjgtNTQuNy05NC42LTMuOC00LjEtMTAtNS4xLTE0LjgtMi4zTDM4MC44IDExMGMtMTcuOS0xNS40LTM4LjUtMjcuMy02MC44LTM1LjFWMjUuOGMwLTUuNi0zLjktMTAuNS05LjQtMTEuNy0zNi43LTguMi03NC4zLTcuOC0xMDkuMiAwLTUuNSAxLjItOS40IDYuMS05LjQgMTEuN1Y3NWMtMjIuMiA3LjktNDIuOCAxOS44LTYwLjggMzUuMUw4OC43IDg1LjVjLTQuOS0yLjgtMTEtMS45LTE0LjggMi4zLTI0LjcgMjYuNy00My42IDU4LjktNTQuNyA5NC42LTEuNyA1LjQuNiAxMS4yIDUuNSAxNEw2Ny4zIDIyMWMtNC4zIDIzLjItNC4zIDQ3IDAgNzAuMmwtNDIuNiAyNC42Yy00LjkgMi44LTcuMSA4LjYtNS41IDE0IDExLjEgMzUuNiAzMCA2Ny44IDU0LjcgOTQuNiAzLjggNC4xIDEwIDUuMSAxNC44IDIuM2w0Mi42LTI0LjZjMTcuOSAxNS40IDM4LjUgMjcuMyA2MC44IDM1LjF2NDkuMmMwIDUuNiAzLjkgMTAuNSA5LjQgMTEuNyAzNi43IDguMiA3NC4zIDcuOCAxMDkuMiAwIDUuNS0xLjIgOS40LTYuMSA5LjQtMTEuN3YtNDkuMmMyMi4yLTcuOSA0Mi44LTE5LjggNjAuOC0zNS4xbDQyLjYgMjQuNmM0LjkgMi44IDExIDEuOSAxNC44LTIuMyAyNC43LTI2LjcgNDMuNi01OC45IDU0LjctOTQuNiAxLjUtNS41LS43LTExLjMtNS42LTE0LjF6TTI1NiAzMzZjLTQ0LjEgMC04MC0zNS45LTgwLTgwczM1LjktODAgODAtODAgODAgMzUuOSA4MCA4MC0zNS45IDgwLTgwIDgweiI+PC9wYXRoPjwvc3ZnPg==";
vu.face.auth.loadingImgSrc = '';
vu.face.auth.loadingImgStyle = '';

vu.face.auth.createLoadingImg = async function() {
    var imgElem = document.createElement("img");
    
    //Si no se asigno una imagen a la carga, asigna la imagen por defecto
    if(!vu.face.auth.loadingImgSrc) {
        imgElem.src = vu.face.auth.loadingImgSrcDefault;
        imgElem.className = "vu.sop.ui.loadingImg";
    } else {
        imgElem.src = vu.face.auth.loadingImgSrc;
        imgElem.style = vu.face.auth.loadingImgStyle;
    }
    
    //Agrega la imagen al html
    document.getElementById("vu.sop.ui.whiteLoadingImg").appendChild(imgElem);
    document.getElementById("vu.sop.ui.loadingImg").appendChild(imgElem.cloneNode());
}
