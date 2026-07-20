// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: random;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.0.0
 * https://t.me/+CpAbO_q_SGo2ZWE1
 * 中大号组件 ‼️
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

const loopdNextIdx = (arr, name) => {
  const optNextIndex = (num, data) => (num + 1) % data.length;
  setting[name] = optNextIndex(setting[name] || 0, arr);
  writeSettings(setting);
  return arr[setting[name]];
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/typhoon.js').loadString();
  if (script.includes('組件')) fm.writeString(module.filename, script)
};

const tyIcon = await getCacheImage('typhoon.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/typhoon_1.png`);
const tcIcon = await getCacheImage('tc.png', `https://tf02.istrongcloud.com/typhoonVisual/img/tfpt.png`);

const getLocation = async () => {
  if (setting.updateTime) {
    const diff = Date.now() - setting.updateTime;
    const hours = diff / (3600 * 1000);
    if (hours < 3) return setting;
  }

  try {
    const location = await Location.current();
    setting.lon = location.longitude;
    setting.lat = location.latitude;
    setting.updateTime = Date.now();
    writeSettings(setting);
  } catch (e) {
    console.log(e);
    return setting || null;
  }
};

// 和风天气分钟降雨
const getMinRain = async () => {
  try {
    const url = `https://api.qweather.com/v7/minutely/5m?key=73ca4f214b9241fb98f6d291345d9d84&location=${setting.lon},${setting.lat}`
    const rain = await new Request(url).loadJSON();
    if (rain.code !== '200') {
      getLocation();
      return '';
    }
    if (setting.summary !== rain.summary) {
      notify('降雨提示 ⛈️', rain.summary);
      setting.summary = rain.summary;
      writeSettings(setting);
    }
    return rain.summary;
  } catch (e) {
    console.log(e);
    return '';
  }
};

//.热带扰动
const currMergerTC = async (tf) => {
  try {
    const tcUrl = `https://tf02.istrongcloud.com/data/enComplex2/currMergerTC.json?random=${Date.now()}`
    const tc = await new Request(tcUrl).loadJSON();
    const p = loopdNextIdx(tc, 'TC');
    return { tc, p };
  } catch (e) {
    console.log(e);
    return {};
  }
};

/** 
 * 经纬度/位置/趋势/台风动态
 */
const complementLocTrend = async (tf, latest) => {
  if (!tf) return;
  const newest = latest.find(item => item.tfbh === tf.tfbh);
  if (!newest.location) {
    const locUrl = `https://tf.istrongcloud.com/data/completion/${tf.ident || tf.tfbh}.json`;
    const loc = await new Request(locUrl).loadJSON();
    newest.location = loc.location;
    newest.trend = loc.completion;
  }
  return newest;
};

const getLatestData = async (tf) => {
  try {
    const msgUrl = `https://tf02.istrongcloud.com/data/message/message.json`;
    const latestUrl = `https://data.istrongcloud.com/data/latest.json`;
    const [message, latest] = await Promise.all([
      new Request(msgUrl).loadJSON(),
      new Request(latestUrl).loadJSON()
    ]);
    messageNotice(message?.[0]);
    const newest = await complementLocTrend(tf, latest);
    return newest;
  } catch (e) {
    console.log(e);
    return null;
  }
};

/** 
 * https://typhoon.slt.zj.gov.cn/Api/TyhoonActivity
 * https://typhoon.slt.zj.gov.cn/Api/TyphoonInfo/202609
 *
 * https://tf02.istrongcloud.com/typhoonVisual/home?theme=light
 * https://tf.istrongcloud.com/release/index-hrtt.html
 */
const getTyphoonData = async () => {
  try {
    const url = `https://tf02.istrongcloud.com/member/v1.2/home`
    const html = await new Request(url).loadString();
    const match = html.match(/typhoons_data = ([\s\S]*?)[;|<]/)?.[1];
    const arr = JSON.parse(match);
    if (!arr.length) return null;
    typhoonNotice(html);
    const tf = loopdNextIdx(arr, 'TF');
    const typhoon = tf.points[tf.points.length - 1];
    return { arr, tf, typhoon }
  } catch (e) {
    console.log(e);
    return null;
  }
};

/*
const notice = https://tf02.istrongcloud.com/data/moduleConfig/typhoonModuleConfig.json
const home = notice.data.find(item => item.code === 'TYPHOON_HOME_NOTICE');
console.log(home.data.common.title)
 */
const typhoonNotice = (html) => {
  const block = html.match(/config\s*:\s*(\[[\s\S]*?\])\s*,/)?.[1];
  const tips = block?.match(/text\s*:\s*["']([^"']+)["']/)?.[1];
  if (tips && setting.tips !== tips) {
    notify(`⚠️ 台风信息通告`, tips);
    setting.tips = tips;
    writeSettings(setting);
  }
};

const messageNotice = (msg) => {
  if (msg && setting.message !== msg.message) {
    notify(`⚠️ ${msg.title}`, msg.message);
    setting.message = msg.message;
    writeSettings(setting);
  }
};

const speedChangeNotice = (tf, typhoon, newest) => {
  if (!tf) return;
  setting.tf = setting.tf || {};
  setting.tf[tf.ename] = setting.tf[tf.ename] || {};
  const oldSpeed = setting.tf[tf.ename].speed;
  if (oldSpeed !== typhoon.speed) {
    const body = `风速 ${typhoon.speed || 0}米/秒，${typhoon.power || 0}级 ( ${newest.strong} ) 🌀` + (newest.location ? `\n${newest.location}` : '');
    notify(`⚠️ 台风 [${tf.name}] 风速变化`, body);
    setting.tf[tf.ename].speed = typhoon.speed || 0;
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
      `${tc.ident} ${point.strong}\n风速 ${point.speed || 0}米/秒，${point.power || 0}级，${point.pressure || 0}百帕\n更新时间: ${formatTime(point.time)}`
    );
    setting.tc[id] = point.speed || 0;
    writeSettings(setting);
  }
};

const formatDate = (time, showMin) => {
  const date = new Date(time);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = date.getMinutes();
  return `${date.getMonth() + 1}月${date.getDate()}日${hour}时` + (showMin && minute ? `${minute}分` : '');
};

const getTyphoonColor = (speed) => {
  const colors = [
    [51, '#FF0000'], [42, '#FA5EFF'],
    [33, '#FF7800'], [25, '#FFD83A'],
    [17, '#39A7F8'], [0, '#00C400']
  ];
  return new Color(colors.find(([min]) => speed >= min)?.[1]);
};

// `https://tf.istrongcloud.com/tcScreenshot/active/${tf.ident}.png`
const setBackground = async (widget, isLarge) => {
  widget.url = 'https://wxmpurl.cn/Pu9lL4aagIk';
  if (isLarge) {
    const url = `https://tf.istrongcloud.com/tcScreenshot/active/poster/result.png?r=${Date.now()}`;
    widget.backgroundImage = await new Request(url).loadImage();
  } else {
    widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    widget.backgroundImage = await getCacheImage('background.png', `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png`);
  }
};

const generateItem = (typhoon, land, newest) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${newest.lon}°　北纬${newest.lat}°`, 
      color: new Color('#00C400')
    },
    { 
      label: "风速风力", 
      value: `${typhoon.speed}米/秒，${typhoon.power}级 ( ${newest.strong} )`, 
      color: new Color('#39A7F8')
    },
    { 
      label: land ? "登陆位置" : "风圈半径",
      value: land
        ? `${formatDate(land.land_time, true)}，在${land.position}登陆`
        : `${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`,
      color: new Color('#FFD83A')
    },
    { 
      label: "参考位置", 
      value: newest.location,
      color: new Color('#FF7800')
    },
    { 
      label: "未来趋势", 
      value: newest.trend,
      color: new Color('#8C7CFF')
    }
  ];
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
      agency: '欧洲', 
      iconColor: '#F55BF9',
      textColor: '#39A7F8',
    },
    { 
      label: '超强台风 (SuperTY)', 
      agency: '香港', 
      iconColor: '#FF0000',
      textColor: '#00C400',
    },
  ];
};

const createBarStack = (stack, color, radius = 7, padding) => {
  const barStack = stack.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();
  barStack.setPadding(padding ? 4 : 3, 10, padding ? 4 : 3, 10);
  barStack.cornerRadius = radius;
  barStack.backgroundColor = color;
  return barStack;
};

const createButtonStack = (topStack, tyIcon, tf, typhoon) => {
  const color = getTyphoonColor(typhoon.speed);
  const barStack = createBarStack(topStack, color);
  const icon = barStack.addImage(tyIcon);
  icon.imageSize = new Size(17, 17);
  icon.tintColor = Color.white();
  barStack.addSpacer(6);
  const statusText = barStack.addText(tf.tfbh + tf.name);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14.5);
  return barStack;
};

const createWidget = (arr, tf, typhoon, date, info, textColor, isLarge) => {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.setPadding(isLarge ? 15 : 13, 20, isLarge ? 15 : 4, 20);
  createButtonStack(topStack, tyIcon, tf, typhoon);
  topStack.addSpacer(10);
  const dateText = topStack.addText(date)
  dateText.font = Font.mediumSystemFont(14.5);
  dateText.textColor = textColor;
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
  
  if (isLarge) widget.addSpacer();
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.setPadding(isLarge ? 15 : 4, 20, isLarge ? 15 : 13, 20);
  if (isLarge && !typhoon.radius10) {
    mainStack.backgroundColor = new Color('#00C400', 0.18);
  }
  
  info.forEach((item, i) => {
    const listStack = mainStack.addStack();
    listStack.layoutHorizontally();
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    labelText.textColor = item.color;
    listStack.addSpacer(13);
    const valueText = listStack.addText(item.value);
    valueText.font = Font.mediumSystemFont(13.5);
    valueText.textColor = textColor;
    if (isLarge && !typhoon.radius10) listStack.addSpacer();
    if (i < info.length - 1) {
      mainStack.addSpacer(3);
    }
  });
  return widget;
};

// 无台风时
const createLevelWidget = (levels, tc, p, textColor, isLarge, summary) => {
  const widget = new ListWidget();
  widget.setPadding(15, 20, 15, 20);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  
  if (!isLarge) {
    topStack.addSpacer(4.5);
    const bar = topStack.addStack();
    bar.size = new Size(8, 20);
    bar.backgroundColor = new Color('#8C7CFF');
    bar.cornerRadius = 50;
    topStack.addSpacer(19);
  }
  
  const levelText = topStack.addText(tc.length ? `${p.name} - ${p.ename} [${setting.TC + 1}]` : '台风等级、预报机构');
  levelText.font = Font.boldSystemFont(15);
  levelText.textColor = new Color('#00B388');
  topStack.addSpacer();
  
  if (tc.length) {
    tc.forEach((item, i) => {
      currMergerTCNotice(item);
      const icon = topStack.addImage(tcIcon);
      icon.imageSize = new Size(20, 20)
      if (i < tc.length - 1) {
        topStack.addSpacer(2);
      }
    });
  } else {
    const timeText = topStack.addText(getFormattedTime());
    timeText.font = Font.mediumSystemFont(16);
    timeText.textColor = textColor;
  }
  
  if (isLarge) {
    widget.addSpacer();
    if (summary && summary !== '未来两小时无降水') {
      const stack = widget.addStack();
      stack.layoutHorizontally();
      stack.addSpacer();
      const barStack = createBarStack(stack, new Color('#0041C9'), 12, true);
      const statusText = barStack.addText(summary);
      statusText.textColor = Color.white();
      statusText.font = Font.mediumSystemFont(14.5);
      stack.addSpacer();
      widget.addSpacer();
    }
  } else {
    widget.addSpacer(5);
  }
  
  levels.forEach((item, i) => {
    const listStack = widget.addStack();
    listStack.layoutHorizontally();
    listStack.centerAlignContent();
    const icon = listStack.addImage(tyIcon);
    icon.imageSize = new Size(17, 17);
    icon.tintColor = new Color(item.iconColor);
    listStack.addSpacer(15);
    
    const labelText = listStack.addText(item.label);
    labelText.font = Font.mediumSystemFont(13.5);
    labelText.textColor = textColor;
    listStack.addSpacer();
    const lineText = listStack.addText('---');
    lineText.font = Font.mediumSystemFont(13.5);
    lineText.textColor = new Color(item.textColor);
    
    const agencyStack = listStack.addStack();
    agencyStack.layoutHorizontally();
    agencyStack.size = new Size(95, 0);
    agencyStack.addSpacer();
    const agencyText = agencyStack.addText(item.agency);
    agencyText.font = Font.mediumSystemFont(13.5);
    agencyText.textColor = textColor;
    if (i < levels.length - 1) {
      widget.addSpacer(3);
    }
  });
  return widget;
};

const errorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('仅支持中大号');
  text.font = Font.systemFont(16);
  text.centerAlignText();
  return widget;
};

// 整合数据
const runWidget = async () => {
  const { arr, tf, typhoon } = await getTyphoonData() || {};
  const newest = await getLatestData(tf) || {};
  const family = config.runsInApp 
    ? (tf ? 'large' : 'medium') 
    : config.widgetFamily;
  const isLarge = family === 'large';
  const isSmall = family === 'small';

  const textColor = isLarge  
    ? Color.black() 
    : Color.dynamic(Color.black(), Color.white());
  
  let widget;
  if (isSmall) {
    widget = errorWidget();
  } else if (!tf) {
    const summary = await getMinRain();
    const levels = levelAgency();
    const { tc, p } = await currMergerTC();
    widget = createLevelWidget(levels, tc, p, textColor, isLarge, summary);
  } else {
    speedChangeNotice(tf, typhoon, newest);
    const date = formatDate(newest.update_time);
    const land = tf.land?.at(-1) ?? '';
    const info = generateItem(typhoon, land, newest);
    widget = createWidget(
      arr, tf, typhoon, 
      date, info, textColor, isLarge
    );
  }
  
  if (!isSmall) await setBackground(widget, isLarge);
  
  if (config.runsInApp) {
    await widget[tf ? 'presentLarge' : 'presentMedium']();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};

await runWidget();