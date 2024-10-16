// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: adjust;
const batteryLevel = Device.batteryLevel() * 100;
const progressColor =
  batteryLevel <= 20
    ? "#D50000"
    : batteryLevel <= 30
    ? "#FFD723"
    : batteryLevel <= 50
    ? "#FF9500"
    : batteryLevel <= 70
    ? "#48D0BE"
    : "#3BC952";

const innerProgress = 0.5
const innerProgressColor = '#FFFFFF'

const canvSize = 200
const canvWidth = 19

const drawArc = async (deg, fillColor, canvas) => {
  const ctr = new Point(canvSize / 2, canvSize / 2);

  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(
    Color.dynamic(new Color('#EDEDED', 0.5), new Color('#666666', 0.5))
  );
  canvas.setLineWidth(canvWidth);
  
  const canvRadius = 70
  const ellipseRect = new Rect(ctr.x - canvRadius, ctr.y - canvRadius, 2 * canvRadius, 2 * canvRadius);
  canvas.strokeEllipse(ellipseRect);

  for (let t = 0; t < deg; t++) {
    const x = ctr.x + canvRadius * Math.sin((t * Math.PI) / 180) - canvWidth / 2;
    const y = ctr.y - canvRadius * Math.cos((t * Math.PI) / 180) - canvWidth / 2;
    const rect = new Rect(x, y, canvWidth, canvWidth);
    canvas.fillEllipse(rect);
  }
};

const drawCircle = async () => {
  const canvas = new DrawContext();  
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.size = new Size(canvSize, canvSize);
  
  drawArc(Math.floor(innerProgress * 360), new Color(innerProgressColor), canvas);
  
  const canvTextSize = 30
  const canvTextRect = new Rect(0, 100 - canvTextSize / 2, canvSize, canvTextSize);
  canvas.setTextAlignedCenter();
  canvas.setTextColor(Color.white());
  canvas.setFont(Font.boldSystemFont(canvTextSize));
  canvas.drawTextInRect(`${Math.floor(batteryLevel)}%`, canvTextRect);
  return canvas.getImage();
}

const setupWidget = async () => {
  const widget = new ListWidget();
  widget.backgroundColor = new Color(progressColor)
  
  widget.setPadding(7, 7, 7, 7);
  const mainStack = widget.addStack();
  mainStack.setPadding(0, 0, 8, 0);
  mainStack.layoutVertically();
  
  const topStack = mainStack.addStack();  
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer();
  
  const balStack = topStack.addStack();
  balStack.layoutVertically();
  
  const balText = balStack.addText('余额');
  balText.font = Font.mediumSystemFont(26);
  balText.textColor = new Color('#FFFFFF');
  
  const balanceText = balStack.addText('10.55');
  balanceText.font = Font.mediumSystemFont(22)
  balanceText.textColor = new Color('#FFFFFF');
  topStack.addSpacer(10);
  
  const circle = await drawCircle();
  topStack.addImage(circle);
  mainStack.addSpacer();
  
  // 底部
  const bottomStack = mainStack.addStack();
  bottomStack.layoutHorizontally();
  bottomStack.centerAlignContent();
  bottomStack.addSpacer();
  
  const barStack = bottomStack.addStack();
  barStack.backgroundColor = Color.white()
  barStack.setPadding(10, 32, 10, 32);
  barStack.cornerRadius = 30

  const titleText = barStack.addText('50.28 GB');
  titleText.textColor = new Color(progressColor)
  titleText.font = Font.boldSystemFont(16);
  titleText.centerAlignText();
  bottomStack.addSpacer();
  
  if (!config.runInWidget) {
    await widget.presentSmall()
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};
await setupWidget();