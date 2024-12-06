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
  const { avatar, column = 0, count = 0, token, gap, location, progressWidth, radius } = setting;

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
  
  /**
   * 该函数获取当前的年份和月份
   * @returns {Promise}
   */
  const getCurrentYearMonth = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const currentYear = month === 1 ? year - 1 : year;
    return { year, currentYear, month }
  };
  
  // 配置尺寸
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    avatarSize: isSmall ? 8 : 12,
    stackSize: isSmall ? 35 : 37,
    iconSize: isSmall ? 23 : 25,
    titleSize: isSmall ? 18 : 20,
    textSize: isSmall ? 11 : 11.5,
    left: isSmall ? 10 : 15,
    gapMed: isSmall ? 5 : null,
    gap: isSmall ? 8 : 10,
    gapStack: isSmall ? 4 : 6,
    amountSize: isSmall ? 25.5 : 27,
    padding: isSmall ? 12 : 15,
    barHeight: isSmall ? 45 : 46.6,
  };
  
  // ====== 创建图表(每月用量) ====== //
  const getTotalPower = (data) => {
    const total = Array(12).fill(0);
    data.forEach(({ startMonthDate, totalElectricity }) => {
      const month = parseInt(startMonthDate.split('.')[0], 10);  // 提取月份
      if (month >= 1 && month <= 12) total[month - 1] = parseFloat(totalElectricity);
    });
    return total;
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
  
  // ======= 绘制进度条 ======= //
  const creatProgress =(width, height, percent, isPercent, barColor) => {
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
    req.timeoutInterval = 10;
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
  
  // 获取月用电量
  const getMonthData = async (areaCode, eleCustId) => {
    const adjustYearMonth = (year, month) => (month === 1 
      ? { year: year - 1, month: 12 } 
      : { year, month: month - 1 });
    
    let { year, month } = getCurrentYearMonth();
    
    while (true) {
      const formattedMonth = String(month).padStart(2, '0');
      const yearMonth = `${year}${formattedMonth}`;
      const pointResponse = await getCacheString(
        `queryMeteringPoint_${count}.json`,
        'https://95598.csg.cn/ucs/ma/zt/charge/queryMeteringPoint',
        {
          areaCode,
          eleCustNumberList: [{ areaCode, eleCustId }]
        }
      );
      // 总用电和每日用电量数据
      if (pointResponse.sta == 00) {
        const { meteringPointId } = pointResponse?.data[0];
        const monthResponse = await getCacheString(
          `queryDayElectricByMPoint_${count}.json`,
          'https://95598.csg.cn/ucs/ma/zt/charge/queryDayElectricByMPoint',
          {
            eleCustId,
            areaCode,
            yearMonth,
            meteringPointId
          }
        );
        return monthResponse.data;
      };
      // 账单未出来前调整到上个月
      ({ year, month } = adjustYearMonth(year, month));
    }
  };
  
  // 账单
  const getEleBill = async (areaCode, eleCustId) => {
    const { currentYear } = getCurrentYearMonth();
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
  
  /**
   * 根据当前月份和用电量返回电费信息
   * 农业用电电价表（根据区域代码）海南，广东，广西，云南，贵州
   */
  const calcElectricBill = (totalPower, eleType = '800', areaCode = '') => {
    const isSummer = new Date().getMonth() + 1 >= 4 && new Date().getMonth() + 1 <= 10;
  
    // 农业用电电价表
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
        isPercent: '0%',
        tierIndex: 0
      };
    }
  
    // 居民电价档次表（按省份划分）
    const resRatesProv = {
      '070000': [ // 海南
        { limit: isSummer ? 220 : 160, rate: 0.6083, name: '一档' },
        { limit: isSummer ? 400 : 280, rate: 0.6583, name: '二档' },
        { rate: 0.9083, name: '三档' }
      ],
      '440000': [ // 广东
        { limit: isSummer ? 210 : 170, rate: 0.61, name: '一档' },
        { limit: isSummer ? 400 : 300, rate: 0.66, name: '二档' },
        { rate: 0.91, name: '三档' }
      ],
      '450000': [ // 广西
        { limit: isSummer ? 200 : 180, rate: 0.615, name: '一档' },
        { limit: isSummer ? 400 : 300, rate: 0.665, name: '二档' },
        { rate: 0.915, name: '三档' }
      ],
      '530000': [ // 云南
        { limit: isSummer ? 200 : 160, rate: 0.6, name: '一档' },
        { limit: isSummer ? 400 : 300, rate: 0.65, name: '二档' },
        { rate: 0.9, name: '三档' }
      ],
      '520000': [ // 贵州
        { limit: isSummer ? 230 : 170, rate: 0.605, name: '一档' },
        { limit: isSummer ? 400 : 300, rate: 0.655, name: '二档' },
        { rate: 0.905, name: '三档' }
      ]
    };
  
    const provinceRates = resRatesProv[areaCode] || resRatesProv['070000'];
    // 根据用电量判断所属档次
    const tierIndex = provinceRates.findIndex((t, i) => totalPower <= (t.limit || Infinity) || i === provinceRates.length - 1);
    const tier = provinceRates[tierIndex];
    // 计算占第三档比例
    const thirdTierLimit = isSummer ? provinceRates[1]?.limit : provinceRates[0]?.limit;
    const percentageOfThird = totalPower / thirdTierLimit;
    const isPercent = totalPower > 0 ? Math.floor(percentageOfThird * 100) : 0
  
    return {
      tier: tier.name,
      rate: tier.rate,
      cost: (totalPower * tier.rate).toFixed(2),
      percent: percentageOfThird,
      isPercent: `${isPercent}%`,
      tierIndex: tierIndex + 1
    };
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
  
  const dateString = result[0]?.date;
  const yearMonth = dateString.match(/^(\d{4})-(\d{2})/)?.[0];
  
  const ystdayPower = result.length > 0 ? `${result.pop().power} °` : '0.00 °';
  const dayBefore = result.length > 0 ? `${result.pop().power} °` : '0.00 °';
  
  const {
    lastMonth = '2024-12',
    totalArray,
    totalPower: total = '0.00',
    totalElectricity = '0.00',   
    arrears = '0', 
    isArrears = '0',
    totalElectricityYear = '0.00', 
    totalPowerYear = '0.00 °'
  } = await getEleBill(areaCode, eleCustId) || {};
  
  // 电费信息
  const { tier, rate, cost, percent, isPercent, tierIndex } = calcElectricBill(totalPower, eleType, areaCode);
  
  const alipayUrl = 'alipays://platformapi/startapp?appId=2021001164644764';
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  
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
  
  // ====== 设置组件背景 ====== //
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    const Appearance = Device.isUsingDarkAppearance();
    if (fm.fileExists(bgImage) && !Appearance) {
      const shadowImg = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(shadowImg);
    } else if (setting.gradient.length > 0 && !setting.bwTheme) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 
        ? setting.gradient 
        : [setting.rangeColor];
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
  
  // createStack(中号组件)
  const createStack = (middleStack, spacer, month, total, money) => {
    const quotaStack = middleStack.addStack();  
    quotaStack.layoutVertically();
    quotaStack.centerAlignContent();

    const addTextStack = (text, font, opacity, addSpacer) => {
      const stack = quotaStack.addStack();
      if (spacer || spacer === 1) stack.addSpacer();
      const quotaText = stack.addText(`${text}`);
      quotaText.textColor = textColor;
      quotaText.font = font;
      if (opacity) quotaText.textOpacity = opacity;
      if (!spacer || spacer === 1)  stack.addSpacer();
      if (!addSpacer) quotaStack.addSpacer(3);
    };

    addTextStack(month, Font.mediumSystemFont(14), 0.7);
    addTextStack(`${total} °`, Font.boldSystemFont(18));
    addTextStack(money, Font.boldSystemFont(14), 0.7, true);
  };
  
  /** 
   * progressBar Stack
   * @param {image} image
   * @param {string} string
   */
  const progressBar = (mainStack, tier) => {
    const width = progressWidth;
    const height = 16;
    
    const prgsStack = module.createStack(mainStack);
    const curScoreText = prgsStack.addText(tier);
    curScoreText.textColor = textColor;
    curScoreText.font = Font.boldSystemFont(13);
    prgsStack.addSpacer();
    
    const progressImg = creatProgress(width, height, percent, isPercent, barColor);
    const progress = prgsStack.addImage(progressImg);
    progress.centerAlignImage();
    progress.imageSize = new Size(width, height);
    
    prgsStack.addSpacer();
    const percentText = prgsStack.addText(isPercent);
    percentText.textColor = textColor;
    percentText.font = Font.boldSystemFont(13);  
    mainStack.addSpacer();
  };
  
  //=========> 中号组件 <=========//
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.setPadding(0, 0, 0, 0);
    const mainStack = module.createStack(widget, 'vertical');
    mainStack.setPadding(gap, gap, gap, gap);
    mainStack.addSpacer();
    
    // avatarStack
    const avatarStack = module.createStack(mainStack);
    const avatarStack2 = avatarStack.addStack();
    
    const iconSymbol = await module.getCacheData(avatar);
    const avatarIcon = avatarStack2.addImage(iconSymbol);
    avatarIcon.imageSize = new Size(50, 50);
    avatarStack2.cornerRadius = Number(radius);
    avatarStack2.borderWidth = 3;
    avatarStack2.borderColor = new Color('#FFBF00');
    avatarStack.addSpacer(15);
    
    const topStack = module.createStack(avatarStack, 'vertical');
    const levelStack = module.createStack(topStack);
    const barStack = module.createStack(levelStack);
    barStack.backgroundColor = new Color(levelColor);
    barStack.setPadding(1, lay.avatarSize, 1, lay.avatarSize);
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
    
    const beneStack = module.createStack(levelStack);
    const benefitText = beneStack.addText('昨日 ');
    benefitText.textColor = textColor;
    benefitText.font = Font.boldSystemFont(14);  
    benefitText.textOpacity = 0.7;
    
    const benefitText2 = beneStack.addText(ystdayPower);
    benefitText2.font = Font.boldSystemFont(16);
    benefitText2.textColor = isArrears == 1 ? Color.blue() : Color.red();
    beneStack.addSpacer();
    
    if (isArrears == 1) {
      const payText0 = beneStack.addText(arrears);
      payText0.font = Font.boldSystemFont(16);
      payText0.textColor = new Color('#FF2400');
    } else if (setting.estimate) {
      const payText0 = beneStack.addText(balance);
      payText0.font = Font.mediumSystemFont(16);
      payText0.textColor = Color.blue();
    }
    topStack.addSpacer(5);
    
    const pointStack = module.createStack(topStack);
    const payStack = module.createStack(pointStack);
    payStack.backgroundColor = new Color(isArrears == 1 ? '#FF0000' : '#AF52DE');
    payStack.setPadding(2, 5, 2, 5);
    payStack.cornerRadius = 5;
    
    const payText = payStack.addText(!areaCode ? '用户未登录' : isArrears == 1 ? '待缴费' : '已缴费');
    payText.font = Font.boldSystemFont(11);
    payText.textColor = Color.white();
    pointStack.addSpacer(8);
    
    const LevelText = pointStack.addText(number);
    LevelText.textColor = textColor;
    LevelText.font = Font.mediumSystemFont(14);
    LevelText.textOpacity = 0.7;
    pointStack.addSpacer();
    
    const barStack2 = module.createStack(pointStack);
    barStack2.setPadding(1, 6, 1, 6);
    barStack2.backgroundColor = new Color(count % 2 === 0 ? '#FFA61C' : '#00C400');
    barStack2.cornerRadius = 5;
    
    const pointText = barStack2.addText(dayBefore);
    pointText.font = Font.boldSystemFont(13);
    pointText.textColor = Color.white();
    mainStack.addSpacer(lay.gapMed);
    
    if (location == 0) progressBar(mainStack, tier);
    
    /** 
     * 中间，底部容器内容
     * @param {image} image
     * @param {string} string
     */
    const middleStack = module.createStack(mainStack);
    createStack(middleStack, false, yearMonth, totalPower, (totalPower > 0 ? cost : '0.00'));
    
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
    
    createStack(middleStack, true, lastMonth, total, totalElectricity);
    mainStack.addSpacer(lay.gapMed);
    
    if (location == 1) progressBar(mainStack, tier);
    if (isArrears == 1) {
      middleStack.url = alipayUrl;
    }
    arrearsNotice();
    return widget;
  };
  
  // ====== 小号组件 ====== //
  const addStack = (stack, month, power, amount, tierIndex, tierColor, barColor, billColor) => {
    const mainStack = module.createStack(stack);
    module.createStack(mainStack, 'horizontal', (barColor ?? tierColor), new Size(6.5, lay.barHeight), 50);
    mainStack.addSpacer(10);
    
    const columnStack = mainStack.addStack();
    columnStack.layoutVertically();
    const upStack = columnStack.addStack();
    upStack.layoutHorizontally();
    
    const amountText = upStack.addText(amount);
    amountText.textColor = billColor;
    amountText.font = Font.boldSystemFont(lay.amountSize);
    amountText.textOpacity = 0.9;
    upStack.addSpacer();
    
    const iconSymbol = SFSymbol.named(tierIndex > 0 ? `${tierIndex}.circle` : 'leaf');
    const icon = upStack.addImage(iconSymbol.image);
    icon.tintColor = new Color(tierColor);
    icon.imageSize = new Size(18, 18);
    
    const powerText = columnStack.addText(`${month.match(/-(\d+)/)[1]}月 ${power} °`);
    powerText.textColor = textColor;
    powerText.textOpacity = 0.7;
    powerText.font = Font.mediumSystemFont(14);
  };
  
  const getTierColor = (tierIndex) => {
    const tierColors = ['#00C400', '#00C400', '#FF7800', '#FF0000'];
    return tierColors[tierIndex] || '#00C400'; // 防止索引超出范围，提供默认值
  };
  
  const processNumber = (num) => {
    const str = num.toString();
    return str.length > 6 ? parseFloat(str.slice(0, isSmall ? 5 : 6)) : num;
  };
  
  // 创建小号组件
  const smallWidget = async () => {
    const random = Math.round(Math.random());
    const result = random === 0 
    ? { title: '昨日', value: processNumber(`${ystdayPower} °`) } 
    : { title: '余额', value: processNumber(balance) };
    
    // 排列顺序
    const rankStack = (groupStack, column, isFirstGroup) => {
      const isCurrentMonth = column == 0 ? isFirstGroup : !isFirstGroup;
      if (isCurrentMonth) {
        return addStack(groupStack, yearMonth, totalPower, totalPower > 0 ? cost : '0.00', tierIndex, getTierColor(tierIndex));
      } else {
        const { tier, tierIndex } = calcElectricBill(total, eleType, areaCode);
        const billColor = new Color(isArrears == 1 ? '#FD4A67' : '#00B388');
        return addStack(groupStack, lastMonth, total, totalElectricity, tierIndex, getTierColor(tierIndex), '#8C7CFF', billColor);
      }
    };
    
    // 创建组件
    const widget = new ListWidget();
    widget.setPadding(lay.padding, lay.padding, lay.padding, lay.padding);
    const groupStack = widget.addStack();
    groupStack.layoutVertically();

    // 第一组
    rankStack(groupStack, column, true)
    groupStack.addSpacer(lay.gap);
    
    // 状态容器(中间)
    const stateStack = module.createStack(groupStack);
    const borStack = stateStack.addStack();
    borStack.backgroundColor = new Color('#0094FF');
    borStack.setPadding(2, lay.gapStack, 2, lay.gapStack);
    borStack.cornerRadius = 5;
    
    const titleText = borStack.addText(name);
    titleText.textColor = Color.white();
    titleText.textOpacity = 0.9;
    titleText.font = Font.boldSystemFont(11.5);
    stateStack.addSpacer(5);
    
    const subText = stateStack.addText(result.title);
    subText.textColor = textColor;
    subText.textOpacity = 0.8;
    subText.font = Font.mediumSystemFont(12.5);
    stateStack.addSpacer(3);
    
    const resultText = stateStack.addText(`${result.value}`);
    resultText.textColor = new Color(result.value < 0 ? '#FF6800' : '#FF0000');
    resultText.font = Font.boldSystemFont(14);
    stateStack.addSpacer(10);
    groupStack.addSpacer(lay.gap);
    
    // 第二组
    rankStack(groupStack, column);
    widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    if (isArrears == 1) {
      widget.url = alipayUrl;
    }
    return widget;
  };
  
  // ======= 电动汽车组件 ====== //
  const addVertical = async (horStack, iconName, iconColor, title, text, gap) => {
    const rowStavk = module.createStack(horStack);
    
    const iconStack = module.createStack(rowStavk);
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
    subtitleText.textColor = textColor;
    subtitleText.font = Font.mediumSystemFont(lay.textSize);
    subtitleText.textOpacity = 0.65
    if (!gap) horStack.addSpacer();
    return horStack;
  };
  
  // 创建电车小号组件
  const eleCarWidget = async () => {
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
    const param = args.widgetParameter;
    const isNumber = param && !isNaN(Number(param));
    let widget;

    if (family === 'medium') {
      widget = await createWidget();
    } else if (isNumber) {
      widget = await eleCarWidget();
    } else if (family === 'small') {
      widget = await smallWidget();
    };
    
    if (setting.alwaysDark) widget.backgroundColor =  Color.black();
    
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