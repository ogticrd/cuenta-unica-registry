/* Autogenerado por el script update_speech_files.py */
if (typeof vu == "undefined") {vu = function() {}}
if (typeof vu.sop == "undefined") {vu.sop = function() {}}
if (typeof vu.sop.audio == "undefined") {vu.sop.audio = function() {}}

if (typeof vu.sop.audio == "undefined") {
    vu.sop.audio.enabled = true
}
vu.sop.audio.audioContext = new (window.AudioContext || window.webkitAudioContext)()
vu.sop.audio.source = vu.sop.audio.audioContext.createBufferSource()

vu.sop.audio.play = function (base64) {
   if (vu.sop.audio.enabled) {
       try {
           vu.sop.audio.audioContext.resume().then(
               vu.sop.audio.audioContext.decodeAudioData(vu.sop.audio.Base64Binary.decodeArrayBuffer(base64), (buffer) => {
                   vu.sop.audio.source = vu.sop.audio.audioContext.createBufferSource()
                   vu.sop.audio.source.buffer = buffer
                   vu.sop.audio.source.connect(vu.sop.audio.audioContext.destination)
                   currentTime = vu.sop.audio.audioContext.currentTime
                   vu.sop.audio.source.start(currentTime)
               })
           )
       } catch (e) {
           alert(e)
       }
   }
}

if (typeof vu.sop.audio.Base64Binary == "undefined") {vu.sop.audio.Base64Binary = function() {}}

vu.sop.audio.Base64Binary._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

vu.sop.audio.Base64Binary.decodeArrayBuffer =  function(input) {
    var bytes = (input.length/4) * 3;
    var ab = new ArrayBuffer(bytes);
    vu.sop.audio.Base64Binary.decode(input, ab);
    return ab;
}

vu.sop.audio.Base64Binary.removePaddingChars = function(input){
    var lkey = vu.sop.audio.Base64Binary._keyStr.indexOf(input.charAt(input.length - 1));
    if(lkey == 64){
        return input.substring(0,input.length - 1);
    }
    return input;
}

vu.sop.audio.Base64Binary.decode = function (input, arrayBuffer) {
    //get last chars to see if are valid
    input = vu.sop.audio.Base64Binary.removePaddingChars(input);
    input = vu.sop.audio.Base64Binary.removePaddingChars(input);

    var bytes = parseInt((input.length / 4) * 3, 10);

    var uarray;
    var chr1, chr2, chr3;
    var enc1, enc2, enc3, enc4;
    var i = 0;
    var j = 0;

    if (arrayBuffer)
        uarray = new Uint8Array(arrayBuffer);
    else
        uarray = new Uint8Array(bytes);

    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    for (i=0; i<bytes; i+=3) {
        //get the 3 octects in 4 ascii chars
        enc1 = vu.sop.audio.Base64Binary._keyStr.indexOf(input.charAt(j++));
        enc2 = vu.sop.audio.Base64Binary._keyStr.indexOf(input.charAt(j++));
        enc3 = vu.sop.audio.Base64Binary._keyStr.indexOf(input.charAt(j++));
        enc4 = vu.sop.audio.Base64Binary._keyStr.indexOf(input.charAt(j++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        uarray[i] = chr1;
        if (enc3 != 64) uarray[i+1] = chr2;
        if (enc4 != 64) uarray[i+2] = chr3;
    }

    return uarray;
}

