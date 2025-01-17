// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: volleyball-ball;

async function main() {
  const scriptName = '体育赛事'
  const version = '1.0.4'
  const updateDate = '2025年01月17日'
  const pathName = '95du_sports';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_sports.js`;

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

  const tabs = ["NBA", "CBA", "英超", "西甲", "德甲", "意甲", "法甲", "欧冠", "苏超", "葡超", "澳超", "荷甲", "俄超", "沙特超", "瑞士超"];
  const values = tabs.map(tab => ({ label: tab, value: tab }));
  
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
    bwTheme: false,
    alwaysDark: false,
    lightColor: '#000000',
    darkColor: '#FFFFFF',
    rangeColor: '#3F8BFF',
    dateColor: '#14BAFF',
    selected: 'randomSports',
    autoSwitch: true,
    loopEvent: true,
    values
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
  
  // 组件版本通知
  const updateNotice = () => {
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}❗️`, `新版本更新 Version ${version}，增加随机赛事，更新后恢复设置以保证选项框完整`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    }
  };
  
  /**
   * 运行 Widget 脚本，预览组件
   * iOS系统更新提示
   * @param {object} config - Scriptable 配置对象
   * @param {string} notice 
   */
  const previewWidget = async (family = 'large') => {
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
    const req = new Request('https://shimo.im/api/newforms/forms/2wAldzZn8NFddzAP/submit');  
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'yziUI3WM',
        text: { content: '测试' },
      }],
      userName: `${settings.selected}  -  ${Device.systemName()} ${Device.systemVersion()}  ${action}`
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
    if (!str.includes('95du茅台')) {
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
    
    const selectOpts = formItems
      .flatMap(group => group.items)
      .find(item => item.type === 'select')?.options || [];
    
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
      `<li>新组件发布 🔥</li>`,
      `<li>显示多个不同赛事，编辑桌面组件，在参数中输入 【 "西甲"，"英超"，"NBA"】将会显示对应的组件 🇩🇪</li>`
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
    const widgetMessage = '1，支持百度体育官网中所有赛事<br>2，在桌面组件参数输入对应的赛事名称，例如: 西甲、英超、NBA、CBA<br>3，可切换比赛时页面，多场比赛时可循环切换<br>4，赛事事件即时通知';

    const popupHtml = module.buttonPopup({
      settings,
      widgetMessage,
      formItems,
      avatarInfo,
      appleHub_dark,
      appleHub_light,
      toggle: true,
      lablename: '百度体育',
      elementById: 'website'
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    const previewImgUrl = [
      `${rootUrl}/img/picture/sports_0.png`,
      `${rootUrl}/img/picture/hotSports_2.png`
    ];
    
    /**
     * @param {string} style
     * @param {string} themeColor
     * @param {string} avatar
     * @param {string} popup
     * @param {string} js
     * @returns {string} html
     */
    const screenSize = Device.screenSize().height;
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
      top: ${screenSize < 926 ? (avatarInfo ? '-8%' : '-2%') : (avatarInfo ? '-8%' : '-2%')};
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
        <script>${await module.runScripts(formItems, settings, 'range-separ1')}</script>
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
        const inputStatus = startTime || endTime ? '已设置' : '默认';
        settings[`${name}_status`] = inputStatus;
        writeSettings(settings);
        innerTextElementById(name, inputStatus);
      })
    };
    
    /**
     * 展示比赛子列表菜单
     * @param {Array} subList
     * @returns {number} 选中的菜单索引
     */
    const presentSubListMenu = async (menus, message) => {
      const alert = new Alert();
      alert.message = message || null;
      menus.forEach((item, index) => {
        alert.addAction(`${index + 1}，${item.label || item.name}`);
      });
      alert.addCancelAction('取消');
      return await alert.presentSheet();
    };
    
    // 删减赛事
    const removeSport = async ({ name } = data) => {
      const subList = settings.values
      while (subList.length) {
        const menuId = await presentSubListMenu(subList, '\n删减赛事❓');
        if (menuId === -1) break;
        const action = await module.generateAlert(
          null, `是否删除 ( ${subList[menuId].label} )❓`,
          options = ['取消', '删除'],
          true
        );
        if (action === 1) {
          subList.splice(menuId, 1);
          settings.selected = subList[0]?.value || 'randomSports';
          settings.values = subList;
          writeSettings(settings);
          // 更新选取框
          module.updateSelect(webView, selectOpts);
          innerTextElementById(name, settings.values.length);
        }
      }
    };
    
    /**
     * 添加运动项目到设置中
     * @param {string} shortName
     * @param {string} fullName
     */
    const setSport = (shortName) => {
      settings.values.unshift({
        label: shortName,
        value: shortName,
      });
      settings.selected = shortName;
      writeSettings(settings);
    };
    
    // 增加赛事
    const addSport = async ({ name, sta } = data) => {
      const url = `https://tiyu.baidu.com/al/matchlist`;
      const html = await module.getCacheData(url, 240, 'matchlist.html');
      const match = html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
      const value = JSON.parse(match);
      const subList = value.data.tplData;
      while (subList.length > 0) {
        const menuId = await presentSubListMenu(subList);
        if (menuId === -1) break;
        const { short_name, name: fullName } = subList[menuId];
        const action = await module.generateAlert(
          null, `${fullName}\n( ${short_name} )`,
          options = ['取消', '添加']
        );
        if (action === 1) {
          const isSportAdded = settings.values.some(item => item.value === short_name)
          if (!isSportAdded) {
            setSport(short_name);
            module.updateSelect(webView, selectOpts);
            innerTextElementById(sta, settings.values.length);
          } else {
            module.notify('添加失败🚫', `${fullName}已存在。`);
          }
        }
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
      website: () => Safari.openInApp('https://tiyu.baidu.com/al/matchlist', false),
      updateCode: async () => await updateVersion(),
      period: async (data) => await period(data),
      addSport: async (data) => await addSport(data),
      removeSport: async (data) => await removeSport(data),
      preview: async (data) => await previewWidget(data.family),
      setAvatar: async (data) => {
        const avatarImage = await module.drawSquare(Image.fromData(Data.fromBase64String(data)));
        fm.writeImage(avatarPath, avatarImage);
      },
      changeSettings: (data) => {
        Object.assign(settings, data);
        writeSettings(settings);
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
        await importModule(modulePath).main(cacheImg)
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
      },
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
  
  // 用户偏好设置菜单
  const userMenus = module.userMenus(settings, false);
  const filesMenus = module.filesMenus(settings);
  const backgroundMenus = module.backgroundMenus(settings, getBgImage());
  
  // 设置菜单页
  const settingMenu = [
    filesMenus,
    {
      label: '多场比赛时循环显示',
      type: 'group',
      items: [
        {
          header: true,
          label: '循环场次',
          type: 'switch',
          name: 'loopEvent',
          icon: {
            name: 'hand.draw.fill',
            color: '#FF7800'
          }
        },
        {
          name: "autoSwitch",
          label: "中号赛况",
          type: "switch",
          icon: {
            name: 'repeat',
            color: '#00ABF4'
          }
        },
        {
          label: '大号赛况',
          name: 'largeSwitch',
          type: "switch",
          icon: {
            name: 'repeat.1',
            color: '#B07DFF'
          }
        },
        {
          label: '技术统计',
          name: 'statistics',
          type: "switch",
          icon: {
            name: 'doc.text.image.fill',
            color: '#0088F4'
          }
        },
        {
          label: '比分通知',
          name: 'notify',
          type: 'switch',
          icon: `${rootUrl}/img/symbol/notice.png`,
          default: true
        },
        {
          label: '直播状态',
          name: 'displayLive',
          type: 'switch',
          icon: {
            name: 'video.fill',
            color: '#00C400'
          }
        },
        {
          label: '更新时间',
          name: 'dateFormat',
          type: 'switch',
          icon: {
            name: 'text.line.first.and.arrowtriangle.forward',
            color: '#FFA500'
          }
        },
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '视频直播',
          name: 'videoColor',
          type: 'color',
          icon: {
            name: 'questionmark.video.fill',
            color: '#FFA200'
          }
        },
        {
          label: '日期夜间',
          name: 'dateColor',
          type: 'color',
          icon: {
            name: 'clock',
            color: '#4AC5AD'
          }
        },
        {
          name: "lightColor",
          label: "白天文字",
          type: "color",
          icon: `${rootUrl}/img/symbol/title.png`
        },
        {
          name: "darkColor",
          label: "夜间文字",
          type: "color",
          icon: {
            name: 'textformat',
            color: '#938BF0'
          }
        },
      ]
    },
    ...backgroundMenus,
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
          label: '体育赛事',
          name: 'selected',
          type: 'select',
          multiple: false,
          icon: {
            name: 'trophy.fill',
            color: '#00C4B6'
          },
          options: [
            {
              label: '随机已添加的赛事',
              values: [
                {
                  label: '随机赛事',
                  value: 'randomSports'
                }
              ]
            },
            {
              label: '足球篮球等赛事',
              values: settings.values
            }
          ]
        },
        {
          label: '删减赛事',
          name: 'removeSport',
          type: 'cell',
          isDesc: true,
          icon: {
            name: 'basketball.fill',
            color: '#FF3300'
          },
          desc: settings.values.length
        },
        {
          label: '增加赛事',
          name: 'addSport',
          type: 'cell',
          icon: {
            name: 'figure.soccer',
            color: '#FF8800'
          },
          sta: 'removeSport'
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
          label: '大号组件',
          name: 'preview',
          type: 'cell',
          family: 'large',
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