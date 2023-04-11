/*

Descripcion: Esta libreria se encarga de detectar los gestos y la orientacion del mismo


Referencias:
https://github.com/jeeliz/jeelizWeboji
https://github.com/jeeliz/jeelizFaceFilter
https://github.com/jeeliz/jeelizWeboji/blob/master/doc/jeefacetransferAPI.pdf


 */

if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

vu.face.loadStatus = 'no' // no - wip - ok
vu.face.canvasId = 'vu.sop.ui.faceTransferCanvas'
vu.face.invertXAxis = true

vu.face.doLoop = false
vu.face.canvas = false
vu.face.canvasContext = false
vu.face.canvasInference = false
vu.face.canvasInferenceContext = false
vu.face.checkPictureQuality = false
vu.face.faceSizeMin = 0.4
vu.face.faceSizeMax = 0.75

vu.face.gesturesConf = [['smile', 30],
                            ['bothEyesClosed', 40]]

vu.face.rotationConf = [['up', 40],
                            ['down', 40],
                            ['left', 50],
                            ['right', 50]]

vu.face.start = function() {
    vu.face.doLoop = true
}
vu.face.stop = function() {
    vu.face.doLoop = false
}

vu.face.load = async function(videoElement) {
    faceDetection = vu.sop.face.objectDetectionAndRotation.loadModel()
    directionAndGesture = vu.sop.face.model.directionsAndGestures.loadModel()
    vu.face.canvas = document.createElement('canvas');
    vu.face.canvasContext = vu.face.canvas.getContext("2d");
    vu.face.canvasInference = document.createElement('canvas');
    vu.face.canvasInferenceContext = vu.face.canvasInference.getContext("2d");
    await faceDetection
    await directionAndGesture
    return true
}

vu.face.getRotationAndGestures = async function(canvas) {
    data = await vu.sop.face.model.directionsAndGestures.predictAsync(canvas)
    //console.log(data)
    x = 'center'
    if ( data['face_looking_left'] > data['face_looking_right'] &&
        data['face_looking_left'] > vu.face.rotationConf[2][1]
    ) {
        if (vu.face.invertXAxis) {
            x = 'right'
        } else {
            x = 'left'
        }
    } else {
        if (data['face_looking_right'] > vu.face.rotationConf[3][1]) {
            if (vu.face.invertXAxis) {
                x = 'left'
            } else {
                x = 'right'
            }
        }
    }

    y = 'center'
    if ( data['face_looking_up'] > data['face_looking_down'] &&
        data['face_looking_up'] > vu.face.rotationConf[0][1]
    ) {
        y = 'up'
    } else {
        if (data['face_looking_down'] > vu.face.rotationConf[1][1]) {
            y = 'down'
        }
    }

    //console.log('smile:', gestures['smile'], 'eyes:', gestures['bothEyesClosed'])
    result = []
    if (data['smile'] > vu.face.gesturesConf[0][1]) {
        result.push('smileRight')
        result.push('smileLeft')
    }
    if (data['bothEyesClosed'] > vu.face.gesturesConf[1][1]) {
        result.push('eyeRightClose')
        result.push('eyeLeftClose')
    }

    return [[x, y], result]
}


vu.face.getData = async function(){
    if (vu.face.doLoop){
        loopStartTime =  new Date();
        vu.sop.ui.debug.info.push(['Video width', vu.camera.video.videoWidth + 'px'])
        vu.sop.ui.debug.info.push(['Video height', vu.camera.video.videoHeight + 'px'])
        vu.sop.ui.debug.info.push(['Video offsetWidth', vu.camera.video.offsetWidth + 'px'])
        vu.sop.ui.debug.info.push(['Video offsetHeight', vu.camera.video.offsetHeight + 'px'])
        vu.sop.ui.debug.info.push(['Video Center', '<span style="font-weight: bolder; color: darkblue;">POINT</span>'])
        vu.sop.ui.debug.info.push(['Face Center', '<span style="font-weight: bolder; color: #1DC600;">POINT</span>'])

        boxStartTime = new Date();
        box = await vu.sop.face.objectDetectionAndRotation.predictAsync(vu.camera.video)
        vu.sop.ui.debug.perf.push(['Face Box', new Date().getTime() - boxStartTime.getTime() +'ms'])

        if (box.length == 0){
            if (vu.sop.ui.debug.enable) {
                vu.sop.ui.debug.perf.push(['loop', new Date().getTime() - loopStartTime.getTime() +'ms'])
                vu.sop.ui.debugDraw()
                vu.sop.ui.drawVideoCenter()
            } else {
                vu.sop.ui.cleanResults()
            }
            return [false , ['center', 'center'], [], true, false]
        } else {
            resizeStartTime = new Date();

            faceConfidence = Math.round(box[0][2]*100)

            borderDecimal = -0.2
            borderHorizontal = Math.round(box[0][1][2] * borderDecimal)
            borderVertical =  Math.round(box[0][1][3] * borderDecimal)
            vu.face.canvas.height = box[0][1][3] - (borderVertical*2);
            vu.face.canvas.width = vu.face.canvas.height;

            horizontalCenterOffset = Math.round((vu.face.canvas.height - box[0][1][2])/4)
            //canvas.width = box[0][1][2] - (borderHorizontal*2);
            vu.face.canvasContext.drawImage(vu.camera.video,
                -(box[0][1][0] + borderHorizontal - horizontalCenterOffset),
                -(box[0][1][1] + borderVertical)
            );
            /*--------------------------*/
            vu.face.canvasInference.height = box[0][1][3];
            vu.face.canvasInference.width = box[0][1][2];
            vu.face.canvasInference.style.width  = '400px';
            vu.face.canvasInference.style.height = '300px';

            vu.face.canvasInferenceContext.drawImage(vu.camera.video,
                -box[0][1][0], -box[0][1][1],
            );

            vu.sop.ui.debug.perf.push(['Resize', new Date().getTime() - resizeStartTime.getTime() +'ms'])
            /*--------------------------*/

            getRotationAndGestures = vu.face.getRotationAndGestures(vu.face.canvasInference);

            if (vu.face.checkPictureQuality){
                vu.image.blurDetector.resize = 224
                vu.image.blurDetector.minResult = 1.3
                vu.image.brightnessDetector.minResult = 30
                isBrightStartTime = new Date();
                isBright = vu.image.brightnessDetector.isBrightAsync(vu.face.canvas)
                isBlurryStartTime = new Date();
                isBlurry = vu.image.blurDetector.isBlurryAsync(vu.face.canvas)

                isBright = await isBright;
                vu.sop.ui.debug.perf.push(['isBright', new Date().getTime() - isBrightStartTime.getTime() +'ms'])
                isBlurry = await isBlurry;
                vu.sop.ui.debug.perf.push(['isBlurry', new Date().getTime() - isBrightStartTime.getTime() +'ms'])

                faceSize = 'ok'
                //faceSizeMin = 0.4
                //faceSizeMax = 0.75
                faceSizeAlert = false
                if (vu.camera.isVerticalVideo()) {
                    // Video is vertical (box[0][1][2] = Face Box Width)
                    size = (box[0][1][2] / vu.camera.video.videoWidth)
                    if (size < vu.face.faceSizeMin) {
                        faceSize = 'small'
                        faceSizeAlert = true
                    }
                    if (size > vu.face.faceSizeMax) {
                        faceSize = 'big'
                        faceSizeAlert = true
                    }
                } else {
                    // Video is Horizontal (box[0][1][3] = Face Box Height)
                    size = (box[0][1][3] / vu.camera.video.videoHeight)
                    if (size < vu.face.faceSizeMin) {
                        faceSize = 'small'
                        faceSizeAlert = true
                    }
                    if (size > vu.face.faceSizeMax) {
                        faceSize = 'big'
                        faceSizeAlert = true
                    }
                }
                // Validacion de rostro centrado
                faceCenterX = box[0][1][0] + (box[0][1][2]/2)
                faceCenterY = box[0][1][1] + (box[0][1][3]/2)
                videoCenterX = vu.camera.video.videoWidth/2
                videoCenterY = vu.camera.video.videoHeight/2
                maxDistanceFromTheCenter = 0.25

                faceCenterVerticalAlert = false
                if (Math.abs(faceCenterY - videoCenterY) > (videoCenterY * maxDistanceFromTheCenter)) {
                    faceSize = 'notCentered'
                    faceCenterVerticalAlert = true
                }
                faceCenterHorizontalAlert = false
                if (Math.abs(faceCenterX - videoCenterX) > (videoCenterX * maxDistanceFromTheCenter)) {
                    faceSize = 'notCentered'
                    faceCenterHorizontalAlert = true
                }

                if (vu.sop.ui.debug.enable) {
                    vu.sop.ui.debug.eval.push(['Face confidence', faceConfidence +"%", 'white'])

                    if (isBright[0]) {color = '#1DC600'} else { color = 'red'}
                    vu.sop.ui.debug.eval.push(['Face is bright', isBright[0], color])
                    vu.sop.ui.debug.eval.push(['Face is bright val', isBright[1], color])
                    vu.sop.ui.debug.eval.push(['Face is bright min', vu.image.brightnessDetector.minResult, 'white'])

                    if (isBlurry[0]) {color = 'red'} else { color = '#1DC600'}
                    vu.sop.ui.debug.eval.push(['Face blurry', isBlurry[0], color])
                    vu.sop.ui.debug.eval.push(['Face blurry val', isBlurry[1].toFixed(2), color])
                    vu.sop.ui.debug.eval.push(['Face blurry max', vu.image.blurDetector.minResult, 'white'])

                    if (faceSizeAlert) { color = 'red'} else { color = '#1DC600'}
                    vu.sop.ui.debug.eval.push(['Face size', box[0][1][2] + "px", color])
                    vu.sop.ui.debug.eval.push(['Face size', Math.round(size*100) + "%", color])
                    vu.sop.ui.debug.eval.push(['Face min size', Math.round(vu.face.faceSizeMin*100) + '%', 'white'])
                    vu.sop.ui.debug.eval.push(['Face max size', Math.round(vu.face.faceSizeMax*100) + '%', 'white'])

                    if (faceCenterVerticalAlert) { color = 'red'} else { color = '#1DC600'}
                    vu.sop.ui.debug.eval.push(['Face Y Distance', Math.round(Math.abs(faceCenterY - videoCenterY)) + 'px', color])
                    vu.sop.ui.debug.eval.push(['Face Y Max', Math.round((videoCenterY * maxDistanceFromTheCenter)) + 'px', 'white'])

                    if (faceCenterHorizontalAlert) { color = 'red'} else { color = '#1DC600'}
                    vu.sop.ui.debug.eval.push(['Face X Distance', Math.round(Math.abs(faceCenterX - videoCenterX)) + 'px', color])
                    vu.sop.ui.debug.eval.push(['Face X Max', Math.round((videoCenterX * maxDistanceFromTheCenter)) + 'px', 'white'])

                    vu.sop.ui.debug.eval.push(['Face Result', faceSize, color])
                }

            } else {
                isBright = [true, 0];
                isBlurry = [false, 0];
                faceSize = 'ok'
            }

            getRotationAndGestures = await getRotationAndGestures;

            if (vu.sop.ui.debug.enable) {
                vu.sop.ui.debug.perf.push(['loop', new Date().getTime() - loopStartTime.getTime() +'ms'])
                vu.sop.ui.debugDraw()
                vu.sop.ui.drawVideoCenter()
                vu.face.ui.gestures.drawBox(box)
            } else {
                vu.sop.ui.cleanResults()
            }
            return [true , getRotationAndGestures[0], getRotationAndGestures[1], isBright[0], isBlurry[0], faceSize]
        }
    } else {
        vu.sop.ui.cleanResults()
        return [false , ['center', 'center'], [], true, false]
    }
}


