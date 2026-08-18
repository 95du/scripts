// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: spinner;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.0.3
 * https://t.me/+CpAbO_q_SGo2ZWE1
 * 在桌面组件编辑参数中填写任意数字，可以看热带扰动详细信息，不添加则正常显示。
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

// 地点库
const typhoonPoints = [
  { name: "海南省东方市", lat: 19.09, lng: 108.65, level: 3 },
  { name: "海南省文昌市", lat: 19.54, lng: 110.80, level: 3 },
  { name: "香港", lat: 22.3193, lng: 114.1694, level: 2 },
  { name: "台湾", lat: 23.5, lng: 121.0, level: 2 },
  { name: "菲律宾马尼拉", lat: 14.5995, lng: 120.9842, level: 1 },
  { name: "菲律宾吕宋岛东北洋面", lat: 18.5, lng: 125.0, level: 2, isSea: true },
  { name: "日本冲绳县那霸市", lat: 26.212, lng: 127.681, level: 1 },
  { name: "日本鹿儿岛", lat: 31.596, lng: 130.557, level: 2 },
  { name: "日本东京", lat: 35.676, lng: 139.65, level: 1 },
  { name: "关岛塞班", lat: 15.177, lng: 145.75, level: 2, group: "guam_archipelago", conditionalBoost: { lng: [147.5, 154.5], lat: [19, 24], factor: 0.62, vs: "美国关岛", distMargin: 150 } },
  { name: "美国关岛", lat: 13.444, lng: 144.793, level: 1, group: "guam_archipelago", weightAdjust: 0.82 }
];

const calcDistance = (lat1, lng1, lat2, lng2) => {
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)));
};

const calcDirection = (lat1, lng1, lat2, lng2) => {
  const rad = d => (d * Math.PI) / 180;
  const y = Math.sin(rad(lng2 - lng1)) * Math.cos(rad(lat2));
  const x =
    Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
    Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lng2 - lng1));
  let angle = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  if (lng1 >= 118 && lng1 <= 123 && lat1 >= 13 && lat1 <= 20) {
    if (angle >= 326.25 && angle < 348.75) return "北偏西";
  }
  if (lng1 >= 135 && lng1 <= 145 && lat1 >= 30 && lat1 <= 40) {
    if (angle >= 95 && angle < 125) return "东偏南";
  }
  if (lng1 >= 144 && lng1 <= 146 && lat1 >= 13 && lat1 <= 15) {
    if (angle >= 118 && angle < 132) return "东南";
  }
  const dirs = [
    "偏北", "北偏东", "东北",
    "东北偏东", "偏东", "东南偏东",
    "东南", "东南偏南", "偏南",
    "南偏西", "西南", "西南偏西",
    "偏西", "西偏北", "西北", "西北偏北"
  ];
  const index = Math.floor((angle + 11.25) / 22.5) % 16;
  return dirs[index];
};

const calcIncludedAngle = (typhoon, p1, p2) => {
  const rad = d => (d * Math.PI) / 180;
  const x1 = (p1.lng - typhoon.lng) * Math.cos(rad(typhoon.lat));
  const y1 = p1.lat - typhoon.lat;
  const x2 = (p2.lng - typhoon.lng) * Math.cos(rad(typhoon.lat));
  const y2 = p2.lat - typhoon.lat;
  const dot = x1 * x2 + y1 * y2;
  const mag1 = Math.hypot(x1, y1);
  const mag2 = Math.hypot(x2, y2);
  if (mag1 === 0 || mag2 === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (mag1 * mag2)))) * 180) / Math.PI;
};

const locateTyphoon = (typhoon) => {
  const scored = typhoonPoints.map(st => {
    const dist = calcDistance(st.lat, st.lng, typhoon.lat, typhoon.lng);
    let levelWeight = st.level === 1 ? 0.90 : st.level === 2 ? 1.15 : 1.45;

    if (st.weightAdjust != null) {
      levelWeight *= st.weightAdjust;
    }

    if (st.conditionalBoost) {
      const { lng, lat, factor, vs, distMargin = 150 } = st.conditionalBoost;
      if (
        typhoon.lng > lng[0] && typhoon.lng < lng[1] &&
        typhoon.lat >= lat[0] && typhoon.lat <= lat[1]
      ) {
        const vsPoint = typhoonPoints.find(p => p.name === vs);
        if (vsPoint) {
          const vsDist = calcDistance(vsPoint.lat, vsPoint.lng, typhoon.lat, typhoon.lng);
          if (dist + distMargin < vsDist) {
            levelWeight *= factor;
          }
        }
      }
    }

    const score = dist < 520 ? dist : dist * levelWeight;
    return { ...st, dist, score };
  }).sort((a, b) => a.score - b.score);

  const main = scored[0];
  let second = null;

  const shouldConsiderMulti = main.dist >= 450 || (typhoon.lng >= 115 && typhoon.lng <= 125 && typhoon.lat >= 18 && typhoon.lat <= 26);

  if (shouldConsiderMulti) {
    const candidates = scored.slice(1).filter(st => {
      if (main.group && st.group === main.group) return false;
      const angle = calcIncludedAngle(typhoon, main, st);
      const minAngle = st.dist > 2500 ? 0 : 20;
      if (angle < minAngle || angle > 160) return false;
      if (st.dist > main.dist * 3.5 || st.dist > 4000) return false;
      if (st.dist < main.dist * 0.65) return false;
      return true;
    });

    if (candidates.length > 0) {
      const preferred = candidates.find(c =>
        (c.preferSecond ||
         c.name.includes("日本") ||
         c.name.includes("那霸") ||
         c.name.includes("冲绳") ||
         c.name.includes("台湾") ||
         c.name.includes("海南") ||
         c.name.includes("香港")) &&
        c.dist < main.dist * 3.5
      );
      second = preferred || candidates[0];
    }
  }

  const format = st => {
    const dir = calcDirection(st.lat, st.lng, typhoon.lat, typhoon.lng);
    const roundedDist = Math.round(st.dist / 10) * 10;
    return `${st.name}${dir}方向约${roundedDist}公里`;
  };

  if (second) {
    return `位于${format(main)}、${format(second)}的洋面上`;
  } else {
    const useOcean = main.group || main.isSea || main.dist >= 1600;
    const prefix = (main.dist < 1400 && !useOcean) ? "距离" : "位于";
    const suffix = 
      useOcean ? "洋面上" : "";
    return `${prefix}${format(main)}${suffix}`;
  }
};

// 解密接口经纬度编码
const getCryptoWeb = async () => {
  const html = `<script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script><script>const caesarDecrypt=(s,n)=>[...s].map(c=>String.fromCharCode(c.charCodeAt(0)+2*n)).join("");const formatDate=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");const generateAESKey=(d,b)=>{const[y,m,day]=d.split("-");return CryptoJS.MD5(y.slice(0,2)+b.slice(0,10)+y.slice(2)+b.slice(10,20)+m+b.slice(20)+day).toString().toUpperCase()};const decryptAES=(c,k)=>{try{return CryptoJS.AES.decrypt(CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(c)),CryptoJS.enc.Base64.parse(k),{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8)}catch(e){return null}};const decryptField=(c,t,k,type)=>{if(typeof c!=="string"||!c)return c;const base=new Date(t);if(isNaN(base.getTime()))return c;const b=caesarDecrypt(k,-1);for(let i=0;i<=30;i++){for(const x of i?[i,-i]:[0]){const d=new Date(base);d.setDate(d.getDate()+x);const n=Number(decryptAES(c,generateAESKey(formatDate(d),b)));if(Number.isFinite(n)&&((type==="lat"&&n!==0&&Math.abs(n)<=90)||(type==="lng"&&Math.abs(n)>=90&&Math.abs(n)<=180)))return n}}return c};const parseField=(v,t,k,type)=>v==null?v:typeof v==="number"?v:!isNaN(v)&&v.trim()!==""?Number(v):decryptField(v,t,k,type);const parseItem=(i,k)=>i?({...i,lat:parseField(i.lat,i.time||"",k,"lat"),lng:parseField(i.lng,i.time||"",k,"lng")}):i;window.decryptTcObject=(d,k)=>Array.isArray(d)?d.map(i=>parseItem(i,k)):parseItem(d,k);</script>`;
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

// 自动更新
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/typhoon.js').loadString();
  if (script.includes('組件')) fm.writeString(module.filename, script)
};

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
 * https://tf02.istrongcloud.com/data/event/202613.json 演变过程
 *
 * https://typhoon.slt.zj.gov.cn/Api/TyhoonActivity
 * https://typhoon.slt.zj.gov.cn/Api/TyphoonInfo/202613
 *
 * https://tf02.istrongcloud.com/typhoonVisual/home
 * https://tf03.istrongcloud.com/typhoonVisual/home
 * 无加密 3 个
 * https://tf03.istrongcloud.com/member/v1.3/home
 * https://tf.istrongcloud.com/release/index-hrtt.html
 * https://tf.istrongcloud.com/sctyphoon/index.html#/home
 */
const getTyphoonData = async () => {
  try {
    const url = `https://tf03.istrongcloud.com/member/v1.3/home?r=${Date.now()}`;
    const html = await new Request(url).loadString();
    const match = html.match(/typhoons_data = ([\s\S]*?)[;|<]/)?.[1];
    const arr = JSON.parse(match);
    if (!arr.length) return null;
    typhoonNotice(html);
    const tf = loopdNextIdx(arr, 'TF');
    const typhoon = tf.points?.at(-1);
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
    notify(`⚠️ ${msg.title}`, msg.message);
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
    const body = `风速 ${speed}米/秒，${typhoon.power || 0}级 (${newest.strong || "未知"})` + (newest.location ? `\n${newest.location}` : "") + `\n${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`;
    notify(`⚠️ 台风 【${tf.name}】 风速变化 🌀`, body);
    setting.tf[id] = {
      ...oldData,
      speed
    };
    writeSettings(setting);
  }
};

const currMergerTCNotice = (p, decrypt) => {
  setting.tc = setting.tc || {};
  const id = p.tfbh || p.ident;
  const oldSpeed = setting.tc[id];
  if (oldSpeed !== decrypt.speed) {
    notify(
      `⚠️ ${p.name} ${p.ename}`,
      `${p.ident} ${decrypt.strong}\n东经${decrypt.lng}°，北纬${decrypt.lat}°\n风速 ${decrypt.speed || 0}米/秒，${decrypt.power || 0}级，${decrypt.pressure || 0}百帕`
    );
    setting.tc[id] = decrypt.speed;
    writeSettings(setting);
  }
};

// 格式化日期
const formatTime = (time) => {
  const date = new Date(time);
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDate = (time, showMin) => {
  const date = new Date(time);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = date.getMinutes();
  return `${date.getMonth() + 1}月${date.getDate()}日${hour}时` + (showMin && minute ? `${minute}分` : '');
};

// 剩余登陆时间
const getTyphoonRemainTime = (distance, speed) => {
  const h = Math.ceil(distance / (speed || 25));
  if (h < 24) return `${h} 小时`;
  const days = Math.floor(h / 24);
  const remains = h % 24;
  return remains ? `${days} 天 ${remains} 小时` : `${days} 天`;
};

const getTyphoonColor = (speed) => {
  const colors = [
    [51, '#FF0000'], [42, '#F95BF9'],
    [33, '#FF7800'], [25, '#FFD83A'],
    [17, '#39A7F8'], [0, '#00C400']
  ];
  return new Color(colors.find(([min]) => speed >= min)?.[1]);
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

// 获取最晚发布的台风路径图片
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

const generateItem = (isLarge, typhoon, newest, land, maxSpeed, dist, remainTime, hasNumber) => {
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
      label: land ? "登陆位置" : maxSpeed > 10 ? '最大等级' : "风圈半径",
      value: land
        ? `${formatDate(land.land_time, true)}，在${land.position}登陆`
        : maxSpeed > 10
          ? `${maxSpeed.speed}米/秒，${maxSpeed.power}级 ${maxSpeed.strong}，${maxSpeed.sets}预测`
          : `${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`,
      color: '#FFD83A'
    },
    { 
      label: "参考位置", 
      value: newest.location,
      color: '#FF7800'
    },
    ...(!land && (isLarge || !hasNumber) ? [{
      label: "登陆时间",
      value: `预计 ${remainTime}后到达，离你 ${dist} 公里`,
      color: '#F95BF9'
    }] : []),
    { 
      label: "未来趋势", 
      value: newest.trend,
      color: '#8C7CFF'
    }
  ];
};

const generateTCItem = (dist, tcLocation, begin_time, decrypt, isLarge) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${decrypt.lng}°　北纬${decrypt.lat}°`, 
      color: '#00C400'
    },
    { 
      label: "风速风力", 
      value: `${decrypt.speed}米/秒，${decrypt.power}级，${decrypt.strong}`, 
      color: '#39A7F8'
    },
    { 
      label: "中心气压", 
      value: `${decrypt.pressure} 百帕`, 
      color: '#FFD83A'
    },
    ...((isLarge || tcLocation.length < 21) ? [{
      label: "生成时间",
      value: begin_time,
      color: '#8C7CFF'
    }] : []),
    { 
      label: "位置测距", 
      value: `距离你的位置 ${dist} 公里`,
      color: '#FF7800'
    },
    { 
      label: "参考位置", 
      value: tcLocation,
      color: '#F95BF9'
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

const createBarStack = (stack, barColor, radius = 7) => {
  const barStack = stack.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();
  barStack.setPadding(3, 10, 3, 10);
  barStack.size = new Size(0, 23);
  barStack.cornerRadius = radius;
  barStack.backgroundColor = barColor;
  return barStack;
};

const createButtonStack = (topStack, tyIcon, name, barColor) => {
  const barStack = createBarStack(topStack, barColor);
  const icon = barStack.addImage(tyIcon);
  icon.imageSize = new Size(17, 17);
  icon.tintColor = Color.white();
  barStack.addSpacer(6);
  const statusText = barStack.addText(name);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14.5);
  return barStack;
};

const createWidget = (arr, tf, typhoon, maxSpeed, date, land, dist, info, barColor, textColor, isLarge) => {
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.setPadding(isLarge ? 15 : 13, 20, isLarge ? 5 : 4, 20);
  createButtonStack(topStack, tyIcon, (tf.ident + tf.name), barColor);
  topStack.addSpacer(8);
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
    if (land && dist < 100) {
      const stack = widget.addStack();
      stack.setPadding(0, 20, 0, 20);
      const distText = stack.addText(`距离你的位置 ${dist} 公里`);
      distText.font = Font.mediumSystemFont(14.5);
      distText.textColor = new Color('#FF3300');
    }
    widget.addSpacer();
  }
  
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.setPadding(isLarge ? 15 : 4, 20, isLarge ? 15 : 13, 20);
  if (isLarge) {
    mainStack.backgroundColor = tf.land.length 
    ? new Color(barColor.hex, 0.18)
    : new Color('#555555', 0);
  }
  
  info.forEach((item, i) => {
    const listStack = mainStack.addStack();
    listStack.layoutHorizontally();
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    labelText.textColor = new Color(item.color);
    listStack.addSpacer(12);
    const valueText = listStack.addText(item.value);
    valueText.font = Font.mediumSystemFont(13.5);
    valueText.textColor = textColor;
    if (isLarge) listStack.addSpacer();
    if (i < info.length - 1) {
      mainStack.addSpacer(3);
    }
  });
  return widget;
};

// 热带扰动组件
const createTCWidget = (tc, p, date, info, tcLocation, textColor, isLarge) => {
  const widget = new ListWidget();
  widget.setPadding(15, 20, 15, 20);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.size = new Size(0, 23);
  createButtonStack(topStack, tyIcon, (p.name + p.ename), new Color('#8C7CFF'));
  topStack.addSpacer(8);
  const dateText = topStack.addText(date)
  dateText.font = Font.mediumSystemFont(14.5);
  dateText.textColor = textColor;
  topStack.addSpacer();
  
  tc.forEach((item, i) => {
    const icon = topStack.addImage(tcIcon);
    icon.imageSize = new Size(20, 20)
    if (i < tc.length - 1) {
      topStack.addSpacer(2);
    }
  });
  
  widget.addSpacer();
  info.forEach((item, i) => {
    const listStack = widget.addStack();
    listStack.layoutHorizontally();
    const labelText = listStack.addText(item.label);
    labelText.font = Font.boldSystemFont(13.5);
    labelText.textColor = new Color(item.color);
    listStack.addSpacer(12);
    const valueText = listStack.addText(item.value);
    valueText.font = Font.mediumSystemFont(13.5);
    valueText.textColor = textColor;;
    if (i < info.length - 1) {
      widget.addSpacer(3);
    }
  });
  return widget;
};

// 无台风组件
const createLevelWidget = (levels, textColor, isLarge) => {
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
  
  const levelText = topStack.addText('台风等级、预报机构');
  levelText.font = Font.boldSystemFont(15);
  levelText.textColor = new Color('#00B388');
  topStack.addSpacer();
  const timeText = topStack.addText(getFormattedTime());
  timeText.font = Font.mediumSystemFont(16);
  timeText.textColor = textColor;
  widget.addSpacer();
  
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
const createTyphoonData = async (arr, tf, typhoon, newest, textColor, isLarge) => {
  speedChangeNotice(tf, typhoon, newest);
  const barColor = getTyphoonColor(typhoon.speed);
  const date = formatDate(newest.update_time);
  const land = tf.land?.at(-1) ?? '';
  const dist = calcDistance(setting.lat, setting.lon, newest.lat, newest.lon);
  const distance = newest.location?.match(/\d+/)?.[0] || 0
  const hasNumber = /\d+/.test(newest.trend);
  const remainTime = getTyphoonRemainTime(distance, typhoon.move_speed);
  const maxSpeed = getMaxForecast(tf);
  const info = generateItem(isLarge, typhoon, newest, land, maxSpeed, dist, remainTime, hasNumber);
  return createWidget(arr, tf, typhoon, maxSpeed, date, land, dist, info, barColor, textColor, isLarge);
};

const createTcData = (tc, p, decrypt, textColor, isLarge) => {
  const tcLocation = locateTyphoon(decrypt);
  const dist = calcDistance(setting.lat, setting.lon, decrypt.lat, decrypt.lng);
  const date = formatDate(decrypt.time);
  const begin_time = formatTime(p.begin_time);
  const info = generateTCItem(
    dist, tcLocation, begin_time, 
    decrypt, isLarge
  );
  return createTCWidget(tc, p, date, info, tcLocation, textColor, isLarge);
};

// 主函数
const runWidget = async () => {
  getLocation();
  const { arr, tf, typhoon } = await getTyphoonData() || {};
  const newest = await getLatestData(tf) || {};
  
  const family = config.runsInApp
    ? (tf ? 'large' : 'medium')
    : config.widgetFamily;
  const param = args.widgetParameter;
  const isNumber = param && !isNaN(Number(param));
  const isLarge = family === 'large';
  const isSmall = family === 'small';
  const textColor = isLarge
    ? Color.black()
    : Color.dynamic(Color.black(), Color.white());

  let widget;
  if (isSmall) {
    widget = errorWidget();
  } else if (tf && !isNumber) {
    widget = await createTyphoonData(
      arr, tf, typhoon, newest, 
      textColor, isLarge
    );
  } else if (!tf || isNumber) {
    const { tc = [], p = {}, decrypt = {} } = await currMergerTC();
    if (tc.length) {
      currMergerTCNotice(p, decrypt);
      widget = createTcData(tc, p, decrypt, textColor, isLarge);
    } else {
      const levels = levelAgency();
      widget = createLevelWidget(
        levels, textColor, isLarge
      );
    }
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