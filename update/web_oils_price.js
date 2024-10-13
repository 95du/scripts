/**
 * 组件作者: 95度茅台
 * 组件名称: 全国油价_2
 * 组件版本: Version 1.0.2
 * 更新日期: 2024-09-23
 */


async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), "95du_Oils");
  
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
      return { province, interval } = JSON.parse(fm.readString(file));
    }
  };
  const setting = await getBotSettings(settingPath) || {};
  
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
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */
  const notify = (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'default', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  // 获取数组中随机值
  const getRandomItem = (array) => array[parseInt(Math.random() * array.length)] || null;
  
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
          if (hasExpired(path) > cacheTime || province !== setting.oils[0]) fm.remove(path);
          else return type ? JSON.parse(fm.readString(path)) : fm.readImage(path);
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
   * @param {string} - url
   * @returns {image} - image
   * @returns {object} - JSON
   */
  const getCacheData = async (name, url, type) => {
    const cache = useFileManager({  
      cacheTime: type ? 4 : 240, type
    });
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    const response = await new Request(url)[type ? 'loadJSON' : 'loadImage']();
    if (response) {
      cache.write(name, response);
    }
    return response;
  };
  
  // Background image
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  // 图片遮罩颜色、透明度设置
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size;
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
    
  // 初始化，预警通知
  const updateAndNotify = (oils, oilsTips) => {
    if (setting.oilsTips !== oilsTips || province !== setting.oils[0]) {
      notify(`${province}油价调整‼️`, oilsTips);
      Object.assign(setting, { oilsTips, oils });
      writeSettings(setting);
    }
  };
  
  // Color
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  const islandColor = Color.dynamic(new Color("#000000"), new Color('#555555'));
  const iconColor = Color.dynamic(new Color("#000000"), new Color('#FFD723'));
  
  const isDark = Device.isUsingDarkAppearance();
  const screenSize = Device.screenSize().height < 926;
  const height = screenSize ? 75 : 83
  const gap = screenSize ? 73 : 75;
  const font = screenSize ? 12 : 13;
  const [value, wide] = [6, 8].map(num => num - interval);

  /**
   * 获取石油数据
   * @returns {Object} 包含石油价格和提示信息的对象。
   */
  const provinces = [
    { title: '广东' },
    { title: '海南' },
    { title: '福建' },
    { title: '北京市' },
    { title: '安徽' },
    { title: '天津市' },
    { title: '河北' },
    { title: '山西' },
    { title: '上海市' },
    { title: '江苏' },
    { title: '浙江' },
    { title: '江西' },
    { title: '山东' },
    { title: '河南' },
    { title: '湖北' },
    { title: '湖南' },
    { title: '重庆市' },
    { title: '四川' },
    { title: '贵州' },
    { title: '云南' },
    { title: '陕西' },
    { title: '甘肃' },
    { title: '青海' },
    { title: '辽宁' },
    { title: '吉林' },
    { title: '黑龙江' },
    { title: '西藏自治区' },
    { title: '内蒙古自治区' },
    { title: '广西壮族自治区' },
    { title: '宁夏回族自治区' },
    { title: '新疆维吾尔自治区' }
  ];
  
  const findTitle = () => {
    const item = provinces.find(item => item.title.includes(province));
    return item ? item.title : '海南';  
  };
  
  const getOilsPrices = async () => {
    const province = findTitle();
    const url = `https://youjia.15qs.com/index.php?c=api&a=getprice&province=${encodeURIComponent(province)}`;  
    const oil = await getCacheData('oil.json', url, true);
    return oil ? [setting.province, oil.hao92, oil.hao95, oil.hao98, oil.hao0] : null;
  };
  
  const oils = await getOilsPrices() || setting.oils;
  const [_, oil92, oil95, oil98, oil0] = oils.map(item => parseFloat(item).toPrecision(3));  
  // 生成油品类型数组
  const oilTypes = [
    { name: '0#', value: oil0,  color: '#FB8C00' },
    { name: '92', value: oil92, color: '#3F8BFF' },
    { name: '95', value: oil95, color: '#00C853' },
    { name: '98', value: oil98, color: '#BE38F3' },
  ];
  
  // 获取油价预警
  const getOilTips = async () => {
    const url = 'https://20121212.cn/ci/index.php/tips/get';  
    const [data] = await getCacheData('tips.json', url, true);
    
    const cleanText = (text) => text.replace(/\s+/g, ' ');
    const match = data.tips.match(/^\d{1,2}月\d{1,2}日/);
    const tips = data.tips.match(/(\d{1,2}月\d{1,2}日，|预测).*/);
    return {
      date: Math.floor((new Date(data.timedown) - new Date()) / 86400000),
      oilsTips: cleanText(!match && tips ? tips[0] : data.tips)
    }
  };
  
  const { oilsTips, date } = await getOilTips() || setting;
  const tipsGap = oilsTips && oilsTips.length >= 78;
  
  // 设置组件背景
  const setBackground = async (widget) => {
    //const backgroundImage = await getCacheData('logo.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baiTiaoBg.png');
    const bgImage = getBgImage();
    if (fm.fileExists(bgImage) && !isDark) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else if (!isDark) {
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
      //widget.backgroundImage = backgroundImage;
    } else {
      //widget.backgroundImage = backgroundImage;  
    }
  };
  
  // createWidget
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.setPadding(10, 10, 10, 10)
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();

    const stack = mainStack.addStack();
    stack.layoutHorizontally();
    stack.centerAlignContent();
    stack.addSpacer();
    const barStack = stack.addStack();
    barStack.setPadding(5, 42, 5, 42)
    barStack.cornerRadius = 15;
    barStack.backgroundColor = islandColor;
    
    const titleText = barStack.addText(`${province}油价`);
    titleText.textColor = new Color('#FFD723');
    titleText.font = Font.boldSystemFont(16);
    titleText.centerAlignText();
    stack.addSpacer(3);
    
    const noticeStack = stack.addStack();
    const symbol = SFSymbol.named('bell.circle');
    const icon = noticeStack.addImage(symbol.image);
    icon.imageSize = new Size(30, 30)
    icon.tintColor = iconColor;
    stack.addSpacer();
    
    // Alert
    const statusStack = mainStack.addStack();
    statusStack.addSpacer();
    statusStack.size = new Size(0, tipsGap ? height : gap);
    statusStack.layoutHorizontally();
    statusStack.centerAlignContent();
    
    const columnStack = statusStack.addStack();
    columnStack.size = new Size(5, tipsGap ? 60 : 50);
    columnStack.cornerRadius = 50;
    columnStack.backgroundColor = Color.red();
    statusStack.addSpacer();
    
    const oilTipsText = statusStack.addText(oilsTips + (oilsTips.length >= 75 || date < 1 ? '' : ` 【 剩余 ${date} 天 】`));
    oilTipsText.textColor = textColor
    oilTipsText.font = Font.mediumSystemFont(tipsGap ? font : 14);
    oilTipsText.leftAlignText();
    oilTipsText.textOpacity = isDark ? 0.88 : 0.8;
    statusStack.addSpacer();
      
    const dataStack = mainStack.addStack();
    dataStack.layoutHorizontally();
    dataStack.addSpacer();
    
    for (const type of oilTypes) {
      const barStack = dataStack.addStack();
      barStack.size = new Size(0, 23)
      barStack.setPadding(3, wide, 3, wide);
      barStack.backgroundColor = new Color(type.color);
      barStack.cornerRadius = 7.5;
    
      const oilPriceBar = barStack.addText(`${type.name} - ${type.value}`);
      oilPriceBar.font = Font.mediumSystemFont(14);
      oilPriceBar.textColor = Color.white();
      
      if (type !== oilTypes[oilTypes.length - 1]) {
        dataStack.addSpacer(value);
      }
    }
    dataStack.addSpacer();
    return widget;
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    return widget;
  };
  
  // 渲染组件
  const runWidget = async () => {
    const family = config.widgetFamily || 'medium';
    const widget = await (family === 'medium' ? createWidget() : createErrorWidget());
    await setBackground(widget);
    updateAndNotify(oils, oilsTips);
    
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
