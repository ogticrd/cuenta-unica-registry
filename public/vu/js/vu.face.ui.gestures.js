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

vu.face.ui.gestures.allChallenges = ['smile', 'eyeClose', 'eyeRightClose', 'eyeLeftClose', 'lookLeft', 'lookRight']
// none
vu.face.gestures.permisiveNeutralChallenge = true

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

vu.face.ui.gestures.beep = function () {
    var snd = new Audio("data:audio/mp3;base64,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");
    snd.play();
};

vu.face.gestures.circleActiveColor = '#1DC600';
vu.face.gestures.circleDetectedColor = '#88898a';
vu.face.gestures.circleInactiveColor = '#000000';
vu.face.gestures.backGroundColor = 'none';
vu.face.gestures.backGroundOpacity = '1';
vu.face.gestures.lineWidth = 13;
vu.face.gestures.backgroundSize = 110;

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
        vu.face.ui.gestures.circle.style.backgroundSize = vu.face.gestures.backgroundSize + '%';
        vu.face.ui.gestures.circle.style.backgroundRepeatY = 'repeat';
    }
    if (vu.face.gestures.method == vu.face.ui.gestures.elipseSvg2) {
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
vu.face.ui.gestures.resultsFeedbackTimeFrame = 2000;//1000;
vu.face.ui.gestures.resultsValidateTimeFrame = 4000;//2500;
vu.face.ui.gestures.resultsFeedbackPercentual = 50; // Si el X% de los resultados en el tiempo de resultsFeedbackTimeFrame es positivo, se considera que se tiene que mostrar el feedback
vu.face.ui.gestures.resultsValidatePercentual = 50; // Si el X% de los resultados en el tiempo de resultsValidateTimeFrame es positivo, se considera que se tiene que mostrar el feedback

vu.face.ui.gestures.doLoop = function() {
    data = vu.face.getData();

    if (typeof JEEFACETRANSFERAPI.is_detected == "undefined") {
        vu.face.load(vu.camera.video).then(
            challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
        )
    } else {
        challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
    }
    //console.log(vu.face.ui.gestures.challenges)

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
        console.log("Información de arreglo gestos" + data);

        timeNow = Date.now()
        vu.face.ui.gestures.results.push([gestureMach,timeNow]);

        /* Limpiamos el array de resultados para solo guardar los que necesitamos para la validacion de gestops */
        cleanResultArray = [];
        for (i = 0; i < vu.face.ui.gestures.results.length; i++) {
            if ((timeNow - vu.face.ui.gestures.results[i][1]) < vu.face.ui.gestures.resultsValidateTimeFrame){
                cleanResultArray.push(vu.face.ui.gestures.results[i]);
            }
        }
        vu.face.ui.gestures.results = cleanResultArray;

        /* Separamos solos los resultados que necesitamos para mostrar el feedback */
        feedbackArray = [];
        for (i = 0; i < vu.face.ui.gestures.results.length; i++) {
            if ((timeNow - vu.face.ui.gestures.results[i][1]) < vu.face.ui.gestures.resultsFeedbackTimeFrame){
                feedbackArray.push(vu.face.ui.gestures.results[i]);
            }
        }

        /* Evaluamos si se tiene que mostrar el feedback */
        showFeedback = false;
        countTrue = 0
        for (i = 0; i < feedbackArray.length; i++) {
             if (feedbackArray[i][0] === true){
                 countTrue = countTrue + 1
             }
        }
        if (((countTrue*100)/feedbackArray.length) > vu.face.ui.gestures.resultsFeedbackPercentual){
            showFeedback = true
        }
        //console.log(countTrue,vu.face.ui.gestures.results.length)

        //console.log('Ch', challenge, 'Ag', actualGesture, gestureMach)
        if (showFeedback){
            vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleActive;
        } else {
            vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleDetected;
        }
    } else {
        /* Si no hay rostro, se limpian los resultados */
        vu.face.ui.gestures.results = [];
        vu.face.ui.gestures.circle.style.backgroundImage = vu.face.ui.gestures.circleInactive;
    }

    if (vu.face.ui.gestures.loop == true) {
        setTimeout(function () {
            promise = vu.face.ui.gestures.doLoop()
        }, 100);
    }
};

vu.face.ui.gestures.gestureMach = function(data) {
    actualGesture = data[2]
    gestureMach = false
    x = data[1][0]
    y = data[1][1]

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
    if (challenge === 'none') {
        left = false;
        right = false;
        center = false;
        smile = false;
        if (actualGesture.indexOf('eyeLeftClose') < 0) { left = true }
        if (actualGesture.indexOf('eyeRightClose') < 0) { right = true }
        if (actualGesture.indexOf('smileRight') < 0 && actualGesture.indexOf('smileLeft') < 0) { smile = true}
        if (x === 'center') { center = true }
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
        vu.camera.config.previewResolution = 'lowest'
        vu.camera.config.pictureResolution = 'lowest';
        vu.camera.config.pictureLessBlurry = false;
        pro = vu.face.ui.gestures.challengeDoLoop()
        vu.face.ui.gestures.challengeResolve = resolve
    });
    return promise
};

vu.face.ui.gestures.challengeStop = function() {
    vu.sop.ui.hideBottomText();
    vu.face.ui.gestures.challengeLoop = false;
};

vu.face.ui.gestures.challengeDoLoop = async function() {
    challenge = vu.face.ui.gestures.challenges[vu.face.ui.gestures.challengeNum]
    takePhoto = false;
    timeNow = Date.now()
    /* Evaluamos si hay suficientes resultados para sacar la foto */
    if (vu.face.ui.gestures.results.length > 2){
        if (( timeNow - vu.face.ui.gestures.results[0][1]) > vu.face.ui.gestures.resultsFeedbackTimeFrame ) {
            /* Evaluamos si se tiene que sacar la foto */
            countTrue = 0
            for (i = 0; i < vu.face.ui.gestures.results.length; i++) {
                 if (vu.face.ui.gestures.results[i][0] === true){
                     countTrue = countTrue + 1
                 }
            }
            if (((countTrue*100)/vu.face.ui.gestures.results.length) > vu.face.ui.gestures.resultsValidatePercentual){
                takePhoto = true
            }
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
        }, 100);
    }
};
