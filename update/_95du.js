// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: cog;
class _95du {
  constructor(pathName) {
    this.fm = FileManager.local();
    this.pathName = pathName;
    this.rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
    this.initPaths();
    this.settings = this.getSettings();
  };

  // 初始化目录和路径
  initPaths() {
    const mainPath = this.fm.joinPath(this.fm.documentsDirectory(), this.pathName);
    
    this.mainPath = mainPath;
    this.settingPath = this.fm.joinPath(mainPath, 'setting.json');
    this.cacheImg = this.fm.joinPath(mainPath, 'cache_image');
    this.cacheStr = this.fm.joinPath(mainPath, 'cache_string');
    this.cacheCar = this.fm.joinPath(mainPath, 'cache_vehicle');
    
    [this.mainPath, this.cacheImg, this.cacheStr, this.cacheCar].forEach(path => this.fm.createDirectory(path, true));
  };

  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  getSettings() {
    const fileExists = this.fm.fileExists(this.settingPath);
    return fileExists ? JSON.parse(this.fm.readString(this.settingPath)) : {};
  };

  /**
   * 存储当前设置
   * @param { JSON } setting
   */
  async writeSettings(setting) {
    const json = JSON.stringify(setting, null, 2);
    this.fm.writeString(
      this.settingPath, json
    );
    console.log(json);
  };
  
  /**
   * 根据类型发起 HTTP 请求并加载内容。
   *
   * @param {string} url
   * @param {string} type ('string' | 'json' | 'image')。
   * @returns {Promise<string | object | Image>}
   */
  async httpRequest(url, type) {
    const request = new Request(url);
    const loadMethods = {
      string: () => request.loadString(),
      json: () => request.loadJSON(),
      image: () => request.loadImage()
    };
    return await (loadMethods[type] || loadMethods.string)();
  };
  
  /** download store **/
  async myStore() {
    const url = `${this.rootUrl}/run/web_module_95duScript.js`;
    const script = await this.httpRequest(url);
    const fm = FileManager.iCloud();
    fm.writeString(
      fm.documentsDirectory() + '/95du_ScriptStore.js', script);
  };
  
  /**
   * 获取图片、string并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  useFileManager = ({ cacheTime, type } = {}) => {
    const basePath = type ? this.cacheStr : this.cacheImg;
    const fm = this.fm;
    
    const hasExpired = (filePath) =>
      (Date.now() - fm.creationDate(filePath).getTime()) / (60 * 60 * 1000) > cacheTime;

    return {
      read: (name) => {
        const path = fm.joinPath(basePath, name);
        if (!fm.fileExists(path)) return null;
        if (!hasExpired(path)) {
          return type ? JSON.parse(fm.readString(path)) : fm.readImage(path);
        }
        fm.remove(path);
      },
      write: (name, content) => {
        const path = fm.joinPath(basePath, name);
        type ? fm.writeString(path, JSON.stringify(content)) : fm.writeImage(path, content);
      }
    }
  };
  
  /**
   * 获取请求数据并缓存
   * @param {string} - string
   * @returns {image} - url
   */
  getCacheData = async (name, url, type) => {
    const cache = this.useFileManager({ type });
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    const data = await this.httpRequest(url, type ? 'json' : 'image');
    if (!data.statusCode === 404) {
      cache.write(name, data);
    }
    return data;
  };
  
  /**  
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   */
  async notify(title, body, url) {
    if (!this.settings.notify) return
    const n = new Notification();
    n.title = title;
    n.body = body;
    n.sound = 'event';
    if (url) n.openURL = url;
    await n.schedule();
  };
  
  /**
   * @param message 内容
   * @param options 按键
   * @returns { Promise<number> }
   */
  async generateAlert(title, message = '', options, destructive) {
    const alert = new Alert();
    alert.title = title;
    alert.message = message ?? '';
    options.forEach((option, i) => {
      i === 1 && destructive ? alert.addDestructiveAction(option) : alert.addAction(option);
    });
    return await alert.presentAlert();
  };
  
  /**
   * 弹出输入框
   * @param title 标题
   * @param desc  描述
   * @param opt   属性
   * @returns { Promise<void> }
   */
  async generateInputAlert (options, confirm) {
    const { title, message, options: fieldArr } = options;
    const inputAlert = new Alert();
    inputAlert.title = title;
    inputAlert.message = message;
    fieldArr.forEach(({ hint, value }) => inputAlert.addTextField(hint, value))
    inputAlert.addAction('取消');
    inputAlert.addAction('确认');
    const getIndex = await inputAlert.presentAlert();
    if (getIndex === 1) {
      const inputObj = fieldArr.map(({ value }, index) => ({ index, value: inputAlert.textFieldValue(index) }));
      confirm(inputObj);
    }
    return getIndex;
  };
  
  // 图片遮罩
  shadowImage = async (img) => {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(this.settings.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
  
  /**
   * 获取 boxjs Data
   * 依赖：Quantumult-X / Surge
   */
  boxjsData = async (key) => {
    try {
      const response = await this.httpRequest(`http://boxjs.com/query/data/${key}`, 'json');
      return JSON.parse(response?.val) || {};
    } catch (e) {
      console.log('boxjs' + e);
      this.notify('Boxjs_数据获取失败 ⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
    }
  };
}

module.exports = { _95du };