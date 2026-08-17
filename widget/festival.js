// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: splotch;
/**
 * 组件作者：95du茅台
 * 组件名称: 节日倒计时
 * 组件版本: Version 1.0.1
 * 发布日期: 2024-05-12 15:30
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 */

const fm = FileManager.local();
const cache = fm.joinPath(fm.documentsDirectory(), '95du_festival');
if (!fm.fileExists(cache)) fm.createDirectory(cache);
const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';

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

const fetchData = async () => {
  const curDate = new Date();
  const year = curDate.getFullYear();
  const month = curDate.getMonth() + 2;

  const url = `https://opendata.baidu.com/data/inner?resource_id=52109&query=${encodeURIComponent(`${year}年${month}月`)}&apiType=yearMonthData`;
  const result = await getCacheData('api.json', url, true);
  const tplData = result.Result[0].DisplayData.resultData.tplData.data.almanac;

  const today = tplData.find(obj => {
    const objDate = new Date(obj.oDate);
    return objDate.toDateString() === curDate.toDateString();
  });
  
  const festivals = tplData
    .filter(obj => {
      const objDate = new Date(obj.oDate);
      return objDate > curDate && (
        obj.type === 't' ||
        !!obj.term ||
        !!obj.desc ||
        obj.status === '1' ||
        obj.status === '2'
      );
    })
    .sort((a, b) => new Date(a.oDate) - new Date(b.oDate));

  return [
    today,
    ...festivals
  ].filter(Boolean);
};

const daysRemaining = (date) => {
  const currentDate = new Date();
  const targetDate = new Date(date);
  return Math.ceil((targetDate - currentDate) / (1000 * 3600 * 24));
};

const createCardItem = (rowStack, festival, index) => {
  const { status, day, term, desc, lDate, oDate, festivalList, festivalInfoList } = festival;
      
  const isToday = index === 0;
  const isRest = status === '1';
  const isWork = status === '2';
  
  const festivalName =term || desc;
  const name = isWork && !festivalName
    ? lDate : festivalName || lDate;
  
  const todaySta = isRest ? '休' : isWork ? '班' : '今';
  const dayUntil = Math.max(0, daysRemaining(oDate));
  const otherSta = isRest ? '休' : isWork ? '班' : `${dayUntil}`;
  const statusText = isToday ? todaySta : otherSta;
  
  const borderColor =
    isRest ? '#FF0000' :
    isWork ? '#00C400' :
    isToday ? '#007AFF' : '#AAAAAA';
  const staColor =
    isRest ? '#FF0000' :
    isWork ? '#00C400' :
    isToday ? '#007AFF' : '#FF9500';
  
  const idxStack = rowStack.addStack();
  idxStack.layoutVertically();
  idxStack.size = new Size(70, 70);
  idxStack.backgroundColor = new Color(borderColor, isRest || isWork || isToday ? 0.2 : 0.3);
  idxStack.borderColor = new Color(borderColor);
  idxStack.cornerRadius = 20;
  idxStack.borderWidth = 4;
  idxStack.addSpacer();
  
  const dayStack = idxStack.addStack();
  dayStack.layoutHorizontally();
  dayStack.size = new Size(0, 32);
  dayStack.addSpacer();
 
  const leftStack = dayStack.addStack();
  leftStack.layoutVertically();
  leftStack.addSpacer();
  const dayText = leftStack.addText(day);
  dayText.font = Font.mediumSystemFont(25);
  dayText.textColor = Color.white();
  
  const rightStack = dayStack.addStack();
  rightStack.layoutVertically();
  rightStack.addSpacer(3);
  const staStack = rightStack.addStack();
  staStack.layoutHorizontally();
  staStack.centerAlignContent();
  staStack.size = new Size(18, 20);
  staStack.cornerRadius = 4;
  staStack.setPadding(1, 0, 1, 0);
  staStack.backgroundColor = new Color(staColor);
  const staText = staStack.addText(statusText);
  staText.font = Font.mediumSystemFont(12);
  staText.textColor = Color.white();
  rightStack.addSpacer();
  dayStack.addSpacer();
  idxStack.addSpacer(5);
  
  const butStack = idxStack.addStack();
  butStack.layoutHorizontally();
  butStack.addSpacer(13);
  const termText = butStack.addText(name);
  termText.font = Font.mediumSystemFont(13);
  termText.textOpacity = 0.85
  termText.textColor = Color.white();
  butStack.addSpacer();
  idxStack.addSpacer();
};

// 创建指数组件
const renderIndexWidget = async (festivals) => {
  const widget = new ListWidget();
  const family = config.widgetFamily;
  if (family === 'large') {
    widget.setPadding(20, 20, 20, 20);
  }
  const rows =
    family === 'large' ? 4 :
    family === 'medium' ? 2 : 2;
  const cols =
    family === 'small' ? 2 : 4;

  for (let r = 0; r < rows; r++) {
    const rowStack = widget.addStack();
    rowStack.layoutHorizontally();
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c;
      const festival = festivals[index];
      if (!festival) break;
      createCardItem(rowStack, festival, index);
      if (c < cols - 1) {
        rowStack.addSpacer();
      }
    }
    if (r < rows - 1) widget.addSpacer();
  }

  return widget;
};

const renderWidget = async () => {
  const festivals = await fetchData();
  const widget = await renderIndexWidget(festivals);
  const img = await getCacheData('holidays.png', `${rootUrl}/img/picture/holidays_1.png`);
  widget.backgroundImage = img;
  widget.url = 'https://m.baidu.com/from=844b/s?word=万年历';
  if (!config.runInWidget) {
    widget.presentMedium();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};

await renderWidget();