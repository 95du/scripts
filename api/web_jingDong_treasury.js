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
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_jd_treasury');
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  
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
  const getBgImagePath = () => {
    const bgPath = fm.joinPath(fm.documentsDirectory(), '95duBackground');
    return fm.joinPath(bgPath, Script.name() + '.jpg');
  };
  
  /**
   * 读取储存的设置
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { cookie, textLightColor, textDarkColor } = JSON.parse(fm.readString(file));
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
   * 弹出通知
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
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage()
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
  
  // get Data
  const myAsset = async () => {
    const url = 'https://ms.jr.jd.com/gw/generic/xjk/h5/m/assetPageH5';
    const headers = {
      Cookie: cookie,
      Referer: 'https://lc.jr.jd.com/'
    };
    const body = `reqData={
      "clientType":"ios",
      "clientVersion":"",
      "channel":"a00808"
    }`;
    
    const {
      resultCode,
      resultData: { data }
    } = await getCacheString('myAsset.json', url, 'POST', headers, body);
    if ( resultCode == 0 ) {
      return {
        profitAmtBar,
        amountBar,
        availableAmountBar,
        totalIncomeAmtBar
      } = data.xjkAssetBar;
    } else {
      setting.code = 3;
      writeSettings(setting);
      notify('京东小金库', 'Cookie已过期，请重新登录京东账号');
    }
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImagePath();
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
      const imgUrl = [
        `${rootUrl}/img/jingdong/treasury.jpeg`, 
        `${rootUrl}/img/jingdong/treasury1.jpeg`
      ];
      const randomUrl = imgUrl[Math.floor(Math.random() * imgUrl.length)];
      const name = randomUrl.split('/').pop();
      widget.backgroundImage = await getCacheImage(name, randomUrl);  
    }
  };
  
  //=========> START <=========//
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
    widget.url = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Flc.jr.jd.com%2Fck%2FxjkHold%2Findex%2F%3Fchannel%3Da00294%22%7D';
    
    const textColor = Color.dynamic(new Color(textLightColor), new Color(textDarkColor));
    
    /**
     * @param {number} padding
     * @returns {WidgetStack} 
     */
    widget.setPadding(0, 0, 0, 0);
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    mainStack.setPadding(20, 30, 15, 30);
    
    const topStack = mainStack.addStack();
    topStack.layoutVertically();
    topStack.centerAlignContent();

    const barStack = topStack.addStack();
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.backgroundColor = new Color('#FFA500');
    barStack.setPadding(3, 10, 3, 10);
    barStack.cornerRadius = 6;
    
    const titleText = barStack.addText(amountBar.text);
    titleText.font = Font.boldSystemFont(14);
    titleText.textColor = new Color('#FFFFFF');
    
    const balanceText = topStack.addText(amountBar.balance);
    balanceText.font = Font.boldSystemFont(28);
    balanceText.textColor = textColor
    topStack.addSpacer();
    
    // 2
    const secondStack = topStack.addStack();
    secondStack.centerAlignContent();
    const secondText = secondStack.addText(availableAmountBar.text);
    secondText.font = Font.boldSystemFont(13);
    secondText.textColor = textColor;
    secondStack.addSpacer(7);
    
    const secondText2 = secondStack.addText(availableAmountBar.balance);
    secondText2.font = Font.boldSystemFont(15);
    secondText2.textColor = textColor
    
    // 3
    const thirdStack = topStack.addStack();
    thirdStack.centerAlignContent();
    const thirdText = thirdStack.addText(totalIncomeAmtBar.text);
    thirdText.font = Font.boldSystemFont(13);
    thirdText.textColor = textColor;
    thirdStack.addSpacer(7);
    
    const thirdText2 = thirdStack.addText(totalIncomeAmtBar.balance);
    thirdText2.font = Font.boldSystemFont(15);
    thirdText2.textColor = textColor;
    
    // 4
    const fourthStack = topStack.addStack();
    fourthStack.centerAlignContent();
    const fourthText = fourthStack.addText(profitAmtBar.text);
    fourthText.font = Font.boldSystemFont(13);
    fourthText.textColor = textColor;
    fourthStack.addSpacer(7);
    
    const fourthText2 = fourthStack.addText(profitAmtBar.balance);
    fourthText2.font = Font.boldSystemFont(15);
    fourthText2.textColor = textColor
    mainStack.addSpacer();
    
    // Right
    const rightStack = mainStack.addStack();
    rightStack.layoutVertically();
    rightStack.centerAlignContent();
    rightStack.setPadding(-12, 0, 0, 0);
    
    const assetIcon = await getCacheImage('jdWord.png', `${rootUrl}/img/jingdong/jdWord.png`);
    const assetImage = rightStack.addImage(assetIcon);
    assetImage.imageSize = new Size(40, 40);
    assetImage.tintColor = new Color('#FFFFFF');
    rightStack.addSpacer();
    
    if (amountBar.balance !== setting.totalAssets) {
      setting.totalAssets = amountBar.balance;
      writeSettings(setting);
      notify('京东金融提醒', `${amountBar.text}变动，剩余 ${amountBar.balance} 元。`);
    }
    
    if (config.runsInWidget) {
      Script.setWidget(widget);
      Script.complete();
    } else {
      await widget.presentMedium()
    }
  };
  
  /**-------------------------**/
  
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
    const image = await getCacheImage('user.png', `${rootUrl}/img/jingdong/user.png`);
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
      await (setting.code === 0 ? myAsset().then(createWidget) : createErrWidget());
    } else {
      await smallrWidget();
    }
  };
  await runWidget();
}
module.exports = { main }