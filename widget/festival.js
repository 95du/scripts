// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: splotch;
/**
 * 组件作者：95du茅台
 * 组件名称: 节日倒计时
 * 圆环内部: 如果今日是休息日或工作日，则显示一个特定内容，否则显示下一个节日的星期。
 * 组件版本: Version 1.0.1
 * 发布日期: 2024-05-12 15:30
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 */

const fm = FileManager.local();
const cache = fm.joinPath(fm.documentsDirectory(), '95du_festival');
if (!fm.fileExists(cache)) fm.createDirectory(cache);
  
const useFileManager = ({ cacheTime, type } = {}) => {
  return {
    read: (name) => {
      const filePath = fm.joinPath(cache, name);
      if (fm.fileExists(filePath)) {
        if (hasExpired(filePath) > cacheTime) fm.remove(filePath);
        else return type ? JSON.parse(fm.readString(filePath)) : fm.readImage(filePath);
      }
    },
    write: (name, content) => {
      const filePath = fm.joinPath(cache, name);
      type ? fm.writeString(filePath, JSON.stringify(content)) : fm.writeImage(filePath, content);
    },
  };

  function hasExpired(filePath) {
    const createTime = fm.creationDate(filePath).getTime();
    return (Date.now() - createTime) / (60 * 60 * 1000);
  }
};

const getCacheData = async (name, url, type) => {
  const cache = useFileManager({  
    cacheTime: 4, type
  });
  const cacheData = cache.read(name);
  if (cacheData) return cacheData;
  const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
  if (response) {
    cache.write(name, response);
  }
  return response;
};

const autoUpdate = async () => {
  const script = await new Request(`${rootUrl}/widget/festival.js`).loadString();
  if (script.includes('95du茅台')) {
    fm.writeString(module.filename, script);  
  }
};

// 获取接下来的节日
const formatDate = (timestamp) => {
  const df = new DateFormatter();
  df.dateFormat = 'yyyy-MM-dd';
  return df.string(new Date(Number(timestamp) * 1000));
};

const daysRemaining = (date) => {
  const currentDate = new Date();
  const targetDate = new Date(date);
  return Math.ceil((targetDate - currentDate) / (1000 * 3600 * 24));
};

const fetchData = async () => {  
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const url = `https://opendata.baidu.com/data/inner?resource_id=52109&query=${encodeURIComponent(`${year}年${month}月`)}&apiType=yearMonthData`;
  const value = await getCacheData('api.json', url, true);
  const resultArray = value.Result[0].DisplayData.resultData.tplData.data.almanac;
  return resultArray;
};

const todayAndNext = async () => {
  const tplData = await fetchData();
  const date = new Date();
  
  const today = tplData.find(obj => {
    const objDate = new Date(obj.oDate);  
    return objDate.toDateString() === date.toDateString() && (obj.status == 1 || obj.status == 2);
  });
  
  const festivalObj = tplData.find(obj => {
    const objDate = new Date(obj.oDate);
    return (objDate.toDateString() === date.toDateString() || objDate.getTime() > date.getTime()) && obj.term;
  });
  
  if (today) festivalObj.status = today.status;
  return festivalObj;
};

// Circle
const drawArc = async (deg, fillColor, canvas, canvSize, canvWidth) => {
  const ctr = new Point(canvSize / 2, canvSize / 2);
  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(new Color(fillColor.hex, 0.3));
  canvas.setLineWidth(canvWidth);
  
  const canvRadius = 68
  const ellipseRect = new Rect(ctr.x - canvRadius, ctr.y - canvRadius, 2 * canvRadius, 2 * canvRadius);
  canvas.strokeEllipse(ellipseRect);

  for (let t = 0; t < deg; t++) {
    const x = ctr.x + canvRadius * Math.sin((t * Math.PI) / 180) - canvWidth / 2;
    const y = ctr.y - canvRadius * Math.cos((t * Math.PI) / 180) - canvWidth / 2;
    const rect = new Rect(x, y, canvWidth, canvWidth);
    canvas.fillEllipse(rect);
  }
};

const drawCircle = async (daysUntil, sta, cnDay) => {
  const canvSize = 200  
  const canvWidth = 16
  
  const canvas = new DrawContext();  
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.size = new Size(canvSize, canvSize);
  
  drawArc(Math.floor(daysUntil / 15 * 360), new Color('#FFDD00'), canvas, canvSize, canvWidth);
  
  const canvTextSize = sta ? 55 : 34
  const canvTextRect = new Rect(0, 100 - canvTextSize / 2, canvSize, canvTextSize);
  canvas.setTextAlignedCenter();
  canvas.setTextColor(Color.white());
  const font = Font.boldSystemFont(canvTextSize);
  canvas.setFont(font);
  canvas.drawTextInRect(sta || `周${cnDay}`, canvTextRect);
  return canvas.getImage();
};

const setBackground = async (widget, daysUntil) => {
  const festivalColors = daysUntil > 0
    ? [new Color('#7B417B'), new Color('#E796B7')] 
    : [new Color('#FF0000'), new Color('#FF9500')];
  
  const gradient = new LinearGradient();
  const angle = 90;
  const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
  const x = 0.5 + 0.5 * Math.cos(radianAngle);
  const y = 0.5 + 0.5 * Math.sin(radianAngle);
  gradient.startPoint = new Point(1 - x, y);
  gradient.endPoint = new Point(x, 1 - y);
  gradient.locations = [0, 1];
  gradient.colors = festivalColors;
  widget.backgroundGradient = gradient;
};

// 创建 Stack
const generateStack = (widget) => {
  const leftBarStack = widget.addStack();
  leftBarStack.layoutHorizontally();
  leftBarStack.centerAlignContent();
  return leftBarStack;
};

const createText = (stack, text, font, color, textSize) => {
  const stackText = stack.addText(text);
  stackText.font = textSize ? Font.boldSystemFont(font) : Font.mediumSystemFont(font);
  stackText.textColor = new Color(color);
  stackText.textOpacity = 0.9
  return stackText;
};

const setupWidget = async () => {
  const { status, oDate, timestamp, term, festivalList, festivalInfoList, cnDay, gzYear, lMonth, lDate } = await todayAndNext();
  const name = (term && term === festivalList) ? term : festivalInfoList[0].name;
  const date = formatDate(timestamp);
  const daysUntil = daysRemaining(oDate);
  const moreDays = daysUntil < 1 ? '今日是 ✨' : `还有`;
  const sta = status === '1' ? '休' : status === '2' ? '班' : '';
  
  const widget = new ListWidget();
  widget.setPadding(12, 12, 12, 12);
  const topStack = generateStack(widget);
  topStack.setPadding(0, 18, 0, 18);
  const nameStack = topStack.addStack();
  nameStack.layoutVertically();
  const arr = [...name];
  arr.forEach((item, i) => {
    createText(nameStack, item, (name.length > 3 ? 17 : 20), (daysUntil > 0 ? '#FFFFFF' : '#FFDD00'), 'bold');
  });
  topStack.addSpacer();
  const circleStack = topStack.addStack();
  circleStack.size = new Size(70, 70);
  circleStack.setPadding(0, -5, 0, -22)
  const circle = await drawCircle(daysUntil, sta, cnDay);
  circleStack.addImage(circle);
  widget.addSpacer();
  
  const surplusStack = generateStack(widget);
  surplusStack.addSpacer();
  const calendarIcon = await getCacheData('calendar.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/symbol/calendar.png');
  const icon = surplusStack.addImage(calendarIcon);
  icon.imageSize = new Size(16, 16);
  icon.tintColor = Color.yellow();
  surplusStack.addSpacer();
  createText(surplusStack, moreDays, 14, '#FFFFFF');
  if (daysUntil > 0) {
    surplusStack.addSpacer(5);
    createText(surplusStack, `${daysUntil}`, 15.5, '#FFDD00');
    surplusStack.addSpacer(5);
    createText(surplusStack, '天', 14, '#FFFFFF');
  }
  surplusStack.addSpacer();
  widget.addSpacer(2);
  
  const bottomStack = widget.addStack();
  bottomStack.backgroundColor = new Color('#333333', 0.5);
  bottomStack.setPadding(5, 0, 5, 0);
  bottomStack.cornerRadius = 12
  const dateStack = generateStack(bottomStack);
  dateStack.addSpacer();
  const weekStack = dateStack.addStack();
  weekStack.layoutVertically();
  createText(weekStack, date, 17.5, (daysUntil > 0 ? '#FFFFFF' : '#FFDD00'), 'bold');
  weekStack.addSpacer(1);
  createText(weekStack, (`${gzYear}年 · ${lMonth}月${lDate}`), 13, '#FFFFFF', 'bold');
  dateStack.addSpacer();
  
  const img = await getCacheData('holidays.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/picture/holidays_1.png');
  widget.backgroundColor = Color.black();
  widget.backgroundImage = img;
  widget.url = 'https://m.baidu.com/from=844b/s?word=万年历';
  return widget;
};

const errorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('仅支持小号组件');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  return widget;
};

const renderWidget = async () => {
  const widget = config.widgetFamily === 'small' || config.runsInApp ? await setupWidget() : errorWidget();
  if (!config.runInWidget) {
    widget.presentSmall();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};
await renderWidget();