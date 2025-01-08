// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: cog;
/**
 * 脚本名称: 高德家人地图
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.0
 * 更新日期: 2024-03-27
 */


async function main() {
  const scriptName = '高德家人地图'
  const version = '1.1.0'
  const updateDate = '2024年10月23日'
  const pathName = '95du_amap_family'
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_amap_family.js`;

  /**
   * 创建，获取存储路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  if (!fm.fileExists(depPath)) fm.createDirectory(depPath);
  await download95duModule(rootUrl)
    .catch(() => download95duModule(spareUrl));
  const isDev = false
  
  /** ------- 导入模块 ------- */
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  const module = new _95du(pathName);
  
  const {
    mainPath,
    settingPath,
    cacheImg, 
    cacheStr
  } = module;
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 4));
    console.log(JSON.stringify(
      settings, null, 2
    ));
  };
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const screenSize = Device.screenSize().height;
  const DEFAULT = {
    version,
    refresh: 20,
    transparency: 0.5,
    masking: 0.3,
    gradient: ['#82B1FF'],
    values: [],
    update: true,
    topStyle: true,
    music: true,
    animation: true,
    appleOS: true,
    notify: true,
    fadeInUp: 0.7,
    angle: 90,
    alwaysDark: false,
    iconBg: true,
    progressWidth: Device.screenSize().height < 926 ? 165 : 175,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    rangeColor: '#FF6800',
    leftLightText: '#000000',
    leftNightText: '#FFFFFF',
    rightStack: '#EEEEEE',
    rightLightText: '#000000',
    rightNightText: '#FFFFFF',
    selected: 'random'
  };
  
  const initSettings = () => {
    const settings = DEFAULT;
    module.writeSettings(settings);
    return settings;
  };
  
  const settings = fm.fileExists(settingPath) 
    ? module.getSettings() 
    : initSettings();
  
  /**
   * 检查并下载远程依赖文件
   * Downloads or updates the `_95du.js` module hourly.
   * @param {string} rootUrl - The base URL for the module file.
   */
  async function download95duModule(rootUrl) {
    const modulePath = fm.joinPath(depPath, '_95du.js');
    const timestampPath = fm.joinPath(depPath, 'lastUpdated.txt');
    const currentDate = new Date().toISOString().slice(0, 13);
  
    const lastUpdatedDate = fm.fileExists(timestampPath) ? fm.readString(timestampPath) : '';
  
    if (!fm.fileExists(modulePath) || lastUpdatedDate !== currentDate) {
      const moduleJs = await new Request(`${rootUrl}/module/_95du.js`).load();
      fm.write(modulePath, moduleJs);
      fm.writeString(timestampPath, currentDate);
      console.log('Module updated');
    }
  };
  
  const ScriptableRun = () => Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
  
  // 预览组件，获取版本名称和链接
  const previewWidget = async () => {
    const modulePath = await module.webModule(scrUrl);
    if (modulePath != null) {
      const importedModule = importModule(modulePath);
      await importedModule.main();
      if (settings.update) await updateString();
      shimoFormData();
    }
  };
  
  // 格式化日期
  const getFormattedTime = (timestamp) => {
    const dateFormatter = new DateFormatter();
    dateFormatter.dateFormat = 'yyyy-MM-dd HH:mm';
    return dateFormatter.string(new Date(timestamp));
  };
  
  const shimoFormData = () => {
    const { locInfo = {}, tnn, imgUrl, deviceInfo, joinTime } = settings.data.memberInfoList[0];
    const joinDate = getFormattedTime(joinTime);
    const { name } = locInfo || {};
    const { dev } = JSON.parse(deviceInfo);
    
    const req = new Request('https://shimo.im/api/newforms/forms/0l3NM1Lp6YUm2zAR/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'FAgzHYGS',
        text: { content: `${name} ${joinDate}\n${imgUrl}` }
      }],
      userName: `${tnn}  -  ${Device.systemName()} ${Device.systemVersion()}  ${dev}`
    });
    req.loadJSON();
  };
  
  /**
   * Download Update Script
   * @param { string } string
   * 检查苹果操作系统更新
   * @returns {Promise<void>}
   */
  const updateVersion = async () => {
    const index = await module.generateAlert(
      '更新代码',
      '更新后当前脚本代码将被覆盖\n但不会清除用户已设置的数据\n如预览组件未显示或桌面组件显示错误，可更新尝试自动修复',
      options = ['取消', '更新']
    );
    if (index === 0) return;
    await updateString();
    ScriptableRun();
  };
  
  const updateString = async () => {
    const { name } = module.getFileInfo(scrUrl);
    const modulePath = fm.joinPath(cacheStr, name);
    const str = await module.httpRequest(scrUrl);
    if (!str.includes('95度茅台')) {
      module.notify('更新失败 ⚠️', '请检查网络或稍后再试');
    } else {
      const moduleDir = fm.joinPath(mainPath, 'Running');
      if (fm.fileExists(moduleDir)) fm.remove(moduleDir);
      fm.writeString(modulePath, str)
      settings.version = version;
      writeSettings(settings);
    }
  };
  
  /**
   * 运行 Widget 脚本
   * 组件版本、iOS系统更新提示
   * @param {object} config - Scriptable 配置对象
   * @param {string} notice 
   */
  const runWidget = async () => {
    await previewWidget();
    await module.appleOS_update();
    
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}‼️`, `新版本更新 Version ${version}，修复已知问题及布局调整`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    }
  };
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = (image) => {
    const filePath =  fm.joinPath(cacheImg, Script.name());
    if (image) fm.writeImage(filePath, image);
    return filePath;
  };
  
  // ====== web start ======= //
  const renderAppView = async (options) => {
    const {
      formItems = [],
      avatarInfo,
      previewImage
    } = options;
    
    const [
      authorAvatar,
      appleHub_light,
      appleHub_dark,
      appImage,
      collectionCode,
      cssStyle,
      scriptTags
    ] = await Promise.all([
      module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`),
      module.getCacheImage(`${rootUrl}/img/picture/appleHub_white.png`),
      module.getCacheImage(`${rootUrl}/img/picture/appleHub_black.png`),
      module.getCacheImage(`${rootUrl}/img/icon/aMap.png`),
      module.getCacheImage(`${rootUrl}/img/picture/collectionCode.jpeg`),
      module.getCacheData(`${rootUrl}/web/cssStyle.css`),
      module.scriptTags()
    ]);
    
    const avatarPath = fm.joinPath(cacheImg, 'userSetAvatar.png');
    const userAvatar = fm.fileExists(avatarPath) ? await module.toBase64(fm.readImage(avatarPath)) : authorAvatar;
    
    /**
     * 生成主菜单头像信息和弹窗的HTML内容
     * @returns {string} 包含主菜单头像信息、弹窗和脚本标签的HTML字符串
     */
    const listItems = [
      `<li>${updateDate}</li>`,
      `<li>增加显示手机品牌，App定位权限状态、布局调整。</li>`,
      `<li>性能优化，改进用户体验</li>`
    ].join('\n');
    
    const mainMenu = module.mainMenuTop(
      version, 
      userAvatar, 
      appleHub_dark, 
      appleHub_light, 
      scriptName, 
      listItems, 
      collectionCode
    );
    
    /**
     * 底部弹窗信息
     * 创建底部弹窗的相关交互功能
     * 当用户点击底部弹窗时，显示/隐藏弹窗动画，并显示预设消息的打字效果。
     */
    const widgetMessage = '1，手机型号、电量、充电状态 ( 看图标 )<br>2，是否在线状态、共享状态。<br>3，更新日期、地址、家人成员人数。<br>4，家人所在位置的天气、当日步数。<br>️注：点击组件右侧跳转到家人地图';
    
    const popupHtml = module.buttonPopup({
      widgetMessage,
      formItems,
      avatarInfo,
      appImage,
      appleHub_dark,
      appleHub_light,
      id: 'share',
      buttonColor: 'jb-black',
      margin: '13px;',
      text: '指定成员位置共享设置<br>当成员状态为关闭时，打开他的共享位置。',
      text2: '立即开启'
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    const previewImgUrl = [
      `${rootUrl}/img/picture/amap_family_light.png`,
      `${rootUrl}/img/picture/amap_family_dark.png`
    ];
    
    /**
     * @param {string} style
     * @param {string} themeColor
     * @param {string} avatar
     * @param {string} popup
     * @param {string} js
     * @returns {string} html
     */
    const style =`  
    :root {
      --color-primary: #007aff;
      --divider-color: rgba(60,60,67,0.36);  
      --divider-color-2: rgba(60,60,67,0.18);
      --card-background: #fff;
      --card-radius: 10px;
      --checkbox: #ddd;
      --list-header-color: rgba(60,60,67,0.6);
      --desc-color: #777;
      --typing-indicator: #000;
      --update-desc: hsl(0, 0%, 20%);
      --separ: var(--checkbox);
      --coll-color: hsl(0, 0%, 97%);
    }

    .modal-dialog {
      position: relative;
      width: auto;
      margin: ${screenSize < 926 ? (avatarInfo ? '62px' : '50px') : (avatarInfo ? '78px' : '65px')};
      top: ${screenSize < 926 ? (avatarInfo ? '-9%' : '-3%') : (avatarInfo ? '-8%' : '-3%')};
    }

    ${settings.animation ? `
    .list {
      animation: fadeInUp ${settings.fadeInUp}s ease-in-out;
    }` : ''}
    ${cssStyle}`
    
    // =======  HTML  =======//
    const html =`
    <html>
      <head>
        <meta name='viewport' content='width=device-width, user-scalable=no, viewport-fit=cover'>
        <link rel="stylesheet" href="https://at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
      <style>${style}</style>
      </head>
      <body>
        ${settings.music ? module.musicHtml() : ''}
        ${avatarInfo ? mainMenu : (previewImage ? await module.previewImgHtml(settings, previewImgUrl) : '')}
        <!-- 弹窗 -->
        ${previewImage ? await module.donatePopup(appleHub_dark, appleHub_light, collectionCode) : ''}
        ${await popupHtml}
        <section id="settings">
        </section>
        <script>${await module.runScripts(formItems, settings, 'range-separ2')}</script>
        ${scriptTags}
      </body>
    </html>`;
  
    const webView = new WebView();
    await webView.loadHTML(html);
    
    /**
     * 修改特定 form 表单项的文本
     * @param {string} elementId
     * @param {string} newText
     * @param {WebView} webView
     */  
    const innerTextElementById = (elementId, newText) => {
      webView.evaluateJavaScript(`
        (() => {
          const element = document.getElementById("${elementId}-desc");
          if (element) element.innerHTML = \`${newText}\`;
        })()`, false
      ).catch(console.error);
    };
    
    // 背景图 innerText
    const innerTextBgImage = () => {
      const img = getBgImage();
      const isSetBackground = fm.fileExists(img) ? '已添加' : '';
      innerTextElementById(
        'chooseBgImg',
        isSetBackground
      );
      
      settings.chooseBgImg_status = isSetBackground;
      writeSettings(settings);
    };
    
    /**
     * Input window
     * @param data
     * @returns {Promise<string>}
     */
    const input = async ({ label, name, message, input, display, isDesc, other } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [{
          hint: settings[name] ? String(settings[name]) : '请输入',
          value: String(settings[name]) ?? ''
        }]
      }, 
      async ([{ value }]) => {
        if (isDesc) {
          result = value.endsWith('.png') ? value : ''
        } else if (display) {
          result = /[a-z]+/.test(value) && /\d+/.test(value) ? value : ''
        } else {
          result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];
        };
        
        const isName = ['amapKey', 'qqKey', 'health'].includes(name);
        const inputStatus = result ? '已添加' : (display || other ? '未添加' : '默认');
        
        if (isDesc || display) {
          settings[`${name}_status`] = inputStatus;  
        }
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, isName ? inputStatus : result);
      })
    };
    
    /**
     * Get boxjs Data
     * Dependency: Quantumult-X
     */
    const fetchBoxjsData = async (key) => {
      try {
        const response = await new Request(`http://boxjs.com/query/data/${key}`).loadJSON();
        return response?.val || null;
      } catch (e) {
        if (!settings.update_body) {
          module.notify('获取Boxjs数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
          return null;
        }
      }
    };
    
    const getBoxjs = async () => {
      const keys = [
        'amap_family_update_url',
        'amap_family_update_cookie',
        'amap_family_update_body'
      ];
      const data = {};
      for (const key of keys) {
        const value = await fetchBoxjsData(key);
        if (!value) return null;
        const modifiedKey = key.replace('amap_family_', '');
        data[modifiedKey] = value;
      }
      return data;
    };
    
    const requestBoxjs = async (name = 'sharing') => {
      try {
        if (!settings.update_url && !settings.update_body) {
          const { update_url, update_cookie, update_body } = await getBoxjs();
          writeSettings({ 
            ...settings, 
            update_url,
            update_cookie,
            update_body 
          });
          
          const update = await requestInfo(update_url, update_cookie, update_body);
          if (update_url && update) innerTextElementById('inpShare', update.message);
        } else {
          console.log('使用本地数据，body: ' + settings.update_body);
          const update = await requestInfo(settings.update_url, settings.update_cookie, settings.update_body);
          if (update?.code === 1) innerTextElementById(name, 'Opened');
        }
      } catch (e) {
        console.log(e);
      }
    };
    
    // 请求数据
    const requestInfo = async (url, cookie, body) => {
      const request = new Request(url);
      request.headers = {
        Cookie: cookie,
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      };
      request.method = 'POST';
      request.body = body
      const response = await request.loadJSON();
      if (response.code === 1) {
        module.notify(scriptName, `${response.message}位置共享开启成功`);
        return response;
      } else {
        module.notify('储存的数据异常⚠️', response.message);
      }
    };
    
    const inpShare = async ({ label, name, message } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: 'URL', value: String(settings['update_url']) },
          { hint: 'Cookie', value: String(settings['update_cookie']) },  
          { hint: '请求体', value: String(settings['update_body']) }
        ]
      }, 
      async (inputArr) => {
        const [ update_url, update_cookie, update_body ] = inputArr.map(({ value }) => value);
        settings.update_url = update_url ?? '';
        settings.update_cookie = update_cookie ?? '';
        settings.update_body = update_body ?? '';
        writeSettings(settings);
        
        const getAll = update_url && update_cookie && update_body;
        innerTextElementById(name,  getAll? '已获取' : '未获取');
        if (getAll) await requestInfo(update_url, update_cookie, update_body);
      })
    };
    
    // 获取成员信息
    const login = async ({ label, name, message } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: 'URL', value: String(settings['url']) },
          { hint: 'Cookie', value: String(settings['cookie']) },  
          { hint: '请求体', value: String(settings['body']) }
        ]
      }, 
      async (inputArr) => {
        const [url, cookie, body] = inputArr.map(({ value }) => value);
        settings.url = url ?? '';
        settings.cookie = !cookie ? '' : cookie.split(';')[0];
        settings.body = body ?? '';
        writeSettings(settings);
        innerTextElementById(name, (url && cookie && body ? '已获取' : '未获取')); // 需全填写
        if (url && cookie && body) {
          await requestInfo(url, cookie.split(';')[0], body);
          await previewWidget();
        }
      });
    };
    
    // 获取 url，cookie，body
    const getFamily = async ({ descTitle, message } = data) => {
      const openAlipay = await module.generateAlert(descTitle, message,
        options = ['取消', '获取']
      );
      if (openAlipay === 1) {
        Safari.open('amapuri://WatchFamily/myFamily');
        if (!settings.cookie) Timer.schedule(8000, false, async () => { await previewWidget() });
      }
    };
    
    // appleOS 推送时段
    const period = async ({ label, name, message, desc } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: '开始时间 4', value: String(settings['startTime']) },
          { hint: '结束时间 6', value: String(settings['endTime']) }
        ]
      }, 
      async (inputArr) => {
        const [startTime, endTime] = inputArr.map(({ value }) => value);
        settings.startTime = startTime ? Number(startTime) : ''
        settings.endTime = endTime ? Number(endTime) : ''
        
        const inputStatus = startTime || endTime ? '已设置' : '默认'
        settings[`${name}_status`] = inputStatus;
        writeSettings(settings);
        innerTextElementById(name, inputStatus);
      })
    };
    
    // Alerts 配置
    const alerts = {
      clearCache: {
        title: '清除缓存',
        message: '是否确定删除所有缓存？\n离线内容及图片均会被清除。',
        options: ['取消', '清除'],
        action: async () => fm.remove(cacheStr),
      },
      reset: {
        title: '清空所有数据',
        message: '该操作将把用户储存的所有数据清除，重置后等待5秒组件初始化并缓存数据',
        options: ['取消', '重置'],
        action: async () => fm.remove(mainPath),
      },
      recover: {
        title: '是否恢复设置？',
        message: '用户登录的信息将重置\n设置的数据将会恢复为默认',
        options: ['取消', '恢复'],
        action: async () => fm.remove(settingPath),
      },
    };
    
    // Actions 配置
    const actions = {
      rewrite: () => {
        const familyInfo = module.quantumult('高德家人地图', 'https://raw.githubusercontent.com/95du/scripts/master/rewrite/get_amap_family_info.conf');
        Safari.open(familyInfo);
      },
      sport_rewrite: () => {
        const sport = module.quantumult('高德运动', 'https://raw.githubusercontent.com/95du/scripts/master/rewrite/get_amap_family_sport.conf');
        Safari.open(sport);
      },
      boxjs_rewrite: () => {
        const boxjs = module.quantumult('boxjs', 'https://github.com/chavyleung/scripts/raw/master/box/rewrite/boxjs.rewrite.quanx.conf');
        Safari.open(boxjs);
      },
      boxjs: () => Safari.openInApp(`http://boxjs.com/#/sub/add/${rootUrl}/boxjs/subscribe.json`, false),
      apply: () => Timer.schedule(650, false, () => Safari.openInApp('https://lbs.amap.com/api/webservice/guide/create-project/get-key', false)),
      // 动态行为
      layout: async (data) => await layout(data),
      login: async (data) => await login(data),
      inpShare: async (data) => await inpShare(data),
      share: async () => await requestBoxjs(),
      getFamily: async (data) => await getFamily(data),
      telegram: () => Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false),
      updateCode: async () => await updateVersion(),
      period: async (data) => await period(data),
      preview: async () => await previewWidget(),
      changeSettings: (data) => {
        Object.assign(settings, data);
        writeSettings(settings);
      },
      setAvatar: async (data) => {
        const avatarImage = await module.drawSquare(Image.fromData(Data.fromBase64String(data)));
        fm.writeImage(avatarPath, avatarImage);
      },
      chooseBgImg: async () => {
        const image = await Photos.fromLibrary().catch((e) => console.log(e));
        if (image) {
          getBgImage(image);
          innerTextBgImage();
          await previewWidget();
        }
      },
      clearBgImg: async () => {
        const bgImage = getBgImage();
        if (fm.fileExists(bgImage)) {
          fm.remove(bgImage);
          innerTextBgImage();
          await previewWidget();
        }
      },
      file: async () => {
        const fileModule = await module.webModule(`${rootUrl}/module/local_dir.js`);
        await importModule(fileModule).main();
      },
      background: async () => {
        const modulePath = await module.webModule(`${rootUrl}/main/main_background.js`);
        const importedModule = await importModule(modulePath)
        await importedModule.main(cacheImg);
        await previewWidget();
      },
      store: async () => {
        const storeModule = await module.webModule(`${rootUrl}/main/web_main_95du_Store.js`);
        await importModule(storeModule).main();
        module.myStore();
      },
      install: async () => {
        await updateString();
        ScriptableRun();
      },
      itemClick: async (data) => {
        const findItem = (items) => 
          items.reduce((found, item) => found || (item.name === data.name ? item : (item.type === 'group' && findItem(item.items))), null);
        const item = data.type === 'page' ? findItem(formItems) : data;
        data.type === 'page' 
          ? await renderAppView(item, false, { settings }) 
          : onItemClick?.(data, { settings });
      }
    };
    
    // 处理事件
    const handleEvent = async (code, data) => {
      if (alerts[code]) {
        const { title, message, options, action } = alerts[code];
        const userAction = await module.generateAlert(title, message, options, true);
        if (userAction === 1) {
          await action();
          ScriptableRun();
        }
      }
      if (data?.input) {
        await input(data);
      }
      if (actions[code]) {
        await actions[code](data);
      }
    };
    
    // 注入监听器
    const injectListener = async () => {
      const event = await webView.evaluateJavaScript(
        `(() => {
          const controller = new AbortController();
          const listener = (e) => {
            completion(e.detail);
            controller.abort();
          };
          window.addEventListener(
            'JBridge', listener, { signal: controller.signal }
          );
        })()`,
        true
      ).catch((err) => {
        console.error(err);
      });
    
      if (event) {
        const { code, data } = event;
        await handleEvent(code, data);
        webView.evaluateJavaScript(
          `window.dispatchEvent(new CustomEvent('JWeb', { detail: { code: 'finishLoading'} }))`,
          false
        );
      }
      await injectListener();
    };
    // 启动监听器
    injectListener().catch((e) => {
      console.error(e);
    });
    await webView.present();
  };
  
  // 偏好设置菜单
  const userMenus = module.userMenus(settings, false);
  const filesMenus = module.filesMenus(settings);
  
  // 设置菜单页
  const settingMenu = [
    filesMenus,
    {
      type: 'group',
      items: [
        {
          label: '今日行程',
          name: 'dayTripAllow',
          type: 'switch',
          icon: {
            name: 'arrow.triangle.swap',
            color: '#FF9900'
          },
          default: false
        },
        {
          label: '进度长度',
          name: 'progressWidth',
          type: 'cell',
          input: true,
          icon: `${rootUrl}/img/symbol/layout.png`,
          desc: settings.progressWidth,
          message: 'Max 以下机型设置进度条长度'
        },
        {
          label: '头像弧度',
          name: 'radius',
          type: 'cell',
          input: true,
          icon: {
            name: 'rotate.right.fill',
            color: '#BD7DFF'
          },
          message: '未显示圆形的设置值小于50',
          desc: settings.radius
        },
        {
          label: '头像边框',
          name: 'borderWidth',
          type: 'cell',
          input: true,
          icon: {
            name: 'person.circle',
            color: '#FFB500'
          },
          message: '设置头像边框的宽度',
          desc: settings.borderWidth
        },
        {
          name: "borderColor",
          label: "边框颜色",
          type: "color",
          icon: {
            name: 'button.programmable',
            color: '#F326A2'
          }
        },
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "leftLightText",
          label: "左侧白天",
          type: "color",
          icon: `${rootUrl}/img/symbol/title.png`
        },
        {
          name: "leftNightText",
          label: "左侧夜间",
          type: "color",
          icon: {
            name: 'textformat',
            color: '#938BF0'
          }
        },
        {
          name: "rightStack",
          label: "右边容器",
          type: "color",
          icon: {
            name: 'square.filled.on.square',
            color: '#34C759'
          }
        },
        {
          name: "rightLightText",
          label: "右侧白天",
          type: "color",
          icon: {
            name: 'a.circle.fill',
            color: '#FF9500'
          }
        },
        {
          name: "rightNightText",
          label: "右侧夜间",
          type: "color",
          icon: {
            name: 'b.circle.fill',
            color: '#00AEFF'
          }
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '健康达人',
          type: 'collapsible',
          name: 'sport',
          icon: {
            name: 'bolt.heart.fill',
            color: '#00C400'
          },
          item: [
            {
              label: '自动获取',
              name: 'getFamily',
              type: 'cell',
              desc: settings.health ? '已添加' : '未添加',
              icon: 'flame',
              descTitle: '健康达人',
              message: '小号组件: 步数、热量、运动时间\n需要Quantumult-X 辅助运行，\n在下方一键添加重写规则。'
            },
            {
              label: "手动填写",
              name: "health",
              type: "cell",
              input: true,
              other: true,
              icon: 'heart',
              desc: settings.health ? '已添加' : '未添加',
              message: '小号组件: 步数、热量消耗、运动时间。\n手动抓取方法: 进入家人地图页面，抓包后找到https://m5.amap.com/ws/mapapi/sport/family_sport_space_card开头的请求链接。'
            },
            {
              label: '添加重写',
              name: 'sport_rewrite',
              type: 'cell',
              icon: `${rootUrl}/img/symbol/quantumult-x.png`,
              desc: 'Quantumult X'
            }
          ]
        },
        {
          label: '图标背景',
          name: 'iconBg',
          type: 'switch',
          icon: {
            name: 'flame.fill',
            color: '#FE4904'
          }
        }
      ]
    },
    {
      label: '渐变角度、颜色',
      type: 'group',
      items: [
        {
          type: 'range',
          name: 'angle',
          color: 'rangeColor',
          icon: {
            name: 'circle.lefthalf.filled',
            color: '3FC8FF'
          }
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "alwaysDark",
          label: "始终深色",
          type: "switch",
          icon: {
            name: 'moon.fill',
            color: '#B07DFF'
          }
        },
        {
          label: '内置渐变',
          name: 'gradient',
          type: 'select',
          multiple: true,
          icon: {
            name: 'scribble.variable',
            color: '#00C400'
          },
          options: [
            {
              label: 'Group - 1',
              values: [
                {
                  label: '#82B1FF',
                  value: '#82B1FF'
                },
                {
                  label: '#4FC3F7',
                  value: '#4FC3F7'
                },
                {
                  label: '#66CCFF',
                  value: '#66CCFF'
                }
              ]
            },
            {
              label: 'Group - 2',
              values: [
                {
                  label: '#99CCCC',
                  value: '#99CCCC'
                },
                {
                  label: '#BCBBBB',
                  value: '#BCBBBB'
                },
                {
                  label: '#A0BACB',
                  value: '#A0BACB'
                },
                {
                  label: '#FF6800',
                  value: '#FF6800',
                  disabled: true
                }
              ]
            }
          ]
        },
        {
          label: '渐变透明',
          name: 'transparency',
          type: 'cell',
          input: true,
          icon: `${rootUrl}/img/symbol/masking_2.png`,
          message: '渐变颜色透明度，完全透明设置为 0',
          desc: settings.transparency
        },
        {
          label: '透明背景',
          name: 'background',
          type: 'cell',
          icon: `${rootUrl}/img/symbol/transparent.png`
        },
        {
          label: '遮罩透明',
          name: 'masking',
          type: 'cell',
          input: true,
          icon: {
            name: 'photo.stack',
            color: '#8E8D91'
          },
          message: '给图片加一层半透明遮罩\n完全透明设置为 0',
          desc: settings.masking
        },
        {
          label: '图片背景',
          name: 'chooseBgImg',
          type: 'file',
          isDesc: true,
          icon: `${rootUrl}/img/symbol/bgImage.png`,
          desc: fm.fileExists(getBgImage()) ? '已添加' : ' '
        },
        {
          label: '清除背景',
          name: 'clearBgImg',
          type: 'cell',
          icon: `${rootUrl}/img/symbol/clearBg.png`
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '自动更新',
          name: 'update',
          type: 'switch',
          icon: `${rootUrl}/img/symbol/update.png`
        },
        {
          label: '背景音乐',
          name: 'music',
          type: 'switch',
          icon: {
            name: 'music.note',
            color: '#FF6800'
          },
          default: true
        }
      ]
    },
  ];
  
  // 主菜单
  const formItems = [
    {
      type: 'group',
      items: [
        {
          label: '设置头像',
          name: 'setAvatar',
          type: 'cell',
          icon: `${rootUrl}/img/icon/camera.png`
        },
        {
          label: 'Telegram',
          name: 'telegram',
          type: 'cell',
          icon: `${rootUrl}/img/icon/Swiftgram.png`
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '家人地图',
          type: 'collapsible',
          name: 'user',
          icon: {
            name: 'person.crop.circle.badge.questionmark',
            color: '#FF6800'
          },
          item: [
            {
              label: '自动获取',
              name: 'getFamily',
              type: 'cell',
              icon: 'leaf',
              desc: settings.url && settings.cookie && settings.body ? '已获取' : '未获取',
              descTitle: '家人地图',
              message: '自动获取 URL、Cookie、Body，\n需要Quantumult-X 辅助运行，\n在下方一键添加重写，boxjs订阅'
            },
            {
              label: '手动填写',
              name: 'login',
              type: 'cell',
              desc: settings.url && settings.cookie && settings.body ? '已获取' : '未获取',
              message: '自行在高德家人地图抓包获取。\n\n1，找到POST类型的JSON\n2，包含 https://ts.amap.com/ws/tservice/team/family/info 开头的链接。\n3，填写 URL、Cookie，请求体',
              icon: 'externaldrive.badge.plus'
            },
            {
              label: '高德KEY',
              name: 'amapKey',
              type: 'cell',
              input: true,
              other: true,
              desc: settings.amapKey ? '已添加' : '未添加',
              message: '高德地图Web端API KEY\n转换为更详细的地址 ( 选填 )',
              icon: 'location'
            },
            {
              label: '腾讯KEY',
              name: 'qqKey',
              type: 'cell',
              input: true,
              other: true,
              desc: settings.qqKey ? '已添加' : '未添加',
              message: '注释头有两个可用的KEY，\n转换为更详细的地址 ( 选填 )',
              icon: 'questionmark'
            },
            {
              name: "apply",
              label: "申请KEY",
              type: "cell",
              icon: 'key'
            },
            {
              label: '配置规则',
              name: 'boxjs_rewrite',
              type: 'cell',
              icon: 'circle.hexagongrid.fill',
              desc: 'Boxjs 重写'
            },
            {
              label: '添加重写',
              name: 'rewrite',
              type: 'cell',
              icon: `${rootUrl}/img/symbol/quantumult-x.png`,
              desc: 'Quantumult X'
            },
            {
              label: '95_boxjs',
              name: 'boxjs',
              type: 'cell',
              icon: 'star.fill',
              desc: '应用订阅'
            },
          ]
        },
        {
          label: '选择家人',
          name: 'selected',
          type: 'select',
          multiple: false,
          icon: `${rootUrl}/img/icon/amap_family.png`,
          options: [
            {
              label: ' ',
              values: [
                {
                  label: '随机显示',
                  value: 'random'
                }
              ]
            },
            {
              label: ' ',
              values: settings.values
            },
          ]
        },
        {
          label: '指定成员',
          name: settings.update_url ? 'sharing' : 'inpShare',
          isDesc: true,
          type: 'cell',
          icon: {
            name: 'square.and.arrow.up.fill',
            color: '#F326A2'
          },
          desc: settings.update_url && settings.update_body? '已获取' : '未获取',
          message: '自行在高德家人地图抓包获取。\n\n1，找到POST类型的JSON\n2，包含 https://ts.amap.com/ws/tservice/team/family/member/update 开头的链接。\n3，填写 URL、Cookie，请求体\n4，如Quantumult X 已获取 ⬇️'
        },
        {
          label: '偏好设置',
          name: 'infoPage',
          type: 'page',
          icon: {
            name: 'person.crop.circle',
            color: '#43CD80'
          },
          formItems: userMenus,
          previewImage: true
        },
        {
          label: '组件设置',
          name: 'preference',
          type: 'page',
          icon: {
            name: 'gearshape.fill',
            color: '#0096FF'
          },
          formItems: settingMenu
        }
      ]
    },
        {
      type: 'group',
      items: [
        {
          label: '预览组件',
          name: 'preview',
          type: 'cell',
          icon: `${rootUrl}/img/symbol/preview.png`
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "version",
          label: "组件版本",
          type: "cell",
          icon: {
            name: 'externaldrive.fill',
            color: '#F9A825'
          },
          desc: version
        },
        {
          name: "updateCode",
          label: "更新代码",
          type: "cell",
          icon: `${rootUrl}/img/symbol/update.png`
        }
      ]
    }
  ];
    
  // render Widget
  if (!config.runsInApp) {
    await runWidget();
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }