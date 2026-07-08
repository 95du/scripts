// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: random;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.0.0
 * https://t.me/+CpAbO_q_SGo2ZWE1
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'typhoon');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const settingPath = fm.joinPath(mainPath, 'setting.json');

const writeSettings = (setting) => {
  fm.writeString(settingPath, JSON.stringify(setting, null, 2));
};

const getSetting = () => {
  if (fm.fileExists(settingPath)) {
    const data = fm.readString(settingPath);
    return JSON.parse(data);
  }
};
const setting = getSetting() || {};

const useFileManager = () => {
  const fullPath = (name) => fm.joinPath(mainPath, name);
  return {
    readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
    writeImage: (name, image) => fm.writeImage(fullPath(name), image)
  }
};
  
const getCacheImage = async (name, url) => {
  const cache = useFileManager();
  const image = cache.readImage(name);
  if (image) return image;
  const loadedImg = await new Request(url).loadImage();
  cache.writeImage(name, loadedImg);
  return loadedImg;
};

const notify = (title, body, url, sound = 'event') => {
  const n = Object.assign(new Notification(), { title, body, sound });
  if (url) n.openURL = url;
  n.schedule();
};

const getFormattedTime = () => {
  const df = new DateFormatter();
  df.dateFormat = 'HH:mm';
  return df.string(new Date());
};

const loopdisplay = (arr) => {
  const optNextIndex = (num, data) => (num + 1) % data.length;
  setting.count = optNextIndex(setting.count || 0, arr);
  writeSettings(setting);
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/typhoon.js').loadString();
  fm.writeString(module.filename, script);
};

/** 
 * 位置/趋势
 * const locUrl = `https://tf02.istrongcloud.com/data/completion/${tf.ident || tf.tfbh}.json`;
 */
const currMergerTC = async (tf) => {
  try {
    const tcUrl = `https://tf02.istrongcloud.com/data/enComplex2/currMergerTC.json?random=${Date.now()}`
    const latestUrl = `https://data.istrongcloud.com/data/latest.json`;
    const [tc, latest] = await Promise.all([
      new Request(tcUrl).loadJSON(),
      new Request(latestUrl).loadJSON()
    ]);
    return { tc, latest };
  } catch (e) {
    console.log(e);
    return null;
  }
};

const getTyphoonData = async () => {
  try {
    const url = `https://tf02.istrongcloud.com/member/v1.2/home`
    const html = await new Request(url).loadString();
    const match = html.match(/typhoons_data = ([\s\S]*?);/)?.[1];
    const arr = JSON.parse(match);
    if (!arr.length) return null;
    loopdisplay(arr);
    typhoonNotice(html);
    const tf = arr[setting.count];
    const typhoon = tf.points[tf.points.length - 1];
    // 热带扰动，位置/趋势
    const { tc, latest } = await currMergerTC(tf) || {};
    return { 
      tf, typhoon, arr,
      tc, latest
    }
  } catch (e) {
    console.log(e);
    return null;
  }
};

const typhoonNotice = (html) => {
  const block = html.match(/typhoonNotice\s*:\s*({[\s\S]*?})\s*,/)?.[1];
  const tips = block?.match(/text\s*:\s*["']([^"']+)["']/)?.[1];
  if (tips && setting.tips !== tips) {
    notify(`⚠️ 台风信息通告`, tips);
    setting.tips = tips;
    writeSettings(setting);
  }
};

const speedChangeNotice = (typhoon, newest) => {
  if (typhoon && setting.speed !== typhoon.speed) {
    notify(`⚠️ 台风风速变化`, `风速${typhoon.speed}米/秒，${typhoon.power}级 ( ${newest.strong} ) 🌀\n${newest.location}`);
    setting.speed = typhoon.speed;
    writeSettings(setting);
  }
};

const currMergerTCNotice = (tc) => {
  const point = tc.points?.at(-1);
  if (!point) return;
  const formatTime = (time) => time.slice(0, 16).replace('T', ' ');
  setting.tc = setting.tc || {};
  const id = tc.ident;
  const oldSpeed = setting.tc[id];
  if (oldSpeed !== point.speed) {
    notify(
      `⚠️ ${tc.name} ${tc.ename}`,
      `${tc.ident} ${point.strong}\n风速${point.speed}米/秒，${point.power}级，${point.pressure}百帕\n更新时间: ${formatTime(point.time)}`
    );
    setting.tc[id] = point.speed;
    writeSettings(setting);
  }
};

const formatDate = (time, showMin) => {
  const date = new Date(time);
  const hour = String(date.getHours());
  return `${date.getMonth() + 1}月${date.getDate()}日${hour.padStart(2, '0')}时`;
};

const getTyphoonColor = (speed) => {
  if (speed >= 51) return new Color('#FF0000');
  if (speed >= 42) return new Color('#F55BF9');
  if (speed >= 33) return new Color('#FF7800');
  if (speed >= 25) return new Color('#FFD83A');
  if (speed >= 17) return new Color('#39A7F8');
  return new Color('#00C400');
};

const generateItem = (typhoon, land, newest) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${typhoon.lng}°　北纬${typhoon.lat}°`, 
      color: Color.blue() 
    },
    { 
      label: "风速风力", 
      value: `${typhoon.speed}米/秒，${typhoon.power}级 ( ${newest.strong} )`, 
      color: Color.red() 
    },
    { 
      label: typhoon.radius7 > 0 ? "风圈半径" : "登陆信息",
      value: typhoon.radius7 > 0
        ? `${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`
        : `${formatDate(land.land_time)}，在${land.position}登陆`,
      color: Color.orange()
    },
    { 
      label: "参考位置", 
      value: newest.location, 
      color: new Color('#8C7CFF') 
    },
    { 
      label: "未来趋势", 
      value: newest.trend, 
      color: Color.green() 
    }
  ];
};

const createButtonStack = (topStack, tyIcon, tf, typhoon) => {
  const barStack = topStack.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();
  barStack.setPadding(3, 10, 3, 10);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = getTyphoonColor(typhoon.speed);
  const icon = barStack.addImage(tyIcon);
  icon.imageSize = new Size(17, 17);
  icon.tintColor = Color.white();
  barStack.addSpacer(8);
  const statusText = barStack.addText(tf.tfbh + tf.name);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14);
  return barStack;
};

const createWidget = async (tyIcon, tf, typhoon, arr, date, info) => {
  const widget = new ListWidget();
  widget.setPadding(13, 20, 13, 20);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  createButtonStack(topStack, tyIcon, tf, typhoon);
  topStack.addSpacer(10);
  const dateText = topStack.addText(date)
  dateText.font = Font.mediumSystemFont(15);
  topStack.addSpacer();
  
  arr.forEach((tf, i) => {
    const speed = tf.points?.at(-1)?.speed || '';
    const icon = topStack.addImage(tyIcon);
    icon.imageSize = new Size(17, 17);
    icon.tintColor = getTyphoonColor(speed);
    if (i < arr.length - 1) {
      topStack.addSpacer(3);
    }
  });
  
  mainStack.addSpacer(8);
  
  info.forEach((item, i) => {
    const listStack = mainStack.addStack();
    listStack.layoutHorizontally();
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    labelText.textColor = item.color;
    listStack.addSpacer(15);
    const valueText = listStack.addText(item.value);
    valueText.font = Font.mediumSystemFont(13.5);
    if (i < info.length - 1) {
      mainStack.addSpacer(3);
    }
  });
  return widget;
};

const levelAgency = () => {
  return [
    { 
      label: '热带低压 (TD)', 
      agency: '中国', 
      iconColor: '#00C400',
      textColor: '#FF0000',
    },
    { 
      label: '热带风暴 (TS)', 
      agency: '日本', 
      iconColor: '#39A7F8',
      textColor: '#F55BF9',
    },
    { 
      label: '强热带风暴 (STS)', 
      agency: '韩国', 
      iconColor: '#FFD83A',
      textColor: '#FF7800',
    },
    { 
      label: '台风 (TY)', 
      agency: '美国', 
      iconColor: '#FF7800',
      textColor: '#FFD83A',
    },
    { 
      label: '强台风 (STY)', 
      agency: '中国台湾', 
      iconColor: '#F55BF9',
      textColor: '#39A7F8',
    },
    { 
      label: '超强台风 (SuperTY)', 
      agency: '中国香港', 
      iconColor: '#FF0000',
      textColor: '#00C400',
    },
  ];
};

const createLevelWidget = (level, tc = [], tcIcon, tyIcon) => {
  const widget = new ListWidget();
  widget.setPadding(15, 20, 15, 20);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer(4.5);
  const bar = topStack.addStack();
  bar.size = new Size(8, 20);
  bar.backgroundColor = new Color('#8C7CFF');
  bar.cornerRadius = 50;
  topStack.addSpacer(19);
  const levelText = topStack.addText('热带气旋等级、预报机构');
  levelText.font = Font.mediumSystemFont(15);
  levelText.textColor = new Color('#FF9800');
  topStack.addSpacer();
  
  if (tc.length) {
    tc.forEach((item, i) => {
      const icon = topStack.addImage(tcIcon);
      icon.imageSize = new Size(20, 20)
      icon.tintColor = Color.green()
      if (i < tc.length - 1) {
        topStack.addSpacer(3);
      }
      currMergerTCNotice(item);
    });
  } else {
    const timeText = topStack.addText(getFormattedTime());
    timeText.font = Font.mediumSystemFont(16);
    timeText.textColor = Color.green();
  }
  
  mainStack.addSpacer(5);
  
  level.forEach((item, i) => {
    const listStack = mainStack.addStack();
    listStack.layoutHorizontally();
    listStack.centerAlignContent();
    const icon = listStack.addImage(tyIcon);
    icon.imageSize = new Size(17, 17);
    icon.tintColor = new Color(item.iconColor);
    listStack.addSpacer(15);
    
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    listStack.addSpacer();
    const symbolText = listStack.addText('---');
    symbolText.font = Font.mediumSystemFont(13.5);
    symbolText.textColor = new Color(item.textColor);
    
    const agencyStack = listStack.addStack();
    agencyStack.layoutHorizontally();
    agencyStack.size = new Size(95, 0);
    agencyStack.addSpacer();
    const agencyText = agencyStack.addText(item.agency);
    agencyText.font = Font.mediumSystemFont(13.5);
    if (i < level.length - 1) {
      mainStack.addSpacer(3);
    }
  });
  return widget;
};

const runWidget = async () => {
  const tyIcon = await getCacheImage('typhoon.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/typhoon_1.png`);
  const tcIcon = await getCacheImage('tc.png', `https://tf02.istrongcloud.com/typhoonVisual/img/tfpt.png`);
  
  const { tf, typhoon, arr, tc, latest  } = await getTyphoonData() || {};
  
  let widget;
  if (!tf) {
    const level = levelAgency();
    widget = createLevelWidget(level, tc, tcIcon, tyIcon);
  } else {
    const newest = latest.find(item => item.tfbh === tf.tfbh);
    const date = formatDate(newest.update_time);
    const land = tf.land?.[tf.land?.length - 1] ?? {};
    const info = generateItem(typhoon, land, newest);
    speedChangeNotice(typhoon, newest);
    widget = await createWidget(tyIcon, tf, typhoon, arr, date, info);
  }
  
  widget.url = 'https://wxmpurl.cn/Pu9lL4aagIk';
  widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
  widget.backgroundImage = await getCacheImage('background.png', `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png`);
  
  if (config.runsInApp) {
    await widget.presentMedium();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};

await runWidget();