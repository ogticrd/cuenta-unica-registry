if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.sop == "undefined") { vu.sop = function() {} }

if (typeof vu.sop.face == "undefined") { vu.sop.face = function() {} }

if (typeof vu.sop.face.model == "undefined") { vu.sop.face.model = function() {} }

if (typeof vu.sop.face.model.gestures == "undefined") { vu.sop.face.model.gestures = function() {} }

vu.sop.face.model.gestures.modelURL = 'onboarding/js/models/face-gestures/model.json'
vu.sop.face.model.gestures.modelHeight = 128
vu.sop.face.model.gestures.modelWidth = 128
vu.sop.face.model.gestures.labels = ["closed_eyes", "open_mouth", "smile"];

//------------------------------------------------------

vu.sop.face.model.gestures.model;


vu.sop.face.model.gestures.loadModel = async function() {
    tf.ENV.set('DEBUG', false);
    tf.enableProdMode();
    await tf.ready()

    //await tf.setBackend('cpu');
    await tf.setBackend('wasm');
    //tf.enableDebugMode()
    //console.log(tf.ENV)
    if (!vu.sop.face.model.gestures.model) {
        //console.log("Loading - Face Gestures Model")
        var start = new Date();
        vu.sop.face.model.gestures.model = tf.GraphModel;
        vu.sop.face.model.gestures.model = await tf.loadGraphModel(vu.sop.face.model.gestures.modelURL)
        netTime = new Date().getTime() - start.getTime()
        var start = new Date();
        vu.sop.face.model.gestures.model.predict(tf.zeros([ 1,
                                                            vu.sop.face.model.gestures.modelHeight,
                                                            vu.sop.face.model.gestures.modelWidth, 3]));
        warmUpTime = new Date().getTime() - start.getTime()
        console.log("Loaded - Face Gestures Model - Network Time " + netTime + "ms - Warm Up Time " + warmUpTime +"ms")
        return vu.sop.face.model.gestures.model
    } else {
        return vu.sop.face.model.gestures.model
    }
}

vu.sop.face.model.gestures.predictAsync = async function(image){
    var start = new Date();

    resized = tf.tidy(() => {
        img = tf.browser.fromPixels(image);
        img = img.mul((1.0/127)-1)
        resized = tf.image.resizeBilinear(img,[vu.sop.face.model.gestures.modelHeight, vu.sop.face.model.gestures.modelWidth]);
        return resized
    });

    batched = tf.reshape(resized, [-1, vu.sop.face.model.gestures.modelHeight, vu.sop.face.model.gestures.modelWidth, 3]);

    logits = vu.sop.face.model.gestures.model.execute(batched);
    results = await logits.data();

    resultsWLabels = {}
    i = 0
    vu.sop.face.model.gestures.labels.forEach(
        element => {
            resultsWLabels[element] = Math.round(results[i]*100);
            i = i+1
        }
    );

    if (vu.sop.ui.debug.enable){
        vu.sop.ui.debug.perf.push(['getGestures', new Date().getTime() - start.getTime() +'ms'])

        vu.sop.ui.debug.eval.push(['Closed Eyes', resultsWLabels['closed_eyes'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Open Mouth', resultsWLabels['open_mouth'] + "%", 'white'])
        vu.sop.ui.debug.eval.push(['Smile', resultsWLabels['smile'] + "%", 'white'])

    }

    logits.dispose();
    tf.dispose(results);
    //console.log('Model Gestures   - Time', new Date().getTime() - start.getTime(), 'ms')
    return resultsWLabels
}