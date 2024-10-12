// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;
/**
 * 组件作者: 95度茅台
 * 组件名称: 中国电信_3
 * 组件版本: Version 1.0.1
 * 发布日期: 2024-04-16 15:30
 */


async function main(family) {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_china_telecom_3');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string',
  ].map(getCachePath);
  
  /**
   * 读取储存的设置
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { rank, bill, useCache } = JSON.parse(fm.readString(file));
    }
    return {};
  };
  const setting = await getBotSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
    console.log(JSON.stringify(
      settings, null, 2
    ))
  };
  
  /**  
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */
  const notify = (title, body, url, sound = 'event') => {
    if (!setting.notify) return;
    const n = Object.assign(new Notification(), { title, body, sound });
    if (url) n.openURL = url;
    n.schedule();
  };
    
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
  
  // 获取随机数组元素
  const getRandomItem = async (array) => array[Math.floor(Math.random() * array.length)];
  
  /**
   * 获取图片、string并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
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
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime : 240 });
    const image = cache.read(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.write(name, img);
    return img;
  };
    
  /**
   * 获取缓存的 JSON 字符串
   * @param {string} jsonName
   * @param {string} jsonUrl
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, jsonUrl) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime, type: true });
    const json = cache.read(jsonName);
    if (json) return json;
    
    let response = await makeReq(jsonUrl);
    if (response?.serviceResultCode == 0 && setting.cookie) {
      cache.write(jsonName, response)
    } else {
      const cookie = await updateCookie(setting.loginUrl);
      if (cookie) response = await makeReq(jsonUrl);
    }
    return response;
  };
  
  /**
   * Get boxjs Data
   * Dependency: Quantumult-X
   */
  const getBoxjsData = async () => {
    try {
      const response = await new Request('http://boxjs.com/query/data/china_telecom_loginUrl').loadJSON();
      const loginUrl = response?.val;
      if (loginUrl) {
        setting.loginUrl = loginUrl;
        writeSettings(setting);
        return await updateCookie(loginUrl);
      }
    } catch (e) {
      notify('获取 Boxjs 数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
      return null;
    }
  };
  
  const updateCookie = async (loginUrl) => {
    const url = loginUrl.match(/(http.+)&sign/)?.[1] || loginUrl;
    const req = new Request(url);
    await req.load();  
    const cookie = req.response.headers['Set-Cookie'];
    if (cookie) {
      setting.cookie = cookie;
      writeSettings(setting);
      notify('中国电信_3', '天翼账号中心 Cookie 更新成功');
      return cookie;
    }
  };
  
  const makeReq = async (url) => {
    let cookie = setting.cookie;
    if (!cookie) {
      cookie = setting.loginUrl 
      ? await updateCookie(setting.loginUrl) 
      : await getBoxjsData();
    }
    const request = new Request(url);
    request.method = 'GET';
    request.headers = {
      Cookie: cookie
    };
    try {
      return await request.loadJSON();
    } catch (e) {
      console.log(e);
    }
  };
  
  /**
   * 从用户套餐页面获取数据，并进行处理
   * @returns {Promise<Object>} - 包含处理后的语音、流量和余额信息的对象
   */
  const formatFlows = (flow) => flow == 0 ? '0 MB' : flow < 1 ? `${(flow * 1024).toFixed(1)} MB` : `${parseFloat(flow).toFixed(flow < 100 ? 2 : 1)} GB`;
  
  const fetchPackage = async () => {
    const package = await getCacheString('package_detail.json', 'https://e.dlife.cn/user/package_detail.do');
    return package || {};
  };
  
  let voiceTotal = 0;
  let voiceBalance = 0;
  let totalFlow = 0;
  let balanceFlow = 0;
  
  const package = await fetchPackage();
  package?.items?.forEach(data => {
    data?.items?.forEach(item => {
      const { ratableAmount: amount, ratableResourcename: name } = item;
      if (item.unitTypeId == 1) {
        voiceTotal += parseFloat(item.ratableAmount);
        voiceBalance += parseFloat(item.balanceAmount);
      } else if (item.unitTypeId == 3 && amount < 999999990000 && (setting.orient ? name.includes('定向') : !name.includes('定向'))) {
        totalFlow += parseFloat(item.ratableAmount);
        balanceFlow += parseFloat(item.balanceAmount);
      } 
    });
  });
  
  // 语音
  const voice = voiceTotal > 0 ? (voiceBalance / voiceTotal * 100).toFixed(1) : 0;
  
  // 流量
  const flowTotal = (totalFlow / 1048576).toFixed(2);
  const flowBalance = (balanceFlow / 1048576).toFixed(2);
  const flow = flowTotal > 0 ? (flowBalance / flowTotal * 100).toFixed(1) : 0;
  // 格式化流量
  const flowBalFormat = formatFlows(flowBalance) || 0;
  
  // 已用流量
  const usedFlow = flowTotal - flowBalance;
  const used = usedFlow > 0 ? (usedFlow / flowTotal * 100).toFixed(1) : 0;
  // 格式化已用流量
  const flowUsedFormat = formatFlows(usedFlow) || 0;
  
  /**
   * 计算余额百分比
   * @param {number} value - 余额值
   * @returns {number} - 计算结果
   */
  const calculateTotal = (value) => {
    const thresholds = [100, 300, 500, 1000, 3000, 5000];
    return thresholds.find((threshold) => value < threshold) || 5000;
  };
  
  const fetchBalance = async () => {
    const balances = await getCacheString('balance.json', 'https://e.dlife.cn/user/balance.do');  
    return balances || {};
  };
  
  const bal = await fetchBalance();
  const feeBalance = bal.serviceResultCode == 0 ? (bal.totalBalanceAvailable / 100).toFixed(2) : 0;
  const feeTotal = calculateTotal(feeBalance);
  const fee = feeTotal > 0 ? (feeBalance / feeTotal * 100).toFixed(1) : 0;
  
  // 账单
  const getUserBill = async () => {
    const data = await getCacheString('bill.json', 'https://e.189.cn/user/bill.do');
    if (data && data.serviceResultCode == 0) {
      const bill = (data.items[0].sumCharge) / 100;
      return bill;
    }
    return 0;
  };
  const sumCharge = await getUserBill();
  
  // 用量通知
  const formatFlow = (isFlowBalance, isFlow) => {
    const uesd = (isFlowBalance - isFlow).toFixed(2);
    return uesd <= 0 ? '0 MB' : `${uesd >= 1 ? uesd + ' GB' : (uesd * 1024).toFixed(1) + ' MB'}`;
  };
  
  const hourlyWrite = async (flowBalance, voiceBalance) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (setting.cookie && (timeDifference >= setting.cacheTime || !setting.flowBalance)) {  
      const flowUesd = formatFlow(setting.flowBalance, flowBalance);
      notify(`中国电信${setting.cacheTime}小时用量‼️`, `流量使用 ${flowUesd}，语音使用 ${setting.voiceBalance - voiceBalance} 分钟。`);
      writeSettings({ 
        ...setting,
        flowBalance,
        voiceBalance
      });
    }
  };
  
  // 其他
  const getLayout = (scr = Device.screenSize().height) => ({
    titleSize: scr < 926 ? 17 : 18,
    circle: scr < 926 ? 145 : 152
  });
  
  const logo = await getCacheImage('telecom.png', 'https://gitcode.net/4qiao/framework/raw/master/img/icon/telecom_4.png');
  
  const subTitleColor = Color.dynamic(new Color(setting.subTitleColor), new Color('#FFFFFF'));
  
  const feeColor = Color.dynamic(new Color(setting.feeColor), new Color(setting.feeDarkColor));
  
  const voiceColor = Color.dynamic(new Color(setting.voiceColor), new Color(setting.voiceDarkColor));
  
  const flowColor = Color.dynamic(new Color(setting.flowColor), new Color(setting.flowDarkColor));
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImage();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else if (!setting.solidColor && !Device.isUsingDarkAppearance()) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 ? setting.gradient : [setting.rangeColor];
      const randomColor = await getRandomItem(color);
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
    } else {
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
  };
  
  const canvSize = 200;
  const canvWidth = 13;
  
  const drawArc = async (canvas, radius, deg, fillColor) => {
    const ctr = new Point(canvSize / 2, canvSize / 2);
  
    canvas.setFillColor(fillColor);
    canvas.setLineWidth(canvWidth);
    const alpha = Color.dynamic(new Color(fillColor.hex, 0.2), new Color(fillColor.hex, 0.3));
    canvas.setStrokeColor(alpha);
  
    const ellipseRect = new Rect(ctr.x - radius, ctr.y - radius, 2 * radius, 2 * radius);
    canvas.strokeEllipse(ellipseRect)
  
    for (let t = 0; t < deg; t++) {
      const x = ctr.x + radius * Math.sin((t * Math.PI) / 180) - canvWidth / 2;
      const y = ctr.y - radius * Math.cos((t * Math.PI) / 180) - canvWidth / 2;
      const rect = new Rect(x, y, canvWidth, canvWidth);
      canvas.fillEllipse(rect);
    }
  };
  
  const drawCircle = async (progressData) => {
    const canvas = new DrawContext();
    canvas.opaque = false;
    canvas.respectScreenScale = true;
    canvas.size = new Size(canvSize, canvSize);
    
    progressData.forEach(({ radius, progress, color }) => {
      drawArc(canvas, radius, Math.floor(progress * 3.6), color);
    });

    const imgWidth = 52;
    const imgHeight = 52;
    const iconX = (canvSize - imgWidth) / 2;
    const iconY = (canvSize - imgHeight) / 2;
    canvas.drawImageInRect(logo, new Rect(iconX, iconY, imgWidth, imgHeight));
    
    return canvas;
  };
  
  // 
  const addVertical = async ({ stack, title, balance, newUnit, percent, symbol, color, gap }) => {  
    const rowStavk = stack.addStack();
    rowStavk.layoutHorizontally();
    rowStavk.centerAlignContent();
    
    const iconStack = rowStavk.addStack();
    iconStack.layoutHorizontally();
    iconStack.centerAlignContent();
    iconStack.size = new Size(37, 37);
    if (title === '流量') iconStack.setPadding(2, 0, 0, 0);
    iconStack.cornerRadius = setting.radius || 50;
    iconStack.backgroundColor = color
    
    if (symbol) {
      const iconSymbol = SFSymbol.named(symbol);
      iconImage = iconStack.addImage(iconSymbol.image);
      iconImage.imageSize = new Size(24, 24);
    } else {
      iconImage = iconStack.addImage(logo);
      iconImage.imageSize = new Size(20.5, 20.5);
    }
    iconImage.tintColor = Color.white();
    rowStavk.addSpacer(7);
    
    const verticalStack = rowStavk.addStack();
    verticalStack.layoutVertically();
    
    const titleText = verticalStack.addText(balance + newUnit);
    const lay = getLayout();
    titleText.font = Font.mediumSystemFont(setting.textSize || lay.titleSize);
    titleText.textColor = color;
    
    const newUnitText = verticalStack.addText(title + percent);
    newUnitText.font = Font.mediumSystemFont(12.5);
    newUnitText.textColor = subTitleColor;
    newUnitText.textOpacity = 0.88
    
    if (!gap) stack.addSpacer();
    return rowStavk;
  };
  
  // 排列左侧 Stack
  const addStackColumn = async (columns) => {
    columns.forEach(({ ...rest }, index) => {
      const gap = index === columns.length - 1;
      addVertical({ ...rest, gap });
    })
  };
  
  const rearrangeData = (data) => data.map((item, i) => ({
    ...item, 
    ...data[rank[i].value]
  }));
  
  // 创建组件
  const createWidget = async () => {
    const widget = new ListWidget();
    const mainStack = widget.addStack();
    mainStack.setPadding(0, family !== 'small' ? 7 : 0, 0, 0);
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const horStack = mainStack.addStack();
    horStack.layoutVertically();
    
    const leftColumn = [
      {
        stack: horStack,
        title: bill ? '账单' : '话费',
        balance: feeBalance,
        newUnit: ' $',
        percent: bill ? `  ${sumCharge}` : `  ${fee}%`,
        symbol: family === 'small' ? '' : 'network',
        color: feeColor
      },
      {
        stack: horStack,
        title: '语音',
        balance: voiceBalance,
        newUnit: ' min',
        percent: `  ${voice}%`,
        symbol: 'phone.fill',
        color: voiceColor,
      },
      {
        stack: horStack,
        title: setting.used ? '已用' : '流量',
        balance: setting.used ? flowUsedFormat : flowBalFormat,
        newUnit: '',
        percent: `  ${setting.used ? used : flow}%`,
        symbol: 'antenna.radiowaves.left.and.right',
        color: flowColor,
      }
    ];
    
    const arrangeStack = rearrangeData(leftColumn);
    addStackColumn(arrangeStack);
    mainStack.addSpacer();
    
    if (family !== 'small') {
      const circleStack = mainStack.addStack();
      const lay = getLayout();
      circleStack.size = new Size(0, lay.circle);
      
      const progressData = [
        { radius: 85, progress: fee, color: feeColor },
        { radius: 70, progress: voice, color: voiceColor },
        { radius: 55, progress: flow, color: flowColor }  
      ];
      
      const arrangeProgress = progressData.map((item, i) => ({  
        ...item,
        progress: progressData[rank[i].value].progress,
        color: progressData[rank[i].value].color
      }));
      
      const canvas = await drawCircle(arrangeProgress);
      const circle = canvas.getImage();
      circleStack.addImage(circle);
    };
    
    return widget;
  };
  
  const runWidget = async () => {
    const widget = config.widgetFamily !== 'large' ? await createWidget() : null;
    await setBackground(widget);
    hourlyWrite(flowBalance, voiceBalance);
    
    if (setting.alwaysDark) widget.backgroundColor = new Color('#000000');
    if (feeBalance < 0) {
      widget.url = 'alipays://platformapi/startapp?appId=2021001107610820&page=pages%2Ftop-up%2Fhome%2Findex';
    }
    
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