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
    
    [this.mainPath, this.cacheImg, this.cacheStr].forEach(path => this.fm.createDirectory(path, true));
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
    obj = null, 
    formBody = null
  ) => {
    const request = new Request(url);
    request.method = method;  
    request.headers = headers;
    if (method !== 'GET') {
      request.body = formBody || (obj ? JSON.stringify(obj) : null);  
    }
  
    try {
      const response = await request.loadJSON();
      return response;
    } catch (error) {
      console.log(`API 请求失败:  ${error}`);
      return { success: false };
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
    const fileType = type || this.getFileInfo(url).type;
    const { loadFile } = this.getMethods(fileType);
    return loadFile 
      ? await loadFile(request) 
      : await request.loadString();
  };
  
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
    }
  };
  
  /**
   * 缓存文件管理器
   * 
   * @param {Object} options
   * @param {number} options.cacheTime - 缓存有效期（小时）
   * @param {string} [options.type='string'] - ('string', 'json', 'image')
   * @returns {Object} - read，write
   */
  useFileManager = ({ cacheTime, type = 'string' } = options) => {
    const basePath = type === 'image' 
      ? this.cacheImg 
      : this.cacheStr;
    const filePath = (name) => this.fm.joinPath(basePath, name);
    const { readFile, writeFile } = this.getMethods(type);

    const read = (name) => {
      const path = filePath(name);
      if (this.fm.fileExists(path)) {
        if (!isExpired(path)) return readFile(path);
        this.fm.remove(path);
      }
      return null;
    };
    const write = (name, content) => writeFile(filePath(name), content);
    
    const isExpired = (filePath) => {
      return (Date.now() - this.fm.creationDate(filePath).getTime()) / (60 * 60 * 1000) > cacheTime;  
    };
    return { read, write };
  };
  
  /**
   * 将字符串哈希化以创建唯一标识符。
   * @param {string} str
   */
  hash = (str) => {
    const number =  [...str].reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    return `hash_${number}`;
  };
  
  /**
   * 根据文件扩展名判断文件类型
   * @param {string} url
   * @returns {Object} 
   * @property {string} name
   * @property {string} type - 文件类型（'image'、'json' 或 'string'）
   */
  getFileInfo = (url) => {
    const name = decodeURIComponent(url).split('/').pop().split('?')[0];
    const type = name.match(/\.(png|jpeg|jpg|bmp|webp)$/i) 
      ? 'image' 
      : name.endsWith('.json') 
        ? 'json' 
        : 'string';
    return { name, type };
  };
  
  /**
   * 获取请求数据并缓存
   * @param {string} url
   * @param {string} hours
   * @param {string} filename带扩展名， 当url中没有文件扩展名时，用于判断文件类型。
   * @param {string} type（json, string, image）
   * @returns {*} - 返回缓存数据
   */
  getCacheData = async (url, cacheTime = 240, filename) => {
    const { name, type } = this.getFileInfo(filename || url);
    const cache = this.useFileManager({ 
      cacheTime, type
    });
    const cacheData = cache.read(name);
    if (cacheData) return cacheData;
    
    try {
      const data = await this.httpRequest(url, type);
      if (data.message) {
        console.log(data.message);
        return null;
      };
      if (data.statusCode !== 404) {
        cache.write(name, data);
        console.log(`${name}: Data downloaded and cached`);
        return data;
      }
    } catch (error) {
      console.log(`${name} 请求失败。 \n${error}`);
    }
    return cacheData;
  };
  
  /**
   * 将图片转换为 Base64 格式
   * @param {Image} img
   * @returns {string} Base64
   */
  toBase64 = (img) => {
    return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`
  };
  
  /**
   * 获取远程图片并使用缓存 toBase64
   * @param {string} filename带扩展名， 当url中没有文件扩展名时，用于判断文件类型。
   * @param {Image} url
   */
  getCacheImage = async (url, filename, type = 'image') => {
    const { name } = this.getFileInfo(filename || url);
    const cache = this.useFileManager({ type });
    const image = cache.read(name);
    if (image) {
      return this.toBase64(image);
    }
    const img = await this.httpRequest(url, type);
    console.log(`${name}: Data downloaded and cached`);
    cache.write(name, img);
    return this.toBase64(img);
  };
  
  /**
   * Setting drawTableIcon
   * @param { Image } image
   * @param { string } string
   */  
  getCacheMaskSFIcon = async (name, color, type = 'image') => {
    const cache = this.useFileManager({ type });
    const image = cache.read(name);
    if (image) {
      return this.toBase64(image);
    }
    const img = await this.drawTableIcon(name, color);
    cache.write(name, img);
    return this.toBase64(img);
  };
  
  /**
   * SFIcon 转换为base64
   * @param {*} icon SFicon
   * @returns base64 string
   */
  drawSFIcon = (icon = name) => {
    let sf = SFSymbol.named(icon);
    if (sf === null) sf = SFSymbol.named('message');
    sf.applyFont(  
      Font.mediumSystemFont(30)
    );
    return sf.image;
  };
  
  // 缓存并读取原生 SFSymbol icon
  getCacheDrawSFIcon = async (name, type = 'image') => {
    const cache = this.useFileManager({ type });
    const image = cache.read(name);
    if (image) {
      return this.toBase64(image);
    }
    const img = await this.drawSFIcon(name);
    cache.write(name, img);
    return this.toBase64(img);
  };
  
  /**
   * 绘制带背景颜色的表格图标
   * @param {string} icon
   * @param {string} color
   * @param {number} cornerWidth
   * @returns {Image} - image
   */
  drawTableIcon = async (
    icon = name,
    color = '#ff6800',
    cornerWidth = 42
  ) => {
    let sfi = SFSymbol.named(icon);
    if (sfi === null) sfi = SFSymbol.named('message.fill');
    sfi.applyFont(  
      Font.mediumSystemFont(30)
    );
    const imgData = Data.fromPNG(sfi.image).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />`;
      
    const js = `
      const canvas = document.createElement("canvas");
      const sourceImg = document.getElementById("sourceImg");
      const silhouetteImg = document.getElementById("silhouetteImg");
      const ctx = canvas.getContext('2d');
      const size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pix = imgData.data;
      for (var i=0, n = pix.length; i < n; i+= 4){
        pix[i] = 255;
        pix[i+1] = 255;
        pix[i+2] = 255;
        pix[i+3] = pix[i+3];
      }
      ctx.putImageData(imgData,0,0);
      silhouetteImg.src = canvas.toDataURL();
      output=canvas.toDataURL()
    `;
  
    let wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    const size = new Size(160, 160);
    const ctx = new DrawContext();
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    ctx.size = size;
    const path = new Path();
    const rect = new Rect(0, 0, size.width, size.width);
  
    path.addRoundedRect(rect, cornerWidth, cornerWidth);
    path.closeSubpath();
    ctx.setFillColor(new Color(color));
    ctx.addPath(path);
    ctx.fillPath();
    const rate = 36;
    const iw = size.width - rate;
    const x = (size.width - iw) / 2;
    ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw));
    return ctx.getImage();
  };
  
  /**
   * drawSquare
   * @param { Image } image
   * @param { string } string
   */
  drawSquare = async (img) => {
    const imgData = Data.fromPNG(img).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />`;
    const js = `
      const canvas = document.createElement("canvas");
      const sourceImg = document.getElementById("sourceImg");
      const silhouetteImg = document.getElementById("silhouetteImg");
      const ctx = canvas.getContext('2d');
      // 裁剪成正方形
      const size = Math.min(sourceImg.width, sourceImg.height);
      canvas.width = canvas.height = size;
      ctx.drawImage(sourceImg, (sourceImg.width - size) / 2, (sourceImg.height - size) / 2, size, size, 0, 0, size, size);
      
      // 压缩图像
      const maxFileSize = 200 * 1024
      const quality = Math.min(1, Math.sqrt(maxFileSize / (canvas.toDataURL('image/jpeg', 1).length * 0.75)));
      const compressedCanvas = document.createElement("canvas");
      const compressedCtx = compressedCanvas.getContext('2d');
      compressedCanvas.width = compressedCanvas.height = 400;
      compressedCtx.drawImage(canvas, 0, 0, size, size, 0, 0, 400, 400);
      
      silhouetteImg.src = canvas.toDataURL();
      output = compressedCanvas.toDataURL('image/jpeg', quality);
    `;
    
    const wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    return await new Request(base64Image).loadImage();  
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
   * 从远程下载 JavaScript 文件并缓存
   * @returns {Promise<string[]>} 包含各个 JavaScript
   */
  async scriptTags() {
    const scripts = ['jquery.min.js', 'bootstrap.min.js', 'loader.js'];
    const js = await Promise.all(scripts.map(async (script) => {
      const url = `${this.rootUrl}/web/${script}%3Fver%3D8.0.1`
      const content = await this.getCacheData(url);
      return `<script>${content}</script>`;
    }));
    return js.join('\n');
  };
  
  /**
   * 获取模块页面路径，如本地不存在或需更新则从远程获取
   * @param {string} scriptName
   * @param {string} url
   * @returns {Promise<string|null>}
   */
  async webModule(url) {
    const { name } = this.getFileInfo(url);
    const modulePath = this.fm.joinPath(this.cacheStr, name);
    if (!this.settings.update && this.fm.fileExists(modulePath)) {
      return modulePath;
    }
    const moduleJs = await this.getCacheData(url)
      .catch(() => null);
    if (moduleJs) return modulePath;
  };
    
  /**
   * 获取 boxjs Data
   * 依赖：Quantumult-X / Surge
   */
  boxjsData = async (key) => {
    try {
      const response = await this.httpRequest(`http://boxjs.com/query/data/${key}`, 'json');
      const value = JSON.parse(response?.val);
      console.log(value);
      return value || {};
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
  
  /**
   * 下载安装 95du Script 脚本库
   * @description 从指定 URL 下载 95度 Script 的最新版本并保存到本地文件系统中，方便用户访问和使用脚本库。
   */
  async myStore() {
    const url = `${this.rootUrl}/run/web_module_95duScript.js`;
    const script = await this.httpRequest(url);
    const fm = FileManager.iCloud();
    fm.writeString(
      fm.documentsDirectory() + '/95du_ScriptStore.js', script);
  };
  
  /**
   * 检查并推送 AppleOS 系统更新
   * @example
   * 检查设定时间内是否有新 iOS 版本发布，若有则推送更新通知并更新推送状态。
   */
  async appleOS_update() {
    const settings = this.settings;
    const hour = new Date().getHours();
    const { 
      appleOS,
      startTime = 4, 
      endTime = 6 
    } = settings;

    if (appleOS && hour >= startTime && hour <= endTime) {
      const html = await this.httpRequest('https://developer.apple.com/news/releases/rss/releases.rss');
      const iOS = html.match(/<title>(iOS.*?)<\/title>/)[1];
      if (settings.push !== iOS) {
        this.notify('AppleOS 更新通知 🔥', '新版本发布: ' + iOS);
        settings.push = iOS
        this.writeSettings(settings);
      }
    }
  };
  
  /**  
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   */
  async notify(title, body, url, sound = 'default') {
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
   * 弹窗输入多个值
   * @param {string} title
   * @param {string} message
   * @param {Array<{ hint: string, value: string }>} fields - 输入框配置，包含提示文本和默认值
   * @returns {Promise<Array<string>>} 返回数组
   */
  collectInputs = async (title, message, fields) => {
    const alert = new Alert();
    alert.title = title;
    alert.message = message;
    fields.forEach(({ hint, value }) => alert.addTextField(hint, value));
    alert.addAction("取消");
    alert.addAction("确认");
    const getIndex = await alert.presentAlert();
    if (getIndex === 1) {
      return fields.map((_, index) => alert.textFieldValue(index));
    }
    return []; 
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
      return getIndex;
    }
  };
  
  /**
   * Timestamp Formatter
   * 11-05 21:59 (short) 
   * 2024-11-05 21:59 (long)
   * @param {number} timestamp
   * @param {boolean} short (true)
   */
  formatDate(timestamp, short) {
    return new Date(timestamp + 8 * 3600000).toISOString().slice(short ? 5 : 0, 16).replace('T', ' ');  
  };
  
  /**  
   * 获取数组中的随机值
   * @param {Array} array - 输入的数组
   * @returns {*} 返回数组中的一个随机元素，如果数组为空则返回 null
   */
  getRandomItem(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  };
};

module.exports = { _95du };