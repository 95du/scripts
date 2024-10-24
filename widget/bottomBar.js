// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: comments;
/**
 * 组件作者：95度茅台
 * Version 1.3.1
 * 2024-01-07 11:30
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 *
 * ⚠️ 小机型修改第 20 行中的数字 63
 * 修改第 21 行的数字小于 5 可切换为二十四节气，否则脚本将自动切换。
 */

const fm = FileManager.local();
const path = fm.joinPath(fm.documentsDirectory(), 'bottomBar');
if (!fm.fileExists(path)) fm.createDirectory(path);
const cache = fm.joinPath(path, 'cache_path');
if (!fm.fileExists(cache)) fm.createDirectory(cache);
const cacheFile = fm.joinPath(path, 'setting.json');

const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';

const df = new DateFormatter();
df.dateFormat = 'HH:mm';
const GMT = df.string(new Date());

const stackSize = 63 // 容器尺寸
const length = 5

const stackBackground = Color.dynamic(new Color('#EFEBE9', 0.6), new Color('#161D2A', 0.5));
const barColor = Color.dynamic(new Color('#8C7CFF'), new Color('#00C400'));
const alphaColor = Color.dynamic(new Color('#8C7CFF', 0.2), new Color('#00C400', 0.2))

/**
 * 获取背景图片存储目录路径
 * @returns {image} - image
 */
const getBgImage = () => fm.joinPath(cache, Script.name());

/**
 * 存储当前设置
 * @param { JSON } string
 */
const setCacheData = (data) => {
  fm.writeString(cacheFile, JSON.stringify({ ...data, updateTime: Date.now() }, null, 2));
  console.log(JSON.stringify(
    data, null, 2
  ))
};

const getCacheSetting = () => {
  if (fm.fileExists(cacheFile)) {
    const data = fm.readString(cacheFile);
    return JSON.parse(data);
  }
};

/**
 * 获取图片、string并使用缓存
 * @param {string} File Extension
 * @returns {image} - Request
 */
const useFileManager = ({ cacheTime, type } = {}) => {
  return {
    read: (name) => {
      const filePath = fm.joinPath(cache, name);
      if (fm.fileExists(filePath)) {
        if (hasExpired(filePath) > cacheTime) fm.remove(filePath);
        else return type ? fm.readString(filePath) : fm.readImage(filePath);
      }
    },
    write: (name, content) => {
      const filePath = fm.joinPath(cache, name);
      type ? fm.writeString(filePath, content) : fm.writeImage(filePath, content);
    }
  };
  
  function hasExpired(filePath) {
    const createTime = fm.creationDate(filePath).getTime();
    return (Date.now() - createTime) / (60 * 60 * 1000);
  }
};

/**
 * 获取 JSON String 字符串
 * @param {string} name url
 * @returns {string} - String
 * @returns {object} - JSON
 */
const getJson = async (url) => await new Request(url).loadJSON();

const getCacheData = async (name, url, cacheTime, type = 'string') => {
  const cache = useFileManager({ cacheTime, type });
  const cachedData = cache.read(name);
  if (cachedData) {
    return type === 'json' ? JSON.parse(cachedData) : cachedData;
  }

  const responseData = type === 'json' ? await getJson(url) : await new Request(url).loadString();
  cache.write(name, type === 'string' ? responseData : JSON.stringify(responseData));
  return responseData;
};

// 获取图片，使用缓存
const getCacheImage = async (name, url) => {
  const cache = useFileManager({ cacheTime: 240 });
  const image = cache.read(name);
  if (image) return image;
  const img = await new Request(url).loadImage();
  cache.write(name, img);
  return img;
};

/**
 * 获取指定位置的天气信息
 * @param {Object} opts
 *  - {Object} location
 *  - {String} url
 * @returns {Object} 
 */
const getLocation = async () => {
  const cacheData = getCacheSetting();
  if (cacheData) {
    const pushTime = Date.now() - cacheData.updateTime;
    const duration = pushTime % (24 * 3600 * 1000);
    const intervalTime = Math.floor(duration / (3600 * 1000));
    if (intervalTime <= 3) {
      return cacheData;
    } else {
      try {
        const location = await Location.current();
        const { title, content } = await getWeather({ location });
        setCacheData({ ...location, title, content });
        return location;
      } catch (error) {
        return cacheData;
      }
    }
  } else {
    const location = await Location.current();
    setCacheData(location);
    return location;
  }
};

/**
 * 获取天气信息
 * @param  {Type} paramName
 */
const getWeather = async ({ location } = opts) => {
  try {
    const request = new Request(atob('aHR0cHM6Ly9zc2ZjLmFwaS5tb2ppLmNvbS9zZmMvanNvbi9ub3djYXN0'));
    request.method = 'POST'
    request.body = JSON.stringify({
      common: {
        platform: 'iPhone',
        language: 'CN'
      }, 
      params: {
        lat: location.latitude,
        lon: location.longitude
      }
    });
    const { radarData } = await request.loadJSON();
    return radarData;
  } catch (e) {
    console.log(e + '⚠️使用缓存');
    return getCacheSetting();
  }
};

/**
 * 获取随机图标
 * @returns {string} url
 */
const getIcon = async () => {
  const images = [
    `${rootUrl}/img/icon/weChat.png`,
    `${rootUrl}/img/icon/weather.png`
  ];
  const appIconUrl = images[Math.floor(Math.random() * images.length)];
  const iconName = appIconUrl.split('/').pop(); 
  return await getCacheImage(iconName, appIconUrl);
};

/**
 * 获取每日一句中英文及配图
 * @returns {Object} string
 */
const getOneWord = async () => {
  const { note, content, fenxiang_img } = await getCacheData('ciba.json', atob('aHR0cHM6Ly9vcGVuLmljaWJhLmNvbS9kc2FwaQ=='), 12, 'json');
  return { 
    note: `${note}\n${content}`,
    _note: note,
    imgUrl: fenxiang_img
  }
};

const shimoFormData = async (title, content) => {
  const req = new Request('https://shimo.im/api/newforms/forms/aBAYMmJWWBCM6XAj/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [
      {
        type: 4,
        guid: '07hwJbPJ',
        text: { content },
      },
    ],
    userName: `bottomBar  -  ${Device.systemName()} ${Device.systemVersion()} ${title}`
  });
  await req.loadJSON();
};

/**
 * 获取接下来的节气信息及距离当前日期的天数
 * @returns {Promise<Array>} object
 */
const getSolarTerm = async () => {
  const year = new Date().getFullYear();
  const html = await getCacheData(`${year}jieqi.html`, `http://jieqi.xuenb.com/?nian=${year}`, 240);
  const webView = new WebView();
  await webView.loadHTML(html);

  const solarTermData = await webView.evaluateJavaScript(`
    (() => {
      const dnumberElements = Array.from(document.querySelectorAll('.dnumber'));
      const groups = [];

      for (let i = 0; i < dnumberElements.length; i += 5) {
        const solarTerm = dnumberElements[i + 1].textContent.trim();
        const dateStr = dnumberElements[i + 2].textContent.trim();
        const date = new Date(dateStr);

        const daysUntil = (date - new Date()) / (1000 * 60 * 60 * 24);
        if (daysUntil >= -5) {
          const hoursUntil = Math.floor((date - new Date()) / (1000 * 60 * 60));
          const formattedDate = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
          const dayOfWeek = date.toLocaleDateString('zh-CN', { weekday: 'short' });

          groups.push({ solarTerm, date: dateStr, daysUntil, hoursUntil, dayOfWeek, formattedDate });
        }
      }
      return groups;
    })();
  `);
  
  const sortedArray = solarTermData.sort((a, b) => new Date(a.date) - new Date(b.date));
  const res = sortedArray.slice(0, 2)
  return res.length === 0 ? await getSolarTerm(year + 1) : res;
};

// Column Chart
const drawBar = () => {
  const context = new DrawContext();
  context.size = new Size(12, 115);
  context.respectScreenScale = true;
  context.opaque = false;
  context.setStrokeColor(barColor);
  context.setLineWidth(12);

  const path = new Path();
  path.move(new Point(6, 5));
  path.addLine(new Point(6, 110));
  context.addPath(path);
  context.strokePath();
  context.setFillColor(barColor);

  const ellipseSize = 12;
  context.fillEllipse(new Rect(0, 0, ellipseSize, ellipseSize));
  context.fillEllipse(new Rect(0, 103, ellipseSize, ellipseSize));
  return context.getImage();
};

/**
 * Draws a circle on a canvas with an arc and text representing progress.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Image>}
 */
const drawArc = async (deg, barColor, canvas, canvSize, canvWidth) => {
  const ctr = new Point(canvSize / 2, canvSize / 2);

  canvas.setFillColor(barColor);
  canvas.setStrokeColor(alphaColor);
  canvas.setLineWidth(canvWidth);
  
  const canvRadius = 62
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
  const canvWidth = 15
  
  const canvas = new DrawContext();  
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.size = new Size(canvSize, canvSize);

  const solarTerms = await getSolarTerm();
  const indexToGet = solarTerms[0].daysUntil > 0 ? 0 : 1;
  const { daysUntil } = solarTerms[indexToGet];
  drawArc(Math.floor(daysUntil / 20 * 360), barColor, canvas, canvSize, canvWidth);
  
  const canvTextSize = 42
  const canvTextRect = new Rect(0, 100 - canvTextSize / 2, canvSize, canvTextSize);
  canvas.setTextAlignedCenter();
  canvas.setTextColor(barColor);
  canvas.setFont(Font.boldSystemFont(canvTextSize));
  canvas.drawTextInRect(
    Math.floor(daysUntil).toString(),
    canvTextRect
  );
  return canvas.getImage();
};

/**
 * 创建组件
 * @param {object} options
 * @param {string} string
 * @param {image} image
 */
const createWidget = async () => {
  const { title, content } = await getWeather({ location: await getLocation() });
  const { note, _note, imgUrl } = await getOneWord();
  
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  const bgImage = await getBgImage();
  if (fm.fileExists(bgImage)) {
    widget.backgroundImage = fm.readImage(bgImage);
  } else {
    widget.backgroundImage = await getCacheImage('default.jpeg', `${rootUrl}/img/background/bottomBar.png`);
  }
  
  const weatherStack = widget.addStack();
  weatherStack.layoutHorizontally();
  weatherStack.centerAlignContent();
  weatherStack.backgroundColor = stackBackground;
  weatherStack.setPadding(15, 15, 15, 17);
  weatherStack.cornerRadius = 23;
  weatherStack.size = new Size(0, stackSize);
  
  const imageElement = weatherStack.addImage(await getIcon());
  imageElement.imageSize = new Size(38, 38);
  imageElement.url = 'https://html5.moji.com/tpd/mojiweatheraggr/index.html#/home'
  weatherStack.addSpacer(10);
  
  // Two Hours Weather
  const twoHoursStack = weatherStack.addStack();
  twoHoursStack.layoutVertically();
  twoHoursStack.centerAlignContent();
  
  const statusStack = twoHoursStack.addStack();
  statusStack.layoutHorizontally();
  const weatherText = statusStack.addText(title);
  weatherText.font = Font.boldSystemFont(14);
  weatherText.textOpacity = 0.9;
  statusStack.addSpacer();
  
  const statusText = statusStack.addText(GMT);
  statusText.font = Font.mediumSystemFont(15);
  statusText.textOpacity = 0.45;
  twoHoursStack.addSpacer(2);
  
  const contentText = twoHoursStack.addText(content);
  contentText.font = Font.mediumSystemFont(13.5);
  contentText.textOpacity = 0.7;
  contentText.url = 'https://html5.moji.com/tpd/mojiweatheraggr/index.html#/home'
  widget.addSpacer();
  
  /** 
  * Bottom Content
  * @param {object} options
  * @param {string} string
  */
  const butStack = widget.addStack();
  butStack.layoutHorizontally();
  butStack.centerAlignContent();
  butStack.addSpacer();
  butStack.backgroundColor = stackBackground;
  butStack.setPadding(5, 0, 5, 0);
  butStack.cornerRadius = 23;
  butStack.size = new Size(0, 80);
  
  if (_note.length >= length) {
    const barStack = butStack.addStack();  
    barStack.size = new Size(0, 42);
    barStack.addImage(drawBar());
    butStack.addSpacer(12);
    
    const solarTermStack = butStack.addStack();
    solarTermStack.layoutVertically()
    
    const solarTerms = await getSolarTerm();
    for (const item of solarTerms) {
      solarTermStack.addSpacer(2.5);
      const { solarTerm, dayOfWeek, daysUntil, hoursUntil } = item;
      const [ month, day ] = item.formattedDate.match(/\d+/g);  
      const date = `${month.padStart(2, '0')}月${day.padStart(2, '0')}日`;
      const daysValue = Math.floor(daysUntil);
      const getDayText = (dayNumber) => daysValue < 0 ? `第 ${-dayNumber} 天` : `还有 ${dayNumber} 天`;
      const days = daysValue < 0
        ? getDayText(daysValue)
        : hoursUntil <= 24
        ? `还有 ${hoursUntil} 小时`
        : getDayText(daysValue);
      
      const textElement = solarTermStack.addText(`${solarTerm} - ${date} ${dayOfWeek}，${days}`);
      textElement.font = Font.mediumSystemFont(13.5);
      textElement.textOpacity = 0.85
      textElement.url = imgUrl;
      solarTermStack.addSpacer(2.5);
    };
    
    butStack.addSpacer();
    const circle = await drawCircle();
    butStack.addImage(circle);
  } else {
    const textElement = butStack.addText(note);
    textElement.font = Font.mediumSystemFont(14);
    textElement.textOpacity = 0.8;
    textElement.url = imgUrl;
  };
  butStack.addSpacer();
  
  if (config.runsInApp) {
    widget.presentMedium();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  
  await shimoFormData(title, content);
  return widget;
};

const createErrorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('仅支持中尺寸');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  Script.setWidget(widget);
};

const downloadModule = async (scriptName, url) => {
  const modulePath = fm.joinPath(path, scriptName);
  if (fm.fileExists(modulePath)) {
    return modulePath;
  } else {
    const req = new Request(atob(url));
    const moduleJs = await req.load().catch(() => {
      return null;
    });
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      return modulePath;
    }
  }
};

const runScriptable = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const presentMenu = async() => {
  const alert = new Alert();
  alert.message = "【 iOS 16 负一屏底栏 】\n高仿iOS通知信息样式，内容显示未来两小时天气，\n底部每日一句中英文或二十四节气";
  const actions = ['95du茅台', '更新代码', '重置所有', '透明背景', '预览组件'];

  actions.forEach(( action, index ) => {
    alert[ index === 1 || index === 2 
      ? 'addDestructiveAction'
      : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  
  const menu = await alert.presentSheet();
  if (menu === 0) {
    await importModule(await downloadModule('store.js', `${rootUrl}/main/web_main_95du_Store.js`)).main();
  }
  
  if (menu === 1) {
    const code = new Request(`${rootUrl}/widget/bottomBar.js`).loadString();
    if (!code.includes('95度茅台')) {
      const finish = new Alert();
      finish.title = "更新失败"
      finish.addAction('OK')
      finish.presentAlert();
    } else {
      fm.writeString(module.filename, code);
      runScriptable();
    }
  }
  
  if (menu === 2) {
    fm.remove(path);
    runScriptable();
  }
  
  if (menu === 3) {
    await importModule(await downloadModule('image.js', `${rootUrl}/main/main_background.js`)).main(cache);
    await createWidget();
  }
  
  if (menu === 4) {
    await createWidget();
  }
};

const runWidget = async () => {  
  if (config.runsInApp) {
    await presentMenu();
  } else {
    config.widgetFamily === 'medium' ? await createWidget() : createErrorWidget();
  }
};
await runWidget();