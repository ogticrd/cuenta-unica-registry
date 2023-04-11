if (typeof vu == "undefined") { vu = function() {} }

if (typeof vu.image == "undefined") { vu.image = function() {} }

// ------------------------------------------------------------------------------------------------------------ //

vu.image.lab2rgb = function(lab){
  var y = (lab[0] + 16) / 116,
      x = lab[1] / 500 + y,
      z = y - lab[2] / 200,
      r, g, b;

  x = 0.95047 * ((x * x * x > 0.008856) ? x * x * x : (x - 16/116) / 7.787);
  y = 1.00000 * ((y * y * y > 0.008856) ? y * y * y : (y - 16/116) / 7.787);
  z = 1.08883 * ((z * z * z > 0.008856) ? z * z * z : (z - 16/116) / 7.787);

  r = x *  3.2406 + y * -1.5372 + z * -0.4986;
  g = x * -0.9689 + y *  1.8758 + z *  0.0415;
  b = x *  0.0557 + y * -0.2040 + z *  1.0570;

  r = (r > 0.0031308) ? (1.055 * Math.pow(r, 1/2.4) - 0.055) : 12.92 * r;
  g = (g > 0.0031308) ? (1.055 * Math.pow(g, 1/2.4) - 0.055) : 12.92 * g;
  b = (b > 0.0031308) ? (1.055 * Math.pow(b, 1/2.4) - 0.055) : 12.92 * b;

  return [Math.max(0, Math.min(1, r)) * 255,
          Math.max(0, Math.min(1, g)) * 255,
          Math.max(0, Math.min(1, b)) * 255]
}


vu.image.rgb2lab = function(rgb){
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      x, y, z;

  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000;
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;

  x = (x > 0.008856) ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = (y > 0.008856) ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = (z > 0.008856) ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;

  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

vu.image.getDataUrlFromArr = function (arr, w, h) {
  if(typeof w === 'undefined' || typeof h === 'undefined') {
    w = h = Math.sqrt(arr.length / 4);
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = w;
  canvas.height = h;

  const imgData = ctx.createImageData(w, h);
  imgData.data.set(arr);
  ctx.putImageData(imgData, 0, 0);

  return canvas.toDataURL();
}

// ------------------------------------------------------------------------------------------------------------ //

if (typeof vu.image.brigthSpotDetector == "undefined") { vu.image.brigthSpotDetector = function() {} }

vu.image.brigthSpotDetector.borderDecimal = 0.15
vu.image.brigthSpotDetector.minResult = 98


vu.image.brigthSpotDetector.canvas = document.createElement("canvas");
vu.image.brigthSpotDetector.canvasContext = vu.image.brigthSpotDetector.canvas.getContext("2d");
vu.image.brigthSpotDetector.canvasResize = document.createElement("canvas");
vu.image.brigthSpotDetector.canvasResizeContext = vu.image.brigthSpotDetector.canvasResize.getContext("2d");

vu.image.brigthSpotDetector.hasABrightSpot = function(img) {
    startTime = new Date();
    resize = 10
    if (img.width > img.height) {
        scale = img.width / resize;
        height = Math.round(img.height/scale);
        width = Math.round(img.width/scale);
    } else {
        scale = img.height / resize;
        height = Math.round(img.height/scale);
        width = Math.round(img.width/scale);
    }

    vu.image.brigthSpotDetector.canvas.width = width
    vu.image.brigthSpotDetector.canvas.height = height
    vu.image.brigthSpotDetector.canvasContext.drawImage(img,0,0, width, height)
    imageData = vu.image.brigthSpotDetector.canvasContext.getImageData(0, 0, width, height);

    var r,g,b,avg;
    var brightSportCount = 0;
    for(var x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];
        lab = vu.image.rgb2lab([r,g,b])
        avg = Math.floor(lab[0]);
        //console.log(lab[0])
        if ( lab[0] > vu.image.brigthSpotDetector.minResult )
        {
            brightSportCount = brightSportCount + 1
        }
    }
    maxBrightSpots = (width * height) * 0.07
    if (maxBrightSpots < brightSportCount) {
        return [true, brightSportCount];
    } else {
        return [false, brightSportCount];
    }
}

vu.image.brigthSpotDetector.hasABrightSpotAsync = function(img) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.brigthSpotDetector.hasABrightSpot(img) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

vu.image.brigthSpotDetector.thisAreaHasABrightSpot = function(img, box) {
    // box example: [66, 6, 374, 250] | x y, x2 y2
    borderHorizontal = Math.round(box[2] * vu.image.brigthSpotDetector.borderDecimal)
    borderVertical =  Math.round(box[3] * vu.image.brigthSpotDetector.borderDecimal)

    vu.image.brigthSpotDetector.canvasResize.width = box[2] - (borderHorizontal*2);
    vu.image.brigthSpotDetector.canvasResize.height = box[3] - (borderVertical*2);
    vu.image.brigthSpotDetector.canvasResizeContext.drawImage(img, -(box[0]+borderHorizontal), -(box[1]+borderVertical));
    return vu.image.brigthSpotDetector.hasABrightSpot(vu.image.brigthSpotDetector.canvasResize);
}

vu.image.brigthSpotDetector.thisAreaHasABrightSpotAsync = function(img, box) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.brigthSpotDetector.thisAreaHasABrightSpot(img, box) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

// ------------------------------------------------------------------------------------------------------------ //

if (typeof vu.image.brightnessDetector == "undefined") { vu.image.brightnessDetector = function() {} }

vu.image.brightnessDetector.minResult = 30
vu.image.brightnessDetector.borderDecimal = 0.15

vu.image.brightnessDetector.canvas = document.createElement("canvas");
vu.image.brightnessDetector.canvasContext = vu.image.brightnessDetector.canvas.getContext("2d");
vu.image.brightnessDetector.canvasResize = document.createElement("canvas");
vu.image.brightnessDetector.canvasResizeContext = vu.image.brightnessDetector.canvasResize.getContext("2d");

vu.image.brightnessDetector.isBright = function(img) {
    startTime = new Date();
    vu.image.brightnessDetector.canvas.width = 10;
    vu.image.brightnessDetector.canvas.height = 10;
    vu.image.brightnessDetector.canvasContext.drawImage(img,0,0, 10, 10);

    imageData = vu.image.brightnessDetector.canvasContext.getImageData(0,0,10,10);
    data = imageData.data;
    var r,g,b,avg;
    var colorSum = 0;
    for(var x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];
        lab = vu.image.rgb2lab([r,g,b])
        //avg = Math.floor((r+g+b)/3);
        avg = Math.floor(lab[0]);
        colorSum += avg;
    }

    result = Math.floor(colorSum / (10*10))
    //console.log('isBright score', result, '- time:', new Date().getTime() - startTime.getTime())
    if (vu.image.brightnessDetector.minResult > result) {
        return [false, result];
    } else {
        return [true, result];
    }
}

vu.image.brightnessDetector.isBrightAsync = function(img) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.brightnessDetector.isBright(img) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

vu.image.brightnessDetector.thisAreaIsBright = function(img, box) {
    // box example: [66, 6, 374, 250] | x y, x2 y2
    borderHorizontal = Math.round(box[2] * vu.image.brightnessDetector.borderDecimal)
    borderVertical =  Math.round(box[3] * vu.image.brightnessDetector.borderDecimal)

    vu.image.brightnessDetector.canvasResize.width = box[2] - (borderHorizontal*2);
    vu.image.brightnessDetector.canvasResize.height = box[3] - (borderVertical*2);
    vu.image.brightnessDetector.canvasResizeContext.drawImage(img, -(box[0]+borderHorizontal), -(box[1]+borderVertical));
    return vu.image.brightnessDetector.isBright(vu.image.brightnessDetector.canvasResize);
}

vu.image.brightnessDetector.thisAreaIsBrightAsync = function(img, box) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.brightnessDetector.thisAreaIsBright(img, box) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

// ------------------------------------------------------------------------------------------------------------ //

if (typeof vu.image.blurDetector == "undefined") { vu.image.blurDetector = function() {} }

vu.image.blurDetector.minResult = 0.65  // More is more blur
vu.image.blurDetector.borderDecimal = 0.15
vu.image.blurDetector.resize = 128

vu.image.blurDetector.canvas = document.createElement("canvas");
vu.image.blurDetector.canvasContext = vu.image.blurDetector.canvas.getContext("2d");
vu.image.blurDetector.canvasResize = document.createElement("canvas");
vu.image.blurDetector.canvasResizeContext = vu.image.blurDetector.canvasResize.getContext("2d");

vu.image.blurDetector.isBlurry = function(img) {
    startTime = new Date();
    resize = vu.image.blurDetector.resize
    if (img.width > img.height) {
        scale = img.width / resize;
        height = Math.round(img.height/scale);
        width = Math.round(img.width/scale);
    } else {
        scale = img.height / resize;
        height = Math.round(img.height/scale);
        width = Math.round(img.width/scale);
    }

    vu.image.blurDetector.canvas.width = width;
    vu.image.blurDetector.canvas.height = height;
    vu.image.blurDetector.canvasContext.drawImage(img, 0,0,width,height);

    blurValue = measureBlur(vu.image.blurDetector.canvas.getContext('2d').getImageData(0, 0, width, height)).avg_edge_width_perc
    //console.log('isBlurry score', blurValue, '- time:', new Date().getTime() - startTime.getTime())
    if (vu.image.blurDetector.minResult > blurValue) {
        return [false, blurValue]
    } else {
        return [true, blurValue]
    }
}

vu.image.blurDetector.isBlurryAsync = function(img) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.blurDetector.isBlurry(img) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

vu.image.blurDetector.thisAreaIsBlurry = function(img, box) {
    borderHorizontal = Math.round(box[2] * vu.image.blurDetector.borderDecimal)
    borderVertical =  Math.round(box[3] * vu.image.blurDetector.borderDecimal)

    vu.image.blurDetector.canvasResize.width = box[2] - (borderHorizontal*2);
    vu.image.blurDetector.canvasResize.height = box[3] - (borderVertical*2);
    vu.image.blurDetector.canvasResizeContext.drawImage(img, -(box[0]+borderHorizontal), -(box[1]+borderVertical));
    return vu.image.blurDetector.isBlurry(vu.image.blurDetector.canvasResize);
}

vu.image.blurDetector.thisAreaIsBlurryAsync = function(img, box) {
    return new Promise(function (fulfilled, rejected) {
        try {
            return fulfilled( vu.image.blurDetector.thisAreaIsBlurry(img, box) )
        } catch (e) {
            return rejected( new Error(e) )
        }
    })
}

// ------------------------------------------------------------------------------------------------------------ //
