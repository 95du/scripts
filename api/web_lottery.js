// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: bowling-ball;
/**
 * 组件作者: 95度茅台
 * 组件名称: 全国彩开奖结果
 * 组件版本: Version 1.0.4
 * 发布时间: 2023-09-17
 */


async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_lottery');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string',
  ].map(getCachePath);
  
  // 在桌面小组件添加Parameter参数
  const param = args.widgetParameter;
  const _lotteryType = { ssq: 0, dlt: 1, kl8: 2, pl3: 3, fc3d: 4, qxc: 5, qlc: 6, pl5: 7 };
  
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
   * 读取储存的设置
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) return JSON.parse(fm.readString(file));
    return {};
  };
  const setting = await getBotSettings(settingPath);
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage()
  };
  
  /**  
  * 弹出通知
  * @param {string} title
  * @param {string} body
  * @param {string} url
  * @param {string} sound
  */
  const notify = (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'piano_success', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
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
          if (hasExpired(path) > cacheTime) fm.remove(path);
          else return type 
          ? fm.readString(path) 
          : fm.readImage(path);
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
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.read(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.write(name, img);
    return img;
  };
  
  // 缓存json
  const getCacheData = async (name, url, type) => {
    const cache = useFileManager({   
      cacheTime: 4, type
    });
    
    try {
      const { code, data } = await new Request(url).loadJSON();
      if (code === 200) {
        cache.write(name, data);
        return getData(data);
      }
    } catch (e) {
      console.log('使用缓存中')
      const data = JSON.parse(cache.read(name));
      return getData(data);
    }
  };
  
  /**
   * 获取json字符串
   * @param {string} json
   */
  const getData = (data) => {
    if (param !== null && typeof _lotteryType[param] === 'number') {
      return data[_lotteryType[param]];  
    }
    data.splice(2, 1);
    return data[Number(setting.agentShortName)];
  };
  
  /**
   * @param {string} - string
   * @returns {object} - string
   */
  const processData = (data) => {
    try {
      const { firstNumbers, lastNumbers = '', ...rest } = data;
      const openCodeArr = [...firstNumbers.split(','), ...lastNumbers.split(',').filter(num => num !== '')];
      return { openCodeArr, ...rest }
    } catch (e) {
      console.log(e);
    }
  };
  
  const macaujc = await 
getCacheData('macaujc.json', 'https://m.zhuying.com/api/lotapi/indexV2/1', true);
  const { openCodeArr, openTime, lastNumbers, lotteryName, frequency, officeOpenTime, todayOpen, issue, lotteryType, poolAmount } = processData(macaujc);
  
  /**
   * iOS 系统版本
   * 获取跳转直播页面
   * 数字转换为开奖状态、颜色
   * lotteryType
   * Random icons
   */
  const systemVersion =  Device.systemVersion().split('.')[0];
  
  const gameId = { ssq: 101, dlt: 201, pl3: 202, fc3d: 102, qxc: 204, qlc: 104, pl5: 203 };
  const watchLive = `https://m.ttzoushi.com/#/kjgg/detail;gameId=${gameId[lotteryType]}`;

  const statusMap = {
    0: { todayOpenStatus: '未到时间', staColor: '#666666' },
    1: { todayOpenStatus: '今晚开奖', staColor: '#FF6800' },
    2: { todayOpenStatus: '已开奖', staColor: '#34c759' },
  };
  const { todayOpenStatus, staColor } = statusMap[todayOpen];
  
  const type = {
    'qlc': 3.5,
    'pl5': 13.5,
    'pl3': 24,
    'fc3d': 24
  }[lotteryType] || 4;
  
  // 时间转换星期
  function getWeekday(dateString) {
    const daysOfWeek = [
      "周日", "周一", "周二", "周三", "周四", "周五", "周六"
    ];
    const date = new Date(dateString);
    return daysOfWeek[date.getDay()];
  };
  const dayOfWeek = getWeekday(openTime.split(" ")[0]);
  
  // 转换亿万单位
  function formatAmount(original) {
    const amount = parseFloat(original);
    if (amount >= 100000000) {
      return (amount / 100000000).toFixed(2) + ' 亿';
    } else if (amount >= 10000) {
      return (amount / 10000).toFixed(1) + ' 万';
    }
    return '等待更新';
  };
  
  /**
   * @param {string[]} arr
   * @param {number} num
   * @returns {string[]} color
   */
  const getRandomValues = (arr, num) => [...arr].sort(() => Math.random() - 0.5).slice(0, num);
  
  const colorHex = {
    green: '#34C759',
    blue: '#0061FF',
    red: '#FF0000',
    orange: '#FF6800',
    purple: '#9D64FF',
    yellow: '#FFA300',
    skyBlue: '#0096FF',
    cyan: '#00C4B6'
  };
  
  const colorArr = [ 'blue', 'orange', 'red', 'green', 'purple', 'skyBlue', 'yellow', 'cyan' ];
  const randomValues = getRandomValues(colorArr, 8);
  
  const colorCode = randomValues.map((name) => { 
    return colorHex[name]
  });
  
  // 其他配置
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  
  const isSmallScreen = Device.screenSize().height < 926;
  const adapt = {
    middle: isSmallScreen ? 12 : 15,
    font: isSmallScreen ? (lotteryType === 'qlc' ? 16 : 18) : (lotteryType === 'qlc' ? 18 : 20),
    size: isSmallScreen ? (lotteryType === 'qlc' ? 32 : 38) : (lotteryType === 'qlc' ? 35 : 40)
  };
  
  // 开奖结果通知
  if (setting.issue !== issue && todayOpen === 2 && param === null) {
    notify(`${lotteryName} 💥`, `第 ${issue.substring(4)} 期，开奖结果 ${openCodeArr.join(' ')}`);
    setting.issue = issue;
    writeSettings(setting);
  };
  
  // Draw Divider Line  
  const drawLine = () => {
    const context = new DrawContext()
    context.size = new Size(150, 0.5)
    context.opaque = false;
    context.respectScreenScale = true;
    context.setFillColor(new Color('#777777', 0.5));
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, 150, 0.3), 3, 2);
    context.addPath(path);
    context.fillPath();
    return context.getImage();
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else if (!setting.solidColor && !Device.isUsingDarkAppearance()) {
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
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
      widget.backgroundImage = await getCacheImage('logo.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_2.png');
    }
  };
  
  //=========> Create <=========//
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));

    widget.setPadding(10, 5, 10, 5);
    const titleStack = widget.addStack();
    titleStack.layoutHorizontally();
    titleStack.centerAlignContent();
    titleStack.setPadding(0, 15, 0, 15);
    
    const columnStack = titleStack.addStack();
    columnStack.size = new Size(5, 22);
    columnStack.cornerRadius = 50;
    const barColor = colorCode[Math.floor(Math.random() * colorCode.length)];
    columnStack.backgroundColor = new Color(barColor);
    titleStack.addSpacer(10);
    
    const titleText = titleStack.addText(lotteryType === 'pl5' ? '排列五' : lotteryName);
    titleText.font = Font.boldSystemFont(17.5);
    titleText.textColor = Color.dynamic(new Color(setting.titleColor), Color.white());
    titleStack.addSpacer();
    
    const expectText1 = titleStack.addText('第 ');
    expectText1.font = Font.mediumSystemFont(16);
    expectText1.textColor = textColor;
    
    const expectText2 = titleStack.addText(issue.substring(4));
    expectText2.font = Font.mediumSystemFont(16);
    expectText2.textColor = Color.red();
    
    const expectText3 = titleStack.addText(' 期');
    expectText3.font = Font.mediumSystemFont(16);
    expectText3.textColor = textColor;
    titleStack.addSpacer(10);
    
    const dateText = titleStack.addText(openTime.split(" ")[0]);
    dateText.font = Font.mediumSystemFont(16);
    dateText.textColor = textColor;
    dateText.textOpacity = 0.6;
    titleStack.addSpacer(6);
    
    const weekText = titleStack.addText(dayOfWeek);
    weekText.font = Font.mediumSystemFont(15);
    weekText.textColor = textColor;
    weekText.textOpacity = 0.6;
    
    widget.addSpacer(adapt.middle);
    
    // openCodeArr
    const mainStack1 = widget.addStack();
    mainStack1.layoutHorizontally();
    mainStack1.addSpacer();
    
    const codeStack = mainStack1.addStack();
    codeStack.layoutHorizontally();
    codeStack.centerAlignContent();
    mainStack1.addSpacer();
    
    widget.addSpacer(5);// 线底部
    
    for (let i = 0; i < openCodeArr.length; i++) {
      const item = openCodeArr[i];
      codeStack.addSpacer(type);
      
      const barStack = codeStack.addStack();
      barStack.layoutHorizontally();
      barStack.centerAlignContent();
      barStack.size = new Size(adapt.size, lotteryType === 'qlc' ? 35 : 40);
      
      barStack.backgroundColor = new Color(colorCode[i]);
      barStack.cornerRadius = systemVersion >= 16 ? 50 : setting.radius;
     
      const openCodeText = barStack.addText(item);
      openCodeText.font = Font.mediumSystemFont(adapt.font);
      openCodeText.textColor = Color.white();
      codeStack.addSpacer(type);
    };
    
    // 绘制分割线
    widget.addSpacer(12);
    const drawLineImg = widget.addImage(drawLine());
    drawLineImg.centerAlignImage();
    widget.addSpacer(adapt.middle);
    
    // 底部信息
    const botStack = widget.addStack();
    botStack.layoutHorizontally();
    botStack.centerAlignContent();
    botStack.setPadding(0, 14, 0, 14)
  
    const bottomText = botStack.addText('奖池');
    bottomText.font = Font.mediumSystemFont(15);
    bottomText.textColor = textColor;
    bottomText.textOpacity = 0.6;
    botStack.addSpacer(3);
    
    const bottomText1 = botStack.addText(formatAmount(poolAmount));
    bottomText1.font = Font.mediumSystemFont(15);
    bottomText1.textColor = Color.red();
    bottomText1.textOpacity = 0.7;
    botStack.addSpacer();
    
    const bottomText2 = botStack.addText(frequency);
    bottomText2.font = Font.mediumSystemFont(15);
    bottomText2.textColor = textColor
    bottomText2.textOpacity = 0.6;
    botStack.addSpacer(5);
    
    const bottomText3 = botStack.addText(officeOpenTime.match(/\d+:\d+/)[0]);
    bottomText3.font = Font.mediumSystemFont(15);
    bottomText3.textColor = textColor
    bottomText3.textOpacity = 0.6;
    botStack.addSpacer();
    
    // 开奖状态
    const barStack = botStack.addStack();
    barStack.setPadding(3, 10, 3, 10)
    barStack.layoutHorizontally();
    barStack.centerAlignContent();
    barStack.backgroundColor = new Color(staColor);
    barStack.url = watchLive;
    barStack.cornerRadius = 8
     
    const openCodeText = barStack.addText(todayOpenStatus);
    openCodeText.font = Font.mediumSystemFont(14);
    openCodeText.textColor = Color.white();
    
    if (config.runsInApp) {
      await widget.presentMedium();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  };
  
  //=========> Create <=========//
  const errorWidget = async () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中尺寸');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
  };
  
  const runWidget = async () => {
    await (config.runsInApp || config.widgetFamily === 'medium' 
    ? createWidget() 
    : errorWidget());
  }
  await runWidget();
}
module.exports = { main }