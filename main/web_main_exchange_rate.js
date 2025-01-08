// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: sort-numeric-up;

async function main() {
  const scriptName = '人民币汇率'
  const version = '1.1.0'
  const updateDate = '2024年18月24日'
  const pathName = '95du_exchange_rate';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_exchange_rate.js`;

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
    ))
  };
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const DEFAULT = {
    version,
    refresh: 20,
    transparency: 0.5,
    masking: 0.3,
    gradient: [],
    update: true,
    music: true,
    animation: true,
    appleOS: true,
    fadeInUp: 0.7,
    angle: 90,
    updateTime: Date.now(),
    solidColor: true,
    radius: 50,
    iconSize: 60,
    padding: 18,
    currency: 'usd',
    rightColor: '#3F8BFF',
    leftColor: '#64C466',
    rangeColor: '#3F8BFF',
    cacheTime: 3
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
  
  // 预览组件
  const previewWidget = async () => {
    const modulePath = await module.webModule(scrUrl);
    if (modulePath != null) {
      const importedModule = importModule(modulePath);
      await importedModule.main();
      if (settings.update) await updateString();
    }
  };
  
  const shimoFormData = (action) => {
    const req = new Request('https://shimo.im/api/newforms/forms/25q5XdW928i8Og3D/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'iMJWdgGR',
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
   * 运行 Widget 脚本
   * 组件版本、iOS系统更新提示
   * @param {object} config - Scriptable 配置对象
   * @param {string} notice 
   */
  const runWidget = async () => {
    await previewWidget();
    await module.appleOS_update();
    shimoFormData(settings.currency);
    
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}‼️`, `新版本更新 Version ${version}，桌面组件布局调整，清除缓存再更新代码。`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
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

    const avatarPath = fm.joinPath(cacheImg, 'userSetAvatar.png');
    const authorAvatar = fm.fileExists(avatarPath) ? await module.toBase64(fm.readImage(avatarPath)) : await module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`);
    
    const appleHub_light = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_white.png`);
    const appleHub_dark = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_black.png`);
    
    const appImage = await module.getCacheImage(`${rootUrl}/img/icon/dollar.png`);
    
    const collectionCode = await module.getCacheImage(`${rootUrl}/img/picture/collectionCode.jpeg`);
    
    const scriptTags = await module.scriptTags();
    
    /**
     * @param {string} style
     * @param {string} themeColor
     * @param {string} avatar
     * @param {string} popup
     * @param {string} js
     * @returns {string} html
     */
    const screenSize = Device.screenSize().height;
    const cssStyle = await module.getCacheData(`${rootUrl}/web/cssStyle.css`);

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
      top: ${screenSize < 926 ? (avatarInfo ? '-10%' : '-2%') : (avatarInfo ? '-9%' : '-1%')};
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
    }

    .app-icon {
      width: 100px;
      height: 100px;
      margin-bottom: -5px;
      object-fit: cover;
    }`;
    
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
      authorAvatar, 
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
      formItems,
      avatarInfo,
      appImage,
      appleHub_dark,
      appleHub_light,
      id: 'getFlag',
      buttonColor: '',
      margin: '30px;',
      text: '常用国际货币兑换人民币',
      text2: '世界国旗图片'
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    previewImgHtml = async () => {
      const pictureArr = Array.from({ length: 3 }, (_, index) => `${rootUrl}/img/picture/exchange_rate_${index}.png`);
      const getRandomValues = (arr, num) => [...arr].sort(() => Math.random() - 0.5).slice(0, num);
      const randomUrl = getRandomValues(pictureArr, 2);

      const imageElements = randomUrl.map(async (imageUrl) => {
        const cachedImgUrl = await module.getCacheImage(imageUrl);
        return `<img src="${cachedImgUrl}" class="preview-img">`
      });
    
      const imagesHtml = await Promise.all(imageElements);
      return `<div class="preview-img-container">${imagesHtml.join('')}</div>`;
    };
    
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
      webView.evaluateJavaScript(
        `var element = document.getElementById("${elementId}-desc");
        if (element) element.innerHTML = \`${newText}\`;
        `, false
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
    const input = async ({ label, name, message, other } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [{
          hint: settings[name] ? String(settings[name]) : '请输入',
          value: String(settings[name]) ?? ''
        }]
      }, 
      async ([{ value }]) => {
        const result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];

        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, result || settings[name]);
      })
    };
    
    // appleOS 推送时段
    const period = async ({ label, name, message, desc } = data) => {
      const fields = [
        { hint: '开始时间 4', value: String(settings.startTime) },
        { hint: '结束时间 6', value: String(settings.endTime) }
      ];
      
      const inputs = await module.collectInputs(label, message, fields);
      if (!inputs.length) return;
      const [startTime, endTime] = inputs;
      settings.startTime = startTime ? Number(startTime) : '';
      settings.endTime = endTime ? Number(endTime) : '';
      const inputStatus = startTime || endTime ? '已设置' : '默认'
      settings[`${name}_status`] = inputStatus;
      writeSettings(settings);
      innerTextElementById(name, inputStatus);
    };
    
    // 推荐组件
    const installScript = async (data) => {
      const { label, scrUrl } = JSON.parse(data);
      const fm = FileManager.iCloud()
      const script = await new Request(scrUrl).loadString();
      if (script.includes('{')) {
        const filePath = fm.documentsDirectory() + `/${label}.js`;
        fm.writeString(filePath, script);
        Timer.schedule(500, false, () => Safari.open(`scriptable:///run/${encodeURIComponent(label)}`));
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
      app: async () => {
        Timer.schedule(350, false, async () => {
          await input({ 
            label: '捐赠弹窗',
            name: 'loader',
            other: true,
            message: '输入 ( 95du ) 即可关闭捐赠弹窗'
          })
        });
      },
      getFlag: () => {
        Timer.schedule(650, false, () => Safari.openInApp('https://pixabay.com/zh/vectors/search/%E5%9B%BD%E6%97%97', false));
      },
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
  
  // 用户偏好设置菜单
  const userMenus = module.userMenus(settings, true);
  
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
        },
      ]
    },
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
          message: 'iOS 16 系统以下设置值为 18\n即可显示圆形',
          desc: settings.radius
        },
        {
          label: '图标尺寸',
          name: 'iconSize',
          type: 'cell',
          input: true,
          message: 'Max机型以下需修改图标尺寸',
          desc: settings.iconSize,
          icon: {
            name: 'checkerboard.shield',
            color: '#0FC4EA'
          }
        },
        {
          label: '缓存时长',
          name: 'cacheTime',
          type: 'cell',
          input: true,
          icon: {
            name: 'externaldrive.fill',
            color: '#F9A825'
          },
          message: `缓存国际汇率数据\n( 每 ${settings.cacheTime ?? '几'} 小时更新一次 )`,
          desc: settings.cacheTime
        },
        {
          label: '边距调整',
          name: 'padding',
          type: 'cell',
          input: true,
          icon: `${rootUrl}/img/symbol/layout.png`,
          message: '设置组件的上、下、左和右的内边距',
          desc: settings.padding
        },
        {
          name: "rightColor",
          label: "右上汇率",
          type: "color",
          icon: `${rootUrl}/img/symbol/title.png`
        },
        {
          name: "leftColor",
          label: "左下汇率",
          type: "color",
          icon: {
            name: 'textformat',
            color: '#938BF0'
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
            color: '289CF4'
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
            color: '#34C759'
          }
        },
        {
          label: '内置渐变',
          name: 'gradient',
          type: 'select',
          multiple: true,
          icon: {
            name: 'scribble.variable',
            color: '#B07DFF'
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
          label: '常用汇率',
          name: 'currency',
          type: 'select',
          multiple: false,
          icon: {
            name: 'dollarsign.arrow.circlepath',
            color: '#00C4B6'
          },
          options: [
            {
              label: ' ',
              values: [
                {
                  label: 'USD·美元',
                  value: 'usd'
                },
                {
                  label: 'EUR·欧元',
                  value: 'eur'
                },
                {
                  label: 'GBP·英镑',
                  value: 'gbp'
                }
              ]
            },
            {
              values: [
                {
                  label: 'CAD·加元',
                  value: 'cad'
                },
                {
                  label: 'AUD·澳元',
                  value: 'aud'
                },
                {
                  label: 'HKD·港币',
                  value: 'hkd'
                }
              ]
            },
            {
              values: [
                {
                  label: '瑞士法郎',
                  value: 'chf'
                },
                {
                  label: '德国马克',
                  value: 'dem',
                  disabled: true
                },
                {
                  label: '法国法郎',
                  value: 'frp',
                  disabled: true
                },
                {
                  label: '新西兰元',
                  value: 'nzd'
                },
                {
                  label: '新加坡元',
                  value: 'sgd'
                },
                {
                  label: '新里拉币',
                  value: 'try'
                }
              ]
            }
          ]
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
    await runWidget();
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }