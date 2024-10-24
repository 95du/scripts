// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: tags;
/**
 * 组件名称: 京东收支账单
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.0
 * 更新日期: 2024-10-24 14:30
 */

async function main() {
  const phoneSize = Device.screenSize().height;
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';

  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_jd_Bill');

  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string',
  ].map(getCachePath);
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  /**
   * 读取储存的设置
   * @returns {object} - JSON
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { cookie, statistics } = JSON.parse(fm.readString(file));
    }
    return null;
  };
  const setting = await getBotSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
    console.log(JSON.stringify(
      setting, null, 2)
    );
  }
  
  /**  
  * 弹出一个通知
  * @param {string} title
  * @param {string} body
  * @param {string} url
  * @param {string} sound
  */
  const notify = async (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'alert', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  /**
   * 获取图片并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  const useFileManager = ({ cacheTime } = {}) => {
    return {
      readString: (name) => {
        const filePath = fm.joinPath(cacheStr, name);  
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fm.fileExists(filePath) ? fm.readString(filePath) : null;
      },
      writeString: (name, content) => fm.writeString(fm.joinPath(cacheStr, name), content),
      // cache image
      readImage: (name) => {
        const filePath = fm.joinPath(cacheImg, name);
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fm.fileExists(filePath) ? fm.readImage(filePath) : null;
      },
      writeImage: (name, image) => fm.writeImage(fm.joinPath(cacheImg, name), image),
    };
    
    function hasExpired(filePath) {
      const createTime = fm.creationDate(filePath).getTime();
      return (Date.now() - createTime) / (60 * 60 * 1000)
    }
  };
  
  // 获取图片，使用缓存
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime: 96 });
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
  
  /**
   * 获取 POST JSON 字符串
   * @param {string} json
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, url, method, headers, body) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime })
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    const response = await makeRequest(url, method, headers, body);
    if (response.retcode === 0 || response.resultCode === 0) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    } else {
      console.log(response.message);
    }
    return response;
  };
  
  /**
   * Makes an HTTP request and returns the response as JSON.
   *
   * @param {string} url
   * @param {string} method
   * @param {Object} headers
   * @param {string|null} body
   * @returns {Promise<any>} - JSON
   */
  const makeRequest = async (url, method, headers, body) => {
    const req = new Request(url);
    req.method = method;
    req.headers = headers;
    if (body) req.body = body;
    return await req.loadJSON();
  };
  
  // 用户信息
  const getInfo = async () => {
    const url = 'https://api.m.jd.com?functionId=queryJDUserInfo&appid=jd-cphdeveloper-m';
    const headers = {
      Referer: "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
      Cookie: cookie
    };
    const { base } = await getCacheString('info.json', url, 'GET', headers);
    return { 
      headImageUrl, 
      nickname
    } = base;
  };
  
  // totalAsset
  const totalAsset = async () => {
    const url = 'https://ms.jr.jd.com/gw/generic/bt/h5/m/firstScreenNew';
    const headers = {
      Referer: "https://mallwallet.jd.com/",
      Cookie: cookie
    }
    const body = `reqData={
      "clientType": "ios"
    }`
    const { resultData } = await getCacheString('totalAsset.json', url, 'POST', headers, body);
    return {
      quota: { state },
      bill: { amount }
    } = resultData.data;
  };
  
  // myWallet
  const myWallet = async () => {
    const url = 'https://ms.jr.jd.com/gw2/generic/MyWallet/h5/m/myWalletInfo';
    const headers = {
      Referer: 'https://mallwallet.jd.com/',
      Cookie: cookie
    }
    const body = `reqData={"timestamp":${Date.parse(new Date())}}&aar={"nonce":""}`
    
    const { resultData } = await getCacheString('myWallet.json', url, 'POST', headers, body);
    const arr = resultData.data.floors[0].nodes;
    for (const item of arr) {
      const foundItem = item.title.value.includes('总资产');
      if (foundItem) return { assetAmt } = item.data;
    }
  };
  
  // incomeData
  const incomeData = async (status, yearMonth) => {
    const url = 'https://bill.jd.com/monthBill/statistics.html';
    const headers = {
      Cookie: cookie,
      Referer: 'https://mse.jd.com/'
    }
    const body = `yearMonth=${yearMonth}&direction=${status}`
    const response = await getCacheString(`incomeData_${status}.json`, url, 'POST', headers, body);
    return response;
  };
  
  // monthBillRank
  const monthBillRank = async (status, yearMonth) => {
    const url = 'https://bill.jd.com/monthBill/rank.html';
    const headers = {
      Cookie: cookie,
      Referer: 'https://mse.jd.com/'
    }
    const body = `yearMonth=${yearMonth}&direction=${status}&sortField=1&sortType=DESC&pageNum=1&pageSize=20`
    const response = await getCacheString(`monthBillRank_${status}.json`, url, 'POST', headers, body);
    return response;
  };
  
  // allDetail
  const allDetail = async () => {
    const url = 'https://bill.jd.com/bill/getMListData.html';
    const headers = {
      Cookie: cookie
    }
    return await getCacheString('allBillDetail.json', url, 'POST', headers);
  };
  
  // 处理 cookie 过期及每日签到缓存
  const handleExpired = () => {
    const filePath = fm.joinPath(cacheStr, 'signBeanAct.json');
    if (fm.fileExists(filePath)) {
      fm.remove(filePath);
    }
  }
  // 签到
  const signBeanAct = async () => {
    const url = 'https://api.m.jd.com/client.action?functionId=signBeanAct&appid=ld';
    const headers = {
      Referer: 'https://h5.m.jd.com/',
      Cookie: cookie
    }
    const body = `body={
      fp: "-1",
      shshshfp: "-1",
      shshshfpa: "-1",
      referUrl: "-1",
      userAgent: "-1",
      jda: "-1",
      rnVersion: "3.9"
    }`
    const response = await getCacheString('signBeanAct.json', url, 'POST', headers, body);
    if (response.code === '0') {
      const { data } = response;
      const { status, dailyAward, continuousDays, tomorrowSendBeans, totalUserBean, continuityAward } = data;
      if (status === '1') {
        handleExpired();
        if (dailyAward) {
          notify(`${dailyAward.title}${dailyAward.subTitle} ${dailyAward.beanAward.beanCount} 京豆`, `已签到 ${continuousDays} 天，明天签到加 ${tomorrowSendBeans} 京豆 ( ${totalUserBean} )`);
        } else {
          notify(continuityAward.title, `获得 ${continuityAward.beanAward.beanCount} 京豆，已签到 ${continuousDays} 天，明天签到加 ${tomorrowSendBeans} 京豆 ( ${totalUserBean} )`);
        }
      }
      return data;
    } else {
      setting.code = 3;
      writeSettings(setting);
      handleExpired();
      notify(response.errorMessage, 'Cookie 过期，请重新登录京东 ‼️');
    }
  };
  
  const sign = await signBeanAct();
  if (sign !== undefined) {
    const df = new DateFormatter();
    df.dateFormat = 'yyyy-MM';
    yearMonth = (df.string(new Date()));
    income = await incomeData('IN', yearMonth);
    inCode = income.responseCode === '00000';
    if (inCode) {
      inTotal = income.totalAmount;
      inPercent = income.list[0].amount;
      inP = income.list[0].percent;
      inPer = inP === '100.00' ? String(Math.floor(inP)) : Number(inP).toFixed(1);
    } else {
      inTotal = '1';
      inPercent = '0';
      inPer = '0.00';
    }
    
    expend = await incomeData('OUT', yearMonth);
    outCode = expend.responseCode === '00000';
    if (outCode) {
      outTotal = expend.totalAmount;
      outPercent = expend.list[0].amount
      outP = expend.list[0].percent;
      outPer = outP === '100.00' ? String(Math.floor(outP)) : Number(outP).toFixed(1);
    } else {
      outTotal = '1';
      outPercent = '0';
      outPer = '0.00';
    }
  };
  
  // inRank & outRank
  const Run = async () => {
    if (statistics === 0) {
      setting.statistics = 1;
      const inRank = await monthBillRank('IN', yearMonth);
      const inCode = inRank.responseCode === '00000';
      if (inCode) {
        const { showText, amount, date, icon } = inRank.list[0];
        return { icon, det: `${showText.match(/[\w\W]{2}/)[0]}  ${amount}，${date}` }
      }
    } else if (statistics === 1) {
      setting.statistics = 0;
      const outRank = await monthBillRank('OUT', yearMonth);
      const outCode = outRank.responseCode === '00000';
      if (outCode) {
        const { showText, amount, date, icon } = outRank.list[0];
        return { icon, det: `支出  ${amount}，${date}` }
      }
    } // 月收支排行榜

    if (!inCode || !outCode) {
      const { responseCode, list } = await allDetail();
      if (responseCode === '00000') {
        const { customCategoryName, payMoney, date, iconUrl } = list[0];
        return {
          icon: iconUrl,
          det: `${customCategoryName}  ${payMoney}，${date}`
        }
      } else {
        return {
          icon: `${rootUrl}/img/icon/weChat.png`,
          det: '没有收入/支付交易记录'
        }
      }
    } // 全部账单
  };
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage()
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImage();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage))
    } else if (setting.solidColor) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length === 0 ? [setting.rangeColor] : setting.gradient;
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
        new Color(randomColor, setting.transparency),
        new Color('#00000000')
      ];
      widget.backgroundGradient = gradient;
    } else {
      widget.backgroundColor = Color.dynamic(new Color('#fefefe', 0.5), new Color('#111111'));
    }
  };
  
  // 创建组件实例
  const createWidget = async () => {
    const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
    let { icon, det } = await Run();
    const iconNane = icon.split('/').pop();
    icon = await getCacheImage(iconNane, icon);
    
    const widget = new ListWidget();
    await setBackground(widget);
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
    
    /**
     * @param {number} padding
     * @returns {WidgetStack} 
     */
    widget.setPadding(10, 10, 10, 10);
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    mainStack.addSpacer();
    
    /** 
     * Left Content
     * @param {image} image
     * @param {string} string
     */
    const leftStack = mainStack.addStack();
    leftStack.layoutVertically();
    leftStack.centerAlignContent();
    leftStack.addSpacer();
    leftStack.size = new Size(phoneSize < 926 ? 70 : 80, 0);
    
    // avatarStack
    const avatarStack = leftStack.addStack();
    const avatar = await getCacheImage('avatar.png', headImageUrl);
    const iconSymbol = await circleImage(avatar);
    
    if (setting.isPlus) {
      avatarStack.backgroundImage = iconSymbol;
      const plus = await getCacheImage('plus.png', `${rootUrl}/img/jingdong/plus.png`);
      const plusImage = avatarStack.addImage(plus);
      plusImage.imageSize = new Size(62, 62);
    } else {
      const avatarIcon = avatarStack.addImage(iconSymbol);
      avatarIcon.imageSize = new Size(62, 62);
      avatarStack.cornerRadius = 50;
      avatarStack.borderWidth = 3;
      avatarStack.borderColor = new Color('#FFBF00');
    }
    leftStack.addSpacer(6.5);
    
    // name stack
    const nameStack = leftStack.addStack();
    nameStack.layoutHorizontally();
    nameStack.centerAlignContent();
    const nameIcon = await getCacheImage('name.png', 'https://img30.360buyimg.com/jdmonitor/jfs/t1/149551/5/31020/4346/64240e05F08360629/7759ad228a05f6cf.png');
    const nameIconElement = nameStack.addImage(nameIcon);
    nameIconElement.imageSize = new Size(16, 16);
    nameStack.addSpacer(5);
    
    const nameText = nameStack.addText(setting.userName ?? nickname);
    nameText.font = Font.mediumSystemFont(12);
    nameText.textColor = textColor;
    nameText.textOpacity = 0.8;
    leftStack.addSpacer(3);
  
    // Baitiao Stack
    const btStack = leftStack.addStack();
    btStack.layoutHorizontally();
    btStack.centerAlignContent();
    const baitiaoImage = await getCacheImage('baitiao.png', `${rootUrl}/img/jingdong/baitiao.png`);
    const baitiaoIcon = btStack.addImage(baitiaoImage);
    baitiaoIcon.imageSize = new Size(25, 18);
    btStack.addSpacer(6);
    
    const Amount = state === '1' ? amount.replace(',', '') : '0.00';
    const baitiaoText = btStack.addText(Amount >= '1000' ? String(Math.floor(Amount)) : Amount);
    baitiaoText.font = Font.mediumSystemFont(14);
    baitiaoText.textColor = textColor;
    mainStack.addSpacer();
    
    /** 
     * Right Content
     * @param {image} image
     * @param {string} jd_value
     */
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.centerAlignContent();
    
    const logoStack = rightStack.addStack();
    logoStack.layoutHorizontally();
    logoStack.centerAlignContent();
    const logoImage = await getCacheImage('logo.png', `${rootUrl}/img/jingdong/jd_logo.png`);
    const logoIcon = logoStack.addImage(logoImage);
    logoIcon.imageSize = new Size(32, 32);
    logoStack.addSpacer();
    
    const assetText = logoStack.addText(assetAmt);
    assetText.textColor = Color.red();
    assetText.font = Font.boldSystemFont(20);
    assetText.textOpacity = 0.8;
    logoStack.addSpacer();
    
    const jdImage = await getCacheImage('jdWord.png', `${rootUrl}/img/jingdong/jdWord.png`);
    const jdIcon = logoStack.addImage(jdImage);
    jdIcon.imageSize = new Size(36, 36);
    
    /*
     * Right Center Stack
     */
    const middleStack = rightStack.addStack();
    middleStack.layoutHorizontally();
    middleStack.setPadding(6, 0, 6, 0);
    
    const midLeftStack = middleStack.addStack();
    midLeftStack.layoutVertically();
    
    const inStack1 = midLeftStack.addStack();
    const inText = inStack1.addText(inCode ? income.compareLastTotalAmount : '收入/月');
    inText.font = Font.mediumSystemFont(13);
    inText.textColor = textColor;
    inText.textOpacity = 0.7;
    inStack1.addSpacer();
    midLeftStack.addSpacer(7);
    
    const inStack2 = midLeftStack.addStack();
    const inAmountText = inStack2.addText(income.responseCode == 00000 ? income.totalAmount : '0.00');
    inAmountText.font = Font.boldSystemFont(20);
    inAmountText.leftAlignText();
    inAmountText.textOpacity = 0.9;
    inAmountText.textColor = textColor;
    inStack2.addSpacer();
    middleStack.addSpacer();
    
    const moneyBagUrl = [
      // 'https://img30.360buyimg.com/jdmonitor/jfs/t1/191158/3/10079/3167/60d4547bEee00ce33/dc8d2287590e39af.png',  
      'https://kjimg10.360buyimg.com/jr_image/jfs/t1/205492/13/33247/3505/64ddf97fF4361af37/ffad1b1ba160d127.png',
      `${rootUrl}/img/jingdong/walket.png`
    ];
    const moneyBag = moneyBagUrl[Math.floor(Math.random() * moneyBagUrl.length)];
    const bgImageName = decodeURIComponent(moneyBag.substring(moneyBag.lastIndexOf("/") + 1));
    const assetIcon = await getCacheImage(bgImageName, moneyBag);
    const assetIconElement = middleStack.addImage(assetIcon);
    const bag = moneyBag.indexOf('gitcode') > -1 ? 48 : 41;
    assetIconElement.imageSize = new Size(bag, bag);
    middleStack.addSpacer();
    
    const midRightStack = middleStack.addStack();
    midRightStack.layoutVertically();
    
    const outStack1 = midRightStack.addStack();
    outStack1.addSpacer();
    const outText = outStack1.addText(outCode ? expend.compareLastTotalAmount : '支出/月');
    outText.font = Font.mediumSystemFont(13);
    outText.textColor = textColor;
    outText.textOpacity = 0.7;
    outText.rightAlignText();
    midRightStack.addSpacer(7);

    const outStack2 = midRightStack.addStack();
    outStack2.addSpacer();
    const outAmountText = outStack2.addText(expend.responseCode == 00000 ? expend.totalAmount : '0.00');
    outAmountText.font = Font.boldSystemFont(20);
    outAmountText.textColor = textColor;
    outAmountText.rightAlignText();
    outAmountText.textOpacity = 0.9;
    
    // Right bottom Stack
    const lowerStack = rightStack.addStack();
    lowerStack.size = new Size(0, 16)
    lowerStack.layoutHorizontally();
    lowerStack.centerAlignContent();
    const billImage = await circleImage(icon);
    const billIcon = lowerStack.addImage(billImage);
    billIcon.imageSize = new Size(16, 16);
    lowerStack.addSpacer(8);
    
    const billText = lowerStack.addText(det);
    billText.textColor = Color.red();
    billText.font = Font.boldSystemFont(13);
    billText.textOpacity = 0.8;
    mainStack.addSpacer();
    widget.addSpacer(5);
    
    /** 
    * widget Bottom Content
    * @param {image} Progress Bar
    * @param {string} string
    */
    const width = Number(setting.progressWidth);
    const height = Number(setting.progressHeight);
    const radius = height / 2
    
    getwidget(outTotal, outPercent, '支出', `${outPer} %`, progressColor = new Color(setting.progressColor1));
    getwidget(inTotal, inPercent, '收入', `${inPer} %`, progressColor = new Color(setting.progressColor2));
    
    function getwidget(inTotal, haveGone, str, percent, progressColor) {
      const percStack = widget.addStack();
      percStack.layoutHorizontally();
      percStack.centerAlignContent();  
      percStack.setPadding(0, 7.8, 0, 7.8);
      
      const title = percStack.addText(str);
      title.centerAlignText();
      title.font = Font.boldSystemFont(12);
      title.textColor = textColor;
      title.textOpacity = 0.7;
      percStack.addSpacer(8);
      
      const imgProgress = percStack.addImage(creatProgress(inTotal, haveGone));
      imgProgress.centerAlignImage();
      imgProgress.imageSize = new Size(width, height);
      percStack.addSpacer();
      
      const percentText = percStack.addText(percent);
      percentText.centerAlignText();
      percentText.font = Font.boldSystemFont(12);
      percentText.textColor = textColor;
      percentText.textOpacity = 0.7;
      widget.addSpacer(phoneSize < 926 ? 1.5 : 2.5)
    }
    widget.addSpacer(5);
    
    function creatProgress(inTotal, haveGone) {
      const context = new DrawContext();
      context.size = new Size(width, height);
      context.opaque = false
      context.respectScreenScale = true
      const barColor = Color.dynamic(new Color('#CFCFCF'), new Color('#7A7A7A'));
      context.setFillColor(barColor);
      
      const path = new Path();
      path.addRoundedRect(new Rect(0, 0, width, height), radius, radius);
      context.addPath(path);
      context.fillPath();
      context.setFillColor(
        progressColor
      );
      
      const path1 = new Path();
      path1.addRoundedRect(new Rect(0, 0, width * haveGone / inTotal, height), radius, radius);
      context.addPath(path1);
      context.fillPath();
      return context.getImage();
    }
    
    avatarStack.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fh5.m.jd.com%2FbabelDiy%2FZeus%2FbE7uy5XYMCoM3ZNb8qjT5GWTeNV%2Findex.html%3F%26utm_source%3Diosapp%22%7D'
    assetIconElement.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fmbt.jd.com%2Fbill%2Fmonthlybill%2Fmonthbillcore%2Fmonth-bill-index.html%3Fchannelcode%3D024%22%7D'

    if (config.runsInApp) {
      await widget.presentMedium()
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
    return widget;
  };
  
  // error widget
  async function createErrWidget() {
    const widget = new ListWidget();
    const image = await new Request(`${rootUrl}/img/jingdong/user.png`).loadImage();
    const widgetImage = widget.addImage(image);
    widgetImage.imageSize = new Size(50, 50);
    widgetImage.centerAlignImage();
    widget.addSpacer(10);
    const text = widget.addText('用户未登录');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
  }; 
  
  async function smallrWidget() {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
    Script.complete();
  };
  
  // Circle image
  async function circleImage(url) {
    typeof url === 'object' ? img = url : img = await new Request(url).loadImage();
    const imgData = Data.fromPNG(img).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />
        `
    const js = `
      var canvas = document.createElement("canvas");
      var sourceImg = document.getElementById("sourceImg");
      var silhouetteImg = document.getElementById("silhouetteImg");
      var ctx = canvas.getContext('2d');
      canvas.width = sourceImg.width;
      canvas.height = sourceImg.height;
      ctx.save();
      ctx.arc(sourceImg.width / 2, sourceImg.height / 2, sourceImg.height / 2.1, 0, 1.9 * Math.PI);
      ctx.clip();
      ctx.drawImage(sourceImg, 0, 0);
      ctx.restore();
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.putImageData(imgData,0,0);
      silhouetteImg.src = canvas.toDataURL();
      output=canvas.toDataURL();
        `
    let wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    return iconImage
  };
  
  /**-------------------------**/
       /** runWidget() **/
  /**-------------------------**/
  const runWidget = async () => {
    if (setting.code === 0) {
      await Promise.all([ getInfo(), totalAsset(), myWallet() ]);
    }
    if (config.widgetFamily === 'medium' || config.runsInApp) {
      await (setting.code === 0 ? createWidget() : createErrWidget());
    } else {
      await smallrWidget();
    }
  };
  await runWidget();
}
module.exports = { main }