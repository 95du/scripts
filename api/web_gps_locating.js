// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: car;
/**
 * 组件作者: 95du茅台
 * 组件版本: Version 1.1.0
 * 更新日期: 2024-10-24
 * 模拟电子围栏，显示车速，位置等
 */

async function main() {
  const uri = Script.name();
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_GPS');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr, cacheCar] = [
    'setting.json',
    'cache_image',
    'cache_string',
    'cache_vehicle'
  ].map(getCachePath);
  
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const getSettings = (file) => {
    let setting = {};
    if (fm.fileExists(file)) {
      return { imei, password, token, run, coordinates, pushTime, imgArr, picture, aMapkey, tokenUrl, touser, agentid, interval, endAddr, carImg, carTop, carBot } = JSON.parse(fm.readString(file));
    }
    return {}
  }
  const setting = await getSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (inObject) => {
    fm.writeString(settingPath, JSON.stringify(inObject, null, 2));
    console.log(JSON.stringify(
      inObject, null, 2
    ));
  }
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImagePath = () => {
    const bgImgPath = fm.joinPath(fm.documentsDirectory(), '95duBackground');
    return fm.joinPath(bgImgPath, Script.name() + '.jpg');
  };
  
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage()
  };
  
  /**
   * 弹出一个通知  
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */
  const notify = (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'piano_success', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  /**
   * 获取远程图片
   * @returns {image} - image
   */
  const getImage = async (url) => {
    return await new Request(url).loadImage();
  };
  
  /**
   * 获取车辆图片并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  const downloadCarImage = async (item) => {
    const carImage = await getImage(item);
    const imgName = decodeURIComponent(item.substring(item.lastIndexOf("/") + 1));
    const cachePath = fm.joinPath(cacheCar, imgName);
    await fm.writeImage(cachePath, carImage, { overwrite: true });
    imgArr.push(imgName);
    if (imgArr.length > 8) {
      writeSettings(setting);
    }
  };
  
  const loadPicture = async () => {
    if (!imgArr?.length) {
      const maybach = Array.from({ length: 9 }, (_, index) => `https://raw.githubusercontent.com/95du/scripts/master/img/car/Maybach-${index}.png`);
      maybach.forEach(async (item) => await downloadCarImage(item));
    }
  };
  
  /**
   * 随机获取缓存图片
   * @param {image} file
   */
 async function getRandomImage() {
    const count = imgArr.length;
    const index = Math.floor(Math.random() * count);
    const cacheImgPath = cacheCar + '/' + imgArr[index];
    return await fm.readImage(cacheImgPath);
  };
  
  /**  
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const useFileManager = () => {
    const fullPath = (name) => fm.joinPath(cacheImg, name);
    return {
      readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
      writeImage: (name, image) => fm.writeImage(fullPath(name), image)
    }
  };
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
  
  /**
   * 获取地理位置信息
   * @param {string} token
   * @param {number} longitude - 经度
   * @param {number} latitude - 纬度
   * @returns {object} - 地理位置信息的对象，包含地址、停车时间等属性
   */
  const makeRequest = async (url, params) => {
    try {
      const body = Object.entries(params).map(([key, value]) => `${key}=${value}`).join('&');
      const req = new Request(url);
      req.method = 'POST';
      req.body = body;
      return await req.loadJSON();
    } catch (e) {
      console.log(e + url);
    }
  };
    
  const fetchToken = async () => {
    const url = 'https://app.tutuiot.com/locator-app/imeiLoginVerification';
    const params = { imei, password };
    const { code, data } = await makeRequest(url, params);
    if (code === 0) {
      setting.token = data.token;
      writeSettings(setting);
      notify('登录成功', !aMapkey ? '需填写高德地图Web服务API，用于转换坐标。' : data.token);  
    } else {
      notify('登录失败', '账号或密码错误，无法获取数据。');
    };
  };
  
  // Hourly writeSettings(setting)  
  const againWrite = (data) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDiffer = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (data && timeDiffer >= 5) {
      setting.data = data;
      writeSettings(setting);
    }
  };
  
  const processData = (data) => {
    if (data.list?.length) againWrite(data);
    const trackSegment = (data.list?.length) ? data?.list[0] : setting.data?.list[0];
    if (trackSegment) {
      return { deviceName, endAddr, updateTime, totalTime, endTime, mileage, highestSpeed, averageSpeed, endLongitude, endLatitude } = trackSegment;
    } else {
      deviceName = setting.myPlate;
      endAddr = '暂时未获取到地址，新设备无行车/位置记录。注: 行车记录仅保存三天';
      updateTime = '2024-03-29 10:00'
      mileage = '0.00'
      highestSpeed = 0
    }
  };
  
  // 获取行车轨迹
  const getTrackSegment = async () => {
    const url = 'https://app.tutuiot.com/locator-app/es/getTrackSegment';
    const params = { imeis: imei, page: 1, pageSize: 1, token };
    const { code, data } = await makeRequest(url, params);
    if (code === 0) {
      processData(data);
    } else {
      await fetchToken();
    }
  };
  
  // 获取行驶速度
  const getSpeed = async () => {
    const url = 'https://app.tutuiot.com/locator-app/redis/getGps';
    const params = { imei, coorType: 'wgs84', token };
    const { code, data } = await makeRequest(url, params);
    if (code === 0) {
      return { speed, chargeState, percentageElectricQuantity } = data;  
    } else {
      await fetchToken();
    }
  };
  
  // 百度地图转换高德地图，获取经纬度
  const getMapUrl = async () => {
    try {
      const conversion = new Request(`https://restapi.amap.com/v3/assistant/coordinate/convert?coordsys=gps&output=json&key=${aMapkey}&locations=${endLongitude},${endLatitude}`);
      const convert = await conversion.loadJSON();
      const locations = convert.locations.split(",");
      return { 
        longitude: Number(locations[0]).toFixed(6),
        latitude: Number(locations[1]).toFixed(6)
      }
    } catch (e) {
      console.log(e + '242行\n');
      return {
        longitude: 116.484828,
        latitude: 39.948585
      }
    }
  };
  
  /**--------获取所有信息---------**/
  const info = await Promise.all([loadPicture(), getTrackSegment(), getSpeed()]);
    
  const { longitude, latitude } = await getMapUrl();
  const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(deviceName)}&ll=${latitude},${longitude}&t=m`;
  
  const [ state, status ] = speed <= 5 ? ['已静止', '[ 车辆静止中 ]'] : [`${speed} km·h`, `[ 车速 ${speed} km·h ]`];
  
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  
  const GMT = updateTime.match(/\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/)[0];
  const GMT2 = updateTime.match(/-(\d{2}-\d{2}\s\d{2}:\d{2})/)[1];

  const runObj = {
    ...setting,
    updateTime,
    endAddr,
    run: 'GPS',
    pushTime: Date.now(),
    parkingTime: GMT2,
    coordinates: `${longitude},${latitude}`
  };
  
  /**
   * 获取两点间驾车路线规划的距离
   * @returns {Promise<number>}
   */
  const getDistance = async () => {
    const fence = await new Request(`https://restapi.amap.com/v5/direction/driving?key=${aMapkey}&origin_type=0&strategy=38&origin=${coordinates}&destination=${longitude},${latitude}`).loadJSON();
    return { distance } = fence.route.paths[0];
  };
  
  /**
  * 推送消息到微信
  * @returns {Promise} Promise
  */
  const sendWechat = async (description, url, picurl) => {
    if (!setting.tokenUrl) return;
    const { access_token } = await new Request(tokenUrl).loadJSON();
    const request = new Request(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${access_token}`);
    request.method = 'POST'
    request.body = JSON.stringify({
      touser,
      agentid,
      msgtype: 'news',
      news: {
        articles: [{
          title: endAddr,
          picurl,
          url,
          description
        }]
      } // pushMessage to wiChat
    });
    console.log('信息已推送到微信');
    return request.loadJSON();
  };
  
  /**
   * Electronic Fence
   * 判断run为GPS触发电子围栏
   * @returns {Promise<void>}
   */
  const pushMessage = async (mapUrl, longitude, latitude, distance) => {
    const mapPicUrl = `https://restapi.amap.com/v3/staticmap?&key=${aMapkey}&zoom=14&size=450*300&markers=-1,https://raw.githubusercontent.com/95du/scripts/master/img/car/locating_0.png,0:${longitude},${latitude}`;
    
    const moment = Math.floor((Date.now() - pushTime) / (1000 * 60));
    const shouldNotify = moment >= 10 && distance > 20 && updateTime !== setting.updateTime;  
    const shouldNotifyStop = moment >= 240 && setting.updateTime === updateTime;
    const driveAway = shouldNotify ? `\n已离开📍${setting.endAddr}，相距 ${distance} 米` : '';

    const isStatus = (sta) => `${status}  ${sta} ${GMT + driveAway}`;
    
    // 车辆状态推送通知
    const send = async (sta) => {
      notify(`${status} ${GMT2}`, endAddr + driveAway, mapUrl);
      await sendWechat(isStatus(sta), mapUrl, mapPicUrl);
      writeSettings(runObj);
    };
    
    if (shouldNotify) {
      await send('启动时间');
    } else if (shouldNotifyStop) {
      await send('停车时间');
    } else if (updateTime !== setting.updateTime) {
      await send('更新时间');
    }
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImagePath();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 ? setting.gradient : [setting.rangeColor];
      const randomColor = color[Math.floor(Math.random() * color.length)];
      // 渐变角度
      const angle = setting.angle;
      const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
      const x = 0.5 + 0.5 * Math.cos(radianAngle);
      const y = 0.5 + 0.5 * Math.sin(radianAngle);
      gradient.startPoint = new Point(1 - x, y);
      gradient.endPoint = new Point(x, 1 - y);
      
      gradient.locations = [0, 1];
      gradient.colors = [
        new Color(randomColor, Number(setting.transparency)),
        new Color('#00000000')
      ];
      widget.backgroundGradient = gradient;  
      widget.backgroundColor = new Color(setting.solidColor);
    }
  };
  
  /**  
   * Create left stack
   * @param {image} SFSymbol
   * @param {string} text
   * Cylindrical Bar Chart
   */
  const addText = (stack, text, textColor, size, gap, iconName, iconColor) => {
    const newStack = stack.addStack();
    newStack.layoutHorizontally();
    newStack.centerAlignContent();
    
    if (iconName) {
      const iconSymbol = SFSymbol.named(iconName);
      const iconImage = newStack.addImage(iconSymbol.image);
      iconImage.imageSize = new Size(15, 15);
      if (iconColor) iconImage.tintColor = iconColor;
      newStack.addSpacer(6);
    };
  
    const textElement = newStack.addText(text);
    textElement.font = Font.mediumSystemFont(size);
    textElement.textColor = textColor
    if (size < 16) textElement.textOpacity = 0.8;
    if (gap) stack.addSpacer(gap);
  };
  
  // bar Stack
  const addBarStack = ({ stack, borderColor, iconName, iconColor, barText, textColor, textOpacity, gap, font }) => {
    const barStack = stack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    if (speed <= 5) barStack.size = new Size(88, 0);
    barStack.setPadding(3, 10, 3, 10);
    barStack.cornerRadius = 10;
    barStack.borderColor = borderColor;
    barStack.borderWidth = 2;
    
    if (iconName) {
      const barIcon = SFSymbol.named(iconName);
      const icon = barStack.addImage(barIcon.image);
      icon.imageSize = new Size(16, 16);
      icon.tintColor = iconColor;
      barStack.addSpacer(4);
    };
    
    const statusText = barStack.addText(barText);
    statusText.font = font;
    statusText.textColor = textColor;
    if (gap) stack.addSpacer(gap);
    barStack.url = 'amapuri://WatchFamily/myFamily';
    return barStack;
  };

  //=========> Create <=========//
  const createWidget = async () => {
    if (!setting.run) {
      writeSettings(runObj);
      await getRandomImage();
    };
    
    const widget = new ListWidget();
    await setBackground(widget);
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));

    widget.setPadding(10, 10, 10, 10)
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    mainStack.addSpacer();
    
    /**
     * Left Stack
     * @param {image} SFSymbol
     * @param {string} text
     * Cylindrical Bar Chart
     */
    const leftStack = mainStack.addStack();
    leftStack.size = new Size(setting.lrfeStackWidth, 0);
    leftStack.layoutVertically();
    leftStack.addSpacer(5);
    
    addText(leftStack, setting.myPlate ?? deviceName, new Color(setting.titleColor), 19.5, 3);
    addText(leftStack, GMT2, textColor, 13, 3, 'clock');
    addText(leftStack, `${mileage} km`, textColor, 13, 3, 'arrow.triangle.swap', Color.blue());
    addText(leftStack, `电量${percentageElectricQuantity}%`, textColor, 13, null, 'power', chargeState === 0 ? Color.red() : new Color('#00AD00'));
    leftStack.addSpacer();
    
    // Stack bar
    addBarStack({
      stack: leftStack,
      borderColor: new Color(speed <= 5 ? setting.topButton : '#FF1800', 0.75),  
      iconName: speed <= 5 ? 'location' : 'location.fill',
      iconColor: speed <= 5 ? new Color(setting.topButton) : Color.red(),
      barText: state,
      textColor: new Color(speed <= 5 ? setting.topButton : '#D50000'),  
      gap: 7,
      font: Font.mediumSystemFont(14)
    });
    
    addBarStack({
      stack: leftStack,
      borderColor: new Color(setting.botButton),
      barText: `${highestSpeed} km·h`,
      textColor: new Color(setting.botButton),
      font: Font.mediumSystemFont(14)
    });
  
    leftStack.addSpacer();
    
    /**
     * right Stack
     * @param {image} image
     * @param {string} address
     */
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    
    const logoStack = rightStack.addStack();
    logoStack.layoutHorizontally();
    logoStack.setPadding(2, 0, 0, 6);
    logoStack.addSpacer();
    
    const logoUrl = setting.logo || 'https://raw.githubusercontent.com/95du/scripts/master/img/car/maybachLogo.png';  
    const logoName = logoUrl.split('/').pop();
    const carLogo = await getCacheImage(logoName, logoUrl);
    const image = logoStack.addImage(carLogo);
    image.imageSize = new Size(27,27);
    image.tintColor = new Color(setting.logoColor);
    rightStack.addSpacer(1);
    
    // 车辆图片
    const carStack = rightStack.addStack();
    carStack.setPadding(carImg ? carTop : -25, 5, carImg ? carBot : 0, 0);
    carStack.size = new Size(setting.carStackWidth, 0);
    
    if (setting.carImg) {
      const name = setting.carImg.split('/').pop();
      vehicleImg = await getCacheImage(name, setting.carImg);
    } else {
      vehicleImg = await getRandomImage() || fm.readImage(fm.joinPath(cacheCar, 'Maybach-8.png'));
    };
    
    const imageCar = carStack.addImage(vehicleImg);
    if (!carImg) imageCar.imageSize = new Size(setting.carStackWidth, 107);
    imageCar.url = 'scriptable:///run/' + encodeURIComponent(uri);
    rightStack.addSpacer();
    
    const adrStack = rightStack.addStack();
    adrStack.setPadding(-6, 0, 0, 0);
    adrStack.centerAlignContent();
    adrStack.size = new Size(setting.bottomSize, 30);
    
    const strLength = endAddr.replace(/[\u0391-\uFFE5]/g, "@@").length;
    if (strLength <= 35) {
      addressText = adrStack.addText(endAddr + ' - 当前位置属乡村、高速路或无名路段 🚫');
    } else {
      addressText = adrStack.addText(endAddr);
    };
    
    addressText.font = Font.mediumSystemFont(11);
    addressText.centerAlignText();
    addressText.textColor = textColor;
    addressText.textOpacity = 0.75;
    addressText.url = mapUrl;
    
    if (coordinates && aMapkey) {
      const { distance } = await getDistance();
      await pushMessage(mapUrl, longitude, latitude, distance);
    };
    
    return widget;
  };
  
  // 创建小号组件
  createSmallWidget = async () => {
    const widget = new ListWidget();
    widget.backgroundImage = await getImage(`https://restapi.amap.com/v3/staticmap?&key=${aMapkey}&zoom=13&size=240*240&markers=-1,https://raw.githubusercontent.com/95du/scripts/master/img/car/locating_0.png,0:${longitude},${latitude}`);
    widget.url = mapUrl;
    return widget;
  }
  
  const createError = async () => {
    const widget = new ListWidget();
    widget.backgroundColor = Color.white();
    const gradient = new LinearGradient();
    gradient.locations = [0, 1];
    gradient.colors = [
      new Color("#99CCCC", 0.5),
      new Color('#00000000')
    ];
    widget.backgroundGradient = gradient;  
    
    widget.setPadding(10, 20, 30, 10)
    const mainStack = widget.addStack();
    mainStack.addSpacer();
    
    const cacheMaybach = fm.joinPath(cacheCar, 'Maybach-8.png');
    const vehicleImg = fm.readImage(cacheMaybach);
    const widgetImg = mainStack.addImage(vehicleImg);
    widgetImg.imageSize = new Size(400, 150);
    mainStack.addSpacer();
    
    return widget;
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中小尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    return widget;
  };
  
  const runWidget = async () => {
    const isMediumWidget = config.runsInApp || config.widgetFamily === 'medium';
    try {
      const widget = await (isMediumWidget ? createWidget() : config.widgetFamily === 'small' ? createSmallWidget() : createErrorWidget());
      if (!config.runsInWidget) {  
        await widget.presentMedium();
      } else {
        Script.setWidget(widget);
        Script.complete();
      };
    } catch (e) {
      console.log(e)
      isMediumWidget ? await createError() : createErrorWidget();
    }
  }
  await runWidget();
};
module.exports = { main }