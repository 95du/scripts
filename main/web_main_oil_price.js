// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: gas-pump;

async function main() {
  const scriptName = '全国油价'
  const version = '1.1.0'
  const updateDate = '2024年10月23日'
  const pathName = '95du_Oils';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_oils_price.js`;

  /**
   * 创建，获取存储路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  if (!fm.fileExists(depPath)) fm.createDirectory(depPath);
  await download95duModule(rootUrl)
    .catch(() => download95duModule(spareUrl));
  const isDev = true
  
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
      settings, null, 2)
    )
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
    rangeColor: '#3F8BFF',
    interval: screenSize < 926 ? 3 : 0,
    province: '海南'
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
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = (image) => {
    const filePath =  fm.joinPath(cacheImg, Script.name());
    if (image) fm.writeImage(filePath, image);
    return filePath;
  };
  
  // 获取头像图片
  const getAvatarImg = () => {
    return fm.joinPath(cacheImg, 'userSetAvatar.png');
  };
  
  // ScriptableRun
  const ScriptableRun = () => Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
  
  // 预览组件
  const previewWidget = async () => {
    await importModule(await module.webModule(scrUrl)).main();
    if (settings.update) await updateString();
    shimoFormData(settings.province);
  };
  
  const shimoFormData = (action) => {
    const req = new Request('https://shimo.im/api/newforms/forms/ZzkLMlGB2nIYEvAQ/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'HBBB1q0I',
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
    const family = config.widgetFamily;
    await previewWidget(family);
    await module.appleOS_update();
    
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}‼️`, `新版本更新 Version ${version}，随机两种油价预警内容`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    }
  };
  
  // ====== web start ======= //
  const renderAppView = async (options) => {
    const {
      formItems = [],
      avatarInfo,
      previewImage
    } = options;
    
    const appleHub_light = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_white.png`);
    const appleHub_dark = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_black.png`);
    
    const appImage = await module.getCacheImage(`${rootUrl}/img/icon/oilPrice2.png`);
    
    const authorAvatar = fm.fileExists(getAvatarImg()) ? await module.toBase64(fm.readImage(getAvatarImg()) ) : await module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`);
    
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
    const cssStyle = await module.getCacheData(`${rootUrl}/web/cssStyle.css`);

    const style =`  
    :root {
      --color-primary: #007aff;
      --divider-color: rgba(60,60,67,0.36);
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
      top: ${screenSize < 926 ? (avatarInfo ? '-3%' : '-2%') : (avatarInfo ? '-7%' : '-4%')};
    }
    
    ${settings.animation ? `
    .list {
      animation: fadeInUp ${settings.fadeInUp}s ease-in-out;
    }` : ''}
    ${cssStyle}`;
    
    /**
     * 生成主菜单头像信息和弹窗的HTML内容
     * @returns {string} 包含主菜单头像信息、弹窗和脚本标签的HTML字符串
     */
    const listItems = [
      `<li>${updateDate}</li>`,
      `<li>调整组件样式，增加深色模式，修复已知问题</li>`,
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
    const popupHtml = await module.buttonPopup({
      formItems,
      avatarInfo,
      appImage,
      appleHub_dark,
      appleHub_light,
      id: 'alipay',
      buttonColor: 'jb-green',
      margin: '30px;',
      text: '南网在线 App ( 5 省 )',
      text2: '支付宝缴费'
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */  
    const previewImgUrl = [
      `${rootUrl}/img/picture/oils_price_2.png`,
      `${rootUrl}/img/picture/oils_price_3.png`
    ];
    
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
        <script>${await module.runScripts(formItems, settings, 'adjustment', 'range-separ1')}</script>
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
        if (name === 'province') {
          const hasChinese = /^[\u4e00-\u9fa5].*[\u4e00-\u9fa5]$/.test(value);
          result = hasChinese ? value : settings[name];
        } else {
          result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];
        };
        
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, result || settings[name]);
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
    
    // 注入监听器
    const injectListener = async () => {
      const event = await webView.evaluateJavaScript(
        `(() => {
          const controller = new AbortController()
          const listener = (e) => {
            completion(e.detail)
            controller.abort()
          }
          window.addEventListener(
            'JBridge',
            listener,
            { signal: controller.signal }
          )
        })()`,
        true
      ).catch((err) => {
        console.error(err);
      });
      
      const { code, data } = event;
      if (code === 'clearCache') {
        const action = await module.generateAlert(  
          '清除缓存', '是否确定删除所有缓存？\n离线内容及图片均会被清除。',
          options = ['取消', '清除']
        );
        if ( action === 1 ) {
          fm.remove(cacheStr);
          //fm.remove(cacheImg);
          ScriptableRun();
        }
      } else if (code === 'reset') {
        const action = await module.generateAlert(
          '清空所有数据', 
          '该操作将把用户储存的所有数据清除，重置后等待5秒组件初始化并缓存数据', 
          ['取消', '重置'], '重置'
        );
        if ( action === 1 ) {
          fm.remove(mainPath);
          ScriptableRun();
        }
      } else if ( code === 'recover' ) {
        const action = await module.generateAlert(  
          '是否恢复设置 ？', 
          '用户登录的信息将重置\n设置的数据将会恢复为默认',   
          options = ['取消', '恢复']
        );
        if ( action === 1 ) {
          writeSettings(DEFAULT);
          ScriptableRun();
        }
      } else if (code === 'app') {
        Timer.schedule(350, false, async () => {
          await input({
            label: '捐赠弹窗',
            name: 'loader',
            other: true,
            message: '输入 ( 95du ) 即可关闭捐赠弹窗'
          })
        });
      } else if ( data?.input ) {
        await input(data);
      };
      
      // switch
      switch (code) {
        case 1:
          await installScript(data);
          break;
        case 'setAvatar':
          const avatarImage = Image.fromData(Data.fromBase64String(data));
          fm.writeImage(
            getAvatarImg(), await module.drawSquare(avatarImage)
          );
          break;
        case 'telegram':
          Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false);
          break;
        case 'alipay':
          Timer.schedule(650, false, () => { Safari.open('alipays://platformapi/startapp?appId=2021001164644764', false) });
          break;
        case 'changeSettings':
          Object.assign(settings, data);
          writeSettings(settings);
          break;
        case 'updateCode':
          await updateVersion();
          break;
        case 'period':
          await period(data);
          break;
        case 'preview':
          await previewWidget();
          break;
        case 'chooseBgImg':
          const image = await Photos.fromLibrary();
          getBgImage(image);
          innerTextBgImage();
          await previewWidget();
          break;
        case 'clearBgImg':
          const bgImagePath = fm.fileExists(getBgImage());
          if (bgImagePath) {
            fm.remove(getBgImage());
            innerTextBgImage();
            await previewWidget();
          }
          break;
        case 'background':
          const modulePath = await module.webModule(`${rootUrl}/main/main_background.js`);
          await importModule(await modulePath).main(cacheImg);
          await previewWidget();
          break;
        case 'store':
          const storeModule = await module.webModule(`${rootUrl}/main/web_main_95du_Store.js`);
          await importModule(await storeModule).main();
          module.myStore();
          break;
        case 'adjustment':
          Timer.schedule(350, false, async () => {
            const web = new WebView()
            const html = await new Request(`${rootUrl}/update/adjustmentDate.js`).loadString();  
            web.loadHTML(html);
            await web.present();
          });
          break;
        case 'install':
          await updateString();
          ScriptableRun();
          break;
        case 'itemClick':      
          const findItem = (items) => items.reduce((found, item) => found || (item.name === data.name ? item : (item.type === 'group' && findItem(item.items))), null);
          
          const item = data.type === 'page' ? findItem(formItems) : data;
          
          data.type === 'page' ? await renderAppView(item, false, { settings }) : onItemClick?.(data, { settings });
          break;
      };
      // Remove Event Listener
      if ( event ) {
        webView.evaluateJavaScript(
          `window.dispatchEvent(new CustomEvent('JWeb', { detail: { code: 'finishLoading'} }))`,
          false
        );
      };
      await injectListener();
    };
  
    injectListener().catch((e) => {
      console.error(e);
    });
    await webView.present();
  };
  
  // 偏好设置菜单
  const userMenus = module.userMenus(settings, true);
  
  // 设置菜单页
  const settingMenu = (() => {
    const formItems = [
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
            label: '刷新时间',
            name: 'refresh',
            type: 'cell',
            input: true,
            icon: `${rootUrl}/img/symbol/refresh.png`,  
            message: '设置桌面组件的时长\n( 单位: 分钟 )',
            desc: settings.refresh
          },
          {
            label: '底部间隔',
            name: 'interval',
            type: 'cell',
            input: true,
            icon: {
              name: 'arrowtriangle.left.and.line.vertical.and.arrowtriangle.right.fill',  
             color: '#FF9500'
            },
            desc: settings.interval
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
            label: "单色渐变",
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
    return formItems;
  })();
  
  // 主菜单
  const formItems = (() => {
    const mainFormItems = [
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
            label: '省份地区',
            name: 'province',
            type: 'cell',
            input: true,
            icon: {
              name: 'fuelpump.fill',
              color: '#00C4B6'
            },
            desc: settings.province
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
    return mainFormItems;
  })();
  
  // render Widget
  if (!config.runsInApp) {
    await runWidget();
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
}
module.exports = { main }