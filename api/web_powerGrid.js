// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bolt;
/**
 * 组件作者: 95度茅台
 * 组件名称: 南方电网
 * 组件版本: Version 1.1.1
 * 发布时间: 2024-11-19
 */

async function main(family) {
  const fm = FileManager.local();  
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_powerGrid';
  const module = new _95du(pathName);  
  
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  const setting = module.settings;
  const { avatar, useCache, count = 0, token, gap, location, progressWidth, radius } = setting;

  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
    console.log(JSON.stringify(
      setting, null, 2
    ))
  };
  
  const alipayUrl = 'alipays://platformapi/startapp?appId=2021001164644764';
  const logo = 'https://kjimg10.360buyimg.com/jr_image/jfs/t1/205492/13/33247/3505/64ddf97fF4361af37/ffad1b1ba160d127.png';
  
  /**
   * 该函数获取当前的年份和月份
   * @returns {Promise}
   */
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = month === '01' ? year - 1 : year;
  
 /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  /**
   * 获取 POST JSON 字符串
   * @param {string} string
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, jsonUrl, requestBody) => {
    const { type } = module.getFileInfo(jsonName);
    const cache = module.useFileManager({ 
      cacheTime: 12, type 
    });
    const json = cache.read(jsonName);
    if (json) return json;
    const response = await makeRequest(jsonUrl, requestBody);
    const { sta } = response;
    if (sta == 00) cache.write(jsonName, response);
    return response;
  }; 
  
  /**
   * 获取请求数据
   * @param {string} - string
   * @returns {image} - url
   */
  const makeRequest = async (url, requestBody) => {
    const req = new Request(url);
    req.method = 'POST';
    req.headers = {
      'x-auth-token': token,
      'Content-Type': 'application/json;charset=utf-8'
    }
    req.body = JSON.stringify(requestBody);
    return await req.loadJSON();
  };
  
  // 用户信息
  const getUserInfo = async () => {
    const url = 'https://95598.csg.cn/ucs/ma/zt/eleCustNumber/queryBindEleUsers';
    const { sta, data } = await getCacheString('userInfo.json', url);
    if (sta == 00) {
      const outputNextIndex = (num, data) => (num + 1) % data.length;
      setting.count = outputNextIndex(count, data);
      writeSettings(setting);
      return data[setting.count];
    } else {
      module.notify('南网在线', 'Token已过期，请重新获取。⚠️');
    }
  };
  
  // 月用电量
  const getMonthData = async (areaCode, eleCustId) => {
    const pointResponse = await getCacheString(
      `queryMeteringPoint_${count}.json`,
      'https://95598.csg.cn/ucs/ma/zt/charge/queryMeteringPoint', {
      areaCode,
      eleCustNumberList: [{ areaCode, eleCustId }]
    });
    // 总用电和昨日
    if (pointResponse.sta == 00) {
      const { meteringPointId } = pointResponse?.data[0];
      const monthResponse = await getCacheString(`queryDayElectricByMPoint_${count}.json`, 'https://95598.csg.cn/ucs/ma/zt/charge/queryDayElectricByMPoint', {
        eleCustId,
        areaCode,
        yearMonth: year + month,
        meteringPointId
      });
      return monthResponse.data;
    }
  };
  
  // 账单
  const getEleBill = async (areaCode, eleCustId) => {
    const response = await getCacheString(  
      `selectElecBill_${count}.json`,
      'https://95598.csg.cn/ucs/ma/zt/charge/selectElecBill', {
      electricityBillYear: currentYear,
      areaCode,
      eleCustId
    });

    if (response.sta == 00) {
      const { totalElectricityYear, totalPowerYear } = response.data;
      const totalArray = response.data.billUserAndYear;
      const eleBill = totalArray[0];
      const lastMonth = eleBill.electricityBillYearMonth.replace(/^(\d{4})(\d{2})$/, '$1-$2');
      return { lastMonth, ...eleBill, totalArray, totalElectricityYear, totalPowerYear };
    }
  };
  
  // 余额
  const getUserBalance = async (areaCode, eleCustId) => {
    const res = await getCacheString(`queryUserAccountNumberSurplus_${count}.json`, 'https://95598.csg.cn/ucs/ma/zt/charge/queryUserAccountNumberSurplus', {
      areaCode,
      eleCustId
    });
    return res.sta == 00 ? res.data[0].balance : '0.00';
  };
  
  /** -------- 提取数据 -------- **/
  
  const {  
    userName: name = '用户名',
    eleCustNumber: number = '070100',
    eleType = '800',
    areaCode,
    bindingId: eleCustId
  } =  await getUserInfo() || {};
  
  const balance = await getUserBalance(areaCode, eleCustId);
  
  // 总用电量，昨日用电
  const { 
    totalPower = '0.00', 
    result = [] 
  } = await getMonthData(areaCode, eleCustId) || {};
  
  const ystdayPower = result.length > 0 ? result.pop().power : '0.00';
  const beforeYesterday = result.length > 0 ? `${result.pop().power} °` : '0.00 °';
  
  const {
    lastMonth = `${year}-${month}`,
    totalArray,
    totalPower: total = '0.00',
    totalElectricity = '0.00',   
    arrears = '0', 
    isArrears = '0',
    totalElectricityYear = '0.00', 
    totalPowerYear = '0.00 °'
  } = await getEleBill(areaCode, eleCustId) || {};
  
  /** 
   * 根据当前月份和用电量返回电费信息
   * 农业用电电价表（根据区域代码）海南，广东，广西，云南，贵州
   */
  const calcElectricBill = (totalPower, eleType = '800', areaCode = '') => {
    const isSummer = new Date().getMonth() + 1 >= 4 && new Date().getMonth() + 1 <= 10;

    const agriculturalRatesByCode = {
      '070000': { rate: 0.514 },
      '440000': { rate: 0.514 },
      '450000': { rate: 0.510 },
      '530000': { rate: 0.508 },
      '520000': { rate: 0.507 }
    };
  
    const agriculturalInfo = agriculturalRatesByCode[areaCode];
    const agriculturalRate = agriculturalInfo ? agriculturalInfo.rate : 0.514;
    // 返回农业用电数据
    if (eleType === '800') {
      return {
        tier: '农用',
        rate: agriculturalRate,
        cost: (totalPower * agriculturalRate).toFixed(2),
        percent: 0,
        isPercent: '0%'
      };
    }
  
    // 普通居民电价档次设定
    const tiers = [
      { limit: isSummer ? 220 : 160, rate: 0.6083, name: '一档' },
      { limit: isSummer ? 400 : 280, rate: 0.6583, name: '二档' },
      { rate: 0.9083, name: '三档' }
    ];
  
    // 根据用电量判断所属档次
    const tier = tiers.find((t, i) => totalPower <= t.limit || i === tiers.length - 1);
  
    // 计算占第三档比例
    const thirdTierLimit = isSummer ? 400 : 280;
    const percentageOfThird = totalPower / thirdTierLimit;
    const isPercent = totalPower > 0 ? Math.floor(percentageOfThird * 100) : 0;
  
    return {
      tier: tier.name,
      rate: tier.rate,
      cost: (totalPower * tier.rate).toFixed(2),
      percent: percentageOfThird,
      isPercent: `${isPercent}%`
    };
  };
  
  const { 
    tier, 
    rate, 
    cost,
    percent, 
    isPercent 
  } = calcElectricBill(totalPower, eleType, areaCode);
  
  /** -------- 缴费通知 -------- **/
  
  // 欠费时每12小时通知一次
  const arrearsNotice = () => {
    const pushTime = Date.now() - setting.updateTime;
    const duration = pushTime % (24 * 3600 * 1000);
    const hours_duration = Math.floor(duration / (3600 * 1000));
    
    if (hours_duration >= 12 && isArrears == 1) {
      setting.updateTime = Date.now()
      writeSettings(setting);
      
     module.notify('用电缴费通知 ‼️', `${name}，第${tier} ( 电价 ${rate} 元/度 )` + `\n上月用电 ${total} 度 ，待缴电费 ${arrears} 元`);
    }
  };
  
  // 创建图表(每月用量)  
  const getTotalPower = (data) => {
    const total = data?.map(entry => entry.totalElectricity).reverse();
    while (total?.length < 12) total.push(0);
    return total?.slice(0, 12);
  };
  
  // 填充矩形
  const fillRect = (ctx, x, y, width, height, radius, color) => {
    const path = new Path();
    path.addRoundedRect(new Rect(x, y, width, height), radius, radius);
    ctx.addPath(path);
    ctx.setFillColor(color);
    ctx.fillPath();
  };
  
  // 图表绘制函数
  const createChart = (displayData, n, barColor) => {
    const chartHeight = setting.chartHeight || 70;
    const paddingTop = 88 - chartHeight;
    
    const ctx = new DrawContext();
    ctx.size = new Size(n * 18 - 10, chartHeight + paddingTop);
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    
    const max = Math.max(...displayData) || 1;
    const deltaY = chartHeight / max;
  
    displayData.forEach((val, i) => {
      const barHeight = val > 0 ? val * deltaY : max * deltaY;
      const color = val === 0 
        ? new Color(barColor, 0.35) 
        : val == max 
          ? new Color('#FF6800') 
          : new Color(barColor);
  
      fillRect(ctx, i * 18, paddingTop + chartHeight - barHeight, 8, barHeight, 4, color);
    });
  
    return ctx.getImage();
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImage();
    const Appearance = Device.isUsingDarkAppearance();
    if (fm.fileExists(bgImage) && !Appearance) {
      const shadowImg = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(shadowImg);
    } else if (setting.solidColor && !Appearance) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 ? setting.gradient : [setting.rangeColor];
      const randomColor = module.getRandomItem(color);
      // 渐变角度
      const angle = setting.angle;
      const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
      const x = 0.5 + 0.5 * Math.cos(radianAngle);
      const y = 0.5 + 0.5 * Math.sin(radianAngle);
      gradient.startPoint = new Point(1 - x, y);
      gradient.endPoint = new Point(x, 1 - y);
      
      gradient.locations = [0, 1];
      gradient.colors = [
        new Color(randomColor, setting.transparency),
        new Color('#00000000')
      ];
      widget.backgroundGradient = gradient;
    } else if (!Appearance && !setting.bwTheme) {
      widget.backgroundImage = await module.getCacheData(`${rootUrl}/img/picture/background_image_1.png`);
    } else {
      const imageUrl = `${rootUrl}/img/background/glass_2.png`;
      widget.backgroundImage = await module.getCacheData(imageUrl);
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
    
    if (count % 2 === 0) {
      levelColor = '#00B400'
      barColor = new Color(levelColor, 0.6);
    } else {
      levelColor = '#0094FF'
      barColor = new Color(levelColor, 0.6);
    }
  };
  
  // createStack
  const createStack = (middleStack, spacer, month, total, money) => {
    const quotaStack = middleStack.addStack();  
    quotaStack.layoutVertically();
    quotaStack.centerAlignContent();

    const addTextStack = (text, font, opacity, addSpacer) => {
      const stack = quotaStack.addStack();
      if (spacer || spacer === 1) stack.addSpacer();
      const quotaText = stack.addText(`${text}`);
      quotaText.font = font;
      if (opacity) quotaText.textOpacity = opacity;
      if (!spacer || spacer === 1)  stack.addSpacer();
      if (!addSpacer) quotaStack.addSpacer(3);
    };

    addTextStack(month, Font.mediumSystemFont(14), 0.7);
    addTextStack(`${total} °`, Font.boldSystemFont(18));
    addTextStack(money, Font.boldSystemFont(14), 0.7, true);
  };
  
  //=========> Create <=========//
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.setPadding(0, 0, 0, 0);
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    mainStack.setPadding(gap, gap, gap, gap);
    mainStack.addSpacer();
    
    // avatarStack
    const avatarStack = mainStack.addStack();
    avatarStack.layoutHorizontally();
    avatarStack.centerAlignContent();
    const avatarStack2 = avatarStack.addStack();
    
    const iconSymbol = await module.getCacheData(avatar);
    const avatarIcon = avatarStack2.addImage(iconSymbol);
    avatarIcon.imageSize = new Size(50, 50);
    avatarStack2.cornerRadius = Number(radius);
    avatarStack2.borderWidth = 3;
    avatarStack2.borderColor = new Color('#FFBF00');
    avatarStack.addSpacer(15);
    
    const topStack = avatarStack.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent();
    
    const levelStack = topStack.addStack();
    levelStack.layoutHorizontally();
    levelStack.centerAlignContent();
    
    const barStack = levelStack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.backgroundColor = new Color(levelColor);
    barStack.setPadding(1, 12, 1, 12)
    barStack.cornerRadius = 10;
    
    const iconSF = SFSymbol.named('crown.fill');
    const barIcon = barStack.addImage(iconSF.image);
    barIcon.imageSize = new Size(20, 20);
    barIcon.tintColor = new Color('#FDDA0D');
    barStack.addSpacer(4);
    
    const titleText = barStack.addText(name);
    titleText.font = Font.boldSystemFont(14);
    titleText.textColor = Color.white();
    levelStack.addSpacer(8);
    
    const beneStack = levelStack.addStack();
    beneStack.layoutHorizontally();
    beneStack.centerAlignContent();
    const benefitText = beneStack.addText('昨日 ');
    benefitText.font = Font.boldSystemFont(14);  
    benefitText.textOpacity = 0.7;
    
    const benefitText2 = beneStack.addText(`${ystdayPower} °`)
    benefitText2.font = Font.boldSystemFont(16);
    benefitText2.textColor = isArrears == 1 ? Color.blue() : Color.red();
    beneStack.addSpacer();
    
    if (isArrears == 1) {
      const payText0 = beneStack.addText(arrears);
      payText0.font = Font.boldSystemFont(16);
      payText0.textColor = new Color('#FF2400');
    } else if (setting.estimate) {
      const payText0 = beneStack.addText(cost > 0 ? cost : balance);
      payText0.font = Font.mediumSystemFont(16);
      payText0.textColor = Color.blue();
    }
    topStack.addSpacer(5);
    
    const pointStack = topStack.addStack();
    pointStack.layoutHorizontally();
    pointStack.centerAlignContent();
    
    const payStack = pointStack.addStack();
    payStack.layoutHorizontally();
    payStack.centerAlignContent();
    payStack.backgroundColor = new Color(isArrears == 1 ? '#D50000' : '#AF52DE');
    payStack.setPadding(2, 5, 2, 5);
    payStack.cornerRadius = 5;
    
    const payText = payStack.addText(!areaCode ? '用户未登录' : isArrears == 1 ? '待缴费' : '已缴费');
    payText.font = Font.boldSystemFont(11);
    payText.textColor = Color.white();
    pointStack.addSpacer(8);
    
    const LevelText = pointStack.addText(number);
    LevelText.font = Font.mediumSystemFont(14);
    LevelText.textOpacity = 0.7;
    pointStack.addSpacer();
    
    const barStack2 = pointStack.addStack();
    barStack2.layoutHorizontally();
    barStack2.centerAlignContent();
    barStack2.backgroundColor = new Color(count % 2 === 0 ? '#FFA61C' : '#00C400');
    barStack2.setPadding(1, 7, 1, 7);
    barStack2.cornerRadius = 5;
    
    const pointText = barStack2.addText(beforeYesterday);
    pointText.font = Font.boldSystemFont(13);
    pointText.textColor = Color.white();
    mainStack.addSpacer();
    
    // Switch position
    if (location == 0) {
      await progressBar(mainStack);
    }
    
    /** 
    * Middle or bottom Stack
    * @param {image} image
    * @param {string} string
    */
    const middleStack = mainStack.addStack();
    middleStack.url = alipayUrl;
    middleStack.layoutHorizontally();
    middleStack.centerAlignContent();
    
    createStack(middleStack, false, `${year}-${month}`, totalPower, (totalPower > 0 ? balance : '0.00'));
    
    const totalItems = getTotalPower(totalArray);
    const n = totalItems?.length;
    
    if (setting.chart && n > 0) {
      const chartColor = count % 2 === 0 ? '#8C7CFF' : '#34C579'
      const chartImage = createChart(totalItems.slice(-n), n, chartColor);
      const drawImage = middleStack.addImage(chartImage);
      drawImage.centerAlignImage();
      drawImage.imageSize = new Size(127, 60);
    } else {
      createStack(middleStack, 1, `${year} 年`, totalPowerYear, totalElectricityYear);
    };
    
    /** Middle Right Stack **/
    createStack(middleStack, true, lastMonth, total, totalElectricity);
    mainStack.addSpacer();
    
    // Switch position
    if (location == 1) {
      await progressBar(mainStack);
    }
    arrearsNotice();
    return widget;
  };
  
  /** 
   * progressBar Stack
   * @param {image} image
   * @param {string} string
   */
  const progressBar = async (mainStack) => {
    const width = progressWidth;
    const height = 16;
    
    const prgsStack = mainStack.addStack();  
    prgsStack.layoutHorizontally();
    prgsStack.centerAlignContent();
      
    const curScoreText = prgsStack.addText(tier);
    curScoreText.font = Font.boldSystemFont(13);
    prgsStack.addSpacer();
      
    const progress = prgsStack.addImage(creatProgress());
    progress.centerAlignImage();
    progress.imageSize = new Size(width, height);
    
    function creatProgress() {
      const cxt = new DrawContext();
      cxt.opaque = false;
      cxt.respectScreenScale = true;
      cxt.size = new Size(width, height);
      
      const barPath = new Path();
      const barHeight = height - 10;
      barPath.addRoundedRect(new Rect(0, 5, width, barHeight), barHeight / 2, barHeight / 2);
      cxt.addPath(barPath);
      cxt.setFillColor(new Color(levelColor, 0.25));
      cxt.fillPath();
    
      const currPath = new Path();
      currPath.addRoundedRect(new Rect(0, 5, width * percent, barHeight), barHeight / 2, barHeight / 2);
      cxt.addPath(currPath);
      cxt.setFillColor(barColor);
      cxt.fillPath();
    
      const circlePath = new Path();
      const diameter = height * 0.85;
      circlePath.addEllipse(new Rect((width - diameter) * percent, (height - diameter) / 2, diameter, diameter));
      cxt.addPath(circlePath);
      cxt.setFillColor(new Color(levelColor));
      cxt.fillPath();
      
      return cxt.getImage();
    };
      
    prgsStack.addSpacer();
    const percentText = prgsStack.addText(isPercent);
    percentText.font = Font.boldSystemFont(13);  
    mainStack.addSpacer();
  };
  
  /**-------------------------**/
  const getLayout = (scr = Device.screenSize().height) => ({
    stackSize: scr < 926 ? 35 : 37,
    iconSize: scr < 926 ? 23 : 25,
    titleSize: scr < 926 ? 18 : 20,
    textSize: scr < 926 ? 11 : 11.5
  });
  
  // 添加到 widget
  const addVertical = async (horStack, iconName, iconColor, title, text, gap) => {
    const lay = getLayout();
    const rowStavk = horStack.addStack();
    rowStavk.layoutHorizontally();
    rowStavk.centerAlignContent();
    
    const iconStack = rowStavk.addStack();
    iconStack.layoutHorizontally();
    iconStack.centerAlignContent();
    iconStack.size = new Size(lay.stackSize, lay.stackSize);
    iconStack.cornerRadius = 50;
    iconStack.backgroundColor = iconColor;
    
    const iconSymbol = SFSymbol.named(iconName);
    const iconImage = iconStack.addImage(iconSymbol.image);
    iconImage.tintColor = Color.white();
    iconImage.imageSize = new Size(lay.iconSize, lay.iconSize);
    rowStavk.addSpacer(10);
    
    const verticalStack = rowStavk.addStack();
    verticalStack.layoutVertically();
    
    const titleText = verticalStack.addText(title);
    titleText.font = Font.mediumSystemFont(lay.titleSize);
    titleText.textColor = iconColor;
    
    const subtitleText = verticalStack.addText(text);
    subtitleText.font = Font.mediumSystemFont(lay.textSize);
    subtitleText.textOpacity = 0.65
    if (!gap) horStack.addSpacer();
    return horStack;
  };
  
  // 创建小号组件
  const createSmall = async () => {
    const response = await getCacheString(  
      `eleCar.json`,
      'https://95598.csg.cn/ucs/ma/zt/eleCar/getHomeInfo', {
      mobile: setting.mobile
    });
    
    const { 
      accFree = '0.00', 
      dayCharge = '0',
      monCharge = '0'
    } = response?.data || {};
    
    const widget = new ListWidget();
    const mainStack = widget.addStack();
    mainStack.setPadding(0, 0, 0, 0);
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const horStack = mainStack.addStack();
    horStack.layoutVertically();
    
    addVertical(horStack, 'bolt.fill', Color.green(), Number(dayCharge).toFixed(2), '今日充电 (度)');
    addVertical(horStack, 'flame.fill', new Color('#FE4904'), Number(monCharge).toFixed(2), '本月充电 (度)');
    addVertical(horStack, 'dollarsign', Color.orange(), accFree, '当前余额 (元)', true);

    mainStack.addSpacer();
    return widget;
  };
  
  // 渲染组件
  const runWidget = async () => {
    const widget = await (family === 'medium' ? createWidget() : createSmall());
    
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