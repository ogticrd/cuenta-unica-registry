/*

Descripcion: Esta libreria se encarga de detectar los gestos y la orientacion del mismo

 */

if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

vu.face.loadStatus = 'no' // no - wip - ok
vu.face.canvasId = 'vu.sop.ui.faceTransferCanvas'
vu.face.invertXAxis = true

/*          */
vu.face.detected = true
vu.face.rotation = [0.5, 0.5]


vu.face.gesturesConf = [['smileRight',0.3],
                            ['smileLeft',0.3],
                            ['eyeBrowLeftDown',0.3],
                            ['eyeBrowRightDown',0.3],
                            ['eyeBrowLeftUp',0.5],
                            ['eyeBrowRightUp',0.5],
                            ['mouthOpen',0.5],
                            ['mouthRound',1],
                            ['eyeRightClose',0.2],
                            ['eyeLeftClose',0.2],
                            ['mouthNasty',0.5]]

vu.face.rotationConf = [['up', -0.2],
                            ['down', 0.2],
                            ['left', 0.3],
                            ['right',-0.3]]

vu.face.start = function() {
    JEEFACEFILTERAPI.toggle_pause(false)
}
vu.face.stop = function() {
    JEEFACEFILTERAPI.toggle_pause(true)
}

vu.face.load = async function(videoElement) {
    let promise = new Promise(function (resolve, reject) {
        vu.face.loadStatus = 'wip'
        //JEEFACEFILTERAPI.switch_displayVideo(false)
        //JEEFACETRANSFERAPI.switch_sleep(true)
        JEEFACEFILTERAPI.init({
            canvasId: vu.face.canvasId,
            NNCPath: vu.face.nncPath,
            videoSettings: {
                videoElement: videoElement
            },
            callbackReady: function (errCode) {
                if (errCode) {
                    console.log('ERROR - CANNOT INITIALIZE FACEAPI : errCode =', errCode);
                    return;
                }
                console.log('INFO : FACEAPI is ready !!!');
                setTimeout(function () {
                    JEEFACEFILTERAPI.toggle_pause(true)
                    vu.face.loadStatus = 'ok'
                    resolve(true)
                }, 1000)
            },
            callbackTrack: function(detectState){
                if (detectState.detected > 0.3) {
                    vu.face.detected = true
                    vu.face.rotation = [detectState.rx, detectState.ry]
                    //console.log(vu.face.rotation)
                } else {
                    vu.face.detected = false
                }
            } //end callbackTrack()
        });
    })
    return promise;
}

vu.face.getRotation = function() {
    //rotation = JEEFACETRANSFERAPI.get_rotation()
    //rotation = JEEFACEFILTERAPI.get_rotationStabilized()
    rotation = vu.face.rotation

    x = 'center'
    if (rotation[1] < vu.face.rotationConf[3][1]) {
        if (vu.face.invertXAxis) {
            x = 'right'
        } else {
            x = 'left'
        }
    }
    if (rotation[1] > vu.face.rotationConf[2][1]) {
        if (vu.face.invertXAxis) {
            x = 'left'
        } else {
            x = 'right'
        }
    }
    y = 'center'
    if (rotation[0] < vu.face.rotationConf[0][1]) {
        y = 'up'
    }
    if (rotation[0] > vu.face.rotationConf[1][1]) {
        y = 'down'
    }
    return [x, y]
}

vu.face.getGestures = function() {
    //gestures = JEEFACEFILTERAPI.get_morphTargetInfluencesStabilized();
    result = []
    /*for (i = 0; i < gestures.length; i++) {
        if ( gestures[i] >  vu.face.gesturesConf[i][1]) {
            result.push(vu.face.gesturesConf[i][0])
            //console.log(vu.face.gesturesConf[i][0], gestures[i])
        }
    }*/
    return result
}

vu.face.getData = function(){
    return [vu.face.detected, vu.face.getRotation(), vu.face.getGestures()]
}