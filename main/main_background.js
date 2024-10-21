async function main(cacheImg) {
  message = "请在主屏幕上长按，滑动到最右边的空白页截图。";
  let exitOptions = ["已有截图", "没有截图"];
  let shouldExit = await generateAlert(message, exitOptions);
  if (shouldExit) return;
  
  let img = await Photos.fromLibrary();
  let height = img.size.height;
  let phone = phoneSizes()[height]
  if (!phone) {
    message = "您似乎选择了非 iPhone 屏幕截图的图像，或者不支持您的 iPhone，请使用其他图像。";
    await generateAlert(message, ["现在去截图"]);
    return;
  }
  
  if (height == 2436) {
    let fm = FileManager.local();
    let cacheName = "95du-phone-type"
    let cachePath = fm.joinPath(files.libraryDirectory(), cacheName)
  
    if (fm.fileExists(cachePath)) {
      let typeString = fm.readString(cachePath)
      phone = phone[typeString]
    } else { 
      message = "你的 iPhone 型号？"
      let types = ["iPhone 12 mini", "iPhone 11 Pro, XS, X"]
      let typeIndex = await generateAlert(message, types)
      let type = (typeIndex == 0) ? "mini" : "x"
      phone = phone[type]
      fm.writeString(cachePath, type)
    }
  }
  
  message = "小组件尺寸";
  let sizes = ["小号", "中号", "大号"];
  let size = await generateAlert(message, sizes);
  let widgetSize = sizes[size];
  
  message = "小组件位置";
  message += height == 1136 ? " (请注意，您的设备仅支持两行小组件，因此中间和底部选项相同。)" : "";
  
  let crop = { w: "", h: "", x: "", y: "" }
  
  if (widgetSize == "小号") {
    crop.w = phone.小号;
    crop.h = phone.小号;
    let positions = ["顶部 左边", "顶部 右边", "中间 左边", "中间 右边", "底部 左边", "底部 右边"];
    let position = await generateAlert(message, positions);
    
    let keys = positions[position].toLowerCase().split(' ');
    crop.y = phone[keys[0]];
    crop.x = phone[keys[1]];
    
  } else if (widgetSize == "中号") {
    crop.w = phone.中号;
    crop.h = phone.小号;
    crop.x = phone.左边;
    let positions = ["顶部", "中间", "底部", "负屏"];
    let position = await generateAlert(message, positions);
    let key = positions[position].toLowerCase();
    crop.y = phone[key];
  } else if (widgetSize == "大号") {
    crop.w = phone.中号;
    crop.h = phone.大号;
    crop.x = phone.左边;
    let positions = ["顶部", "底部"];
    let position = await generateAlert(message, positions);
    crop.y = position ? phone.中间 : phone.顶部;
  }
  
  // Prompt for blur style.
  message = "背景图效果"
  let blurOptions = ["透明背景", "浅色模糊", "深色模糊", "完全模糊"];
  let blurred = await generateAlert(message, blurOptions);
  let imgCrop = cropImage(img);
  if (blurred) {
    const styles = ["", "light", "dark", "none"]
    const style = styles[blurred];
    imgCrop = await blurImage(img, imgCrop, style);
  }
  
  // 储存背景图片
  const fm = FileManager.local();
  const bgImage = fm.joinPath(cacheImg, Script.name());
  fm.writeImage(bgImage, imgCrop);
  
  // Generate an alert with the provided array of options.
  async function generateAlert(message,options) {
    let alert = new Alert();
    alert.message = message;
    for (const option of options) {
      alert.addAction(option);
    }
    let response = await alert.presentAlert();
    return response;
  }
  
  function cropImage(image) {
    let draw = new DrawContext();
    let rect = new Rect(crop.x,crop.y,crop.w,crop.h);
    draw.size = new Size(rect.width, rect.height);
    draw.drawImageAtPoint(image,new Point(-rect.x, -rect.y));
    return draw.getImage();
  }
  
  async function blurImage(img, imgCrop, style, blur = 150) {
    const js = `
var mul_table = [512, 512, 456, 512, 328, 456, 335, 512, 405, 328, 271, 456, 388, 335, 292, 512, 454, 405, 364, 328, 298, 271, 496, 456, 420, 388, 360, 335, 312, 292, 273, 512, 482, 454, 428, 405, 383, 364, 345, 328, 312, 298, 284, 271, 259, 496, 475, 456, 437, 420, 404, 388, 374, 360, 347, 335, 323, 312, 302, 292, 282, 273, 265, 512, 497, 482, 468, 454, 441, 428, 417, 405, 394, 383, 373, 364, 354, 345, 337, 328, 320, 312, 305, 298, 291, 284, 278, 271, 265, 259, 507, 496, 485, 475, 465, 456, 446, 437, 428, 420, 412, 404, 396, 388, 381, 374, 367, 360, 354, 347, 341, 335, 329, 323, 318, 312, 307, 302, 297, 292, 287, 282, 278, 273, 269, 265, 261, 512, 505, 497, 489, 482, 475, 468, 461, 454, 447, 441, 435, 428, 422, 417, 411, 405, 399, 394, 389, 383, 378, 373, 368, 364, 359, 354, 350, 345, 341, 337, 332, 328, 324, 320, 316, 312, 309, 305, 301, 298, 294, 291, 287, 284, 281, 278, 274, 271, 268, 265, 262, 259, 257, 507, 501, 496, 491, 485, 480, 475, 470, 465, 460, 456, 451, 446, 442, 437, 433, 428, 424, 420, 416, 412, 408, 404, 400, 396, 392, 388, 385, 381, 377, 374, 370, 367, 363, 360, 357, 354, 350, 347, 344, 341, 338, 335, 332, 329, 326, 323, 320, 318, 315, 312, 310, 307, 304, 302, 299, 297, 294, 292, 289, 287, 285, 282, 280, 278, 275, 273, 271, 269, 267, 265, 263, 261, 259];

var shg_table = [9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24];

function stackBlurCanvasRGB( id, top_x, top_y, width, height, radius ) {
  if ( isNaN(radius) || radius < 1 ) return;
  radius |= 0;
    
  var canvas  = document.getElementById( id );
  var context = canvas.getContext("2d");
  var imageData;
    
  try {
    try {
      imageData = context.getImageData( top_x, top_y, width, height );
    } catch(e) {
      try {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead")
        imageData = context.getImageData( top_x, top_y, width, height );
      } catch(e) {
        alert("Cannot access local image");
        throw new Error("unable to access local image data: " + e);
        return;
      }
    }
  } catch(e) {
    alert("Cannot access image");
    throw new Error("unable to access image data: " + e);
  };
        
  var pixels = imageData.data;
  var x, y, i, p, yp, yi, yw, r_sum, g_sum, b_sum,
  r_out_sum, g_out_sum, b_out_sum,
  r_in_sum, g_in_sum, b_in_sum,
  pr, pg, pb, rbs;
        
  var div = radius + radius + 1;
  var w4 = width << 2;
  var widthMinus1  = width - 1;
  var heightMinus1 = height - 1;
  var radiusPlus1  = radius + 1;
  var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) / 2;
    
  var stackStart = new BlurStack();
  var stack = stackStart;
  for ( i = 1; i < div; i++ ) {
    stack = stack.next = new BlurStack();
    if ( i == radiusPlus1 ) var stackEnd = stack;
  }
  stack.next = stackStart;
  var stackIn = null;
  var stackOut = null;
    
  yw = yi = 0;
  var mul_sum = mul_table[radius];
  var shg_sum = shg_table[radius];
    
  for ( y = 0; y < height; y++ ) {
    r_in_sum = g_in_sum = b_in_sum = r_sum = g_sum = b_sum = 0;
    r_out_sum = radiusPlus1 * ( pr = pixels[yi] );
    g_out_sum = radiusPlus1 * ( pg = pixels[yi+1] );
    b_out_sum = radiusPlus1 * ( pb = pixels[yi+2] );
      
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
      
    stack = stackStart;
    
    for ( i = 0; i < radiusPlus1; i++ ) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack = stack.next;
    };
      
    for( i = 1; i < radiusPlus1; i++ ) {
      p = yi + (( widthMinus1 < i ? widthMinus1 : i ) << 2 );
      r_sum += ( stack.r = ( pr = pixels[p])) * ( rbs = radiusPlus1 - i );
      g_sum += ( stack.g = ( pg = pixels[p+1])) * rbs;
      b_sum += ( stack.b = ( pb = pixels[p+2])) * rbs;
        
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
        
      stack = stack.next;
    };
      
    stackIn = stackStart;
    stackOut = stackEnd;
    for ( x = 0; x < width; x++ ) {
      pixels[yi]   = (r_sum * mul_sum) >> shg_sum;
      pixels[yi+1] = (g_sum * mul_sum) >> shg_sum;
      pixels[yi+2] = (b_sum * mul_sum) >> shg_sum;
        
      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
        
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
        
      p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) ) << 2;
        
      r_in_sum += ( stackIn.r = pixels[p]);
      g_in_sum += ( stackIn.g = pixels[p+1]);
      b_in_sum += ( stackIn.b = pixels[p+2]);
        
      r_sum += r_in_sum;
      g_sum += g_in_sum;
      b_sum += b_in_sum;
        
      stackIn = stackIn.next;
        
      r_out_sum += ( pr = stackOut.r );
      g_out_sum += ( pg = stackOut.g );
      b_out_sum += ( pb = stackOut.b );
        
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
        
      stackOut = stackOut.next;
      yi += 4;
    }
    yw += width;
  };
    
  for ( x = 0; x < width; x++ ) {
    g_in_sum = b_in_sum = r_in_sum = g_sum = b_sum = r_sum = 0;
      
    yi = x << 2;
    r_out_sum = radiusPlus1 * ( pr = pixels[yi]);
    g_out_sum = radiusPlus1 * ( pg = pixels[yi+1]);
    b_out_sum = radiusPlus1 * ( pb = pixels[yi+2]);
      
    r_sum += sumFactor * pr;
    g_sum += sumFactor * pg;
    b_sum += sumFactor * pb;
      
    stack = stackStart;
      
    for( i = 0; i < radiusPlus1; i++ ) {
      stack.r = pr;
      stack.g = pg;
      stack.b = pb;
      stack = stack.next;
    };
      
    yp = width;
      
    for( i = 1; i <= radius; i++ ) {
      yi = ( yp + x ) << 2;
      r_sum += ( stack.r = ( pr = pixels[yi])) * ( rbs = radiusPlus1 - i );
      g_sum += ( stack.g = ( pg = pixels[yi+1])) * rbs;
      b_sum += ( stack.b = ( pb = pixels[yi+2])) * rbs;
        
      r_in_sum += pr;
      g_in_sum += pg;
      b_in_sum += pb;
        
      stack = stack.next;
      
      if ( i < heightMinus1 ) {
        yp += width;
      }
    };
      
    yi = x;
    stackIn = stackStart;
    stackOut = stackEnd;
    for ( y = 0; y < height; y++ ) {
      p = yi << 2;
      pixels[p]   = (r_sum * mul_sum) >> shg_sum;
      pixels[p+1] = (g_sum * mul_sum) >> shg_sum;
      pixels[p+2] = (b_sum * mul_sum) >> shg_sum;
        
      r_sum -= r_out_sum;
      g_sum -= g_out_sum;
      b_sum -= b_out_sum;
        
      r_out_sum -= stackIn.r;
      g_out_sum -= stackIn.g;
      b_out_sum -= stackIn.b;
        
      p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width )) << 2;
        
      r_sum += ( r_in_sum += ( stackIn.r = pixels[p]));
      g_sum += ( g_in_sum += ( stackIn.g = pixels[p+1]));
      b_sum += ( b_in_sum += ( stackIn.b = pixels[p+2]));
        
      stackIn = stackIn.next;
        
      r_out_sum += ( pr = stackOut.r );
      g_out_sum += ( pg = stackOut.g );
      b_out_sum += ( pb = stackOut.b );
        
      r_in_sum -= pr;
      g_in_sum -= pg;
      b_in_sum -= pb;
        
      stackOut = stackOut.next;
      yi += width;
    }
  };
    
  context.putImageData( imageData, top_x, top_y );
};
  
function BlurStack() {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.a = 0;
  this.next = null;
};
  
function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  
  if (max == min) {  
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;  
    }
    h /= 6;
  }
  return [h, s, l];
};
  
function hslToRgb(h, s, l) {
  var r, g, b;
  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    var hue2rgb = function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
  
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);  
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};
    
function lightBlur(hsl) {
  let lumCalc = 0.35 + (0.3 / hsl[2]);
  if (lumCalc < 1) { lumCalc = 1; }
  else if (lumCalc > 3.3) { lumCalc = 3.3; }
  const l = hsl[2] * lumCalc;
  
  const colorful = 2 * hsl[1] * l;
  const s = hsl[1] * colorful * 1.5;
  return [hsl[0],s,l];
};
    
function darkBlur(hsl) {
 const colorful = 2 * hsl[1] * hsl[2];
  const s = hsl[1] * (1 - hsl[2]) * 3;
  return [hsl[0],s,hsl[2]];
};
  
const img = document.getElementById("blurImg");
const canvas = document.getElementById("mainCanvas")
  
const w = img.naturalWidth;
const h = img.naturalHeight;
  
canvas.style.width  = w + "px";
canvas.style.height = h + "px";
canvas.width = w;
canvas.height = h;
  
const context = canvas.getContext("2d");
context.clearRect( 0, 0, w, h );
context.drawImage( img, 0, 0 );

var imageData = context.getImageData(0,0,w,h);
var pix = imageData.data;

var imageFunc;
var style = "${style}";
if (style == "dark") {
  imageFunc = darkBlur;
} else if (style == "light") {
  imageFunc = lightBlur;
}
  
for (let i=0; i < pix.length; i+=4) {
  let hsl = rgbToHsl(pix[i],pix[i+1],pix[i+2]);
  if (imageFunc) {
    hsl = imageFunc(hsl);
  }
      
  const rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    
  pix[i] = rgb[0];
  pix[i+1] = rgb[1];
  pix[i+2] = rgb[2];
};
  

context.putImageData(imageData,0,0);
stackBlurCanvasRGB("mainCanvas", 0, 0, w, h, ${blur});

if (style == "dark") {
  context.globalCompositeOperation = "hard-light";
  context.fillStyle = "rgba(55,55,55,0.2)";
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = "soft-light";
  context.fillStyle = "rgba(55,55,55,1)";
  context.fillRect(0, 0, w, h);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgba(55,55,55,0.4)";
  context.fillRect(0, 0, w, h);
} else if (style == "light") {
  context.fillStyle = "rgba(255,255,255,0.4)";
  context.fillRect(0, 0, w, h);
};
canvas.toDataURL();
`;
    
    let blurImgData = Data.fromPNG(img).toBase64String()
    let html = `
  <img id="blurImg" src="data:image/png;base64,${blurImgData}" />
  <canvas id="mainCanvas" />
  `
    
    let view = new WebView()
    await view.loadHTML(html)
    let returnValue = await view.evaluateJavaScript(js);
    let imageDataString = returnValue.slice(22)
    let imageData = Data.fromBase64String(imageDataString)
    let imageFromData = Image.fromData(imageData)
    return cropImage(imageFromData)
  }
  
  // Pixel sizes and positions for widgets on all supported phones.
  function phoneSizes() {
    let phones = {
      // 14 Pro Max
      2796: {
        小号: 510,
        中号: 1092,
        大号: 1146,
        左边: 99,
        右边: 681,
        顶部: 282,
        中间: 918,
        底部: 1554,
        负屏: 2304
      },
      // 14 Pro
      2556: {
        小号: 474,
        中号: 1014,
        大号: 1062,
        左边: 82,
        右边: 622,
        顶部: 270,
        中间: 858,
        底部: 1446
      },
      // 12/13 Pro Max
      2778: {
        小号: 510,
        中号: 1092,
        大号: 1146,
        左边: 96,
        右边: 678,
        顶部: 246,
        中间: 882,
        底部: 1518,
        负屏: 2268
      },
      // 12/13 and 12/13 Pro
      2532: {
        小号: 474,
        中号: 1014,
        大号: 1062,
        左边: 78,
        右边: 618,
        顶部: 231,
        中间: 819,
        底部: 1407
      },
      // 11 Pro Max, XS Max
      2688: {
        小号: 507,
        中号: 1080,
        大号: 1137,
        左边: 81,
        右边: 654,
        顶部: 228,
        中间: 858,
        底部: 1488
      },
      // 11, XR
      1792: {
        小号: 338,
        中号: 720,
        大号: 758,
        左边: 54,
        右边: 436,
        顶部: 160,
        中间: 580,
        底部: 1000
      },
      // 11 Pro, XS, X, 12 mini
      2436: {
        x: {
          小号: 465,
          中号: 987,
          大号: 1035,
          左边: 69,
          右边: 591,
          顶部: 213,
          中间: 783,
          底部: 1353
        },
        mini: {
          小号: 465,
          中号: 987,
          大号: 1035,
          左边: 69,
          右边: 591,
          顶部: 231,
          中间: 801,
          底部: 1371
        }
      },
      // Plus phones
      2208: {
        小号: 471,
        中号: 1044,
        大号: 1071,
        左边: 99,
        右边: 672,
        顶部: 114,
        中间: 696,
        底部: 1278
      },
      // SE2 and 6/6S/7/8
      1334: {
        小号: 296,
        中号: 642,
        大号: 648,
        左边: 54,
        右边: 400,
        顶部: 60,
        中间: 412,
        底部: 764
      },
      // SE1
      1136: {
        小号: 282,
        中号: 584,
        大号: 622,
        左边: 30,
        右边: 332,
        顶部: 59,
        中间: 399,
        底部: 399
      },
      // 11 and XR in Display Zoom mode
      1624: {
        小号: 310,
        中号: 658,
        大号: 690,
        左边: 46,
        右边: 394,
        顶部: 142,
        中间: 522,
        底部: 902
      },
      // Plus in Display Zoom mode
      2001: {
        小号: 444,
        中号: 963,
        大号: 972,
        左边: 81,
        右边: 600,
        顶部: 90,
        中间: 618,
        底部: 1146
      },
    };
    return phones;
  }
}
module.exports = { main }