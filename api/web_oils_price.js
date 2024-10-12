// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: gas-pump;
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
          else return type == 1 ? JSON.parse(fm.readString(path)) : type == 2 ? fm.readString(path) : fm.readImage(path);
        }
      },
      write: (name, content) => {
        const path = fm.joinPath(basePath, name);
        type == 1 ? fm.writeString(path, JSON.stringify(content)) : type == 2 ? fm.writeString(path, content) : fm.writeImage(path, content);
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
      cacheTime: type ? 4 : 24, type
    });
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    const response = await new Request(url)[type == 1 ? 'loadJSON' : type == 2 ? 'loadString' : 'loadImage']();
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
  const updateAndNotify = (oils, oilsAlert, oilsTips) => {
    if (setting.oilsAlert !== oilsAlert || setting.oilsTips !== oilsTips || province !== setting.oils[0]) {
      if (setting.oilsAlert !== oilsAlert) notify(`${province}油价调整‼️`, oilsAlert);
      if (setting.oilsTips !== oilsTips) notify(`${province}油价调整‼️`, oilsTips);
      Object.assign(setting, { oilsAlert, oilsTips, oils });
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
  
  const findTitle = (province) => {
    const item = provinces.find(item => item.title.includes(province));
    return item ? item.title : '海南';
  };
  
  const getOilTips = async () => {
    const url = 'https://20121212.cn/ci/index.php/tips/get';  
    const [data] = await getCacheData('tips.json', url, 1);
    return data ? data.tips : null;
  };
  
  const getOilsPrices = async (province) => {
    const url = `https://youjia.15qs.com/index.php?c=api&a=getprice&province=${encodeURIComponent(province)}`;  
    const oil = await getCacheData('oil.json', url, 1);
    return oil ? [setting.province, oil.hao92, oil.hao95, oil.hao98, oil.hao0] : null;
  };
  
  const getOilsData = async () => {
    try {
      const html = await getCacheData('oil.html', 'http://m.qiyoujiage.com', 2);
      const webView = new WebView();
      await webView.loadHTML(html);
      
      const { tishiContent, prices } = await webView.evaluateJavaScript(`
        (() => {
          const row = [...document.querySelectorAll('table tr')].find(tr => tr.querySelector('td').textContent.trim() === "${setting.province}");
          const prices = row ? [...row.querySelectorAll('td')].map(td => td.textContent.trim()) : null;
          return { prices, tishiContent };
        })();
      `);
      
      const match = [province, ...html.match(new RegExp(`${province}<\\/a><\\/td><td>(\\d+\\.\\d+)<\\/td><td>(\\d+\\.\\d+)<\\/td><td>(\\d+\\.\\d+)<\\/td><td>(\\d+\\.\\d+)`))?.slice(1)];
      
      const title = findTitle(province);
      const oils = prices || await getOilsPrices(title) || match;
      const oilsAlert = tishiContent.replace('<br/>', '，');
      return { oilsAlert, oils };
    } catch (e) {
      console.log(`${e}\n使用缓存`);
    }
  };
  
  const oilsTips = await getOilTips() || setting.oilsTips;
  const { oilsAlert, oils } = await getOilsData() || setting;
  const [_, oil92, oil95, oil98, oil0] = oils.map(item => parseFloat(item).toPrecision(3));

  const oilTypes = [
    { name: '0#', value: oil0,  color: '#FB8C00' },
    { name: '92', value: oil92, color: '#3F8BFF' },
    { name: '95', value: oil95, color: '#00C853' },
    { name: '98', value: oil98, color: '#BE38F3' },
  ];
  
  // 计算时间剩余天数
    const calculateDaysDiff = (targetDateString) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const dateString = `${currentYear}年${targetDateString}`;
    const [year, month, day] = dateString.match(/\d+/g);
    const targetDate = new Date(year, month - 1, day, 24, 0, 0);
    const timeDifference = targetDate - currentDate;
    return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  };
  
  const addAlert = (() => {
    const date = oilsAlert.match(/(\d{1,2}月\d{1,2}日)/)[0];
    const daysDiff = date ? calculateDaysDiff(date) : 0;
    const surplus = daysDiff <= 0 ? '全国' : `【 剩余 ${daysDiff} 天 】 `;
    const alert = oilsAlert.length < 48 ? `${oilsAlert}涨价几毛叫“微调”，降价几分叫“跌破”。` : oilsAlert;
    return surplus + alert;
  })();
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const backgroundImage = await getCacheData('logo.png', 'https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/baiTiaoBg.png');
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
      widget.backgroundImage = backgroundImage;
    } else {
      widget.backgroundImage = backgroundImage;  
    }
  };
  
  // createWidget
  const createWidget = async () => {
    const tips = getRandomItem([oilsTips, addAlert]);
    const tipsGap = tips === oilsTips && oilsTips.length >= 80;
    
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
    
    const oilTipsText = statusStack.addText(tips);
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
    updateAndNotify(oils, oilsAlert, oilsTips);
    
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