// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: spinner;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.0.5
 * 数据来源: 四创科技台风路径 App
 * https://t.me/+CpAbO_q_SGo2ZWE1
 * 在桌面组件编辑参数中填写数字(2️⃣)展示热带扰动加台风，其他数字只展示热带扰动，不添加则正常展示。
 * 中大号组件 ‼️
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'typhoon');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const tilePath = fm.joinPath(mainPath, 'tiles');
if (!fm.fileExists(tilePath)) fm.createDirectory(tilePath);
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

const safeRemove = (p) => { try { fm.remove(p); } catch (e) {} };

const useFileManager = ({ cacheTime, type } = {}) => {
  return {
    read: (name) => {
      const filePath = fm.joinPath(mainPath, name);
      if (fm.fileExists(filePath)) {
        if (hasExpired(filePath) > cacheTime) fm.remove(filePath);
        else return type ? JSON.parse(fm.readString(filePath)) : fm.readImage(filePath);
      }
    },
    write: (name, content) => {
      const filePath = fm.joinPath(mainPath, name);
      type ? fm.writeString(filePath, JSON.stringify(content)) : fm.writeImage(filePath, content);
    },
  };

  function hasExpired(filePath) {
    const createTime = fm.creationDate(filePath).getTime();
    return (Date.now() - createTime) / (60 * 60 * 1000);
  }
};

const getCacheData = async (name, url, type, cacheTime) => {
  const cache = useFileManager({  
    type, cacheTime
  });
  const cacheData = cache.read(name);
  if (cacheData) return cacheData;
  const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
  if (response) {
    cache.write(name, response);
  }
  return response;
};

const notify = (title, body, url, sound = 'piano_error') => {
  const n = Object.assign(new Notification(), { title, body, sound });
  if (url) n.openURL = url;
  n.schedule();
};

const getFormattedTime = () => {
  const df = new DateFormatter();
  df.dateFormat = 'HH:mm';
  return df.string(new Date());
};

// 自动更新
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/typhoon.js').loadString();
  if (script.includes('組件')) fm.writeString(module.filename, script)
};

// https://tf03.istrongcloud.com/typhoonVisual/js/chunk-0ecd511e.js
const tyIcon = await getCacheData('typhoon.png', `https://raw.githubusercontent.com/95du/scripts/master/img/weather/typhoon_1.png`);
const tcIcon = await getCacheData('tc.png', `https://tf03.istrongcloud.com/typhoonVisual/img/tfpt.png`);
const tyIconUrl = 'https://raw.githubusercontent.com/95du/scripts/master/update/typhoon_icons.json';
const typhoonIcons = await getCacheData('icon.json', tyIconUrl, 'json', 24);

// 地点库
const anchors = [
  { id: "tokyo", name: "日本东京", lat: 35.676, lng: 139.65, rx: 14, ry: 12 },
  { id: "naha", name: "冲绳县那霸市", lat: 26.212, lng: 127.681, rx: 11, ry: 9 },
  { id: "kagoshima", name: "日本鹿儿岛", lat: 31.596, lng: 130.557, rx: 9, ry: 8 },
  { id: "saipan", name: "关岛塞班", lat: 15.177, lng: 145.75, rx: 8, ry: 7, group: "guam_archipelago" },
  { id: "guam", name: "美国关岛", lat: 13.444, lng: 144.793, rx: 8.5, ry: 7.5, group: "guam_archipelago" },
  { id: "palau", name: "帕劳", lat: 7.5, lng: 134.5, rx: 8, ry: 7, isSea: true },
  { id: "taipei", name: "台湾台北市", lat: 25.033, lng: 121.565, rx: 6.5, ry: 5.5 },
  { id: "hualien", name: "台湾花莲", lat: 23.977, lng: 121.604, rx: 6, ry: 5 },
  { id: "kaohsiung", name: "台湾省高雄市", lat: 22.627, lng: 120.301, rx: 7, ry: 6 },
  { id: "hongkong", name: "香港", lat: 22.3193, lng: 114.1694, rx: 7, ry: 6 },
  { id: "manila", name: "菲律宾马尼拉", lat: 14.5995, lng: 120.9842, rx: 8, ry: 7 },
  { id: "luzon_ne", name: "菲律宾吕宋岛", lat: 18.5, lng: 125.0, rx: 7, ry: 6, isSea: true },
  { id: "philippine_se", name: "菲律宾东南部", lat: 10.5, lng: 133.5, rx: 12, ry: 10, isSea: true },
  { id: "dongfang", name: "海南省东方市", lat: 19.09, lng: 108.65, rx: 6, ry: 5 },
  { id: "wenchang", name: "海南省文昌市", lat: 19.54, lng: 110.80, rx: 6.5, ry: 5.5 },
  { id: "qionghai", name: "海南省琼海市", lat: 19.25, lng: 110.47, rx: 6, ry: 5 }
];

const relations = {
  tokyo:     ["naha", "kagoshima", "saipan"],
  naha:      ["tokyo", "kagoshima", "saipan", "hualien", "kaohsiung", "taipei"],
  kagoshima: ["tokyo", "naha"],
  saipan:    ["guam", "naha", "tokyo"],
  guam:      ["saipan", "naha", "manila", "tokyo"],
  taipei:    ["hualien", "naha", "kaohsiung"],
  hualien:   ["taipei", "kaohsiung", "naha", "luzon_ne"],
  kaohsiung: ["hualien", "hongkong", "manila", "luzon_ne", "taipei"],
  hongkong:  ["kaohsiung", "wenchang", "qionghai", "dongfang", "manila"],
  manila:    ["luzon_ne", "kaohsiung", "hongkong", "guam", "wenchang"],
  luzon_ne:  ["manila", "naha", "kaohsiung", "hualien"],
  dongfang:  ["wenchang", "qionghai", "hongkong", "manila"],
  wenchang:  ["hongkong", "qionghai", "dongfang", "manila"],
  qionghai:  ["wenchang", "hongkong", "dongfang", "manila"],
  philippine_se: ["palau"],
  palau: ["philippine_se"],
};

const rad = d => (d * Math.PI) / 180;

const getDistance = (lat1, lng1, lat2, lng2) => {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)));
};

const getBearing = (lat1, lng1, lat2, lng2) => {
  const y = Math.sin(rad(lng2 - lng1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
    Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

const getInfluenceScore = (p, anchor) => {
  const dLat = p.lat - anchor.lat;
  const dLng = (p.lng - anchor.lng) * Math.cos(rad(p.lat));
  return Math.hypot(dLng / anchor.rx, dLat / anchor.ry);
};

const getIncludedAngle = (typhoon, p1, p2) => {
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

const getCandidates = point => {
  return anchors.map(a => ({
    ...a,
    score: getInfluenceScore(point, a),
    distance: getDistance(point.lat, point.lng, a.lat, a.lng)
  })).sort((a, b) => a.score - b.score);
};

const selectMain = point => {
  const candidates = getCandidates(point);
  let main = candidates[0];
  if (main.id === "tokyo" && main.distance > 1800) {
    const better = candidates.find(c => (c.id === "guam" || c.id === "saipan") && c.distance < main.distance * 0.82 && c.score < main.score * 1.35);
    if (better) main = better;
  }

  if (main.id === "saipan") {
    const guamCand = candidates.find(c => c.id === "guam");
    if (guamCand && guamCand.distance < main.distance * 1.12 && guamCand.score < main.score * 1.25) {
      main = guamCand;
    }
  }

  if (main.distance > 1200) {
    const nearGuam = candidates.find(c => (c.id === "guam" || c.id === "saipan") && c.distance < 900);
    if (nearGuam) main = nearGuam;
  }

  const seaCand = candidates.find(c =>
    c.isSea && c.distance < main.distance * 0.92
  );
  if (seaCand) main = seaCand;
  return main;
};

const isMeaningfulSecond = (point, main, second) => {
  if (!second) return false;
  const d1 = main.distance;
  const d2 = second.distance;
  if (d2 > d1 * 3.5 || d2 > 4200) return false;
  if (d2 < d1 * 0.5) return false;
  if (d1 < 500 && d2 > 1200) return false;
  if (main.group && second.group && main.group === second.group) return false;
  const distBetween = getDistance(main.lat, main.lng, second.lat, second.lng);
  if (distBetween < 300) return false;
  if (d1 < 400 && d2 > d1 * 2.5) return false;
  const angle = getIncludedAngle(point, main, second);
  const minAngle = d2 > 2500 ? 0 : 18;
  if (angle < minAngle || angle > 175) return false;
  return true;
};

const selectSecond = (point, main) => {
  const related = 
    relations[main.id] || [];
  const candidates = anchors
    .filter(p => related.includes(p.id))
    .map(p => ({
      ...p,
      distance: getDistance(point.lat, point.lng, p.lat, p.lng),
      score: getInfluenceScore(point, p)
    }))
    .filter(p => p.distance < 4200)
    .sort((a, b) => a.score - b.score);

  const preferred = candidates.find(c => (c.id === "tokyo" || c.id === "naha" || c.id === "kagoshima") && isMeaningfulSecond(point, main, c));
  if (preferred) return preferred;
  for (const cand of candidates) {
    if (isMeaningfulSecond(point, main, cand)) return cand;
  }
  return null;
};

const getDirection = (lat1, lng1, lat2, lng2) => {
  const angle = getBearing(lat1, lng1, lat2, lng2);
  const dirs = [
    "偏北", "北偏东", "东北偏北", 
    "东北", "东北偏东", "东偏北", 
    "偏东", "东偏南", "东南偏东", 
    "东南", "东南偏南", "南偏东",
    "偏南", "南偏西", "西南偏南", 
    "西南", "西南偏西", "西偏南", 
    "偏西", "西偏北", "西北偏西", 
    "西北", "西北偏北", "北偏西"
  ];
  return dirs[Math.floor((angle + 7.5) / 15) % 24];
};

const formatAnchor = (anchor, point) => {
  const distance = Math.round(getDistance(anchor.lat, anchor.lng, point.lat, point.lng) / 10) * 10;
  const direction = getDirection(anchor.lat, anchor.lng, point.lat, point.lng);
  return `${anchor.name}${direction}方向约${distance}公里`;
};

const getSeaSuffix = point => {
  if (point.lng < 120 && point.lat < 23) return "南海海面上";
  return "洋面上";
};

const getTyphoonLocation = (point) => {
  const main = selectMain(point);
  if (!main) return "";
  const second = selectSecond(point, main);
  const mainText = formatAnchor(main, point);
  const seaSuffix = getSeaSuffix(point);
  const useOcean = !!second || main.isSea || main.distance >= 1200;
  if (second && isMeaningfulSecond(point, main, second)) {
    const secondText = formatAnchor(second, point);
    return `位于${mainText}、${secondText}的${seaSuffix}`;
  }
  if (useOcean) {
    return `位于${mainText}的${seaSuffix}`;
  }
  return `距离${mainText}`;
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

/**
 * 热带扰动地图背景图 ✅
 */
const getIsDay = () => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  return (currentTime >= 6 * 60 + 30 && currentTime < 18 * 60) ? 1 : 0;
};

// 雷达
const getRadarImage = async () => {
  try {
    const radarUrl = 'https://tf03.istrongcloud.com/data/images/radar/mingle/sc_tran_1x.json';
    const item = await new Request(radarUrl).loadJSON();
    if (!item || !item.length || !item[0].url) return null;
    const radar = item.at(-1);
    return await getCacheData(`radar.png`, radar.url, null, 0.5);
  } catch (e) {
    console.log(`Radar failed: ${e}`);
    return null;
  }
};

const getTileDir = (z, x) => {
  const dir = fm.joinPath(tilePath, `${z}_${x}`);
  if (!fm.fileExists(dir)) fm.createDirectory(dir);
  return dir;
};

const getTileFile = (z, x, y, style) => fm.joinPath(getTileDir(z, x), `${y}_${style}.png`);

const getTileURL = (z, x, y, style) => {
  const s = ['1', '2', '3', '4'][Math.abs(x + y) % 4];
  const host = style === 6 || style === 8 ? `webst0${s}` : `wprd0${s}`;
  return `https://${host}.is.autonavi.com/appmaptile?lang=zh_cn&style=${style}&x=${x}&y=${y}&z=${z}`;
};

const isValidTile = (img) => img && img.size.width === 256 && img.size.height === 256;

const readTile = async (z, x, y, style, time) => {
  const file = getTileFile(z, x, y, style);
  if (fm.fileExists(file)) {
    const date = fm.creationDate(file);
    const expired = time != null && date && (Date.now() - date.getTime()) / 36e5 > time;
    if (!expired) {
      try {
        const image = fm.readImage(file);
        if (isValidTile(image)) 
          return image;
      } catch (e) {}
    }
    safeRemove(file);
  }
  try {
    const image = await new Request(getTileURL(z, x, y, style)).loadImage();
    if (!isValidTile(image)) throw new Error('invalid tile');

    const tmp = file + '.tmp';
    safeRemove(tmp);
    fm.writeImage(tmp, image);
    let verify = null;
    try { verify = fm.readImage(tmp); } catch (e) {}
    if (!isValidTile(verify)) { safeRemove(tmp); throw new Error('verify failed'); }

    try {
      safeRemove(file);
      fm.move(tmp, file);
    } catch (e) {
      fm.writeImage(file, image);
      safeRemove(tmp);
    }
    return image;
  } catch (e) {
    console.log(`Tile failed ${z}/${x}/${y}/${style}`);
    return null;
  }
};

const lngToWorldX = (lng, z) => (lng + 180) / 360 * 256 * Math.pow(2, z);
const latToWorldY = (lat, z) => {
  const r = lat * Math.PI / 180;
  return (0.5 - Math.log((1 + Math.sin(r)) / (1 - Math.sin(r))) / (4 * Math.PI)) * 256 * Math.pow(2, z);
};

const getTileList = (lat, lng, z, radius = 3) => {
  const max = Math.pow(2, z), cx = Math.floor(lngToWorldX(lng, z) / 256), cy = Math.floor(latToWorldY(lat, z) / 256), list = [];
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      let x = ((cx + dx) % max + max) % max, y = cy + dy;
      if (y >= 0 && y < max) list.push({ z, x, y });
    }
  }
  return list;
};

const prepareTiles = async (viewport, styles, tileCacheHours = 24) => {
  const z = Math.round(viewport.zoom), tiles = getTileList(viewport.lat, viewport.lng, z, 3), jobs = [];
  for (const t of tiles) for (const style of styles) jobs.push([t, style]);
  const ready = new Map(), batchSize = 8;
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const result = await Promise.all(batch.map(([t, style]) => readTile(t.z, t.x, t.y, style, tileCacheHours)));
    batch.forEach(([t, style], j) => result[j] && ready.set(`${t.z}/${t.x}/${t.y}/${style}`, result[j]));
  }
  const valid = tiles.filter(t => styles.every(style => ready.has(`${t.z}/${t.x}/${t.y}/${style}`)));
  return { tiles: valid, images: ready };
};

// 独立出来的 7 级风圈绘制函数
const drawWindCircles = (ctx, point, project, EXPORT_SCALE) => {
  let quad = point.radius7_quad;
  if (!quad && point.radius7) {
    const r = point.radius7;
    quad = { ne: r, se: r, sw: r, nw: r };
  }
  if (!quad) return;

  const SCALE = 1.8;
  const sectors = [
    { start: 0, end: 90, r: quad.ne * SCALE },  // 东北方向风圈
    { start: 90, end: 180, r: quad.se * SCALE }, // 东南方向风圈
    { start: 180, end: 270, r: quad.sw * SCALE },// 西南方向风圈
    { start: 270, end: 360, r: quad.nw * SCALE } // 西北方向风圈
  ];

  const kmToLng = (km, lat) => km / (111 * Math.cos(lat * Math.PI / 180));
  const kmToLat = (km) => km / 111;
  const path = new Path();
  let firstPoint = true;

  sectors.forEach(sector => {
    if (!sector.r) return;
    const step = 5;
    for (let angle = sector.start; angle <= sector.end; angle += step) {
      const rad = angle * Math.PI / 180;
      const dLat = kmToLat(sector.r * Math.cos(rad));
      const dLng = kmToLng(sector.r * Math.sin(rad), point.lat);
      const pt = project(point.lat + dLat, point.lng + dLng);
      if (firstPoint) {
        path.move(pt);
        firstPoint = false;
      } else {
        path.addLine(pt);
      }
    }
  });
  
  if (!firstPoint) {
    path.closeSubpath();
    ctx.setFillColor(new Color('#4caf50', 0.2));
    ctx.addPath(path);
    ctx.fillPath();
    ctx.setStrokeColor(new Color('#4caf50', 0.6));
    ctx.setLineWidth(1.2 * EXPORT_SCALE);
    ctx.addPath(path);
    ctx.strokePath();
  }
};

// 支持分别传入扰动数组和台风数组
const generateTCMapImage = async (tcPoints = [], typhoons = [], isDay = 0, locationPoint = null) => {
  const typhoonPoints = [
    ...tcPoints.map(p => ({ ...p, isTyphoon: false })),
    ...typhoons.map(p => ({ ...p, isTyphoon: true }))
  ];

  const W = 364, H = 382, MAP_W = 546, MAP_H = 573, EXPORT_SCALE = 2 / 3, TILE = 256;
  const styles = isDay === 0 ? [6, 8] : [7], TILE_CACHE_HOURS = 24;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const getViewport = points => {
    if (!points || !points.length) {
      return { lng: 104.5, lat: 30.5, zoom: 3.5 };
    }
    const lngs = points.map(p => p.lng);
    const lats = points.map(p => p.lat);
    const maxLng = Math.max(...lngs);
    const minLng = Math.min(...lngs);
    const avgLat = lats.reduce((s, v) => s + v, 0) / lats.length;
    const lngSpan = maxLng - minLng;
    const t = clamp((maxLng - 112) / 58, 0, 1);
    let centerLng = 117.5 + t * 14 + clamp((maxLng - 155) * 0.5, 0, 10);
    if (maxLng > 160) {
      const extra = (maxLng - 160) * 0.42;
      const spanFactor = clamp(1 - (lngSpan - 30) / 50, 0.35, 1);
      centerLng += extra * spanFactor;
    }
    const OFFSET_EAST = 3.5; 
    centerLng = clamp(centerLng + OFFSET_EAST, 112, 165);
    let centerLat = 21.5 + (avgLat - 22.5) * 0.12;
    const OFFSET_NORTH = 2.0; 
    centerLat = clamp(centerLat + OFFSET_NORTH, 19.5, 27.0);
    let zoom = 4.15 - 1.25 * Math.pow(t, 0.72);
    if (maxLng > 165) zoom = Math.max(zoom, 3.02);
    if (lngSpan > 50) zoom -= 0.08 * clamp((lngSpan - 50) / 30, 0, 1);
    zoom = clamp(zoom, 2.95, 4.4);
    return { lng: centerLng, lat: centerLat, zoom };
  };

  const viewport = getViewport(typhoonPoints);
  const z = Math.round(viewport.zoom);
  const { tiles, images } = await prepareTiles(viewport, styles, TILE_CACHE_HOURS);
  const radarImage = await getRadarImage();
  const fractionalScale = Math.pow(2, viewport.zoom - z);
  const centerX = lngToWorldX(viewport.lng, z), centerY = latToWorldY(viewport.lat, z);
  const worldSize = TILE * Math.pow(2, z) * fractionalScale * EXPORT_SCALE;

  const ctx = new DrawContext();
  ctx.size = new Size(W, H);
  ctx.opaque = true;
  ctx.respectScreenScale = true;
  ctx.setFillColor(new Color('#80bde3'));
  ctx.fillRect(new Rect(0, 0, W, H));

  const worldToScreen = (wx, wy) => ({
    x: ((wx - centerX) * fractionalScale + MAP_W / 2) * EXPORT_SCALE,
    y: ((wy - centerY) * fractionalScale + MAP_H / 2) * EXPORT_SCALE
  });
  const project = (lat, lng) => {
    const { x, y } = worldToScreen(lngToWorldX(lng, z), latToWorldY(lat, z));
    return new Point(x, y);
  };

  const drawTiles = style => {
    const OVERLAP = .75, ox = OVERLAP / 2, size = TILE * fractionalScale * EXPORT_SCALE;
    for (const tile of tiles) {
      const image = images.get(`${tile.z}/${tile.x}/${tile.y}/${style}`);
      if (!image) continue;
      let { x, y } = worldToScreen(tile.x * TILE, tile.y * TILE);
      while (x + size < 0) x += worldSize;
      while (x > W) x -= worldSize;
      ctx.drawImageInRect(image, new Rect(x - ox, y - ox, size + OVERLAP, size + OVERLAP));
      if (x + size < 0) ctx.drawImageInRect(image, new Rect(x + worldSize - ox, y - ox, size + OVERLAP, size + OVERLAP));
      if (x > W - size) ctx.drawImageInRect(image, new Rect(x - worldSize - ox, y - ox, size + OVERLAP, size + OVERLAP));
    }
  };
  drawTiles(styles[0]);
  if (styles.length > 1) drawTiles(styles[1]);

  if (radarImage) {
    const radarRange = [
      [12.316339, 69.646079],
      [54.376029, 140.209411]
    ];
    const radarNW = project(
      radarRange[1][0], 
      radarRange[0][1]
    );
    const radarSE = project(
      radarRange[0][0], 
      radarRange[1][1]
    );
    const radarRect = new Rect(radarNW.x, radarNW.y, radarSE.x - radarNW.x, radarSE.y - radarNW.y);
    ctx.drawImageInRect(radarImage, radarRect);
  }
  
  const drawPath = (points, color, width, opacity, dash) => {
    if (points.length < 2) return;
    ctx.setStrokeColor(new Color(color, opacity));
    ctx.setLineWidth(width * EXPORT_SCALE);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      if (!dash) {
        const path = new Path();
        path.move(a); path.addLine(b);
        ctx.addPath(path); ctx.strokePath();
        continue;
      }
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (!len) continue;
      const ux = dx / len, uy = dy / len;
      let pos = 0, draw = true;
      while (pos < len) {
        const step = (draw ? dash[0] : dash[1]) * EXPORT_SCALE;
        const end = Math.min(pos + step, len);
        if (draw) {
          const path = new Path();
          path.move(new Point(a.x + ux * pos, a.y + uy * pos));
          path.addLine(new Point(a.x + ux * end, a.y + uy * end));
          ctx.addPath(path); ctx.strokePath();
        }
        pos = end; draw = !draw;
      }
    }
  };

  const warnLineConfig = [
    { color: '#ff0000', weight: 1.5, opacity: .8, points: [[0, 105], [4.5, 113], [11, 119], [18, 119], [22, 127], [34, 127]] },
    { color: '#008000', weight: 1.5, opacity: .9, dashArray: [8, 2], points: [[0, 105], [0, 120], [15, 132], [34, 132]] }
  ];
  for (const item of warnLineConfig) {
    drawPath(item.points.map(p => project(p[0], p[1])), item.color, item.weight, item.opacity, item.dashArray);
  }
  
  // 1，绘制当前定位图标
  if (locationPoint) {
    const locKey = isDay === 1 ? 'loc_light' : 'loc_night';
    const locBase64 = typhoonIcons[locKey];
    if (locBase64) {
      const locImg = Image.fromData(Data.fromBase64String(locBase64));
      const locPos = project(locationPoint.lat, locationPoint.lon);
      // 维持 40*60 原始比例 (2:3) 缩放
      const LOC_W = 22 * EXPORT_SCALE;
      const LOC_H = 33 * EXPORT_SCALE;
      const BOTTOM_PADDING = 3.3 * EXPORT_SCALE;
      ctx.drawImageInRect(locImg, new Rect(locPos.x - LOC_W / 2, locPos.y - LOC_H + BOTTOM_PADDING, LOC_W, LOC_H));
    }
  }
  
  // 2. 仅对标记为台风的点绘制风圈
  for (const p of typhoonPoints) {
    if (p.isTyphoon) {
      drawWindCircles(ctx, p, project, EXPORT_SCALE);
    }
  }
  
  // 3. 绘制图标及文本标注
  for (const p of typhoonPoints) {
    const pos = project(p.lat, p.lng);
    const ICON_SIZE = (p.isTyphoon ? 36 : 42) * EXPORT_SCALE;
    const iconImage = p.isTyphoon ? p.icon : tcIcon;
    if (iconImage) {
      ctx.drawImageInRect(iconImage, new Rect(pos.x - ICON_SIZE / 2, pos.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE));
    }
    
    const name = p.name || p.ename;
    if (name) {
      const fs = 11 * EXPORT_SCALE;
      const textColor = new Color(isDay === 1 ? '#555555' : '#eeeeee');
      ctx.setFont(Font.systemFont(fs));
      ctx.setTextColor(textColor);
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(name, new Rect(pos.x - 100, pos.y + ICON_SIZE / 2 + 2 * EXPORT_SCALE, 200, fs * 1.5));
    }
  }
  return ctx.getImage();
};

/**
 * GPS 获取的位置通常是 WGS-84 坐标系
 * 高德地图使用的是 GCJ-02（火星坐标系）
 */
const wgs84ToGcj02 = (lng, lat) => {
  const pi = Math.PI, a = 6378245.0, ee = 0.00669342162296594323;
  const outOfChina = (lng, lat) =>
    lng < 72.004 || lng > 137.8347 ||
    lat < 0.8293 || lat > 55.8271;
  if (outOfChina(lng, lat)) return { longitude: lng, latitude: lat };

  const transformLat = (x, y) => {
    let ret = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3;
    ret += (20 * Math.sin(y * pi) + 40 * Math.sin(y * pi / 3)) * 2 / 3;
    ret += (160 * Math.sin(y * pi / 12) + 320 * Math.sin(y * pi / 30)) * 2 / 3;
    return ret;
  };

  const transformLng = (x, y) => {
    let ret = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20 * Math.sin(6 * x * pi) + 20 * Math.sin(2 * x * pi)) * 2 / 3;
    ret += (20 * Math.sin(x * pi) + 40 * Math.sin(x * pi / 3)) * 2 / 3;
    ret += (150 * Math.sin(x * pi / 12) + 300 * Math.sin(x * pi / 30)) * 2 / 3;
    return ret;
  };
  
  let dLat = transformLat(lng - 105, lat - 35);
  let dLng = transformLng(lng - 105, lat - 35);
  const radLat = lat * pi / 180;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = dLat * 180 / (((a * (1 - ee)) / (magic * sqrtMagic)) * pi);
  dLng = dLng * 180 / ((a / sqrtMagic * Math.cos(radLat)) * pi);
  return {
    longitude: lng + dLng,
    latitude: lat + dLat
  };
};

// 获取当前位置经纬度
const getLocation = async () => {
  if (setting.updateTime) {
    const hours = (Date.now() - setting.updateTime) / 3600000;
    if (hours < 3) return setting;
  }
  try {
    const loc = await Location.current();
    const gcj = wgs84ToGcj02(
      loc.longitude,
      loc.latitude
    );
    setting.lon = gcj.longitude;
    setting.lat = gcj.latitude;
    setting.updateTime = Date.now();
    writeSettings(setting);
    return setting;
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
    const url = `https://tf03.istrongcloud.com/data/enComplex2/currMergerTC.json?random=${Date.now()}`
    const tc = await new Request(url).loadJSON();
    const p = loopdNextIdx(tc, 'TC');
    const ls = p.points?.at(-1) ?? '';
    const decrypt = await decryptData(ls);
    const points = tc.map(i => i.points?.at(-1) ? {
      ...i.points.at(-1),
      ename: i.ename
    } : null).filter(Boolean);
    const tcPoints = await decryptData(points) ?? [];
    return { tc, p, decrypt, tcPoints };
  } catch (e) {
    console.log(e);
    return {};
  }
};

// 补充参考位置和未来趋势数据
const fetchGovData = async (tfbh) => {
  const fallback = { location: '---', trend: '等待官方数据更新中...' };
  try {
    const govUrl = 'https://typhoon.slt.zj.gov.cn/Api/TyhoonActivity';
    const govList = await new Request(govUrl).loadJSON();
    const targetGov = govList.find(govItem => govItem.tfid === tfbh);
    if (!targetGov) return fallback;
    const detailUrl = `https://typhoon.slt.zj.gov.cn/Api/TyphoonInfo/${targetGov.tfid}`;
    const newData = await new Request(detailUrl).loadJSON();
    const typhoon = newData.points?.at(-1);
    if (!typhoon) return fallback;
    return {
      location: typhoon.ckposition || fallback.location,
      trend: typhoon.jl || fallback.trend
    };
  } catch {
    return fallback;
  }
};

// 经纬度/位置/趋势/台风动态
const complementLocTrend = async (tf, latest) => {
  const newest = latest.find(item => item.tfbh === tf.tfbh);
  if (!newest) return;
  if (newest.location) return newest;

  let loc = null;
  try {
    const locUrl = `https://tf.istrongcloud.com/data/completion/${tf.tfbh}.json`;
    loc = await new Request(locUrl).loadJSON();
  } catch (e) {
    loc = null;
  }

  if (loc?.location) {
    newest.location = loc.location;
    newest.trend = loc.completion;
  } else {
    console.log('调用备用接口')
    const govData = await fetchGovData(tf.tfbh);
    if (govData?.location) {
      newest.location = govData.location;
      newest.trend = govData.trend;
    }
  }
  return newest;
};

const getLatestData = async (tf) => {
  try {
    const url1 = `https://data.istrongcloud.com/data/latest.json`;
    const url2 = 'https://tf02.istrongcloud.com/data/moduleConfig/typhoonModuleConfig.json';
    const msgUrl = `https://tf02.istrongcloud.com/data/message/message.json`;
    const [latest, config, message] = await Promise.all([
      new Request(url1).loadJSON(),
      new Request(url2).loadJSON(),
      new Request(msgUrl).loadJSON(),
    ]);
    const newest = await complementLocTrend(tf, latest);
    messageNotice(message?.[0]);
    typhoonNotice(config);
    return newest;
  } catch (e) {
    console.log(e);
    return null;
  }
};

/** 
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
    const tf = loopdNextIdx(arr, 'TF');
    const typhoon = tf.points?.at(-1);
    const points = arr.map(i => i.points?.at(-1) ? {
      ...i.points.at(-1),
      name: i.name
    } : null).filter(Boolean);
    const tfPoints = await decryptData(points) ?? [];
    return { arr, tf, typhoon, tfPoints }
  } catch (e) {
    console.log(e);
    return null;
  }
};

const typhoonNotice = (config) => {
  const home = config.data.find(item => item.code === 'TYPHOON_HOME_NOTICE');
  const tips = home.data.common.title;
  if (tips && setting.tips !== tips) {
    notify(`台风信息通告 ‼️`, tips);
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

const speedChangeNotice = (tf, typhoon, newest, dist) => {
  setting.tf = setting.tf || {};
  const id = tf.tfbh || tf.ident;
  if (!id) return;
  const oldData = setting.tf[id] || {};
  const oldSpeed = oldData.speed;
  const speed = typhoon.speed || 0;
  if (oldSpeed !== speed) {
    notify(
      `⚠️ 台风 【${tf.name}】`, 
      `风速 ${speed}米/秒，${typhoon.power || 0}级 (${newest.strong || "未知"})` + (newest.location ? `\n${newest.location}` : "") + `\n台风中心距离你的位置 ${dist || 0} 公里`
    );
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
  const tcLocation = getTyphoonLocation(decrypt);
  if (oldSpeed !== decrypt.speed) {
    notify(
      `⚠️ ${p.name} ${p.ename} - ${decrypt.strong}`,
      `风速 ${decrypt.speed || 0}米/秒，${decrypt.power || 0}级，${decrypt.pressure || 0}百帕\n${tcLocation || '数据更新中...'}`
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
    [33, '#FDAC03'], [25, '#FFD83A'],
    [17, '#38ABFF'], [0, '#00C400']
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
const setBackground = async (widget, typhoonType, typhoons, isLarge) => {
  const isDay = getIsDay();
  const theme = isDay === 1 ? 'light' : 'dark';
  widget.url = `https://tf02.istrongcloud.com/typhoonApp/index.html#/home?theme=${theme}`;
  if (isLarge) {
    widget.backgroundColor = new Color('#A3CCFF');
    if (typhoonType === 'tf') {
      const latestTy = await getLatestTyImage() || {};
      widget.backgroundImage = latestTy.image;
    } else {
      const image = await generateTCMapImage(typhoonType, typhoons, isDay, setting);
      widget.backgroundImage = image;
    }
  } else {
    widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    widget.backgroundImage = await getCacheData('background.png', `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png`);
  }
};

const generateItem = (isLarge, typhoon, newest, land, maxSpeed, dist, remainTime, hasNumber) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${newest.lon || 0}°　北纬${newest.lat || 0}°`, 
      color: '#00C400'
    },
    { 
      label: "风速风力", 
      value: `${typhoon.speed}米/秒，${typhoon.power}级 ( ${newest.strong} )`, 
      color: '#39A7F8'
    },
    { 
      label: land
        ? "登陆位置"
        : maxSpeed.power > 10
          ? "预测强度"
          : "风圈半径",
      value: land
        ? `${formatDate(land.land_time, true)}，在${land.position}登陆`
        : maxSpeed.power > 10
          ? `${maxSpeed.speed}米/秒，${maxSpeed.power}级 ${maxSpeed.strong}，${maxSpeed.sets}预测`
          : `${typhoon.radius7 || 0}km-7级，${typhoon.radius10 || 0}km-10级，${typhoon.radius12 || 0}km-12级`,
      color: '#FFD83A'
    },
    { 
      label: "参考位置", 
      value: newest.location || '---',
      color: '#FF7800'
    },
    ...(!land && (isLarge || !hasNumber) ? [{
      label: "登陆时间",
      value: `预计 ${remainTime}后到达，离你 ${dist} 公里`,
      color: '#F95BF9'
    }] : []),
    { 
      label: "未来趋势", 
      value: newest.trend || '---',
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
    ...(!isLarge ? [{ 
      label: "中心气压", 
      value: `${decrypt.pressure} 百帕`, 
      color: '#FFD83A'
    }] : []),
    ...(!isLarge && tcLocation.length < 21 ? [{
      label: "开始时间",
      value: begin_time,
      color: '#00B8D9'
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
      topStack.addSpacer(2);
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
    mainStack.backgroundColor = new Color('#FEFEFE', 0.2);
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
  const barColor = getTyphoonColor(typhoon.speed);
  const date = formatDate(newest.update_time);
  const land = tf.land?.at(-1) ?? '';
  const dist = getDistance(setting.lat, setting.lon, newest.lat, newest.lon);
  const distance = newest.location?.match(/\d+/)?.[0] || 0
  const hasNumber = /\d+/.test(newest.trend);
  const remainTime = getTyphoonRemainTime(distance, typhoon.move_speed);
  const maxSpeed = getMaxForecast(tf);
  const info = generateItem(isLarge, typhoon, newest, land, maxSpeed, dist, remainTime, hasNumber);
  speedChangeNotice(tf, typhoon, newest, dist);
  return createWidget(arr, tf, typhoon, maxSpeed, date, land, dist, info, barColor, textColor, isLarge);
};

const createTcData = (tc, p, decrypt, textColor, isLarge) => {
  const tcLocation = getTyphoonLocation(decrypt);
  const dist = getDistance(setting.lat, setting.lon, decrypt.lat, decrypt.lng);
  const date = formatDate(decrypt.time);
  const begin_time = formatTime(p.begin_time);
  const info = generateTCItem(
    dist, tcLocation, begin_time, 
    decrypt, isLarge
  );
  return createTCWidget(tc, p, date, info, tcLocation, textColor, isLarge);
};

// 提取台风等级 SuperTY
const getTyphoonItem = data => data.map(item => {
  const type = item.strong?.match(/\((.*?)\)/)?.[1];
  return {...item, icon: typhoonIcons[type] ? Image.fromData(Data.fromBase64String(typhoonIcons[type])) : null};
});

// 主函数
const runWidget = async () => {
  getLocation();
  const { arr, tf, typhoon, tfPoints } = await getTyphoonData() || {};
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
  const isDay = getIsDay();
  const tcTextColor = isLarge
    ? isDay === 1 ? Color.black() : Color.white()
    : Color.dynamic(Color.black(), Color.white());
  
  let widget;
  if (isSmall) {
    widget = errorWidget();
  } else if (tf && !isNumber) {
    widget = await createTyphoonData(
      arr, tf, typhoon, newest, 
      textColor, isLarge
    );
    await setBackground(widget, 'tf', [], isLarge);
  } else if (!tf || isNumber) {
    const { tc = [], p = {}, decrypt = {}, tcPoints } = await currMergerTC();
    if (tc.length) {
      currMergerTCNotice(p, decrypt);
      const typhoons = getTyphoonItem(tfPoints);
      const tyPoints = Number(param) === 2 ? typhoons : [];
      widget = createTcData(tc, p, decrypt, tcTextColor, isLarge);
      await setBackground(widget, tcPoints, tyPoints, isLarge);
    } else {
      const levels = levelAgency();
      widget = createLevelWidget(
        levels, tcTextColor, isLarge
      );
      await setBackground(widget, [], [], isLarge);
    }
  }

  if (config.runsInApp) {
    await widget.presentLarge();
  } else {
    autoUpdate();
    Script.setWidget(widget);
    Script.complete();
  }
};

await runWidget();