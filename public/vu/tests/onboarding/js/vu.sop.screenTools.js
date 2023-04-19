if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.screenTools == "undefined") { vu.sop.screenTools = function() {} }


vu.sop.screenTools.videoDivId = "vu.sop.ui.videoContainer";
vu.sop.screenTools.width = 640;
vu.sop.screenTools.height = 480;

vu.sop.screenTools.isVideoVertical = function() {
    if (typeof vu.camera.video.videoWidth !== 'undefined') {
        if (vu.camera.video.videoWidth > vu.camera.video.videoHeight) {
            return true
        } else {
            return false
        }
    } else {
        return null;
    }
};





/*
// WIP - TODO
vu.sop.screenTools.goWindow = function() {
    console.log("Windows Mode")
    let div = document.getElementById("vu.sop");
    div.style.width = vu.sop.screenTools.width;
    div.style.height = vu.sop.screenTools.height;
};



vu.sop.screenTools.goFullScreen = function() {
    console.log("Fullscreen Mode")
    let div = document.getElementById("vu.sop");
    div.style.width = "100vw";
    div.style.height = "100vh";

    if (document.body.contains(document.getElementById("vu.sop.document.ui.background"))) {
        docDiv = document.getElementById("vu.sop.document.ui.background");
    }

    invert = false;
    if (typeof vu.camera.video !== 'undefined') {
        if (vu.camera.video.videoHeight > vu.camera.video.videoWidth) {
            invert = true;
            vu.sop.screenTools.width = vu.camera.video.videoHeight;
            vu.sop.screenTools.height = vu.camera.video.videoWidth;
        } else {
            vu.sop.screenTools.width = vu.camera.video.videoWidth;
            vu.sop.screenTools.height = vu.camera.video.videoHeight;
        }
    }

    let videoDiv = document.getElementById("vu.sop.ui.video");
    if (!invert) {
        wscale = div.clientWidth / parseInt(vu.sop.screenTools.width);
        hscale = div.clientHeight / parseInt(vu.sop.screenTools.height);
    } else {
        // VERTICAL VIDEO
        wscale = div.clientWidth / parseInt(vu.sop.screenTools.height);
        hscale = div.clientHeight / parseInt(vu.sop.screenTools.width);
    }


    if (document.body.contains(document.getElementById("vu.sop.document.ui.background"))) {
        docDiv = document.getElementById("vu.sop.document.ui.background");
    }

    if ( wscale < hscale) {
        if (!invert) {
            videoDiv.style.maxHeight = (parseInt(vu.sop.screenTools.height) * wscale) + "px";
            videoDiv.style.maxWidth = (parseInt(vu.sop.screenTools.width) * wscale) + "px";

            if (typeof docDiv !== 'undefined') {
                docDiv.style.maxHeight = (parseInt(vu.sop.screenTools.height) * wscale) + "px";
                docDiv.style.maxWidth = (parseInt(vu.sop.screenTools.width) * wscale) + "px";
            }
        } else {
            // VERTICAL VIDEO
            docDiv.style.transform = 'translateX(-50%) translateY(-50%)';
            videoDiv.style.maxHeight = (parseInt(vu.sop.screenTools.width) * wscale) + "px";
            videoDiv.style.maxWidth = (parseInt(vu.sop.screenTools.height) * wscale) + "px";

            if (typeof docDiv !== 'undefined') {
                //console.log("wscale",wscale)
                docDiv.style.transform = 'translateX(-50%) translateY(-50%) rotate(90deg)';
                docDiv.style.height = (parseInt(vu.sop.screenTools.height) * wscale) + "px";
                docDiv.style.width = (parseInt(vu.sop.screenTools.width) * wscale) + "px";
                docDiv.style.maxHeight = "none";
                docDiv.style.maxWidth = "none";
            }
        }

    } else {
        if (!invert) {
            videoDiv.style.maxHeight = (parseInt(vu.sop.screenTools.height) * hscale) + "px";
            videoDiv.style.maxWidth = (parseInt(vu.sop.screenTools.width) * hscale) + "px";

            if (typeof docDiv !== 'undefined') {
                docDiv.style.transform = 'translateX(-50%) translateY(-50%)';
                docDiv.style.maxHeight = (parseInt(vu.sop.screenTools.height) * hscale) + "px";
                docDiv.style.maxWidth = (parseInt(vu.sop.screenTools.width) * hscale) + "px";
            }
        } else {
            // VERTICAL VIDEO
            videoDiv.style.maxHeight = (parseInt(vu.sop.screenTools.width) * hscale) + "px";
            videoDiv.style.maxWidth = (parseInt(vu.sop.screenTools.height) * hscale) + "px";

            if (typeof docDiv !== 'undefined') {
                //console.log("hscale",hscale)
                docDiv.style.transform = 'translateX(-50%) translateY(-50%) rotate(90deg)';
                docDiv.style.height = (parseInt(vu.sop.screenTools.width) * hscale) + "px";
                docDiv.style.width = (parseInt(vu.sop.screenTools.height) * hscale) + "px";
                docDiv.style.maxHeight = "none";
                docDiv.style.maxWidth = "none";
            }
        }
    }
};

*/
