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
  }

  // 初始化目录和路径
  initPaths() {
    const mainPath = this.fm.joinPath(this.fm.documentsDirectory(), this.pathName);
    this.fm.createDirectory(mainPath, true);
  
    this.settingPath = this.fm.joinPath(mainPath, 'setting.json');
    this.cacheImg = this.fm.joinPath(mainPath, 'cache_image');
    this.cacheStr = this.fm.joinPath(mainPath, 'cache_string');

    [this.cacheImg, this.cacheStr].forEach(path => this.fm.createDirectory(path, true));
  }

  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  getSettings() {
    const fileExists = this.fm.fileExists(this.settingPath);
    return fileExists ? JSON.parse(this.fm.readString(this.settingPath)) : {};
  }

  /**
   * 存储当前设置
   * @param { JSON } setting
   */
   async writeSettings(setting) {
     this.fm.writeString(
       this.settingPath, JSON.stringify(setting, null, 2)
     );
     console.log(JSON.stringify(  
       setting, null, 2  
     ))
   }

  /**  
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   */
  async notify(title, body, url) {
    const n = new Notification();
    n.title = title;
    n.body = body;
    n.sound = 'event';
    if (url) n.openURL = url;
    await n.schedule();
  }
  
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
}

module.exports = { _95du };