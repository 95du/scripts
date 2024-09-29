// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: crown;
/**
 * 脚本名称: 高德福利中心
 * 组件作者：95度茅台
 * 组件版本: Version 1.0.0
 * 更新日期: 2024-03-27
 */

async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_amap_vip');
  
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
    return fm.fileExists(file) ? { url, sessionid, body } = JSON.parse(fm.readString(file)) : {}
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
  
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage();
  };
  
  /**
   * 获取图片、string并使用缓存
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
        return fileExists ? fm.readString(filePath) : null;
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
        return fileExists ? fm.readImage(filePath) : null;
      },
      writeImage: (name, image) => fm.writeImage(fm.joinPath(cacheImg, name), image),
    };
    
    function hasExpired(filePath) {
      const createTime = fm.creationDate(filePath).getTime();
      return (Date.now() - createTime) / (60 * 60 * 1000)
    }
  };
  
  /**
   * 获取缓存的 JSON 字符串
   * @param {string} jsonName
   * @param {string} jsonUrl
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, url, sessionid, body) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime });
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    const response = await httpsRequest(url, sessionid, body);
    if (response.code === 1) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    }
    return response;
  };
  
  /**
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
  
  const notify = (title, body) => {
    const n = Object.assign(new Notification(), { title, body });
    n.schedule();
  };
  
  /**
   * Get boxjs Data
   * Dependency: Quantumult-X / Surge
   */
  const fetchData = async (key) => {
    try {
      const response = await new Request(`http://boxjs.com/query/data/${key}`).loadJSON();
      return response?.val || null;
    } catch (e) {
      notify('获取 Boxjs 数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
      return null;
    }
  };
  
  const getBoxjsData = async () => {
    const keys = [
      'amap_vip_url',
      'amap_vip_sessionid',
      'amap_vip_body'
    ];
    const data = {};
    for (const key of keys) {
      const value = await fetchData(key);
      if (!value) return null;
      const modifiedKey = key.replace('amap_vip_', '');
      data[modifiedKey] = value;
    }
    return data;
  };
  
  const requestBoxjs = async () => {
    try {
      if (!setting.url || !setting.sessionid || !setting.body) {
        const { url, sessionid, body } = await getBoxjsData();
        const { data } = await httpsRequest(url, sessionid, body);  
        writeSettings({ ...setting, url, sessionid, body, ...data });
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  };
  
  // Hourly writeSettings(setting)  
  const againWrite = (res) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (timeDifference >= 5) {
      writeSettings({
        ...setting,
        ...res.data
      });
    }
  };
  
  // 请求数据
  const httpsRequest = async (url, sessionid, body) => {
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      sessionid: sessionid
    };
  
    const options = { method: 'POST', headers, body };
    const response = await Object.assign(new Request(url), options).loadJSON();
    againWrite(response);
    return response;
  };
  
  const initData = await requestBoxjs();
  const { data } = initData ?? await getCacheString('request.json', url, sessionid, body);
  
  const { memberLevel, textColor, background, mileage, memberExpireAt, experience, levelIcon, upgradeText, bannerColor } = data;
  
  const upgradeTxt = upgradeText.replace(/<[^>]+>/g, '');
  const sum = upgradeTxt.match(/\d+/g).reduce((acc, num) => acc + parseInt(num), 0);
  const colorCode = bannerColor.match(/#[0-9A-Fa-f]{6}\b/g)[0];
  const levelColor = new Color(textColor);
  
  // 格式化日期
  const getFormattedTime = (updateTime) => {
    const df = new DateFormatter();
    df.dateFormat = 'yyyy-MM-dd';
    return df.string(new Date(parseInt(updateTime) * 1000));
  };
  
  // 进度
  const creatProgress = (total, havegone, width, height) => {
    const radius = height / 2;
    
    const context = new DrawContext();
    context.size = new Size(width, height);
    context.opaque = false
    context.respectScreenScale = true
    context.setFillColor(
      new Color(colorCode, 0.6)
    );
    
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, width, height), radius, radius);
    context.addPath(path);
    context.fillPath();
    context.setFillColor(levelColor)
    
    const path1 = new Path();
    path1.addRoundedRect(new Rect(0, 0, width * havegone / total, height), radius, radius)
    context.addPath(path1);
    context.fillPath();
    return context.getImage();
  };

  // 添加进度条
  const addProgress = (mainStack, total, haveGone) => {
    const width = setting.progressWidth;
    const height = 4.5
    
    const progressStack = mainStack.addStack();
    progressStack.size = new Size(width - 8, height);
    const progressImg = creatProgress(total, haveGone, width, height);
    const progress = progressStack.addImage(progressImg);
    progress.centerAlignImage();
    progress.imageSize = new Size(width, height);
  };
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = getBgImagePath();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage));
    } else {
      const iconName = background.split('/').pop();
      widget.backgroundImage = await getCacheImage(iconName, background);
    }
  };
  
  // 创建中号组件
  const createWidget = async () => {
    const widget = new ListWidget();
    await setBackground(widget);
    widget.setPadding(20, 20, 20, 20)
    
    const mainStack = widget.addStack();
    mainStack.layoutVertically();
    mainStack.centerAlignContent();
    
    const levStack = mainStack.addStack();
    levStack.layoutHorizontally();
    levStack.centerAlignContent();
    
    const iconName = levelIcon.split('/').pop();
      const iconSymbol = await getCacheImage(iconName, levelIcon);
    const topLevelIcon = levStack.addImage(iconSymbol);
    topLevelIcon.imageSize = new Size(139, 25);
    
    if (setting.rightIcon) {
      levStack.addSpacer();
      const iconSymbol2 = await getCacheImage('icon.png', 'https://gitcode.net/4qiao/framework/raw/master/img/symbol/map_yellow.png');
      const rightIcon = levStack.addImage(iconSymbol2);
      rightIcon.imageSize = new Size(25, 25);
    };
    mainStack.addSpacer(8);
    
    const levelStack = mainStack.addStack();
    levelStack.layoutHorizontally();
    levelStack.centerAlignContent();
    
    const barStack = levelStack.addStack();
    barStack.backgroundColor = new Color(textColor, 0.12);
    barStack.setPadding(2, 8, 2, 8);
    barStack.cornerRadius = 5
    barStack.borderColor = levelColor
    barStack.borderWidth = 2;
    
    const barText = barStack.addText('当前等级');
    barText.font = Font.mediumSystemFont(13);
    barText.textColor = levelColor;
    levelStack.addSpacer(5);
    
    const formattedTime = getFormattedTime(memberExpireAt);
    const expireText = levelStack.addText(`有效期至: ${formattedTime}`);
    expireText.font = Font.systemFont(13.5);
    expireText.textColor = levelColor
    mainStack.addSpacer();

    const upStack = mainStack.addStack();
    upStack.layoutHorizontally();
    upStack.centerAlignContent();
    
    const UpgradeText = upStack.addText(upgradeTxt);
    UpgradeText.font = Font.mediumSystemFont(13.5);
    UpgradeText.textColor = levelColor;
    upStack.addSpacer();
    
    const mileageText = upStack.addText(`${mileage} 里程`);
    mileageText.font = Font.boldSystemFont(15.5);
    mileageText.textColor = levelColor;
    mainStack.addSpacer(8);
    addProgress(mainStack, sum, experience);
    
    mileageText.url = 'amapuri://webview/amaponline?hide_title=1&url=https%3A%2F%2Fdache.amap.com%2Fcommon%2Famap%3FbizVersion%3D070005%26source%3DpersonalCenter%23%2Fwelfare%2Fmilage-shop';
    topLevelIcon.url = 'amapuri://webview/amaponline?hide_title=1&url=https%3A%2F%2Fdache.amap.com%2Fcommon%2Famap%3FbizVersion%3D070005%26source%3DpersonalCenter%23%2Fwelfare%2Fwelfare-center';
    return widget;
  };
  
  const errorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中号组件');
    text.font = Font.systemFont(16);
    text.centerAlignText();
    return widget;
  };
  
  //
  const runWidget = async () => {
    const familyWidget = config.widgetFamily;
    const widget = await (
      familyWidget === 'medium' || config.runsInApp ? createWidget() : 
      familyWidget === 'small' ? errorWidget() : null
    );
    
    if (config.runsInApp) {
      await widget.presentMedium();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
}
module.exports = { main }
