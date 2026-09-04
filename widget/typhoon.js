// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: spinner;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.0.5
 * 数据来源: 四创科技台风路径 App
 * https://t.me/+CpAbO_q_SGo2ZWE1
 * 支持中大号组件 ‼️
 *
 * 桌面组件输入参数:
 1，填写数字(2️⃣)展示热带扰动加台风。
 2，其他数字只展示热带扰动。
 3，填写 ('全国', '华南', '华东上', '华东下', '西南', '华中', '华北', '东北', '西北') 展示对应地区的雷达拼图。
 4，华东分成上下，原图示例:
https://upy.istrongcloud.com/radar/mingle/huadong/202609/02/202609020206yp650tkH.gif
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
    return JSON.parse(data) || {};
  }
};
const setting = getSetting();

const useFileManager = (type) => ({
  read: (name) => {
    const filePath = fm.joinPath(mainPath, name);
    if (!fm.fileExists(filePath)) return null;
    return type ? fm.readString(filePath) && JSON.parse(fm.readString(filePath)) : fm.readImage(filePath);
  },
  write: (name, content) => {
    const filePath = fm.joinPath(mainPath, name);
    if (fm.fileExists(filePath)) fm.remove(filePath);
    type ? fm.writeString(filePath, JSON.stringify(content)) : fm.writeImage(filePath, content);
  }
});

const getCacheData = async (name, url, type, cacheTime = 0) => {
  const cache = useFileManager(type);
  const filePath = fm.joinPath(mainPath, name);
  const data = cache.read(name);
  const expired = cacheTime > 0 &&
    (!fm.fileExists(filePath) ||
      (Date.now() - fm.creationDate(filePath).getTime()) / 36e5 > cacheTime);
  if (data && !expired) return data;
  try {
    const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
    if (response) {
      cache.write(name, response);
      console.log(name)
      return response;
    }
  } catch (e) {}
  return data;
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
  { id: "yilan", name: "台湾省宜兰县", lat: 24.702, lng: 121.738, rx: 6, ry: 5 },
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
  naha:      ["tokyo", "kagoshima", "saipan", "hualien", "kaohsiung", "taipei", "yilan"],
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

  const JP_CHAIN = ["tokyo", "naha", "kagoshima"];
  const TW_CHAIN = ["yilan", "hualien", "taipei", "kaohsiung"];
  const preferred = candidates.find(c => JP_CHAIN.includes(c.id) && isMeaningfulSecond(point, main, c));

  if (preferred) {
    const closestTw = candidates
      .filter(c => TW_CHAIN.includes(c.id) && isMeaningfulSecond(point, main, c))
      .sort((a, b) => a.distance - b.distance)[0];
    if (closestTw &&
        closestTw.distance < preferred.distance &&
        (preferred.distance - closestTw.distance) <= preferred.distance * 0.05) {
      return closestTw;
    }
    return preferred;
  }

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

// 制作华东地区图片
const processImagePipeline = async (img, trim = { top: 1, right: 2, bottom: 1, left: 3 }) => {
  const imgData = Data.fromPNG(img).toBase64String();
  const html=`<img id="srcImg" src="data:image/png;base64,${imgData}"/>`;const js=` const img=document.getElementById("srcImg");const run=()=>{const{top:t,right:r,bottom:b,left:l}=${JSON.stringify(trim)};const cropW=img.naturalWidth-(l+r);const cropH=img.naturalHeight-(t+b);const clean=document.createElement("canvas");clean.width=cropW;clean.height=cropH;clean.getContext('2d').drawImage(img,l,t,cropW,cropH,0,0,cropW,cropH);const targetW=950;const targetH=997;const scaledH=876;const sliceH=Math.round(scaledH*(cropW/targetW));const canvasA=document.createElement("canvas");canvasA.width=targetW;canvasA.height=121;const ctxA=canvasA.getContext('2d');const sideMargin=(targetW-cropW)/2;ctxA.fillStyle="#FFFFFF";ctxA.fillRect(0,0,targetW,121);ctxA.drawImage(clean,0,cropH-121,cropW,121,sideMargin,0,cropW,121);ctxA.fillStyle="#000000";ctxA.fillRect(0,1,sideMargin,1);ctxA.fillRect(targetW-sideMargin,1,sideMargin,1);const createStitchedCanvas=(startY)=>{const canvas=document.createElement("canvas");canvas.width=targetW;canvas.height=targetH;const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(clean,0,startY,cropW,sliceH,0,0,targetW,scaledH);ctx.drawImage(canvasA,0,scaledH);return canvas.toDataURL('image/png');};const upperTotalH=cropH-121;const res1=createStitchedCanvas(0);const startY2=upperTotalH-sliceH;const res2=createStitchedCanvas(startY2);completion(JSON.stringify([res1,res2]));};if(img.complete){run();}else{img.onload=run;}`;
  const wv = new WebView();
  await wv.loadHTML(html);
  const base64Str = await wv.evaluateJavaScript(js, true);
  const image = JSON.parse(base64Str);
  return await Promise.all([
    new Request(image[0]).loadImage(),
    new Request(image[1]).loadImage()
  ]);
};

/**
 * 热带扰动地图背景图 ✅
 */
const getIsDay = () => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  return (currentTime >= 6 * 60 + 30 && currentTime < 18 * 60) ? 1 : 0;
};

// 雷达图片
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

// 绘制台风预测路径
const getStationColor = country => {
  const colors = {
    中国: '#FF4050', 香港: '#FF66FF',
    日本: '#43FF4B', 台湾: '#FFA040',
    美国: '#40DDFF', 韩国: '#669999',
    欧洲: '#246ED4'
  };
  return colors[country] || '#FF66FF';
};

const getLevelColor = gradeEname => {
  const colors = {
    TD: '#68FF8C', TS: '#38ABFF',
    STS: '#FBFF6B', TY: '#FDAC03',
    STY: '#F95AFF', SUPERTY: '#FF0C0C'
  };
  return colors[gradeEname] || '#68FF8C';
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

const safeRemove = (p) => { try { fm.remove(p); } catch (e) {} };

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
  const ready = new Map();
  const batchSize = 8;
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

// 绘制台风预测路径
const drawForecastPath = (ctx, typhoon, project, EXPORT_SCALE, drawPathFn) => {
  if (!typhoon.forecast || !typhoon.forecast.length) return;

  const currentPos = project(typhoon.lat, typhoon.lng);
  const pointRadius = 4.5 * EXPORT_SCALE;
  const strokeWidth = 1.0 * EXPORT_SCALE;

  for (const forecastSet of typhoon.forecast) {
    if (!forecastSet.points || !forecastSet.points.length) continue;
    const lineHex = getStationColor(forecastSet.sets);
    const forecastPoints = forecastSet.points.map(p => project(p.lat, p.lng));
    const allPathPoints = [currentPos, ...forecastPoints];
    drawPathFn(allPathPoints, lineHex, 1.5, 0.8, [4, 3]);
    for (let i = 0; i < forecastSet.points.length; i++) {
      const p = forecastSet.points[i];
      const pt = forecastPoints[i];
      const level = p.strong?.match(/\((.*?)\)/)?.[1] || p.type;
      const pointHex = getLevelColor(level);
      const outerRadius = pointRadius + strokeWidth;
      const outerRect = new Rect(pt.x - outerRadius, pt.y - outerRadius, outerRadius * 2, outerRadius * 2);
      ctx.setFillColor(new Color('#000000', 0.9));
      ctx.fillEllipse(outerRect);
      const innerRect = new Rect(pt.x - pointRadius, pt.y - pointRadius, pointRadius * 2, pointRadius * 2);
      ctx.setFillColor(new Color(pointHex, 1.0));
      ctx.fillEllipse(innerRect);
    }
  }
};

// 绘制单个台风的所有登陆点旗帜（一个台风可能多次登陆）
const drawLandingFlags = (ctx, typhoon, flagIcon, project, EXPORT_SCALE) => {
  if (!flagIcon || !typhoon.land || !typhoon.land.length) return;
  const FLAG_SCALE = 0.85;
  const FLAG_W = 32 * FLAG_SCALE * EXPORT_SCALE;
  const FLAG_H = 34 * FLAG_SCALE * EXPORT_SCALE;
  for (const p of typhoon.land) {
    const landLat = parseFloat(p.lat);
    const landLng = parseFloat(p.lng);
    if (Number.isNaN(landLat) || Number.isNaN(landLng)) continue;
    const flagPos = project(landLat, landLng);
    ctx.drawImageInRect(flagIcon, new Rect(flagPos.x - FLAG_W / 2, flagPos.y - FLAG_H, FLAG_W, FLAG_H));
  }
};

// 绘制台风登陆位置信息框
const drawLandInfoBox = (ctx, pos, text, isDay, iconSize, EXPORT_SCALE) => {
  const fontSize = 14 * EXPORT_SCALE;
  const paddingH = 10 * EXPORT_SCALE;
  const paddingV = 5 * EXPORT_SCALE;
  const arrowHeight = 8 * EXPORT_SCALE;
  const arrowWidth = 12 * EXPORT_SCALE;
  const boxHeight = fontSize * 1.3 + paddingV * 2;
  const fillColor = new Color(isDay === 1 ? '#38ABFF' : '#FDAC03', 0.7);
  // 1. 估算文本和背景框的实际宽度
  const estimatedTextWidth = text.length * fontSize;
  const boxWidth = estimatedTextWidth + paddingH * 2;
  // 2. 三角指针位置右移设置
  const arrowOffsetX = boxWidth * 0.25;
  const boxX = pos.x - arrowOffsetX;
  const boxY = pos.y - iconSize / 2 - boxHeight - arrowHeight + (4 * EXPORT_SCALE);
  // 3. 绘制主矩形/圆角背景框
  const rectPath = new Path();
  rectPath.addRoundedRect(new Rect(boxX, boxY, boxWidth, boxHeight), 12 * EXPORT_SCALE, 12 * EXPORT_SCALE);
  ctx.setFillColor(fillColor);
  ctx.addPath(rectPath);
  ctx.fillPath();
  // 4. 绘制底部指向小三角
  const arrowPath = new Path();
  const arrowTopY = boxY + boxHeight;
  arrowPath.move(new Point(pos.x - arrowWidth / 2, arrowTopY));
  arrowPath.addLine(new Point(pos.x + arrowWidth / 2, arrowTopY));
  arrowPath.addLine(new Point(pos.x, arrowTopY + arrowHeight));
  arrowPath.closeSubpath();
  ctx.setFillColor(fillColor);
  ctx.addPath(arrowPath);
  ctx.fillPath();
  ctx.setFont(Font.boldSystemFont(fontSize));
  ctx.setTextColor(new Color('#ffffff'));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(text, new Rect(boxX + paddingH, boxY + paddingV, boxWidth - paddingH * 2, boxHeight));
};

/**
 * 矩形碰撞检测函数（包含 Margin 边距保护）
 */
const isOverlapping = (rectA, rectB, margin = 10) => {
  return !(rectA.x + rectA.width + margin <= rectB.x || rectA.x >= rectB.x + rectB.width + margin || rectA.y + rectA.height + margin <= rectB.y || rectA.y >= rectB.y + rectB.height + margin);
};

const drawBadge = (ctx, badgeText, subscriptType, boxX, boxY, boxW, badgeFS, EXPORT_SCALE) => {
  if (!badgeText) return;

  const badgeW = badgeText.length * badgeFS * 0.85 + 10 * EXPORT_SCALE;
  const badgeH = badgeFS + 6 * EXPORT_SCALE;
  const badgeX = boxX + boxW - badgeW - 6 * EXPORT_SCALE;
  const badgeY = boxY - badgeH / 2;
  const typeUpper = (subscriptType || "").toUpperCase();
  const badgeBg = typeUpper === 'TOP' 
    ? new Color('#f5a623') 
    : (typeUpper === 'NEW' ? new Color('#2b88e6') : new Color('#a255ff'));
  ctx.setFillColor(badgeBg);
  // 绘制圆角背景
  const baseBadgePath = new Path();
  baseBadgePath.addRoundedRect(new Rect(badgeX, badgeY, badgeW, badgeH), badgeH / 2, badgeH / 2);
  ctx.addPath(baseBadgePath);
  ctx.fillPath();
  // 绘制角标左下角的小尾巴
  const tailExt = 1.5 * EXPORT_SCALE;
  const tailPath = new Path();
  tailPath.move(new Point(badgeX, badgeY + badgeH / 2));
  tailPath.addLine(new Point(badgeX, badgeY + badgeH));
  tailPath.addLine(new Point(badgeX - tailExt, badgeY + badgeH));
  tailPath.addLine(new Point(badgeX + (8 * EXPORT_SCALE), badgeY + badgeH));
  tailPath.addLine(new Point(badgeX + (8 * EXPORT_SCALE), badgeY + badgeH / 2));
  tailPath.closeSubpath();
  ctx.addPath(tailPath);
  ctx.fillPath();
  // 绘制角标文字
  const badgeFont = Font.boldSystemFont(badgeFS);
  ctx.setFont(badgeFont);
  ctx.setTextColor(new Color('#ffffff'));
  ctx.setTextAlignedCenter();
  ctx.drawTextInRect(badgeText, new Rect(badgeX, badgeY + (badgeH - badgeFS) / 2 - EXPORT_SCALE, badgeW, badgeFS * 1.5));
};

// 裁剪圆形头像
const getCircleAvatar = async (title, imageUrl) => {
  if (!imageUrl) return null;
  const rawAvatar = await getCacheData(`avatar_raw_${title}.png`, imageUrl, false, 2);
  if (!rawAvatar) return null;
  const cache = useFileManager(false);
  const circleName = `avatar_circle_${title}.png`;
  const cached = cache.read(circleName);
  if (cached) return cached;
  try {
    const sz = Math.min(rawAvatar.size.width, rawAvatar.size.height);
    const wv = new WebView();
    await wv.loadHTML(`<canvas id="c" width="${sz}" height="${sz}"></canvas><script>const i=new Image();i.onload=()=>{const c=document.getElementById('c');const x=c.getContext('2d');x.beginPath();x.arc(${sz/2},${sz/2},${sz/2},0,Math.PI*2);x.clip();x.drawImage(i,0,0,${sz},${sz});document.body.setAttribute('d',c.toDataURL('image/png'));};i.src="data:image/png;base64,${Data.fromPNG(rawAvatar).toBase64String()}";</script>`);
    let b64 = "";
    for (let i = 0; i < 30; i++) {
      b64 = await wv.evaluateJavaScript("document.body.getAttribute('d')");
      if (b64) break;
      await new Promise(r => setTimeout(r, 50));
    }
    if (!b64) return rawAvatar;
    const img = Image.fromData(Data.fromBase64String(b64.replace(/^data:image\/\w+;base64,/, "")));
    cache.write(circleName, img);
    return img;
  } catch {
    return rawAvatar;
  }
};

/**
 * 智能筛选并绘制最多 3 个互不重叠的卡片
 */
const drawFeedbackInfoBoxes = async (
  ctx, 
  feedbackData, 
  project, 
  EXPORT_SCALE, 
  canvasW = 1000, 
  canvasH = 1000,
  currentZoom = 3.6
) => {
  if (!feedbackData?.length || currentZoom < 3.5) return [];
  // 1. 基础尺寸与配置
  const titleFS = 13 * EXPORT_SCALE;
  const subFS = 10 * EXPORT_SCALE;
  const badgeFS = 8 * EXPORT_SCALE;
  const lineSpacing = 4 * EXPORT_SCALE;
  const padH = 6 * EXPORT_SCALE, padV = 5 * EXPORT_SCALE;
  const avatarSize = 34 * EXPORT_SCALE, arrowSize = 16 * EXPORT_SCALE, pointerSize = 22 * EXPORT_SCALE;
  const triW = 10 * EXPORT_SCALE, triH = 6 * EXPORT_SCALE;

  const loadBase64 = str => (str && Data.fromBase64String(str.trim())) ? Image.fromData(Data.fromBase64String(str.trim())) : null;
  const arrowImg = loadBase64(typhoonIcons?.arrow);
  const pointerImg = loadBase64(typhoonIcons?.blueCircle);

  const shuffledData = [...feedbackData];
  for (let i = shuffledData.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
  }
  
  const drawnRects = [];
  const selItems = []; // 暂存通过碰撞检测、确定要绘制的卡片数据
  const TARGET_COUNT = 3; 

  // 阶段 1：碰撞检测与数据筛选
  for (const item of shuffledData) {
    if (selItems.length >= TARGET_COUNT) break; 
    const lat = parseFloat(item.lat), lon = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lon)) continue;
    // 吉林往北（lat > 43.5）不显示提示框，避免遮挡小组件顶部标题
    if (lat > 43.5) continue;
    const pos = project(lat, lon);
    if (isNaN(pos.x) || isNaN(pos.y)) continue;
    const margin = 10 * EXPORT_SCALE;
    if (pos.x < margin || pos.x > canvasW - margin || pos.y < margin || pos.y > canvasH - margin) {
      continue;
    }

    const titleText = item.title || "", subTitleText = item.subTitle || "";
    const textW = Math.max(titleText.length * titleFS * 1.05, subTitleText.length * subFS * 1.05);
    const boxW = avatarSize + textW + arrowSize + padH * 6;
    const boxH = avatarSize + padV * 2;
    
    let boxX = pos.x - boxW / 2;
    let boxY = pos.y - boxH - triH - (pointerSize / 2);
    let isFlippedVertically = false;
    boxX = Math.max(margin, Math.min(boxX, canvasW - boxW - margin));
    if (boxY < margin) {
      boxY = pos.y + (pointerSize / 2) + triH;
      isFlippedVertically = true;
    }
    const currentCardRect = { x: boxX, y: boxY, width: boxW, height: boxH };
    // 防重叠碰撞检测
    const safeGap = 12 * EXPORT_SCALE;
    if (drawnRects.some(rect => isOverlapping(currentCardRect, rect, safeGap))) {
      continue; 
    }
    
    drawnRects.push(currentCardRect);
    selItems.push({ item, pos, boxX, boxY, boxW, boxH, textW, isFlippedVertically });
  }

  // 阶段 2：底层绘制 —— 绘制所有定位圆点
  if (pointerImg) {
    for (const card of selItems) {
      const ptrX = card.pos.x - pointerSize / 2;
      const ptrY = card.pos.y - pointerSize / 2;
      ctx.drawImageInRect(pointerImg, new Rect(ptrX, ptrY, pointerSize, pointerSize));
    }
  }

  // 阶段 3：顶层绘制 —— 绘制所有提示框卡片
  for (const card of selItems) {
    const { item, pos, boxX, boxY, boxW, boxH, textW, isFlippedVertically } = card;
    const titleText = item.title || "", subTitleText = item.subTitle || "";
    const badgeText = item.subscriptTypeLabel || item.subscriptType || "";
    // 1. 绘制主卡片背景
    const mainRectPath = new Path();
    mainRectPath.addRoundedRect(new Rect(boxX, boxY, boxW, boxH), boxH / 2, boxH / 2);
    ctx.setFillColor(new Color('#ffffff'));
    ctx.addPath(mainRectPath);
    ctx.fillPath();

    ctx.setStrokeColor(new Color('#e0e0e0'));
    ctx.setLineWidth(1 * EXPORT_SCALE);
    ctx.addPath(mainRectPath);
    ctx.strokePath();
    // 2. 绘制卡片指向小三角
    const triCenterX = Math.max(boxX + triW, Math.min(boxX + boxW - triW, pos.x));
    const triPath = new Path();
    let triTopY, triBottomY;

    if (!isFlippedVertically) {
      triTopY = boxY + boxH - (1 * EXPORT_SCALE);
      triBottomY = triTopY + triH;
      triPath.move(new Point(triCenterX - triW / 2, triTopY));
      triPath.addLine(new Point(triCenterX + triW / 2, triTopY));
      triPath.addLine(new Point(triCenterX, triBottomY));
    } else {
      triBottomY = boxY + (1 * EXPORT_SCALE);
      triTopY = triBottomY - triH;
      triPath.move(new Point(triCenterX - triW / 2, triBottomY));
      triPath.addLine(new Point(triCenterX + triW / 2, triBottomY));
      triPath.addLine(new Point(triCenterX, triTopY));
    }
    triPath.closeSubpath();
    ctx.setFillColor(new Color('#ffffff'));
    ctx.addPath(triPath);
    ctx.fillPath();

    const triBorder = new Path();
    if (!isFlippedVertically) {
      triBorder.move(new Point(triCenterX - triW / 2, triTopY));
      triBorder.addLine(new Point(triCenterX, triBottomY));
      triBorder.addLine(new Point(triCenterX + triW / 2, triTopY));
    } else {
      triBorder.move(new Point(triCenterX - triW / 2, triBottomY));
      triBorder.addLine(new Point(triCenterX, triTopY));
      triBorder.addLine(new Point(triCenterX + triW / 2, triBottomY));
    }
    ctx.addPath(triBorder);
    ctx.strokePath();
    // 3. 绘制左侧圆形头像
    const circleAvatar = await getCircleAvatar(item.title, item.imageUrl);
    if (circleAvatar) {
      ctx.drawImageInRect(circleAvatar, new Rect(boxX + padH, boxY + padV, avatarSize, avatarSize));
    }
    // 4. 绘制标题和副标题
    const textX = boxX + padH + avatarSize + 6 * EXPORT_SCALE;
    const startTextY = boxY + (boxH - (subTitleText ? titleFS + subFS + lineSpacing : titleFS)) / 2 - EXPORT_SCALE;
    const titleFont = Font.boldSystemFont(titleFS);
    ctx.setFont(titleFont);
    ctx.setTextColor(new Color('#38b6ff'));
    ctx.setTextAlignedLeft();
    ctx.drawTextInRect(titleText, new Rect(textX, startTextY, textW, titleFS * 1.2));
    if (subTitleText) {
      const subTitleFont = Font.systemFont(subFS);
      ctx.setFont(subTitleFont);
      ctx.setTextColor(new Color('#222222'));
      ctx.drawTextInRect(subTitleText, new Rect(textX, startTextY + titleFS + lineSpacing, textW, subFS * 1.2));
    }
    // 5. 绘制右侧箭头
    if (arrowImg) {
      ctx.drawImageInRect(arrowImg, new Rect(boxX + boxW - padH * 2 - arrowSize, boxY + (boxH - arrowSize) / 2, arrowSize, arrowSize));
    }
    // 6. 绘制右上角角标
    drawBadge(ctx, badgeText, item.subscriptType, boxX, boxY, boxW, badgeFS, EXPORT_SCALE);
  }
  return drawnRects;
};

// 风景图标绘制
const drawLandmarkIcons = async (
  ctx,
  feedbackData,
  project,
  EXPORT_SCALE,
  canvasW = 1000,
  canvasH = 1000,
  drawnRects = []
) => {
  if (!feedbackData?.length) return;
  const ICON_W = 22 * EXPORT_SCALE;
  const ICON_H = 38 * EXPORT_SCALE;
  // 小圆点中心相对原图（88x152）的比例，按实测像素换算
  const ANCHOR_X_RATIO = 42.5 / 88;
  const ANCHOR_Y_RATIO = 115.5 / 152;
  const safeGap = 3 * EXPORT_SCALE;
  const MAX_ICON_COUNT = 3;
  let drawnCount = 0;
  // 1. 过滤符合条件的风景图标
  const landmarkItems = feedbackData.filter(item => {
    const isRec = String(item.isRecommend) === "0";
    const hasIcon = !!item.iconUrl;
    const isScenery = (item.iconLabel || "").includes("风景");
    return isRec && hasIcon && isScenery;
  });
  if (landmarkItems.length === 0) return;
  // 2. 随机打乱
  const shuffledItems = [...landmarkItems];
  for (let i = shuffledItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
  }

  for (const item of shuffledItems) {
    if (drawnCount >= MAX_ICON_COUNT) break;
    const lat = parseFloat(item.lat), lon = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lon)) continue;
    const pos = project(lat, lon);
    if (!pos || isNaN(pos.x) || isNaN(pos.y)) continue;
    // 小圆点中心对齐坐标点
    const boxX = pos.x - ICON_W * ANCHOR_X_RATIO;
    const boxY = pos.y - ICON_H * ANCHOR_Y_RATIO;
    // 边缘检测（适当放宽边距）
    const margin = 10 * EXPORT_SCALE;
    if (boxX < -margin || boxX + ICON_W > canvasW + margin || boxY < -margin || boxY + ICON_H > canvasH + margin) {
      continue;
    }
    const currentIconRect = { x: boxX, y: boxY, width: ICON_W, height: ICON_H };
    // 碰撞检测避让
    const hasCollision = drawnRects.some(rect => {
      return !(
        currentIconRect.x + currentIconRect.width + safeGap < rect.x || currentIconRect.x - safeGap > rect.x + rect.width || currentIconRect.y + currentIconRect.height + safeGap < rect.y || currentIconRect.y - safeGap > rect.y + rect.height
      );
    });
    if (hasCollision) continue;
    // 缓存读取与绘制
    try {
      const key = `${item.title || 'landmark'}_${Data.fromString(item.iconUrl).toBase64String().slice(-12)}`;
      const iconImg = await getCacheData(`landmark_${key}.png`, item.iconUrl, false, 24);
      if (iconImg) {
        ctx.drawImageInRect(iconImg, new Rect(boxX, boxY, ICON_W, ICON_H));
        drawnRects.push(currentIconRect);
        drawnCount++;
      }
    } catch (e) {}
  }
};

// 支持分别传入扰动数组和台风数组
const generateMapImage = async (
  isDay = 0, 
  tcPoints = [], 
  typhoons = [], 
  feedbackData = [], 
  locationPoint = null
) => {
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
    // 20°以内的间隔都算"同一片区域"，zoom 下限抬到 3.5；
    // 超过20°后逐渐回落到 2.95（在 span=50 时落到底），宽跨度组合不受影响
    const tightness = clamp(1 - Math.max(0, lngSpan - 20) / 30, 0, 1);
    const minZoom = 2.95 + tightness * 0.55;
    zoom = clamp(zoom, minZoom, 4.4);
    if (zoom < 3.5) centerLng = Math.max(centerLng, 132.2);
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
      const image = images.get(`${tile.z}/${tile.x}/${tile.y}/${style}`)
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
  
  // 1. 出行推荐提示框绘制
  const occupiedRects = await drawFeedbackInfoBoxes(ctx, feedbackData, project, EXPORT_SCALE, 1000, 1000, viewport.zoom);
  // 2，绘制风景图标
  await drawLandmarkIcons(ctx, feedbackData, project, EXPORT_SCALE, 1000, 1000, occupiedRects);
  
  // 3. 点绘制台风风圈与预测路径
  for (const p of typhoonPoints) {
    if (p.isTyphoon) {
      drawWindCircles(ctx, p, project, EXPORT_SCALE);
      drawForecastPath(ctx, p, project, EXPORT_SCALE, drawPath);
    }
  }
  
  // 4. 仅对台风/热带扰动绘制图标
  for (const p of typhoonPoints) {
    const pos = project(p.lat, p.lng);
    const ICON_SIZE = (p.isTyphoon ? 40 : 42) * EXPORT_SCALE;
    const iconImage = p.isTyphoon ? p.icon : tcIcon;
    if (iconImage) {
      ctx.drawImageInRect(iconImage, new Rect(pos.x - ICON_SIZE / 2, pos.y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE));
    }
    
    const name = p.isTyphoon ? p.name : p.ename;
    if (name) {
      const fs = 11 * EXPORT_SCALE;
      const textColor = new Color(isDay === 1 ? '#555555' : '#eeeeee');
      ctx.setFont(Font.systemFont(fs))
      ctx.setTextColor(textColor);
      ctx.setTextAlignedCenter();
      ctx.drawTextInRect(name, new Rect(pos.x - 100, pos.y + ICON_SIZE / 2 + 2 * EXPORT_SCALE, 200, fs * 1.5));
    }
  }
  
  // 5. 绘制登陆点旗帜标记
  const flagBase64 = typhoonIcons.flag;
  const flagIcon = flagBase64 ? Image.fromData(Data.fromBase64String(flagBase64)) : null;
  for (const p of typhoonPoints) {
    if (p.isTyphoon) drawLandingFlags(ctx, p, flagIcon, project, EXPORT_SCALE);
  }
  
  // 6. 绘制当前定位图标
  if (locationPoint) {
    const locKey = isDay === 1 ? 'loc_light' : 'loc_night';
    const locBase64 = typhoonIcons[locKey];
    if (locBase64) {
      const locImg = Image.fromData(Data.fromBase64String(locBase64));
      const locPos = project(locationPoint.lat, locationPoint.lon);
      const LOC_W = 22 * EXPORT_SCALE;
      const LOC_H = 33 * EXPORT_SCALE;
      const BOTTOM_PADDING = 3.3 * EXPORT_SCALE; 
      ctx.drawImageInRect(locImg, new Rect(locPos.x - LOC_W / 2, locPos.y - LOC_H + BOTTOM_PADDING, LOC_W, LOC_H));
    }
  }
  
  // 7. 绘制登陆 location 提示框（最顶层）
  for (const p of typhoonPoints) {
    if (p.isTyphoon && p.land && p.land.length > 0 && p.latest && p.latest.location) {
      const pos = project(p.lat, p.lng);
      const ICON_SIZE = 40 * EXPORT_SCALE;
      drawLandInfoBox(ctx, pos, p.latest.location, ICON_SIZE, EXPORT_SCALE);
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

// 未来两小时天气
const getMinutelySummary = async (lng, lat) => {
  const url = `https://api.qweather.com/v7/minutely/5m?location=${lng},${lat}&key=73ca4f214b9241fb98f6d291345d9d84`
  const data = await new Request(url).loadJSON();
  return data?.summary ?? null;
};

// 雷达拼图
const getRadarImageData = async (region) => {
  try {
    const radarDataUrl = 'https://img.istrongcloud.com/release/config-gzqx-radar.json';
    const config = await getCacheData('radarData.json', radarDataUrl, 'json', 24);
    const data = config?.[0]?.data?.[0]?.data ?? [];
    const radarUrl = data.find(i => i.name === `${region}雷达拼图`)?.url;
    if (!radarUrl) return null;
    const images = await new Request(radarUrl).loadJSON();
    const last = images?.at(-1);
    if (!last) return null;
    const m = last.name.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/);
    if (!m) return { url: last.url, name: last.name };
    const [, y, mo, d, h, min] = m;
    const title = `${region}${region === '全国' ? '' : '地区'}雷达拼图 ${y}-${mo}-${d} ${h}:${min}`;
    return {
      url: last.url,
      name: title
    }
  } catch (e) {
    console.log('获取雷达拼图错误' + e);
    return null;
  }
};

// 循环数组中的对象
const getNextItem = (arr, name) => {
  const optNextIndex = (num, data) => (num + 1) % data.length;
  setting[name] = optNextIndex(setting[name] || 0, arr);
  writeSettings(setting);
  return arr[setting[name]];
};

// 热带扰动
const currMergerTC = async () => {
  try {
    const url = `https://tf03.istrongcloud.com/data/enComplex2/currMergerTC.json?random=${Date.now()}`;
    const rawTC = await new Request(url).loadJSON();
    for (const item of rawTC) {
      const point = item.points?.at(-1);
      if (point) {
        Object.assign(item, point);
      }
    }
    const tcItem = await decryptData(rawTC) ?? [];
    const tc = getNextItem(tcItem, 'tdIndex');
    return { tcItem, tc };
  } catch (e) {
    console.log(e);
    return {};
  }
};

// 补充参考位置和未来趋势数据
const fetchGovData = async (tfbh) => {
  const fallback = { location: '---', trend: '官方数据更新中...' };
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

const getLocationTrend = async (tfbh, item) => {
  if (item?.location) {
    return {  location: item.location, trend: item.trend }
  };
  try {
    const loc = await new Request(`https://tf03.istrongcloud.com/data/completion/${tfbh}.json`).loadJSON();
    if (loc?.location) {
      return { location: loc.location, trend: loc.completion }
    }
  } catch {}
  return await fetchGovData(tfbh);
};

// 整理台风数据
const mergeLatestData = async (tyItem, latest = []) => {
  const latestMap = new Map(latest.map(item => [item.tfbh, item]));
  
  await Promise.all(tyItem.map(async tf => {
    const point = tf.points?.at(-1);
    const latestItem = latestMap.get(tf.tfbh);
    if (point) Object.assign(tf, point);
    if (latestItem) {
      const { strong, update_time, location, trend } = latestItem;
      const type = point.strong?.match(/\((.*?)\)/)?.[1];
      Object.assign(tf, { strong, type, update_time, location, trend });
      if (!location) {
        Object.assign(tf, await getLocationTrend(tf.tfbh, latestItem));
      }
    }
  }));
  return tyItem;
};

// 参考位置，未来趋势
const getLatestData = async () => {
  try {
    const [latest, config, message] = await Promise.all([
      new Request('https://data.istrongcloud.com/data/latest.json').loadJSON(),
      new Request('https://tf02.istrongcloud.com/data/moduleConfig/typhoonModuleConfig.json').loadJSON(),
      new Request('https://tf03.istrongcloud.com/data/message/message.json').loadJSON()
    ]);
    messageNotice(message?.[0]);
    typhoonNotice(config);
    return latest || [];
  } catch (e) {
    console.log(e);
    return [];
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
    const html = await new Request(`https://tf03.istrongcloud.com/member/v1.3/home?r=${Date.now()}`).loadString();
    const match = html.match(/typhoons_data = ([\s\S]*?)[;|<]/)?.[1]
    if (!match) return null;
    const tyItem = JSON.parse(match);
    if (!tyItem?.length) return null;
    const typhoons = await decryptData(tyItem) ?? [];
    const latest = await getLatestData();
    await mergeLatestData(typhoons, latest);
    const tf = getNextItem(typhoons, 'tfIndex');
    return { typhoons, tf };
  } catch (e) {
    console.log(e);
    return null;
  }
};

// 信息通知
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

const speedChangeNotice = (tf, dist) => {
  setting.tf = setting.tf || {};
  const id = tf.tfbh || tf.ident;
  if (!id) return;
  const oldData = setting.tf[id] || {};
  const oldSpeed = oldData.speed;
  const speed = tf.speed || 0;
  if (oldSpeed !== speed) {
    notify(
      `⚠️ 台风 【${tf.name}】`, 
      `风速 ${speed}米/秒，${tf.power || 0}级 (${tf.strong || "未知"})` + (tf.location ? `\n${tf.location}` : "") + `\n台风中心距离你的位置 ${dist || 0} 公里`
    );
    setting.tf[id] = {
      ...oldData,
      speed
    };
    writeSettings(setting);
  }
};

const currMergerTCNotice = (tc) => {
  setting.tc = setting.tc || {};
  const id = tc.tfbh || tc.ident;
  const oldSpeed = setting.tc[id];
  const tcLocation = getTyphoonLocation(tc);
  if (oldSpeed !== tc.speed) {
    notify(
      `⚠️ ${tc.name} ${tc.ename} - ${tc.strong}`,
      `风速 ${tc.speed || 0}米/秒，${tc.power || 0}级，${tc.pressure || 0}百帕\n${tcLocation || '数据更新中...'}`
    );
    setting.tc[id] = tc.speed;
    writeSettings(setting);
  }
};

// 格式化日期
const formatTime = time => time.replace('T', ' ').slice(0, 16);

const formatDate = (time, showMin) => {
  const date = new Date(time);
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = date.getMinutes();
  return `${date.getMonth() + 1}月${date.getDate()}日${hour}时` + (showMin && minute ? `${minute}分` : '');
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

const getTyphoonImage = async () => {
  const files = [
    'wxPosterAll.png',
    'posterMulti.png'
  ];
  const name = files[Math.floor(Math.random() * files.length)];
  const url = `https://upy.istrongcloud.com/applet/typhoon/screenshot/${name}?r=${Date.now()}`;
  return await getCacheData(name, url, null, 0.2);
};

// 设置背景
const setBackground = async (widget, typhoonType, typhoons, isLarge) => {
  const isDay = getIsDay();
  const theme = isDay === 1 ? 'light' : 'dark';
  widget.url = `https://tf02.istrongcloud.com/typhoonApp/index.html#/home?theme=${theme}`;
  if (isLarge) {
    widget.backgroundColor = new Color('#A3CCFF');
    if (typhoonType === 'tf') {
      widget.backgroundImage = await getTyphoonImage();
    } else {
      const feedbackJson = await getCacheData('travelRecommend.json', 'https://tf03.istrongcloud.com/data/travelRecommend/data.json', 'json', 1)
      const feedbackData = feedbackJson.data ?? [];
      const image = await generateMapImage(isDay, typhoonType, typhoons, feedbackData, setting);
      widget.backgroundImage = image;
    }
  } else {
    widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    widget.backgroundImage = await getCacheData('background.png', `https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png`);
  }
};

const generateItem = (isLarge, tf, land, maxSpeed, dist, hasNumber) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${tf.lng || 0}°　北纬${tf.lat || 0}°`, 
      color: '#00C400'
    },
    { 
      label: "风速风力", 
      value: `${tf.speed}米/秒，${tf.power}级 ( ${tf.strong} )`, 
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
          : `${tf.radius7 || 0}km-7级，${tf.radius10 || 0}km-10级，${tf.radius12 || 0}km-12级`,
      color: '#FFD83A'
    },
    { 
      label: "参考位置", 
      value: tf.location || '---',
      color: '#FF7800'
    },
    ...(!land && (isLarge || !hasNumber) ? [{
      label: "位置测距",
      value: `距离你的位置 ${dist} 公里`,
      color: '#F95BF9'
    }] : []),
    { 
      label: "未来趋势", 
      value: tf.trend || '---',
      color: '#8C7CFF'
    }
  ];
};

const generateTCItem = (tc, dist, tcLocation, begin_time, isLarge) => {
  return [
    { 
      label: "中心位置", 
      value: `东经${tc.lng}°　北纬${tc.lat}°`, 
      color: '#00C400'
    },
    { 
      label: "风速风力", 
      value: `${tc.speed}米/秒，${tc.power}级，${tc.strong}`, 
      color: '#39A7F8'
    },
    ...(!isLarge ? [{ 
      label: "中心气压", 
      value: `${tc.pressure} 百帕`, 
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
      textColor: '#FF4050',
    },
    { 
      label: '热带风暴 (TS)', 
      agency: '日本', 
      iconColor: '#39A7F8',
      textColor: '#43FF4B',
    },
    { 
      label: '强热带风暴 (STS)', 
      agency: '韩国', 
      iconColor: '#FFD83A',
      textColor: '#669999',
    },
    { 
      label: '台风 (TY)', 
      agency: '美国', 
      iconColor: '#FDAC03',
      textColor: '#40DDFF',
    },
    { 
      label: '强台风 (STY)', 
      agency: '欧洲', 
      iconColor: '#F95BF9',
      textColor: '#246ED4',
    },
    { 
      label: '超强台风 (SuperTY)', 
      agency: '香港', 
      iconColor: '#FF0000',
      textColor: '#FF66FF',
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
  if (tyIcon) {
    const icon = barStack.addImage(tyIcon);
    icon.imageSize = new Size(17, 17);
    icon.tintColor = Color.white();
    barStack.addSpacer(6);
  }
  const statusText = barStack.addText(name);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14.5);
  return barStack;
};

const createWidget = (typhoons, tf, maxSpeed, date, land, dist, info, barColor, textColor, isLarge) => {
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
  
  typhoons.forEach((ty, i) => {
    const icon = topStack.addImage(tyIcon);
    icon.imageSize = new Size(17, 17);
    icon.tintColor = getTyphoonColor(ty.speed);
    if (i < typhoons.length - 1) {
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
const createTCWidget = (tcItem, tc, date, info, tcLocation, textColor, isLarge) => {
  const widget = new ListWidget();
  widget.setPadding(15, 20, 15, 20);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.size = new Size(0, 23);
  createButtonStack(topStack, tyIcon, (tc.name + tc.ename), new Color('#8C7CFF'));
  topStack.addSpacer(8);
  const dateText = topStack.addText(date)
  dateText.font = Font.mediumSystemFont(14.5);
  dateText.textColor = textColor;
  topStack.addSpacer();
  
  tcItem.forEach((item, i) => {
    const icon = topStack.addImage(tcIcon);
    icon.imageSize = new Size(20, 20)
    if (i < tcItem.length - 1) {
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

// 雷达拼图组件
const createRadarWidget = async (param) => {
  const parameter = param.includes('华东') ? '华东' : param;
  const { url, name } = await getRadarImageData(parameter);
  const summary = await getMinutelySummary(setting.lon, setting.lat);

  const widget = new ListWidget();
  widget.setPadding(18, 20, 18, 20);
  const topStack = widget.addStack();
  topStack.layoutHorizontally();
  topStack.addSpacer();
  createButtonStack(topStack, '', name, new Color('#8C7CFF'));
  topStack.addSpacer();
  if (!summary.includes('无')) {
    widget.addSpacer(10);
    const weatherStack = widget.addStack();
    weatherStack.layoutHorizontally();
    weatherStack.addSpacer();
    createButtonStack(weatherStack, '', summary, new Color('#38ABFF'));
    weatherStack.addSpacer();
  }
  widget.addSpacer();

  const image = param.includes('华东')
    ? await new Request(url).load()
    : await new Request(url).loadImage();
    
  if (param.includes('华东')) {
    const rawImg = Image.fromData(image);
    const [imgTop, imgBottom] = await processImagePipeline(rawImg);
    widget.backgroundImage = param === '华东上' ? imgTop : imgBottom;
  } else {
    widget.backgroundImage = image;
  }

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
const createTyphoonData = async (typhoons, tf, textColor, isLarge) => {
  const barColor = getTyphoonColor(tf.speed);
  const date = formatDate(tf.update_time);
  const land = tf.land?.at(-1) ?? '';
  const dist = getDistance(setting.lat, setting.lon, tf.lat, tf.lng);
  const distance = tf.location?.match(/\d+/)?.[0] || 0;
  const hasNumber = /\d+/.test(tf.trend);
  const maxSpeed = getMaxForecast(tf);
  const info = generateItem(isLarge, tf, land, maxSpeed, dist, hasNumber);
  speedChangeNotice(tf, dist);
  return createWidget(typhoons, tf, maxSpeed, date, land, dist, info, barColor, textColor, isLarge);
};

const createTcData = (tcItem, tc, textColor, isLarge) => {
  const tcLocation = getTyphoonLocation(tc);
  const dist = getDistance(setting.lat, setting.lon, tc.lat, tc.lng);
  const date = formatDate(tc.time);
  const begin_time = formatTime(tc.begin_time);
  const info = generateTCItem(
    tc, dist, tcLocation, 
    begin_time, isLarge
  );
  return createTCWidget(
    tcItem, tc, date, info, 
    tcLocation, textColor, isLarge
  );
};

// 提取台风等级 SuperTY
const getTyphoonItem = data => data?.map(item => {
  const type = item.type;
  return {...item, icon: typhoonIcons[type] ? Image.fromData(Data.fromBase64String(typhoonIcons[type])) : null};
});

// 主函数
const runWidget = async () => {
  getLocation();
  const { typhoons, tf } = await getTyphoonData() || {};
  
  const regions = [
    '全国', '华南', '华东上', '华东下', 
    '西南', '华中', '华北', '东北', '西北'
  ];
  const param = args.widgetParameter;
  const hasRegion = regions.some(i => param?.includes(i));
  
  const family = config.runsInApp
    ? (tf ? 'large' : 'medium')
    : config.widgetFamily;
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
  } else if (hasRegion && isLarge) {
    widget = await createRadarWidget(param);
  } else if (tf && !isNumber) {
    widget = await createTyphoonData(typhoons, tf, textColor, isLarge);
    await setBackground(widget, 'tf', [], isLarge);
  } else if (!tf || isNumber) {
    const { tcItem, tc } = await currMergerTC();
    if (tcItem.length) {
      currMergerTCNotice(tc);
      const tyPoints = getTyphoonItem(typhoons || []);
      const tfItem = Number(param) === 2 ? tyPoints : [];
      widget = createTcData(tcItem, tc, tcTextColor, isLarge);
      await setBackground(widget, tcItem, tfItem, isLarge);
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
    Script.setWidget(widget);
    Script.complete();
  }
};

autoUpdate();
await runWidget();