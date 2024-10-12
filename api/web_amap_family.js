// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: user;
/**
 * 脚本名称: 高德家人地图
 * 组件作者：95度茅台
 * 组件版本: Version 1.0.0
 * 更新日期: 2024-03-20
 */


async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_amap_family');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string'
  ].map(getCachePath);
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const getSettings = (file) => {
    return fm.fileExists(file) ? { selected, url, cookie, body } = JSON.parse(fm.readString(file)) : {}
  };
  const setting = getSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
    console.log(JSON.stringify(
      setting, null, 2
    ));
  };
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage();
  };
  
  const useFileManager = () => {
    const fullPath = (name) => fm.joinPath(cacheImg, name);
    return {
      readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
      writeImage: (name, image) => fm.writeImage(fullPath(name), image)
    };
  };
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
  
  const notify = (title, body) => {
    const n = Object.assign(new Notification(), { title, body });
    n.schedule();
  };
  
  // 随机数组
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;
  
  // 格式化地址
  const getAddress = async (longitude, latitudes) => {
    try {
      const url = `http://restapi.amap.com/v3/geocode/regeo?key=${setting.amapKey}&s=rsv3&radius=500&extensions=all&location=${longitude},${latitudes}`;
  
      const fetchData = async () => await new Request(url).loadJSON();
      const { regeocode: { roads, addressComponent } } = await fetchData(url);
      const types = ['name', 'direction', 'distance'];
      const res = {};
      for (const type of types) {
        res[type] = roads.reduce((min, current) => parseFloat(min.distance) < parseFloat(current.distance) ? min : current)[type] || '';
      };
      const address = `${addressComponent.city}·${res.name}${res.direction}${Math.floor(res.distance) || 10}米`;
      return address;
    } catch (e) {
      console.log(e);
      return '高德地图Web端API错误';
    }
  };
  
  const getQQaddress = async (longitude, latitudes) => {
    try {
      const url = `https://apis.map.qq.com/ws/geocoder/v1/?coord_type=5&get_poi=0&output=json&key=${setting.qqKey}&location=${latitudes},${longitude}`;
  
      const fetchData = async () => await new Request(url).loadJSON();
      const { result: { address_component } } = await fetchData(url);
      const address = `${address_component.city}·${address_component.street}`;
      return address;
    } catch (e) {
      console.log(e);
      return '腾讯地图KEY错误';
    }
  };
  
  /**
   * Get boxjs Data
   * Dependency: Quantumult-X / Surge
   */
  const fetchData = async (key) => {
    try {
      const response = await new Request(`http://boxjs.com/query/data/${key}`).loadJSON();
      return response?.val || null;
    } catch (e) {
      notify('获取 Boxjs 数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
      return null;
    }
  };
  
  const getBoxjsData = async () => {
    const keys = [
      'amap_family_info_url',
      'amap_family_info_cookie',
      'amap_family_info_body'
    ];
    const data = {};
    for (const key of keys) {
      const value = await fetchData(key);
      if (!value) return null;
      const modifiedKey = key.replace('amap_family_info_', '');
      data[modifiedKey] = value;
    }
    return data;
  };
  
  const requestBoxjs = async () => {
    if (!setting.url || !setting.cookie || !setting.body) {
      const { url, cookie, body } = await getBoxjsData();
      writeSettings({ ...setting, url, cookie, body });
      return await httpsRequest(url, cookie, body);
    }
  };
  
  // 获取健康达人
  const sportRequest = async (sportUrl) => {
    const headers = {
      'Content-Type': 'application/json; charset=utf-8',
      Cookie: cookie
    };
    const options = {
      method: 'POST',
      headers
    };
    
    try {
      const response = await Object.assign(new Request(sportUrl), options).loadJSON();
      return response.data;
    } catch (error) {
      return {};
    }
  };
  
  // 健康达人 Boxjs
  const getSportUrl = async () => {
    const key = 'amap_family_sport_url';
    const value = await fetchData(key);
    setting.health = value;
    writeSettings(setting);
    return value;
  };
  
  // Hourly writeSettings(setting)  
  const againWrite = (res) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (timeDifference >= 5) {
      setting.data = res.data;
      writeSettings(setting);
    }
  };
  
  // 初始化数据
  const initial = (res) => {
    if (!setting.values.length) {
      const values = res.data.memberInfoList.map((obj, index) => ({
        label: obj.tnn,
        value: index,
        uid: obj.uid,
        joinTime: obj.joinTime
      }));
      setting.data = res.data;
      setting.values = values;
      writeSettings(setting);        
    }
  };
  
  // 请求数据  
  const httpsRequest = async (url, cookie, body) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      Cookie: cookie
    };
  
    const options = { method: 'POST', headers, body };
    const response = await Object.assign(new Request(url), options).loadJSON();
  
    if (response.code === 1) {
      initial(response);
      againWrite(response);
      return response.data;
    } else {
      console.log(response);
      return null;
    }
  };
  
  // 格式化日期
  const getFormattedTime = (timestamp) => {
    const timeDiff = Date.now() - timestamp;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const yearsDiff = new Date(timeDiff).getFullYear() - 1970;
    const format = yearsDiff > 0 
      ? 'yyyy-MM-dd HH:mm' 
      : daysDiff > 0 
      ? 'MM-dd HH:mm' 
      : 'HH:mm';
    const dateFormatter = new DateFormatter();
    dateFormatter.dateFormat = format;
    return dateFormatter.string(new Date(timestamp));
  };
  
  // 电量颜色
  const getIconAndColor = (battery, charging) => {
    const percentage = Math.round(battery / 25) * 25;
    const symbol = charging ? 'battery.100.bolt' : `battery.${percentage}`;
    const battColor = battery <= 10 ? new Color('#FF3800') : battery <= 30 ? new Color("#F7B500") : Color.green();
    return { symbol, battColor };
  };
  
  const leftTextColor = Color.dynamic(new Color(setting.leftLightText), new Color(setting.leftNightText));
  
  const rightTextColor = Color.dynamic(new Color(setting.rightLightText), new Color(setting.rightNightText));
  
  // 进度
  const creatProgress = (total = 12, havegone, width, height) => {
    const radius = height / 2;
    
    const context = new DrawContext();
    context.size = new Size(width, height);
    context.opaque = false
    context.respectScreenScale = true
    context.setFillColor(new Color('#00C500'));
    
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, width, height), radius, radius);
    context.addPath(path);
    context.fillPath();
    context.setFillColor(
      Color.blue()
    );
    
    const path1 = new Path();
    path1.addRoundedRect(new Rect(0, 0, width * havegone / total, height), radius, radius)
    context.addPath(path1);
    context.fillPath();
    return context.getImage();
  };

  // 添加进度条
  const addProgress = (leftStack, total, haveGone) => {
    const width = setting.progressWidth || 175;
    const height = 3.8
    
    const percStack = leftStack.addStack();
    percStack.layoutHorizontally();
    percStack.centerAlignContent();
    percStack.addSpacer(5);
    
    const percentText = percStack.addText(`${haveGone}`);
    percentText.font = Font.mediumSystemFont(13);
    percentText.textColor = leftTextColor;
    percentText.textOpacity = 0.65;
    percStack.addSpacer();
    
    const progressImg = creatProgress(total, haveGone, width, height);
    const progress = percStack.addImage(progressImg);
    progress.centerAlignImage();
    progress.imageSize = new Size(width, height);
    percStack.addSpacer();
    
    const totalText = percStack.addText(total.toString());
    totalText.font = Font.mediumSystemFont(13);
    totalText.textColor = leftTextColor;
    totalText.textOpacity = 0.65;
  };
  
  // 添加左侧底部
  const addLeftText = (leftStack, iconName, iconColor, text, color, update_time) => {
    const stack = leftStack.addStack();
    stack.layoutHorizontally();
    stack.centerAlignContent();
    
    const iconSymb = SFSymbol.named(iconName);
    const iconImage = stack.addImage(iconSymb.image);
    iconImage.imageSize = new Size(17, 17);
    iconImage.tintColor = iconColor;
    stack.addSpacer(8);
    
    const leftText = stack.addText(text);
    leftText.font = Font.mediumSystemFont(12);
    leftText.leftAlignText();
    
    if (color) {
      leftText.textColor = color;
      const timeText = stack.addText(update_time);
      timeText.font = Font.mediumSystemFont(13);
      timeText.textColor = color;
      leftStack.addSpacer(3);
    } else {
      leftText.textOpacity = 0.75
      leftText.textColor = leftTextColor;
    }
  };
  
  // 添加右侧容器
  const addText = async (stack, iconName, iconColor, text, size, isLast) => {
    stack.size = new Size(113, 0);
    stack.setPadding(16, 12, 13, 15);
    stack.layoutVertically();
    
    const newStack = stack.addStack();
    newStack.size = new Size(0, 22);
    newStack.layoutHorizontally();
    newStack.centerAlignContent();
    
    let iconImage;
    if (iconName && iconName.startsWith('http')) {
      const name = iconName.split('/').pop();
      const icon = await getCacheImage(name, iconName);
      iconImage = newStack.addImage(icon);
    } else {
      const iconSymbol = SFSymbol.named(iconName);
      iconImage = newStack.addImage(iconSymbol.image);
      if (iconColor) iconImage.tintColor = iconColor;
    };
    
    iconImage.imageSize = new Size(25, 22);
    newStack.addSpacer(8);
    
    const textElement = newStack.addText(`${text}`)
    textElement.font = Font.mediumSystemFont(size);
    textElement.textColor = rightTextColor;
    textElement.textOpacity = 0.78;
    if (!isLast) stack.addSpacer();
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImage();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else {
      widget.backgroundColor = Color.dynamic(Color.white(), new Color('#000000'));
    }
  };
  
  // 创建中号组件
  const createWidget = async () => {
    const initData = await requestBoxjs();
    const { memberInfoList } = initData ? initData : await httpsRequest(url, cookie, body);
    
    const randomNum = Math.floor(Math.random() * memberInfoList?.length);
    const { tnn, locInfo, dayTripAllow, locAllow, locAllowV2, charging, deviceInfo, stepCount = 0, battery = 0, imgUrl, weather = {}, online } = memberInfoList[selected === 'random' ? randomNum : selected];

    // 细分数据
    const { updateTime = Date.now(), lon, lat, name } = locInfo || {};
    
    const { temp = '~~~', icon  = 'cloud.sun.rain.fill' } = weather;
    
    const { manu, appLocAuth, dev, ver } = JSON.parse(deviceInfo);
    const appLocationAuth = `${manu}·应用定位权限: ${appLocAuth === 2 ? '已关闭' : '已开启'}`;
    const device = dev.length < 17 ? `${dev} · ${ver}` : dev;
    
    const locAllowV2Text = ['关闭', '始终'][locAllowV2] || '共享';
    const eyeIcon = locAllowV2 === 0 ? 'eye.slash.fill' : 'eye.fill';
    
    const { symbol, battColor } = getIconAndColor(battery, charging);
    
    const sportIcon = await getRandomItem([ 'figure.run', 'figure.walk' ]);
    
    // 转换长地址
    const family_address = locInfo && setting.amapKey 
      ? await getAddress(lon, lat) 
      : setting.qqKey 
      ? await getQQaddress(lon, lat) 
      : (name ?? '已关闭·位置暂时无法获取');
    
    // 组件实例
    const widget = new ListWidget();
    widget.setPadding(0, 0, 0, 0);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.setPadding(15, 15 + 1, 15, 15);
    
    const avaStack = leftStack.addStack();
    avaStack.setPadding(0, 0, 0, -2);
    avaStack.layoutHorizontally();
    avaStack.centerAlignContent();
    
    const avatarStack = avaStack.addStack();
    const imgUrlName = imgUrl.split('/').pop();
    const iconSymbol = await getCacheImage(imgUrlName, imgUrl);
    const avatarIcon = avatarStack.addImage(iconSymbol);
    avatarIcon.imageSize = new Size(46, 46);
    avatarStack.cornerRadius = setting.radius || 50;
    avatarStack.borderWidth = setting.borderWidth || 1;
    avatarStack.borderColor = new Color(setting.borderColor || '#ddd');
    avaStack.addSpacer(10);
    
    const topStack = avaStack.addStack();
    topStack.layoutVertically();
    
    const nameStack = topStack.addStack();
    nameStack.layoutHorizontally();
    nameStack.centerAlignContent();
    
    const nameText = nameStack.addText(tnn);
    nameText.textColor = leftTextColor;
    nameText.font = Font.mediumSystemFont(20);
    nameStack.addSpacer(8);
    
    const staStack = nameStack.addStack();
    staStack.backgroundColor = new Color(online ? '#00C500' : '#666');
    staStack.setPadding(2, 6, 2, 6);
    staStack.cornerRadius = 5
    
    const statusText = staStack.addText(online ? '在线' : '离线');
    statusText.font = Font.boldSystemFont(13);
    statusText.textColor = online ? Color.white() : new Color('#EDEDED')
    
    if (dayTripAllow > 0 && setting.dayTripAllow) {
      nameStack.addSpacer();
      const tripIcon = SFSymbol.named('arrow.triangle.swap')
      const iconImage = nameStack.addImage(tripIcon.image);
      iconImage.imageSize = new Size(23, 23);
      iconImage.tintColor = Color.blue();
    }
    topStack.addSpacer(3);
    
    const deviceText = topStack.addText(device);
    deviceText.font = Font.systemFont(14);
    deviceText.textColor = leftTextColor;
    deviceText.textOpacity = 0.7;
    leftStack.addSpacer(6);
    
    addProgress(leftStack, 12, memberInfoList.length);
    leftStack.addSpacer();
    
    const formattedTime = getFormattedTime(updateTime);
    addLeftText(leftStack, 'arrow.triangle.2.circlepath', Color.orange(), '更新于·', Color.blue(), formattedTime);
    addLeftText(leftStack, 'mappin', null, family_address);
    leftStack.addSpacer(3); // 间隔
    addLeftText(leftStack, 'location.fill', Color.blue(), appLocationAuth);
    
    // 右侧容器
    const rightStack = mainStack.addStack();
    rightStack.backgroundColor = Color.dynamic(new Color(setting.rightStack), new Color('#2C2C2C'))
    rightStack.url = 'amapuri://WatchFamily/myFamily';
    
    await addText(rightStack, icon, null, temp, 15);
    addText(rightStack, sportIcon, new Color('#BD6AF6'), stepCount, 15);
    addText(rightStack, symbol, battColor, `${battery}%`, 15)
    await addText(rightStack, eyeIcon, new Color(locAllowV2 === 0 ? '#FF5C3E' : '#63BA25'), locAllowV2Text, 14, true);

    return widget;
  };
  
  // 机型尺寸
  const getLayout = (scr = Device.screenSize().height) => ({
    stackSize: scr < 926 ? 35 : 37,
    iconSize: scr < 926 ? 23 : 25,
    padding: scr < 926 ? 2 : 3,
    titleSize: scr < 926 ? 18 : 20,
    textSize: scr < 926 ? 11 : 11.5
  });
  
  // 添加到 widget
  const addVertical = async (mainStack, iconName, iconColor, title, text, gap) => {  
    const rowStavk = mainStack.addStack();
    rowStavk.layoutHorizontally();
    rowStavk.centerAlignContent();
    
    const iconStack = rowStavk.addStack();
    const lay = getLayout();
    const iconBg = setting.iconBg;
    const iconSize = iconBg ? lay.iconSize : lay.stackSize;

    if (iconBg) {
      iconStack.layoutHorizontally();
      iconStack.centerAlignContent();
      iconStack.size = new Size(lay.stackSize, lay.stackSize);
      if (gap) iconStack.setPadding(lay.padding, 0, 0, 0);
      iconStack.cornerRadius = 50;
      iconStack.backgroundColor = iconColor;
    };
    
    const iconSymbol = SFSymbol.named(iconName);
    const iconImage = iconStack.addImage(iconSymbol.image);
    iconImage.tintColor = iconBg ? Color.white() : iconColor;
    iconImage.imageSize = new Size(iconSize, iconSize);
    rowStavk.addSpacer(10);
    
    const verticalStack = rowStavk.addStack();
    verticalStack.layoutVertically();
    
    const titleText = verticalStack.addText(String(title));
    titleText.font = Font.mediumSystemFont(lay.titleSize);
    titleText.textColor = iconColor;
    
    const subtitleText = verticalStack.addText(text);
    subtitleText.font = Font.mediumSystemFont(lay.textSize);
    subtitleText.textColor = leftTextColor;
    subtitleText.textOpacity = 0.65
  
    if (!gap) mainStack.addSpacer();
    return rowStavk;
  };
  
  // 创建小号组件
  const createSmall = async () => {
    const url = !setting.health ? await getSportUrl() : setting.health;
    const { steps = 0, cal = 0, sportTime = 0 } = (await sportRequest(url)).familyInfo || {};
    
    const widget = new ListWidget();
    widget.url = 'amapuri://ajx_sports_health/SportIndex?from=shortcut&route=SportBeforeNavi&fromshortcut=1&version_shortcut=1';
    
    const mainStack = widget.addStack();
    mainStack.setPadding(0, 0, 0, 0);
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const horStack = mainStack.addStack();
    horStack.layoutVertically();
    
    addVertical(horStack, 'shoeprints.fill', Color.green(), steps, '今日步数 (步)');
    addVertical(horStack, 'flame.fill', new Color('#FE4904'), cal, '热量消耗 (卡)');
    addVertical(horStack, 'bolt.heart.fill', Color.orange(), sportTime, '运动时间 (分)', true);

    mainStack.addSpacer();
    return widget;
  };
  
  const runWidget = async () => {
    const familyWidget = config.widgetFamily;
    const widget = await (
      familyWidget === 'medium' || config.runsInApp ? createWidget() : 
      familyWidget === 'small' ? createSmall() : null
    );
    
    await setBackground(widget);
    if (setting.alwaysDark) widget.backgroundColor = new Color('#000000');
    
    if (config.runsInApp) {
      await widget.presentMedium();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
};
module.exports = { main }