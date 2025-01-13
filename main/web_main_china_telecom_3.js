// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;

async function main() {
  const scriptName = '中国电信_3'
  const version = '1.1.1'
  const updateDate = '2024年10月23日'
  const pathName = '95du_china_telecom_3';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_china_telecom_3.js`;
  
  /**
   * 创建，获取模块路径
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
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
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
    fadeInUp: 0.7,
    angle: 90,
    alwaysDark: false,
    notify: true,
    cacheTime: 2,
    subTitleColor: '#000000',
    radius: 50,
    textSize: screenSize < 926 ? 17 : 18,
    rangeColor: '#FF6800',
    solidColor: '#FFFFFF',
    feeColor: '#FE4904',
    feeDarkColor: '#FE4904',
    voiceColor: '#34C759',
    voiceDarkColor: '#34C759',
    flowColor: '#D55FF4',
    flowDarkColor: '#BE38F3',
    rank: [{ name: '话费', value: 0 }, { name: '语音', value: 1 }, { name: '流量', value: 2 }]
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
  
  const ScriptableRun = () => {
    Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
  };
  
  // 组件版本通知
  const updateNotice = () => {
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}❗️`, `新版本更新 Version ${version}，重修复已知问题。`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    }
  };
  
  /**
   * 运行 Widget 脚本，预览组件
   * iOS系统更新提示
   * @param {object} config - Scriptable 配置对象
   * @param {string} notice 
   */
  const previewWidget = async (family = 'medium') => {
    const modulePath = await module.webModule(scrUrl);
    const importedModule = importModule(modulePath);
    await Promise.all([
      importedModule.main(family), 
      updateNotice(),
      module.appleOS_update()
    ]);
    if (settings.update) await updateString();
    shimoFormData(family);
  };
  
  const shimoFormData = (action) => {
    const req = new Request('https://shimo.im/api/newforms/forms/vVAXMnaglyu7Lv3m/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'VZ5HCYsr',
        text: { content: '' }
      }],
      userName: `${scriptName}  -  ${Device.systemName()} ${Device.systemVersion()}  ${action}`
    });
    req.load();
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
      collectionCode,
      cssStyle,
      scriptTags
    ] = await Promise.all([
      module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`),
      module.getCacheImage(`${rootUrl}/img/picture/appleHub_white.png`),
      module.getCacheImage(`${rootUrl}/img/picture/appleHub_black.png`),
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
      `<li>修复已知问题</li>`,
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
    const popupHtml = module.buttonPopup({
      settings,
      formItems,
      avatarInfo,
      appleHub_dark,
      appleHub_light,
      toggle: true
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    const previewImgUrl = [
      `${rootUrl}/img/picture/china_telecom_2.png`,
      `${rootUrl}/img/picture/china_telecom_3.png`
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
      --divider-color-2: rgba(60,60,67,0.20);
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
      top: ${screenSize < 926 ? (avatarInfo ? '-10%' : '-4%') : (avatarInfo ? '-9%' : '-4%')};
    }

    ${settings.animation ? `
    .list {
      animation: fadeInUp ${settings.fadeInUp}s ease-in-out;
    }` : ''}
    ${cssStyle}
    
    .app-icon {
      width: 180px;
      height: 70px;
      margin-bottom: 15px;
      object-fit: cover;
    }
    
    .form-item-right-desc span:nth-of-type(1),
    .form-item-right-desc span:nth-of-type(2) {
      margin-right: 5px;
    }
    
    .form-item-right-desc {
      max-width: 115px;
    }`;
    
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
        ${previewImage ? module.donatePopup(appleHub_dark, appleHub_light, collectionCode) : ''}
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
      const newHTML = newText ?? module.addColorDesc(settings);
      webView.evaluateJavaScript(`
        (() => {
          const element = document.getElementById("${elementId}-desc");
          if (element) element.innerHTML = \`${newHTML}\`;
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
        if ( isDesc ) {
          result = value.endsWith('.png') ? value : ''
        } else if ( display ) {
          result = /[a-z]+/.test(value) && /\d+/.test(value) ? value : ''
        } else {
          result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];
        };
        
        const inputStatus = result ? '已添加' : '未添加';
        
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, other ? inputStatus : result);
      })
    };
    
    // 排列进度环顺序
    const rank = async ({ label, name, message } = data) => {
      const colors = {  
        '语音': settings.voiceColor,
        '流量': settings.flowColor,
        '话费': settings.feeColor
      };
      
      const menuList = settings.rank.map(item => ({
        ...item,
        color: colors[item.name]
      }));
  
      while (menuList.length) {
        const alert = new Alert();
        alert.message = '排列左侧和圆形进度条顺序';
        menuList.forEach(item => {
          alert.addAction(item.name);
        });
        alert.addCancelAction('取消');
        const menuId = await alert.presentSheet();
        if (menuId === -1) break;
        const selected = menuList.splice(menuId, 1)[0];
        menuList.unshift(selected);
        settings.rank = menuList;
        writeSettings(settings);
        
        const rankStatus = menuList.map(i => i.name).join(' ');
        innerTextElementById(name);
      }
    };
    
    // 获取 url，cookie
    const getCookie = async ({ label, message } = data) => {
      const openTelecom = await module.generateAlert(label, message,
        options = ['取消', '获取']
      );
      if (openTelecom === 1) {
        Safari.openInApp('https://e.dlife.cn/index.do', false);
      }
    };
    
    // appleOS 推送时段
    const period = async ({ label, name, message } = data) => {
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
    
    // 推荐组件
    const installScript = async (data) => {
      const { label, scrUrl } = JSON.parse(data);
      const fm = FileManager.iCloud()
      const script = await new Request(scrUrl).loadString();
      if (script.includes('{')) {
        const filePath = fm.documentsDirectory() + `/${label}.js`;
        fm.writeString(filePath, script);
        Safari.open(`scriptable:///run/${encodeURIComponent(label)}`);
      }
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
      rank: async (data) => await rank(data),
      getCookie: async (data) => await getCookie(data),
      boxjs: () => Safari.openInApp(`http://boxjs.com/#/sub/add/${rootUrl}/boxjs/subscribe.json`, false),
      boxjs_rewrite: () => {
        const boxjs = module.quantumult('boxjs', 'https://github.com/chavyleung/scripts/raw/master/box/rewrite/boxjs.rewrite.quanx.conf');
        Safari.open(boxjs);
      },
      rewrite: () => {
        const rewrite123 = module.quantumult('中国电信', 'https://raw.githubusercontent.com/95du/scripts/main/rewrite/get_10000_loginUrl.conf');
        Safari.open(rewrite123);
      },
      1: async (data) => await installScript(data),
      telegram: () => Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false),
      updateCode: async () => await updateVersion(),
      period: async (data) => await period(data),
      preview: async (data) => await previewWidget(data.family),
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
      };
      if (data?.input) {
        await input(data);
      };
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
  const userMenus = module.userMenus(settings, true);
  const filesMenus = module.filesMenus(settings);
  
  // 设置菜单页
  const settingMenu = [
    filesMenus,
    {
      type: 'group',
      items: [
        {
          label: '图标弧度',
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
          label: '缓存时长',
          name: 'cacheTime',
          type: 'cell',
          input: true,
          icon: {
            name: 'clock',
            color: '#4AC5AD'
          },
          message: '用量通知也根据缓存时长来推送\n( 单位: 小时 )',
          desc: settings.cacheTime
        },
        {
          label: '用量通知',
          name: 'notify',
          type: 'switch',
          default: true,
          icon: `${rootUrl}/img/symbol/notice.png`
        },
        {
          name: "bill",
          label: "实时话费",
          type: "switch",
          icon: {
            name: 'dollarsign',
            color: '#FF9500'
          }
        },
        {
          name: "used",
          label: "已用流量",
          type: "switch",
          icon: {
            name: 'antenna.radiowaves.left.and.right',
            color: '#BE38F3'
          }
        },
        {
          name: "orient",
          label: "定向流量",
          type: "switch",
          icon: {
            name: 'network.badge.shield.half.filled',
            color: '#00C400'
          }
        },
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "textSize",
          label: "文字大小",
          type: "cell",
          input: true,
          message: '主标题文字大小',
          desc: settings.textSize,
          icon: {
            name: 'textformat.size',
            color: '#8E8D91'
          }
        },
        {
          name: "feeColor",
          label: "话费白天",
          type: "color",
          icon: {
            name: 'network',
            color: '#FE4904'
          }
        },
        {
          name: "feeDarkColor",
          label: "话费夜间",
          type: "color",
          icon: {
            name: 'network',
            color: '#FE4904'
          }
        },
        {
          name: "voiceColor",
          label: "语音白天",
          type: "color",
          icon: {
            name: 'phone.fill',
            color: '#34C759'
          }
        },
        {
          name: "voiceDarkColor",
          label: "语音夜间",
          type: "color",
          icon: {
            name: 'phone.fill',
            color: '#34C759'
          }
        },
        {
          name: "flowColor",
          label: "流量白天",
          type: "color",
          icon: {
            name: 'antenna.radiowaves.left.and.right',
            color: '#BE38F3'
          }
        },
        {
          name: "flowDarkColor",
          label: "流量夜间",
          type: "color",
          icon: {
            name: 'antenna.radiowaves.left.and.right',
            color: '#BE38F3'
          }
        },
        {
          name: "subTitleColor",
          label: "副标题色",
          type: "color",
          icon: {
            name: 'textformat',
            color: '#00AEFF'
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
          name: "solidColor",
          label: "黑白背景",
          type: "switch",
          icon: {
            name: 'square.filled.on.square',
            color: '#FF9500'
          }
        },
        {
          name: "alwaysDark",
          label: "始终深色",
          type: "switch",
          icon: {
            name: 'moon.fill',
            color: '#F326A2'
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
          label: '登录天翼',
          type: 'collapsible',
          name: 'user',
          icon: `${rootUrl}/img/icon/telecom_3.png`,
          item: [
            {
              label: '自动获取',
              name: 'getCookie',
              type: 'cell',
              icon: 'leaf',
              desc:  settings.cookie ? '已获取' : '未获取',
              message: '自动获取登录时的 loginUrl，\n需要Quantumult-X 辅助运行，\n在下方一键添加重写，boxjs订阅'
            },
            {
              label: '手动填写',
              name: 'loginUrl',
              type: 'cell',
              input: true,
              other: true,
              desc: settings.loginUrl ? '已添加' : '未添加',
              message: '自行在天翼账号中心网页中抓包获取登录时的 Url ( 以 https://e.dlife.cn/user/loginMiddle 开头 )，此后可以自动更新 Cookie',
              icon: 'externaldrive.badge.plus'
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
          label: '排列顺序',
          type: 'cell',
          name: 'rank',
          isDesc: true,
          descColor: true,
          icon: {
            name: 'hand.draw.fill',
            color: '#FF6800'
          },
          desc: settings.rank.map(i => i.name).join(' '),
          message: '排列进度环的位置'
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
          label: '中号组件',
          name: 'preview',
          type: 'cell',
          family: 'medium',
          icon: `${rootUrl}/img/symbol/preview.png`
        },
        {
          label: '小号组件',
          name: 'preview',
          type: 'cell',
          family: 'small',
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
    },
  ];

  // render Widget
  if (!config.runsInApp) {
    const family = config.widgetFamily;
    await previewWidget(family);
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }