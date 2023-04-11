if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.face == "undefined") { vu.sop.face = function() {} }

if (typeof vu.sop.face.objectDetectionAndRotation == "undefined") { vu.sop.face.objectDetectionAndRotation = function() {} }

vu.sop.face.objectDetectionAndRotation.minConfidence = 0.6
vu.sop.face.objectDetectionAndRotation.maxNumBoxes = 1
vu.sop.face.objectDetectionAndRotation.modelURL = 'onboarding/js/models/face-location-and-rotation/model.json'
vu.sop.face.objectDetectionAndRotation.labels = ['rot0','rot90','rot180','rot270'];

//------------------------------------------------------

vu.sop.face.objectDetectionAndRotation.model;

vu.sop.face.objectDetectionAndRotation.calculateMaxScores = async function(scores,
                                                                numBoxes,
                                                                numClasses) {
    maxes = [];
    classes = [];
    for (i = 0; i < numBoxes; i++) {
        max = Number.MIN_VALUE;
        index = -1;
        for (j = 0; j < numClasses; j++) {
            if (scores[i * numClasses + j] > max) {
                max = scores[i * numClasses + j];
                index = j;
            }
        }
        maxes[i] = max;
        classes[i] = index;
    }
    return [maxes, classes];
}

vu.sop.face.objectDetectionAndRotation.buildDetectedObjects = async function(width,
                                                                  height,
                                                                  boxes,
                                                                  scores,
                                                                  indexes,
                                                                  classes,
                                                                  scale){
    const count = indexes.length;
    results = []
    for (let i = 0; i < count; i++) {
        const bbox = [];
        for (let j = 0; j < 4; j++) {
            bbox[j] = boxes[indexes[i] * 4 + j];
        }
        const minY = bbox[0] * height;
        const minX = bbox[1] * width;
        const maxY = bbox[2] * height;
        const maxX = bbox[3] * width;
        bbox[0] = Math.round(minX*scale);
        bbox[1] = Math.round(minY*scale);
        bbox[2] = Math.round((maxX - minX)*scale);
        bbox[3] = Math.round((maxY - minY)*scale);
        //console.log(classes[indexes])
        //console.log(scores[indexes], scale)
        results.push([vu.sop.face.objectDetectionAndRotation.labels[classes[indexes]], bbox, scores[indexes]])
    }
    return results
}


vu.sop.face.objectDetectionAndRotation.loadModel = async function() {
    tf.ENV.set('DEBUG', false);
    tf.enableProdMode();

    //await tf.setBackend('cpu');
    await tf.setBackend('wasm');
    await tf.ready()

    //tf.enableDebugMode()
    //console.log(tf.ENV)
    if (!vu.sop.face.objectDetectionAndRotation.model) {
        //console.log("Loading - Face Object Detection Model")
        var start = new Date();
        vu.sop.face.objectDetectionAndRotation.model = tf.GraphModel;
        vu.sop.face.objectDetectionAndRotation.model = await tf.loadGraphModel(vu.sop.face.objectDetectionAndRotation.modelURL)
        netTime = new Date().getTime() - start.getTime()
        var start = new Date();
        console.log("Loaded - Face Object Detection Model - Network Time " + netTime + "ms")
        return vu.sop.face.objectDetectionAndRotation.model
    } else {
        return vu.sop.face.objectDetectionAndRotation.model
    }
}

vu.sop.face.objectDetectionAndRotation.predictAsync = async function(video){
    var start = new Date();

    tensor = tf.tidy(() => {
        img = tf.browser.fromPixels(video);
        scale = 1
        resolution = 640
        if (img.shape[0] > resolution || img.shape[1] > resolution){
            if (img.shape[0] < img.shape[1]){
                scale = img.shape[1] / resolution;
            } else {
                scale = img.shape[0] / resolution;
            }
        }

        newHeight = Math.round(img.shape[0]/scale);
        newWidth = Math.round(img.shape[1]/scale);

        img = tf.image.resizeBilinear(img, [newHeight, newWidth]);
        img = tf.cast(img, 'int32')
        return [img.expandDims(0), scale];
    });
    //console.log('Get Img Tensor - Time', new Date().getTime() - start.getTime(), 'ms', 'scale', scale)

    scale = tensor[1]
    tensor = tensor[0]

    height = tensor.shape[1];
    width = tensor.shape[2];

    //var start = new Date();
    inference = await vu.sop.face.objectDetectionAndRotation.model.executeAsync(tensor);
    //console.log('executeAsync - Time', new Date().getTime() - start.getTime(), 'ms - shape ', tensor.shape)

    prevBackend = tf.getBackend();
    tf.setBackend('cpu');
    scores = await inference[0].data();
    boxes = await inference[1].data();

    [maxScores, classes] = await vu.sop.face.objectDetectionAndRotation.calculateMaxScores(scores, inference[0].shape[1], inference[0].shape[2]);
    //------------------------------------------------------------------
    boxes2 = tf.tensor2d(boxes, [inference[1].shape[1], inference[1].shape[3]]);
    indexTensor = await tf.image.nonMaxSuppressionAsync(boxes2, maxScores, vu.sop.face.objectDetectionAndRotation.maxNumBoxes, 0.5, vu.sop.face.objectDetectionAndRotation.minConfidence);

    indexes = await indexTensor.data();
    result = await vu.sop.face.objectDetectionAndRotation.buildDetectedObjects(width, height, boxes, maxScores, indexes, classes, scale);
    tf.setBackend(prevBackend);

    //console.log('result',result)
    //console.log(performance.now(), tf.memory());

    tensor.dispose()
    tf.dispose(boxes2);
    indexTensor.dispose()
    tf.dispose(indexes)
    tf.dispose(inference)

    //console.log('Model Face       - Time', new Date().getTime() - start.getTime(), 'ms')

    return result
}