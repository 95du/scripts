// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: grin-squint;
/**
 * 组件作者：95度茅台
 * Version 1.5.0
 * 2024-12-07
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'bottomBar');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const settingPath = fm.joinPath(mainPath, 'setting.json');
const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';

const runScriptable = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const getFormattedTime = () => {
  const df = new DateFormatter();
  df.dateFormat = 'HH:mm';
  return df.string(new Date());
};

const setCacheData = (data) => {
  fm.writeString(settingPath, JSON.stringify({ ...data, updateTime: Date.now() }, null, 2));
  console.log(JSON.stringify(
    data, null, 2
  ))
};

const getSetting = () => {
  if (fm.fileExists(settingPath)) {
    const data = fm.readString(settingPath);
    return JSON.parse(data);
  }
};

const useFileManager = () => {
  const fullPath = (name) => fm.joinPath(mainPath, name);
  return {
    readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
    writeImage: (name, image) => fm.writeImage(fullPath(name), image)
  };
};

// 获取图片，使用缓存
const getCacheImage = async (name, url) => {
  const cache = useFileManager();
  const image = cache.readImage(name);
  if (image) return image;
  const img = await new Request(url).loadImage();
  cache.writeImage(name, img);
  return img;
};

// 获取随机数组元素
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;

const getJson = async (url) => await new Request(url).loadJSON();

/**
 * 获取指定位置的天气信息
 * @param {Object} opts
 *  - {Object} location
 *  - {String} url
 * @returns {Object} 
 */
const getLocation = async () => {
  const setting = getSetting();
  if (setting) {
    const pushTime = Date.now() - setting.updateTime;
    const duration = pushTime % (24 * 3600 * 1000);
    const intervalTime = Math.floor(duration / (3600 * 1000));
    if (intervalTime <= 3) {
      return setting;
    } else {
      try {
        const location = await Location.current();
        const { longitude, latitude } = location;
        const { title, content } = await getWeather(longitude, latitude);
        setCacheData({ ...location, title, content });
        return location;
      } catch (error) {
        return setting;
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
const getWeather = async (longitude, latitude) => {
  try {
    const request = new Request('https://ssfc.api.moji.com/sfc/json/nowcast');
    request.method = 'POST'
    request.body = JSON.stringify({
      common: {
        platform: 'iPhone',
        language: 'CN'
      }, 
      params: {
        lat: latitude,
        lon: longitude
      }
    });
    
    const { radarData } = await request.loadJSON();
    return radarData;
  } catch (e) {
    console.log(e + '⚠️使用缓存');
    return getCacheSetting();
  }
};

// 天气预警
const getAlert = async (longitude, latitude) => {
  const options = {
    method: 'POST',
    body: JSON.stringify({ lon: longitude, lat: latitude })
  };
  
  const response = await Object.assign(new Request('https://h5ctywhr.api.moji.com/weatherthird/getCityInfo'), options).loadJSON();
  const { data } = await getJson(`https://co.moji.com/api/weather2/weather?lang=zh&city=${response.cityId}`);
  return getRandomItem(data.alerts);
};

const shimoFormData = async (title, content) => {
  const req = new Request('https://shimo.im/api/newforms/forms/aBAYMmJWWBCM6XAj/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [{
      type: 4,
      guid: '07hwJbPJ',
      text: { content },
    }],
    userName: `bottomBar  -  ${Device.systemName()} ${Device.systemVersion()} ${title}`
  });
  req.load();
};

const getIcon = async () => {
  const images = [
    `${rootUrl}/img/icon/weChat.png`,
    `${rootUrl}/img/icon/weather.png`
  ];
  const appIconUrl = getRandomItem(images);
  const iconName = appIconUrl.split('/').pop(); 
  return await getCacheImage(iconName, appIconUrl);
};

// 创建组件
const createWidget = async () => {
  const { longitude, latitude } = await getLocation();
  let { title, content } = await getWeather(longitude, latitude);
  if (title === '不会下雨') {
    const { type } = await getAlert(longitude, latitude) || {};
    const result = `${type}预警`;
    title = type ? result : title;
  };
  
  // 组件内容
  const widget = new ListWidget();
  widget.setPadding(0, 0, 0, 0);
  const bgImage = fm.joinPath(mainPath, Script.name());
  if (fm.fileExists(bgImage)) {
    widget.backgroundImage = fm.readImage(bgImage);
  } else {
    widget.backgroundImage = await getCacheImage('default.jpeg', `${rootUrl}/img/background/bottomBar.png`);
  }
  
  const weatherStack = widget.addStack();
  weatherStack.layoutHorizontally();
  weatherStack.centerAlignContent();
  weatherStack.setPadding(18, 15, 18, 17);
  weatherStack.cornerRadius = 23;
  weatherStack.size = new Size(0, 63)
  weatherStack.backgroundColor = Color.dynamic(new Color('#EFEBE9', 0.6), new Color('#161D2A', 0.5));
  
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
  
  const currentTime = getFormattedTime();
  const statusText = statusStack.addText(currentTime);
  statusText.font = Font.mediumSystemFont(15);
  statusText.textOpacity = 0.45;
  twoHoursStack.addSpacer(2);
  
  const contentText = twoHoursStack.addText(content);
  contentText.font = Font.mediumSystemFont(13.5);
  contentText.textOpacity = 0.7;
  contentText.url = 'https://html5.moji.com/tpd/mojiweatheraggr/index.html#/home'
  widget.addSpacer();
  
  const butStack = widget.addStack();
  butStack.backgroundColor = new Color('#EFEBE9', 0.2);
  butStack.setPadding(12, 12, 12, 12);
  butStack.cornerRadius = 23;
  butStack.size = new Size(0, 80);
  butStack.addSpacer();
  
  const iconStack = butStack.addStack();
  iconStack.layoutHorizontally();
  iconStack.bottomAlignContent();
  
  const image = await getCacheImage('monkey.png', 'https://raw.githubusercontent.com/95du/scripts/refs/heads/master/img/icon/monkey.png');
  iconStack.addImage(image)
  iconStack.addSpacer();
  
  function selectFrom(a, b) {
    const choices = b - a + 1;
    return Math.floor(Math.random() * choices + a);
  }
  
  // 随机获取 4 张图片
  for (let i = 0; i < 4; i++) {
    const num = selectFrom(1, 30);
    const url = `https://storage.360buyimg.com/swm-stable/joypark-static1/unlock_joy_level${num}.png`;
    const image = await getCacheImage(`${num}.png`, url);
    const imageStack = iconStack.addStack();
    imageStack.size = new Size(0, 45);
    imageStack.addImage(image);
    iconStack.addSpacer(10);
  }
  
  if (config.runsInApp) {
    widget.presentMedium();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  shimoFormData(title, content);
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
    const moduleJs = await new Request(url).load().catch(() => {
      return null;
    });
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      return modulePath;
    }
  }
};

const presentMenu = async() => {
  const alert = new Alert();
  alert.message = "【 iOS 16 负一屏底栏 】\n高仿iOS通知信息样式，内容显示未来两小时天气";
  const actions = ['95du茅台', '更新代码', '重置所有', '透明背景', '预览组件'];

  actions.forEach((action, index) => {
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
    const code = new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/bottomBar.js').loadString();
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