// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: lightbulb;
/**
 * 组件作者: 95du茅台
 * 组件名称: 全球雨雪雷达
 * 组件版本: Version 1.0.3
 * 发布时间: 2026-10-17
 */


async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false;

  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);

  const pathName = '95du_radar';
  const module = new _95du(pathName);
  const setting = module.settings;
  const { rootUrl, mainPath, settingPath, cacheStr } = module;

  const ensureDir = path => (fm.fileExists(path) || fm.createDirectory(path, true), path);
  const [
    fillPath, bmPath, landPath,
    linePath, renderPath, radarPath, labelsPath
  ] = ['fill', 'bm', 'land', 'line', 'render', 'radar', 'labels'].map(k => ensureDir(fm.joinPath(mainPath, k)));

  const writeSettings = data => fm.writeString(settingPath, JSON.stringify(data, null, 2));

  const pad = n => String(n).padStart(2, '0');
  const hm = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  /* ============================ */
  // 1. 画布与分辨率
  /* ============================ */
  // 输出分辨率系数：桌面偏糊选 3，追求速度/内存小选 2
  const DPR = setting.dpr;
  const TARGET_WIDTH = Math.round(364 * DPR);
  const TARGET_HEIGHT = Math.round(382 * DPR);
  // UI/字号/图标/边距的相对缩放比例 (基准为 728×764)
  const K = DPR / 2;
  const CONCURRENCY = 8;

  /* ============================ */
  // 2. 地理坐标与缩放
  /* ============================ */
  const LAT = setting?.lat ?? 20.047;
  const LNG = setting?.lng ?? 110.192;
  const ZOOM = setting.zoom;
  const RZ = ZOOM + Math.log2(K);
  const WORLD_M = 20037508.342789244;

  /* ============================ */
  // 3. 底图样式与缓存
  /* ============================ */
  // 修改底图样式/调色时 +1 以清除旧渲染缓存
  const MAP_RENDER_VERSION = 8;
  const OCEAN_COLOR = '#1a3c5a';
  const LAND_COLOR = '#2f6e48';
  const LINE_COLOR = '#000000';
  const LINE_OPACITY = 0.18;
  // 整体压暗透明度
  const DIM_ALPHA = 0.08;

  const TILE_SIZE = 256;
  const MAP_TILE_BUDGET = 24;
  const ENABLE_RENDER_CACHE = true;
  const MAP_CACHE_SECONDS = 86400 * setting.mapCacheHours;
  const FILL_CACHE_HOURS = 24 * setting.mapCacheHours;
  const LINE_CACHE_HOURS = 24 * setting.mapCacheHours;
  const BM_CACHE_HOURS = 24 * 365;

  /* ============================ */
  // 4. 雷达图层与色板
  /* ============================ */
  const MAX_TILES = 64;
  const NATIVE_MAX_Z = 7;
  // 雷达元数据 TTL (秒)
  const RADAR_META_TTL = setting.radarCacheTTL;

  const RADAR_SCALE = 1.35;
  const RADAR_POWER = 5.5;
  const PALETTE_OFFSET = 0.00275;
  const ALPHA_EDGE = 0.00025;
  const PALETTE_Y_MODE = 0;
  const PALETTE_FLIP_Y = false;
  const RADAR_DBZ_MIN = -32;
  const RADAR_DBZ_SPAN = 127.5;

  /* ============================ */
  // 5. 城市与地名标签
  /* ============================ */
  const SHOW_LABELS = setting.showLabels;
  const LABELS_LANG = 'zh';
  const LABELS_VERSION = 'v12';
  const LABELS_CACHE_HOURS = 24 * setting.mapCacheHours;
  const MAX_LABELS = 400;
  const LABEL_FONT_SCALE = 1.15;
  // 视口外扩距离，避免边缘标签被切掉
  const LABEL_MARGIN = 120 * K;

  /* ============================ */
  // 6. 定位点与降水提示框
  /* ============================ */
  const LOC_COLOR = setting.locColor;
  const LOC_ICON_SIZE = setting.locIconSize;
  const SHOW_RAIN_TOOLTIP = setting.showPrecipInfo;
  const TOOLTIP_SCALE = 1.25;
  // 箭头尖端到中心点的像素距离 (按 K 缩放)
  const TOOLTIP_GAP = 18;

  /* ============================ */
  // 7. 雨雪特效
  /* ============================ */
  const SHOW_PRECIP_FX = setting.showPrecipFx;
  const PRECIP_FX_SCALE = 1;
  // 雨丝粗细和长度比 (越大越粗长)
  const RAIN_UNIT_SCALE = setting.rainUnitScale;
  // 雨丝列保留密度 (1.0 = 满密度, 0.6 = 稀疏)
  const RAIN_COLUMN_KEEP = setting.rainColumnKeep;
  const RAIN_ALPHA = setting.rainAlpha;
  // 按雨/雪量级自动调节特效强度
  const PRECIP_AUTO_TIER = setting.precipAutoTier;
  const RAIN_TIER_IDX = { '微雨': 0, '小雨': 1, '中雨': 2, '大雨': 3, '特大雨': 4, '特大雨 / 冰雹': 4 };
  const SNOW_TIER_IDX = { '小雪': 0, '中雪': 1, '大雪': 2 };
  const RAIN_TIERS = [[0.3, 1.0, 0.8], [0.5, 1.05, 0.9], [0.75, 1.15, 1.0], [1.0, 1.3, 1.2], [1.0, 1.5, 1.4]];
  const SNOW_TIERS = [[0.4, 1.3, 0.9], [0.7, 1.2, 1.0], [1.0, 1.1, 1.2]];

  const [typhoonIcons, satellite] = await Promise.all([
    module.getCacheData(`${rootUrl}/update/typhoon_icons.json`, 720, 'typhoon_icons.json'),
    module.getCacheData(`${rootUrl}/img/weather/satellite.png`, 720, 'satellite.png')
  ]);
  const PALETTE_B64 = typhoonIcons.palette;

  /* ============================ */
  // 定位与天气
  /* ============================ */
  // GPS 为 WGS-84，天气接口使用 GCJ-02
  const wgs84ToGcj02 = (lng, lat) => {
    const pi = Math.PI, a = 6378245.0, ee = 0.00669342162296594323;
    if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) {
      return { longitude: lng, latitude: lat };
    }

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
    return { longitude: lng + dLng, latitude: lat + dLat };
  };

  // 后台更新位置，下次运行生效
  const getLocation = async () => {
    if (setting?.lat && setting.updateTime) {
      const hours = (Date.now() - setting.updateTime) / 3600000;
      if (hours < setting.locCache) return setting;
    }
    try {
      const loc = await Location.current();
      setting.lng = loc.longitude;
      setting.lat = loc.latitude;
      const gcj = wgs84ToGcj02(loc.longitude, loc.latitude);
      setting.gcjLng = gcj.longitude;
      setting.gcjLat = gcj.latitude;
      setting.updateTime = Date.now();
      writeSettings(setting);
    } catch (e) {
      console.log('定位失败: ' + e);
    }
  };

  // 未来两小时降雨提示
  const getTwoHoursWeather = async () => {
    try {
      const params = {
        common: { platform: 'iPhone', language: 'CN' },
        params: { lat: setting.gcjLat, lon: setting.gcjLng }
      };
      const { radarData } = await getCacheData(
        'twoHoursWeather.json',
        'https://ssfc.api.moji.com/sfc/json/nowcast',
        'json', 0.5, cacheStr,
        'POST', params
      ) || {};
      if (!radarData) return;
      const { title, content } = radarData;
      if (setting?.rain === content || title === '不会下雨') return;
      module.notify(title, content, 'https://html5.moji.com/tpd/mojiweatheraggr/index.html#/home');
      setting.rain = content;
      writeSettings(setting);
    } catch (e) {
      console.log(`天气错误: ${e}`);
    }
  };

  // 天气与预警
  const getAlert = async () => {
    if (!setting?.gcjLng) return {};
    const cityInfo = await getCacheData(
      'cityInfo.json',
      'https://h5ctywhr.api.moji.com/weatherthird/getCityInfo',
      'json', 2, cacheStr,
      'POST', { lon: setting.gcjLng, lat: setting.gcjLat }
    );
    if (!cityInfo?.cityId) return {};
    const res = await getCacheData(
      `weather_${cityInfo.cityId}.json`,
      `https://co.moji.com/api/weather2/weather?lang=zh&city=${cityInfo.cityId}`,
      'json', 1, cacheStr
    );
    return res?.data || null;
  };

  const getAlertColor = level => {
    if (level === '红色') return Color.red();
    if (level === '橙色') return new Color('#FF7800');
    if (level === '黄色') return new Color('#EAC010');
    if (level === '蓝色') return Color.blue();
    return new Color('#000000', 0.4);
  };

  const getWeatherIcon = (key, isDay = 1) => {
    const iconMap = {
      '晴': isDay ? 100 : 150,
      '多云': isDay ? 101 : 151,
      '少云': isDay ? 102 : 152,
      '晴间多云': isDay ? 103 : 153,
      '阵雨': isDay ? 300 : 350,
      '强阵雨': isDay ? 301 : 351,
      '阴': 104, '雷阵雨': 302, '强雷阵雨': 303, '冰雹': 304, '小雨': 305, '中雨': 306, '大雨': 307,
      '极端降雨': 308, '细雨': 309, '毛毛雨': 309, '暴雨': 310, '大暴雨': 311, '特大暴雨': 312,
      '冻雨': 313, '小到中雨': 314, '中到大雨': 315, '大到暴雨': 316, '暴雨到大暴雨': 317,
      '大暴雨到特大暴雨': 318, '雨': 399,
      '小雪': 400, '中雪': 401, '大雪': 402, '暴雪': 403, '雨夹雪': 404, '雨雪天气': 405,
      '阵雨夹雪': isDay ? 406 : 456,
      '阵雪': isDay ? 407 : 457,
      '小到中雪': 408, '中到大雪': 409, '大到暴雪': 410, '雪': 499,
      '薄雾': 500, '雾': 501, '霾': 502, '扬沙': 503, '浮尘': 504, '沙尘暴': 507, '强沙尘暴': 508,
      '浓雾': 509, '强浓雾': 510, '中度霾': 511, '重度霾': 512, '严重霾': 513, '大雾': 514,
      '特强浓雾': 515, '热': 900, '冷': 901
    };
    const iconId = iconMap[key] ?? (isDay ? 101 : 151);
    return {
      id: String(iconId),
      url: `https://static.qweather.com/img/common/icon/202106d/${iconId}.png`
    };
  };

  // 色条渐变 (雨/小/中/大/雪)
  const stops = [
    [0.000, '#92C5F4'], [0.221, '#91C3F3'], [0.247, '#7AADF1'], [0.290, '#648FE7'],
    [0.329, '#5469D6'], [0.338, '#5561D0'], [0.352, '#6E5CC0'], [0.369, '#865DB4'],
    [0.381, '#925EAB'], [0.416, '#B96295'], [0.475, '#E46576'], [0.553, '#E89466'],
    [0.648, '#F4DA5B'], [0.682, '#F7EF5C'], [0.723, '#FAF961'], [0.7995, '#F9F762'],
    [0.8005, '#DCF8F9'], [0.833, '#C5F2F6'], [0.872, '#AFEAF4'], [0.948, '#7FC3D8'],
    [0.976, '#70B8D0'], [1.000, '#67B1CC']
  ];

  const createGradient = () => {
    const g = new LinearGradient();
    g.startPoint = new Point(0, 0.5);
    g.endPoint = new Point(1, 0.5);
    g.locations = stops.map(s => s[0]);
    g.colors = stops.map(s => new Color(s[1]));
    return g;
  };

  /* ============================ */
  // 文件与网络工具
  /* ============================ */
  /** 按类型（json / string / data / image）读写文件；写入前先删除，以刷新创建时间（缓存过期依据） */
  const useFileManager = (type, path = mainPath) => {
    const getPath = name => fm.joinPath(path, name);
    return {
      read: name => {
        const filePath = getPath(name);
        if (!fm.fileExists(filePath)) return null;
        try {
          if (type === 'json') return JSON.parse(fm.readString(filePath));
          if (type === 'string') return fm.readString(filePath);
          if (type === 'data') return fm.read(filePath);
          return fm.readImage(filePath);
        } catch (e) {
          return null;
        }
      },
      write: (name, content) => {
        const filePath = getPath(name);
        if (fm.fileExists(filePath)) fm.remove(filePath);
        if (type === 'json') fm.writeString(filePath, JSON.stringify(content));
        else if (type === 'string') fm.writeString(filePath, content);
        else if (type === 'data') fm.write(filePath, content);
        else fm.writeImage(filePath, content);
      }
    };
  };

  /**
   * 带缓存的请求。cacheTime 单位小时，0 = 永不过期
   * staleFallback = true：网络失败或非 2xx 时回退到过期缓存
   */
  const getCacheData = async (
    name,
    url,
    type,
    cacheTime = 0,
    path = mainPath,
    method = 'GET',
    body = null,
    staleFallback = false
  ) => {
    const cache = useFileManager(type, path);
    const filePath = fm.joinPath(path, name);
    const exists = fm.fileExists(filePath);
    const expired = cacheTime > 0 && (!exists || (Date.now() - fm.creationDate(filePath).getTime()) / 36e5 > cacheTime);
    const data = exists && !expired ? cache.read(name) : undefined;
    if (data !== undefined && data !== null) return data;
    const stale = staleFallback && exists ? cache.read(name) : undefined;

    try {
      const request = new Request(url);
      request.method = method;
      request.timeoutInterval = 20;
      request.headers = { 'User-Agent': 'Mozilla/5.0' };
      if (method === 'POST') {
        request.headers['Content-Type'] = 'application/json';
        request.body = JSON.stringify(body ?? {});
      }

      const response = type === 'json'
        ? await request.loadJSON()
        : type === 'string'
        ? await request.loadString()
        : type === 'data'
        ? await request.load()
        : await request.loadImage();

      const sc = request.response?.statusCode;
      if (staleFallback && sc && (sc < 200 || sc >= 300)) {
        throw new Error(`HTTP ${sc}`);
      }
      if (type === 'data' && sc && sc !== 200) {
        if (sc === 404) {
          const empty = Data.fromString('');
          cache.write(name, empty);
          return empty;
        }
        return null;
      }
      if (response != null) {
        cache.write(name, response);
        return response;
      }
    } catch (e) {
      console.log(`请求失败：${e}`);
    }

    return stale ?? null;
  };

  const writeFresh = (path, content) => {
    if (fm.fileExists(path)) fm.remove(path);
    if (typeof content === 'string') fm.writeString(path, content);
    else fm.write(path, content);
  };

  const toB64 = data => {
    try {
      return data.toBase64String();
    } catch (e) {
      return '';
    }
  };
  
  const base64ToImage = data => {
    try {
      return data ? Image.fromData(Data.fromBase64String(data)) : null;
    } catch {
      return null;
    }
  };
  
  const newCtx = (w, h) => {
    const ctx = new DrawContext();
    ctx.size = new Size(w, h);
    ctx.opaque = true;
    ctx.respectScreenScale = false;
    return ctx;
  };

  // 共享 WebView：地图 / 雷达 / 标签 / 提示框 / 雨雪共用
  let _wv = null;
  const getWV = async () => {
    if (!_wv) {
      _wv = new WebView();
      await _wv.loadHTML('<html><body></body></html>');
    }
    return _wv;
  };

  /** 在 WebView 里执行 fn(args)，fn 通过 completion(JSON 字符串) 返回；'ERR:' 开头视为失败 */
  const runWV = async (fn, args) => {
    const wv = await getWV();
    const res = await wv.evaluateJavaScript('void (' + fn.toString() + ')(' + JSON.stringify(args) + ');', true);
    if (typeof res !== 'string') throw new Error('WebView 返回类型错误');
    if (res.startsWith('ERR:')) throw new Error(res.slice(4));
    return JSON.parse(res);
  };

  /** 并发池 */
  const mapPool = async (items, limit, fn) => {
    const out = new Array(items.length);
    let i = 0;
    const worker = async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx], idx);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(limit, Math.max(1, items.length)) }, worker)
    );
    return out;
  };

  /* ============================ */
  // 地图底图
  /* ============================ */
  const month = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][new Date().getUTCMonth()];

  /** 经纬度 → z 级别（可为小数）的世界像素坐标 */
  const worldPx = (lat, lng, z) => {
    const n = 2 ** z * TILE_SIZE;
    const rad = (lat * Math.PI) / 180;
    return {
      x: ((lng + 180) / 360) * n,
      y: ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n
    };
  };

  const getTileUrls = (z, x, y) => ({
    fill: `https://tiles.zoom.earth/static/fill/v1/1x/webp/${z}/${y}/${x}.webp`,
    line: `https://tiles.zoom.earth/static/line/v1/1x/webp/${z}/${y}/${x}.webp`,
    land: `https://tiles.zoom.earth/static/land/v1/1x/webp/${z}/${y}/${x}.webp`
  });

  const getRenderName = (z, x, y) =>
    `${month}_${z}_${x}_${y}_lo${Math.round(LINE_OPACITY * 100)}_v${MAP_RENDER_VERSION}.png`;

  /** 构建地图视口：从 ceil(RZ) 起逐级降低瓦片级别，直到瓦片数 ≤ MAP_TILE_BUDGET */
  const buildViewport = () => {
    const c = worldPx(LAT, LNG, RZ);
    const renderCache = useFileManager('image', renderPath);

    for (let tileZ = Math.min(12, Math.ceil(RZ)); tileZ >= 0; tileZ--) {
      const zoomScale = 2 ** (RZ - tileZ);
      const cropWidth = TARGET_WIDTH / zoomScale;
      const cropHeight = TARGET_HEIGHT / zoomScale;
      const cropLeft = c.x * 2 ** (tileZ - RZ) - cropWidth / 2;
      const cropTop = c.y * 2 ** (tileZ - RZ) - cropHeight / 2;
      const minTileX = Math.floor(cropLeft / TILE_SIZE);
      const maxTileX = Math.floor((cropLeft + cropWidth - 1e-6) / TILE_SIZE);
      const minTileY = Math.floor(cropTop / TILE_SIZE);
      const maxTileY = Math.floor((cropTop + cropHeight - 1e-6) / TILE_SIZE);
      const count = (maxTileX - minTileX + 1) * (maxTileY - minTileY + 1);
      if (count > MAP_TILE_BUDGET && tileZ > 0) continue;

      const n = 2 ** tileZ;
      const tiles = [];
      for (let y = minTileY; y <= maxTileY; y++) {
        if (y < 0 || y >= n) continue;
        for (let x = minTileX; x <= maxTileX; x++) {
          const cx = ((x % n) + n) % n;
          let image = null;
          if (ENABLE_RENDER_CACHE) {
            const name = getRenderName(tileZ, cx, y);
            const p = fm.joinPath(renderPath, name);
            if (fm.fileExists(p) && (Date.now() - fm.creationDate(p).getTime()) / 1000 <= MAP_CACHE_SECONDS) {
              image = renderCache.read(name);
            }
          }
          tiles.push({ key: `${tileZ}/${cx}/${y}`, x, y, cacheX: cx, tileZ, image });
        }
      }
      return {
        tileZ, zoomScale, tiles, minTileX, minTileY,
        cropLeft, cropTop, cropWidth, cropHeight,
        sourceWidth: (maxTileX - minTileX + 1) * TILE_SIZE,
        sourceHeight: (maxTileY - minTileY + 1) * TILE_SIZE
      };
    }
  };

  // Blue Marble：同名文件并发时只请求一次；记住最深存在的级别，避免反复探测
  const bmInflight = new Map();
  const loadBM = async (tileZ, x, y) => {
    const top = Math.min(tileZ, setting.bmMaxZ ?? tileZ);
    for (let z = top; z >= 0 && tileZ - z <= 8; z--) {
      const dz = tileZ - z;
      const name = `${month}_${z}_${x >> dz}_${y >> dz}.jpg`;
      if (!bmInflight.has(name)) {
        bmInflight.set(name, getCacheData(
          name,
          `https://tiles.zoom.earth/static/bluemarble/${month}/${z}/${y >> dz}/${x >> dz}.jpg`,
          'data',
          BM_CACHE_HOURS,
          bmPath
        ));
      }
      const d = await bmInflight.get(name);
      if (!d) continue;
      const len = toB64(d).length;
      if (len > 1000) return { data: d, dz };
      if (len === 0 && z > 0) setting.bmMaxZ = z - 1;
    }
    return null;
  };

  /** 并行加载单个瓦片的 fill / BM / line / land（null = 网络失败，空 Data = 404） */
  const loadTileAssets = async (tile) => {
    const { tileZ: z, cacheX: x, y } = tile;
    const name = `${z}_${x}_${y}.webp`;
    const urls = getTileUrls(z, x, y);
    const [fill, bmObj, line, land] = await Promise.all([
      getCacheData(name, urls.fill, 'data', FILL_CACHE_HOURS, fillPath),
      loadBM(z, x, y),
      getCacheData(name, urls.line, 'data', LINE_CACHE_HOURS, linePath),
      getCacheData(name, urls.land, 'data', FILL_CACHE_HOURS, landPath)
    ]);
    Object.assign(tile, { fill, bm: bmObj ? bmObj.data : null, bmDz: bmObj ? bmObj.dz : 0, line, land });
  };

  const prepareTiles = list =>
    mapPool(list, CONCURRENCY, async tile => {
      try { await loadTileAssets(tile); } catch (e) {}
    });

  /** WebView：把一批原始瓦片合成为 256 级 PNG（填色 → BM → 压暗 → 陆地 → 线） */
  const wvTiles = async A => {
    const loadImage = (data, type) => new Promise(res => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = 'data:image/' + type + ';base64,' + data;
    });
    try {
      const cfg = A.cfg;
      const out = [];
      for (const t of A.tiles) {
        const bm = t.b && t.b.length > 1000 ? await loadImage(t.b, 'jpeg') : null;
        const fill = t.f && t.f.length > 0 ? await loadImage(t.f, 'webp') : null;
        const land = t.d && t.d.length > 80 ? await loadImage(t.d, 'webp') : null;
        const line = t.l && t.l.length > 80 ? await loadImage(t.l, 'webp') : null;

        const w = bm ? (bm.naturalWidth || 256) : fill ? (fill.naturalWidth || 256) : 256;
        const h = bm ? (bm.naturalHeight || 256) : fill ? (fill.naturalHeight || 256) : 256;
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        const ctx = cv.getContext('2d');

        if (fill) {
          ctx.drawImage(fill, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-in';
          ctx.fillStyle = cfg.land;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = cfg.ocean;
          ctx.fillRect(0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        } else {
          ctx.fillStyle = cfg.ocean;
          ctx.fillRect(0, 0, w, h);
        }

        if (bm) {
          const s = Math.pow(2, t.bz || 0);
          const sw = bm.naturalWidth / s;
          const sh = bm.naturalHeight / s;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.globalCompositeOperation = 'screen';
          ctx.drawImage(bm, (t.bx % s) * sw, (t.by % s) * sh, sw, sh, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
        if (cfg.dim > 0) {
          ctx.fillStyle = 'rgba(0,0,0,' + cfg.dim + ')';
          ctx.fillRect(0, 0, w, h);
        }
        if (land) {
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(land, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
        }
        if (line) {
          const lc = document.createElement('canvas');
          lc.width = w;
          lc.height = h;
          const lctx = lc.getContext('2d');
          lctx.drawImage(line, 0, 0, w, h);
          lctx.globalCompositeOperation = 'source-in';
          lctx.globalAlpha = cfg.lineOpacity;
          lctx.fillStyle = cfg.lineColor;
          lctx.fillRect(0, 0, w, h);
          ctx.drawImage(lc, 0, 0);
        }
        out.push({ k: t.k, d: cv.toDataURL('image/png').split(',')[1] });
      }
      completion(JSON.stringify(out));
    } catch (e) {
      completion('ERR:' + (e && e.message ? e.message : String(e)));
    }
  };

  const renderTiles = async list => {
    const res = await runWV(wvTiles, {
      cfg: { ocean: OCEAN_COLOR, land: LAND_COLOR, lineColor: LINE_COLOR, lineOpacity: LINE_OPACITY, dim: DIM_ALPHA },
      tiles: list.map(t => ({
        k: t.key, f: toB64(t.fill), b: toB64(t.bm), bz: t.bmDz || 0,
        bx: t.cacheX, by: t.y, d: toB64(t.land), l: toB64(t.line)
      }))
    });
    return new Map(res.map(x => [x.k, x.d]));
  };

  /** 底图：缓存瓦片 + 新渲染瓦片 → 拼接 → 裁剪缩放到输出尺寸 */
  const renderBaseMap = async (vp, missing) => {
    const mapCtx = newCtx(vp.sourceWidth, vp.sourceHeight);
    mapCtx.setFillColor(new Color(OCEAN_COLOR));
    mapCtx.fillRect(new Rect(0, 0, vp.sourceWidth, vp.sourceHeight));
    const drawTile = (t, img) => mapCtx.drawImageInRect(
      img,
      new Rect((t.x - vp.minTileX) * TILE_SIZE, (t.y - vp.minTileY) * TILE_SIZE, TILE_SIZE, TILE_SIZE)
    );
    vp.tiles.filter(t => t.image).forEach(t => drawTile(t, t.image));

    if (missing.length) {
      const rendered = await renderTiles(missing);
      const renderCache = useFileManager('image', renderPath);
      for (const t of missing) {
        try {
          const data = rendered.get(t.key);
          if (!data) continue;
          const img = base64ToImage(data);
          drawTile(t, img);
          // 原始资源下载失败（null）时不缓存，避免缓存残缺瓦片
          if (ENABLE_RENDER_CACHE && t.fill && t.land) {
            renderCache.write(
              getRenderName(t.tileZ, t.cacheX, t.y), img
            );
          }
        } catch (e) {
          console.log('地图瓦片渲染失败 ' + t.key + ' ' + (e.message || e));
        }
      }
    }

    const finalCtx = newCtx(TARGET_WIDTH, TARGET_HEIGHT);
    const scaleX = TARGET_WIDTH / vp.cropWidth;
    const scaleY = TARGET_HEIGHT / vp.cropHeight;
    finalCtx.drawImageInRect(
      mapCtx.getImage(),
      new Rect(
        -(vp.cropLeft - vp.minTileX * TILE_SIZE) * scaleX,
        -(vp.cropTop - vp.minTileY * TILE_SIZE) * scaleY,
        vp.sourceWidth * scaleX,
        vp.sourceHeight * scaleY
      )
    );
    return finalCtx.getImage();
  };

  /* ============================ */
  // 雷达
  /* ============================ */
  /** 最新雷达元数据。缓存过期且网络失败时回退到上一次成功的缓存 */
  const getLatestRadar = async () => {
    const radarCacheTime = Math.max(Number(RADAR_META_TTL) || 0, 1) / 3600;
    const cached = await getCacheData(
      '_radar_meta.json', 'https://tiles.zoom.earth/times/radar.json',
      'json', radarCacheTime, radarPath, 'GET', null, true
    );
    const reflectivity = cached?.reflectivity;
    if (!reflectivity) throw new Error('radar.json 数据尚未同步或缓存为空');

    const nowSec = Math.floor(Date.now() / 1000);
    const allTs = Object.keys(reflectivity).map(Number).sort((a, b) => a - b);
    const past = allTs.filter(t => t <= nowSec);
    const ts = past.length ? past[past.length - 1] : allTs[0];
    const hash = reflectivity[String(ts)];
    if (!Number.isFinite(ts) || !hash) throw new Error('radar.json 无有效时间或 hash');

    const isForecast = ts > nowSec;
    const nowKey = hm(new Date());

    const frames = allTs.slice(-22).map(t => {
      const d = new Date(t * 1000);
      const time = hm(d);
      return {
        isMajor: d.getMinutes() === 0,
        isSelected: t === ts,
        isNow: !isForecast && time === nowKey
      };
    });

    const sel = frames.find(f => f.isSelected);
    const u = new Date(ts * 1000);
    return {
      hash,
      ar: `${u.getUTCFullYear()}-${pad(u.getUTCMonth() + 1)}-${pad(u.getUTCDate())}/${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}`,
      frames,
      timeType: isForecast ? 'forecast' : sel?.isNow ? 'now' : 'today',
      localTimeStr: hm(u)
    };
  };

  const radarTileURL = (info, z, x, y) => `https://tiles.zoom.earth/radar/reflectivity/${info.ar}/${info.hash}/${z}/${y}/${x}.webp`;
  const radarCacheName = (hash, z, x, y) => `${hash}_${z}_${x}_${y}.webp`;

  /** 清理过期雷达瓦片，只保留当前 hash */
  const cleanOldRadarCache = hash => {
    try {
      for (const name of fm.listContents(radarPath)) {
        if (name !== '_radar_meta.json' && (name.endsWith('.png') || name.endsWith('.webp')) && !name.startsWith(hash + '_')) {
          try { fm.remove(fm.joinPath(radarPath, name)); } catch (e) {}
        }
      }
    } catch (e) {}
  };

  /** 雷达在原生级别下的视口（与地图中心对齐，支持亚像素裁剪） */
  const computeViewportAtNative = nativeZ => {
    const c = worldPx(LAT, LNG, RZ);
    const k = 2 ** (nativeZ - RZ);
    const nLeft = (c.x - TARGET_WIDTH / 2) * k;
    const nTop = (c.y - TARGET_HEIGHT / 2) * k;
    const nRight = (c.x + TARGET_WIDTH / 2) * k;
    const nBottom = (c.y + TARGET_HEIGHT / 2) * k;
    const n = 2 ** nativeZ;
    const tileMinX = Math.floor(nLeft / TILE_SIZE);
    const tileMinY = Math.floor(nTop / TILE_SIZE);
    const tileMaxX = Math.floor((nRight - 1e-9) / TILE_SIZE);
    const tileMaxY = Math.floor((nBottom - 1e-9) / TILE_SIZE);

    const tiles = [];
    for (let y = tileMinY; y <= tileMaxY; y++) {
      for (let x = tileMinX; x <= tileMaxX; x++) {
        if (x >= 0 && x < n && y >= 0 && y < n) tiles.push({ x, y });
      }
    }
    return {
      nativeZ, tiles, tileMinX, tileMinY,
      mosaicW: (tileMaxX - tileMinX + 1) * TILE_SIZE,
      mosaicH: (tileMaxY - tileMinY + 1) * TILE_SIZE,
      cropX: nLeft - tileMinX * TILE_SIZE,
      cropY: nTop - tileMinY * TILE_SIZE,
      cropW: nRight - nLeft,
      cropH: nBottom - nTop
    };
  };

  /**
   * WebView 内高清雷达渲染：拼接原始瓦片 → 浮点双线性插值到输出分辨率 → 查色板着色
   * 此函数逻辑已完美，请勿修改
   */
  const wvRender = async A => {
    const loadImg = src => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('image load failed'));
      img.src = src;
    });
    const smoothstep = (e0, e1, x) => {
      const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
      return t * t * (3 - 2 * t);
    };
    const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  
    try {
      // 色板
      if (!window.__ZE_PALETTE) {
        const palImg = await loadImg('data:image/png;base64,' + A.pal);
        const pcv = document.createElement('canvas');
        pcv.width = 512; pcv.height = 2;
        const pctx = pcv.getContext('2d');
        pctx.drawImage(palImg, 0, 0);
        window.__ZE_PALETTE = pctx.getImageData(0, 0, 512, 2).data;
      }
      const pal = window.__ZE_PALETTE;
  
      // 原始瓦片拼图（原生分辨率）
      const W = A.mw, H = A.mh;
      const mc = document.createElement('canvas');
      mc.width = W; mc.height = H;
      const mx = mc.getContext('2d');
      mx.clearRect(0, 0, W, H);
      for (const t of A.tiles) {
        try {
          const img = await loadImg('data:image/webp;base64,' + t.b64);
          mx.drawImage(img, t.px, t.py, A.ts, A.ts);
        } catch (e) {}
      }
      const md = mx.getImageData(0, 0, W, H).data;
  
      // 输出
      const OW = A.ow, OH = A.oh;
      const oc = document.createElement('canvas');
      oc.width = OW; oc.height = OH;
      const ox = oc.getContext('2d');
      const out = ox.createImageData(OW, OH);
      const o = out.data;
      const stepX = A.cw / OW, stepY = A.ch / OH;
  
      for (let y = 0; y < OH; y++) {
        const fy = A.cy + (y + 0.5) * stepY - 0.5;
        const fy0 = Math.floor(fy);
        const ty = fy - fy0;
        const y0 = clamp(fy0, 0, H - 1), y1 = clamp(fy0 + 1, 0, H - 1);
  
        for (let x = 0; x < OW; x++) {
          const fx = A.cx + (x + 0.5) * stepX - 0.5;
          const fx0 = Math.floor(fx);
          const tx = fx - fx0;
          const x0 = clamp(fx0, 0, W - 1), x1 = clamp(fx0 + 1, 0, W - 1);
  
          const i00 = (y0 * W + x0) * 4, i10 = (y0 * W + x1) * 4;
          const i01 = (y1 * W + x0) * 4, i11 = (y1 * W + x1) * 4;
          const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty);
          const w01 = (1 - tx) * ty,       w11 = tx * ty;
  
          const r = (md[i00] * w00 + md[i10] * w10 + md[i01] * w01 + md[i11] * w11) / 255;
          const g = (md[i00 + 1] * w00 + md[i10 + 1] * w10 + md[i01 + 1] * w01 + md[i11 + 1] * w11) / 255;
          const b = (md[i00 + 2] * w00 + md[i10 + 2] * w10 + md[i01 + 2] * w01 + md[i11 + 2] * w11) / 255;
          if (r + g + b < 0.02) continue;
  
          const j = Math.max(g, b);
          const k0 = Math.pow(j * A.rs, A.rp);
          const kx = Math.max(0, Math.min(0.999, k0 + A.off));
          const xi = Math.min(511, Math.floor(kx * 512));
  
          let row;
          if (A.ymode === 0) {
            row = 0;
          } else {
            let v = Math.max(0, Math.min(1, 0.5 + (g - b) * 8));
            if (A.flip) v = 1 - v;
            row = Math.max(0, Math.min(1, v * 2 - 0.5));
          }
          const r0 = Math.floor(row);
          const r1 = Math.min(1, r0 + 1)
          const t = row - r0;
          const p0 = (r0 * 512 + xi) * 4
          const p1 = (r1 * 512 + xi) * 4
          const oi = (y * OW + x) * 4;
          o[oi]     = pal[p0]     * (1 - t) + pal[p1]     * t;
          o[oi + 1] = pal[p0 + 1] * (1 - t) + pal[p1 + 1] * t;
          o[oi + 2] = pal[p0 + 2] * (1 - t) + pal[p1 + 2] * t;
          const f = smoothstep(0, A.edge, k0);
          o[oi + 3] = Math.round(255 * f * f);
        }
      }
  
      // ---- 探针：在输出画面指定点按同样的双线性采样取雷达值（用于降水提示框）----
      let probe = null;
      if (A.probe) {
        const pfx = A.cx + (A.probe.x + 0.5) * stepX - 0.5;
        const pfy = A.cy + (A.probe.y + 0.5) * stepY - 0.5;
        const px0 = Math.floor(pfx), py0 = Math.floor(pfy);
        const ptx = pfx - px0, pty = pfy - py0;
        const qx0 = clamp(px0, 0, W - 1), qx1 = clamp(px0 + 1, 0, W - 1);
        const qy0 = clamp(py0, 0, H - 1), qy1 = clamp(py0 + 1, 0, H - 1);
        const a00 = (qy0 * W + qx0) * 4, a10 = (qy0 * W + qx1) * 4;
        const a01 = (qy1 * W + qx0) * 4, a11 = (qy1 * W + qx1) * 4;
        const v00 = (1 - ptx) * (1 - pty), v10 = ptx * (1 - pty);
        const v01 = (1 - ptx) * pty,       v11 = ptx * pty;
        const ch = c => (md[a00 + c] * v00 + md[a10 + c] * v10 + md[a01 + c] * v01 + md[a11 + c] * v11) / 255;
        const pr = ch(0), pg = ch(1), pb = ch(2);
        const pj = (pr + pg + pb < 0.02) ? 0 : Math.max(pg, pb);
        const pk0 = Math.pow(pj * A.rs, A.rp);
        probe = { r: pr, g: pg, b: pb, j: pj, k0: pk0, kx: Math.max(0, Math.min(0.999, pk0 + A.off)) };
      }
  
      ox.putImageData(out, 0, 0);
      completion(JSON.stringify({ p: oc.toDataURL('image/png').split(',')[1], probe: probe }));
    } catch (e) {
      completion('ERR:' + (e?.message || String(e)));
    }
  };

  /** 取雷达瓦片（纯网络，不碰 WebView） */
  const fetchRadar = async info => {
    if (!info) throw new Error('雷达元数据为空');
    const nativeZ = Math.min(NATIVE_MAX_Z, Math.max(0, Math.floor(RZ)));
    const vp = computeViewportAtNative(nativeZ);
    if (!vp.tiles.length) throw new Error('视口瓦片计算为空');
    if (vp.tiles.length > MAX_TILES) throw new Error('需要瓦片过多 (' + vp.tiles.length + ')');

    const loaded = await Promise.all(vp.tiles.map(async (tile) => {
      const d = await getCacheData(
        radarCacheName(info.hash, nativeZ, tile.x, tile.y),
        radarTileURL(info, nativeZ, tile.x, tile.y),
        'data',
        0, // 不设过期，由 cleanOldRadarCache 管理
        radarPath
      );
      const b64 = d ? toB64(d) : '';
      return b64.length > 80
        ? { px: (tile.x - vp.tileMinX) * TILE_SIZE, py: (tile.y - vp.tileMinY) * TILE_SIZE, b64 }
        : null;
    }));
    return { info, vp, tiles: loaded.filter(Boolean) };
  };

  const renderRadar = async ({ info, vp, tiles }) => {
    const out = await runWV(wvRender, {
      pal: PALETTE_B64, tiles, ts: TILE_SIZE,
      mw: vp.mosaicW, mh: vp.mosaicH,
      cx: vp.cropX, cy: vp.cropY, cw: vp.cropW, ch: vp.cropH,
      ow: TARGET_WIDTH, oh: TARGET_HEIGHT,
      rs: RADAR_SCALE, rp: RADAR_POWER, off: PALETTE_OFFSET, edge: ALPHA_EDGE,
      ymode: PALETTE_Y_MODE, flip: PALETTE_FLIP_Y,
      probe: { x: TARGET_WIDTH / 2, y: TARGET_HEIGHT / 2 }
    });
    cleanOldRadarCache(info.hash);
    return { 
      image: base64ToImage(out.p), 
      probe: out.probe 
    };
  };

  /* ============================ */
  // 地图标签
  // 仅在「位置/缩放/样式」变化时在 WebView 绘制一次，存成透明 PNG 覆盖层，之后直接读图
  /* ============================ */
  const getLabelView = () => {
    const c = worldPx(LAT, LNG, RZ);
    return { worldSize: TILE_SIZE * 2 ** RZ, left: c.x - TARGET_WIDTH / 2, top: c.y - TARGET_HEIGHT / 2 };
  };

  const labelTilesAt = (Lz, V) => {
    const n = 2 ** Lz;
    const x0 = Math.floor((V.left - LABEL_MARGIN) / V.worldSize * n);
    const x1 = Math.floor((V.left + TARGET_WIDTH + LABEL_MARGIN) / V.worldSize * n - 1e-9);
    const y0 = Math.max(0, Math.floor((V.top - LABEL_MARGIN) / V.worldSize * n));
    const y1 = Math.min(n - 1, Math.floor((V.top + TARGET_HEIGHT + LABEL_MARGIN) / V.worldSize * n - 1e-9));
    const seen = new Set();
    const out = [];
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const cx = ((x % n) + n) % n;
        const k = cx + '/' + y;
        if (!seen.has(k)) {
          seen.add(k);
          out.push({ x: cx, y });
        }
      }
    }
    return out;
  };

  // 标签自带 z 数组：用逻辑 ZOOM 判断当前缩放是否应显示
  const labelZOK = z =>
    !Array.isArray(z) || !z.length || (ZOOM >= Math.min(...z) && ZOOM < Math.max(...z) + 1);

  /** 读取一个标签瓦片。数组 = 有数据；null = 瓦片不存在；undefined = 网络错误 */
  const getLabelTile = async (z, x, y) => {
    const path = fm.joinPath(labelsPath, `${LABELS_LANG}_${LABELS_VERSION}_${z}_${x}_${y}.json`);
    if (fm.fileExists(path)) {
      const ageH = (Date.now() - fm.creationDate(path).getTime()) / 36e5;
      if (ageH <= LABELS_CACHE_HOURS) {
        try {
          const s = fm.readString(path);
          if (s === '') return null;
          const j = JSON.parse(s);
          if (Array.isArray(j)) return j;
        } catch (e) {}
      }
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const req = new Request(`https://tiles.zoom.earth/static/labels/${LABELS_VERSION}/${LABELS_LANG}/${z}/${y}/${x}.json`);
        req.timeoutInterval = 20;
        req.headers = { 'User-Agent': 'Mozilla/5.0', Referer: 'https://zoom.earth/' };
        const s = await req.loadString();
        const sc = req.response?.statusCode;
        if (sc === 404 || sc === 204) { writeFresh(path, ''); return null; }
        if (sc === 403 || sc === 410) return null; // 该级别不存在（不缓存）
        if (sc && sc !== 200) continue;
        if (!String(s).trim()) { writeFresh(path, '[]'); return []; }
        const j = JSON.parse(s);
        if (Array.isArray(j)) { writeFresh(path, s); return j; }
      } catch (e) {}
    }
    console.log(`标签瓦片请求失败 ${z}/${y}/${x}`);
    return undefined;
  };

  /**
   * 收集可见标签（屏幕坐标，纯网络）
   * 瓦片级别依次尝试：ceil(ZOOM) → +1 → 逐级向下，取第一个有可显示内容的级别
   */
  const collectLabels = async () => {
    const V = getLabelView();
    const Zi = Math.min(12, Math.ceil(ZOOM));
    const levels = [Zi, ...(Zi < 12 ? [Zi + 1] : []), ...Array.from({ length: Zi }, (_, i) => Zi - 1 - i)];

    for (const Lz of levels) {
      const tiles = labelTilesAt(Lz, V);
      if (!tiles.length) continue;
      // 先探测最靠近中心的一块：不存在则换级别
      const n = 2 ** Lz;
      const cxT = V.left + TARGET_WIDTH / 2, cyT = V.top + TARGET_HEIGHT / 2;
      const dist = t => Math.hypot((t.x + 0.5) / n * V.worldSize - cxT, (t.y + 0.5) / n * V.worldSize - cyT);
      const mid = tiles.slice().sort((a, b) => dist(a) - dist(b))[0];
      const first = await getLabelTile(Lz, mid.x, mid.y);
      if (first === undefined) return [];
      if (first === null) continue;

      const rest = await mapPool(tiles.filter(t => t !== mid), CONCURRENCY, t => getLabelTile(Lz, t.x, t.y));
      const raw = [first, ...rest.filter(Array.isArray)].flat();
      const items = raw.filter(it =>
        it && it.text && Number.isFinite(it.x) && Number.isFinite(it.y) && labelZOK(it.z)
      );
      if (!items.length) continue;

      const seen = new Set();
      const out = [];
      for (const it of items) {
        const key = it.text + '|' + Math.round(it.x) + '|' + Math.round(it.y);
        if (seen.has(key)) continue;
        seen.add(key);
        const x = (it.x + WORLD_M) / (2 * WORLD_M) * V.worldSize - V.left;
        const y = (WORLD_M - it.y) / (2 * WORLD_M) * V.worldSize - V.top;
        if (x < -LABEL_MARGIN || x > TARGET_WIDTH + LABEL_MARGIN ||
            y < -LABEL_MARGIN || y > TARGET_HEIGHT + LABEL_MARGIN) continue;
        const st = String(it.style || '');
        const dot = !!(it.place || it.anchor);
        out.push({ t: it.text, x, y, k: dot ? 'p' : st[0] === 'a' ? 'a' : st[0] === 'c' ? 'c' : 'r' });
      }
      // 城市点优先参与碰撞检测
      const ordered = [...out.filter(o => o.k === 'p'), ...out.filter(o => o.k !== 'p')];
      ordered.complete = !rest.some(r => r === undefined);
      return ordered;
    }
    return [];
  };

  /** WebView 内排版并绘制标签：测量文字 → 贪心碰撞检测 → 描边+填充 → 透明 PNG */
  const wvLabels = A => {
    try {
      const FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", sans-serif';
      const fs = A.fs;
      const cv = document.createElement('canvas');
      cv.width = A.ow;
      cv.height = A.oh;
      const ctx = cv.getContext('2d');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.lineJoin = 'round';
  
      const placed = [];
      const hit = r => placed.some(q => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
  
      let drawn = 0;
      for (const it of A.items) {
        if (drawn >= A.max) break;
        const kind = it.k;
        const size = (kind === 'a' ? 22 : kind === 'p' ? 18 : kind === 'c' ? 18 : 17) * fs;
        ctx.font = (kind === 'c' ? 'italic 600 ' : '600 ') + size + 'px ' + FONT;
        const w = ctx.measureText(it.t).width;
        const pad = 4 * fs;
  
        let by;
        const rects = [];
        if (kind === 'p') {
          by = it.y - 9 * fs;                       // 文字在圆点上方（anchor = b）
          rects.push({ x: it.x - 6 * fs, y: it.y - 6 * fs, w: 12 * fs, h: 12 * fs });
        } else {
          by = it.y + size * 0.35;                  // 区域名居中于坐标点
        }
        rects.push({ x: it.x - w / 2 - pad, y: by - size * 0.95 - pad, w: w + pad * 2, h: size * 1.25 + pad * 2 });
  
        const t = rects[rects.length - 1];
        if (t.x + t.w < 0 || t.x > A.ow || t.y + t.h < 0 || t.y > A.oh) continue;
        if (rects.some(hit)) continue;
        rects.forEach(r => placed.push(r));
  
        if (kind === 'p') {
          ctx.beginPath();
          ctx.arc(it.x, it.y, 3.6 * fs, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = 'rgba(16,24,34,0.75)';
          ctx.lineWidth = 1.8 * fs;
          ctx.stroke();
          ctx.fill();
        }
  
        ctx.lineWidth = 3.6 * fs;
        ctx.strokeStyle = 'rgba(8,16,28,0.55)';
        ctx.fillStyle =
          kind === 'p' ? '#ffffff' :
          kind === 'c' ? 'rgba(176,210,240,0.9)' :
          kind === 'a' ? 'rgba(255,255,255,0.62)' :
          'rgba(255,255,255,0.74)';
        ctx.strokeText(it.t, it.x, by);
        ctx.fillText(it.t, it.x, by);
        drawn++;
      }
  
      completion(JSON.stringify({ p: cv.toDataURL('image/png').split(',')[1], n: drawn }));
    } catch (e) {
      completion('ERR:' + (e && e.message ? e.message : String(e)));
    }
  };

  const overlayPath = () => fm.joinPath(
    labelsPath,
    ['lbl', LABELS_LANG, LAT, LNG, ZOOM, TARGET_WIDTH, TARGET_HEIGHT, LABEL_FONT_SCALE]
      .join('_').replace(/\./g, 'p') + '.png'
  );

  /** 读缓存的标签覆盖层（没有或过期返回 null） */
  const readOverlay = () => {
    const path = overlayPath();
    if (!fm.fileExists(path)) return null;
    const ageH = (Date.now() - fm.creationDate(path).getTime()) / 36e5;
    return ageH <= LABELS_CACHE_HOURS ? fm.readImage(path) : null;
  };

  const drawLabelOverlay = async (items) => {
    const out = await runWV(wvLabels, {
      items, ow: TARGET_WIDTH, oh: TARGET_HEIGHT, fs: LABEL_FONT_SCALE * K, max: MAX_LABELS
    });
    const data = Data.fromBase64String(out.p);
    // 有标签瓦片因网络失败缺失时不缓存
    if (items.complete !== false) writeFresh(overlayPath(), data);
    return Image.fromData(data);
  };

  /* ============================ */
  // 降水提示框与雨雪特效
  /* ============================ */
  /** 提示框气泡（WebView 绘制）：云+雨滴图标 + 等级 + 雨量 */
  const wvTooltip = A => {
    try {
      const S = A.s;
      const FONT = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", sans-serif';
      const m = document.createElement('canvas').getContext('2d');
      m.font = '600 ' + 22 * S + 'px ' + FONT;
      const tw = m.measureText(A.title).width;
      m.font = '500 ' + 20 * S + 'px ' + FONT;
      const sw = m.measureText(A.sub).width;
  
      const icon = 26 * S, gap = 8 * S, padX = 16 * S, padY = 12 * S, lineGap = 6 * S;
      const row1W = icon + gap + tw, row1H = 26 * S, row2H = 22 * S;
      const bodyW = Math.ceil(Math.max(row1W, sw) + padX * 2);
      const bodyH = Math.ceil(padY * 2 + row1H + lineGap + row2H);
      const arrowH = 10 * S, arrowW = 20 * S, M = Math.ceil(4 * S);
      const W = bodyW + M * 2, H = Math.ceil(bodyH + arrowH + M * 2);
  
      const cv = document.createElement('canvas');
      cv.width = W;
      cv.height = H;
      const ctx = cv.getContext('2d');
  
      const r = 14 * S, x0 = M, y0 = M, x1 = M + bodyW, y1 = M + bodyH, cx = W / 2;
      ctx.beginPath();
      ctx.moveTo(x0 + r, y0);
      ctx.arcTo(x1, y0, x1, y1, r);
      ctx.arcTo(x1, y1, x0, y1, r);
      ctx.lineTo(cx + arrowW / 2, y1);
      ctx.lineTo(cx, y1 + arrowH);
      ctx.lineTo(cx - arrowW / 2, y1);
      ctx.arcTo(x0, y1, x0, y0, r);
      ctx.arcTo(x0, y0, x1, y0, r);
      ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 4 * S;
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 0.8 * S;
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.stroke();
  
      // 图标：云 + 三滴雨 / 三点雪
      const ix = M + (bodyW - row1W) / 2, iy = M + padY + (row1H - icon) / 2, s = icon;
      ctx.fillStyle = '#e8edf5';
      ctx.beginPath();
      ctx.arc(ix + 0.30 * s, iy + 0.42 * s, 0.20 * s, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(ix + 0.52 * s, iy + 0.28 * s, 0.26 * s, Math.PI * 1.1, Math.PI * 1.95);
      ctx.arc(ix + 0.76 * s, iy + 0.42 * s, 0.17 * s, Math.PI * 1.5, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#7fb2ff';
      ctx.fillStyle = '#bcd8ff';
      ctx.lineWidth = 1.8 * S;
      ctx.lineCap = 'round';
      [0.30, 0.50, 0.70].forEach(function (px) {
        if (A.snow) {
          ctx.beginPath();
          ctx.arc(ix + px * s, iy + 0.84 * s, 0.07 * s, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(ix + px * s, iy + 0.72 * s);
          ctx.lineTo(ix + (px - 0.06) * s, iy + 0.94 * s);
          ctx.stroke();
        }
      });
      ctx.fillStyle = '#f6ecc4';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = '600 ' + 22 * S + 'px ' + FONT;
      ctx.fillText(A.title, ix + icon + gap, M + padY + row1H / 2);
      ctx.textAlign = 'center';
      ctx.font = '500 ' + 20 * S + 'px ' + FONT;
      ctx.fillText(A.sub, cx, M + padY + row1H + lineGap + row2H / 2);
  
      completion(JSON.stringify({
        p: cv.toDataURL('image/png').split(',')[1],
        w: W, h: H, ax: cx, ay: y1 + arrowH
      }));
    } catch (e) {
      completion('ERR:' + (e && e.message ? e.message : String(e)));
    }
  };

  /**
   * 由探针值解码降水类型与强度
   *   rain = -32 + G×127.5 (dBZ)，snow = -32 + B×127.5 (dBZ)；snow > rain 视为雪
   *   雨：e = (10^(dBZ/10) / 200)^0.625 (mm/h)；雪：e = sqrt(10^(dBZ/10) / 75)
   */
  const decodeRadarTooltip = (probe) => {
    const rain = RADAR_DBZ_MIN + probe.g * RADAR_DBZ_SPAN;
    const snow = RADAR_DBZ_MIN + probe.b * RADAR_DBZ_SPAN;
    const isSnow = snow > rain;
    let e, name;
    if (isSnow) {
      e = Math.sqrt(10 ** (snow / 10) / 75);
      name = e >= 2.5 
        ? '大雪' : e >= 1.5 
        ? '中雪' : e >= 0.025 
        ? '小雪' : null;
    } else {
      e = (10 ** (rain / 10) / 200) ** 0.625;
      name =
        e >= 199.5 ? '特大雨 / 冰雹' :
        e >= 49.5 ? '特大雨' :
        e >= 7.5 ? '大雨' :
        e >= 2.54 ? '中雨' :
        e >= 0.508 ? '小雨' :
        e >= 0.006 ? '微雨' : null;
    }
    const v = isSnow ? e * 10 : e;
    const f = v < 0.1 ? 100 : 10;
    const text = v < 1 ? String(Math.round(v * f) / f) : String(Math.round(v));
    return { isSnow, e, name, text };
  };

  /** 无降水时返回 null */
  const buildTooltip = async d => {
    if (!SHOW_RAIN_TOOLTIP || !d?.name) return null;
    const o = await runWV(wvTooltip, {
      title: d.name,
      sub: d.text + ' 毫米/小时',
      snow: d.isSnow,
      s: TOOLTIP_SCALE * K
    });
    return { image: base64ToImage(o.p), w: o.w, h: o.h, ax: o.ax, ay: o.ay };
  };

  /** 雨雪绘制（WebView）。雨：竖直雨丝；雪：多层随机雪花 */
  const wvPrecip = A => {
    try {
      const OW = A.ow, OH = A.oh;
      const cv = document.createElement('canvas');
      cv.width = OW; cv.height = OH;
      const ctx = cv.getContext('2d');
      let s = A.seed >>> 0;
      const r = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const E = a => { const f = Math.sin(a * 871.213) * 3134.422; return f - Math.floor(f); }; // 原版 e()
      const U = A.unit;                              // 1 个原版单位 = U 个输出像素
      const T = 30 + (A.seed % 6000) / 100;          // 相当于原版的 time
      const xoff = Math.floor(r() * 5000), yoff = r() * 500;
      const img = ctx.createImageData(OW, OH);
      const d = img.data;
      const put = (i, o) => {                        // 原版雨雪都是 0.95 的白
        if (o < 0.004) return;
        d[i] = 242; d[i + 1] = 242; d[i + 2] = 242; d[i + 3] = Math.round(Math.min(1, o) * 255);
      };
  
      if (A.kind === 'rain') {
        // 原版：每 2 个单位宽一列，每列一根「圆头在下、尾巴向上渐隐」的竖直雨丝
        const amp = Math.min(1, A.c * 0.3 * A.gain);
        const colB = new Float32Array(OW), colOn = new Uint8Array(OW);
        for (let x = 0; x < OW; x++) {
          const ci = Math.floor((x / U + xoff) / 2);
          colB[x] = Math.cos(ci * 2) * 0.15 + 0.85;
          colOn[x] = E(ci + 0.5) < A.keep ? 1 : 0;
        }
        for (let y = 0; y < OH; y++) {
          // 屏幕向上 = 原版 y 增大
          const ay = ((OH - y - 0.5) / U + yoff) * 4e-3;
          for (let x = 0; x < OW; x++) {
            if (!colOn[x]) continue;
            let f = ay + T * colB[x];
            f -= Math.floor(f);
            put((y * OW + x) * 4, amp * Math.min(1, 0.03 * A.len / f));
          }
        }
      } else {
        const dt = T * 0.2;
        const acc = new Float32Array(OW * OH);
        const x0 = xoff, x1 = xoff + OW / U, y0 = yoff, y1 = yoff + OH / U;
        const rIn = 0.02 * A.size, rOut = 0.04 * A.size; // 单位：格子宽度
        for (let li = 0; li <= 10; li++) {
          const a = li / 10, f = 1 - 0.5 * a, gx = E(a), gy = E(E(a));
          const cell = 50 / f;                           // 一格 = 600/12/f 个单位
          const ix0 = Math.floor(((x0 / 600) + gx) * f * 12) - 1, ix1 = Math.ceil(((x1 / 600) + gx) * f * 12) + 1;
          const iy0 = Math.floor((((y0 / 600) + gy) * f + 0.5 * dt) * 12) - 1, iy1 = Math.ceil((((y1 / 600) + gy) * f + 0.5 * dt) * 12) + 1;
          const cellPx = cell * U, R = Math.ceil(rOut * cellPx) + 1;
          for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) {
            const m = E(E(ix) + iy);
            if (E(m * 3.7 + 0.31) >= A.keep) continue;   // 按雪量稀疏化
            const cx = 0.5 - Math.sin(m * 128 + dt) * 0.4, cy = 0.5 - Math.sin(E(m) * 128 + dt) * 0.4;
            const nx = ((ix + cx) / 12 / f - gx) * 600;
            const ny = (((iy + cy) / 12 - 0.5 * dt) / f - gy) * 600;
            const px = (nx - x0) * U, py = OH - (ny - y0) * U;
            for (let yy = Math.max(0, Math.floor(py) - R); yy <= Math.min(OH - 1, Math.floor(py) + R); yy++) {
              for (let xx = Math.max(0, Math.floor(px) - R); xx <= Math.min(OW - 1, Math.floor(px) + R); xx++) {
                const dist = Math.hypot(xx + 0.5 - px, yy + 0.5 - py) / cellPx;
                if (dist >= rOut) continue;
                const t = Math.min(1, Math.max(0, (dist - rOut) / (rIn - rOut)));
                acc[yy * OW + xx] += t * t * (3 - 2 * t);
              }
            }
          }
        }
        const dd = Math.min(1, A.c * A.gain); // 雪量通道 × 1.3 × 雪花覆盖
        for (let i = 0; i < acc.length; i++) if (acc[i] > 0) put(i * 4, dd * 1.3 * Math.min(1, acc[i]));
      }
      ctx.putImageData(img, 0, 0);
      completion(JSON.stringify({ p: cv.toDataURL('image/png').split(',')[1] }));
    } catch (e) {
      completion('ERR:' + (e && e.message ? e.message : String(e)));
    }
  };

  const buildPrecip = async (probe, d) => {
    if (!SHOW_PRECIP_FX || !d?.name) return null;
    const isSnow = d.isSnow;
    const c = isSnow ? probe.b : probe.g;
    if (c <= 0.05) return null; // 雷达通道太弱不画
    const idx = (isSnow ? SNOW_TIER_IDX : RAIN_TIER_IDX)[d.name];
    const t = (PRECIP_AUTO_TIER && (isSnow ? SNOW_TIERS : RAIN_TIERS)[idx]) || [1, 1, 1];

    const o = await runWV(wvPrecip, {
      kind: isSnow ? 'snow' : 'rain', c, ow: TARGET_WIDTH, oh: TARGET_HEIGHT,
      unit: 2 * K * RAIN_UNIT_SCALE,
      keep: Math.min(1, t[0] * (isSnow ? PRECIP_FX_SCALE : RAIN_COLUMN_KEEP)),
      gain: t[1] * RAIN_ALPHA,
      len: t[2], size: t[2],
      seed: Date.now() & 0xffffff
    });
    return base64ToImage(o.p);
  };

  /* ============================ */
  // 主绘制：底图 → 雷达 → 标签 → 定位点 → 雨雪 → 提示框
  /* ============================ */
  const buildCombinedImage = async radarInfo => {
    const vp = buildViewport();
    if (!vp.tiles.length) throw new Error('地图视口瓦片为空');
    const missing = vp.tiles.filter(t => !t.image);
    const overlayCached = SHOW_LABELS ? readOverlay() : null;

    // 并行取数据：只做网络 / 文件 IO，WebView 同时预热
    const [, radarData, labelItems] = await Promise.all([
      prepareTiles(missing),
      fetchRadar(radarInfo).catch(e => (console.log('雷达数据错误: ' + (e.message || e)), null)),
      SHOW_LABELS && !overlayCached
        ? collectLabels().catch(e => (console.log('标签数据错误: ' + (e.message || e)), []))
        : null,
      getWV()
    ]);

    const full = new Rect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);
    const ctx = newCtx(TARGET_WIDTH, TARGET_HEIGHT);
    ctx.drawImageInRect(await renderBaseMap(vp, missing), full);

    let probe = null;
    if (radarData) {
      try {
        const radar = await renderRadar(radarData);
        ctx.drawImageInRect(
          radar.image, full
        );
        probe = radar.probe;
      } catch (e) {
        console.log('雷达渲染错误: ' + (e.message || e));
      }
    }

    try {
      const overlay = overlayCached || (labelItems?.length ? await drawLabelOverlay(labelItems) : null);
      if (overlay) ctx.drawImageInRect(overlay, full);
    } catch (e) {
      console.log('地图标签错误: ' + (e.message || e));
    }

    // 中心定位点（原生绘制）
    const cx = TARGET_WIDTH / 2;
    const cy = TARGET_HEIGHT / 2;
    const ro = (LOC_ICON_SIZE * K) / 2
    const ri = ro * 0.72;
    ctx.setFillColor(Color.white());
    ctx.fillEllipse(new Rect(cx - ro, cy - ro, ro * 2, ro * 2));
    ctx.setFillColor(new Color(LOC_COLOR));
    ctx.fillEllipse(new Rect(cx - ri, cy - ri, ri * 2, ri * 2));

    // 雨雪与提示框画在最上层
    const decoded = probe ? decodeRadarTooltip(probe) : null;
    const fx = await buildPrecip(probe, decoded).catch(() => null);
    const tip = await buildTooltip(decoded).catch(() => null);
    if (fx) ctx.drawImageInRect(fx, full);
    if (tip) ctx.drawImageInRect(tip.image, new Rect(cx - tip.ax, cy - TOOLTIP_GAP * K - tip.ay, tip.w, tip.h));
    // 持久化 bmMaxZ 等运行期状态
    try { writeSettings(setting); } catch (e) {}
    return ctx.getImage();
  };

  /* ============================ */
  // 组件界面
  /* ============================ */
  const createBarStack = stack => {
    const barStack = stack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.setPadding(4, 10, 4, 10);
    barStack.cornerRadius = 7;
    barStack.backgroundColor = new Color('#000000', 0.4);
    return barStack;
  };

  const createStackText = (stack, label) => {
    const text = stack.addText(label);
    text.textColor = Color.white();
    text.font = Font.mediumSystemFont(14);
  };

  // 雷达帧刻度线
  const createScaleTicks = (stack, radarInfo) => {
    const { frames = [], timeType, localTimeStr } = radarInfo;
    if (!frames.length) return;

    const prefix = { forecast: '临近', now: '现在', today: '今天' }[timeType];
    const labelText = stack.addText(`雷达帧: ${prefix} ${localTimeStr}`);
    labelText.textColor = Color.white();
    labelText.font = Font.mediumSystemFont(14);
    labelText.textOpacity = 0.9;
    stack.addSpacer(10);

    const ticksStack = stack.addStack();
    ticksStack.layoutHorizontally();
    ticksStack.bottomAlignContent();
    ticksStack.spacing = 5;

    frames.forEach(frame => {
      const tick = ticksStack.addStack();
      tick.size = new Size(1.5, frame.isSelected || frame.isMajor ? 12 : 8);
      tick.cornerRadius = 1;
      // 选中且为现在 = 蓝；选中 = 白；整点 = 灰(0.7)；其余 = 灰(0.6)
      tick.backgroundColor = frame.isSelected
        ? new Color(frame.isNow ? '#38BCFF' : '#FFFFFF')
        : new Color('#EEEEEE', frame.isMajor ? 0.48 : 0.42);
    });
  };

  const createWidget = (
    city = `东经${Number(LNG).toFixed(3)}°   北纬${Number(LAT).toFixed(3)}°`,
    type = '',
    levelColor,
    temp = {},
    weather_desc,
    weatherIcon,
    radarInfo
  ) => {
    const widget = new ListWidget();
    widget.setPadding(12, 20, 12, 20);
    if (family === 'small') return widget;

    const topStack = widget.addStack();
    topStack.layoutHorizontally();
    const stack = createBarStack(topStack).addStack();
    createStackText(stack, city);
    stack.addSpacer(3);
    const icon = stack.addImage(SFSymbol.named('location.fill').image);
    icon.imageSize = new Size(15, 15);
    icon.tintColor = Color.white();

    if (type) {
      stack.addSpacer(15);
      const typeText = stack.addText(`${type}预警`);
      typeText.font = Font.mediumSystemFont(14);
      typeText.textColor = levelColor;
    }

    if (weather_desc && temp) {
      stack.addSpacer(15);
      createStackText(stack, weather_desc);
      stack.addSpacer(3);
      stack.addImage(weatherIcon)
        .imageSize = new Size(18, 18);
      stack.addSpacer(10);
      createStackText(stack, temp.value + temp.unit);
    }

    topStack.addSpacer();
    widget.addSpacer();

    const bottomStack = widget.addStack();
    bottomStack.layoutHorizontally();
    bottomStack.centerAlignContent();

    if (setting.showColorBar) {
      const colorBar = bottomStack.addStack();
      colorBar.size = new Size(setting?.barWidth ?? 250, setting?.barHeight ?? 12);
      colorBar.backgroundGradient = createGradient();
      colorBar.cornerRadius = 6;
      bottomStack.addSpacer();
      createStackText(
        createBarStack(bottomStack), 
        hm(new Date())
      );
    } else if (radarInfo) {
      const radarStack = createBarStack(bottomStack);
      const img = radarStack.addImage(satellite);
      img.imageSize = new Size(16, 16)
      img.tintColor = new Color('#38BCFF');
      radarStack.addSpacer(10);
      createScaleTicks(radarStack, radarInfo);
    }

    return widget;
  };

  /* ============================ */
  // 运行
  /* ============================ */
  const runWidget = async () => {
    if (setting.autoLocation) getLocation();

    const [, weatherData, radarInfo] = await Promise.all([
      getTwoHoursWeather(),
      getAlert(),
      getLatestRadar().catch(e => (console.log('雷达元数据错误: ' + (e.message || e)), null))
    ]);

    const { city, temp, sunset, weather_desc, alerts = [] } = weatherData || {};
    const [{ type, level } = {}] = alerts;
    const qweather = getWeatherIcon(weather_desc, sunset?.is_day);
    const weatherIcon = await module.getCacheData(qweather.url, 720, `${qweather.id}.png`);

    const widget = createWidget(city, type, getAlertColor(level), temp, weather_desc, weatherIcon, radarInfo);
    widget.backgroundImage = await buildCombinedImage(radarInfo);
    if (config.runsInApp) {
      await widget[`present${family.charAt(0).toUpperCase() + family.slice(1)}`]();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  };

  await runWidget();
};

module.exports = { main }