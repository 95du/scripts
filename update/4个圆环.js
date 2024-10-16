// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: genderless;
let today = new Date();
let dayNumber = Math.ceil((today - new Date(today.getFullYear(),0,1)) / 86400000);
let thisDayDate = today.getDate()
let thisMonth = today.getMonth()
let thisYear = today.getFullYear()
let daysYear = (leapYear(today.getFullYear())) ? 366 : 365;
let daysThisMonth = daysInMonth(thisMonth+1, thisYear)
const dateFormatter = new DateFormatter()
dateFormatter.dateFormat = "MMM"

const canvSize = 200;
const canvTextSize = 24;
const canvas = new DrawContext();
canvas.opaque = false;
const battCircleRemainColor = new Color('#799351'); //Battery remaining color
const battCircleDepletedColor = new Color('#d54062'); //Battery depleted color
const battCircleBGColor = new Color('#000'); //Widget background color
const battCircleTextColor = new Color('#fff'); //Widget text color (use same color as above to hide text)

const remainColor = new Color('#dddddd')
const monthCircleColor = new Color('#ffa36c')
const dayCircleColor = new Color('#ebdc87')
const dayNCircleColor = new Color('#318fb5')

const canvWidth = 15; //Battery circle thickness
const canvRadius = 75; //Battery circle radius

canvas.size = new Size(canvSize, canvSize);
canvas.respectScreenScale = true;
const batteryLevel = Device.batteryLevel();

/*
BEGIN Widget Layout
*/

let widget = new ListWidget();
widget.setPadding(10,10,10,10);

let mainStack = widget.addStack();
mainStack.layoutHorizontally();
mainStack.setPadding(0,0,0,0);

drawArc(
  Math.floor(batteryLevel * 100 * 3.6),
  battCircleRemainColor,
  battCircleDepletedColor,
  battCircleTextColor,
  Math.floor(batteryLevel * 100).toString(),
  "⚡️"
)

mainStack.addImage(canvas.getImage())

drawArc(
  Math.floor(((thisMonth+1)/12)*100 * 3.6),
  monthCircleColor,
  remainColor,
  battCircleTextColor,
  dateFormatter.string(today),
  "🗓"
)

mainStack.addImage(canvas.getImage())

drawArc(
  Math.floor((thisDayDate/daysThisMonth)*100 * 3.6),
  dayCircleColor,
  remainColor,
  battCircleTextColor,
  thisDayDate.toString(),
  "⭐️"
)

mainStack.addImage(canvas.getImage())

drawArc(
  Math.floor(dayNumber/daysYear*100 * 3.6),
  dayNCircleColor,
  remainColor,
  battCircleTextColor,
  dayNumber.toString(),
  '☑️'
)

mainStack.addImage(canvas.getImage())

widget.backgroundColor = Color.black()
Script.setWidget(widget);
widget.presentMedium();
Script.complete();

/*
END Widget Layout
*/

function sinDeg(deg) {
  return Math.sin((deg * Math.PI) / 180);
}

function cosDeg(deg) {
  return Math.cos((deg * Math.PI) / 180);
}

function drawArc(deg, fillColor, strokeColor, txtColor, text, label) {
  let ctr = new Point(canvSize / 2, canvSize / 2),
  bgx = ctr.x - canvRadius;
  bgy = ctr.y - canvRadius;
  bgd = 2 * canvRadius;
  bgr = new Rect(bgx, bgy, bgd, bgd);
  
  // canvas.opaque = false;

  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(strokeColor);
  canvas.setLineWidth(canvWidth);
  canvas.strokeEllipse(bgr);

  for (t = 0; t < deg; t++) {
    rect_x = ctr.x + canvRadius * sinDeg(t) - canvWidth / 2;
    rect_y = ctr.y - canvRadius * cosDeg(t) - canvWidth / 2;
    rect_r = new Rect(rect_x, rect_y, canvWidth, canvWidth);
    canvas.fillEllipse(rect_r);
  }
  // attempt to draw info text
  const canvTextRect = new Rect(
    0,
    100 - canvTextSize / 2,
    canvSize,
    canvTextSize
  );
  const canvLabelRect = new Rect(
    0,
    (100 - canvTextSize / 2)-30,
    canvSize,
    canvTextSize+5
  );
  canvas.setTextAlignedCenter();
  canvas.setTextColor(txtColor);
  canvas.setFont(Font.boldSystemFont(canvTextSize));
  canvas.drawTextInRect(text, canvTextRect);
  canvas.drawTextInRect(label, canvLabelRect);
  // return canvas.getImage()
}

function leapYear(year) {
  return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
}

function daysInMonth (month, year) {
    return new Date(year, month, 0).getDate();
}