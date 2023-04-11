if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.face.ui == "undefined") { vu.face.ui = function() {} }

//---------------------------------------------------
// FACE
//---------------------------------------------------

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.face.gestures == "undefined") { vu.face.gestures = function() {} }

if (typeof vu.face.ui.gestures == "undefined") { vu.face.ui.gestures = function() {} }

//---------------------------------------------------

vu.face.ui.gestures.loop = false;
// 'eyeClose', 'smile'
//vu.face.ui.gestures.allChallenges = ['smile', 'lookLeft', 'lookRight', 'lookDown', 'lookUp']
vu.face.ui.gestures.allChallenges = ['smile', 'lookLeft', 'lookRight']
// none
vu.face.gestures.permisiveNeutralChallenge = false

//---------------------------------------------------

vu.face.ui.gestures.circleSvg = function(lineColor, lineWidth, backgroundColor, backgroundOpacity) { 
    return "url('data:image/svg+xml;base64," +  btoa('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 210 210" style="enable-background:new 0 0 210 210;" xml:space="preserve">' +
    '<g d="layer1"><circle style="fill:none;stroke:'+lineColor+';stroke-width:'+ lineWidth+';stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="path14" cx="105" cy="105" r="88" /> </g></svg>') +"')"}

vu.face.ui.gestures.circleSvg2 = function(color) { return "url('data:image/svg+xml;base64," + btoa('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 297 210" style="enable-background:new 0 0 297 210;" xml:space="preserve">' +
    '<g d="layer1" transform="translate(0,-87)"><circle style="fill:none;stroke:'+color+';stroke-width:13;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1" id="path14" cx="160.63986" cy="192.07381" r="96.832855" /> </g></svg>') +"')"}


vu.face.ui.gestures.elipseSvg = function(lineColor, lineWidth, backgroundColor, backgroundOpacity) {
    width = document.getElementById('vu.face.ui.gestures.circle').offsetWidth;
    height = document.getElementById('vu.face.ui.gestures.circle').offsetHeight;

    relative = (height * 1148)/ 480;
	sd110 = (relative * ((110 * 100)/1148))/100
	sd220 = (relative * ((220 * 100)/1148))/100
	sd66 = (relative * ((66 * 100)/1148))/100
	sd68 = (relative * ((68 * 100)/1148))/100

    return "url('data:image/svg+xml;base64," +  btoa('<?xml version="1.0" encoding="utf-8"?>' +
' <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 ' + width + ' ' + height + '" style="enable-background:new 0 0 ' + width + ' ' + height + ';position:absolute;left:0; top:0; width:100%; height:100%" xml:space="preserve">' +
'   <path fill="'+ backgroundColor +'" opacity="'+ backgroundOpacity +'" stroke="none"' +
'    d="M 0,0 L '+ width / 2 +',0 L '+ width / 2 +',' + height*0.10 + ' A 18,20 1,0,0 '+ width / 2 +',' + height*0.90 + ' L '+ width / 2 +',' + height + ' L 0, ' + height + ' L 0,0 z" />' +
'   <path fill="'+ backgroundColor +'" opacity="'+ backgroundOpacity +'" stroke="none"' +
'    d="M '+ width / 2 +',0 L '+ width / 2 +',0 L '+ width / 2 +',' + height*0.10 + ' A 18,20 0,0,1 '+ width / 2 +',' + height*0.90 + ' L '+ width / 2 +',' + height + ' L ' + width + ', ' + height + ' L '+ width +',0 z" />' +
'	<ellipse cx="'+ width / 2 +'" cy="'+ height / 2 +'" rx="'+ (height*0.72) / 2 +'" ry="'+ (height*0.8) / 2 +'" fill="none" style="stroke:'+lineColor+'; stroke-width: '+ lineWidth+';' +
'		stroke-dasharray: ' + sd110 + ' ' + sd68 + ' ' + sd220 + ' ' + sd66 + ' ' + sd220 + ' ' + sd66 + ' ' + sd220 + ' ' + sd68 +  ' ' + sd110 + ';"/>' +
'</svg>'
) +"')"}


vu.face.ui.gestures.elipseSvg2 = function(lineColor, lineWidth, backgroundColor, backgroundOpacity) {
    width = document.getElementById('vu.face.ui.gestures.circle').offsetWidth;
    height = document.getElementById('vu.face.ui.gestures.circle').offsetHeight;

    return "url('data:image/svg+xml;base64," +  btoa('<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
    '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 640 480" style="enable-background:new 0 0 640 480;position:absolute;left:0; top:0; width:100%; height:100%" xml:space="preserve">' +
    '<path style="fill:'+ backgroundColor +';fill-opacity:'+ backgroundOpacity +';stroke:none" d="M 0 0 L 0 480 L 640 480 L 640 0 L 0 0 z M 319.99805 169.06055 A 63.845348 70.93927 0 0 1 383.84375 240 A 63.845348 70.93927 0 0 1 319.99805 310.93945 A 63.845348 70.93927 0 0 1 256.1543 240 A 63.845348 70.93927 0 0 1 319.99805 169.06055 z " id="rect821" />' +
    '<path fill="none" opacity="'+ backgroundOpacity +'" stroke="none" d="M 0,0 L 320,0 L 320,48 A 18,20 1,0,0 320,432 L 320,480 L 0, 480 L 0,0 z" id="path2" />' +
    '<path fill="none" opacity="'+ backgroundOpacity +'" stroke="none" d="M 320,0 L 320,0 L 320,48 A 18,20 0,0,1 320,432 L 320,480 L 640, 480 L 640,0 z" id="path4" />' +
    '<ellipse cx="319.99649" cy="240.18288" rx="63.845348" ry="70.93927" style="fill:none;stroke:'+lineColor+';stroke-width:'+ lineWidth+';stroke-dasharray:40.64229204, 25.12432599, 81.28458407, 24.38537522, 81.28458407, 24.38537522, 81.28458407, 25.12432599, 40.64229204" id="ellipse6" />' +
    '</svg>'
    ) +"')"
}


vu.face.ui.gestures.numOfChallenges = 3;
vu.face.ui.gestures.challengeLoop = false;
vu.face.ui.gestures.challengeResolve = null;
vu.face.ui.gestures.challenges = ['none'];
vu.face.ui.gestures.challengeNum = 0;
vu.face.ui.gestures.pictures = [];
vu.face.ui.gestures.picturesTags = [];

//---------------------------------------------------


vu.face.ui.gestures.circle = document.getElementById("vu.face.ui.gestures.circle");

vu.face.gestures.circleActiveColor = '#1DC600';
vu.face.gestures.circleDetectedColor = '#88898a';
vu.face.gestures.circleInactiveColor = '#000000';
vu.face.gestures.backGroundColor = 'none';
vu.face.gestures.backGroundOpacity = '1';
vu.face.gestures.lineWidth = 13;
vu.face.gestures.backgroundSize = 'default';

vu.face.gestures.method = vu.face.ui.gestures.circleSvg;

vu.face.ui.gestures.videoResizeObserver = new ResizeObserver(entries => {
    try {
        vu.face.ui.gestures.circleActive = vu.face.gestures.method(vu.face.gestures.circleActiveColor, vu.face.gestures.lineWidth, vu.face.gestures.backGroundColor, vu.face.gestures.backGroundOpacity);
        vu.face.ui.gestures.circleDetected = vu.face.gestures.method(vu.face.gestures.circleDetectedColor, vu.face.gestures.lineWidth, vu.face.gestures.backGroundColor, vu.face.gestures.backGroundOpacity);
        vu.face.ui.gestures.circleInactive = vu.face.gestures.method(vu.face.gestures.circleInactiveColor, vu.face.gestures.lineWidth, vu.face.gestures.backGroundColor, vu.face.gestures.backGroundOpacity);
    } catch (e) {

    }
});


vu.face.ui.gestures.start = function() {
    vu.face.ui.gestures.circle = document.getElementById("vu.face.ui.gestures.circle");
    vu.sop.ui.show("vu.face.ui.gestures.circle");
    
    //Permite que el fondo con opacidad ocupe todo su contenedor
    vu.face.ui.gestures.circle.style.top = 0;
    vu.face.ui.gestures.circle.style.height = '100%';

    if (vu.face.gestures.method == vu.face.ui.gestures.elipseSvg) {
        if (vu.face.gestures.backgroundSize == 'default'){
            vu.face.gestures.backgroundSize = 110
        }
        vu.face.ui.gestures.circle.style.backgroundSize = vu.face.gestures.backgroundSize + '%';
        vu.face.ui.gestures.circle.style.backgroundRepeatY = 'repeat';
    }
    if (vu.face.gestures.method == vu.face.ui.gestures.elipseSvg2) {
        if (vu.face.gestures.backgroundSize == 'default'){
            vu.face.gestures.backgroundSize = 310
        }
        vu.face.ui.gestures.circle.style.backgroundSize = vu.face.gestures.backgroundSize + '%';
        vu.face.ui.gestures.circle.style.backgroundRepeatY = 'repeat';
        vu.face.ui.gestures.circle.style.backgroundRepeatX = 'repeat';
    }

    vu.face.ui.gestures.videoResizeObserver.observe(document.getElementById('vu.sop.ui.videoContainer'));
    vu.face.ui.gestures.loop = true;
    vu.face.ui.gestures.genChallenges();
    vu.face.start();
    vu.face.ui.gestures.doLoop();
    return true
};

vu.face.ui.gestures.stop = function() {
    //Vovlemos la configuracion original
    let faceDiv = document.getElementById("vu.face.ui.gestures.circle");
    faceDiv.style.top = '5%';
    faceDiv.style.height = '90%';
    vu.sop.ui.hide("vu.face.ui.gestures.circle");
    vu.face.ui.gestures.videoResizeObserver.disconnect()
    vu.face.ui.gestures.loop = false
};

vu.face.ui.gestures.lastChallenge = ""
vu.face.ui.gestures.results = [];

vu.face.ui.gestures.resultsValidateMinTimeFrame = 2000; // El minimo periodiodo de tiempo antes de considerar un resultado valido
vu.face.ui.gestures.resultsValidateTimeFrame = 4000;    // El periodo de tiempo que se guardan los resultados en memoria en milisegundos
vu.face.ui.gestures.resultsValidatePercentual = 30;     // Si el X% de los resultados en el tiempo de resultsValidateTimeFrame es positivo, se considera que se tiene que mostrar el feedback


vu.face.ui.gestures.doLoop = function() {
    var start = new Date();
    vu.face.getData().then(function (data) {
        if (data[0] == false) {
            vu.face.load(vu.camera.video).then(
                challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
            )
        } else {
            challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
        }
        /* Bottom Text And Gesture Audio*/
        if (vu.face.ui.gestures.challengeNum == vu.face.ui.gestures.numOfChallenges) {
            vu.sop.ui.showBottomText("")
        } else {
            if (vu.face.ui.gestures.lastChallenge !== challenge) {
                if (challenge === 'smile') {
                    vu.face.ui.gestures.picturesTags.push("SS");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesSmile');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesSmile)
                }
                else if (challenge === 'eyeClose') {
                    vu.face.ui.gestures.picturesTags.push("SCE");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesEyeClose');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesEyeClose)
                }
                else if (challenge === 'eyeRightClose') {
                    vu.face.ui.gestures.picturesTags.push("SBR");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesEyeRightClose');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesEyeRightClose)
                }
                else if (challenge === 'eyeLeftClose') {
                    vu.face.ui.gestures.picturesTags.push("SBL");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesEyeLeftClose');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesEyeLeftClose)
                }
                else if (challenge === 'lookLeft') {
                    vu.face.ui.gestures.picturesTags.push("SML");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesLookLeft');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesLookLeft)
                }
                else if (challenge === 'lookRight') {
                    vu.face.ui.gestures.picturesTags.push("SMR");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesLookRight');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesLookRight)
                }
                /*else if (challenge === 'lookUp') {
                    vu.face.ui.gestures.picturesTags.push("SCU");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesLookUp')
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesLookUp)
                }
                else if (challenge === 'lookDown') {
                    vu.face.ui.gestures.picturesTags.push("SD");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesLookDown')
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesLookDown)
                }*/
                else if (challenge === 'none') {
                    vu.face.ui.gestures.picturesTags.push("SN");
                    vu.sop.audio.play('vu.sop.audio.faceGesturesNone');
                    vu.sop.ui.showBottomText(vu.sop.msg.faceGesturesNone)
                }
                else { vu.sop.ui.showBottomText("") }
                vu.face.ui.gestures.lastChallenge = challenge;
            }
        }


        /* Gesture Feedback */
        if (data[0] === true) {
            gestureMach = vu.face.ui.gestures.gestureMach(data);
            //console.log(data)

            /**********************************************/
            // Image Quality
            imageQualityIsOK = true
            // is Bright
            if (data[3] == false){
                vu.sop.ui.showBottomTextAlert(vu.sop.msg.darkFace)
                imageQualityIsOK = false
            }
            // Face Size (ok - big - small)
            if (data[5] == 'big'){
                vu.sop.ui.showBottomTextAlert(vu.sop.msg.faceClose)
                imageQualityIsOK = false
            }
            if (data[5] == 'small'){
                vu.sop.ui.showBottomTextAlert(vu.sop.msg.faceAway)
                imageQualityIsOK = false
            }
            if (data[5] == 'notCentered'){
                vu.sop.ui.showBottomTextAlert(vu.sop.msg.faceNotDetected)
                imageQualityIsOK = false
            }
            // Is blurry
            if (data[4] == true){
                vu.sop.ui.showBottomTextAlert(vu.sop.msg.blurryFace)
                imageQualityIsOK = false
            }

            /**********************************************/

            timeNow = Date.now()
            vu.face.ui.gestures.results.push([gestureMach,timeNow,imageQualityIsOK]);

            /* Limpiamos el array de resultados para solo guardar los que necesitamos para la validacion de gestops */
            cleanResultArray = [];
            for (i = 0; i < vu.face.ui.gestures.results.length; i++) {
                if ((timeNow - vu.face.ui.gestures.results[i][1]) < vu.face.ui.gestures.resultsValidateTimeFrame){
                    cleanResultArray.push(vu.face.ui.gestures.results[i]);
                }
            }
            vu.face.ui.gestures.results = cleanResultArray;

            /**********************************************/

            if (gestureMach){
                vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleActive;
            } else {
                /* --------------------------------------------------------------------------- */
                // Normalización de los resultados
                timeNow = Date.now()    // Tiempo actual (milisegundos)
                timeFrame = 1000        // Tiempo a evaluar
                resultsOK = 50         // Porcentual

                // Si una deteccion de gesto da negativa, pero el % declarado en 'resultsOK' de los resultados en
                // 'timeframe' dan OK, no se quita el feedback del gesto.

                count = 0       // Contador de cantidad de gestos detectadps en el periodo del'timeFrame'
                results = 0     // Contador de canidad de gestos que machean el desafio en el periodo del 'timeFrame'

                for (var i = 0; i > vu.face.ui.gestures.results.length; i ++) {
                    if (( timeNow - vu.face.ui.gestures.results[i][1]) > timeFrame ) {
                        count = count + 1
                        if (vu.face.ui.gestures.results[i][0]){
                            results = results + 1
                        }
                    }
                }
                if (((results * 100)/count) > resultsOK) {
                    vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleActive;
                } else {
                    vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleDetected;
                }
            }
        } else {
            /* Si no hay rostro, se limpian los resultados */
            vu.face.ui.gestures.results = [];
            vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleInactive;
            vu.sop.ui.hideBottomTextAlert()
            vu.sop.ui.showBottomTextAlert(vu.sop.msg.faceNotDetected)
        }
        //console.log('Loop  - Time', new Date().getTime() - start.getTime(), 'ms')

        if (vu.face.ui.gestures.loop == true) {
            setTimeout(function () {
                promise = vu.face.ui.gestures.doLoop()
            }, 10);
        }
    });
};

vu.face.ui.gestures.gestureMach = function(data) {
    actualGesture = data[2]
    gestureMach = false
    x = data[1][0]
    y = data[1][1]

    vu.sop.ui.hideBottomTextAlert()

    if (challenge === 'smile') {
        if (actualGesture.indexOf('smileRight') > -1 || actualGesture.indexOf('smileLeft') > -1) {
             gestureMach = true 
        }
        
    }
    if (challenge === 'eyeClose') {
        left = false;
        right = false;
        
        if (actualGesture.indexOf('eyeLeftClose') > -1) { left = true }

        if (actualGesture.indexOf('eyeRightClose') > -1) { right = true }

        if (left === true && right === true){
            gestureMach = true
        }
        //console.log('challenge', challenge, 'left', left, 'right', right)
    }
    if (challenge === 'eyeRightClose') {
        left = false;
        right = false;
                
        if (actualGesture.indexOf('eyeLeftClose') > -1) { 
            left = true 
        }
        
        if (actualGesture.indexOf('eyeRightClose') > -1) { 
            right = true 
        }

        if (left === false && right === true){
            gestureMach = true
        }
        //console.log('challenge', challenge, 'left', left, 'right', right)
    }
    if (challenge === 'eyeLeftClose') {
        left = false;
        right = false;
        
        if (actualGesture.indexOf('eyeLeftClose') > -1) { 
            left = true 
        }

        if (actualGesture.indexOf('eyeRightClose') > -1) { 
            right = true 
        }
        
        if (left === true && right === false){
            gestureMach = true
        }
        //console.log('challenge', challenge, 'left', left, 'right', right)
    }
    if (challenge === 'lookLeft') {
        if (x === 'right') { gestureMach = true }
    }
    if (challenge === 'lookRight') {
        if (x === 'left') { gestureMach = true }
    }
    if (challenge === 'lookUp') {
        if (y === 'up') { gestureMach = true }
    }
    if (challenge === 'lookDown') {
        if (y === 'down') { gestureMach = true }
    }
    if (challenge === 'none') {
        left = false;
        right = false;
        center = false;
        smile = false;
        if (actualGesture.indexOf('eyeLeftClose') < 0) { left = true }
        if (actualGesture.indexOf('eyeRightClose') < 0) { right = true }
        if (actualGesture.indexOf('smileRight') < 0 && actualGesture.indexOf('smileLeft') < 0) { smile = true}
        if (x === 'center' && y === 'center') { center = true }
        if (vu.face.gestures.permisiveNeutralChallenge) {
            if (center === true){
                gestureMach = true
            }
        } else {
            if (left === true && right === true && center === true && smile === true){
                gestureMach = true
            }
        }
    }
    return gestureMach
}

vu.face.ui.gestures.genChallenges = function() {
    vu.face.ui.gestures.challengeNum = 0;
    vu.face.ui.gestures.challenges = [];
    var i;

    if(vu.face.ui.gestures.numOfChallenges > vu.face.ui.gestures.allChallenges.length + 1) {
        vu.face.ui.gestures.numOfChallenges = vu.face.ui.gestures.allChallenges.length + 1;
    }

    for (i = 1; i < vu.face.ui.gestures.numOfChallenges; i++) {
        while (true) {
            cha = vu.face.ui.gestures.allChallenges[Math.floor(Math.random() * vu.face.ui.gestures.allChallenges.length)];
            if (vu.face.ui.gestures.challenges.indexOf(cha) < 0) {
                break;
            }
        }
        vu.face.ui.gestures.challenges.push(cha);
    }
    vu.face.ui.gestures.challenges.push('none')
};

vu.face.ui.gestures.challengeStart = function() {
    let promise = new Promise(function (resolve, reject) {
        //vu.face.ui.gestures.genChallenges();
        vu.face.ui.gestures.challengeLoop = true
        vu.camera.config.orientation = 'user'
        vu.camera.config.pictureLessBlurry = false;
        pro = vu.face.ui.gestures.challengeDoLoop()
        vu.face.ui.gestures.challengeResolve = resolve
    });
    return promise
};

vu.face.ui.gestures.challengeStop = function() {
    vu.sop.ui.hideBottomText();
    vu.sop.ui.cleanAndHideBottomTextAlert();
    vu.face.ui.gestures.challengeLoop = false;
};

vu.face.ui.gestures.challengeDoLoop = async function() {
    challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
    takePhoto = false;
    timeNow = Date.now()
    /* Evaluamos si hay suficientes resultados para sacar la foto */
    if (vu.face.ui.gestures.results.length > 2){
        if (( timeNow - vu.face.ui.gestures.results[0][1]) > vu.face.ui.gestures.resultsValidateMinTimeFrame ) {
            /* Evaluamos si se tiene que sacar la foto */
            countTrue = 0
            for (i = 0; i < vu.face.ui.gestures.results.length; i++) {
                 if (vu.face.ui.gestures.results[i][0] === true){
                     countTrue = countTrue + 1
                 }
            }
            if (((countTrue*100)/vu.face.ui.gestures.results.length) > vu.face.ui.gestures.resultsValidatePercentual){
                if (vu.face.ui.gestures.results[0][2]) {
                    takePhoto = true
                }
            }
        }
    }

    if (vu.sop.ui.debug.enable) {
        if (vu.sop.ui.debug.hangProofOfLife){
            takePhoto = false
        }
    }

    if (takePhoto) {
        vu.sop.audio.play('vu.sop.audio.audioBeep');
        vu.face.ui.gestures.pictures.push(await vu.camera.takePicture());
        vu.face.ui.gestures.challengeNum = vu.face.ui.gestures.challengeNum + 1;
        vu.face.ui.gestures.challengeValidaXTimesCounter = 0
        vu.face.ui.gestures.results = [];
    }

    if (vu.face.ui.gestures.challengeNum == vu.face.ui.gestures.numOfChallenges) {
        //console.log('stop', vu.face.ui.challengeNum)
        vu.face.ui.gestures.results = [];
        vu.face.ui.gestures.stop()
        vu.face.ui.gestures.challengeStop()
        vu.face.ui.gestures.challengeResolve(vu.face.ui.gestures.pictures)
    }

    if (vu.face.ui.gestures.challengeLoop == true) {
        setTimeout(function () {
            promise = vu.face.ui.gestures.challengeDoLoop()
        }, 10);
    }
};



vu.face.ui.gestures.box = document.getElementById('vu.sop.document.ui.box')
vu.face.ui.gestures.boxCenterPoint = document.getElementById('vu.sop.ui.debugElementCenter')
vu.face.ui.gestures.videoContainer = document.getElementById('vu.sop.ui.videoContainer')

vu.face.ui.gestures.drawBox = function(predictResults) {
    scale = vu.camera.video.offsetHeight / vu.camera.video.videoHeight
    try {
        bbox = predictResults[0][1]
        if (bbox[0] < 1) {
            bbox[0] = 1
        }
        if (bbox[1] < 1) {
            bbox[1] = 1
        }
        if (bbox[2] > vu.camera.video.videoWidth) {
            bbox[2] = vu.camera.video.videoWidth
        }
        if (bbox[3] > vu.camera.video.videoHeight) {
            bbox[3] = vu.camera.video.videoHeight
        }
        bleft = bbox[0] * scale
        btop = bbox[1] * scale
        bwidth = bbox[2] * scale
        bheight = bbox[3] * scale

        fixX = Math.round((vu.camera.video.offsetWidth - vu.face.ui.gestures.videoContainer.offsetWidth)/2)
        fixY = Math.round((vu.camera.video.offsetHeight - vu.face.ui.gestures.videoContainer.offsetHeight)/2)

        vu.face.ui.gestures.boxCenterPoint.style.right    = Math.round((bleft + (bwidth / 2)) - fixX) - 5 + "px";
        vu.face.ui.gestures.boxCenterPoint.style.top = Math.round((btop + (bheight / 2)) - fixY) - 5 + "px";
        vu.face.ui.gestures.boxCenterPoint.style.display = 'block'

        vu.face.ui.gestures.box.style.right = bleft - fixX + "px";
        vu.face.ui.gestures.box.style.top = btop - fixY + "px";
        vu.face.ui.gestures.box.style.width = bwidth + "px";
        vu.face.ui.gestures.box.style.height = bheight + "px";
        vu.face.ui.gestures.box.style.display = 'block'
    } catch(error) {
        console.log(error)
        vu.face.ui.gestures.box.style.display = 'none'
    }
}
