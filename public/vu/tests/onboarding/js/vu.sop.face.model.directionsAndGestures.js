if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.face == "undefined") { vu.sop.face = function() {} }

if (typeof vu.sop.face.model == "undefined") { vu.sop.face.model = function() {} }

if (typeof vu.sop.face.model.directionsAndGestures == "undefined") { vu.sop.face.model.directionsAndGestures = function() {} }

vu.sop.face.model.directionsAndGestures.modelURL = 'onboarding/js/models/face-directions-gestures/model.json'
vu.sop.face.model.directionsAndGestures.modelHeight = 224
vu.sop.face.model.directionsAndGestures.modelWidth = 224
vu.sop.face.model.directionsAndGestures.labels = ['closed_eyes', 'face_looking_down', 'face_looking_left', 'face_looking_right', 'face_looking_up', 'face_neutral', 'open_mouth', 'smile']

//------------------------------------------------------

vu.sop.face.model.directionsAndGestures.model;


vu.sop.face.model.directionsAndGestures.loadModel = async function() {
    tf.ENV.set('DEBUG', false);
    tf.enableProdMode();

    //await tf.setBackend('cpu');
    await tf.setBackend('wasm');
    await tf.ready()

    //tf.enableDebugMode()
    //console.log(tf.ENV)
    if (!vu.sop.face.model.directionsAndGestures.model) {
        //console.log("Loading - Face Directions Model")
        var start = new Date();
        vu.sop.face.model.directionsAndGestures.model = tf.GraphModel;
        vu.sop.face.model.directionsAndGestures.model = await tf.loadGraphModel(vu.sop.face.model.directionsAndGestures.modelURL)
        netTime = new Date().getTime() - start.getTime()
        var start = new Date();
        vu.sop.face.model.directionsAndGestures.model.predict(tf.zeros([ 1,
                                                            vu.sop.face.model.directionsAndGestures.modelHeight,
                                                            vu.sop.face.model.directionsAndGestures.modelWidth, 3]));
        warmUpTime = new Date().getTime() - start.getTime()
        console.log("Loaded - Face Directions Model - Network Time " + netTime + "ms - Warm Up Time " + warmUpTime +"ms")
        return vu.sop.face.model.directionsAndGestures.model
    } else {
        return vu.sop.face.model.directionsAndGestures.model
    }
}

vu.sop.face.model.directionsAndGestures.predictAsync = async function(image){
    var start = new Date();

    resized = tf.tidy(() => {
        img = tf.browser.fromPixels(image);
        resized = tf.image.resizeBilinear(img,[vu.sop.face.model.directionsAndGestures.modelHeight, vu.sop.face.model.directionsAndGestures.modelWidth]);
        return resized
    });

    batched = tf.reshape(resized, [-1, vu.sop.face.model.directionsAndGestures.modelHeight, vu.sop.face.model.directionsAndGestures.modelWidth, 3]);

    logits = vu.sop.face.model.directionsAndGestures.model.execute(batched);
    results = await logits.data();

    resultsWLabels = {}
    i = 0
    vu.sop.face.model.directionsAndGestures.labels.forEach(
        element => {
            resultsWLabels[element] = Math.round(results[i]*100);
            i = i+1
        }
    );

    if (vu.sop.ui.debug.enable){
        vu.sop.ui.debug.perf.push(['getRotationAndGestures', new Date().getTime() - start.getTime() +'ms'])

        vu.sop.ui.debug.eval.push(['Open Mouth', resultsWLabels['open_mouth'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Closed Eyes', resultsWLabels['closed_eyes'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Open Mouth', resultsWLabels['open_mouth'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Smile', resultsWLabels['smile'] + "%", 'white'])

        vu.sop.ui.debug.eval.push(['Down', resultsWLabels['face_looking_down'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Left', resultsWLabels['face_looking_left'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Right', resultsWLabels['face_looking_right'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Up', resultsWLabels['face_looking_up'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Neutral', resultsWLabels['face_neutral'] + "%", 'white'])
    }

    logits.dispose();
    tf.dispose(results);

    //console.log('Model Directions - Time', new Date().getTime() - start.getTime(), 'ms')
    return resultsWLabels
}