// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: file-alt;
/**
 * 组件名称: 京东白条
 * 组件作者：95度茅台
 * 组件版本: Version 1.0.1
 * 更新日期: 2023-11-11 19:30
 */

async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_jd_baiTiao');
  
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
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { gap, cookie, progressWidth, location } = JSON.parse(fm.readString(file));
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
    )
  };
  
  /**  
   * 弹出一个通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */
  const notify = (title, body, url, opts = {}) => {
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
    const cache = useFileManager({ cacheTime: 24 });
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
    if (response.resultCode === 0) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    } else {
      notify('京东白条', response.message);
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
  
  // 
  const whiteStripe = async () => {
    const url = 'https://ms.jr.jd.com/gw/generic/bt/h5/m/btJrFirstScreenV2'
    const headers = {
      Cookie: cookie,
      Referer: 'https://mcr.jd.com/'
    }
    const body = `reqData={
      "environment": "1", 
      "clientType": "ios", 
      "clientVersion": "11.6.4"
    }`
    
    const {
      resultCode,
      resultData
    } = await getCacheString('whiteStripe.json', url, 'POST', headers, body);
    if ( resultCode == 0 ) {
      return {
        quota: {
          quotaLeft,
          quotaAll
        },
        bill: {
          amount,
          buttonName
        },
        right: {
          data: {
            scorePopJumpUrl,
            title,
            identityPicture,
            portrait,
            percent,
            progressNextLevelText
          }
        }
      } = resultData.data;
    } else {
      console.log(resultData)
    }
  };
  
  //
  const LvlProgress = async (jsonName, url) => {
    const headers = {
      Cookie: cookie,
      Referer: 'https://agree.jd.com/'
    }
    const body = `reqData={  
      "appId": "benefitGateway", 
      "channelId": "1", 
      "customerId": "1", 
      "shopId": "1", 
      "deviceInfo": { }
    }`
    const { resultCode, resultData } = await getCacheString(jsonName, url, 'POST', headers, body);
    if ( resultCode == 0 ) {
      return {
        lvlScore,
        curScore,
        level,
        nextLvl
      } = resultData;
    } else {
      setting.code = 3;
      writeSettings(setting);
      notify('京东小白鹅', 'Cookie已过期，请重新登录京东账号');
    }
  };
  
  //=========> START <=========//
  const benefitNum = await LvlProgress('benefit.json', 'https://ms.jr.jd.com/gw/generic/zc/h5/m/queryBenefit');
  
  const getData = async () => {
    await whiteStripe();
    const LvlProgressData = await LvlProgress('LvlProgress.json', 'https://ms.jr.jd.com/gw/generic/zc/h5/m/queryAccountLvlProgress');
    
    if (level === '1' || level === '2' || level === '3' || level === '4' || level === '5') {
      levelColor = { '1': '#4FC3F7', '2': '#99C0F0', '3': '#FF9999', '4': '#F72E27', '5': '#AB0D0D' }[level];
      barColor = new Color(levelColor, 0.6);
    } else if (level === '6') {
      levelColor = Color.dynamic(new Color('#222222'), new Color("#333333"));
      barColor = Color.dynamic(new Color('#222222', 0.6), new Color("#444444"));
    }
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
    const Appearance = Device.isUsingDarkAppearance();
    if (fm.fileExists(bgImage) && !Appearance) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage))  
    } else if (setting.solidColor && !Appearance) {
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
    } else if (!Appearance) {
      widget.backgroundImage = await getCacheImage("bg.png", 'https://gitcode.net/4qiao/framework/raw/master/img/picture/background_image_1.png');
    } else {
      const baiTiaoUrl = [
        'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baiTiaoBg.png',  
        'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baiTiaoBg1.png',  
        'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baiTiaoBg2.png'];
      const bgImageURL = baiTiaoUrl[Math.floor(Math.random() * baiTiaoUrl.length)];
      const bgImageName = decodeURIComponent(bgImageURL.substring(bgImageURL.lastIndexOf("/") + 1));
      const randomBackgroundImage = await getCacheImage(bgImageName, bgImageURL);
      widget.backgroundImage = randomBackgroundImage;
    }
  };
  
  // 创建组件实例
  async function createWidget() {
    const { alreadyGetBenefitNum } = benefitNum.extValue;

    const widget = new ListWidget();
    await setBackground(widget);
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
    
    /**
     * @param {number} padding
     * @returns {WidgetStack} 
     */
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
    const avatar = await getCacheImage('avatar.png', portrait);
    const iconSymbol = await circleImage(avatar);
    
    if (setting.isPlus) {
      avatarStack2.backgroundImage = iconSymbol;
      const plus = await getCacheImage('plus.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/plus.png');
      const plusImage = avatarStack2.addImage(plus);
      plusImage.imageSize = new Size(55, 55);
    } else {
      const avatarIcon = avatarStack2.addImage(iconSymbol);
      avatarIcon.imageSize = new Size(55, 55);
      avatarStack2.cornerRadius = 50;
      avatarStack2.borderWidth = 3;
      avatarStack2.borderColor = new Color('#FFBF00');
    }
    avatarStack.addSpacer(15);
    
    const topStack = avatarStack.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent();
    
    const levelStack = topStack.addStack();
    levelStack.setPadding(-5, 0, -3, 0); // 后加调整
    levelStack.layoutHorizontally();
    levelStack.centerAlignContent();
    
    const barStack = levelStack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.backgroundColor = level === '6' ? levelColor : new Color(levelColor);
    barStack.setPadding(1, 12, 1, 12)
    barStack.cornerRadius = 10;
    
    const iconSF = SFSymbol.named('crown.fill');
    const barIcon = barStack.addImage(iconSF.image);
    barIcon.imageSize = new Size(20, 20);
    barIcon.tintColor = new Color('#FDDA0D');
    barStack.addSpacer(4);
    
    const titleText = barStack.addText(title);
    titleText.font = Font.boldSystemFont(14);
    titleText.textColor = Color.white();
    levelStack.addSpacer(8);
    
    const beneStack = levelStack.addStack();
    beneStack.layoutHorizontally();
    beneStack.centerAlignContent();
    const benefitText = beneStack.addText(alreadyGetBenefitNum);
    benefitText.font = Font.boldSystemFont(15);
    benefitText.textColor = Color.red();
    
    const benefitText2 = beneStack.addText(' 项特权');
    benefitText2.font = Font.boldSystemFont(13);
    benefitText2.textOpacity = 0.7;
    barStack.addSpacer(5);
    beneStack.addSpacer(); // 调整
    
    const jdImage = await getCacheImage('jdWord.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/jdWord.png');
    const jdIcon = beneStack.addImage(jdImage);
    jdIcon.imageSize = new Size(40, 35);
    topStack.addSpacer(1); // 5
    
    const pointStack = topStack.addStack();
    pointStack.layoutHorizontally();
    pointStack.centerAlignContent();
    const baitiaoImage = await getCacheImage('baitiao.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baitiao.png');
    const baitiaoIcon = pointStack.addImage(baitiaoImage);
    baitiaoIcon.imageSize = new Size(25, 18);
    pointStack.addSpacer(8);
    
    const LevelText = pointStack.addText(progressNextLevelText);
    LevelText.font = Font.mediumSystemFont(12);
    LevelText.textOpacity = 0.7;
    pointStack.addSpacer();
    
    const barStack2 = pointStack.addStack();
    barStack2.layoutHorizontally();
    barStack2.centerAlignContent();
    barStack2.backgroundColor = new Color('#FF9500', 0.7);
    barStack2.setPadding(1, 8, 1, 8);
    barStack2.cornerRadius = 5;
    
    const pointText = barStack2.addText(lvlScore);
    pointText.font = Font.boldSystemFont(11);
    pointText.textColor = new Color('#FFFFFF');
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
    middleStack.layoutHorizontally();
    middleStack.centerAlignContent();
    
    const quotaStack = middleStack.addStack();  
    quotaStack.layoutVertically();
    quotaStack.centerAlignContent();
    
    const quotaStack1 = quotaStack.addStack();
    const quotaText = quotaStack1.addText('可用额度');
    quotaText.font = Font.mediumSystemFont(12);
    quotaText.textOpacity = 0.7;
    quotaStack1.addSpacer();
    quotaStack.addSpacer(3);
    
    const quotaStack2 = quotaStack.addStack();
    const quota = quotaStack2.addText(quotaLeft.replace(',', ''));
    quota.font = Font.boldSystemFont(18);
    quotaStack2.addSpacer();
    quotaStack.addSpacer(3);

    const quotaStack3 = quotaStack.addStack();
    const quotaText2 = quotaStack3.addText(`总额度 ${quotaAll.replace(',', '')}`);
    quotaText2.font = Font.mediumSystemFont(12);
    quotaText2.textOpacity = 0.5;
    quotaStack3.addSpacer();
    middleStack.addSpacer();
    
    const gooseUrl = [
      'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/whiteGoose0.png',
      'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/whiteGoose1.png'];
    const goose = gooseUrl[Math.floor(Math.random() * gooseUrl.length)];
    const bgImageName = decodeURIComponent(goose.substring(goose.lastIndexOf("/") + 1));
    const gooseIcon = await getCacheImage(bgImageName, goose);
    const gooseIconElement = middleStack.addImage(gooseIcon);
    gooseIconElement.imageSize = bgImageName == 'whiteGoose.png' ? new Size(55, 55) : new Size(52, 52);
    middleStack.addSpacer();
    
    const billStack = middleStack.addStack();    
    billStack.layoutVertically();  
    billStack.centerAlignContent();
    
    const billStack1 = billStack.addStack();
    billStack1.addSpacer();
    const billText = billStack1.addText('当月待还');  
    billText.font = Font.mediumSystemFont(12);
    billText.textOpacity = 0.7;
    billStack.addSpacer(3);
    
    billStack2 = billStack.addStack();
    billStack2.addSpacer();
    const bill = billStack2.addText(amount.replace(',', ''));
    bill.font = Font.boldSystemFont(18);
    billStack.addSpacer(3);
    
    billStack3 = billStack.addStack();
    billStack3.addSpacer();
    const billText2 = billStack3.addText(buttonName.replace('最近还款日', '还款日 '));  
    billText2.font = Font.mediumSystemFont(12);
    billText2.textOpacity = 0.5;
    mainStack.addSpacer();
    
    // Switch position
    if (location == 1) {
      await progressBar(mainStack);
    }
    
    // jump App page
    avatarStack2.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fh5.m.jd.com%2FbabelDiy%2FZeus%2FbE7uy5XYMCoM3ZNb8qjT5GWTeNV%2Findex.html%3F%26utm_source%3Diosapp%22%7D'
    barStack.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fagree.jd.com%2Fcredit_rights%2Findex.html%3Ffrom%3Dbtsyright%22%7D'
    gooseIconElement.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fmcr.jd.com%2Fcredit_home%2Fpages%2Findex.html%3FbtPageType%3DBT%26channelName%3D024%22%7D'
    if (config.runsInWidget) {
      Script.setWidget(widget);
      Script.complete();
    } else {
      await widget.presentMedium()
    }
    return widget;
  };
  
  /** 
   * progressBar Stack
   * @param {image} image
   * @param {string} string
   */
  const progressBar = async (mainStack) => {
    const prgrWid = progressWidth;
    const tempBarWidth = curScore == 0 ? prgrWid : curScore <= 100 ? prgrWid - 10 : (curScore > 100 && curScore <= 1000) ? prgrWid - 15 : (curScore > 1000 && curScore <= 10000) ? prgrWid - 25 : prgrWid - 32;
    const tempBarHeight = 16;
      
    const prgsStack = mainStack.addStack();  
    prgsStack.layoutHorizontally();
    prgsStack.centerAlignContent();
      
    const curScoreText = prgsStack.addText(curScore);
    curScoreText.font = Font.boldSystemFont(13);
    prgsStack.addSpacer();
      
    const imgProgress = prgsStack.addImage(creatProgress());
    imgProgress.centerAlignImage();
    imgProgress.imageSize = new Size(tempBarWidth, tempBarHeight);
      
    function creatProgress() {
      const draw = new DrawContext();
      draw.opaque = false;
      draw.respectScreenScale = true;
      draw.size = new Size(tempBarWidth, tempBarHeight);
      
      const barPath = new Path();
      const barHeight = tempBarHeight - 10;
      barPath.addRoundedRect(new Rect(0, 5, tempBarWidth, barHeight), barHeight / 2, barHeight / 2);
      draw.addPath(barPath);
      // Circle Color
      draw.setFillColor((barColor))
      draw.fillPath();
      
      const currPath = new Path();
      const isPercent = percent > 1 ? percent / 100 : percent;
      currPath.addEllipse(new Rect((tempBarWidth - tempBarHeight) * isPercent, 0, tempBarHeight, tempBarHeight));
      draw.addPath(currPath);
      // progressColor
      draw.setFillColor(new Color('#F2F5F7'));
      draw.fillPath();
      return draw.getImage();
    };
      
    prgsStack.addSpacer();
    const isPercent2 = percent < 1 ? percent * 100 : percent;
    const percentText = prgsStack.addText(`${isPercent2} %`);
    percentText.font = Font.boldSystemFont(13);  
    mainStack.addSpacer();
  };
  
  /**-------------------------**/
     /** Request(url) json **/
  /**-------------------------**/
  
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
  
  async function smallrWidget() {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
    Script.complete();
  };
  
  async function createErrWidget() {
    const widget = new ListWidget();
    const image = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/user.png').loadImage();
    const widgetImage = widget.addImage(image);
    widgetImage.imageSize = new Size(50, 50);
    widgetImage.centerAlignImage();
    widget.addSpacer(10);
    const text = widget.addText('用户未登录');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
  };
  
  const runWidget = async () => {  
    if (config.widgetFamily === 'medium' || config.runsInApp) {
      await (setting.code === 0 ? getData().then(createWidget) : createErrWidget());
    } else {
      await smallrWidget();
    }
  };
  await runWidget();
}
module.exports = { main }