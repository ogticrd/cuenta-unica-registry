/*

Descripcion: Esta libreria se encarga de ontener la informacion del codigo de barras PDF417


Referencias:
https://github.com/PeculiarVentures/js-zxing-pdf417.git

TODO Normalizacion de la orientacion

 */

if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.barcode == "undefined") { vu.sop.barcode = function() {} }

if (typeof vu.sop.barcode.scanPdf417 == "undefined") { vu.sop.barcode.scanPdf417 = function() {} }


vu.sop.barcode.scanPdf417.run = false;

vu.sop.barcode.scanPdf417.start = function(video) {
    vu.sop.barcode.scanPdf417.run = true;
    promise = vu.sop.barcode.scanPdf417.scan(video)
};

vu.sop.barcode.scanPdf417.stop = function() {
    vu.sop.barcode.scanPdf417.run = false
};

vu.sop.barcode.scanPdf417.scan = async function() {
    var canvas = document.createElement('canvas'),
        canvas_context = canvas.getContext('2d'),
        source,
        binarizer,
        bitmap;


    error = false;

    video = vu.camera.video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas_context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas_context.globalAlpha = 1;
    canvas_context.filter = "grayscale(100%) brightness(250%) contrast(250%)";

    img_data = canvas_context.getImageData(0, 0, canvas.width, canvas.height)

    try {
        source = new ZXing.BitmapLuminanceSource(img_data, canvas.width, canvas.height);
        binarizer = new ZXing.Common.HybridBinarizer(source);
        bitmap = new ZXing.BinaryBitmap(binarizer);
        result = JSON.stringify(ZXing.PDF417.PDF417Reader.decode(bitmap, null, false), null, 4)
        //console.log(result.length);
    } catch (err) {
        console.log(err);
        error = true
    }

    if (vu.sop.barcode.scanPdf417.run){
        setTimeout(function () {
            promise = vu.sop.barcode.scanPdf417.scan(video)
        }, 10);
    }

    if (error) {
        return []
    } else {
        return result
    }

}