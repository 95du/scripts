// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: phone-volume;
/**
 * 脚本名称: 中国联通
 * 组件作者：95度茅台
 * 组件版本: Version 1.0.8
 * 更新日期: 2024-04-03
 */

async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_china_unicom');
  
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
    return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : {}
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
  const getBgImagePath = () => {
    const bgImgPath = fm.joinPath(fm.documentsDirectory(), '95duBackground');
    return fm.joinPath(bgImgPath, Script.name() + '.jpg');
  };
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
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
   * 读取和写入缓存的文本和图片数据
   * @param {object} options
   * @param {number}  - number
   * @returns {object} - Object
   */  
  const useFileManager = ({ cacheTime } = {}) => {
    return {
      readString: (name) => {
        const filePath = fm.joinPath(cacheStr, name);  
        const fileExists =  fm.fileExists(filePath)
        if (fileExists && hasExpired(filePath) >= cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fileExists && setting.useCache ? fm.readString(filePath) : null;
      },
      writeString: (name, content) => fm.writeString(fm.joinPath(cacheStr, name), content),
      // cache image
      readImage: (name) => {
        const filePath = fm.joinPath(cacheImg, name);
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
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime : 240 });
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
  const getCacheString = async (jsonName) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime });
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    const response = await httpRequest();
    if (response.code === 'Y') {
      cache.writeString(jsonName, JSON.stringify(response));
    }
    return response;
  };
  
  const httpRequest = async () => {
    const url = 'https://m.client.10010.com/mobileserviceimportant/home/queryUserInfoSeven?version=iphone_c@10.0100&desmobiel=13232135179&showType=0';
    const headers = {
      'Host': 'm.client.10010.com',
      'User-Agent': 'ChinaUnicom.x CFNetwork iOS/17.4.1 unicom{version:iphone_c@11.0400} ',
      cookie: setting.cookie
    };
    
    try {
      const response = await Object.assign(new Request(url), { headers }).loadJSON();
      if (response?.code === 'Y') {
        return response;
      } else {
        console.log('cookie已过期');
      }
    } catch (e) {
      console.log(e);
      return {};
    }
  };
  
  // Hourly writeSettings(setting)  
  const formatFlow = (flowBalance, flow) => {
    const uesd = (flowBalance - flow).toFixed(2);
    return uesd == 0 ? '0 MB' : `${uesd >= 1 ? uesd + ' GB' : (uesd * 1024).toFixed(1) + ' MB'}`;
  };
  
  const hourlyWrite = (flowBalance, voiceBalance) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (setting.cookie && (timeDifference >= setting.cacheTime || !setting.flowBalance || setting.flowBalance < flowBalance)) {
      const flowUesd = formatFlow(setting.flowBalance, flowBalance);
      notify(`中国联通${setting.cacheTime}小时用量‼️`, `流量使用${flowUesd}，语音使用${setting.voiceBalance - voiceBalance} 分钟。`);
      writeSettings({ 
        ...setting,
        flowBalance,
        voiceBalance
      });
    }
  };
  
  // 获取随机数组元素
  const getRandomItem = async (array) => array[Math.floor(Math.random() * array.length)];
  
  const getLayout = (scr = Device.screenSize().height) => ({
    stackSize: scr < 926 ? 35 : 37,
    iconSize: scr < 926 ? 22 : 24,
    padding: scr < 926 ? 2 : 3,
    titleSize: scr < 926 ? 16 : 18,
    textSize: scr < 926 ? 11 : 12
  });
  
  const logo = await getCacheImage('unicom.png', 'https://gitcode.net/4qiao/framework/raw/master/img/symbol/china_unicom.png');
  
  const subTitleColor = Color.dynamic(new Color(setting.subTitleColor), new Color('#FFFFFF'));
  
  const feeColor = Color.dynamic(new Color(setting.feeColor), new Color(setting.feeDarkColor));
  
  const voiceColor = Color.dynamic(new Color(setting.voiceColor), new Color(setting.voiceDarkColor));
  
  const flowColor = Color.dynamic(new Color(setting.flowColor), new Color(setting.flowDarkColor));
  
  const addVertical = async ({ stack, title, balance, newUnit, symbol, color, gap }) => {  
    const rowStavk = stack.addStack();
    rowStavk.layoutHorizontally();
    rowStavk.centerAlignContent();
    
    const lay = getLayout();
    const iconStack = rowStavk.addStack();
    iconStack.layoutHorizontally();
    iconStack.centerAlignContent();
    iconStack.size = new Size(lay.stackSize, lay.stackSize);
    if (gap) iconStack.setPadding(lay.padding, 0, 0, 0);
    iconStack.cornerRadius = setting.radius || 50;
    iconStack.backgroundColor = color
    
    if (symbol) {
      const iconSymbol = SFSymbol.named(symbol);
      iconImage = iconStack.addImage(iconSymbol.image);
    } else {
      iconImage = iconStack.addImage(logo);
    }
    iconImage.tintColor = Color.white();
    iconImage.imageSize = new Size(lay.iconSize, lay.iconSize);
    rowStavk.addSpacer(8);
    
    const verticalStack = rowStavk.addStack();
    verticalStack.layoutVertically();
    
    const titleText = verticalStack.addText(balance + newUnit);
    titleText.font = Font.mediumSystemFont(lay.titleSize);
    titleText.textColor = color;
    
    const newUnitText = verticalStack.addText(title);
    newUnitText.font = Font.mediumSystemFont(lay.textSize);
    newUnitText.textColor = subTitleColor;
    newUnitText.textOpacity = 0.65
    
    if (!gap) stack.addSpacer();
    return rowStavk;
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImagePath();
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
  
  // 创建组件
  const createSmall = async () => {
    const widget = new ListWidget();
    const mainStack = widget.addStack();
    mainStack.setPadding(0, 0, 0, 0);
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    
    const horStack = mainStack.addStack();
    horStack.layoutVertically();
    
    const { 
      feeResource: fee, 
      voiceResource: voice, 
      flowResource: flow
    } = await getCacheString('china_unicom.json');  
    const flowPersent = parseFloat(flow?.flowPersent ?? 0).toFixed(1);
    hourlyWrite(flowPersent, voice.voicePersent)
    
    // 话费
    addVertical({
      stack: horStack,
      title: fee.dynamicFeeTitle,
      balance: fee.feePersent,
      newUnit: ' $',
      symbol: '',
      color: feeColor
    });
    // 语音
    addVertical({
      stack: horStack,
      title: voice.dynamicVoiceTitle,
      balance: voice.voicePersent,
      newUnit: ' Min',
      symbol: 'phone.fill',
      color: voiceColor
    });
    // 流量
    addVertical({
      stack: horStack,
      title: flow.dynamicFlowTitle,
      balance: flowPersent,
      newUnit: ` ${flow.newUnit}`,
      symbol: 'antenna.radiowaves.left.and.right',
      color: flowColor,
      gap: true
    });
    
    mainStack.addSpacer();
    return widget;
  };

  const runWidget = async () => {
    const widget = config.widgetFamily === 'small' || config.runsInApp ? await createSmall() : null;
    await setBackground(widget);
    if (setting.alwaysDark) widget.backgroundColor = new Color('#000000');

    if (config.runsInApp) {
      await widget.presentSmall();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
};
module.exports = { main }