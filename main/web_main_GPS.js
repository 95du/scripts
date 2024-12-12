// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: car;

async function main() {
  const scriptName = 'GPS 定位器'
  const version = '2.0.0'
  const updateDate = '2023年11月26日'
  const pathName = '95du_GPS';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_gps_locating.js`;
  
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
  
  /** ------- 导入模块 ------- **/
  
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
  if (screenSize < 926) {
    layout = {
      lrfeStackWidth: 106,
      carStackWidth: 200,
      carWidth: 200,
      carHeight: 100,
      bottomSize: 200,
      carTop: -20,
      setPadding: 10
    }
  } else {
    layout = {
      lrfeStackWidth: 109,
      carStackWidth: 225,
      carWidth: 225,
      carHeight: 100,
      bottomSize: 225,
      carTop: -25,
      setPadding: 14
    }
  };
  
  const DEFAULT = {
    ...layout,
    version,
    refresh: 20,
    transparency: 0.5,
    masking: 0.3,
    gradient: ['#82B1FF'],
    imgArr: [],
    update: true,
    topStyle: true,
    music: true,
    animation: true,
    appleOS: true,
    fadeInUp: 0.7,
    angle: 90,
    updateTime: Date.now(),
    carBot: 0,
    carLead: 10,
    carTra: 0,
    rangeColor: '#FF6800',
    textLightColor: '#000000',
    textDarkColor: '#FFFFFF',
    titleColor: '#000000',
    solidColor: '#FFFFFF',
    topButton: '#AF52DE',
    botButton: '#007AFE',
    logoColor: '#000000',
    myPlate: '京A·56789'
  };
  
  const initSettings = () => {
    const settings = DEFAULT;
    module.writeSettings(settings);
    return settings;
  };
  
  const settings = fm.fileExists(settingPath) 
    ? module.getSettings() 
    : initSettings();
  
  const { imei, password, aMapkey, deviceName, tokenUrl, touser, agentid } = settings || {};
  
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
  const previewWidget = async (family = 'medium') => {
    const moduleJs = await module.webModule(scrUrl);
    const { main } = await importModule(moduleJs)
    await main(family);
    if (settings.update) await updateString();
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
      module.notify(`${scriptName}‼️`, `新版本更新 Version ${version}，清除缓存后再更新`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
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
    
    const avatarImage = fm.joinPath(cacheImg, 'userSetAvatar.png');
    const authorAvatar = await module.toBase64(
    fm.fileExists(avatarImage) 
      ? fm.readImage(avatarImage) 
      : await module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`)
    );
    
    const collectionCode = await module.getCacheImage(`${rootUrl}/img/picture/collectionCode.jpeg`);
    
    const appleHub_light = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_white.png`);
    const appleHub_dark = await module.getCacheImage(`${rootUrl}/img/picture/appleHub_black.png`);
    
    const appImage = await module.getCacheImage(`${rootUrl}/img/icon/aMap.png`);

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
      top: ${screenSize < 926 ? (avatarInfo ? '-6%' : '-2%') : (avatarInfo ? '-5%' : '-2%')};
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
      `<li>增加仪表盘样式小号组件</li>`,
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
    const widgetMessage = '功能: 通过GPS设备制作的中小号小组件，显示车辆实时位置、车速、最高时速、行车里程和停车时间等。推送实时静态地图及信息到微信。需申请高德地图 web 服务 Api 类型 key，微信推送需要另外填入企业微信应用的Api信息。';

    const popupHtml = module.buttonPopup({
      widgetMessage,
      formItems,
      avatarInfo,
      appImage,
      appleHub_dark,
      appleHub_light,
      id: 'getKey',
      buttonColor: '',
      margin: '30px;',
      text: '如果没有开发者账号，请注册开发者',
      text2: '获取 Key'
    });
    
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    const previewImgUrl = [
      `${rootUrl}/img/picture/gps_location_0.png`,
      `${rootUrl}/img/picture/gps_location_3.png`
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
      webView.evaluateJavaScript(
        `var element = document.getElementById("${elementId}-desc");
        if (element) element.innerHTML = \`${newText}\`;
        `, false
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
    const input = async ({ label, name, message, display, isDesc, other } = data) => {
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
        } else if ( display ) {
          result = /[a-z]+/.test(value) && /\d+/.test(value) ? value : ''
        } else {
          result = value === '0' || other ? value : !isNaN(value) ? Number(value) : settings[name];
        };
        
        const isName = ['aMapkey', 'logo', 'carImg'].includes(name);
        const inputStatus = result ? '已添加' : display ? '未添加' : '默认';
        
        if (isDesc) settings[`${name}_status`] = inputStatus;  
        
        settings[name] = result;
        writeSettings(settings);
        innerTextElementById(name, isName ? inputStatus : result);
      })
    };
          
    // 登录设备
    const login = async ({ label, name, message } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: 'imei', value: String(settings['imei']) },
          { hint: '密码', value: String(settings['password']) }
        ]
      }, 
      async (inputArr) => {
        const [imei, password] = inputArr.map(({ value }) => value);
        settings.imei = !imei ? '' : Number(imei);
        settings.password = !password ? '' : Number(password);
        
        writeSettings(settings);
        innerTextElementById(name, imei && password ? '已登录' : '未登录')
        await previewWidget('medium');
      });
    };
    
    // 推送微信
    const weiChat = async ({ label, name, message } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: 'access_token', value: settings['tokenUrl'] },
          { hint: 'touser成员id', value: settings['touser'] },  
          { hint: 'agentid应用id', value: String(settings['agentid']) }
        ]
      }, 
      async (inputArr) => {
        const [tokenUrl, touser, agentid] = inputArr.map(({ value }) => value);
        settings.tokenUrl = tokenUrl ?? ''
        settings.touser = touser ? touser : ''
        settings.agentid = agentid ? Number(agentid) : ''
          
        writeSettings(settings);
        innerTextElementById(name, tokenUrl && touser && agentid ? '已添加' : '未添加');
      });
    };
    
    // 修改组件布局
    const layout = async ({ label, message } = {}) => {
      const fields = [
        { hint: '左边容器宽度', value: String(settings.lrfeStackWidth) },
        { hint: '车图容器宽度', value: String(settings.carStackWidth) },
        { hint: '减少车图顶部空白', value: String(settings.carTop) },
        { hint: '减少车图底部空白', value: String(settings.carBot) },
        { hint: '车图左边空白', value: String(settings.carLead) },
        { hint: '车图右边空白', value: String(settings.carTra) },
        { hint: '文字容器尺寸', value: String(settings.bottomSize) }
      ];
    
      const inputs = await module.collectInputs(label, message, fields);
      if (!inputs.length) return;
    
      const keys = ['lrfeStackWidth', 'carStackWidth', 'carTop', 'carBot', 'carLead', 'carTra', 'bottomSize'];
      keys.forEach((key, i) => {
        const value = settings[key];
        settings[key] = typeof value === 'number' ? Number(inputs[i]) || 0 : inputs[i];
      });
    
      writeSettings(settings);
      await previewWidget('medium');
      await layout({ label, message })
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
          '保留用户登录的信息\n设置的数据将会恢复为默认',   
          options = ['取消', '恢复']
        );
        if ( action === 1 ) {
          const reserve = { ...DEFAULT, imei, password, deviceName, aMapkey, tokenUrl, touser, agentid };
          writeSettings(reserve);
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
        case 'setAvatar':
          fm.writeImage(
            avatarImage, 
            await module.drawSquare( Image.fromData(Data.fromBase64String(data)) )
          );
          break;
        case 'telegram':
          Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false);
          break;
        case 'getKey':
          Timer.schedule(650, false, () => { Safari.openInApp('https://lbs.amap.com/api/webservice/guide/create-project/get-key', false)});
          break;
        case 'changeSettings':
          Object.assign(settings, data);
          writeSettings(settings);
          break;
        case 'updateCode':
          await updateVersion();
          break;
        case 'login':
          await login(data);
          break;
        case 'weiChat':
          await weiChat(data);
          break;
        case 'layout':
          await layout(data);
          break;
        case 'period':
          await period(data);
          break;
        case 'preview':
          await previewWidget(data.family);
          break;
        case 'chooseBgImg':
          const image = await Photos.fromLibrary();
          fm.writeImage(getBgImage(), image);
          innerTextBgImage();
          await previewWidget();
          break;
        case 'clearBgImg':
          const bgImagePath = fm.fileExists(getBgImage());
          if ( bgImagePath ) {
            fm.remove(getBgImage());
            innerTextBgImage();
            await previewWidget();
          }
          break;
        case 'file':
          const fileModule = await module.webModule(`${rootUrl}/module/local_dir.js`);
          await importModule(await fileModule).main();
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
        case 'install':
          await updateString();
          ScriptableRun();
          break;
        case 'itemClick':      
          const findItem = (items, name) => items.reduce((found, item) => found || (item.name === name ? item : (item.type === 'group' && findItem(item.items, name))), null);
          
          const item = data.type === 'page' ? findItem(formItems, data.name) : data;
          
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
  const userMenus = module.userMenus(settings, false);
  
  // 设置菜单页
  const settingMenu = [
    {
      label: '设置',
      type: 'group',
      items: [
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
          },
          desc: 'Honye'
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
        },
        {
          name: "titleColor",
          label: "车牌颜色",
          type: "color",
          icon: {
            name: 'checklist',
            color: '#F9A825'
          }
        },
        {
          name: "topButton",
          label: "左上按钮",
          type: "color",
          icon: {
            name: 'a.circle.fill',
            color: '#BD7DFF'
          }
        },
        {
          name: "botButton",
          label: "左下按钮",
          type: "color",
          icon: {
            name: 'b.circle.fill',
            color: '#00AEFF'
          }
        },
        {
          name: "logoColor",
          label: "logo颜色",
          type: "color",
          icon: {
            name: 'r.square.on.square.fill',
            color: '#FF6800'
          }
        },
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
          label: "纯色背景",
          type: "color",
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
          label: '布局调整',
          name: 'layout',
          type: 'cell',
          icon: `${rootUrl}/img/symbol/layout.png`,
          message: '建议只调整图片上下空白'
        },
        {
          label: '推送通知',
          name: 'interval',
          type: 'cell',
          input: true,
          message: '车辆静止超过10分钟后，车辆未行驶则默认每4小时推送一次车辆状态通知\n（ 单位: 分钟 ）',
          desc: settings.interval,
          icon: {
            name: 'text.bubble.fill',
            color: '#F9A825'
          }
        },
        {
          label: '车辆图片',
          name: 'carImg',
          type: 'cell',
          input: true,
          isDesc: true,
          message: '填入 png 格式的图片链接',
          desc: settings.carImg ? '已添加' : '默认',
          icon: {
            name: 'car.rear.fill',
            color: '#43CD80'
          }
        },
        {
          label: '更换logo',
          name: 'logo',
          type: 'cell',
          input: true,
          isDesc: true,
          message: '填入 png 格式的图标链接',
          desc: settings.logo ? '已添加' : '默认',
          icon: {
            name: 'checkerboard.shield',
            color: '#BD7DFF'
          }
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
          label: 'GPS定位',
          type: 'collapsible',
          name: 'user',
          icon: {
            name: 'dot.radiowaves.up.forward',
            color: '#0FC4EA'
          },
          item: [
            {
              label: '我的车牌',
              name: 'myPlate',
              type: 'cell',
              input: true,
              other: true,
              desc: settings.myPlate ? '已添加' : '未添加',
              icon: 'questionmark'
            },
            {
              label: '登录设备',
              name: 'login',
              type: 'cell',
              desc: settings.password && settings.imei ? '已登录' : '未登录',
              message: '在设备上查看获取 imei 码\n原始密码为: 123456',
              icon: 'externaldrive.badge.plus'
            },
            {
              label: '静态地图',
              name: 'aMapkey',
              type: 'cell',
              input: true,
              display: true,
              desc: settings.aMapkey ? '已添加' : '未添加',
              message: '高德地图web服务 API 类型 Key\n用于获取模拟电子围栏及静态地图',
              icon: 'pin'
            },
            {
              label: '推送微信',
              name: 'weiChat',
              type: 'cell',
              desc: settings.tokenUrl && settings.touser && settings.agentid ? '已添加' : '未添加',
              message: '创建企业微信中的应用，获取access_token的链接，touser成员ID，agentid企业应用的ID',
              icon: 'message'
            }
          ]
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