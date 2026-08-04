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
 * @param {number} precision 取整精度，如 10 代表按 10 公里凑整
 * @returns {number} 距离 (km)
 */
const getDistance = (lat1, lng1, lat2, lng2, R = 6371, precision = 10) => {
  const toRad = deg => Number(deg) * Math.PI / 180;
  const dLat = toRad(lat2) - toRad(lat1);
  const dLng = toRad(lng2) - toRad(lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  const distance = 2 * R * Math.asin(Math.sqrt(a));
  if (!Number.isFinite(distance)) return 0;
  if (precision > 1) {
    return Math.round(distance / precision) * precision;
  }
  return Math.round(distance);
};

const getDirection = (lat1, lng1, lat2, lng2) => {
  const rad = deg => deg * Math.PI / 180;
  const φ1 = rad(lat1);
  const φ2 = rad(lat2);
  const Δλ = rad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let angle = Math.atan2(y, x) * 180 / Math.PI;
  if (!Number.isFinite(angle)) return "";
  angle = (angle + 360) % 360;
  const dirs = [
    "北", "北偏东", "东北", "东偏北",
    "东", "东偏南", "东南", "南偏东",
    "南", "南偏西", "西南", "西偏南",
    "西", "西偏北", "西北", "北偏西"
  ];
  return dirs[Math.round(angle / 22.5) % 16];
};

const typhoonPoints = [
  // 城市 priority 越高越容易被播报
  {
    name: "菲律宾马尼拉",
    lat: 14.5995,
    lng: 120.9842,
    type: "city",
    priority: 10
  },
  {
    name: "菲律宾佬沃",
    lat: 18.197,
    lng: 120.592,
    type: "city",
    priority: 3
  },
  {
    name: "菲律宾卡加延",
    lat: 17.613,
    lng: 121.726,
    type: "city",
    priority: 3
  },
  {
    name: "台湾省台东县",
    lat: 22.755,
    lng: 121.15,
    type: "city",
    priority: 10
  },
  {
    name: "台湾省花莲市",
    lat: 23.99,
    lng: 121.61,
    type: "city",
    priority: 6
  },
  {
    name: "台湾省高雄市",
    lat: 22.627,
    lng: 120.301,
    type: "city",
    priority: 6
  },
  {
    name: "台湾省台北市",
    lat: 25.033,
    lng: 121.565,
    type: "city",
    priority: 5
  },
  {
    name: "琉球群岛那霸",
    lat: 26.212,
    lng: 127.681,
    type: "city",
    priority: 10
  },
  {
    name: "日本石垣市",
    lat: 24.34,
    lng: 124.16,
    type: "city",
    priority: 7
  },
  {
    name: "日本宫古岛市",
    lat: 24.8,
    lng: 125.28,
    type: "city",
    priority: 7
  },
  {
    name: "日本鹿儿岛",
    lat: 31.596,
    lng: 130.557,
    type: "city",
    priority: 8
  },
  {
    name: "日本福冈",
    lat: 33.59,
    lng: 130.4,
    type: "city",
    priority: 6
  },
  // 岛屿
  {
    name: "菲律宾吕宋岛",
    lat: 16.5,
    lng: 121,
    type: "island"
  },
  {
    name: "菲律宾巴丹群岛",
    lat: 20.5,
    lng: 121.9,
    type: "island"
  },
  {
    name: "中国台湾岛",
    lat: 23.7,
    lng: 121,
    type: "island"
  },
  {
    name: "日本冲绳岛",
    lat: 26.5,
    lng: 127.9,
    type: "island"
  },
  {
    name: "日本石垣岛",
    lat: 24.4,
    lng: 124.2,
    type: "island"
  },
  {
    name: "日本宫古岛",
    lat: 24.8,
    lng: 125.3,
    type: "island"
  },
  // 海域
  {
    name: "菲律宾吕宋岛西北部海域",
    lat: 18.5,
    lng: 118.5,
    type: "sea"
  },
  {
    name: "菲律宾吕宋岛东北海域",
    lat: 18.5,
    lng: 125,
    type: "sea"
  },
  {
    name: "菲律宾吕宋岛东部海域",
    lat: 16.5,
    lng: 124,
    type: "sea"
  },
  {
    name: "菲律宾以东洋面",
    lat: 15,
    lng: 140,
    type: "sea"
  },
  {
    name: "马里亚纳群岛附近海域",
    lat: 15,
    lng: 146,
    type: "sea"
  },
  {
    name: "台湾东南海域",
    lat: 22,
    lng: 123,
    type: "sea"
  },
  {
    name: "台湾东北海域",
    lat: 25,
    lng: 124,
    type: "sea"
  },
  {
    name: "南海北部海域",
    lat: 19.5,
    lng: 114.5,
    type: "sea"
  },
  {
    name: "南海中部海域",
    lat: 15,
    lng: 115,
    type: "sea"
  },
  {
    name: "海南岛东部海域",
    lat: 19,
    lng: 112,
    type: "sea"
  }
];

const getCityList = (lat, lng) => {
  return typhoonPoints.filter(point => point.type === "city")
    .map(point => {
      const distance = getDistance(lat, lng, point.lat, point.lng);
      return {
        ...point,
        distance,
        score: distance / (point.priority || 1)
      };
    })
    .sort((a, b) => a.score - b.score);
};

const getSeaLocation = (lat, lng) => {
  return typhoonPoints
    .filter(p => p.type === "sea")
    .map(p => ({
      ...p,
      distance: getDistance(lat, lng, p.lat, p.lng)
    }))
    .sort((a, b) => a.distance - b.distance)[0];
};

const getTyphoonLocationText = ({lat, lng}) => {
  const cities=getCityList(lat,lng);
  const result=[];
  if (cities[0] && cities[0].distance < 1500) {
    result.push(
      `${cities[0].name}${getDirection(
        cities[0].lat,
        cities[0].lng,
        lat,
        lng
      )}方向约${cities[0].distance}公里`
    );
  }
  if (
    cities[1] &&
    cities[1].priority >= 5 &&
    cities[1].distance < 1200 &&
    cities[1].distance / cities[0].distance < 1.8
  ) {
    result.push(
      `${cities[1].name}${getDirection(
        cities[1].lat,
        cities[1].lng,
        lat,
        lng
      )}方向约${cities[1].distance}公里`
    );
  }
  if (result.length===0) {
    const sea=getSeaLocation(lat,lng);
    if (sea) {
      result.push(
        `${sea.name}${getDirection(
          sea.lat,
          sea.lng,
          lat,
          lng
        )}方向约${sea.distance}公里`
      );
    }
  }
  if (result.length >= 2) {
    return `位于${result.join("，")}洋面上`;
  }
  return `距离${result[0]}`;
};

// 经纬度编码解密
const getCryptoWeb = async () => {
  const html = `
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>
  <script>
    const caesarDecrypt=(str,shift)=>[...str].map(c=>String.fromCharCode(c.charCodeAt(0)+2*shift)).join("");const generateAESKey=(date,fixedKey)=>{const base=caesarDecrypt(fixedKey,-1);const[year,month,day]=date.split("-");const text=year.slice(0,2)+base.slice(0,10)+year.slice(2)+base.slice(10,20)+month+base.slice(20)+day;return CryptoJS.MD5(text).toString().toUpperCase()};const decryptAES=(cipher,key)=>{const data=CryptoJS.enc.Base64.stringify(CryptoJS.enc.Base64.parse(cipher));return CryptoJS.AES.decrypt(data,CryptoJS.enc.Base64.parse(key),{mode:CryptoJS.mode.ECB,padding:CryptoJS.pad.Pkcs7}).toString(CryptoJS.enc.Utf8)};const formatDate=date=>{const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,"0");const d=String(date.getDate()).padStart(2,"0");return y+"-"+m+"-"+d};const decryptField=(cipher,time,fixedKey)=>{if(typeof cipher!=="string"||!cipher)return null;const base=new Date(time);if(isNaN(base.getTime()))return null;for(let i=-10;i<=10;i++){const date=new Date(base);date.setDate(date.getDate()+i);try{const result=decryptAES(cipher,generateAESKey(formatDate(date),fixedKey));if(result)return result}catch(e){}}return null};const parseField=(value,time,key)=>{if(value==null)return value;if(typeof value==="number"){return value}if(!isNaN(value)&&value.trim()!==""){return Number(value)}const result=decryptField(value,time,key);return result!==null&&!isNaN(result)?Number(result):value};const parseItem=(item,key)=>{if(!item)return item;return{...item,lat:parseField(item.lat,item.time,key),lng:parseField(item.lng,item.time,key)}};window.decryptTcObject=(data,key)=>Array.isArray(data)?data.map(item=>parseItem(item,key)):parseItem(data,key);
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
  if (!lastDistText) return;
  const id = tf.tfbh || tf.ident;
  setting.tf = setting.tf || {};
  setting.tf[id] = setting.tf[id] || {}
  const oldDist = setting.tf[id].dist;
  if (oldDist !== lastDistText) {
    notify(`⚠️ 台风 【${tf.name}】 动态更新🌀`, lastDistText);
    setting.tf[id].dist = lastDistText;
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
const formatTime = (timestamp) => new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16);

const formatDate = (time, showMin) => {
  const date = new Date(time);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = date.getMinutes();
  return `${date.getMonth() + 1}月${date.getDate()}日${hour}时` + (showMin && minute ? `${minute}分` : '');
};

// 剩余登陆时间
const getTyphoonRemainTime = (distance, speed) => {
  const h = distance / (speed || 25);
  if (h < 24) {
    return `${Math.ceil(h)} 小时`;
  }
  const days = Math.floor(h / 24);
  const remains = Math.ceil(h % 24)
  return `${days} 天 ${remains} 小时`
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
  if (!forecast) return { lastDist: 0, distText: '' };
  const decrypt = await decryptData(forecast);
  const time = formatDate(decrypt.time);
  const lastDist = getDistance(setting.lat, setting.lon, decrypt.lat, decrypt.lng);
  const distText = `${decrypt.sets}预报 ${time}\n风速${decrypt.speed}米/秒，${decrypt.power}级${decrypt.strong}\n东经${decrypt.lng}°，北纬${decrypt.lat}°，届时距离你 ${lastDist} 公里`;
  return { lastDist, distText };
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

const createDiatText = (widget, dist, tcLocation = '') => {
  const list = [
    `距离你的位置 ${dist} 公里`,
    tcLocation
  ].filter(Boolean);
  
  list.forEach((item, index) => {
    const text = widget.addText(item);
    text.font = Font.mediumSystemFont(14.5);
    text.textColor = new Color('#FF3300');
    if (index < list.length - 1) {
      widget.addSpacer(2);
    }
  });
};

const createWidget = (arr, tf, typhoon, maxSpeed, date, land, dist, info, barColor, textColor, isLarge) => {
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
    if (land && dist > 0) createDiatText(widget, dist);
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
    listStack.addSpacer(12);
    const valueText = listStack.addText(item.value);
    valueText.font = Font.mediumSystemFont(13.5);
    valueText.textColor = textColor;
    if (isLarge && land) listStack.addSpacer();
    if (i < info.length - 1) {
      mainStack.addSpacer(3);
    }
  });
  return widget;
};

// 无台风组件
const createLevelWidget = (levels, tc, p, dist, tcLocation, textColor, isLarge) => {
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
    createDiatText(widget, dist, tcLocation);
  }
  widget.addSpacer(isLarge ? null : 5);
  
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
  const hasNumber = /\d+/.test(newest.trend);
  const remainTime = getTyphoonRemainTime(distance, typhoon.move_speed);
  const maxSpeed = getMaxForecast(tf);
  const info = generateItem(isLarge, typhoon, newest, land, maxSpeed, dist, remainTime, hasNumber);
  return createWidget(arr, tf, typhoon, maxSpeed, date, land, dist, info, barColor, textColor, isLarge);
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
    currMergerTCNotice(p, decrypt);
    const tcLocation = getTyphoonLocationText(decrypt);
    const dist = getDistance(
      setting.lat, setting.lon, 
      decrypt.lat, decrypt.lng
    );
    widget = createLevelWidget(
      levels, tc, p, dist, tcLocation,
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