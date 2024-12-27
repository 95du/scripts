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
    // 默认通知
    if (typeof this.settings.notify === 'undefined') {
      this.settings.notify = true;
    }
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
  writeSettings(setting) {
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
    headers = {}, 
    method = 'GET', 
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
      request.timeoutInterval = 10;
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
    request.timeoutInterval = 10;
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
    
    const isExpired = (filePath) => {
      return (Date.now() - this.fm.creationDate(filePath).getTime()) / (60 * 60 * 1000) > cacheTime;  
    };
    
    const read = (name) => {
      const path = filePath(name);
      if (this.fm.fileExists(path)) {
        if (!isExpired(path)) return readFile(path);
        this.fm.remove(path);
        console.log(`更新${name}`)
      }
      return null;
    };
    const write = (name, content) => writeFile(filePath(name), content);
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
        this.writeSettings(settings)
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
   * 获取数组中的随机值，随机n个对象
   * @param {Array} arr - 输入的数组
   * @returns {*} 返回数组中的一个随机元素，如果数组为空则返回 null
   */
  getRandomItem(arr, count = 0) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * arr.length);
    if (count) return arr.sort(() => Math.random() - 0.5).slice(0, count);
    return arr[randomIndex];
  };
  
  /**
   * 创建并配置一个通用的 barStack
   * @param {object} parentStack
   * @param {string} layout 布局方式 ("horizontal" 或 "vertical")
   * @param {object} size Stack 的大小（new Size(width, height)）
   * @param {number[]} padding 内边距 [top, right, bottom, left]
   * @param {number} cornerRadius 圆角
   * @param {string} borderColor 边框颜色（十六进制颜色值）
   * @param {number} borderWidth 宽度
   * @returns {object} 返回配置的 Stack
   */
  createStack = (parentStack, layout = 'horizontal', backgroundColor = null, size = null, cornerRadius = 0, padding = [0, 0, 0, 0], borderColor = null, borderWidth = 0) => {
    const stack = parentStack.addStack();
    layout === 'vertical' ? stack.layoutVertically() : stack.layoutHorizontally();
    stack.centerAlignContent();
    if (size) stack.size = size;
    if (padding) stack.setPadding(...padding);
    if (backgroundColor) stack.backgroundColor = new Color(backgroundColor);
    stack.cornerRadius = cornerRadius;
    if (borderColor) stack.borderColor = new Color(borderColor);
    stack.borderWidth = borderWidth;
    return stack;
  };
  
  /**
   * 根据设备屏幕尺寸匹配预定义的屏幕数据，计算与参考尺寸的缩放比例。
   * - 如果未匹配到数据，返回默认比例 1。
   * - 否则计算比例：(匹配屏幕的 widget 尺寸) / (参考 widget 尺寸) 
   * @returns {number} 缩放比例
   */
  getDeviceSize = (widgetSize = false) => {
    const refSize = { widget: 170 };
    const screens = [
      /** 16 Pro Max */
      {
        width: 440,
        height: 956,
        widget: 174,
        sizes: {
          small: { w: 174, h: 174 },
          medium: { w: 372, h: 174 },
          large: { w: 372, h: 400 }
        }
      },
      /** 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max */
      {
        width: 430,
        height: 932,
        widget: 170,
        sizes: {
          small: { w: 170, h: 170 },
          medium: { w: 364, h: 170 },
          large: { w: 364, h: 396 }
        }
      },
      /** 14 Plus, 13 Pro Max, 12 Pro Max */
      {
        width: 428,
        height: 926,
        widget: 170,
        sizes: {
          small: { w: 170, h: 170 },
          medium: { w: 364, h: 170 },
          large: { w: 364, h: 392 }
        }
      },
      /** 11 Pro Max, XS Max, 11, XR */
      {
        width: 414,
        height: 896,
        widget: 169,
        sizes: {
          small: { w: 169, h: 169 },
          medium: { w: 360, h: 169 },
          large: { w: 360, h: 380 }
        }
      },
      /** 16 Pro */
      {
        width: 402,
        height: 874,
        widget: 162,
        sizes: {
          small: { w: 162, h: 162 },
          medium: { w: 344, h: 162 },
          large: { w: 344, h: 370 }
        }
      },
      /** Home button Plus phones */
      {
        width: 414,
        height: 736,
        widget: 159,
        sizes: {
          small: { w: 159, h: 159 },
          medium: { w: 348, h: 159 },
          large: { w: 348, h: 357 }
        }
      },
      /** 16, 15, 15 Pro, 14 Pro */
      {
        width: 393,
        height: 852,
        widget: 158,
        sizes: {
          small: { w: 158, h: 158 },
          medium: { w: 338, h: 158 },
          large: { w: 338, h: 354 }
        }
      },
      /** 14, 13, 13 Pro, 12, 12 Pro */
      {
        width: 390,
        height: 844,
        widget: 158,
        sizes: {
          small: { w: 158, h: 158 },
          medium: { w: 338, h: 158 },
          large: { w: 338, h: 352 }
        }
      },
      /** 13 mini, 12 mini / 11 Pro, XS, X */
      {
        width: 375,
        height: 812,
        widget: 155,
        sizes: {
          small: { w: 155, h: 155 },
          medium: { w: 329, h: 155 },
          large: { w: 329, h: 345 }
        }
      },
      /** SE3, SE2, Home button Plus in Display Zoom mode */
      {
        width: 375,
        height: 667,
        widget: 148,
        sizes: {
          small: { w: 148, h: 148 },
          medium: { w: 321, h: 148 },
          large: { w: 321, h: 324 }
        }
      },
      /** 11 and XR in Display Zoom mode */
      {
        width: 360,
        height: 780,
        widget: 155,
        sizes: {
          small: { w: 155, h: 155 },
          medium: { w: 338, h: 155 },
          large: { w: 338, h: 354 }
        }
      },
      /** SE1 */
      {
        width: 320,
        height: 568,
        widget: 141,
        sizes: {
          small: { w: 141, h: 141 },
          medium: null,
          large: null
        }
      }
    ];
  
    const { width, height } = Device.screenSize();
    const match = screens.find(
      s => (s.width === width && s.height === height) || (s.width === height && s.height === width)
    );
  
    if (!match) {
      const defaultSizes = {
        small: { w: 170, h: 170 },
        medium: { w: 364, h: 170 },
        large: { w: 364, h: 392 }
      };
      return widgetSize ? defaultSizes : 1; // 返回默认 sizes 或比例 1
    }

    return widgetSize ? match.sizes : Math.round((match.widget / refSize.widget) * 100) / 100;
  };
  
  /**
   * - 调用 `getScaleFactor` 获取当前设备的缩放比例。
   * - 遍历基础配置的键值对，按缩放比例调整值。
   * @param {Object} baseConfig - 基础布局配置对象，包含尺寸和间距等属性。
   * @returns {Object} object
   */
  generateLayout = (baseConfig) => {
    const scale = this.getDeviceSize();
    const value = Object.fromEntries(Object.entries(baseConfig).map(([key, value]) => [key, value * scale]));
    return value;
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
   * 远程下载的音频文件。
   * 从本地存储读取音频文件，并将其转换为 Base64 格式。
   * @returns {Promise<string>} Base64 编码的音频数据 URL。
   */
  playAudio = async () => {
    const url = `${this.rootUrl}/update/payment_success.mp3`;
    const audioPath = this.fm.joinPath(this.cacheStr, 'payment_success.mp3');
  
    if (!this.fm.fileExists(audioPath)) {
      const req = new Request(url);
      req.timeoutInterval = 10;
      this.fm.write(audioPath, await req.load());
      console.log('Audio file downloaded.');
    }
  
    const audioData = this.fm.read(audioPath);
    const audioBase64 = audioData.toBase64String();
    const audioSource = `data:audio/mp3;base64,${audioBase64}`;
    return audioSource;
  };
  
  /**
   * 版本更新时弹出窗口
   * @returns {String} string
   */
  updatePopup = (version) => {
    const creationDate = this.fm.creationDate(this.settingPath);
    const isInitialized = Date.now() - creationDate.getTime() > 300000;
  
    if (isInitialized) {
      if (this.settings.version !== version) return '.signin-loader';
      if (this.settings.loader !== undefined && this.settings.loader !== '95du') return '.signup-loader';
      if (this.settings.donate) return '.signup-loader';
    }
  };
  
  // 用户偏好设置菜单
  userMenus = (settings, widget = false) => {
    const filePath = this.fm.joinPath(this.fm.documentsDirectory(), '95du_Store/setting.json')
    const setting = this.fm.fileExists(filePath) ? JSON.parse(this.fm.readString(filePath)) : {};
    
    const randomWidgets = this.getRandomItem(setting.items, 10) 
    const recommendedWidgets = randomWidgets?.filter(item => item.recommend) || [];
  
    const transformedItems = recommendedWidgets.map(item => ({
      label: item.label,
      version: item.version,
      type: "card",
      scrUrl: item.scrUrl,
      icon: item.icon
    }));
    
    // 返回页面菜单
    return [
      {
        type: 'group',
        items: [
          {
            label: '炫酷时钟',
            name: 'clock',
            type: 'switch',
            icon: {
              name: 'button.programmable',
              color: '#F326A2'
            }
          },
          {
            label: '图片轮播',
            name: 'topStyle',
            type: 'switch',
            icon: {
              name: 'photo.tv',
              color: '#FF9500'
            }
          },
          {
            label: '列表动画',
            name: 'animation',
            type: 'switch',
            icon: {
              name: 'rotate.right.fill',
              color: '#BD7DFF'
            },
            default: true
          },
          {
            label: '动画时间',
            name: 'fadeInUp',
            type: 'cell',
            input: true,
            icon: {
              name: 'clock.fill',
              color: '#0096FF'
            },
            message: '设置时长为0时，列表将无动画效果\n( 单位: 秒 )',
            desc: settings.fadeInUp
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: widget ? '组件推荐' : '组件简介',
            name: 'widgetMsg',
            type: 'cell',
            icon: {
              name: 'doc.text.image',
              color: '#43CD80'
            },
            ...(widget && { item: transformedItems })  
          },
          {
            label: '组件商店',
            name: 'store',
            type: 'cell',
            icon: {
              name: 'bag.fill',
              color: '#FF6800'
            }
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: 'AppleOS',
            name: 'appleOS',
            type: 'switch',
            icon: `${this.rootUrl}/img/symbol/notice.png`
          },
          {
            label: '推送时段',
            name: 'period',
            type: 'cell',
            isDesc: true,
            icon: {
              name: 'deskclock.fill',
              color: '#0096FF'
            },
            message: 'iOS 最新系统版本更新通知\n默认 04:00 至 06:00',
            desc: settings.startTime || settings.endTime ? '已设置' : '默认'
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            name: 'donate',
            label: '打赏作者',
            type: 'cell',
            icon: `${this.rootUrl}/img/icon/weChat.png`
          }
        ]
      }
    ];
  };
  
  /**
   * 生成主菜单头像信息和弹窗的HTML内容
   * @returns {string} 包含主菜单头像信息、弹窗和脚本标签的HTML字符串
   */
  mainMenuTop = (
    version,
    authorAvatar,
    appleHub_dark,
    appleHub_light,
    scriptName,
    listItems,
    collectionCode
  ) => {
    return `
      <div class="avatarInfo">
        <span class="signup-loader">
          <img src="${authorAvatar}" class="avatar"/>
        </span>
        <a class="signin-loader"></a>
        <div class="interval"></div>
        <a class="but">
          <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" onclick="switchDrawerMenu()" tabindex="0"></a>
        <div id="store">
          <a class="rainbow-text but">Script Store</a>
        </div>
      </div>
      <!-- 对话框 -->
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="zib-widget blur-bg relative">
            <a href="#tab-sign-up" data-toggle="tab"></a>
            <div class="box-body sign-logo" data-dismiss="modal" onclick="hidePopup()">  
              <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
            </div>
            <div class="tab-content">
              <!-- 版本信息 -->
              <div class="tab-pane fade active in" id="tab-sign-in">
                <div class="padding">
                  <div href="#tab-sign-up" data-toggle="tab" class="title-h-center popup-title">
                    ${scriptName}
                  </div>
                  <a class="popup-content update-desc">
                     <div class="but">Version ${version}</div>
                  </a><br>
                  <div class="form-label-title update-desc">${listItems}
                  </div>
                </div>
                <div class="box-body" ><button id="install" class="but radius jb-yellow btn-block">立即更新</button>
                </div>
              </div>
              <!-- 捐赠 -->
              <div class="tab-pane fade-in" id="tab-sign-up">
                <a class="donate flip-horizontal" href="#tab-sign-in" data-toggle="tab"><img src="${collectionCode}">  
                </a>
              </div>
            </div>
            <p class="separator" data-dismiss="modal">95du丶茅台</p>
          </div>
        </div>
      </div>
      <script>
        const popupOpen = () => { $('.signin-loader').click() };
        
        window.onload = () => {
          setTimeout(() => {
            $('${this.updatePopup(version)}').click()
          }, 1200);
        };
        window._win = { uri: 'https://demo.zibll.com/wp-content/themes/zibll' };
      </script>`;
  };
  
  /**
   * @returns {string} 返回一个包含随机酷狗音乐 iframe 的 HTML 字符串。
   * 该 iframe 源自随机选取的歌曲 ID，并动态加载歌曲。
   */
  musicHtml = () => {
    const songId = [
      '8fk9B72BcV2',
      '8duPZb8BcV2',
      '6pM373bBdV2',
      '6NJHhd6BeV2',
      '4yhGxb6CJV2',
      '2ihRd27CKV2',
      'a2e7985CLV2',
      'cwFCHbdCNV2',
      'UxE30dCPV2',
      '4Qs8h89CPV2',
      '9tGRt0cCTV2',
      '548vR21CUV2',
      'aqaNd6aCUV2'
    ];
    const randomId = this.getRandomItem(songId);
    return `
      <iframe data-src="https://t1.kugou.com/song.html?id=${randomId}" class="custom-iframe" frameborder="0" scrolling="auto">
      </iframe>
      <script>
        const iframe = document.querySelector('.custom-iframe');
        iframe.src = iframe.getAttribute('data-src');
      </script>`;
  };
  
  /**
   * Donated Author
   * weChat pay
   */
  donatePopup = (appleHub_dark, appleHub_light, collectionCode) => {
    return `        
      <a class="signin-loader"></a>
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="zib-widget blur-bg relative">
            <div id="appleHub" class="box-body sign-logo">
              <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
            </div>
            <a class="but donated">
              <img src="${collectionCode}">
            </a>
            <p class="but separator">95du丶茅台</p>
          </div>
        </div>
      </div>
      <script>
        const popupOpen = () => { $('.signin-loader').click() };
        window._win = { uri: 'https://demo.zibll.com/wp-content/themes/zibll' };
      </script>`
  };
  
  /**
   * 底部弹窗信息
   * 创建底部弹窗的相关交互功能
   * 当用户点击底部弹窗时，显示/隐藏弹窗动画，并显示预设消息的打字效果。
   */
  cardHtml = (formItems) => formItems.flatMap(group => 
    group.items.flatMap(item => 
      item.item?.filter(i => i.type === 'card').map(i => `
      <div class="card">
        <img src="${i.icon}">
        <span>${i.label}</span>
        <p>${i.version}</p>
        <button class="but" style="background-color: #FF9000" onclick="clickCard(1, '${i.label}', '${i.scrUrl}')">获 取</button>
      </div>`) || []
    )
  ).join('');
  
  /**
   * 生成弹窗组件，支持打字效果或卡片显示。
   * @param {Object} options - 弹窗
   * @param {string} widgetMessage
   * @param {Array} 卡片内容
   * @returns {string} - HTML
   */
  menulists = (items) => Promise.all(
    items.map(async (item) => ({
      ...item,
      icon: await this.getCacheDrawSFIcon(item.icon),
    }))
  );
  
  buttonPopup = async ({
    settings,
    widgetMessage = '组件描述',
    formItems,
    avatarInfo,
    appImage,
    appleHub_dark,
    appleHub_light,
    id,
    buttonColor,
    margin,
    text,
    text2,
    toggle = false,
    lablename = '组件脚本',
    elementById = 'store'
  }) => {
    const cells = [
      {
        label: lablename,
        name: elementById,
        type: 'cell',
        icon: 'message.circle.fill'
      }
    ];
    
    const menu = [
      {
        label: '捐赠弹窗',
        name: 'donate',
        type: 'switch',
        icon: 'questionmark.circle.fill'
      },
      {
        label: '背景音乐',
        name: 'music',
        type: 'switch',
        icon: 'speaker.wave.2.circle.fill'
      }
    ];
    
    const [menuItems, cellItems] = await Promise.all([
      this.menulists(menu),
      this.menulists(cells),
    ]);
    
    const label = (item) => `
      <label class="form-item" onclick="clickCard('${item.name}')">
        <div class="form-label">
          <img class="formItems-label-img" src="${item.icon}"/>
          <div class="form-label-title">${item.label}</div>
        </div>
        ${
          item.desc ? `
            <div class="form-label">
              <div id="${item.id}-desc" class="form-item-right-desc">${item.desc}</div>
              <i class="iconfont icon-arrow_right"></i>
            </div>
          ` : `<i class="iconfont icon-arrow_right"></i>`
        }
      </label>
    `;
    
    const labels = () => `
    <div class="sign-logo" style="margin-bottom: -10px;">
      <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
    </div>
    <div class="list__2">
      <form class="list__body">
        ${menuItems.map((item) => `
          <label class="form-item">
            <div class="form-label">
              <img class="formItems-label-img" src="${item.icon}" />
              <div class="form-label-title">${item.label}</div>
            </div>
            <input type="checkbox" role="switch" ${settings[item.name] ? 'checked' : ''} onchange="handleToggle('${item.name}', this.checked)" />
          </label>
        `).join('')}
        ${cellItems.map(item => label(item)).join('')}
      </form>
    </div>`;
    
    let content = '';
    if (avatarInfo) {
      if (toggle) {
        content = labels();
      } else {
        content = `
          <img id="app" onclick="switchDrawerMenu()" class="app-icon" src="${appImage}">
          <div style="margin-bottom: ${margin}">${text}</div>  
          <div style="margin-bottom: 25px;"></div>
          <button class="but ${buttonColor}" onclick="clickCard('${id}')">${text2}</button>
        `;
      }
    } else if (widgetMessage) {
      content = `
        <div class="sign-logo" style="margin-bottom: -10px;">
          <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
        </div>
      `;
    } else {
      content = `<div class="card-container">${this.cardHtml?.(formItems)}</div>`;
    };
    
    // js 部分
    let audioSource;
    if (!avatarInfo && !widgetMessage) audioSource = await this.playAudio();
    const height = avatarInfo && toggle ? '280px' : '260px';
    
    const js = `
      const menuMask = document.querySelector(".popup-mask")
      const showMask = async (callback, isFadeIn) => {
        const duration = isFadeIn ? 200 : 300;
        const startTime = performance.now();
        const animate = async (currentTime) => {
          const elapsedTime = currentTime - startTime;
          menuMask.style.opacity = isFadeIn ? elapsedTime / duration : 1 - elapsedTime / duration;
          if (elapsedTime < duration) requestAnimationFrame(animate);
          else callback?.();
        };
  
        menuMask.style.display = "block";
        requestAnimationFrame(() => animate(performance.now()));
      };
  
      function switchDrawerMenu() {
        const popup = document.querySelector(".popup-container");
        const isOpenPopup = popup.style.height !== '${height}';
        showMask(isOpenPopup ? null : () => (menuMask.style.display = "none"), isOpenPopup);
        popup.style.height = isOpenPopup ? '${height}' : '';
        ${widgetMessage ? (!avatarInfo ? 'isOpenPopup && typeNextChar()' : '') : ''}
      };
      
      const hidePopup = () => {
        setTimeout(() => switchDrawerMenu(), 300);
      };
      
      const clickCard = (param, label, scrUrl) => {
        hidePopup();
        const audio = new Audio('${audioSource}');
        audio.play().catch(err => console.log(err));
        const item = label && scrUrl ? JSON.stringify({ label, scrUrl }) : '';
        setTimeout(() => invoke(param, item), item ? 0 : 800);
      };
      
      // 弹窗内按钮切换事件
      const handleToggle = (name, value) => {
        invoke('changeSettings', { [name]: value });
        if (name === 'music') switchBox({ [name]: value });
      };
      
      function switchBox(formData) {
        iframe.src = !formData.music ? '' : iframe.getAttribute('data-src');
        const musicInput = document.querySelector('input[name="music"]');
        if (musicInput) musicInput.checked = formData['music'] = this.checked;
      };
      
      // 打字动画效果
      const typeNextChar = () => {
        const chatMsg = document.querySelector(".chat-message");
        chatMsg.innerHTML = "";
        let charIndex = 0;
        const message = \`${widgetMessage}\`;
        const nextChar = () => {
          if (charIndex >= message.length) return;
          const isTag = message[charIndex] === '<';
          const endIdx = isTag ? message.indexOf(">", charIndex) + 1 : charIndex + 1;
          chatMsg.innerHTML += message.slice(charIndex, endIdx);
          charIndex = endIdx;
          chatMsg.scrollTop = chatMsg.scrollHeight;
          setTimeout(nextChar, 30);
        };
        nextChar();
      };
    `;
    
    const style = `
      .custom-img {
        margin-bottom: 10px;
      }
      
      .popup-widget {
        clear: both;
        padding: 10px 0;
        border-radius: var(--main-radius);
        height: '${height}';
      }
    `;
    
    return `
      <div class="popup-mask" onclick="switchDrawerMenu()"></div>
      <div class="popup-container">
        <div class="popup-widget zib-widget blur-bg" role="dialog">
          <div class="box-body">
            ${content}
          </div>
          ${widgetMessage ? `<div class="chat-message"></div>` : ''}
        </div>
      </div>
      ${avatarInfo ? `<style>${style}</style>` : ''}
      <script>${js}</script>
    `
  };
  
  /**
   * @returns {Promise<string>} - 返回一个包含时钟 HTML 的字符串，根据设置动态控制显示样式。
   * - 在页面中动态嵌入时钟组件。
   * - 可通过设置动态控制时钟的显示与隐藏。
   */
  clockHtml = async (settings) => {
    const clockScript = await this.getCacheData(`${this.rootUrl}/web/clock.html`);
    const displayStyle = settings.clock ? 'block' : 'none';
    return `<div id="clock" style="display: ${displayStyle}">${clockScript}</div>`;
  };
  
  /**
   * 组件效果图预览
   * 图片左右轮播
   * Preview Component Images
   * This function displays images with left-right carousel effect.
   */
  previewImgHtml = async (settings, previewImgUrl) => {
    const displayStyle = settings.clock ? 'none' : 'block';
    
    if (settings.topStyle) {
      const previewImgs = await Promise.all(previewImgUrl.map(async (item) => {
      const previewImg = await this.getCacheImage(item);
        return previewImg;
      }));
      return `${await this.clockHtml(settings)}
        <div id="scrollBox" style="display: ${displayStyle}">
          <div id="scrollImg">
            ${previewImgs.map(img => `<img src="${img}">`).join('')}
          </div>
        </div>`; 
    } else {
      const randomUrl = this.getRandomItem(previewImgUrl);
      const previewImg = await this.getCacheImage(randomUrl);
      return `${await this.clockHtml(settings)}
      <img id="store" src="${previewImg}" class="preview-img" style="display: ${displayStyle}">`
    }
  };
  
  /**
   * 更新select 元素的选项
   * @param {JSON} valuesItems
   * @param {WebView} webView
   */
  updateSelect = (webView, items) => {
     webView.evaluateJavaScript(`
      (() => {
        const valuesArr = ${JSON.stringify(items)};
        const select = document.querySelector('[name="selected"]');
        select.innerHTML = ''
        valuesArr.forEach(grp => {
          const group = document.createElement('optgroup');
          group.label = grp.label;
          grp.values.forEach((val, index) => {
            const option = document.createElement('option');
            option.value = val.value;
            option.textContent = val.label;
            if (grp.label[1] && index == 0) option.selected = true;
            group.appendChild(option);
          });
          select.appendChild(group);
        });
        select.style.width = '100px';
      })();
    `, false).catch(console.error);
  };
  
  // 增加右侧 desc 颜色(中国电信_3)
  addColorDesc = (settings) => {
    let htmlFragment = '';
    settings.rank?.forEach((item, index) => {
      htmlFragment += `<span class="${item.name.toLowerCase()}-text" style="color: ${item.color};">${item.name}</span>`;
    });
    return htmlFragment;
  };
  
  /**
   * @param {Array} formItems
   * @param {Object} settings
   * @returns {string} 返回嵌入页面的 JavaScript 脚本 (设置js)
   * @returns {Image} 返回页面图标图片
   */
  runScripts = async (formItems, settings, separ) => {
    // 批量处理图标加载  
    const getAndBuildIcon = async (item) => {
      const { icon } = item;
      if (icon?.name) {
        const { name, color } = icon;
        item.icon = await this.getCacheMaskSFIcon(name, color);
      } else if (icon?.startsWith('https')) {
        item.icon = await this.getCacheImage(icon);
      } else if (!icon?.startsWith('data')) {
        item.icon = await this.getCacheDrawSFIcon(icon);
      }
    };
  
    const subArray = [];
    const promises = [];
    const buildIcon = (item) => getAndBuildIcon(item);
    const processItem = (item) => {
      promises.push(buildIcon(item));
      if (item.item) {
        item.item.forEach((i) => {
          promises.push(buildIcon(i))
          subArray.push(i);
        });
      }
    };
  
    // 遍历所有表单项并处理
    formItems.forEach(group => group.items.forEach(processItem));
    await Promise.all(promises);
    
    // =======  js  =======//
    return `
    (() => {
    const settings = ${JSON.stringify({
      ...settings
    })}
    const formItems = ${JSON.stringify(formItems)}
    
    window.invoke = (code, data) => {
      window.dispatchEvent(
        new CustomEvent(
          'JBridge',
          { detail: { code, data } }
        )
      )
    }
    
    const formData = {};
    const createFormItem = (item) => {
      const value = settings[item.name] ?? item.default;
      formData[item.name] = value;
      
      const label = document.createElement("label");
      label.className = "form-item";
      label.dataset.name = item.name;
      
      const div = document.createElement("div");
      div.className = 'form-label';
      label.appendChild(div);
      
      if (item.icon) {
        const img = document.createElement("img");
        img.src = item.icon;
        img.className = 'form-label-img';
        div.appendChild(img);
      }
          
      const divTitle = document.createElement("div");
      divTitle.className = 'form-label-title';
      divTitle.innerText = item.label;
      div.appendChild(divTitle);
          
      if (item.type === 'select') {
        const select = document.createElement('select');
        select.name = item.name;
        select.classList.add('select-input');
        select.multiple = !!item.multiple;
        select.style.width = '130px'
      
        item.options?.forEach(grp => {
          const container = document.createElement('optgroup');
          if (grp.label) container.label = grp.label;
      
          grp.values.forEach(opt => {
            const option = new Option(opt.label, opt.value);
            option.disabled = opt.disabled || false;
            option.selected = (item.multiple && Array.isArray(value)) ? value.includes(opt.value) : value === opt.value;
            container.appendChild(option);
          });
          if (container !== select) select.appendChild(container);
        });
        
        select.addEventListener('change', (e) => {
          const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
          const selectedOption = item.options.flatMap(option => option.values).find(opt => opt.value === selectedValues[0]);
        
          if (selectedOption && selectedOption.type) {
            formData[item.name] = selectedOption.value;
            formData['type'] = selectedOption.type;
          } else {
            const convertValue = value => value === 'true' ? true : (value === 'false' ? false : (!isNaN(value) ? parseFloat(value) : value));
            formData[item.name] = item.multiple ? selectedValues.map(convertValue) : convertValue(selectedValues[0]);
            formData['type'] = null;
          }
          invoke('changeSettings', formData);
          selectWidth();
        });
        
        const selCont = document.createElement('div');
        selCont.classList.add('form-item__input__select');
        selCont.appendChild(select);
      
        if (!item.multiple) {
          select.style.appearance = 'none';
          const icon = document.createElement('i');
          icon.className = 'iconfont icon-arrow_right';
          selCont.appendChild(icon);
        };
        
        label.appendChild(selCont);
      } else if (['cell', 'page', 'file'].includes(item.type)) {
        const { name, isDesc, other, descColor } = item;

        if (item.desc) {
          const desc = document.createElement("div");
          desc.className = 'form-item-right-desc';
          desc.id = \`\${name}-desc\`
          
          if (descColor) {
            desc.innerHTML = \`${this.addColorDesc(settings)}\`;
          } else {
            desc.innerText = isDesc ? (settings[\`\${name}_status\`] ??item.desc) : other ? item.desc : settings[name];
          };
          
          label.appendChild(desc);
        };
      
        const icon = document.createElement('i');
        icon.className = 'iconfont icon-arrow_right';
        label.appendChild(icon);
        label.addEventListener('click', (e) => {
          switch (name) {
            case 'version':
            case 'donate':
              popupOpen();
              break;
            case 'setAvatar':
              fileInput.click();
              invoke(name, data);
              break;
            case 'inpShare':
            case 'sharing':
            case 'widgetMsg':
              switchDrawerMenu();
              break;
          };
      
          invoke(item.type === 'page' ? 'itemClick' : name, item);
        });
  
        /** file input **/
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".jpg,.jpeg,.png,.gif,.bmp";
        fileInput.addEventListener("change", async (event) => {
          const uploadedImage = document.querySelector('.avatar');
          const file = event.target.files[0];
          if (file && file.type.includes("image")) {
            avatarFile(file, name);
          }
        });
      } else {
        const input = document.createElement("input")
        input.className = 'form-item__input'
        input.name = item.name
        input.type = item.type
        input.enterKeyHint = 'done'
        input.value = value
        
        if (item.type === 'switch') {
          input.type = 'checkbox'
          input.role = 'switch'
          input.checked = value
        };
        
input.addEventListener("change", async (e) => {
          const isChecked = e.target.checked;
          formData[item.name] =
            item.type === 'switch'
            ? isChecked
            : e.target.value;
          
          if (item.name === 'clock') switchStyle(isChecked);
          if (item.name === 'iconBg') switchLabel(isChecked);
          if (item.name === 'alwaysDark') switchColor(isChecked);
          if (item.name === 'music') iframe.src = !formData.music ? '' : iframe.getAttribute('data-src');
          invoke('changeSettings', formData);
        });
        
        label.appendChild(input);
      }
      return label
    };
    
    /** 切换 label 文字 **/
    const switchLabel = async  (isChecked) => {
      const newTitle = isChecked ? '小号组件' : '图标背景';
      document.querySelectorAll('.form-label-title').forEach(title => {  
        title.textContent = (title.textContent === '图标背景' || title.textContent === '小号组件') ? newTitle : title.textContent;
      })  
    };
      
    /** 切换颜色并更新表单数据 **/
    const switchColor = async (isChecked) => {
      const colorValue = isChecked ? '#FFFFFF' : '#000000';
      const stackColor = isChecked ? '#2C2C2C' : '#EEEEEE';
      const fields = {
        subTitleColor: colorValue,
        leftLightText: colorValue,
        rightLightText: colorValue,
        rightStack: stackColor,
        lightColor: colorValue,
        textLightColor: colorValue
      };
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.querySelector(\`input[name="\${key}"]\`);
        if (input) input.value = formData[key] = value;
      });
      
      const inputNames = ['solidColor', 'bwTheme'];
      inputNames.forEach(name => {
        const input = document.querySelector(\`input[name="\${name}"]\`);
        if (input) input.checked = formData[name] = isChecked;
      });
    };
    
    /** fileInput 头像 **/
    const avatarFile = (file, name) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const tempCanvas = document.createElement('canvas');
          const tempContext = tempCanvas.getContext('2d');
        
          tempCanvas.width = tempCanvas.height = size;
          tempContext.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
        
          const uploadedImage = document.querySelector('.avatar');
          uploadedImage.src = tempCanvas.toDataURL();
        };
      
        img.src = e.target.result;
        const imageData = e.target.result.split(',')[1];
        invoke(name, imageData)
      };
      reader.readAsDataURL(file);
    };
    
    /** 时钟图片切换，动画 **/
    const fadeInOut = async (element, fadeIn) => {
      const fadeTime = 0.4
      element.style.transition = \`opacity \${fadeTime}s\`;
      element.style.opacity = fadeIn ? 1 : 0;
      element.style.display = 'block'          
      await new Promise(resolve => setTimeout(resolve, fadeTime * 700));
          
      if (!fadeIn) element.style.display = 'none';
      element.style.transition = '';
    };
    
    const switchStyle = async (isChecked) => {
      const imageId = settings.topStyle ? 'scrollBox' : 'store';
      const imageEle = document.getElementById(imageId);
      const htmlContainer = document.getElementById('clock');
          
      const fadeIn = isChecked ? htmlContainer : imageEle;
      const fadeOut = isChecked ? imageEle : htmlContainer;
          
      await fadeInOut(fadeOut, false)
      await fadeInOut(fadeIn, true);
    };
    
    /** ☘️创建列表通用组容器☘️ **/
    const createGroup = (fragment, title, headerClass = 'el__header', bodyClass = 'el__body', margin) => {
      const groupDiv = fragment.appendChild(document.createElement('div'));
      groupDiv.className = 'list';
    
      if (title) {
        const elTitle = groupDiv.appendChild(document.createElement('div'));
        elTitle.className = headerClass + (margin ? ' with-negative-margin' : '');
        elTitle.textContent = title;
      }
    
      const elBody = groupDiv.appendChild(document.createElement('div'));
      elBody.className = bodyClass;
      return elBody;
    };
    
    /** 创建范围输入元素 **/
    const createRange = (elBody, item) => {
      const range = elBody.appendChild(document.createElement('div'));
      range.innerHTML = \`
        <label class="collapsible-label" for="collapse-toggle">
          <div class="form-label">
            <div class="collapsible-value">${settings.angle || 90}</div>
          </div>
          <input id="_range" type="range" value="${settings.angle || 90}" min="0" max="360" step="5">
          <i class="fas fa-chevron-right icon-right-down"></i>
        </label>
        <!-- 折叠取色器 -->
        <div class="collapsible-range" id="content">
          <hr class="${separ}">
          <label class="form-item">
            <div class="form-label">
              <img class="form-label-img" src="\${item.icon}"/>
              <div class="form-label-title">渐变颜色</div>
            </div>
            <input type="color" value="\${settings.rangeColor}" id="color-input">
          </label>
        </div>\`;
    
      const icon = range.querySelector('.collapsible-label .icon-right-down');
      const content = range.querySelector('.collapsible-range');
      const colorInput = range.querySelector('#color-input');
      const rangeInput = range.querySelector('#_range');
      let isExpanded = false;
    
      const toggleShow = () => {
        content.classList.toggle('show');
        isExpanded = !isExpanded;
        icon.style.transition = 'transform 0.4s';
        icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      };
      range.querySelector('.collapsible-label').addEventListener('click', toggleShow);
    
      colorInput.addEventListener('change', (e) => {
        const selectedColor = e.target.value;
        settings.rangeColor = selectedColor;
        updateRange();
        formData[item.color] = selectedColor;
        invoke('changeSettings', formData);
      });
    
      const updateRange = () => {
        const value = rangeInput.value;
        const percent = ((value - rangeInput.min) / (rangeInput.max - rangeInput.min)) * 100;
        rangeInput.dataset.value = value;
        rangeInput.style.background = \`linear-gradient(90deg, \${settings.rangeColor} \${percent}%, var(--checkbox) \${percent}%)\`;
        range.querySelector('.collapsible-value').textContent = value;
      };
    
      rangeInput.addEventListener('input', updateRange);
      rangeInput.addEventListener('change', (event) => {
        formData[item.name] = event.target.value;
        invoke('changeSettings', formData);
      });
      updateRange();
    };
    
    /** 创建可折叠列表元素 **/  
    const createCollapsible = (elBody, item) => {
      const label = (item) => \`
        <label id="\${item.name}" class="form-item">
          <div class="form-label">
            <img class="form-label-img collapsible-label-img" src="\${item.icon}"/>
            <div class="form-label-title">\${item.label}</div>
          </div>
          \${item.desc ? \`
          <div class="form-label">
            <div id="\${item.name}-desc" class="form-item-right-desc">\${item.desc}</div>
            <i class="iconfont icon-arrow_right"></i>
          </div>\` : \`
          <i class="iconfont icon-arrow_right"></i>\`}
        </label>\`;
    
      const collapsible = elBody.appendChild(document.createElement('div'));
      collapsible.innerHTML = \`
        <label class="collapsible-label" for="collapse-toggle">
          <div class="form-label">
            <img class="form-label-img" src="\${item.icon}"/>
            <div class="form-label-title">\${item.label}</div>
          </div>
          <i class="fas fa-chevron-right icon-right-down"></i>
        </label>
        <hr class="separ">
        <!-- 折叠列表 -->
        <div class="collapsible-content" id="content">
          <div class="coll__body">
            \${item.item.map(item => label(item)).join('')}
          </div>
          <hr class="separ">
        </div>\`;
    
      const icon = collapsible.querySelector('.collapsible-label .icon-right-down');
      const content = collapsible.querySelector('.collapsible-content');
      let isExpanded = false;
      
      collapsible.querySelector('.collapsible-label').addEventListener('click', () => {
        content.classList.toggle('show');
        isExpanded = !isExpanded;
        icon.style.transition = 'transform 0.4s';
        icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      });
    
      collapsible.querySelectorAll('.form-item').forEach((label, index) => {
        label.addEventListener('click', () => {
          const labelId = label.getAttribute('id');
          invoke(labelId, item.item[index]);
        });
      })
    };
    
    //======== 创建列表 ========//
    const createList = ( list, title ) => {
      const fragment = document.createDocumentFragment();
      let elBody;
    
      for (const item of list) {
        if (item.type === 'group') {
          const grouped = createList(item.items, item.label);
          fragment.appendChild(grouped);
        } else if (item.type === 'range') {
          elBody = createGroup(fragment, title);  
          createRange(elBody, item);
        } else if (item.type === 'collapsible') {
          elBody = createGroup(fragment, title);
          createCollapsible(elBody, item);
        } else {
          if (!elBody) {
            const header = item.header ? 'el__header' : 'list__header';
            elBody = createGroup(fragment, title, header, 'list__body', item.header);
          }
          const label = createFormItem(item);
          elBody.appendChild(label);
        }
      }
      return fragment
    };
    const fragment = createList(formItems);
    document.getElementById('settings').appendChild(fragment);
    
    /** 加载动画 **/
    const toggleLoading = (e) => {
      const target = e.currentTarget;
      target.classList.add('loading')
      const icon = target.querySelector('.iconfont');
      const className = icon.className;
      icon.className = 'iconfont icon-loading';
      
      const listener = (event) => {
        if (event.detail.code) {
          target.classList.remove('loading');
          icon.className = className;
          window.removeEventListener(
            'JWeb', listener
          );
        }
      };
      window.addEventListener('JWeb', listener);
    };
    
    document.querySelectorAll('.form-item').forEach((btn) => {
      btn.addEventListener('click', (e) => { toggleLoading(e) });
    });
    
    // 切换 appleLogo 黑白主题
    const appleLogos = document.querySelectorAll('.logo');
    const toggleLogo = (isDark) => {
      const newSrc = isDark ? appleLogos[0].dataset.darkSrc : appleLogos[0].dataset.lightSrc;
      appleLogos.forEach(logo => logo.src = newSrc);
    };
      
    const updateOnDarkModeChange = (event) => toggleLogo(event.matches);
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    toggleLogo(isDarkMode);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateOnDarkModeChange);
    
    // 监听其他 elementById
    ['store', 'install', 'app', 'website'].forEach(id => {
      const elementById = document.getElementById(id).addEventListener('click', () => invoke(id));
    });
    
    })()`;
  };
};

module.exports = { _95du };