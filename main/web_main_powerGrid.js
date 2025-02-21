// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bolt;

async function main() {
  const scriptName = '南方电网'
  const version = '1.2.3'
  const updateDate = '2025年01月07日'
  const pathName = '95du_powerGrid';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const scrUrl = `${rootUrl}/api/web_powerGrid.js`;
  
  /**
   * 创建，获取模块路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  if (!fm.fileExists(depPath)) fm.createDirectory(depPath);
  await download95duModule(rootUrl)
    .catch(err => console.log(err));
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
    gradient: [],
    update: true,
    topStyle: true,
    music: true,
    animation: true,
    appleOS: true,
    fadeInUp: 0.7,
    angle: 90,
    updateTime: Date.now(),
    solidColor: false,
    notify: true,
    textLightColor: '#000000',
    textDarkColor: '#FFFFFF',
    titleColor: '#000000',
    rangeColor: '#3F8BFF',
    progressWidth: screenSize < 926 ? 215 : 240,
    gap: screenSize < 926 ? 15 : 20,
    location: 1,
    radius: 50,
    avatar: `${rootUrl}/img/icon/zhuYuanZhang.jpeg`
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
    const req = new Request('https://shimo.im/api/newforms/forms/loqeM1Gad8IRNnqn/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'r5P8LWG5',
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
      `<li>增加用电类型，分档电价的收费标准，显示前天用电</li>`,
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
    const pictures = Array.from({ length: 2 }, (_, index) => `${rootUrl}/img/picture/powerGrid_${index}.png`);
    const previewImgUrl = [
      module.getRandomItem(pictures),
      `${rootUrl}/img/picture/powerGrid_2.png`
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
      --desc-color: #888;
      --typing-indicator: #000;
      --update-desc: hsl(0, 0%, 20%);
      --separ: var(--checkbox);
      --coll-color: hsl(0, 0%, 97%);
    }

    .modal-dialog {
      position: relative;
      width: auto;
      margin: ${screenSize < 926 ? (avatarInfo ? '62px' : '50px') : (avatarInfo ? '78px' : '65px')};
      top: ${screenSize < 926 ? (avatarInfo ? '-7%' : '-4%') : (avatarInfo ? '-6%' : '-4%')};
    }
    
    ${settings.animation ? `
    .list {
      animation: fadeInUp ${settings.fadeInUp}s ease-in-out;
    }` : ''}
    ${cssStyle}`;
    
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
    const input = async ({ label, name, message, other = false, desc } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [{
          hint: settings[name] ? String(settings[name]) : '请输入',
          value: String(settings[name]) ?? ''
        }]
      }, 
      async ([{ value }]) => {
        if (name === 'location') {
          result = value.match(/^0$|^1$/)[0] ? settings[name] = value : settings[name];
        } else {
          result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];
        };
        
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, result || desc);
      })
    };
          
    // 登录南网在线
    const userlogin = async ({ label, name } = data) => {
      const openAlert = await module.generateAlert('南网在线登录', `南方电网只包括海南、广东、广西、云南、贵州5个省份\n\n注: 使用小组件需要用户的 Token\n1，使用 Quantumult-X 自动获取。\n2，用户自行在App中抓包获取，在请求头部或响应头部拷贝x-auth-token的值。`,
        options = ['取消', '获取']
      );
      if ( openAlert === 1 ) {
        try {
          const boxjs = await new Request('http://boxjs.com/query/data/token_95598').loadJSON();
          token = boxjs.val;
        } catch (e) {
          token = ''
          module.notify('获取Token失败 ⚠️', '需打开 Quantumult-X 或手动抓包');
        };

        const input = await module.generateInputAlert({
          title: '输入 x-auth-token',
          options: [{
            hint: settings[name] ? String(settings[name]) : '请输入',
            value: token
          }]
        }, 
        async ([{ value }]) => {
          result = /^[a-zA-Z\d-]+$/.test(value) ? value : '';
        });
        
        if (input === 1 && result) {
          settings.token = result;
          writeSettings(settings);
          module.notify('登录成功', result);
          innerTextElementById(name, result ? '已登录' : '未登录');  
          await previewWidget();
        }
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
        settings.endTime = endTime ? Number(endTime) : '';
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
      1: async (data) => await installScript(data),
      telegram: () => Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false),
      setAvatar: async (data) => {
        const avatarImage = await module.drawSquare(Image.fromData(Data.fromBase64String(data)));
        fm.writeImage(avatarPath, avatarImage);
      },
      install: async () => {
        await updateString();
        ScriptableRun();
      },
      updateCode: async () => updateVersion(),
      changeSettings: (data) => {
        Object.assign(settings, data);
        writeSettings(settings);
      },
      token: async (data) => userlogin(data),
      period: async (data) => period(data),
      preview: async (data) => previewWidget(data.family),
      chooseBgImg: async () => {
        const image = await Photos.fromLibrary();
        getBgImage(image);
        innerTextBgImage();
        await previewWidget();
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
        await importModule(modulePath).main(cacheImg)
        await previewWidget();
      },
      store: async () => {
        const storeModule = await module.webModule(`${rootUrl}/main/web_main_95du_Store.js`);
        await importModule(storeModule).main();
        module.myStore();
      },
      itemClick: async (data) => {
        const findItem = (items) => items.reduce((found, item) => found || (item.name === data.name ? item : (item.type === 'group' && findItem(item.items))), null);
        const item = data.type === 'page' ? findItem(formItems) : data;
        data.type === 'page' ? await renderAppView(item, false, { settings }) : onItemClick?.(data, { settings });
      },
    };
    
    // 处理事件
    const handleEvent = async (code, data) => {
      if (data?.input) {
        await input(data);
        return;
      }
    
      if (alerts[code]) {
        const { title, message, options, action } = alerts[code];
        const userAction = await module.generateAlert(title, message, options, true);
        if (userAction === 1) {
          await action();
          ScriptableRun();
        }
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
      await injectListener(); // 递归监听
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
  const backgroundMenus = module.backgroundMenus(settings, getBgImage());
  
  // 设置菜单页
  const settingMenu = [
    filesMenus,
    {
      type: 'group',
      items: [
        {
          label: '排列月份',
          name: 'column',
          type: 'cell',
          input: true,
          icon: {
            name: 'arrow.up.arrow.down',
            color: '#8C7CFF'
          },
          desc: settings.column,
          message: '输入 1 上月内容显示在顶部'
        },
        {
          label: '账单通知',
          name: 'notify',
          type: 'switch',
          default: true,
          icon: `${rootUrl}/img/symbol/notice.png`
        },
        {
          label: '显示前日',
          name: 'dayBefore',
          type: 'switch',
          icon: {
            name: 'hand.draw.fill',
            color: '#3FC8FF'
          }
        },
        {
          label: '显示图表',
          name: 'chart',
          type: 'switch',
          icon: {
            name: 'align.vertical.bottom.fill',
            color: '#FF4500'
          }
        },
        {
          label: '图表高度',
          name: 'chartHeight',
          type: 'cell',
          input: true,
          icon: {
            name: 'chart.bar.fill',
            color: '#0088F4'
          },
          message: '建议将值设置在 50 至 90 之间',
          desc: settings.chartHeight
        },
        {
          label: '修改头像',
          name: 'avatar',
          type: 'cell',
          input: true,
          other: true,
          icon: {
            name: 'person.crop.circle',
            color: '#43CD80'
          }
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
          message: 'iOS 16 系统以下设置值为 18\n即可显示圆形',
          desc: settings.radius
        },
        {
          label: '进度位置',
          name: 'location',
          type: 'cell',
          input: true,
          icon: {
            name: 'checklist',
            color: '#FF9500'
          },
          desc: settings.location,
          message: '0 进度条在中间，1 则在底部'
        },
        {
          label: '进度长度',
          name: 'progressWidth',
          type: 'cell',
          input: true,
          icon: `${rootUrl}/img/symbol/layout.png`,
          desc: settings.progressWidth,
          message: '收入/支出进度条长度'
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "textLightColor",
          label: "白天文字",
          type: "color",
          icon: `${rootUrl}/img/symbol/title.png`
        },
        {
          name: "textDarkColor",
          label: "夜间文字",
          type: "color",
          icon: {
            name: 'textformat',
            color: '#938BF0'
          }
        }
      ]
    },
    ...backgroundMenus
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
          label: '登录南网',
          name: 'token',
          type: 'cell',
          isDesc: true,
          icon: {
            name: 'bolt.fill',
            color: '#00C4B6'
          },
          message: '输入token',
          desc: settings.token ? '已登录' : '未登录'
        },
        {
          label: '电动汽车',
          name: 'mobile',
          type: 'cell',
          input: true,
          other: true,
          icon: {
            name: 'car',
            color: '#FF6800'
          },
          message: '输入电话号码，用于小号组件',
          desc: settings.mobile ? '已填写' : '未填写'
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
          desc: settings.version
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
    const family = config.widgetFamily;
    await previewWidget(family);
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }