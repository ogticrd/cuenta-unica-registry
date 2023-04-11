if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.face.ui == "undefined") { vu.face.ui = function() {} }

//---------------------------------------------------
// FACE
//---------------------------------------------------

if (typeof vu.face == "undefined") { vu.face = function() {} }

if (typeof vu.face.ui == "undefined") { vu.face.ui = function() {} }

vu.face.ui.loop = false

vu.face.ui.starSvg = function(color) { return "url('data:image/svg+xml;base64," +  btoa('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">' +
'<style type="text/css">.st0{fill:'+color+';}</style><g id="Layer_1"><path class="st0"' +
' d="m 507.80497,263.6018 -52.5396,62.69019 c -3.63142,4.333 -11.50349,4.333 -15.09627,0 l -0.36941,-0.46593 c -3.52934,-4.45149 -1.73618,-11.21455 1.89523,-15.50145 l 45.98275,-54.51299 -45.5472,-54.94611 c -3.61146,-4.35669 -5.63142,-11.33955 -2,-15.62645 v 0 c 3.63141,-4.333 11.50348,-4.333 15.09627,0 l 52.53959,62.69019 c 3.67005,4.333 3.67005,11.33955 0.0386,15.67255 z"' +
'/></g></svg>') +"')"}

vu.face.ui.circleSvg = function(color) { return "url('data:image/svg+xml;base64," +  btoa('<?xml version="1.0" encoding="utf-8"?><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 400 400" style="enable-background:new 0 0 400 400;" xml:space="preserve">' +
'<style type="text/css">.st0{fill:'+color+';}</style><g id="Layer_1"><path class="st0"' +
'   transform="rotate(-157.76036,198.89912,199.17002)"'+
'        d="M 48.29569,327.37072 C 20.683192,294.30809 3.6837793,255.79508 2.9763579,211.63205 c 0.245377,-8.41318 16.0066581,-6.42993 16.0162551,1.88523 1.827925,38.65477 15.395089,69.72809 40.511369,101.45314 8.569597,8.38801 -5.054379,19.56838 -11.208292,12.4003 z"'+
'/></g></svg>') +"')"}

vu.face.ui.circleActive = vu.face.ui.circleSvg('#1DC600');
vu.face.ui.circleDetected = vu.face.ui.circleSvg('#88898a');
vu.face.ui.circleInactive = vu.face.ui.circleSvg('#000000');

vu.face.ui.eLeft = document.getElementById("vu.sop.ui.faceCircleLeft");
vu.face.ui.eLeftTop = document.getElementById("vu.sop.ui.faceCircleLeftTop");
vu.face.ui.eTop = document.getElementById("vu.sop.ui.faceCircleTop");
vu.face.ui.eRightTop = document.getElementById("vu.sop.ui.faceCircleRightTop");
vu.face.ui.eRight = document.getElementById("vu.sop.ui.faceCircleRight");
vu.face.ui.eRightBottom = document.getElementById("vu.sop.ui.faceCircleRightBottom");
vu.face.ui.eBottom = document.getElementById("vu.sop.ui.faceCircleBottom");
vu.face.ui.eLeftBottom = document.getElementById("vu.sop.ui.faceCircleLeftBottom");
var gesturesType = [];
gesturesType.push("SS");
gesturesType.push("SCE");
gesturesType.push("SBL");
gesturesType.push("SBR");
gesturesType.push("SML");
gesturesType.push("SMR");
vu.face.ui.picturesTags = [];


vu.face.ui.start = function() {
    vu.face.ui.eLeft = document.getElementById("vu.sop.ui.faceCircleLeft");
    vu.face.ui.eLeftTop = document.getElementById("vu.sop.ui.faceCircleLeftTop");
    vu.face.ui.eTop = document.getElementById("vu.sop.ui.faceCircleTop");
    vu.face.ui.eRightTop = document.getElementById("vu.sop.ui.faceCircleRightTop");
    vu.face.ui.eRight = document.getElementById("vu.sop.ui.faceCircleRight");
    vu.face.ui.eRightBottom = document.getElementById("vu.sop.ui.faceCircleRightBottom");
    vu.face.ui.eBottom = document.getElementById("vu.sop.ui.faceCircleBottom");
    vu.face.ui.eLeftBottom = document.getElementById("vu.sop.ui.faceCircleLeftBottom");
    
    vu.sop.ui.show("vu.sop.ui.faceCircleLeft");
    vu.sop.ui.show("vu.sop.ui.faceCircleLeftTop");
    vu.sop.ui.show("vu.sop.ui.faceCircleTop");
    vu.sop.ui.show("vu.sop.ui.faceCircleRightTop");
    vu.sop.ui.show("vu.sop.ui.faceCircleRight");
    vu.sop.ui.show("vu.sop.ui.faceCircleRightBottom");
    vu.sop.ui.show("vu.sop.ui.faceCircleBottom");
    vu.sop.ui.show("vu.sop.ui.faceCircleLeftBottom");

    vu.face.ui.loop = true
    vu.face.start()
    vu.face.ui.doLoop()
    return true
}


vu.face.ui.stop = function() {
    vu.face.ui.loop = false
    vu.sop.ui.hide("vu.sop.ui.faceCircleLeft");
    vu.sop.ui.hide("vu.sop.ui.faceCircleLeftTop");
    vu.sop.ui.hide("vu.sop.ui.faceCircleTop");
    vu.sop.ui.hide("vu.sop.ui.faceCircleRightTop");
    vu.sop.ui.hide("vu.sop.ui.faceCircleRight");
    vu.sop.ui.hide("vu.sop.ui.faceCircleRightBottom");
    vu.sop.ui.hide("vu.sop.ui.faceCircleBottom");
    vu.sop.ui.hide("vu.sop.ui.faceCircleLeftBottom");
}

vu.face.ui.doLoop = function() {
    data = vu.face.getData();

    eLeft = vu.face.ui.eLeft;
    eLeftTop = vu.face.ui.eLeftTop;
    eTop = vu.face.ui.eTop;
    eRightTop = vu.face.ui.eRightTop;
    eRight = vu.face.ui.eRight;
    eRightBottom = vu.face.ui.eRightBottom;
    eBottom = vu.face.ui.eBottom;
    eLeftBottom = vu.face.ui.eLeftBottom;

    if (data[0] == true) {
        x = data[1][0]
        y = data[1][1]
        //console.log('loop', x, y)
        if (x == 'center' && y == 'center') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'left' && y === 'center') {
            eLeft.style.backgroundImage = vu.face.ui.circleActive;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'left' && y === 'up') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleActive;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'center' && y === 'up') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleActive;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'right' && y === 'up') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleActive;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'right' && y === 'center') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleActive;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'right' && y === 'down') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleActive;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'center' && y === 'down') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleActive;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleDetected;
        }
        if (x === 'left' && y === 'down') {
            eLeft.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftTop.style.backgroundImage = vu.face.ui.circleDetected;
            eTop.style.backgroundImage =  vu.face.ui.circleDetected;
            eRightTop.style.backgroundImage = vu.face.ui.circleDetected;
            eRight.style.backgroundImage = vu.face.ui.circleDetected;
            eRightBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eBottom.style.backgroundImage = vu.face.ui.circleDetected;
            eLeftBottom.style.backgroundImage = vu.face.ui.circleActive;
        }
    } else {
        eLeft.style.backgroundImage = vu.face.ui.circleInactive;
        eLeftTop.style.backgroundImage = vu.face.ui.circleInactive;
        eTop.style.backgroundImage =  vu.face.ui.circleInactive;
        eRightTop.style.backgroundImage = vu.face.ui.circleInactive;
        eRight.style.backgroundImage = vu.face.ui.circleInactive;
        eRightBottom.style.backgroundImage = vu.face.ui.circleInactive;
        eBottom.style.backgroundImage = vu.face.ui.circleInactive;
        eLeftBottom.style.backgroundImage = vu.face.ui.circleInactive;
    }

    if (vu.face.ui.loop == true) {
        setTimeout(function () {
            promise = vu.face.ui.doLoop()
        }, 25);
    }
}

//---------------------------------------------------
// FACE - Gestures
//---------------------------------------------------


vu.face.ui.pointSvg = function(color) { return "url('data:image/svg+xml;base64," +
    btoa( '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" class="svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="'+color+'" d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8z"></path></svg>') +"')"}


vu.face.ui.arrowSvg = function(color, rotation) { return "url('data:image/svg+xml;base64," +
    btoa( '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="circle" class="svg-inline--fa fa-circle fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g transform="rotate('+rotation+' 256 256)" ><path fill="'+color+'" d="M8 256C8 119 119 8 256 8s248 111 248 248-111 248-248 248S8 393 8 256zm143.6 28.9l72.4-75.5V392c0 13.3 10.7 24 24 24h16c13.3 0 24-10.7 24-24V209.4l72.4 75.5c9.3 9.7 24.8 9.9 34.3.4l10.9-11c9.4-9.4 9.4-24.6 0-33.9L273 107.7c-9.4-9.4-24.6-9.4-33.9 0L106.3 240.4c-9.4 9.4-9.4 24.6 0 33.9l10.9 11c9.6 9.5 25.1 9.3 34.4-.4z"></path></g></svg>') +"')"}



vu.face.ui.faceDotColor = '#1DC600';


vu.face.ui.faceDotObserver = new ResizeObserver(entries => {
    height = vu.face.ui.faceDot.clientHeight
    vidWidth = document.getElementById('vu.sop.ui.videoContainer').clientWidth
    vu.face.ui.faceDot.style.width = height + "px"
    vu.face.ui.faceDot.style.left = (vidWidth - height)/2 + "px"
});

vu.face.ui.showFaceDot = function() {
    vu.face.ui.faceDot = document.getElementById("vu.sop.ui.faceDot");
    vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.pointSvg(vu.face.ui.faceDotColor);

    // TODO Center whit CSS (ugly fix)
    vu.sop.ui.show("vu.sop.ui.faceDot")
    /* height = vu.face.ui.faceDot.clientHeight
    vidWidth = document.getElementById('vu.sop.ui.videoContainer').clientWidth
    vu.face.ui.faceDot.style.width = height + "px"
    vu.face.ui.faceDot.style.left = (vidWidth - height)/2 + "px"*/
    vu.face.ui.faceDotObserver.observe(document.getElementById('vu.sop.ui.videoContainer'));
}

vu.face.ui.hideFaceDot = function() {
	vu.sop.ui.hide("vu.sop.ui.faceDot")
}

vu.face.ui.moveDot = function(x, y) {
    if (x == 'center' && y == 'center') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.pointSvg(vu.face.ui.faceDotColor);
        //vu.face.ui.faceDot.style.transform = 'rotate(0deg)';
        vu.face.ui.faceDot.style.backgroundPosition = '50% 50%';
    }
    if (x === 'left' && y === 'center') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 270);
        vu.face.ui.faceDot.style.backgroundPosition = '15% 50%'; // OK
    }
    if (x === 'left' && y === 'up') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 315);
        vu.face.ui.faceDot.style.backgroundPosition = '25% 25%'; //
    }
    if (x === 'center' && y === 'up') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 0);
        vu.face.ui.faceDot.style.backgroundPosition = '50% 15%'; // OK
    }
    if (x === 'right' && y === 'up') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 45);
        vu.face.ui.faceDot.style.backgroundPosition = '75% 25%'; //
    }
    if (x === 'right' && y === 'center') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 90);
        vu.face.ui.faceDot.style.backgroundPosition = '85% 50%'; // OK
    }
    if (x === 'right' && y === 'down') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 135);
        vu.face.ui.faceDot.style.backgroundPosition = '75% 75%'; //
    }
    if (x === 'center' && y === 'down') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 180);
        vu.face.ui.faceDot.style.backgroundPosition = '50% 85%'; // OK
    }
    if (x === 'left' && y === 'down') {
        vu.face.ui.faceDot.style.backgroundImage = vu.face.ui.arrowSvg(vu.face.ui.faceDotColor, 225);
        vu.face.ui.faceDot.style.backgroundPosition = '25% 75%'; //
    }
}

vu.face.ui.genChallenge = function() {
    x = ['left', 'center', 'right'];
    y = ['up', 'center', 'down'];
    xr = x[Math.floor(Math.random() * x.length)];
    yr = y[Math.floor(Math.random() * y.length)];
    return [xr, yr]
}

vu.face.ui.numOfChallenges = 3;

vu.face.ui.challenges = [];
vu.face.ui.challengeNum = 0
vu.face.ui.challengeValidaXTimes = 4
vu.face.ui.challengeLoopTime = 200
vu.face.ui.challengeLoop = false
vu.face.ui.pictures = []

vu.face.ui.genChallenges = function() {
    vu.face.ui.challenges = [];
    vu.face.ui.challenges.push(vu.face.ui.genChallenge())
    var i;
    for (i = 1; i < vu.face.ui.numOfChallenges; i++) {
        cha = vu.face.ui.genChallenge();
        while (cha === vu.face.ui.challenges[i-1]) {
            cha = vu.face.ui.genChallenge()
        }
        vu.face.ui.challenges.push(cha);
    }
    vu.face.ui.challenges.splice(-1,1)
    vu.face.ui.challenges.push(['center','center']);
    return vu.face.ui.challenges
};

vu.face.ui.challengeResolve = null;

vu.face.ui.challengeStart = function() {
    let promise = new Promise(function (resolve, reject) {
        vu.face.ui.genChallenges();
        vu.face.ui.challengeLoop = true
        vu.face.ui.showFaceDot()
        vu.sop.audio.play('vu.sop.audio.facePoint');
        vu.sop.ui.showBottomText(vu.sop.msg.facePoint)
        vu.camera.config.orientation = 'user'
        vu.camera.config.previewResolution = 'lowest'
        vu.camera.config.pictureResolution = 'lowest';
        vu.camera.config.pictureLessBlurry = false;
        pro = vu.face.ui.challengeDoLoop()
        vu.face.ui.challengeResolve = resolve
    });
    return promise
};

vu.face.ui.challengeStop = function() {
    vu.sop.ui.hideBottomText()
    vu.face.ui.hideFaceDot()
    vu.face.ui.genChallenges();
    vu.face.ui.challengeLoop = false
    vu.face.ui.challengeNum = 0
};

vu.face.ui.challengeValidaXTimesCounter = 0
vu.face.ui.lastChallengeNum = 9999
vu.face.ui.challengeDoLoop = async function() {
    challenge = vu.face.ui.challenges[vu.face.ui.challengeNum]
    if ( vu.face.ui.lastChallengeNum !== vu.face.ui.challengeNum) {
        vu.face.ui.moveDot(challenge[0], challenge[1])
        vu.face.ui.lastChallengeNum = vu.face.ui.challengeNum
    }
    data = vu.face.getData();
    x = data[1][0];
    y = data[1][1];
    if (data[0] == true) {
        if (challenge[0] === x && challenge[1] === y) {
            vu.face.ui.challengeValidaXTimesCounter  = vu.face.ui.challengeValidaXTimesCounter + 1
            if (vu.face.ui.challengeValidaXTimesCounter === vu.face.ui.challengeValidaXTimes ) {
                vu.face.ui.pictures.push(await vu.camera.takePicture())
                vu.face.ui.challengeNum = vu.face.ui.challengeNum + 1
                vu.face.ui.challengeValidaXTimesCounter = 0

                if (challenge[0] == 'center' && challenge[1] == 'center') {
                    vu.face.ui.picturesTags.push("SN");
                }
                else{
                    var random = gesturesType[(Math.random() * gesturesType.length) | 0];
                    gesturesType = gesturesType.filter(item => item !== random);
                    vu.face.ui.picturesTags.push(random);
                }

            }
            //console.log("face.ui.challenge", vu.face.ui.challengeNum, vu.face.ui.challengeValidaXTimesCounter )
        } else {
            vu.face.ui.challengeValidaXTimesCounter = 0
        }

        if (vu.face.ui.challengeNum == vu.face.ui.numOfChallenges) {
            //console.log('stop', vu.face.ui.challengeNum)
            vu.face.ui.challengeStop()
            vu.face.ui.stop()
            vu.face.ui.challengeResolve(vu.face.ui.pictures)
        }
    }
    if (vu.face.ui.challengeLoop == true) {
        setTimeout(function () {
            promise = vu.face.ui.challengeDoLoop()
        }, vu.face.ui.challengeLoopTime);
    }
};

//---------------------------------------------------
// FACE - Progress Bar
//---------------------------------------------------

vu.face.ui.progress = function(color) { return "url('data:image/svg+xml;base64," +
    btoa( '<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="window-minimize" class="svg-inline--fa fa-window-minimize fa-w-16" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="m 237.42373,52.372881 -80,407.999999 c -5.09898,26.00481 21.5,48 48,48 h 32 c 26.5,0 42.90102,-21.99519 48,-48 l 80,-407.999999 c 5.09898,-26.004814 -21.5,-47.9999996 -48,-47.9999996 h -32 c -26.5,0 -42.90102,21.9951856 -48,47.9999996 z"></path></svg>') +"')"}
