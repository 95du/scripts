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
    const fm = this.fm;
    const basePath = (type === 'string' || type === 'json') 
      ? this.cacheStr 
      : this.cacheImg;
    
    const hasExpired = (name) => {
      const filePath = fm.joinPath(basePath, name);
      return (Date.now() - fm.creationDate(filePath).getTime()) / (60 * 60 * 1000) > cacheTime;  
    };

    /**
     * 安全路径处理函数，移除末尾的 '/'
     * @param {string} filePath
     */
    const safePath = (name) => fm.joinPath(basePath, name).replace(/\/+$/, '');
  
    /**
     * 写入字符串文件
     * @param {string} filePath
     * @param {string} content
     */
    const writeString = (filePath, content) => {
      const fullPath = safePath(filePath);
      fm.writeString(fullPath, content);
    };
  
    /**
     * 写入 JSON 数据
     * @param {string} filePath
     * @param {*} jsonData
     */
    const writeJSON = (filePath, jsonData) => writeString(filePath, JSON.stringify(jsonData));
  
    /**
     * 写入图片文件
     * @param {string} filePath
     * @param {Image} image
     */
    const writeImage = (filePath, image) => {
      const fullPath = safePath(filePath);
      fm.writeImage(fullPath, image);
    };
  
    /**
     * 读取字符串内容
     * @param {string} filePath
     * @returns {string|null}
     */
    const readString = (filePath) => {
      const fullPath = safePath(filePath);
      return fm.fileExists(fullPath) ? fm.readString(fullPath) : null;
    };
  
    /**
     * 读取 JSON 数据
     * @param {string} filePath
     * @returns {*|null}
     */
    const readJSON = (filePath) => {
      const data = readString(filePath);
      return data ? JSON.parse(data) : null;
    };
  
    /**
     * 读取图片文件
     * @param {string} filePath
     * @returns {Image|null}
     */
    const readImage = (filePath) => {
      const fullPath = safePath(filePath);
      return fm.fileExists(fullPath) ? fm.readImage(fullPath) : null;
    };
  
    return {
      writeString,
      writeJSON,
      writeImage,
      readString,
      readJSON,
      readImage,
      hasExpired,
      safePath
    };
  };
  
  /**
   * 获取请求数据并缓存
   * @param {string} name
   * @param {string} url
   * @param {string} type（json, string, image）
   * @returns {*} - 返回缓存数据
   */  
  getCacheData = async (name, url, type) => {
    const cache = this.useFileManager({ type });
    // 定义读取和写入方法的映射
    const cacheMethods = {
      json: {
        read: () => cache.readJSON(name),
        write: (data) => cache.writeJSON(name, data),
      },
      string: {
        read: () => cache.readString(name),
        write: (data) => cache.writeString(name, data),
      },
      image: {
        read: () => cache.readImage(name),
        write: (data) => cache.writeImage(name, data),
      },
    };
  
    const { read, write } = cacheMethods[type];
    const cacheData = read();
    if (cacheData) return cacheData;
    
    try {
      const data = await this.httpRequest(url, type);
      if (data.statusCode !== 404) {
        write(data);
        return data;
      }
    } catch (error) {
      console.log(name + '请求失败，返回缓存数据: \n' + error);
    };
    return cacheData;
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
  }
};

module.exports = { _95du };