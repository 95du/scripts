// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: car;
/**
 * 脚本名称: 交管12123
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.5
 * 更新日期: 2024-05-25
 */

async function main(family) {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_12123');
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';

  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr, cacheCar ] = [
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
    return fm.fileExists(file) ? { verifyToken, myPlate, sign, imgArr, useCache, setPadding, carImg, carTop, carBot, carLead, carTra } = JSON.parse(fm.readString(file)) : {}
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
  
  /**
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */
  const notify = (title, body, url, opts = {}) => {
    if (!setting.notify) return;
    const n = Object.assign(new Notification(), { title, body, sound: 'piano_', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  /**
   * 阴影图片
   * @param {Image} img 要处理的图片
   * @returns {Promise<Image>}
   */
  async function shadowImage(img) {
    const ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage();
  };
  
  /**
   * Get boxjs Data
   * 依赖：Quantumult-X / Surge
   */
  const fetchData = async (key) => {
    try {
      const response = await new Request(`http://boxjs.com/query/data/${key}`).loadJSON();
      return { sign, verifyToken } = JSON.parse(response?.val) || {};
    } catch (e) {
      console.log('boxjs' + e);
      notify('Boxjs_数据获取失败 ⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
    }
  };
  
  const getBoxjsData = async () => {
    const { verifyToken, sign } = await fetchData('body_12123') || {};
    if (setting.sign !== sign) {
      writeSettings({ ...setting, sign, verifyToken });
    }
  };
  
  /**
   * 读取和写入缓存的文本和图片数据
   * @param {object} options
   * @param {number}  - number
   * @returns {object} - Object
   */
  const useFileManager = ({ cacheTime, type } = {}) => {
    const basePath = type ? cacheStr : cacheImg;
    return {
      read: (name) => {
        const path = fm.joinPath(basePath, name);
        if (fm.fileExists(path)) {
          if (hasExpired(path) > cacheTime || !useCache) {
            fm.remove(path);
          } else if (useCache) {
            return type ? JSON.parse(fm.readString(path)) : fm.readImage(path);
          }
        }
      },
      write: (name, content) => {
        const path = fm.joinPath(basePath, name);
        type ? fm.writeString(path, JSON.stringify(content)) : fm.writeImage(path, content);
      }
    };
  
    function hasExpired(filePath) {
      const createTime = fm.creationDate(filePath).getTime();
      return (Date.now() - createTime) / (60 * 60 * 1000);
    }
  };
  
  /**
   * 获取请求数据并缓存
   * @param {string} - string
   * @returns {image} - url
   */
  const getCacheData = async (name, url, type) => {
    const cache = useFileManager({ type });
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
    if (response) {
      cache.write(name, response);
    }
    return response;
  };
  
  const { apiUrl, productId, version, api0, api1, api2, api3, api4, api5, alipayUrl, statusUrl, queryDetailUrl, detailsUrl, maybach } = await getCacheData('api.json', `${rootUrl}/update/12123.json`, true);
  
  /**
   * 获取车辆图片并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  async function getRandomImage() {
    const count = imgArr.length;
    const index = Math.floor(Math.random() * count);
    const cacheCarPath = cacheCar + '/' + imgArr[index];
    return await fm.readImage(cacheCarPath);
  };
  
  // 获取随机数组元素
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;
    
  /**
   * 获取缓存字符串
   * @param {string} api
   * @param {object} params
   * @returns {object} - 返回 JSON
   */
  const getCacheString = async (jsonName, api, params) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime, type: true });
    const json = cache.read(jsonName);
    if (json) return json;
    const response = await requestInfo(api, params);
    if (response.success) {
      cache.write(jsonName, response)
    }
    return response;
  };
  
  /**
   * 发送请求获取信息
   *
   * @param {string} api
   * @param {object} params 请求参数
   * @param {object} params具体请求参数
   * @returns {object} 响应结果对象
   */
  const requestInfo = async (api, params) => {
    const request = new Request(apiUrl);
    request.method = 'POST';
    request.body = 'params=' + encodeURIComponent(JSON.stringify({ productId, api, sign, version, verifyToken, params }));
    const response = await request.loadJSON();
    return response;
  };
  
  // 获取违章对应的违法行为信息  
  const getSurveils = async (vioList, issueData) => {
    const params = {
      internalOrder: vioList.internalOrder,
      plateType: 2,
      issueOrganization: issueData.issueOrganization,
    };
    // 刷新查询页面
    if (setting.details) requestInfo(api3, params);
    
    const surveils = await getCacheString(`${vioList.plateNumber}_surveils.json`, api3, params);
    return surveils.success ? surveils.data?.surveils : [];
  };
  
  // 获取违章对应的发证机关信息
  const getIssueData = async (vioList) => {
    const params = {
      internalOrder: vioList.internalOrder,
      plateType: 2,
      issueOrganization: setting.integral?.issueOrganization
    };
    const issue = await getCacheString(`${vioList.plateNumber}.json`, api2, params);
    if (issue.success) {
      const { vioCity } = issue.data;
      return getRandomItem(vioCity);
    } else {
      deleteJsonFiles(cacheStr);
    }
  };
  
  // 获取车辆违章信息
  const getVehicleViolation = async (vioList) => {
    const issueData = await getIssueData(vioList) || {};
    const surveils = await getSurveils(vioList, issueData);
    const detail = getRandomItem(surveils) || {};
    if (vioList.count !== setting.count) {
      newViolation(surveils, vioList.plateNumber, vioList.count);
    };
    return { vioList, detail };
  };
  
  // 查询主函数
  const vioQueryMain = async () => {
    if (!setting.sign) await getBoxjsData();
    const main = await getCacheString('main.json', api1);
    const { success, data } = main;
    if (!success) handleError(main);
    const randomData = data ?getRandomItem(data.list) : null;
    if (!randomData || randomData.count === '0') {  
      return { success };
    }
    const vioDetails = await getVehicleViolation(randomData);
    return vioDetails;
  };
  
  // 处理错误
  const handleError = async (response) => {
    const { errorCode, resultCode, resultMsg } = response;
    const code = ['B100501', 'AUTHENTICATION_CREDENTIALS_NOT_EXIST', 'SECURITY_INFO_ABNORMAL', 'SYSTEM_ERROR'];
  
    if (code.includes(resultCode) || code.includes(errorCode)) {
      notify(`${resultMsg} ⚠️`, '点击【通知框】或【车图】跳转到支付宝12123页面重新获取，请确保已打开辅助工具', alipayUrl);
    } else {
      notify(resultCode, resultMsg);
    };
    
    if (setting.sign) {
      delete setting.sign;
      writeSettings(setting);
    }
  };
  
  // 违章状态处理  
  const deleteJsonFiles = (path) => {
    fm.listContents(path)
      .filter(item => item.toLowerCase().endsWith('.json'))
      .forEach(file => fm.remove(fm.joinPath(path, file)));
  };
  
  // 违章变动通知
  const newViolation = (surveils, plate, count) => {
    setting.count = count;
    writeSettings(setting);
    
    const { violationTime, violationAddress, violationDescribe, fine } = surveils[0] || {};
        
    const creationDate = fm.creationDate(settingPath);
    const isInitialized = (Date.now() - creationDate.getTime() > 300000);  
    if (isInitialized) {
      notify(`${plate} 🚫`, `${violationAddress}，${violationDescribe}，\n罚款 ${fine}元，${violationTime}`);  
      // fm.remove(cacheStr)
      deleteJsonFiles(cacheStr);
    }
  };
  
  // 生成跳转页面参数
  const generateParams = (jumpUrl, params) => {
    return jumpUrl + Object.entries(params).map(([key, value]) => {
      const encodedVal = encodeURIComponent(encodeURIComponent(value));
      return `${key}=${encodedVal}`;
    })
    .join(encodeURIComponent('&'))
    .replace(/=/g, encodeURIComponent('='))
    .replace(/[!*()']/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);  
  };
  
  // 跳转违章详情页面，包含违章图片
  const violationDetailsUrl = ({ plateNumber, internalOrder } = vioList || {}, detail) => {
    const params = {
      ...detail,
      plateNumber,
      internalOrder,
      citySupportPay: true
    };
    const vioDetailsUrl = generateParams(detailsUrl, params);
    return vioDetailsUrl;
  };
  
  // 每24小时更新一次
  const againWrite = (data) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const timeDiffer = (Date.now() - lastWriteTime) / (60 * 60 * 1000);
    if (data && timeDiffer >= 24 || !setting.integral) {
      setting.integral = data;
      writeSettings(setting);
    }
  };
  
  // 驾驶证/车辆信息
  const userIntegrationQuery = async () => {
    const integral = await getCacheString('userIntegrationQuery.json', api0, params = {});
    if (integral.success) againWrite(integral.data);
    return integral.success ? integral.data : setting.integral;
  };
  
  // 调用违章查询函数
  const { success = true, vioList, detail } = await vioQueryMain();
  const nothing = success && !vioList
  const sta = nothing || !success;
  
  // 车辆信息，驾驶证信息
  const { drivingLicense = {}, othersVehicles = [], vehicles = [] } = await userIntegrationQuery() || {};  
    
  const vehicle = vehicles.length && othersVehicles.length 
    ? (Math.random() < 0.5 ? othersVehicles : vehicles)
    : (othersVehicles.length ? othersVehicles : vehicles);
    
  const {
    plateNumber, 
    issueOrganization, 
    status: vehicles_status,
    name,
    validPeriodEnd = '2099-12-30' 
  } = getRandomItem(vehicle) || {};
  
  const {
    status,
    cumulativePoint = '0', 
    allowToDrive = 'C1', 
    reaccDate = '2099-12-29',
    validityEnd = '2099-12-30',
    name: myName,
    issueOrganizationName = setting.botStr
  } = drivingLicense;

  // 驾驶证状态
  const isStatus = status === 'A' 
    ? '正常' : '异常';
    
  const staColor = nothing 
    ? Color.blue() 
    : !success 
      ? new Color('#FF6800') 
      : new Color('#D30000');
  
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImage();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 ? setting.gradient : [setting.rangeColor];
      const randomColor = getRandomItem(color);
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
  
  //=========> Create <=========//
  const addIcon = (stack, iconName, iconColor, size, gap) => {
    const barIcon = SFSymbol.named(iconName);
    const icon = stack.addImage(barIcon.image);
    icon.imageSize = new Size(size, size);
    icon.tintColor = iconColor;
    stack.addSpacer(gap);
  };
  
  const addText = ({ stack, iconName, iconColor, text, gap, iconGap }) => {
    const iconStack = stack.addStack();
    iconStack.layoutHorizontally();
    iconStack.centerAlignContent();
    
    if (iconName) addIcon(iconStack, iconName, iconColor, 15, iconGap);
    
    const dataText = iconStack.addText(text);
    dataText.font = Font.mediumSystemFont(11.5);
    dataText.textColor = textColor;
    dataText.textOpacity = 0.78;
    if (!gap) stack.addSpacer(3);
  };
  
  // Two stack bar 
  const addBarStack = ({ leftStack, borderColor, iconName = 'server.rack', iconColor, text, textColor, textOpacity, gap }) => {
    const barStack = leftStack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.size = new Size(90, 0);
    barStack.setPadding(3, 10, 3, 10)
    barStack.cornerRadius = 10;
    barStack.borderColor = borderColor;
    barStack.borderWidth = 2;
    
    if (iconName) addIcon(barStack, iconName, iconColor, 16, 4);
    
    const statusText = barStack.addText(text);
    statusText.font = Font.mediumSystemFont(14);
    statusText.textColor = textColor;
    if (textOpacity) statusText.textOpacity = textOpacity;
    if (gap) leftStack.addSpacer(gap);
    barStack.url = statusUrl;
    return barStack;
  };
  
  /**
   * @param {image} image
   * @param {string} text
   * @returns {atack} widget
   */
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.setPadding(setPadding, 15, setPadding, 15);
    
    const topStack = widget.addStack();
    topStack.setPadding(0, 0, 3, 0);
    topStack.layoutHorizontally();
    topStack.centerAlignContent();
    
    const plateText = topStack.addText(myPlate);
    plateText.font = Font.mediumSystemFont(19.5);
    plateText.textColor = new Color(setting.titleColor);
    topStack.addSpacer();
    
    const logoText = topStack.addText('12123');
    logoText.font = Font.mediumSystemFont(18);
    logoText.textColor = new Color(setting.logoColor || '#0061FF')
    logoText.url = 'tmri12123://';
    
    // mainStack
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const leftStack = mainStack.addStack();
    leftStack.size = new Size(setting.lrfeStackWidth, 0);
    leftStack.setPadding(0, 0, 3, 0);
    leftStack.layoutVertically();
    
    addText({
      stack: leftStack, 
      iconName: sta ? 'car.circle' : 'shoeprints.fill',   
      iconColor: staColor, 
      text: sta ? `准驾车型 ${allowToDrive}` : `未处理违法 ${vioList.count} 条`,
      iconGap: sta ? 15 : 4.8
    });
    
    addText({
      stack: leftStack,
      text: sta ? `换证  ${validityEnd}` : `罚款${detail.fine}元   扣${detail.violationPoint}分`
    });

    addText({
      stack: leftStack,
      text: sta ? `年检  ${validPeriodEnd}` : detail.violationTime,  
      gap: false
    });
    
    leftStack.addSpacer();
    
    addBarStack({
      leftStack,
      borderColor: staColor,
      iconName: nothing ? 'location.fill' : '',
      iconColor: nothing ? Color.blue() : '',
      text: nothing ? '0 违章' : !success ? 'Sign 过期' : vioList.plateNumber,
      textColor: staColor,
      gap: 8
    });
    
    addBarStack({
      leftStack,
      borderColor: new Color('#AB47BC'),
      iconName: 'person.text.rectangle.fill',
      iconColor: Color.purple(),
      text: `记${cumulativePoint}分`,
      textColor,
      textOpacity: 0.75
    });
    
    // rightStack
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    
    const carStack = rightStack.addStack();
    carStack.setPadding(carImg ? carTop : -25, carLead, carImg ? carBot : 0, carTra);
    carStack.size = new Size(setting.carStackWidth, 0);
    
    if (setting.carImg) {
      const name = setting.carImg.split('/').pop();
      vehicleImg = await getCacheData(name, setting.carImg);
    } else {
      vehicleImg = await getRandomImage() || await getCacheData('carImg.png', getRandomItem(maybach));
    };
    
    const imageCar = carStack.addImage(vehicleImg);
    imageCar.url = alipayUrl;
    rightStack.addSpacer();
    
    const tipsStack = rightStack.addStack();
    tipsStack.size = new Size(setting.bottomSize, 28);
    
    if (success && detail) {
      const shortText = `${detail.violationAddress}，${detail.violationDescribe}`;
      violationMessage = shortText.length <= 19 
      ? `${shortText}，违章序列号 ${detail.violationSerialNumber}` 
      : shortText;
    };
    
    const tipsText = tipsStack.addText(sta ? (`备案信息: ${name || myName}，驾驶证状态 (${isStatus})，${issueOrganizationName}`) : violationMessage);
    tipsText.font = Font.mediumSystemFont(11);
    tipsText.textColor = textColor;
    tipsText.textOpacity = 0.8;
    tipsText.centerAlignText();
    
    // 跳转查询违章/违章详情
    const param = getRandomItem(vehicle) || {};  
    const queryDetailsUrl = generateParams(queryDetailUrl, param)
    plateText.url = queryDetailsUrl;
    tipsText.url = (setting.details && success && detail) ? violationDetailsUrl(vioList, detail) : queryDetailsUrl;
    
    return widget;
  };
  
  /**-------------------------**/
  const getLayout = (scr = Device.screenSize().height) => ({
    textSize: scr < 926 ? 13 : 13.5,
    barSize: scr < 926 ? 53 : 55,
    gap1: scr < 926 ? 10 : 11,
    gap2: scr < 926 ? 5 : 6
  });
  
  const addText2 = (stack, text, font, color, opacity) => {
    const statusText = stack.addText(text);
    statusText.font = Font.mediumSystemFont(font);
    if (color) 
    statusText.textColor = color;
    if (!opacity) statusText.textOpacity = 0.9;
  };
  
  // 小号组件
  const smallWidget = async () => {
    const { textSize, barSize, gap1, gap2 } = getLayout();
    
    const statuColor = status === 'A' ? Color.green() : Color.orange();
    
    const pointColor = cumulativePoint >= 9 ? Color.red() : cumulativePoint >= 6 ? Color.orange() : cumulativePoint >= 3 ? Color.blue() : Color.green();
    
    const widget = new ListWidget();
    widget.url = statusUrl;
    if (setting.smallBg) {
      await setBackground(widget);
    } else {
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    };
    
    const mainStack = widget.addStack();
    mainStack.size = new Size(0, 40);
    mainStack.setPadding(-3, 0, 0, 0)
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    addText2(mainStack, cumulativePoint, 45, pointColor);
    mainStack.addSpacer(4);
    
    const verticalStack = mainStack.addStack();
    verticalStack.layoutVertically();
    addText2(verticalStack, ' ', 16.5, null);
    addText2(verticalStack, '分', 14, pointColor);
    mainStack.addSpacer();
      
    const iconStack = mainStack.addStack();
    iconStack.layoutVertically();
    iconStack.addSpacer(3.5);
    
    const icons = nothing 
      ? 'car.circle' 
      : !success 
      ? 'wrongwaysign' 
      : `${vioList?.count}.circle`;
    const iconSymbol = SFSymbol.named(icons);
    const icon = iconStack.addImage(iconSymbol.image);
    icon.tintColor = nothing 
      ? Color.blue() 
      : !success 
      ? Color.red() 
      : new Color('#FF8500');
    icon.imageSize = new Size(25, 25)
    iconStack.addSpacer();
    widget.addSpacer(6);
    
    addText2(widget, `准驾车型  ${allowToDrive}`, textSize);
    widget.addSpacer();
    
    const leftBarStack = widget.addStack();
    leftBarStack.layoutHorizontally()
    leftBarStack.centerAlignContent()
    const columnStack = leftBarStack.addStack();
    columnStack.size = new Size(5, barSize);
    columnStack.cornerRadius = 50;
    columnStack.backgroundColor = new Color(await getRandomItem(['#CA74DF', '#0088FF', '#14BAFF', '#8C7CFF']));
    leftBarStack.addSpacer(gap1);
    
    // 证件状态
    const vStack = leftBarStack.addStack();
    vStack.layoutVertically();
    
    const statusStack = vStack.addStack();
    statusStack.layoutHorizontally();
    statusStack.centerAlignContent();
    
    addText2(statusStack, '驾驶证状态', textSize);
    statusStack.addSpacer(gap2);
    
    const barStack = statusStack.addStack();
    barStack.setPadding(2, 6, 2, 6);
    barStack.backgroundColor = new Color(statuColor.hex, 0.05);
    barStack.cornerRadius = 5
    barStack.borderColor = statuColor
    barStack.borderWidth = 2
    
    addText2(barStack, isStatus, 12, statuColor, true);
    vStack.addSpacer(3);
    addText2(vStack, `换证 ${validityEnd}`, textSize);
    vStack.addSpacer(3);
    addText2(vStack, `年检 ${validPeriodEnd}`, textSize);
    return widget;
  };
  
  // 渲染组件
  const runWidget = async () => {
    const widget = await (family === 'medium' ? createWidget() : smallWidget());
    
    if (config.runsInApp) {
      await widget[`present${family.charAt(0).toUpperCase() + family.slice(1)}`]();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
}
module.exports = { main }