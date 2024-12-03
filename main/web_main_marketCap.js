// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: cog;

async function main() {
  const scriptName = '美股港股市值'
  const version = '1.1.0'
  const updateDate = '2024年10月23日'
  const pathName = '95du_marketCap';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const spareUrl = 'https://raw.gitcode.com/4qiao/scriptable/raw/master';
  const scrUrl = `${rootUrl}/api/web_market_cap.js`;

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
  const values = [
    {
      label: "苹果",
      value: "AAPL"
    },
    {
      label: "微软",
      value: "MSFT"
    },
    {
      label: "英伟达",
      value: "NVDA"
    },
    {
      label: "亚马逊",
      value: "AMZN"
    },
    {
      label: "谷歌母公司",
      value: "GOOGL"
    },
    {
      label: "特斯拉",
      value: "TSLA"
    },
    {
      label: "META 脸书",
      value: "META"
    },
    {
      label: "维萨",
      value: "V"
    },
    {
      label: "腾讯 Tencent",
      value: "00700",
      market: "HK"
    },
    {
      label: "台积电",
      value: "TSM"
    },
    {
      label: "埃克森美孚",
      value: "XOM"
    },
    {
      label: "联合健康集团",
      value: "UNH"
    },
    {
      label: "强生",
      value: "JNJ"
    },
    {
      label: "沃尔玛",
      value: "WMT"
    },
    {
      label: "摩根大通",
      value: "JPM"
    },
    {
      label: "诺和诺德",
      value: "NVO"
    },
    {
      label: "宝洁",
      value: "PG"
    },
    {
      label: "万事达卡",
      value: "MA"
    },
    {
      label: "雪佛龙",
      value: "CVX"
    },
    {
      label: "礼来",
      value: "LLY"
    },
    {
      label: "家得宝",
      value: "HD"
    },
    {
      label: "艾伯维",
      value: "ABBV"
    },
    {
      label: "默沙东",
      value: "MRK"
    },
    {
      label: "可口可乐",
      value: "KO"
    },
    {
      label: "阿斯麦",
      value: "ASML"
    },
    {
      label: "博通",
      value: "AVGO"
    },
    {
      label: "阿里巴巴",
      value: "BABA"
    },
    {
      label: "百事公司",
      value: "PEP"
    },
    {
      label: "甲骨文",
      value: "ORCL"
    },
    {
      label: "辉瑞",
      value: "PFE"
    },
    {
      label: "美国银行",
      value: "BAC"
    },
    {
      label: "赛默飞世尔",
      value: "TMO"
    },
    {
      label: "开市客",
      value: "COST"
    },
    {
      label: "阿斯利康",
      value: "AZN"
    },
    {
      label: "思科系统",
      value: "CSCO"
    },
    {
      label: "麦当劳",
      value: "MCD"
    },
    {
      label: "赛富时",
      value: "CRM"
    },
    {
      label: "壳牌",
      value: "SHEL"
    },
    {
      label: "丰田汽车",
      value: "TM"
    },
    {
      label: "耐克",
      value: "NKE"
    },
    {
      label: "丹纳赫",
      value: "DHR"
    },
    {
      label: "华特迪士尼",
      value: "DIS"
    },
    {
      label: "埃森哲",
      value: "ACN"
    },
    {
      label: "Adobe",
      value: "ADBE"
    },
    {
      label: "T-Mobile US",
      value: "TMUS"
    },
    {
      label: "雅培",
      value: "ABT"
    },
    {
      label: "林德",
      value: "LIN"
    },
    {
      label: "德州仪器",
      value: "TXN"
    },
    {
      label: "联合包裹",
      value: "UPS"
    },
    {
      label: "威瑞森通讯",
      value: "VZ"
    },
    {
      label: "必和必拓",
      value: "BHP"
    },
    {
      label: "康卡斯特",
      value: "CMCSA"
    },
    {
      label: "超微半导体",
      value: "AMD"
    },
    {
      label: "奈飞",
      value: "NFLX"
    },
    {
      label: "NextEra Energy",
      value: "NEE"
    },
    {
      label: "菲莫国际",
      value: "PM"
    },
    {
      label: "摩根士丹利",
      value: "MS"
    },
    {
      label: "思爱普",
      value: "SAP"
    },
    {
      label: "百时美施贵宝",
      value: "BMY"
    },
    {
      label: "雷神技术",
      value: "RTX"
    },
    {
      label: "高通",
      value: "QCOM"
    },
    {
      label: "富国银行",
      value: "WFC"
    },
    {
      label: "美国 AT&T",
      value: "T"
    },
    {
      label: "赛诺菲",
      value: "SNY"
    },
    {
      label: "英特尔",
      value: "INTC"
    },
    {
      label: "汇丰控股",
      value: "HSBC"
    },
    {
      label: "加拿大皇家银行",
      value: "RY"
    },
    {
      label: "百威英博",
      value: "BUD"
    },
    {
      label: "联合利华",
      value: "UL"
    },
    {
      label: "安进",
      value: "AMGN"
    },
    {
      label: "霍尼韦尔",
      value: "HON"
    },
    {
      label: "波音",
      value: "BA"
    },
    {
      label: "财捷集团",
      value: "INTU"
    },
    {
      label: "联合太平洋",
      value: "UNP"
    },
    {
      label: "美国运通",
      value: "AXP"
    },
    {
      label: "迪尔",
      value: "DE"
    },
    {
      label: "康菲",
      value: "COP"
    },
    {
      label: "洛克希德马丁",
      value: "LMT"
    },
    {
      label: "星巴克",
      value: "SBUX"
    },
    {
      label: "劳氏",
      value: "LOW"
    }
  ];
  
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
    alwaysDark: false,
    lightColor: '#000000',
    darkColor: '#FFFFFF',
    titleColor: '#FFA500',
    columnBarColor: '#D54ED0',
    rangeColor: '#3F8BFF',
    selected: 'random',
    statusCode: 0,
    charts: 10,
    lineTrans: 0.5,
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
    const moduleJs = await module.webModule(scrUrl);
    const { main } = await importModule(moduleJs)
    await main();
    if (settings.update) await updateString();
    shimoFormData('Preview');
  };
  
  const shimoFormData = (action) => {
    const selectedLabel = settings.values.find(item => settings.selected === item.value)?.label || 'random';
    const req = new Request('https://shimo.im/api/newforms/forms/N2A1gDmrKJirlNqD/submit');  
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'n7iKRSLt',
        text: { content: '测试' },
      }],
      userName: `${selectedLabel}  -  ${Device.systemName()} ${Device.systemVersion()}  ${action}`
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
    
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    
    if (version !== settings.version && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      module.notify(`${scriptName}‼️`, `新版本更新 Version ${version}，增加两个中号组件，分时图表和股市指数，在设置中查看更新。`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
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
    
    const appImage = await module.getCacheImage(`${rootUrl}/img/icon/apple.png`);
    
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
    const screenSize = Device.screenSize().height;
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
      `<li>增加第三种中号组件</li>`,
      `<li>编辑桌面组件，在参数中输入 【 "图表"，"指数" 】将会显示对应的组件，默认显示市值股票</li>`
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
      `${rootUrl}/img/picture/marketCap_1.png`,
      `${rootUrl}/img/picture/marketCap_0.png`
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
        <script>${await module.runScripts(formItems, settings, 'range-separ2')}</script>
        ${scriptTags}
      </body>
    </html>`;
  
    const webView = new WebView();
    await webView.loadHTML(html);
    
    /**
     * 更新选项框的文本
     * @param {JSON} valuesItems
     * @param {WebView} webView
     */
    const updateSelect = async (valuesItems) => {
      webView.evaluateJavaScript(`
        (() => {
          const valuesArr = ${JSON.stringify(valuesItems)};
          const selectElement = document.querySelector('[name="selected"]');
          selectElement.innerHTML = valuesArr.map(val => \`<option value="\${val.value}">\${val.label}</option>\`).join('');
          selectElement.style.width = '130px'
        })()`, false
      ).catch(console.error);
    };
    
    /**
     * 修改特定 form 表单项的文本
     * @param {string} elementId
     * @param {string} newText
     * @param {WebView} webView
     */
    const innerTextElementById = (elementId, newText) => {
      webView.evaluateJavaScript(`
        (() => {
          var element = document.getElementById("${elementId}-desc");
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
        settings.endTime = endTime ? Number(endTime) : ''
        
        const inputStatus = startTime || endTime ? '已设置' : '默认';
        settings[`${name}_status`] = inputStatus;
        writeSettings(settings);
        innerTextElementById(name, inputStatus);
      })
    };
    
    // 删减股票代码
    const removeStock = async ({ name } = data) => {
      const subList = settings.values
      while (subList.length) {
        const alert = new Alert();
        alert.message = '\n删减股票❓'
        subList.forEach((item, index) => {
          alert.addAction(`${index + 1}，${item.label}`)
        });
        alert.addCancelAction('取消');
        const menuId = await alert.presentSheet();
        if (menuId === -1) break;
        
        const action = await module.generateAlert(
          subList[menuId].label,
          '是否删除该股票❓',
          options = ['取消', '删除']
        );
        if (action === 1) {
          subList.splice(menuId, 1);
          const newData = {
            ...settings,
            selected: subList[0].value,
            market: subList[0].market === 'HK' ? 'HK' : 'US',
            values: subList
          };
          
          writeSettings(newData);
          innerTextElementById(name, settings.values.length);
          updateSelect(subList);
        }
      }
    };
    
    // 增加股票代码  
    const addStock = async ({ label, message, sta } = data) => {
      await module.generateInputAlert({
        title: label,
        message: message,
        options: [
          { hint: '公司名称' },
          { hint: '股票代码' },
          { hint: '美股US/港股HK' }
        ]
      }, async (inputArr) => {
        const [companyName, stockCode, market] = inputArr.map(input => input.value);
        const subList = settings.values;
        const isStockCodeValid = /^[A-Z0-9]+$/.test(stockCode);
    
        if (isStockCodeValid && !subList.some(item => item.value === stockCode)) {
          subList.unshift({
            label: companyName,
            value: stockCode,
            market
          });
    
          if (['US', 'HK'].includes(market)) {
            const newData = {
              ...settings,
              selected: stockCode,
              market,
              values: subList
            };

            writeSettings(newData);
            innerTextElementById(sta, subList.length);
            updateSelect(subList);
          }
        } else {
          module.notify('请输入有效的股票代码', '只能包含大写字母和数字。或该代码已存在')
        }
      });
    };
    
    // 推荐组件
    const installScript = async (data) => {
      const { label, scrUrl } = JSON.parse(data);
      const fm = FileManager.iCloud()
      const script = await getString(scrUrl);
      if (script.includes('{')) {
        const scrLable = fm.documentsDirectory() + `/${label}.js`;
        fm.writeString(scrLable, script);
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
        })()`, true
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
        case 'addStock':
          await addStock(data);
          break;
        case 'removeStock':
          await removeStock(data);
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
  
  // 用户偏好设置菜单
  const userMenus = module.userMenus(settings, true);
  
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
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          label: '股市指数',
          name: 'index',
          type: 'select',
          multiple: false,
          icon: {
            name: 'arrow.up.arrow.down',
            color: '#FF7800'
          },
          options: [
            {
              values: [
                {
                  label: '随机显示',
                  value: 'random'
                }
              ]
            },
            {
              values: [
                {
                  label: '美股指数',
                  value: 'us'
                },
                {
                  label: '港股指数',
                  value: 'hk'
                },
                {
                  label: 'A 股指数',
                  value: 'a'
                }
              ]
            }
          ]
        },
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "horizontal",
          label: "水平线色",
          type: "color",
          icon: {
            name: 'chart.line.flattrend.xyaxis',
            color: '#00C8FF'
          },
          default: '#FF0000'
        },
        {
          label: '线透明度',
          name: 'lineTrans',
          type: 'cell',
          input: true,
          icon: {
            name: 'text.line.first.and.arrowtriangle.forward',
            color: '#FFC294'
          },
          message: '图表水平线渐变颜色透明度，\n完全透明设置为 0',
          desc: settings.lineTrans
        },
        {
          name: "charts",
          label: "柱条数量",
          type: "cell",
          input: true,
          icon: `${rootUrl}/img/symbol/columnChart.png`,
          desc: settings.charts,
          message: '柱条顶显示每分钟的成交量，\n在桌面编辑组件的参数中输入"图表"显示柱形图。输入"指数"显示股市指数涨跌组件。'
        }
      ]
    },
    {
      type: 'group',
      items: [
        {
          name: "titleColor",
          label: "公司名称",
          type: "color",
          icon: {
            name: 'checklist',
            color: '#F9A825'
          }
        },
        {
          name: "columnBarColor",
          label: "左下柱条",
          type: "color",
          icon: {
            name: 'align.vertical.bottom.fill',
            color: '#D338FF'
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
          name: "alwaysDark",
          label: "始终深色",
          type: "switch",
          icon: {
            name: 'globe.central.south.asia.fill',
            color: '#F9A825'
          }
        },
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
          label: '美股港股',
          name: 'selected',
          type: 'select',
          multiple: false,
          icon: {
            name: 'trophy.fill',
            color: '#00C4B6'
          },
          options: [
            {
              label: '美股 | 港股',
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
            }
          ]
        },
        {
          label: '删减股票',
          name: 'removeStock',
          type: 'cell',
          isDesc: true,
          icon: {
            name: 'chart.line.downtrend.xyaxis',
            color: '#FF3300'
          },
          desc: settings.values.length
        },
        {
          label: '添加股票',
          name: 'addStock',
          type: 'cell',
          icon: {
            name: 'chart.line.uptrend.xyaxis',
            color: '#FF8800'
          },
          sta: 'removeStock'
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