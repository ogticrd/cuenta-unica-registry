if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.document == "undefined") { vu.sop.document = function() {} }

if (typeof vu.sop.document.face == "undefined") { vu.sop.document.face = function() {} }

vu.sop.document.face.cascadeUrl = 'js/libs/pico/facefinder.txt'

vu.sop.document.face.loaded = false

vu.sop.document.face.faceFinderClassifyRegion = function(r, c, s, pixels, ldim) {return -1.0;};

vu.sop.document.face.rgba2grayscale	= function(rgba, nrows, ncols) {
    var gray = new Uint8Array(nrows*ncols);
    for(var r=0; r<nrows; ++r)
        for(var c=0; c<ncols; ++c)
            // gray = 0.2*red + 0.7*green + 0.1*blue
            gray[r*ncols + c] = (2*rgba[r*4*ncols+4*c+0]+7*rgba[r*4*ncols+4*c+1]+1*rgba[r*4*ncols+4*c+2])/10;
    return gray;
}

vu.sop.document.face.preLoad = async function () {
    let promise = new Promise(function (resolve, reject) {
        if (!vu.sop.document.face.loaded) {
            fetch(vu.sop.document.face.cascadeUrl).then(function (response) {
                response.arrayBuffer().then(function (buffer) {
                    var bytes = new Int8Array(buffer);
                    vu.sop.document.face.faceFinderClassifyRegion = pico.unpack_cascade(bytes);
                    vu.sop.document.face.loaded = true
                    console.log('Face cascade loaded');
                    resolve(true);
                })
            })
        } else {
            resolve(true);
        }
    })
    return promise;
}

vu.sop.document.face.getImg = async function(img) {
    canvas = document.getElementById('vu.sop.ui.documentFace')
    ctx = canvas.getContext('2d')
    //cHeight=360
    //cWidth=480
    cHeight=Math.round(vu.camera.video.videoHeight * 360 / vu.camera.video.videoWidth)
    cWidth=360

    rgba = ctx.getImageData(0, 0, cWidth, cHeight).data;
    image = {
        "pixels": vu.sop.document.face.rgba2grayscale(rgba, cHeight, cWidth),
        "nrows": cHeight,
        "ncols": cWidth,
        "ldim": cWidth
    }
    params = {
        "shiftfactor": 0.1, // move the detection window by 10% of its size
        "minsize": 20,      // minimum size of a face (not suitable for real-time detection, set it to 100 in that case)
        "maxsize": 1000,    // maximum size of a face
        "scalefactor": 1.1  // for multiscale processing: resize the detection window by 10% when moving to the higher scale
    }
    dets = pico.run_cascade(image, vu.sop.document.face.faceFinderClassifyRegion, params);
    dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2
    qthresh = 5.0
    bigFace = 0
    bigFaceDet = 0
    for( i=0; i < dets.length; ++i) {
        if(dets[i][3]>qthresh)
        {
            //console.log(dets[i])
            ctx.beginPath();
            if (bigFace < dets[i][2]){
                bigFace = dets[i][2]
                bigFaceDet = dets[i]
            }
        }
    }
    if ( dets.length >= 1) {
        heightScale = img.height / cHeight ;
        widthScale = img.width / cWidth ;

        canvas.width = bigFaceDet[2] * widthScale;
        canvas.height = (bigFaceDet[2]* 1.5) * heightScale;
        dx = bigFaceDet[1] - (bigFaceDet[2]/2);
        dy = bigFaceDet[0] - (bigFaceDet[2]/2 * 1.5);
        dWidth = bigFaceDet[2];
        dHeight = bigFaceDet[2]* 1.5;

        ctx.drawImage(img,
                    dx * widthScale,
                    dy * heightScale,
                    dWidth * widthScale,
                    dHeight * heightScale,
                    0,
                    0,
                    dWidth * widthScale,
                    dHeight * heightScale
            )
        return canvas.toDataURL('image/jpeg', 0.9);
    }
    return null
}

vu.sop.document.face.do = async function(imgData) {
    //console.log(imgData)
    canvas = document.getElementById('vu.sop.ui.documentFace')
    var ctx = canvas.getContext('2d');

    cHeight=Math.round(vu.camera.video.videoHeight * 360 / vu.camera.video.videoWidth)
    cWidth=360

    canvas.width = cWidth;
    canvas.height = cHeight;

    let img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, cWidth, cHeight);
    };
    img.src = imgData;

    await vu.sop.document.face.sleep('200')
    faceImgData = await vu.sop.document.face.getImg(img);
    return faceImgData
}


vu.sop.document.face.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};
