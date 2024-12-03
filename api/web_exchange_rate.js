// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: sort-alpha-up;
/**
 * 组件作者: 95度茅台
 * 组件名称: 人民币汇率
 * Version 1.1.0
 * 2024-10-24 16:30
 * https://www.wochala.com/huilv/currency-cny.html
 */

async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_exchange_rate');
  
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
      return { solidColor, radius, iconSize, padding } = JSON.parse(fm.readString(file));
    }
    return null;
  };
  const setting = await getBotSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
    console.log(JSON.stringify(
      settings, null, 2)
    )
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
  
  /**
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const getImage = async (url) => {
    return await new Request(url).loadImage();
  };
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime : 240 });
    const image = cache.readImage(name);
    if (image) return image;
    const img = await getImage(url);
    cache.writeImage(name, img);
    return img;
  };
  
  /**
   * 获取 POST JSON 字符串
   * @param {string} json
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, jsonUrl) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime });
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    const response = await getJson(jsonUrl);
    const { reason } = response;
    if ( reason === 'success' ) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    }
    return response;
  };
  
  // 人民币(CNY)汇率
  const getJson = async (url) => {
    return await new Request(url).loadJSON();
  };
  
  const fetchExchangeRate = async () => {
    const { result } = await getCacheString(`${setting.currency}.json`, `https://www.wochala.com/api.huilv/convert?from=${setting.currency}&to=cny&amount=1`);
    return result;
  };

  const {
    localTime,
    to: {
      amount,
      currency: china
    }, 
    positive,
    timestamp,
    negative,
    from: {
      cnName,
      currency
    }
  } = await fetchExchangeRate();
  
  //=========> config <=========//
  const cnyColor = Color.dynamic(
    new Color("#000000"), 
    new Color("#FFE300")
  );
  
  // Timestamp Formatter
  const formatDate = (localTime, format) => {
    const df = new DateFormatter();
    df.dateFormat = format;
    return df.string(new Date(localTime * 1000));
  };
  const updateTime = formatDate(localTime, 'MM-dd HH:mm');
  
  const fromImage = await getCacheImage(`${currency}.png`, `https://raw.githubusercontent.com/95du/scripts/master/img/flag/${currency}.png`)
  const toImage = await getCacheImage('CNY.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/flag/CNY.png');
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else if (!setting.solidColor) {
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
    } else {
      widget.backgroundColor = Color.dynamic(new Color("#FEFEFE"), new Color('#111111'));
    }
  };
  
  /**
   * Create Small Widget
   * @param { string } string
   * @param { image } image
   */
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
    await setBackground(widget);
    
    widget.setPadding(padding, padding, padding, padding);
    const topStack = widget.addStack();
    topStack.layoutHorizontally();
    topStack.centerAlignContent();
    
    const iconStack = topStack.addStack();
    iconStack.cornerRadius = radius;
    const topLeftImage = iconStack.addImage(fromImage);  
    topLeftImage.imageSize = new Size(iconSize, iconSize);
    if (currency === 'SGD' || currency === 'CAD' && !Device.isUsingDarkAppearance() && solidColor) {
      iconStack.borderWidth = 0.7
      iconStack.borderColor = Color.red();
    }
    topStack.addSpacer();
    
    const rightStack = topStack.addStack();
    rightStack.layoutVertically();
    rightStack.centerAlignContent();
    
    const caNameStack = rightStack.addStack();
    caNameStack.layoutHorizontally();
    caNameStack.centerAlignContent();
    
    const cnNameText = caNameStack.addText('1');
    cnNameText.font = Font.boldSystemFont(20);
    cnNameText.textColor = Color.red();
    caNameStack.addSpacer(5);
    
    const cnNameText1 = caNameStack.addText(currency);
    cnNameText1.font = Font.mediumSystemFont(20);
    cnNameText1.textOpacity = 0.7;
    rightStack.addSpacer(3);
    
    const amountText = rightStack.addText(negative);
    amountText.textColor = new Color(setting.rightColor);
    amountText.font = font = Font.boldSystemFont(18);
    widget.addSpacer();
    
    // bottom stack
    const bottomStack = widget.addStack();
    bottomStack.layoutHorizontally();
    bottomStack.centerAlignContent();
    
    const leftStack = bottomStack.addStack();
    leftStack.layoutVertically();
    leftStack.centerAlignContent();
    
    const cnNameText2 = leftStack.addText(china);
    cnNameText2.font = Font.mediumSystemFont(20);
    cnNameText2.textColor = cnyColor;
    cnNameText2.textOpacity = 0.7;
    leftStack.addSpacer(3);
    
    const amountText2 = leftStack.addText(amount);
    amountText2.textColor = currency === 'UAD' && amount < 7 ? Color.red() : new Color(setting.leftColor);
    amountText2.font = Font.boldSystemFont(18);
    bottomStack.addSpacer();
    
    const iconStack2 = bottomStack.addStack();
    iconStack2.cornerRadius = radius;
    const bottomImage = iconStack2.addImage(toImage);
    bottomImage.imageSize = new Size(iconSize, iconSize);
    
    if (!config.runsInWidget) {  
      await widget.presentSmall();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  };
  
  async function createErrWidget() {
    const widget = new ListWidget();
    const text = widget.addText('仅支持小尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
    Script.complete();
  };
  
  /*
   * Name: MyWidget
   * Author: John Smith
   * Date: 2022/11/11
   * Version: 1.1
   * Description: This is a widget that displays some information.
   */
  const runWidget = async () => {
    if (config.widgetFamily === 'small' || config.runsInApp) {
      await createWidget();
    } else {
      await createErrWidget();
    }
  }
  await runWidget();
}
module.exports = { main }