if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.face == "undefined") { vu.sop.face = function() {} }

if (typeof vu.sop.face.model == "undefined") { vu.sop.face.model = function() {} }

if (typeof vu.sop.face.model.directions == "undefined") { vu.sop.face.model.directions = function() {} }

vu.sop.face.model.directions.modelURL = 'onboarding/js/models/face-directions/model.json'
vu.sop.face.model.directions.modelHeight = 128
vu.sop.face.model.directions.modelWidth = 128
vu.sop.face.model.directions.labels = ["face_looking_down","face_looking_right","face_looking_left","face_looking_up","face_neutral"];

//------------------------------------------------------

vu.sop.face.model.directions.model;


vu.sop.face.model.directions.loadModel = async function() {
    tf.ENV.set('DEBUG', false);
    tf.enableProdMode();
    await tf.ready()

    //await tf.setBackend('cpu');
    await tf.setBackend('wasm');
    //tf.enableDebugMode()
    //console.log(tf.ENV)
    if (!vu.sop.face.model.directions.model) {
        //console.log("Loading - Face Directions Model")
        var start = new Date();
        vu.sop.face.model.directions.model = tf.GraphModel;
        vu.sop.face.model.directions.model = await tf.loadGraphModel(vu.sop.face.model.directions.modelURL)
        netTime = new Date().getTime() - start.getTime()
        var start = new Date();
        vu.sop.face.model.directions.model.predict(tf.zeros([ 1,
                                                            vu.sop.face.model.directions.modelHeight,
                                                            vu.sop.face.model.directions.modelWidth, 3]));
        warmUpTime = new Date().getTime() - start.getTime()
        console.log("Loaded - Face Directions Model - Network Time " + netTime + "ms - Warm Up Time " + warmUpTime +"ms")
        return vu.sop.face.model.directions.model
    } else {
        return vu.sop.face.model.directions.model
    }
}

vu.sop.face.model.directions.predictAsync = async function(image){
    var start = new Date();

    resized = tf.tidy(() => {
        img = tf.browser.fromPixels(image);
        img = img.mul((1.0/127)-1)
        resized = tf.image.resizeBilinear(img,[vu.sop.face.model.directions.modelHeight, vu.sop.face.model.directions.modelWidth]);

        return resized
    });

    batched = tf.reshape(resized, [-1, vu.sop.face.model.directions.modelHeight, vu.sop.face.model.directions.modelWidth, 3]);

    //var start = new Date();

    logits = vu.sop.face.model.directions.model.execute(batched);
    results = await logits.data();

    resultsWLabels = {}
    i = 0
    vu.sop.face.model.directions.labels.forEach(
        element => {
            resultsWLabels[element] = Math.round(results[i]*100);
            i = i+1
        }
    );


    if (vu.sop.ui.debug.enable){
        vu.sop.ui.debug.perf.push(['getRotation', new Date().getTime() - start.getTime() +'ms'])

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