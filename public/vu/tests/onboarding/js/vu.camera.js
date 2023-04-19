if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.camera == "undefined") { vu.camera = function() {} }

vu.camera.video;                        // Video Element
vu.camera.stream;                       // Video Stream
vu.camera.track;                        // Video track
vu.camera.devices = null;
vu.camera.videoinput = [];
/**
 * pictureFormat: 'jpg'         // png or jpg
 * pictureResolution: 'highest' // highest or preview
 * pictureLessBlurry: 3         // Int or False
 * responseType: 'dataUrl'      // dataUlr, base64 or canvas
 * jpegCompression: 0.85        // from 0.1 to 1.0
 * orientation: 'user'          // environment or user
 * contrast: 'low'              // highest high medium low lowest int or default
 * brightness: 'high'           // highest high medium low lowest int or default
 * sharpness: 'high'            // highest high medium low lowest int or default
 * saturation: 'medium'         // highest high medium low lowest int or default
 * iso: 'medium'                // highest high medium low lowest int or default
 * previewResolution: 'highest' // highest or lowest
 * resolutionConstraints:       // Resolutions to try.
 */
vu.camera.config = {
    pictureFormat: 'jpg',
    pictureResolution: 'highest',
    takePictureLessBlurry: false,
    pictureLessBlurryBurst: 1,
    pictureForceLandscape: false,
    pictureForceLandscapeRotateClockwise: false,
    pictureFlashEffect: false,
    pictureFlashDivId: "vu.sop.ui.flash",
    jpegCompression: 0.95,
    responseType: 'dataUrl',
    orientation: 'user',
    contrast: 'default',
    brightness: 'default',
    sharpness: 'default',
    saturation: 'default',
    iso: 'default',
    zoom: 'default',
    fakeZoom: 'default',
    previewResolution: 'lowest',
    minimumResolutionInHighestPreviewResolution: 700,
    minimumResolutionInLowestPreviewResolution: 340,
    resolutionConstraints: [
        //{video: {width: {exact: 4032}, height: {exact: 3200}}},
        //{video: {width: {exact: 3200}, height: {exact: 2400}}},
        //{video: {width: {exact: 2650}, height: {exact: 2048}}},
        //{video: {width: {exact: 2592}, height: {exact: 1944}}},
        //{video: {width: {exact: 2048}, height: {exact: 1536}}},
        /*{video: {width: {exact: 1920}, height: {exact: 1080}}},
        {video: {width: {exact: 1600}, height: {exact: 1200}}},
        {video: {width: {exact: 1280}, height: {exact: 720}}},
        {video: {width: {exact: 800}, height: {exact: 600}}},
        {video: {width: {exact: 640}, height: {exact: 480}}},
        {video: {width: {exact: 320}, height: {exact: 240}}}*/
        {video: {width: {ideal: 1920}, height: {ideal: 1080}}},
        {video: {width: {ideal: 1600}, height: {ideal: 1200}}},
        {video: {width: {ideal: 1280}, height: {ideal: 720}}},
        //{video: {width: {ideal: 800}, height: {ideal: 600}}},
        //{video: {width: {ideal: 640}, height: {ideal: 480}}},
        //{video: {width: {ideal: 640}, height: {ideal: 360}}}
        //{video: {width: {ideal: 640}, height: {ideal: 360}}},
        //{video: {width: {ideal: 320}, height: {ideal: 240}}}
    ]
};


/**
 * Webgl filters val and range
 */
vu.camera.cssValues = {
    brightness: {
        default: 100,
        val: 100,
        max: 200,
        min: 0
    },
    contrast: {
        default: 100,
        val: 100,
        max: 200,
        min: 0
    },
    saturation: {
        default: 100,
        val: 100,
        max: 200,
        min: 0
    },
    zoom: {
        default: 1,
        val: 1,
        max: 3,
        min: 1
    },
};

vu.camera.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

vu.camera.isVerticalVideo = function() {
    if ( vu.camera.video.videoWidth < vu.camera.video.videoHeight) {
        return true
    } else {
        return false
    }
};

/**
 * Return a array of values (example, min = 1, max = 5, returns = [1,2,3,4,5])
 *
 * @param min min value of range
 * @param max max value of range
 * @returns {Array} array range
 */
vu.camera.getRange = function (min, max) {
    var range = [];
    for (i = min; i <= max; i++) {
        range.push(i);
    }
    return range;
};

/**
 * Example range = [1,2,3,4,5], returns 4
 *
 * @param range
 * @returns {*}
 */
vu.camera.getHighValueOfRange = function (range) {
    return range[Math.round((range.length) * 0.75) - 1];
};

/**
 * Example range = [1,2,3,4,5], returns 3
 *
 * @param range
 * @returns {*}
 */
vu.camera.getMediumValueOfRange = function (range) {
    return range[Math.round((range.length) * 0.5) - 1];
};

/**
 * Example range = [1,2,3,4,5], returns 2
 *
 * @param range
 * @returns {*}
 */
vu.camera.getLowValueOfRange = function (range) {
    return range[Math.round((range.length) * 0.25) - 1];
};

/**
 * Set the video Stream and set the max resolution available
 *
 * @returns {true or Error}
 *      Error('denied') No camera or camera access denied
 */
vu.camera.setMaxResolution = async function () {
    if (vu.camera.stream) {
        vu.camera.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    //** **//
    vu.camera.stream = null;
    const cameraId = '';

    for (i = 0; i < vu.camera.config.resolutionConstraints.length; i++) {
        let constraints = vu.camera.config.resolutionConstraints[i];
        console.log(constraints)
        //Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
        if(vu.camera.config.orientation != 'user'){
            vu.camera.devices = await navigator.mediaDevices.enumerateDevices();
            console.log(vu.camera.devices);
            let count = 0;
              vu.camera.devices.forEach(mediaDevice => {
                count++;
                if (mediaDevice.kind === 'videoinput') {
                    vu.camera.videoinput.push(mediaDevice);
                }
                if(vu.camera.devices.length === count){
                    if(vu.camera.videoinput <= 2 || vu.camera.devices.length <= 2){
                        Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
                    }else{
                        for (i = 0; i < vu.camera.videoinput.length; i++) {
                            if(vu.camera.videoinput[i].label.includes('0, facing back')){
                                Object.assign(constraints.video, {deviceId: { exact: vu.camera.videoinput[i].deviceId }});
                                break;
                            }
                        }
                    }
                }else{
                    Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
                }
              });
        }else{
            Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
        }
        Object.assign(constraints.video, {resizeMode: {exact: 'none'}});
        try {
            vu.camera.stream = await navigator.mediaDevices.getUserMedia(constraints);
            vu.camera.config.maxResolutionConstrains = constraints;
            console.log("Camera Orientation", vu.camera.config.orientation, i , " || Max Resolution", constraints)
            return true
        } catch (error) {
            console.error(vu.camera.config.resolutionConstraints[i], error);
        }
        if (vu.camera.stream != null) {
            break
        }
    }



    if (vu.camera.stream == null) {
        console.log("No camera or camera access denied");
        throw Error('denied')
    }
}

/**
 * Set the video Stream and set the max resolution available
 *
 * @returns {true or Error}
 *      Error('denied') No camera or camera access denied
 */
vu.camera.setMinResolution = async function () {
    if (vu.camera.stream) {
        //console.log(vu.camera.stream);
        vu.camera.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    vu.camera.stream = null;
    for (i = 0; i < vu.camera.config.resolutionConstraints.length; i++) {
        let constraints = vu.camera.config.resolutionConstraints.reverse()[i];
        Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
        Object.assign(constraints.video, {resizeMode: {exact: 'none'}});
        if(vu.camera.config.orientation != 'user'){
            vu.camera.devices = await navigator.mediaDevices.enumerateDevices();
            console.log(vu.camera.devices);
            let count = 0;
              vu.camera.devices.forEach(mediaDevice => {
                count++;
                if (mediaDevice.kind === 'videoinput') {
                    vu.camera.videoinput.push(mediaDevice);
                }
                if(vu.camera.devices.length === count){
                    if(vu.camera.videoinput <= 2 || vu.camera.devices.length <= 2){
                        Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
                    }else{
                        for (i = 0; i < vu.camera.videoinput.length; i++) {
                            if(vu.camera.videoinput[i].label.includes('0, facing back')){
                                Object.assign(constraints.video, {deviceId: { exact: vu.camera.videoinput[i].deviceId }});
                                break;
                            }
                        }
                    }
                }else{
                    Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
                }
              });
        }else{
            Object.assign(constraints.video, {facingMode: vu.camera.config.orientation});
        }
        try {
            vu.camera.config.minResolutionConstrains = constraints;
            vu.camera.stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("Camera Orientation", vu.camera.config.orientation, " || Min Resolution", constraints)
            return true

        } catch (error) {
            console.error(vu.camera.config.resolutionConstraints[i], error);
        }
        if (vu.camera.stream != null) {
            break
        }
    }
    if (vu.camera.stream == null) {
        console.log("No camera or camera access denied");
        throw new Error('denied')
    }
}


/**
 * Start video stream
 *
 * @returns {true or Error}
 *      Error('autoplay') Video anti-autoplay stop video stream
 */
vu.camera.start = async function(videoId) {
    if ( typeof videoId === "string"){
        vu.camera.video = document.getElementById(videoId);
    } else {
        vu.camera.video  = videoId;
    }
    try {
        await vu.camera.setMaxResolution(vu.camera.config.orientation)
        console.log("previewResolution", vu.camera.config.previewResolution)

        if (vu.camera.config.previewResolution == 'highest'){
            vu.camera.track = vu.camera.stream.getVideoTracks()[0];
        } else {
            await vu.camera.setMinResolution(vu.camera.config.orientation);
            vu.camera.track = vu.camera.stream.getVideoTracks()[0];
        }

        if (vu.camera.config.contrast !== 'default') {
            vu.camera.setContrast(vu.camera.config.contrast);
        }
        if (vu.camera.config.brightness !== 'default') {
            vu.camera.setBrightness(vu.camera.config.brightness);
        }
        if (vu.camera.config.sharpness !== 'default') {
            vu.camera.setSharpness(vu.camera.config.sharpness);
        }
        if (vu.camera.config.saturation !== 'default') {
            vu.camera.setSaturation(vu.camera.config.saturation);
        }

        if (vu.camera.config.iso !== 'default') {
            vu.camera.setIso(vu.camera.config.iso);
        }
        if (vu.camera.config.zoom !== 'default') {
            //vu.camera.setZoom(vu.camera.config.zoom);
        }

        vu.camera.video.srcObject = vu.camera.stream;

    } catch (error) {
        console.log(error)
        throw Error(error.message)
    }
    try {
        focusModes = vu.camera.stream.getVideoTracks()[0].getCapabilities().focusMode
        if (focusModes.includes("continuous")) {
            vu.camera.stream.getVideoTracks()[0].applyConstraints({advanced: [{focusMode: "continuous"}]});
        } else if (focusModes.includes("auto")) {
            vu.camera.stream.getVideoTracks()[0].applyConstraints({advanced: [{focusMode: "auto"}]});
        }
    } catch (e) {
        console.log('Camera: set focus mode not supported')
    }

    let playPromise = vu.camera.video.play();
    if (playPromise !== undefined) {
        try {
            await playPromise;
        } catch (e) {
            console.log('Video anti-autoplay stop video stream', e);
            throw new Error('autoplay');
        }

        if (vu.camera.config.previewResolution == 'highest'){
            vu.camera.config.minimumResolution = vu.camera.config.minimumResolutionInHighestPreviewResolution;
        } else {
            vu.camera.config.minimumResolution = vu.camera.config.minimumResolutionInLowestPreviewResolution;;
        }

        if (vu.camera.video.videoHeight < vu.camera.config.minimumResolution ||
            vu.camera.video.videoWidth < vu.camera.config.minimumResolution){
            console.log('Camera too low resolution', vu.camera.video.videoHeight, vu.camera.video.videoWidth);
            throw new Error('lowResolution');
        }
        return true
    } else {
        return true
    }
};


/**
 * Take a frame of video
 *
 * @returns {canvas, b64string, dataUrl or Error}
 *      Error('crossSiteBlock') browser or some adBlock extension blocks taking a picture
 *      canvas canvas element - https://developer.mozilla.org/es/docs/Glossary/Canvas
 *      b64 base64 string
 *      dataUrl - https://developer.mozilla.org/es/docs/Web/HTTP/Basics_of_HTTP/Datos_URIs
 */
vu.camera.takePicture = async function() {
    if (vu.camera.config.pictureFlashEffect) {
        document.getElementById(vu.camera.config.pictureFlashDivId).style.display = "block";
    }

    resConstrain = false
    // Si la camara no tiene el preview en maxima resolucion y se solicita la foto en maxima resolucion,
    // se cambia la camara a maxima resolucion antes de sacar la foto.
    if ( vu.camera.config.pictureResolution === 'highest' &&
         vu.camera.config.previewResolution !== 'highest') {

        resConstrain = vu.camera.config.previewResolution;
        vu.camera.config.previewResolution = 'highest';

        vu.camera.stream.getTracks().forEach(track => {
            track.stop();
        });
        vu.camera.stream = await navigator.mediaDevices.getUserMedia(vu.camera.config.maxResolutionConstrains);
        vu.camera.video.srcObject = vu.camera.stream;
        await vu.camera.video.play();
    }

    // Se prepara el canvas y se pone en consola la informacion de la foto y la camara
    burstCanvas = []
    let canvas = document.createElement('canvas');
    let canvasContext = canvas.getContext('2d');
    canvas.width = vu.camera.video.videoWidth;
    canvas.height = vu.camera.video.videoHeight;

    console.log("Camera resolution", canvas.width, canvas.height);
    console.log("Camera config", vu.camera.config);

    if (vu.camera.config.takePictureLessBlurry === false) {
        // Si es una sola foto, se toma y la misma y se deja en el canvas.
        canvasContext.drawImage(vu.camera.video, 0, 0, canvas.width, canvas.height);
    } else {
        // Crear Canvas
        for ( i = 0; i < vu.camera.config.pictureLessBlurryBurst; i++) {
            canvasTemp = document.createElement('canvas');
            canvasTemp.width = vu.camera.video.videoWidth;
            canvasTemp.height = vu.camera.video.videoHeight;
            burstCanvas.push(canvasTemp)
            //console.log("canvas", i)
        }
        // Sacar fotos
        for ( i = 0; i < vu.camera.config.pictureLessBlurryBurst; i++) {
            burstCanvas[i].getContext('2d').drawImage(vu.camera.video,0, 0,
                burstCanvas[i].width, burstCanvas[i].height);
            //console.log("picture", i);
            //console.log(burstCanvas[i].toDataURL('image/jpeg', vu.camera.config.jpegCompression))
        }
    }

    // Se restaura la camara al modo que estaba si se cambio la resolucion para tomar la foto.
    if (resConstrain !== false) {
        vu.camera.config.previewResolution = resConstrain;
        vu.camera.stream.getTracks().forEach(track => {
            track.stop();
        });
        vu.camera.stream = await navigator.mediaDevices.getUserMedia(vu.camera.config.minResolutionConstrains);
        vu.camera.video.srcObject = vu.camera.stream;
        await vu.camera.video.play();
    }

    if (vu.camera.config.pictureFlashEffect) {
        document.getElementById(vu.camera.config.pictureFlashDivId).style.display = "none";
    }

    // Filtrar para obtener la foto menos borrosa
    if (vu.camera.config.takePictureLessBlurry !== false) {
        let blurValue = 1000;
        // Get Best Picture
        for (i = 0; i < vu.camera.config.pictureLessBlurryBurst; i++) {
            newBlurValue = measureBlur(burstCanvas[i].getContext('2d').getImageData(0, 0,
                burstCanvas[i].width, burstCanvas[i].height)).avg_edge_width_perc
            //console.log("picture "+i+" blur value:", newBlurValue)

            if (newBlurValue < blurValue){
                blurValue = newBlurValue;
                canvasContext.drawImage(burstCanvas[i], 0, 0, burstCanvas[i].width, burstCanvas[i].height);
            }
        }
    }

    if (vu.camera.config.pictureForceLandscape) {
        // validar si es portrait o landscape
        if (canvas.width < canvas.height) {
            // Es portrait, rotar 90 clockwise

            canvas2 = document.createElement('canvas');
            canvas2.width = canvas.height;
            canvas2.height = canvas.width;

            ctx2 = canvas2.getContext('2d');


            if (vu.camera.config.pictureForceLandscapeRotateClockwise) {
                // 90 clockwise
                ctx2.setTransform(
                     0,1, // x axis down the screen
                    -1,0, // y axis across the screen from right to left
                    canvas.height, // x origin is on the right side of the canvas
                    0             // y origin is at the top
                );
            } else {
                // 90 counter clockwise
                ctx2.setTransform(
                    0, //Horizontal scaling
                    -1, // Horizontal skewing
                    1, // Vertical skewing
                    0, // Vertical scaling
                    0, // Horizontal moving
                    canvas.width // Vertical moving
                );
            }
            ctx2.drawImage(canvas,0,0);

            canvas.width = canvas2.width;
            canvas.height = canvas2.height;
            canvasContext.drawImage(canvas2, 0, 0, canvas2.width, canvas2.height);
        }
    }

    /***********************************************************************/
    // FIX
    // En algunos celulares, con la camara en vertical, la foto se toma en horizontal, mas alla que se muestre en vertical

    // Validamos si el video es vertical
    if (vu.camera.isVerticalVideo()) {
        // Validamos si la pantalla esta en vertical
        if(window.innerHeight > window.innerWidth){
             // Validamos que la imagen NO es vertical
             if (canvas.height < canvas.width) {
                canvas2 = document.createElement('canvas');
                canvas2.width = canvas.height;
                canvas2.height = canvas.width;
                ctx2 = canvas2.getContext('2d');
                ctx2.setTransform(
                     0,1, // x axis down the screen
                    -1,0, // y axis across the screen from right to left
                    canvas.height, // x origin is on the right side of the canvas
                    0             // y origin is at the top
                );
                ctx2.drawImage(canvas,0,0);

                canvas.width = canvas2.width;
                canvas.height = canvas2.height;
                canvasContext.drawImage(canvas2, 0, 0, canvas2.width, canvas2.height);

                console.log('takePicture: Picture is horizontal and video is vertical - Image rotated 90r')

             } else { console.log('takePicture: Picture is horizontal - No action taken') }
        } else { console.log('takePicture: Screen not vertical - No action taken') }
    } else { console.log('takePicture: Video is not vertical - No action taken') }
    /***********************************************************************/

    // Conversion del canvas a B64, dataUrl o se entrega el canvas limpio
    let dataUrl;
    if (vu.camera.config.responseType === 'dataUrl' || vu.camera.config.responseType === 'base64') {
        if (vu.camera.config.pictureFormat === 'jpg' || vu.camera.config.pictureFormat === 'jpeg') {
            dataUrl = canvas.toDataURL('image/jpeg', vu.camera.config.jpegCompression);
        } else {
            dataUrl = canvas.toDataURL('image/png');
        }
        if (dataUrl.length < 6) {
            console.log('browser or some adBlock extension blocks taking a picture');
            throw new Error('crossSiteBlock')
        } else {
            if (vu.camera.config.responseType === 'base64') {
                return dataUrl.split(",")[1]
            } else {
                return dataUrl
            }
        }
    }
    if (vu.camera.config.responseType === 'canvas') {
        dataUrl = canvas.toDataURL('image/png');
        if (dataUrl.length < 6) {
            console.log('browser or some adBlock extension blocks taking a picture');
            throw new Error('crossSiteBlock')
        } else {
            return canvas;
        }
    }
};

/* Camera Capabilities ----------------------------------------------------------*/

/**
 * Get camera Capabilities
 *
 * @returns {object} https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getCapabilities
 */
vu.camera.getCapabilities = function() {
    if (typeof vu.camera.track.getCapabilities != "undefined") {
        return vu.camera.track.getCapabilities()
    } else {
        return false
    }
};


/**
 * Set native camera Capabilities
 *
 * @param value 'highest' 'high' 'medium' 'low' 'lowest' or int
 * @param attr 'sharpness' 'brightness' 'saturation' 'contrast' 'iso' 'zoom'
 * @returns {string}
 */
vu.camera.setCapabilities = function(value, attr) {
    if (vu.camera.getCapabilities() !== false) {
        let capabilities = vu.camera.getCapabilities();
        if (typeof capabilities[attr] != "undefined") {
            let highest = capabilities[attr].max;
            let lowest = capabilities[attr].min;
            let range = vu.camera.getRange(lowest, highest);
            if (value === 'highest') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: highest}]});
                return true;
            } else if (value === 'high') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: vu.camera.getHighValueOfRange(range)}]});
                return true;
            } else if (value === 'medium') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: vu.camera.getMediumValueOfRange(range)}]});
                return true;
            } else if (value === 'low') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: vu.camera.getLowValueOfRange(range)}]});
                return true;
            } else if (value === 'lowest') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: lowest}]});
                return true;
            } else if (typeof value == 'number') {
                vu.camera.track.applyConstraints({advanced: [{[attr]: value}]});
                return true;
            } else {
                return false;
            }
        } else {
            return vu.camera.setCSSCapabilities(value, attr)
        }
    } else {
        return vu.camera.setCSSCapabilities(value, attr);
    }
};

vu.camera.setCSSCapabilities = function(value, attr) {
    if ( attr == 'contrast' || attr == 'brightness' || attr == 'saturation' || attr == 'zoom') {
        let highest = vu.camera.cssValues[attr].max;
        let lowest = vu.camera.cssValues[attr].min;
        let range = vu.camera.getRange(lowest, highest);
        if (value === 'highest') {
            value = highest;
        } else if (value === 'high') {
            value = vu.camera.getHighValueOfRange(range);
        } else if (value === 'medium') {
            value = vu.camera.getMediumValueOfRange(range);
        } else if (value === 'low') {
            value = vu.camera.getLowValueOfRange(range);
        } else if (value === 'lowest') {
            value = lowest;
        }
        vu.camera.cssValues[attr].val = value;
        vu.camera.video.style.filter = "contrast("+vu.camera.cssValues['contrast'].val+"%)" +
            "brightness("+vu.camera.cssValues['brightness'].val+"%)" +
            "saturate("+vu.camera.cssValues['saturation'].val+"%)";

        let newHeight = Math.round(100 * vu.camera.cssValues['zoom'].val);
        let newWidth = Math.round(100 * vu.camera.cssValues['zoom'].val);

        vu.camera.video.style.width =  newWidth + "%" ;
        vu.camera.video.style.height =  newHeight + "%";
        let top = -Math.abs(Math.round((newHeight - 100) / 2)) ;
        let left =  -Math.abs(Math.round((newWidth - 100) / 2));
        vu.camera.video.style.top = top  + "%";
        vu.camera.video.style.left = left  + "%";

        // vu.camera.video.style.transform = "scale("+vu.camera.cssValues['zoom'].val+")";
        return 'css'

    }
    return false;
};

// highest high medium low lowest or integrer
/**
 * Set camera sharpness
 *
 * @param value highest high medium low lowest or integrer
 * @returns {boolean}
 */
vu.camera.setSharpness = function(value) {
    return vu.camera.setCapabilities(value, 'sharpness')
};

/**
 * Set camera brightness
 *
 * @param value highest high medium low lowest or integrer
 * @returns {true, false or 'webgl'}
 */
vu.camera.setBrightness = function(value) {
    status = vu.camera.setCapabilities(value, 'brightness');
    return status;
};

/**
 * Set camera saturation
 *
 * @param value highest high medium low lowest or integrer
 * @returns {true, false or 'webgl'}
 */
vu.camera.setSaturation = function(value) {
    status = vu.camera.setCapabilities(value, 'saturation');
    return status;
};

/**
 * Set camera contrast
 *
 * @param value highest high medium low lowest or integrer
 * @returns {true, false or 'webgl'}
 */
vu.camera.setContrast = function(value) {
    status = vu.camera.setCapabilities(value, 'contrast');
    return status;
};

/**
 * Set camera iso
 *
 * @param value highest high medium low lowest or integrer
 * @returns {true, false}
 */
vu.camera.setIso = function(value) {
    return vu.camera.setCapabilities(value, 'iso')
};

/**
 * Set camera zoom
 *
 * @param value highest high medium low lowest or integrer
 * @returns {true, false or 'webgl'}
 */
vu.camera.setZoom = function(value) {
    status = vu.camera.setCapabilities(value, 'zoom');
    return status;
};


