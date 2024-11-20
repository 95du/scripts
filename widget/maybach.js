// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: car;
const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'maybach');
const cache = fm.joinPath(mainPath, 'cache_path');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
if (!fm.fileExists(cache)) fm.createDirectory(cache);
const cacheFile = fm.joinPath(mainPath, 'setting.json')

const repo = 'https://raw.githubusercontent.com/95du/scripts/master';

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
  const codeString = await new Request(`${repo}/widget/maybach.js`).loadString();
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
  if (response.status === '1') {
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
  const maybach = Array.from({ length: 9 }, (_, index) => `${repo}/img/car/Maybach-${index}.png`);
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
  const mapPicUrl = `https://restapi.amap.com/v3/staticmap?&key=a35a9538433a183718ce973382012f55&zoom=14&size=450*300&markers=-1,https://raw.githubusercontent.com/95du/scripts/master/img/car/locating_0.png,0:${longitude},${latitude}`;
  // 推送到微信
  try {
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
  } catch (e) {
    console.log('推送微信' + e);
  }
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
  
  const carLogo = await getCacheData('maybachLogo.png', `${repo}/img/car/maybachLogo.png`);
  
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
  return { mapUrl, carLogo, speed, addressStr, fullTime, parkingTime, state, status, json };
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
    const url = `https://restapi.amap.com/v3/staticmap?key=a35a9538433a183718ce973382012f55&zoom=13&size=240*240&markers=-1,https://raw.githubusercontent.com/95du/scripts/master/img/car/locating_0.png,0:${longitude},${latitude}`;
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

// 封装 canvas 初始化的过程
const setupCanvas = (() => {
  const canvSize = 185;
  const canvWidth = 15;
  const canvRadius = 72;
  
  const canvas = new DrawContext();
  canvas.opaque = false;
  canvas.respectScreenScale = true;
  canvas.size = new Size(canvSize, canvSize);
  
  return { canvas, canvSize, canvWidth, canvRadius };
});

// 绘制半圆弧进度
const drawArc = (ctr, radius, startAngle, endAngle, color, canvas, canvWidth) => {
  for (let t = startAngle; t <= endAngle; t += Math.PI / 180) {
    const x = ctr.x + radius * Math.cos(t) - canvWidth / 2;
    const y = ctr.y + radius * Math.sin(t) - canvWidth / 2;
    const rect = new Rect(x, y, canvWidth, canvWidth);
    canvas.setFillColor(color);
    canvas.fillEllipse(rect);
  }
};

// 绘制刻度
const drawTickMarks = (radius, color, startBgAngle, totalBgAngle, ctr, canvas) => {
  const tickRadius = radius - 10;
  const tickLength = 4;

  const totalTicks = 20;
  for (let i = 0; i <= totalTicks; i++) {
    const t = i / totalTicks;
    const angle = startBgAngle + totalBgAngle * t;
    const x1 = ctr.x + tickRadius * Math.cos(angle);
    const y1 = ctr.y + tickRadius * Math.sin(angle);
    const x2 = ctr.x + (tickRadius - tickLength) * Math.cos(angle);
    const y2 = ctr.y + (tickRadius - tickLength) * Math.sin(angle);

    const path = new Path();
    path.move(new Point(x1, y1));
    path.addLine(new Point(x2, y2));

    canvas.setStrokeColor(color);
    canvas.setLineWidth(1)
    canvas.addPath(path);
    canvas.strokePath();
  }
};

const drawArcBackground = (canvas, ctr, radius, startAngle, endAngle, fillColor, canvWidth) => {
  const path = new Path();
  const x = ctr.x + radius * Math.cos(startAngle);
  const y = ctr.y + radius * Math.sin(startAngle);
  path.move(new Point(x, y));

  for (let i = 1; i <= 100; i++) {
    const t = i / 100;
    const angle = startAngle + (endAngle - startAngle) * t;
    const x = ctr.x + radius * Math.cos(angle);
    const y = ctr.y + radius * Math.sin(angle);
    path.addLine(new Point(x, y));
  }

  canvas.setStrokeColor(fillColor);
  canvas.setLineWidth(canvWidth);
  canvas.addPath(path);
  canvas.strokePath();
  
  // 绘制连接圆角的下半圆  
  const endX = ctr.x + radius * Math.cos(endAngle);
  const endY = ctr.y + radius * Math.sin(endAngle);
  
  const lowerHalfCircleRadius = canvWidth / 2;
  const lowerHalfCircleX = endX;
  const lowerHalfCircleY = endY;
  
  // 下半圆起点角度调整为 200 度，转换为弧度
  const lowerHalfCircleStartAngle = 19.2 * (Math.PI / 180); // 起点为 200 度
  const lowerHalfCircleEndAngle = lowerHalfCircleStartAngle + Math.PI; // 下半圆从 200 度绘制半圆
  
  const pathHalfCircle = new Path();
  for (let i = 0; i <= 100; i++) {
    const t = i / 100;
    const angle = lowerHalfCircleStartAngle + (lowerHalfCircleEndAngle - lowerHalfCircleStartAngle) * t;
    const x = lowerHalfCircleX + lowerHalfCircleRadius * Math.cos(angle);
    const y = lowerHalfCircleY + lowerHalfCircleRadius * Math.sin(angle);
    if (i === 0) {
      pathHalfCircle.move(new Point(x, y));
    } else {
      pathHalfCircle.addLine(new Point(x, y));
    }
  }
  
  canvas.setFillColor(fillColor);
  canvas.addPath(pathHalfCircle);
  canvas.fillPath();
};

// 封装进度条绘制的函数
const drawSpeedArc = async (speed, progressColor) => {
  const { canvas, canvSize, canvWidth, canvRadius } = setupCanvas();
  
  const ctr = new Point(canvSize / 2, canvSize / 2);
  const startAngle = 160 * (Math.PI / 180); // 转换为弧度
  const endAngle = startAngle + (220 * Math.PI / 180); // 终点角度为 200°
  
  // 限制 speed 值范围在 0-200
  const clampedSpeed = Math.min(Math.max(speed, 0), 200);  
  const centrePoint = speed === 100 ? 210 : 200;
  const progressAngle = startAngle + ((clampedSpeed / centrePoint) * (endAngle - startAngle));

  // 绘制背景和进度条
  drawArcBackground(canvas, ctr, canvRadius, startAngle, endAngle, new Color(progressColor, 0.18), canvWidth);
  drawArc(ctr, canvRadius, startAngle, progressAngle, new Color(progressColor), canvas, canvWidth);
  
  // 添加刻度线
  const startBgAngle = startAngle;
  const totalBgAngle = endAngle - startAngle;
  drawTickMarks(canvRadius, new Color(progressColor, 0.5), startBgAngle, totalBgAngle, ctr, canvas);

  // 绘制文字
  const textSize = 28;
  const speedColor = Device.isUsingDarkAppearance() ? Color.white() : Color.black();
  const speedFont = Font.boldSystemFont(textSize);
  
  const textRect = new Rect(0, 55, canvSize, textSize);
  canvas.setTextAlignedCenter();
  canvas.setTextColor(speedColor);
  canvas.setFont(speedFont);
  canvas.drawTextInRect(`${speed}`, textRect);
  
  // 在速度文字下方添加 "km/h"
  const unitSize = 18;
  const unitColor = new Color(Device.isUsingDarkAppearance() ? 'FFFFFF' : '000000', 0.7);
  const unitFont = Font.systemFont(unitSize);
  
  const unitRect = new Rect(0, 90, canvSize, unitSize);
  canvas.setTextColor(unitColor);
  canvas.setFont(unitFont);
  canvas.drawTextInRect('km·h', unitRect);
  
  return canvas.getImage();
};

// 设置小部件
const setupWidget = async () => {
  const { speed, parkingTime, mapUrl } = await getInfo();
  const progressColor = speed <= 50 ? "#FF9500" : speed <= 100 ? '#A73BC6' : 'FF0000';
  
  const widget = new ListWidget();
  widget.setPadding(3, 0, 0, 0);
  
  const stack = widget.addStack();
  stack.layoutHorizontally();
  stack.setPadding(0, 0, -50, 0);
  stack.addSpacer()
  const halfCircleImage = await drawSpeedArc(speed, progressColor);
  stack.addImage(halfCircleImage);
  stack.addSpacer()
  
  const mediumStack = widget.addStack();
  mediumStack.layoutHorizontally();
  mediumStack.addSpacer();
  
  const dateText = mediumStack.addText(parkingTime);
  dateText.font = Font.mediumSystemFont(13.5);
  dateText.textOpacity = 0.75
  mediumStack.addSpacer();
  widget.addSpacer(3);
  
  const buttonStack = widget.addStack();
  buttonStack.layoutHorizontally();
  buttonStack.addSpacer();
  
  const barStack = buttonStack.addStack();
  barStack.size = new Size(120, 30);
  barStack.setPadding(7, 12, 7, 12);
  barStack.cornerRadius = 9
  barStack.backgroundColor = new Color('#8C7CFF', 0.4);
  
  const statusText = barStack.addText(speed <= 5 ? '车辆静止中' : '车辆正在行驶');
  statusText.font = Font.boldSystemFont(14);
  statusText.centerAlignText();
  statusText.textOpacity = 0.85
  buttonStack.addSpacer();
  widget.addSpacer();
  
  widget.url = mapUrl;
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
      const widget = await setupWidget();
      widget.presentSmall();
      break;
  }
};

const runWidget = async () => {
  if (config.runsInWidget && setting.cookie) {
    const family = config.widgetFamily;
    const param = args.widgetParameter;
    let widget;

    if (family === 'medium') {
      widget = await createWidget();
    } else if (param == 1) {
      widget = await setupWidget();
    } else if (family === 'small') {
      widget = await smallWidget();
    };
    
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 15);
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