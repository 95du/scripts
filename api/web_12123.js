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
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_12123';
  const module = new _95du(pathName);  
  const setting = module.settings;
  
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const { myPlate, setPadding, carImg, carTop, carBot, carLead, carTra } = setting || {};
  
  const { apiUrl, productId, version, api0, api1, api2, api3, api4, api5, alipayUrl, statusUrl, queryDetailUrl, detailsUrl, maybach } = await module.getCacheData(`${rootUrl}/update/12123.json`);  
  
  // 获取随机数组元素
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;
  
  /**
   * 获取车辆图片并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  async function getRandomImage() {
    const maybach = Array.from({ length: 9 }, (_, index) => `${rootUrl}/img/car/Maybach-${index}.png`);
    const randomImg = module.getRandomItem(maybach);
    return await module.getCacheData(randomImg);
  };
    
  /**
   * 获取缓存字符串
   * @param {string} api
   * @param {object} params
   * @returns {object} - 返回 JSON
   */
  const getCacheString = async (name, api, params) => {
    const { type } = module.getFileInfo(name);
    const cache = module.useFileManager({ cacheTime: setting.cacheTime, type });
    const json = cache.read(name);
    if (json) return json;
    const response = api 
      ? await requestInfo(api, params) 
      : await getDriLicense();
    if (response.success) cache.write(name, response);
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
    const { verifyToken, sign } = await module.boxjsData('body_12123') || {};
    const formBody = 'params=' + encodeURIComponent(JSON.stringify({ productId, api, sign, version, verifyToken, params }));
    const response = await module.apiRequest(apiUrl, {}, 'POST', null, formBody);
    return response;
  };
  
  // 请求电子驾驶证
  const getDriLicense = async () => {
    const url = `https://miniappcsfw.122.gov.cn:8443/api/electronic/showDriverLicense.json?t=${Date.now()}`;
    const boxjs = await module.httpRequest(`http://boxjs.com/query/data/ele_cookie_12123`, 'json');
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
      'Cookie': boxjs?.val
    };
    const response = await module.apiRequest(url, headers, 'POST')
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
      module.notify(`${resultMsg} ⚠️`, '点击【通知框】或【车图】跳转到支付宝12123页面重新获取，请确保已打开辅助工具', alipayUrl);
    } else {
      module.notify(resultCode, resultMsg);
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
    module.writeSettings(setting);
    
    const { violationTime, violationAddress, violationDescribe, fine } = surveils[0] || {};
        
    const creationDate = fm.creationDate(settingPath);
    const isInitialized = (Date.now() - creationDate.getTime() > 300000);  
    if (isInitialized) {
      module.notify(`${plate} 🚫`, `${violationAddress}，${violationDescribe}，\n罚款 ${fine}元，${violationTime}`);  
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
      module.writeSettings(setting);
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
    name: myName = '用户名',
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
  const _textColor = Color.dynamic(new Color(setting.smallLightColor || '#000000'), new Color(setting.smallDarkColor || '#FFFFFF'));
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    if (fm.fileExists(bgImage)) {
      const shadowImg = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(shadowImg);
    } else {
      widget.backgroundGradient = module.createGradient();
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
    //dataText.textOpacity = 0.9;
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
      vehicleImg = await module.getCacheData(setting.carImg);
    } else {
      vehicleImg = await getRandomImage() || await module.getCacheData(module.getRandomItem(maybach));
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
    padding: scr < 926 ? 13 : 18,
    textSize: scr < 926 ? 12.5 : 13.5,
    barSize: scr < 926 ? 35 : 36,
    gap: scr < 926 ? 8 : 10,
  });
  
  const generateStack = (widget) => {
    const stack = widget.addStack();
    stack.layoutHorizontally();
    stack.centerAlignContent();
    return stack;
  }
  
  const createBarStack = (stack, width, height, color, gap) => {
    const columnStack = stack.addStack();
    columnStack.size = new Size(width, height);
    columnStack.cornerRadius = 50;
    columnStack.backgroundColor = new Color(color);
    stack.addSpacer(gap);
  };
  
  const addHorizontalText = (stack, text, font, color, opacity) => {
    const statusText = stack.addText(text);
    statusText.font = Font.mediumSystemFont(font);
    statusText.textColor = color || _textColor;
    if (!opacity) statusText.textOpacity = 0.9;
  };
  
  // 小号组件
  const smallWidget = async () => {
    const { padding, textSize, barSize, gap } = getLayout();
    const statuColor = status === 'A' ? Color.green() : Color.orange();
    const pointColor = cumulativePoint >= 9 ? Color.red() : cumulativePoint >= 6 ? Color.orange() : cumulativePoint >= 3 ? Color.blue() : Color.green();
    
    const widget = new ListWidget();
    widget.setPadding(padding, padding, padding, padding);
    const mainStack = generateStack(widget);
    mainStack.setPadding(0, 0, 0, -2);
    mainStack.size = new Size(0, 40);
    
    // 顶部分数区域
    const topStack = generateStack(mainStack);
    topStack.setPadding(-6.5, -2, 0, 0)
    addHorizontalText(topStack, cumulativePoint, 45, pointColor);
    const pointStack = topStack.addStack();
    pointStack.layoutVertically();
    pointStack.setPadding(20, 4, 0, 0)
    addHorizontalText(pointStack, '分', 14, pointColor);
    mainStack.addSpacer();
      
    const iconStack = mainStack.addStack();
    iconStack.layoutVertically();
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
    widget.addSpacer();
    
    // 准驾车型
    const allowDriveStack = generateStack(widget);
    createBarStack(allowDriveStack, 8, 8, '#8C7CFF', gap);
    addHorizontalText(allowDriveStack, '准驾车型', textSize);
    allowDriveStack.addSpacer();  
    addHorizontalText(allowDriveStack, allowToDrive, textSize);
    widget.addSpacer(3);
    
    // 驾照状态
    const statusStack = generateStack(widget)
    createBarStack(statusStack, 8, 8, '#FF7800', gap);
    addHorizontalText(statusStack, '驾照状态', textSize);
    statusStack.addSpacer();
    const barStack = statusStack.addStack();
    barStack.setPadding(2, 6, 2, 6);
    barStack.backgroundColor = new Color(statuColor.hex, 0.05);
    barStack.cornerRadius = 5;
    barStack.borderColor = statuColor
    barStack.borderWidth = 2;
    addHorizontalText(barStack, isStatus, 11, statuColor, true);
    widget.addSpacer();
    
    // 换证/年检日期
    const bottomBarStack = generateStack(widget);
    const barColor = getRandomItem(['#0088FF', '#14BAFF', '#8C7CFF']);
    createBarStack(bottomBarStack, 8, barSize, barColor, gap);
    
    const vStack = bottomBarStack.addStack();
    vStack.layoutVertically();
    const bottomStack1 = generateStack(vStack);
    addHorizontalText(bottomStack1, '换证', textSize);
    bottomStack1.addSpacer();
    addHorizontalText(bottomStack1, validityEnd, textSize);
    vStack.addSpacer(3); // 间隔
    const bottomStack2 = generateStack(vStack);
    addHorizontalText(bottomStack2, '年检', textSize);
    bottomStack2.addSpacer();
    addHorizontalText(bottomStack2, validPeriodEnd, textSize);
    
    if (setting.smallBg) {
      await setBackground(widget);
    } else {
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    };
    widget.url = statusUrl;
    return widget;
  };
  
  /**----- ☣️ 大号组件 ☣️ ------**/
  const createGradient = () => {
    const g = new LinearGradient();
    g.startPoint = new Point(0, 0.5);
    g.endPoint = new Point(1, 0.5);
    g.locations = [0, 1];
    g.colors = [
      new Color('#29B6F6'),
      new Color('#2CD889') 
    ];
    return g;
  };

  const base64ToImage = (base64) => {
    const data = Data.fromBase64String(base64);
    return Image.fromData(data);
  };
  
  const addLargeText = (stack, title, text, gap) => {
    const infoStack = generateStack(stack);
    const titleText = infoStack.addText(title);
    titleText.font = Font.mediumSystemFont(16);
    titleText.textColor = new Color('#003EC9', 0.6);
    infoStack.addSpacer(10);
    const valueText = infoStack.addText(text);
    valueText.font = Font.mediumSystemFont(16);
    valueText.textColor = Color.black();
    if (!gap) stack.addSpacer();
  };
  
  const largeWidget = async () => {
    const userImg = await module.getCacheData(`${rootUrl}/img/background/Ronaldo.png`, 500, `Ronaldo.png`);
    const codeImg = await module.getCacheData(`${rootUrl}/img/background/barCode.png`, 500, `barCode.png`);
    const bgImage = await module.getCacheData(`${rootUrl}/img/background/electricDriver_2.png`, 500, `driverLicense_2.png`);
    
    const { success, data } = await getCacheString('driverLicense.json');
    const { drvElectronicInfo, drvElectronicPhoto } = data || {};
    const image = !success ? userImg : base64ToImage(drvElectronicPhoto.photo)
    const ywmImg = !success ? codeImg : base64ToImage(drvElectronicInfo.ywmImg)
    
    const {
      xm = '克里斯蒂亚诺',
      zjcx = 'A1',
      ljjf = '3',
      cclzrq = '2011-03-03',
      ztDesc = '正常',
      sfzmhm = '460104198511170013',
      dabh = '460112769109',
      yxqs = '2017-03-03',
      yxqz = '2027-03-03',
      zxbh = '4620004025809'
    } = drvElectronicInfo || {};
    
    const widget = new ListWidget();
    widget.setPadding(-5, 20, 12, 20);
    const mainStack = generateStack(widget);
    const topStack = mainStack.addStack();
    topStack.size = new Size(90, 130);
    const avatar = topStack.addImage(image);
    mainStack.addSpacer(20);
    
    const infoStack = mainStack.addStack();
    infoStack.layoutVertically();
    infoStack.size = new Size(0, 130);
    infoStack.addSpacer(25);
    const infoArr = [{ label: '姓        名', val: xm }, { label: '准驾车型', val: zjcx }, { label: '累积计分', val: `${ljjf } 分`},{ label: '初次领证', val: cclzrq, flag: true }];
    infoArr.forEach(item => {
      addLargeText(infoStack, item.label, item.val, item.flag);
    });
    widget.addSpacer();
    
    const barStack = generateStack(widget);
    barStack.setPadding(3, 0, 3, 0);
    if (ztDesc === '正常') {
      barStack.backgroundGradient = createGradient();
    } else {
      barStack.backgroundColor = new Color('#FF7800');
    }
    barStack.addSpacer();
    const statusStrText = barStack.addText(ztDesc);
    statusStrText.font = Font.mediumSystemFont(16);
    statusStrText.textColor = Color.white()
    barStack.addSpacer();
    widget.addSpacer();
    
    addLargeText(widget, '证件号码', sfzmhm, true);
    widget.addSpacer(5);
    addLargeText(widget, '档案编号', dabh, true);
    widget.addSpacer(5);
    addLargeText(widget, '车辆年检', validPeriodEnd, true);
    widget.addSpacer(5);
    addLargeText(widget, '有效期限', `${yxqs }  至  ${yxqz}`, true);
    widget.addSpacer();
    
    const bottomStack = widget.addStack();
    bottomStack.addImage(ywmImg);
    const codeStack = generateStack(widget);
    const leftPointText = codeStack.addText('·');
    leftPointText.font = Font.boldSystemFont(25);
    leftPointText.textColor = new Color('#000000', 0.7);
    codeStack.addSpacer();
    
    [...zxbh].forEach((item, i) => {
      const barCodeText = codeStack.addText(item);
      barCodeText.font = Font.mediumSystemFont(17);
      barCodeText.textColor = new Color('#000000', 0.6);
      codeStack.addSpacer();
    });
  
    const rightPointText = codeStack.addText('·');
    rightPointText.font = Font.boldSystemFont(25);
    rightPointText.textColor = new Color('#000000', 0.7);
    
    widget.backgroundImage = bgImage;
    return widget;
  };
  
  // 渲染组件
  const runWidget = async () => {
    const widget = await (
      family === 'medium' 
      ? createWidget() 
      : family === 'large' 
      ? largeWidget() 
      : smallWidget()
    );
    
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