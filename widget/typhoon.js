// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: spinner;
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

/**
 * 计算两个经纬度坐标之间的距离
 * @param {number|string} lat1 我的纬度
 * @param {number|string} lng1 我的经度
 * @param {number|string} lat2 点2纬度
 * @param {number|string} lng2 点2经度
 * @returns {number} 距离 (km)
 */
const getDistance = (lat1, lng1, lat2, lng2, R = 6371) => {
  const toRad = deg => Number(deg) * Math.PI / 180;
  const dLat = toRad(lat2) - toRad(lat1);
  const dLng = toRad(lng2) - toRad(lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  return Number.isFinite(distance) ? Math.round(distance) : 0;
};

// 经纬度编码解密
const getCryptoWeb = async () => {
  const html = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
  <script>
    const caesarDecrypt=(str,shift)=>[...str].map(c=>String.fromCharCode(c.charCodeAt(0)+2*shift)).join("");const generateAESKey=(date,fixedKey)=>{const base=caesarDecrypt(fixedKey,-1);const[year,month,day]=date.split("-");const text=year.slice(0,2)+base.slice(0,10)+year.slice(2)+base.slice(10,20)+month+base.slice(20)+day;return CryptoJS.MD5(text).toString().toUpperCase()};const decryptAES=(cipher,key)=>{const data=CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(cipher));return CryptoJS.AES.decrypt(data,CryptoJS.enc.Base64.parse(key),{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8)};const formatDate=date=>{const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,"0");const d=String(date.getDate()).padStart(2,"0");return\`\${y}-\${m}-\${d}\`};const decryptField=(cipher,time,fixedKey)=>{if(typeof cipher!=="string"||!cipher)return null;const base=new Date(time);if(isNaN(base))return null;for(let i=-10;i<=10;i++){const date=new Date(base);date.setDate(date.getDate()+i);try{const result=decryptAES(cipher,generateAESKey(formatDate(date),fixedKey));if(result)return result}catch(e){}}return null};const parseItem=(item,key)=>item?({...item,lat:Number(decryptField(item.lat,item.time,key))||null,lng:Number(decryptField(item.lng,item.time,key))||null}):item;window.decryptTcObject=(data,key)=>Array.isArray(data)?data.map(item=>parseItem(item,key)):parseItem(data,key);
  </script>`;
  const webView = new WebView();
  await webView.loadHTML(html);
  return webView;
};

/**
 * 解密单个台风对象
 * @param {Object|Array} 原始台风数据对象
 * @returns {Promise<Object|null>} 解密后的对象
 */
const decryptData = async (data) => {
  const webView = await getCryptoWeb();
  const key = "3H4533HEH2C96283C;F458H25HFD2C64";
  return await webView.evaluateJavaScript(
    `decryptTcObject(${JSON.stringify(data)},${JSON.stringify(key)})`
  );
};

// 查找最后一个 Forecast 的测试点
const findLatestForecast = (data = {}) => (data.points ?? [])
  .flatMap(p => p.forecast ?? [])
  .flatMap(f => (f.points ?? []).map(item => ({
    ...item,
    sets: f.sets
  })))
  .filter(({ time }) => time)
  .sort((a, b) => new Date(b.time) - new Date(a.time))[0] ?? null;

const getLastDistText = async (tf, newest, land) => {
  const forecast = findLatestForecast(tf);
  if (!forecast) return;
  const decrypt = await decryptData(forecast);
  const time = formatDate(decrypt.time);
  const lastDist = getDistance(setting.lat, setting.lon, decrypt.lat, decrypt.lng);
  const distText = `${decrypt.sets}预报 ${time}，风速 ${decrypt.speed}米/秒，${decrypt.power}级\n${decrypt.strong}，距离你的位置 ${lastDist} 公里`;
  return { lastDist, distText };
};

// 自动更新
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/typhoon.js').loadString();
  if (script.includes('組件')) fm.writeString(module.filename, script)
};

const noticeIcon = await getCacheImage('notice.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/notice.png`);
const tyIcon = await getCacheImage('typhoon.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/typhoon_1.png`);
const tcIcon = await getCacheImage('tc.png', `https://tf02.istrongcloud.com/typhoonVisual/img/tfpt.png`);

// 获取当前位置经纬度
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

// 循环数组中的对象
const loopdNextIdx = (arr, name) => {
  const optNextIndex = (num, data) => (num + 1) % data.length;
  setting[name] = optNextIndex(setting[name] || 0, arr);
  writeSettings(setting);
  return arr[setting[name]];
};

// 热带扰动
const currMergerTC = async () => {
  try {
    const url = `https://tf02.istrongcloud.com/data/enComplex2/currMergerTC.json?random=${Date.now()}`
    const tc = await new Request(url).loadJSON();
    const p = loopdNextIdx(tc, 'TC');
    const ls = p.points?.at(-1) ?? '';
    const decrypt = await decryptData(ls);
    return { tc, p, decrypt };
  } catch (e) {
    console.log(e);
    return {};
  }
};

// 经纬度/位置/趋势/台风动态
const complementLocTrend = async (tf, latest) => {
  if (!tf) return;
  const newest = latest.find(item => item.tfbh === tf.tfbh);
  if (!newest.location) {
    const locUrl = `https://tf.istrongcloud.com/data/completion/${tf.tfbh}.json`;
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
 * https://tf02.istrongcloud.com/data/event/20261401.json 演变过程
 *
 * https://typhoon.slt.zj.gov.cn/Api/TyhoonActivity
 * https://typhoon.slt.zj.gov.cn/Api/TyphoonInfo/202609
 *
 * https://tf02.istrongcloud.com/typhoonVisual/home?theme=light
 * https://tf.istrongcloud.com/release/index-hrtt.html
 */
const getTyphoonData = async () => {
  try {
    const url = `https://tf03.istrongcloud.com/typhoonVisual/home`;
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
    notify(`⚠️ 台风信息通告 🌀`, tips);
    setting.tips = tips;
    writeSettings(setting);
  }
};

const messageNotice = (msg) => {
  if (msg && setting.message !== msg.message) {
    notify(`⚠️ ${msg.title} 🌀`, msg.message);
    setting.message = msg.message;
    writeSettings(setting);
  }
};

const speedChangeNotice = (tf, typhoon, newest) => {
  setting.tf = setting.tf || {};
  const id = tf.tfbh || tf.ident;
  if (!id) return;
  const oldData = setting.tf[id] || {};
  const oldSpeed = oldData.speed;
  const speed = typhoon.speed || 0;
  if (oldSpeed !== speed) {
    const body = `风速 ${speed}米/秒，${typhoon.power || 0}级 (${newest.strong || ""})` + (newest.location ? `\n${newest.location}` : "") + `\n${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`;
    notify(`⚠️ 台风 【${tf.name}】 风速变化 🌀`, body);
    setting.tf[id] = {
      ...oldData,
      speed
    };
    writeSettings(setting);
  }
};

const distChangeNotice = (tf, lastDistText) => {
  const id = tf.tfbh || tf.ident;
  const oldDist = setting.tf[id].dist
  if (oldDist !== lastDistText) {
    notify(`⚠️ 台风 【${tf.name}】 动态更新🌀`, lastDistText);
    setting.tf[id] = {
      ...(setting.tf[id] || {}),
      dist: lastDistText
    };
    writeSettings(setting);
  }
};

const currMergerTCNotice = (tc) => {
  const point = tc.points?.at(-1);
  if (!point) return;
  const formatTime = (time) => time.slice(0, 16).replace('T', ' ');
  setting.tc = setting.tc || {};
  const id = tc.tfbh || tc.ident;
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
    [51, '#FF0000'], [42, '#F95BF9'],
    [33, '#FF7800'], [25, '#FFD83A'],
    [17, '#39A7F8'], [0, '#00C400']
  ];
  return new Color(colors.find(([min]) => speed >= min)?.[1]);
};

// 剩余登陆时间
const getTyphoonRemainTime = (isLarge, distance, speed) => {
  if (!isLarge) return null;
  const h = distance / (speed || 25);
  if (h < 24) {
    return `${Math.ceil(h)} 小时`;
  }
  const days = Math.floor(h / 24);
  const remains = Math.ceil(h % 24)
  return `${days} 天 ${remains} 小时`
};

// 查找最大风速的 Point
const getMaxForecast = (tf) => {
  return (tf.points ?? []).flatMap(p => p.forecast ?? []).reduce((max, { sets, points = [] }) => {
    const point = points.at(-1);
    if (!point) return max;
    const item = { ...point, sets };
    if (!max || item.power > max.power || (item.power === max.power && item.speed > max.speed)) {
      const strong = item.strong.split('(')[0].trim();
      item.strong = `( ${strong} )`;
      max = item;
    }
    return max;
  }, null);
};

const formatTime = (timestamp) => new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16);

// 获取最晚发布的台风路径图片
// https://tf.istrongcloud.com/tcScreenshot/active/poster/result.png
const getLatestTyImage = async () => {
  const urls = [
    `https://upy.istrongcloud.com/applet/typhoon/screenshot/posterMulti.png?r=${Date.now()}`,
    `https://upy.istrongcloud.com/applet/typhoon/screenshot/wxPosterAll.png?r=${Date.now()}`
  ];

  try {
    const list = await Promise.all(urls.map(async url => {
      const r = new Request(url);
      const data = await r.load();
      const timestamp = Date.parse(r.response.headers['Last-Modified'] || 0);
      return {
        image: Image.fromData(data),
        time: timestamp,
        timeText: formatTime(timestamp)
      };
    }));
    return list.reduce((a, b) => a.time > b.time ? a : b);
  } catch (e) {
    console.log(`台风图片获取失败: ${e}`)
  }
};

// 设置背景
const setBackground = async (widget, tf, isLarge) => {
  widget.url = 'https://tf02.istrongcloud.com/typhoonApp/index.html';
  if (isLarge) {
    const latestTy = await getLatestTyImage() || {};
    widget.backgroundColor = new Color('#A3CCFF');
    widget.backgroundImage = latestTy.image;
  } else {
    widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    widget.backgroundImage = await getCacheImage('background.png', `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png`);
  }
};

const generateItem = (typhoon, newest, land, maxSpeed, remainTime) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${newest.lon}°　北纬${newest.lat}°`, 
      color: '#00C400'
    },
    { 
      label: "风速风力", 
      value: `${typhoon.speed}米/秒，${typhoon.power}级 ( ${newest.strong} )`, 
      color: '#39A7F8'
    },
    { 
      label: land ? "登陆位置" : maxSpeed ? '最大等级' : "风圈半径",
      value: land
        ? `${formatDate(land.land_time, true)}，在${land.position}登陆`
        : maxSpeed 
          ? `${maxSpeed.speed}米/秒，${maxSpeed.power}级 ${maxSpeed.strong}，${maxSpeed.sets}预测`
          : `${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`,
      color: '#FFD83A'
    },
    { 
      label: "参考位置", 
      value: newest.location,
      color: '#FF7800'
    },
    ...(!land && remainTime  ? [{
      label: "登陆时间",
      value: `预计 ${remainTime}后到达`,
      color: '#F95BF9'
    }] : []),
    { 
      label: "未来趋势", 
      value: newest.trend,
      color: '#8C7CFF'
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
      textColor: '#F95BF9',
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
      iconColor: '#F95BF9',
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

const createBarStack = (stack, barColor, radius = 7, padding) => {
  const barStack = stack.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();
  barStack.setPadding(padding ? 4 : 3, 10, padding ? 4 : 3, 10);
  barStack.cornerRadius = radius;
  barStack.backgroundColor = barColor;
  return barStack;
};

const createButtonStack = (topStack, tyIcon, tf, barColor) => {
  const barStack = createBarStack(topStack, barColor);
  const icon = barStack.addImage(tyIcon);
  icon.imageSize = new Size(17, 17);
  icon.tintColor = Color.white();
  barStack.addSpacer(6);
  const statusText = barStack.addText(tf.ident + tf.name);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14.5);
  return barStack;
};

const createDiatText = (widget, dist) => {
  const distStack = widget.addStack();
  distStack.layoutHorizontally();
  distStack.centerAlignContent();
  distStack.addSpacer();
  const icon = distStack.addImage(noticeIcon);
  icon.imageSize = new Size(22, 22);
  distStack.addSpacer(5);
  const distText = distStack.addText(dist > 0 ? `距离你的位置 ${dist} 公里` : '');
  distText.font = Font.mediumSystemFont(15);
  distText.textColor = new Color('#FF0000', 0.85);
  distStack.addSpacer();
};

const createWidget = (arr, tf, typhoon, dist, maxSpeed, date, info, barColor, textColor, isLarge) => {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.setPadding(isLarge ? 15 : 13, 20, isLarge ? 5 : 4, 20);
  createButtonStack(topStack, tyIcon, tf, barColor);
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

  if (isLarge) {
    if (dist > 0) createDiatText(widget, dist);
    widget.addSpacer();
  }
  
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.setPadding(isLarge ? 15 : 4, 20, isLarge ? 15 : 13, 20);
  if (isLarge && tf.land.length) {
    mainStack.backgroundColor = new Color(barColor.hex, .2);
  }
  
  info.forEach((item, i) => {
    const listStack = mainStack.addStack();
    listStack.layoutHorizontally();
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    labelText.textColor = new Color(item.color);
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

// 无台风组件
const createLevelWidget = (levels, tc, p, dist, textColor, isLarge) => {
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
  const point = p.points?.at(-1);
  const levelText = topStack.addText(tc.length ? `${p.name}  「 ${p.ename} 」  ${point.power}级` : '台风等级、预报机构');
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
  
  if (isLarge && tc.length && dist) {
    widget.addSpacer(2);
    createDiatText(widget, dist);
  }
  widget.addSpacer(isLarge ? '' : 5);
  
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
const createTyphoonWidget = async (arr, tf, typhoon, newest, textColor, isLarge) => {
  speedChangeNotice(tf, typhoon, newest);
  const barColor = getTyphoonColor(typhoon.speed);
  const date = formatDate(newest.update_time);
  const land = tf.land?.at(-1) ?? '';
  const { lastDist, distText } = await getLastDistText(tf, newest, land);
  if (!land && lastDist > 0) distChangeNotice(tf, distText);
  const dist = getDistance(setting.lat, setting.lon, newest.lat, newest.lon);
  const distance = newest.location?.match(/\d+/)?.[0] || 0
  const remainTime = getTyphoonRemainTime(isLarge,distance,typhoon.move_speed);
  const maxSpeed = getMaxForecast(tf);
  const info = generateItem(typhoon, newest, land, maxSpeed, remainTime);
  return createWidget(arr, tf, typhoon, dist, maxSpeed, date, info, barColor, textColor, isLarge);
};

const runWidget = async () => {
  getLocation();
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
  } else if (tf) {
    widget = await createTyphoonWidget(
      arr, tf, typhoon, newest, 
      textColor, isLarge
    );
  } else {
    const levels = levelAgency();
    const { tc = [], p = {}, decrypt = {} } = await currMergerTC();
    const dist = getDistance(
      setting.lat, setting.lon, 
      decrypt.lat, decrypt.lng
    );
    widget = createLevelWidget(
      levels, tc, p, dist, 
      textColor, isLarge
    );
  }

  if (!isSmall) await setBackground(widget, tf, isLarge);

  if (config.runsInApp) {
    await widget[isLarge ? 'presentLarge' : 'presentMedium']();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};

await runWidget();