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
   * 标准化 API 请求函数
   * 
   * @param {string} url
   * @param {string} method ('GET', 'POST', 'PUT', 'DELETE')
   * @param {object} headers
   * @param {object} data
   * @param {string} customBody
   * @returns {Promise<object>}
   */
  apiRequest = async (
    url, 
    method = 'GET', 
    headers = {}, 
    data = null, 
    formBody = null
  ) => {
    const request = new Request(url);
    request.method = method;  
    request.headers = headers;
    request.body = formBody || (data ? JSON.stringify(data) : null);
  
    try {
      const response = await request.loadJSON();
      return response;
    } catch (error) {
      console.log(`API 请求失败:  ${error}`);
      return { success: false, message: '请求失败', error: error.message };
    }
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
    const { loadFile } = this.getMethods(type);
    return loadFile ? await loadFile(request) : await request.loadString();
  }
  
  // 根据类型返回加载、读取、写入对应方法  
  getMethods(type) {
    const loadMethods = {
      string: (request) => request.loadString(),
      json: (request) => request.loadJSON(),
      image: (request) => request.loadImage(),
    };
    const readMethods = {
      string: (path) => this.fm.readString(path),
      json: (path) => JSON.parse(this.fm.readString(path)),
      image: (path) => this.fm.readImage(path),
    };
    const writeMethods = {
      string: (path, content) => this.fm.writeString(path, content),
      json: (path, content) => this.fm.writeString(path, JSON.stringify(content)),
      image: (path, content) => this.fm.writeImage(path, content),
    };
    return { 
      loadFile: loadMethods[type], 
      readFile: readMethods[type], 
      writeFile: writeMethods[type] 
    };
  }
  
  /**
   * 缓存文件管理器
   * 
   * @param {Object} options
   * @param {number} options.cacheTime - 缓存有效期（小时）
   * @param {string} [options.type='string'] - ('string', 'json', 'image')
   * @returns {Object} - read，write
   */
  useFileManager = ({ cacheTime, type = 'string'} = options) => {
    const fm = this.fm;
    const basePath = type === 'image' 
      ? this.cacheImg 
      : this.cacheStr;
    
    const { readFile, writeFile } = this.getMethods(type);
    const filePath = (name) => fm.joinPath(basePath, name);
    
    const isExpired = (filePath) => {
      return (Date.now() - fm.creationDate(filePath).getTime()) / (60 * 60 * 1000) > cacheTime;  
    };
    
    const read = (name) => {
      const path = filePath(name);
      if (fm.fileExists(path)) {
        if (!isExpired(path)) return readFile(path);
        fm.remove(path);
      }
      return null;
    };
    const write = (name, content) => writeFile(filePath(name), content);
    
    return { read, write };
  };
  
  /**
   * 获取请求数据并缓存
   * @param {string} name
   * @param {string} url
   * @param {string} type（json, string, image）
   * @returns {*} - 返回缓存数据
   */  
  getCacheData = async (name, url, type, cacheTime = 240) => {
    const cache = this.useFileManager({ 
      cacheTime, type
    });
    
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    
    try {
      const data = await this.httpRequest(url, type);
      if (data.statusCode !== 404) {
        cache.write(name, data);
        console.log("Data downloaded and cached");
        return data;
      }
    } catch (error) {
      console.log(`${name} 请求失败，返回缓存数据: \n${error}`);
    }
    return cacheData;
  };
  
  /**  
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   */
  async notify(title, body, url, sound = 'event') {
    if (!this.settings.notify) return
    const n = Object.assign(new Notification(), { title, body, sound });
    if (url) n.openURL = url;
    n.schedule();
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
  
  /**
   * 为图片添加遮罩效果
   * @param {Image} img
   * @returns {Promise<Image>}
   */
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
  
  /**
   * 生成 Quantumult X 重写配置
   * @param {string} url
   * @param {string} tagName - Quantumult X 中的标签名称
   * @returns {string} - Quantumult X 添加重写的配置
   */
  quantumult = (tagName, url) => {
    const config = `
    {
      "rewrite_remote": [
        "${url}, tag=${tagName}, update-interval=172800, opt-parser=true, enabled=true"
      ]
    }`;
    
    const encode = encodeURIComponent(config);
    return `quantumult-x:///add-resource?remote-resource=${encode}`;
  };
  
  /** download store **/
  async myStore() {
    const url = `${this.rootUrl}/run/web_module_95duScript.js`;
    const script = await this.httpRequest(url);
    const fm = FileManager.iCloud();
    fm.writeString(
      fm.documentsDirectory() + '/95du_ScriptStore.js', script);
  };
};

module.exports = { _95du };