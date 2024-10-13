// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: atom;
/**
 * 组件作者：95度茅台
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
  const response = type ? await new Request(url).loadJSON() : await new Request(url).loadImage();
  if (response) {
    cache.write(name, response);
  }
  return response;
};

const autoUpdate = async () => {
  const script = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/festival.js').loadString();
  fm.writeString(module.filename, script);
};

const shimoFormData = () => {
  const req = new Request(atob('aHR0cHM6Ly9zaGltby5pbS9hcGkvbmV3Zm9ybXMvZm9ybXMvOE5rNmV2Wng0S1NqNE5xTC9zdWJtaXQ='));
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [{
      type: 4,
      guid: 'gTmPmwch',
      text: { content: '' }
    }],
    userName: `${Script.name()}  -  ${Device.systemName()} ${Device.systemVersion()}`
  });
  req.load();
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
  const url = `https://opendata.baidu.com/data/inner?resource_id=52109&query=${year}%E5%B9%B4${month}%E6%9C%88&apiType=yearMonthData`;
  const value = await getCacheData('api.json', url, true);
  const resultArray = value.Result[0].DisplayData.resultData.tplData.data.almanac;
  return resultArray;
};

const todayAndNext = async () => {
  shimoFormData();
  const tplData = await fetchData();
  const date = new Date();
  
  const today = tplData.find(obj => {
    const objDate = new Date(obj.oDate);  
    return objDate.toDateString() === date.toDateString() &&  (obj.status == 1 || obj.status == 2);
  });
  
  const festivalObj = tplData.find(obj => {
    const objDate = new Date(obj.oDate);
    return (objDate.toDateString() === date.toDateString() || objDate.getTime() > date.getTime()) && obj.term;
  });
  
  if (today) festivalObj.status = today.status;
  return festivalObj;
};

const { status, oDate, timestamp, term, cnDay, yjJumpUrl } = await todayAndNext();

const date = formatDate(timestamp);
const daysUntil = daysRemaining(oDate);
const moreDays = daysUntil < 1 ? '今天是 ✨' : `还有 ${daysUntil} 天`;
const sta = status === '1' ? '休' : status === '2' ? '班' : '';

// Circle
const drawArc = async (deg, fillColor, canvas, canvSize, canvWidth) => {
  const ctr = new Point(canvSize / 2, canvSize / 2);
  canvas.setFillColor(fillColor);
  canvas.setStrokeColor(new Color(fillColor.hex, 0.3));
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
  const canvSize = 200  
  const canvWidth = 18
  
  const canvas = new DrawContext();  
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.size = new Size(canvSize, canvSize);
  
  drawArc(Math.floor(daysUntil / 20 * 360), new Color('#FFDD00'), canvas, canvSize, canvWidth);
  
  const canvTextSize = sta ? 55 : 36
  const canvTextRect = new Rect(0, 100 - canvTextSize / 2, canvSize, canvTextSize);
  canvas.setTextAlignedCenter();
  canvas.setTextColor(Color.white());
  const font = Font.boldSystemFont(canvTextSize);
  canvas.setFont(font);
  canvas.drawTextInRect(sta || `周${cnDay}`, canvTextRect);
  return canvas.getImage();
};

const setBackground = async (widget) => {
  if (daysUntil > 0) {
    widget.backgroundImage = await getCacheData('background.jpeg', 'https://gitcode.net/4qiao/framework/raw/master/img/picture/background_festival.jpeg');
  } else {
    const gradient = new LinearGradient();
    const angle = 90 // 渐变角度
    const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
    const x = 0.5 + 0.5 * Math.cos(radianAngle);
    const y = 0.5 + 0.5 * Math.sin(radianAngle);
    gradient.startPoint = new Point(1 - x, y);
    gradient.endPoint = new Point(x, 1 - y);
      
    gradient.locations = [0, 1];
    gradient.colors = [
      new Color('#FF0000'),
      new Color('#FF9500')
    ];
    widget.backgroundGradient = gradient;
  }
};

const setupWidget = async () => {
  const widget = new ListWidget();
  await setBackground(widget);
  widget.url = yjJumpUrl;
  
  widget.setPadding(10, 8, 10, 8);
  const mainStack = widget.addStack();
  mainStack.setPadding(0, 0, 6, 0);
  mainStack.layoutVertically();
  
  const topStack = mainStack.addStack();  
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer();
  
  const festivalStack = topStack.addStack();
  festivalStack.layoutVertically();
  const festivalText = festivalStack.addText(term);
  festivalText.font = Font.boldSystemFont(term.length > 3 ? 17 : 21);
  festivalText.textColor = new Color('#FFDD00');
  festivalStack.addSpacer(5);
  
  const countdownText = festivalStack.addText(moreDays);
  countdownText.font = Font.mediumSystemFont(14);
  countdownText.textColor = Color.white();
  topStack.addSpacer();
  
  const circle = await drawCircle();
  topStack.addImage(circle);
  mainStack.addSpacer();
  
  const starStack = mainStack.addStack();
  starStack.layoutHorizontally();
  starStack.addSpacer(25);
  const starIcon = starStack.addImage(SFSymbol.named('sparkles').image);
  starIcon.imageSize = new Size(18, 18);
  starIcon.tintColor = new Color('#FFDD00');
  mainStack.addSpacer();
  
  const bottomStack = mainStack.addStack();
  bottomStack.layoutHorizontally();
  bottomStack.centerAlignContent();
  bottomStack.addSpacer();
  
  const barStack = bottomStack.addStack();
  barStack.backgroundColor = new Color('#333333', 0.2);
  barStack.setPadding(10, 0, 10, 0);
  barStack.cornerRadius = 12
  
  const dateStack = barStack.addStack();
  dateStack.layoutHorizontally();
  dateStack.addSpacer();
  const dateText = dateStack.addText(date);
  dateText.textColor = Color.white();
  dateText.font = Font.boldSystemFont(17);
  dateStack.addSpacer();
  bottomStack.addSpacer();
  
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
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};
await renderWidget();