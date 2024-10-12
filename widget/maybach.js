// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: car;
const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'maybach');
const cache = fm.joinPath(mainPath, 'cache_path');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
if (!fm.fileExists(cache)) fm.createDirectory(cache);
const cacheFile = fm.joinPath(mainPath, 'setting.json')

/**
 * 存储当前设置
 * @param { JSON } string
 */
const writeSettings = (settings) => {
  fm.writeString(cacheFile, JSON.stringify(settings, null, 2));
  console.log(JSON.stringify(
    settings, null, 2
  ))
};

/**
 * 读取储存的设置
 * @param {string} file - JSON
 * @returns {object} - JSON
 */
const getSettings = (file) => {
  if (fm.fileExists(file)) {
    return { cookie, myPlate, pushTime, coordinates } = JSON.parse(fm.readString(file));
  }
};

const setting = getSettings(cacheFile) || {};

/**
 * 弹出通知  
 * @param {string} title
 * @param {string} body
 * @param {string} url
 * @param {string} sound
 */
const notify = (title, body, url, sound = 'piano_success') => {
  const n = Object.assign(new Notification(), { title, body, sound });
  if (url) n.openURL = url;
  n.schedule();
};

const ScriptableRun = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

/**
 * @description 更新 string
 * @returns {Promise<void>}
 */
const updateString = async () => {
  const codeString = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/maybach.js').loadString();
  const filename = module.filename;
  const iCloudInUse = fm.isFileStoredIniCloud(filename);
  if (codeString.includes('95度茅台') && iCloudInUse) {
    fm.writeString(filename, codeString);
    ScriptableRun();
  } else {
    const error = new Alert();
    error.title = '更新失败 ⚠️';
    error.addAction('结束');
    await error.presentAlert();
  }
};

// 获取随机数组元素
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;

/**
 * 获取远程图片
 * @returns {image} - image
 */
const getImage = async (url) => await new Request(url).loadImage();

/**
 * @param {string} url
 * @returns {object} - JSON
 */
const getJson = async (url) => {
  const response = await makeRequest(url);
  const { status } = response;
  if (status === '1') {
    return response;
  }
};

/**
 * 获取图片、字符串并使用缓存
 * @param {string} type
 * @returns {object} - An object with read and write (Image, JSON)
 */
const useFileManager = (type) => {
  return {
    read: (name) => {
      const filePath = fm.joinPath(cache, name);
      if (fm.fileExists(filePath)) {
        return type ? JSON.parse(fm.readString(filePath)) : fm.readImage(filePath);
      }
    },
    write: (name, content) => {
      const filePath = fm.joinPath(cache, name);
      type ? fm.writeString(filePath, JSON.stringify(content)) : fm.writeImage(filePath, content);
    }
  }
};

/**
 * 获取请求数据并缓存
 * @param {string} - url
 * @returns {image} - image
 * @returns {object} - JSON
 */
const getCacheData = async (name, url) => {
  const type = name.includes('json');
  const cache = useFileManager(type);
  const cacheData = cache.read(name);
  if (cacheData) return cacheData;
  const response = type ? await getJson(url) : await getImage(url);
  if (response) {
    cache.write(name, response);
  }
  return response;
};

/**
 * 获取随机图片并使用缓存
 * @param {string} File Extension
 * @returns {image} - Request
 */
const getRandomImage = async () => {
  const maybach = Array.from({ length: 9 }, (_, index) => `https://gitcode.net/4qiao/scriptable/raw/master/img/car/Maybach-${index}.png`);
  const randomImg = getRandomItem(maybach);
  const name = randomImg.split('/').pop();
  return await getCacheData(name, randomImg);
};

/**
 * 发起请求并获取 JSON 字符串
 * @param {string} url
 * @param {string} method
 * @param {object} headers
 * @param {object} body
 * @returns {object} - JSON
 */
const makeRequest = async (url, method = 'GET', headers, body) => {
  const request = new Request(url);
  request.method = method;
  request.headers = headers || {};
  if (body) request.body = body;
  return await request.loadJSON();
};

/**
 * 获取地理位置信息
 * @param {number} longitude - 经度
 * @param {number} latitude - 纬度
 * @returns {object} - 地理位置信息的对象，包含地址、停车时间、车速等属性
 */
const getLastLocation = async () => {
  try {
    const url = `http://ts.amap.com/ws/tservice/location/getLast?in=${atob('S1FnOHNVbXZIckd3dTBwS0JOVHBtNzcxUjJIMEpRJTJGT0dYS0Jsa1pVMkJHaHVBMXB6SEhGck9hTnVoRHpDclFnemNZNTU4dEh2Y0R4JTJCSlRKTDFZR1VnRTA0STFSNG1ydjZoNzdOeHlqaEE0MzNoRk01T3ZrUyUyRlVRU2xybndONXBmZ0tuRkYlMkZMS04xbFp3T1hJSU43Q2tDbWRWRDI2ZmglMkZzMWNySXglMkJKWlV1STZkUFlma3V0bDFaNXpxU3pYUXF3akZ3MDNqM2FSdW1oN1phcURZZDlmWGNUOThnaTAzNFhDWFFKeXhySHBFJTJCUFBsRXJuZmlLeGQzNmxMSEtNSjdGdFA3V0wlMkZPSE9LRSUyRjNZTk4wVjlFRWQlMkZqM0JTWWFjQlRkU2hKNFkwcEV0VWYycVRwZHNJV24lMkY3THMxbGxIQ3NvQkIyNFBRJTNEJTNEJmVudD0yJmtleXQ9NA==')}`;
    const headers = { 
      Cookie: cookie 
    };
    const { code, data } = await makeRequest(url, 'GET', headers);
    if (code === 1) {
      return { speed, owner, heading, channel, longitude, latitude, updateTime } = data;
    }
  } catch (e) {
    console.log('位置' + e);
    return { speed, address, heading, longitude, latitude, updateTime } = getSettings(cacheFile);
  }
};

/**
 * @description 获取指定经纬度的地址信息和周边POI点信息
 * @returns {Promise<object>} 包含formatted_address和pois的对象
 */
const getAddress = async () => {
  try {
    const url = `http://restapi.amap.com/v3/geocode/regeo?key=9d6a1f278fdce6dd8873cd6f65cae2e0&s=rsv3&radius=500&extensions=all&location=${longitude},${latitude}`;
    const fetchData = async () => setting.updateTime !== updateTime ? await makeRequest(url) : await getCacheData('address.json', url);
    const { regeocode } = await fetchData();
    return { formatted_address: address, roads, pois } = regeocode;
  } catch (e) {
    console.log('地址' + e);
  }
};

/**
 * 获取两点间驾车路线规划的距离
 * @returns {Promise<number>} number
 */ 
const getDistance = async () => {
  try {
    const url = `https://restapi.amap.com/v5/direction/driving?origin=${coordinates}&key=a35a9538433a183718ce973382012f55&origin_type=0&strategy=38&destination=${longitude},${latitude}`;
    const fetchData = async (url) => setting.updateTime !== updateTime ? await makeRequest(url) : await getCacheData('distance.json', url);
    const { route } = await fetchData(url);
    return route.paths[0];
  } catch (e) {
    console.log('距离' + e);
  }
};

/**
 * 推送消息到微信
 * @returns {Promise} Promise
 */
const sendWechat = async (description, url, longitude, latitude) => {
  const mapPicUrl = `https://restapi.amap.com/v3/staticmap?&key=a35a9538433a183718ce973382012f55&zoom=14&size=450*300&markers=-1,https://gitcode.net/4qiao/scriptable/raw/master/img/car/locating_0.png,0:${longitude},${latitude}`;
  // 推送到微信
  const { access_token } = await new Request('https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=ww1ce681aef2442dad&corpsecret=Oy7opWLXZimnS_s76YkuHexs12OrUOwYEoMxwLTaxX4').loadJSON();
  const request = new Request(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`);
  request.method = 'POST'
  request.body = JSON.stringify({
    touser: 'DianQiao',
    agentid: 1000004,
    msgtype: 'news',
    news: { 
      articles: [{
        title: address,
        picurl: mapPicUrl,
        url,
        description
      }]
    }
  });
  request.load();
};

/**
 * Electronic Fence
 * 判断run为HONDA触发电子围栏
 * 弹窗通知并推送信息到微信
 */
const pushMessage = async (
  longitude, 
  latitude, 
  mapUrl, 
  distance, 
  steps = [], 
  status, 
  fullTime, 
  parkTime, 
  json
) => {
  const moment = Math.floor((Date.now() - pushTime) / (1000 * 60));
  const driveAway = moment >= 10 && distance > 20 && updateTime !== setting.updateTime;
  const shouldNotifyStop = moment >= 240 && updateTime === setting.updateTime;

  const breakVariable = (a, b) => {
    return driveAway ? `${a}已离开📍${setting.address}，相距 ${distance} 米` : `${b}${steps[0].instruction}`;
  };
  
  const isStatusMesg = breakVariable('\n', '\n ');
  const isNotifyMesg = breakVariable('\n', ' - ');
  
  const isStatus = (sta) => {
    const staString = `${status}  ${sta} ${fullTime + isStatusMesg}`;
    return staString;
  };
    
  const readySend = async (sta) => {
    notify(`${status}  ${parkTime}`, `${address + isNotifyMesg}`, mapUrl);
    await sendWechat(isStatus(sta), mapUrl, longitude, latitude);
    writeSettings(json);
  };
  
  if (driveAway) {
    await readySend('启动时间');
  } else if (shouldNotifyStop) {
    await readySend('停车时间');
  } else if (setting.updateTime !== updateTime) {
    await readySend('更新时间');
  }
};

// Formatter address
const getShortAdr = (pois) => {
  const minPoi = pois.reduce((min, current) => parseFloat(min.distance) < parseFloat(current.distance) ? min : current);
  return minPoi.name.length >= 18 ? minPoi.address : minPoi.name;
};

const formatAdrName = (address, pois, roads = [], lengthen) => {
  const name = getShortAdr(pois);
  const strLength = address.replace(/[\u0391-\uFFE5]/g, "@@").length;

  if (name.length <= 3 && strLength < 36) return lengthen;
  if (strLength <= 48 && roads.length > 0 && name.length >= 8) {  
    return `${address} - ${roads[0].name}(${roads[0].direction})`;
  }
  return strLength <= 48 ? (`${address} - ${name}`) : address;
};

const formatAaddress = (pois, address, roads) => {
  const lengthen = address + ' - 位置属乡镇村、高速路或无名路段 🚫';
  const newAddress = pois?.length ? formatAdrName(address, pois, roads, lengthen) : lengthen;
  return newAddress;
};

// Timestamp Formatter
const formatDate = (timestamp, short) => new Date(timestamp + 8 * 3600000).toISOString().slice(short ? 5 : 0, 16).replace('T', ' ');

// 更新缓存文件 🚫
const handleFile = (fileName) => {
  const filePath = fm.joinPath(cache, fileName);
  if (fm.fileExists(filePath) && setting.updateTime !== updateTime) {
    console.log(fileName)
    fm.remove(filePath);
  }
};

/**
 * 获取公用数据
 * @returns {Object} 返回包含信息的对象
 * @param {number} updateTime
 * @returns {number} 返回停车时长（分钟)
 * @param {string} format
 */
const getInfo = async () => {
  const locationData = await getLastLocation();
  const addressStr = await getAddress();
  if (locationData && addressStr) {
    ['address.json', 'distance.json', 'map.png'].forEach(handleFile);
  };
  
  const [state, status] = speed <= 5   
    ? ['已静止', '[ 车辆静止中 ]'] 
    : [`${speed} km·h`, `[ 车速 ${speed} km·h ]`];
  
  const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent('琼A·849A8')}&ll=${latitude},${longitude}&t=m`;
  
  const carLogo = await getCacheData('maybachLogo.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/car/maybachLogo.png');
  
  const [fullTime, parkingTime] = [formatDate(updateTime), formatDate(updateTime, true)];
  
  const json = {
    ...locationData,
    cookie,
    address,
    coordinates: `${longitude},${latitude}`,
    updateTime,
    parkingTime,
    pushTime: Date.now()
  };
  
  if (!setting.owner) writeSettings(json);
  return { mapUrl, carLogo, fullTime, parkingTime, state, status, json };
};

// 设置组件背景
const setBackground = (widget) => {
  const gradient = new LinearGradient();
  const color = getRandomItem(['#82B1FF', '#4FC3F7', '#66CCFF', '#99CCCC', '#BCBBBB', '#A0BACB', '#285FF455']);
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color(color, 0.5),
    new Color('#00000000')
  ];
  widget.backgroundGradient = gradient;  
  widget.backgroundColor = Color.white();
};

/**
 * Create left stack
 * @param {image} SFSymbol
 * @param {string} text
 * Cylindrical Bar Chart
 */
const addText = (stack, text, size, gap, iconName) => {
  const newStack = stack.addStack();
  newStack.layoutHorizontally();
  newStack.centerAlignContent();
  
  if (iconName) {
    const iconSymbol = SFSymbol.named(iconName);
    const iconImage = newStack.addImage(iconSymbol.image);
    iconImage.imageSize = new Size(16, 16);
    newStack.addSpacer(5);
  };

  const textElement = newStack.addText(typeof text === 'number' ? text.toFixed(6) : text);
  textElement.font = Font.mediumSystemFont(size);
  textElement.textColor = Color.black();
  textElement.textOpacity = 0.78;
  stack.addSpacer(gap);
};

// bar Stack
const addBarStack = ({ leftStack, borderColor, iconName, iconColor, barText, textColor, gap }) => {
  const barStack = leftStack.addStack();
  barStack.layoutHorizontally();
  barStack.centerAlignContent();
  barStack.setPadding(3, 12, 3, 12);
  barStack.cornerRadius = 10;
  barStack.borderColor = borderColor;
  barStack.borderWidth = 2;
  
  const barIcon = SFSymbol.named(iconName);
  const icon = barStack.addImage(barIcon.image);
  icon.imageSize = new Size(16, 16);
  icon.tintColor = iconColor;
  barStack.addSpacer(4);
  
  const statusText = barStack.addText(barText);
  statusText.font = Font.mediumSystemFont(14);
  statusText.textColor = textColor;
  if (gap) leftStack.addSpacer(gap);
  barStack.url = 'shortcuts://run-shortcut?name=Maybach&input=text';
  return barStack;
};

//=========> Create <=========//
const createWidget = async () => {
  const { mapUrl, carLogo, fullTime, parkingTime, state, status, json } = await getInfo();
  
  const widget = new ListWidget();
  setBackground(widget);
  widget.setPadding(0, 0, 0, 0);
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();

  const leftStack = mainStack.addStack();
  leftStack.size = new Size(125, 0);
  leftStack.setPadding(15, 16, 15, 0)
  leftStack.layoutVertically();
  
  addText(leftStack, '琼A·849A8', 19.5, 3, null);
  addText(leftStack, parkingTime, 13.5, 3, 'clock');
  addText(leftStack, heading, 13.5, null, 'arrow.triangle.swap');
  leftStack.addSpacer();
  
  addBarStack({
    leftStack,
    borderColor: new Color(speed <= 5 ? '#AB47BC' : '#FF1800', 0.75),  
    iconName: speed <= 5 ? 'location' : 'location.fill',
    iconColor: speed <= 5 ? Color.purple() : Color.red(),
    barText: state,
    textColor: new Color(speed <= 5 ? '#AA00FF' : '#D50000'),
    gap: 8
  });
  
  addBarStack({
    leftStack,
    borderColor: new Color(speed <= 5 ? '#777777' : '#AF52DE'),
    iconName: 'lock.shield.fill',
    iconColor: Color.green(),
    barText: speed <= 5 ? '已锁车' : '已启动',
    textColor: new Color(speed <= 5 ? '#555555' : '#AF52DE')
  });
  
  /**
   * @param {image} image
   * @param {string} address
   */
  const rightStack = mainStack.addStack();
  rightStack.size = new Size(240, 0);
  rightStack.setPadding(15, 0, 15, 16);
  rightStack.layoutVertically();
  
  const carLogoStack = rightStack.addStack();
  carLogoStack.addSpacer();
  const image = carLogoStack.addImage(carLogo);
  image.imageSize = new Size(27, 27);
  image.tintColor = Color.black();
  rightStack.addSpacer(1);
  
  const carStack = rightStack.addStack();
  carStack.setPadding(-25, 3, -3, 0);
  const img = carStack.addImage(await getRandomImage());
  img.imageSize = new Size(225, 107);
  img.url = 'scriptable:///run/' + encodeURIComponent(Script.name());
  rightStack.addSpacer();

  const adrStack = rightStack.addStack();
  adrStack.size = new Size(225, 27);
  const newAddress = formatAaddress(pois, address, roads);
  addressText = adrStack.addText(newAddress);
  addressText.font = Font.mediumSystemFont(11);
  addressText.textColor = Color.black();
  addressText.textOpacity = 0.8
  addressText.centerAlignText();
  addressText.url = mapUrl;
  
  if (setting.coordinates) {
    const { distance = 0, steps } = await getDistance() || {};
    await pushMessage(longitude, latitude, mapUrl, distance, steps, status, fullTime, parkingTime, json);
  };
  
  return widget;
};

// 创建小号组件
const smallWidget = async (widget = new ListWidget()) => {
  try {
    const { mapUrl } = await getInfo();
    const url = `https://restapi.amap.com/v3/staticmap?key=a35a9538433a183718ce973382012f55&zoom=13&size=240*240&markers=-1,https://gitcode.net/4qiao/scriptable/raw/master/img/car/locating_0.png,0:${longitude},${latitude}`;
    const fetchData = async (url) => setting.updateTime !== updateTime ? await getImage(url) : await getCacheData('map.png', url);
    widget.backgroundImage = await fetchData(url);
    widget.url = mapUrl;
  } catch (e) {
    const imageElement = widget.addImage(SFSymbol.named("wifi.exclamationmark").image);
    imageElement.centerAlignImage();
    imageElement.tintColor = Color.dynamic(Color.black(), Color.white());
    imageElement.imageSize = new Size(45, 45);
    widget.addSpacer(15);
    
    const tipText = widget.addText('数据未连接');
    tipText.font = Font.systemFont(17);
    tipText.centerAlignText();
  };
  
  return widget;
};

/**-------------------------**/
const getCookieBoxjs = async () => {
  const boxjs_data = await makeRequest('http://boxjs.com/query/data/amap_cookie').catch(() => {
    Safari.open('quantumult-x://');
  });
  return boxjs_data?.val || {};
};

const inputCookie = async () => {
  const alert = new Alert();
  alert.message = '输入 Cookie';
  alert.addTextField('高德地图Cookie');
  alert.addAction('确定');
  alert.addCancelAction('取消');
  const input = await alert.present();
  if (input === -1) return;
  const cookie = alert.textFieldValue(0) || await getCookieBoxjs();
  if (cookie && !setting.cookie) {
    writeSettings({ cookie });
    ScriptableRun();
  }
};

/**
 * 弹出菜单供用户选择进行操作
 */
const presentMenu = async () => {
  const alert = new Alert();
  alert.message = '\n显示车辆实时位置、车速、停车时间\n模拟电子围栏、模拟停红绿灯\n设置间隔时间推送车辆状态信息';
  const actions = ['更新代码', '重置所有', '输入凭证', '中号组件', '小号组件'];
  actions.forEach((action,index) => {
    alert[index === 0 || index === 1 
      ? 'addDestructiveAction'
      : 'addAction'](action);
  });
  alert.addCancelAction('取消');
  
  const response = await alert.presentSheet();
  switch (response) {
    case 0:
      await updateString();
      break;
    case 1:
      fm.remove(mainPath);
      ScriptableRun();
      break;
    case 2:
      await inputCookie();
      break;
    case 3:
      if (!setting.cookie) return;
      const w = await createWidget();
      w.presentMedium();
      break;
    case 4:
      if (!setting.cookie) return;
      const widget = await smallWidget();
      widget.presentSmall();
      break;
  }
};

const runWidget = async () => {
  if (config.runsInWidget && setting.cookie) {
    const widget = await (config.widgetFamily === 'medium' ? createWidget() : config.widgetFamily === 'small' ? smallWidget() : null);
    Script.setWidget(widget);
    Script.complete();
  } else {
    await presentMenu();
  }
};

/**-------------------------**/
const argsParam = async () => {
  const { mapUrl } = await getInfo();
  const action = {
    fortification_on: { speed, mapUrl, address },
    fortification_off: '锁定',
    acc_on: await getLastLocation(),
    acc_off: await getAddress()
  };
  return action[args.plainTexts[0]];
};

if (args?.plainTexts[0]) {
  return JSON.stringify(await argsParam(), null, 4);
}

await runWidget();