// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: shopping-bag;

async function main() {
  const scriptName = 'Script Store'
  const version = '1.0.1'
  const updateDate = '2023年07月09日'
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const myRepo = 'https://github.com/95du/scripts';
  const pathName = '95du_Store';
  const appStoreLink = [
    'https://apps.apple.com/cn/app/剪映-轻而易剪/id1458072671',
    'https://apps.apple.com/cn/app/携程旅行-订酒店机票火车票/id379395415',
    'https://apps.apple.com/cn/app/小红书-你的生活指南/id741292507',
  ];
  
  /**
   * 创建，获取存储路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const directory = fm.documentsDirectory();
  const depPath = fm.joinPath(directory, '95du_module')
  if (!fm.fileExists(depPath)) fm.createDirectory(depPath);
  download95duModule(rootUrl);
  
  const mainPath = fm.joinPath(directory, pathName);
  const getSettingPath = () => {
    if (!fm.fileExists(mainPath)) {
      fm.createDirectory(mainPath);
    }
    return fm.joinPath(mainPath, 'setting.json');
  };

  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(getSettingPath(), JSON.stringify(settings, null, 2));
  };
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const DEFAULT_SETTINGS = {
    version,
    urls: [],
    effect: true,
    music: true,
    alwaysDark: false
  };
  
  const getSettings = (file) => {
    if (fm.fileExists(file)) {
      return { urls } = JSON.parse(fm.readString(file));
    } else {
      settings = DEFAULT_SETTINGS;
      writeSettings(settings);
      return settings;
    }
  };
  settings = await getSettings(getSettingPath()) || {};
  
  // 运行组件
  const ScriptableRun = (name = Script.name()) => {
    Safari.open('scriptable:///run/' + encodeURIComponent(name));
};
  
  // 获取头像图片
  const getAvatarImg = () => {
    const avatarImgPath = fm.joinPath(fm.documentsDirectory(), pathName);
    return fm.joinPath(avatarImgPath, 'userSetAvatar.png');
  };
    
  // 获取随机的值
  const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)] || null;
  
  /**
   * 弹出通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */  
  const notify = (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'piano_', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  /**
   * 版本更新时弹出窗口
   * @returns {String} string
   */
  const updateVersionNotice = () => {
    if ( version !== settings.version ) {
      settings.version = version;
      writeSettings(settings);
      return '.signin-loader';
    }
    return null
  };
  
  /**
   * @param message 内容
   * @param options 按键
   * @returns { Promise<number> }
   */
  const generateAlert = async (title, message, options, destructive) => {
    const alert = new Alert();
    alert.message = message;
    alert.title = title;
    options.forEach((option, i) => {
      i === 1 && destructive ? alert.addDestructiveAction(option) : alert.addAction(option);
    });
    return await alert.presentAlert();
  };
  
  /**
   * 弹出输入框
   * @param title 标题
   * @param desc  描述
   * @param opt   属性
   * @returns { Promise<void> }
   */
  const generateInputAlert = async (options, confirm) => {
    const { title, message, options: fieldArr } = options;
    const inputAlert = new Alert();
    inputAlert.title = title;
    inputAlert.message = message;
    fieldArr.forEach(({ hint, value }) => inputAlert.addTextField(hint, value))
    inputAlert.addAction('取消');
    inputAlert.addAction('确认');
    const getIndex = await inputAlert.presentAlert();
    if (getIndex === 1) {
      const inputObj = fieldArr.map(({ value }, index) => ({ index, value: inputAlert.textFieldValue(index) }));
      confirm(inputObj);
    }
    return getIndex;
  };
  
  /**
   * 获取css及js字符串和图片并使用缓存
   * @param {string} File Extension
   * @param {Image} Base64 
   * @returns {string} - Request
   */
  const cache = fm.joinPath(mainPath, 'cache_path');
  if (!fm.fileExists(cache)) {
    notify('正在初始化...', '首次运行需加载数据，请等待 15 秒。');
    fm.createDirectory(cache);
  };
  
  const useFileManager = () => {
    return {
      readString: (name) => {
        const path = fm.joinPath(cache, name);
        return fm.fileExists(path) ? fm.readString(path) : null
      },
      writeString: (name, content) => fm.writeString(fm.joinPath(cache, name), content),  
      // cache Image
      readImage: (name) => {
        const path = fm.joinPath(cache, name);
        return fm.fileExists(path) ? fm.readImage(path) : null;
      },
      writeImage: (name, image) => fm.writeImage(fm.joinPath(cache, name), image)
    }
  };
      
  /**
   * 获取css，js字符串并使用缓存
   * @param {string} string
   */
  const getString = async (url) => {
    return await new Request(url).loadString();
  };
  
  const getCacheString = async (cssFileName, cssFileUrl) => {
    const cache = useFileManager();
    const cssString = cache.readString(cssFileName);
    if (cssString) return cssString;
    const response = await getString(cssFileUrl);
    if (response.includes('{')) {
      cache.writeString(cssFileName, response);
    }
    return response;
  };
  
  /**
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const toBase64 = (img) => {
    return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`
  };
    
  const getImage = async (url) => await new Request(url).loadImage();
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if (image) return toBase64(image);
    const img = await getImage(url);
    cache.writeImage(name, img);
    return toBase64(img);
  };
  
  /**
   * Setting drawTableIcon
   * @param { Image } image
   * @param { string } string
   */  
  const getCacheMaskSFIcon = async (name, color) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if ( image ) return toBase64(image);
    const img = await drawTableIcon(name, color);
    cache.writeImage(name, img);
    return toBase64(img);
  };
  
  const drawTableIcon = async (
    icon = 'square.grid.2x2',
    color = '#e8e8e8',
    cornerWidth = 39
  ) => {
    const sfi = SFSymbol.named(icon);
    sfi.applyFont(  
      Font.mediumSystemFont(30)
    );
    const imgData = Data.fromPNG(sfi.image).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />`;
      
    const js = `
      const canvas = document.createElement("canvas");
      const sourceImg = document.getElementById("sourceImg");
      const silhouetteImg = document.getElementById("silhouetteImg");
      const ctx = canvas.getContext('2d');
      const size = sourceImg.width > sourceImg.height ? sourceImg.width : sourceImg.height;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(sourceImg, (canvas.width - sourceImg.width) / 2, (canvas.height - sourceImg.height) / 2);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pix = imgData.data;
      for (var i=0, n = pix.length; i < n; i+= 4){
        pix[i] = 255;
        pix[i+1] = 255;
        pix[i+2] = 255;
        pix[i+3] = pix[i+3];
      }
      ctx.putImageData(imgData,0,0);
      silhouetteImg.src = canvas.toDataURL();
      output=canvas.toDataURL()
    `;
  
    let wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    const iconImage = await new Request(base64Image).loadImage();
    const size = new Size(160, 160);
    const ctx = new DrawContext();
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    ctx.size = size;
    const path = new Path();
    const rect = new Rect(0, 0, size.width, size.width);
  
    path.addRoundedRect(rect, cornerWidth, cornerWidth);
    path.closeSubpath();
    ctx.setFillColor(new Color(color));
    ctx.addPath(path);
    ctx.fillPath();
    const rate = 36;
    const iw = size.width - rate;
    const x = (size.width - iw) / 2;
    ctx.drawImageInRect(iconImage, new Rect(x, x, iw, iw));
    return ctx.getImage();
  };
  
  /**
   * SFIcon 转换为base64
   * @param {*} icon SFicon
   * @returns base64 string
   */
  const drawSFIcon = async ( icon = name ) => {
    let sf = SFSymbol.named(icon);
    if (sf === null) sf = SFSymbol.named('message');
    sf.applyFont(  
      Font.mediumSystemFont(30)
    );
    return sf.image;
  };
  
  // 缓存并读取原生 SFSymbol icon
  const getCacheDrawSFIcon = async (name) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if (image) return toBase64(image);
    const img = await drawSFIcon(name);
    cache.writeImage(name, img);
    return toBase64(img);
  };
  
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
      const moduleJs = await new Request(`${rootUrl}/update/_95du.js`).load();
      fm.write(modulePath, moduleJs);
      fm.writeString(timestampPath, currentDate);
      console.log('Module updated');
    }
  };
  
  // shimoFormData(action)
  const shimoFormData = async (action) => {
    const req = new Request('https://shimo.im/api/newforms/forms/gXqmdJ0WaRiZJ03o/submit');
    req.method = 'POST';
    req.headers = {
      'Content-Type': 'application/json;charset=utf-8',
    };
    req.body = JSON.stringify({
      formRev: 1,
      responseContent: [{
        type: 4,
        guid: 'oXsoTl07',
        text: { content: '' }
      }],
      userName: `${scriptName}  -  ${Device.systemName()} ${Device.systemVersion()}  ${action}`
    });
    await req.loadJSON();
  };
  
  // apple appStore Details
  const getAppDetails = async (appStoreLink) => {
    const appId = appStoreLink.match(/\/id(\d+)/)[1];
    const url = `https://itunes.apple.com/cn/lookup?id=${appId}&timestamp=${Date.now()}`;
    let results;
  
    try {
      const response = await new Request(url).loadJSON();
      results = response.results;
    } catch (error) {
      console.log("iTunes API 请求失败，改用备用链接。");
      // 从备用链接获取数据
      const backupUrl = 'https://raw.githubusercontent.com/95du/scripts/master/update/ChatGPT.json';
      const backup = await new Request(backupUrl).loadJSON();
      results = backup.results;
    }
  
    const { trackName, currentVersionReleaseDate, screenshotUrls } = results[0];
    const match = trackName.match(/(.+)-/);
    const trackname = match ? match[1].trim() : trackName.trim();
    const date = currentVersionReleaseDate.replace(/(\d{4})-(\d{2})-(\d{2}).*/, '$1年$2月$3日');
    const randomScreenshots = screenshotUrls.sort(() => 0.5 - Math.random()).slice(0, 3);
  
    return {
      ...results[0],
      trackName: trackname,
      screenshotUrls: randomScreenshots,
      currentVersionReleaseDate: date
    };
  };
  
  const appStoreUrl = getRandomItem(appStoreLink);
  const {
    trackName,
    version: _version,
    artworkUrl512,
    currentVersionReleaseDate: releaseDate,
    screenshotUrls
  } = await getAppDetails(appStoreUrl);
  
  const tracknameImage = await getCacheImage(`${trackName}.png`, artworkUrl512);
  
  /**  
   * 获取多个 GitHub 仓库的信息，包括用户名、更新时间、头像 URL 等。
   */
  const repoUrls = (settings.urls.length > 0 ? urls : [myRepo]).map(url => {
    const match = url.match(/github\.com\/([\w-]+\/[\w-]+)/);
    if (match) return `https://api.github.com/repos/${match[1]}`;
  }).filter(Boolean);
  
  const getRepoOwnerInfo = async (repoUrl) => {
    const { updated_at, html_url, watchers, owner } = await new Request(repoUrl).loadJSON();
    return { 
      updated_at, 
      html_url,
      watchers,
      userName: owner.login, 
      avatarUrl: owner.avatar_url 
    };
  };
  
  const formatDate = (date) => {
    const dateObj = new Date(new Date(date).getTime() + 28800000);
    const dateStr = dateObj.toISOString().slice(0, 16).replace('T', '日 ');
    return dateStr.replace(/(\d{4})-(\d{2})-(\d{2})日 (\d{2}:\d{2})/, '$1年$2月$3日 $4');
  };
  
  const repoItems = (await Promise.all(  
    repoUrls.map(async (url) => {
      try {
        const { updated_at, html_url, watchers, userName, avatarUrl } = await getRepoOwnerInfo(url);
        return {
          label: userName,
          desc: formatDate(updated_at),
          version: watchers,
          name: 'repo',
          type: 'button',
          scrUrl: html_url,
          icon: avatarUrl
        };
      } catch {
        console.log(`API次数限制或网络出错无法请求数据，请稍后再试: ${url}\n`);
        return null;
      }
    })
  )).filter(Boolean);
  
  // 组件列表
  const formItems = [
    {
      type: 'group',
      items: [{
        label: '组件效果图',
        name: 'effect',
        type: 'page',
        default: true
      }]
    },
    {
      label: 'GitHub仓库',
      type: 'group',
      items: repoItems
    },
    {
      type: 'group',
      items: [
        {
          label: '添加仓库',
          name: 'urls',
          type: 'cell',
          input: true,
          message: '请输入仓库链接，可在此显示仓库更新时间，并支持添加多个链接',
          icon: 'person.circle.fill'
        },
        {
          label: '删减仓库',
          name: 'removeRepo',
          type: 'cell',
          icon: 'trash.circle.fill'
        },
        {
          label: '预览组件',
          name: 'preview',
          type: 'cell',
          icon: 'questionmark.circle.fill'
        },
        {
          label: '始终深色',
          name: 'alwaysDark',
          type: 'switch',
          icon: 'moon.circle.fill'
        },
        {
          label: '背景音乐',
          name: 'music',
          type: 'switch',
          icon: 'speaker.wave.2.circle.fill'
        }
      ]
    },
    {
      label: '最新发布',
      type: 'group',
      items: [
        {
          label: '中国联通',
          desc: '剩余流量、语音、余额',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_china_unicom.js`,
          icon: `${rootUrl}/img/icon/china_unicom.png`
        },
        {
          label: '中国电信_3',
          desc: '剩余流量、语音、余额',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_china_telecom_3.js`,
          icon: `${rootUrl}/img/icon/telecom.png`
        },
      ]
    },
    {
      label: '交通出行',
      type: 'group',
      items: [
        {
          label: '交管12123',
          desc: '违章信息、驾驶证信息',
          version: '1.2.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_12123.js`,
          icon: `${rootUrl}/img/icon/12123.png`
        },
        {
          label: '全国油价_2',
          desc: '每日油价，油价预警',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_oil_price.js`,
          icon: `${rootUrl}/img/icon/oilPrice2.png`
        },
        {
          label: '高德智慧交通',
          desc: '普通、快速、高速路通行实况',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/congest_4.js`,
          icon: `${rootUrl}/img/icon/aMap.png`
        },
        {
          label: '高德家人地图',
          desc: '位置、天气、步数、状态',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_amap_family.js`,
          icon: `${rootUrl}/img/icon/aMap_1.png`
        },
        {
          label: '高德会员',
          desc: '会员福利中心',
          version: '1.1.0',
          type: 'button',
          scrUrl: `${rootUrl}/run/web_module_amap_vip.js`,
          icon: `${rootUrl}/img/icon/aMap_vip.png`
        },
        {
          label: '重点区域实况',
          desc: '旅游景区，客运枢纽、购物中心',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/widget/congest_3.js`,
          icon: `${rootUrl}/img/icon/gateway.jpeg`
        },
        {
          label: '城市通行实况',
          desc: '城市实时拥堵，早晚高峰',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/congest_2.js`,
          icon: `${rootUrl}/img/icon/baidu_map.png`
        },
        {
          label: '景区通行实况',
          desc: '重点城市景区实时拥堵',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/congest_1.js`,
          icon: `${rootUrl}/img/icon/scenic_area.png`
        },
        {
          label: '百度智慧交通',
          desc: '全国重点城市实时拥堵',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/congest.js`,
          icon: `${rootUrl}/img/icon/baidu_map.png`
        },
        {
          label: '车辆_GPS',
          desc: '行车速度，实时定位',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_GPS.js`,
          icon: `${rootUrl}/img/icon/gps_location.png`
        }
      ]
    },
    {
      label: '新版组件',
      type: 'group',
      items: [
        {
          label: '节日倒计时',
          desc: '节日，西方节日，节气',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/festival.js`,
          icon: `${rootUrl}/img/icon/festival.png`
        },
        {
          label: '开奖结果',
          desc: '体育彩票、福利彩票',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/web_module_lottery.js`,
          icon: `${rootUrl}/img/icon/lottery.png`
        },
        {
          label: '中国电信_2',
          desc: '剩余流量、语音、余额',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_china_telecom.js`,
          icon: `${rootUrl}/img/icon/telecom_2.png`
        },
        {
          label: '市值股票',
          desc: '美股港股全球 Top80',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_marketCap.js`,
          icon: `${rootUrl}/img/icon/marketCap.png`
        },
        {
          label: '豆瓣电影_Top250',
          desc: '随机显示250部电影',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/widget/douban_top250.js`,
          icon: `${rootUrl}/img/icon/douban.png`
        },
        {
          label: '人民币汇率',
          desc: '常用国际货币汇率',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/run/web_module_exchange_rate.js`,
          icon: `${rootUrl}/img/icon/exchange_rate.png`
        },
        {
          label: '埃隆·马斯克',
          desc: '最新前沿科技资讯',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/widget/elonMusk_info.js`,
          icon: `${rootUrl}/img/icon/AI.jpeg`
        }
      ]
    },
    {
      label: '推荐使用',
      type: 'group',
      items: [
        {
          label: 'jumpStore',
          type: 'app',
          scrUrl: appStoreUrl,
          data: {
            name: trackName,
            desc: `版本 ${_version}`,
            date: releaseDate,
            appUrl: tracknameImage,
            images: screenshotUrls
          }
        },
      ]
    },
    {
      label: '桌面组件',
      type: 'group',
      items: [
        {
          label: '全国油价',
          desc: '每日油价，油价预警',
          version: '1.2.0',
          type: 'button',
          scrUrl: `${rootUrl}/widget/oils.js`,
          icon: `${rootUrl}/img/icon/oilPrice2.png`
        },
        {
          label: '负一屏底栏',
          desc: '显示未来两小时天气',
          version: '1.5.0',
          type: 'button',
          recommend: true,
          scrUrl: `${rootUrl}/widget/bottomBar.js`,
          icon: `${rootUrl}/img/icon/bottomBars.png`
        },
        {
          label: '南网在线',
          desc: '昨日用电量，账单',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_powerGrid.js`,
          icon: `${rootUrl}/img/icon/electric.png`
        },
        {
          label: '澳门六合彩',
          desc: '新旧版每日开奖结果',
          version: '1.1.0',
          type: 'button',
          scrUrl: `${rootUrl}/run/module_macaujc.js`,
          icon: `${rootUrl}/img/icon/macaujc.png`
        },
        {
          label: '房屋估值',
          desc: '幸福里全国房屋估值',
          version: '1.0.0',
          type: 'button',
          scrUrl: `${rootUrl}/widget/housePrice.js`,
          icon: `${rootUrl}/img/icon/house.png`
        },
        {
          label: '循环组件',
          desc: '循环切换显示小组件',
          version: '1.0.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/widget/loopScripts.js`,
          icon: `${rootUrl}/img/icon/loopScript.png`
        },
        {
          label: '随机组件',
          desc: '随机切换多个小组件',
          version: '1.1.5',
          type: 'button',
          scrUrl: `${rootUrl}/widget/randomScript.js`,
          icon: `${rootUrl}/img/icon/random_2.jpeg`
        }
      ]
    },
    {
      label: '京东系列',
      type: 'group',
      items: [
        {
          label: '京东',
          desc: '京豆、农场、签到等',
          version: '1.0.0',
          type: 'button',
          scrUrl: `${rootUrl}/run/web_module_jingDong.js`,
          icon: `${rootUrl}/img/icon/jd.png`
        },
        {
          label: '京东收支账单',
          desc: '每月收支账单、白条',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_jingDong_bill.js`,
          icon: `${rootUrl}/img/icon/jingDong.png`
        },
        {
          label: '京东小白鹅',
          desc: '白条信息、白条等级',
          version: '1.1.0',
          type: 'button',
          recommend: true,
          random: true,
          scrUrl: `${rootUrl}/run/web_module_jingDong_baiTiao.js`,
          icon: `${rootUrl}/img/icon/jingDong.png`
        },
        {
          label: '京东小金库',
          desc: '资产，累积收益',
          version: '1.1.0',
          type: 'button',
          scrUrl: `${rootUrl}/run/web_module_jingDong_treasury.js`,
          icon: `${rootUrl}/img/jingdong/finance.png`,
        },
        {
          label: '京东汪汪',
          desc: '汪汪庄园30张Joy图',
          version: '1.1.0',
          type: 'button',
          scrUrl: `${rootUrl}/run/module_jd_Joy.js`,
          icon: `${rootUrl}/img/icon/jd_wangWang.png`
        }
      ]
    },
    {
      label: '工具类',
      type: 'group',
      items: [
        {
          label: '支付宝_SchemeUrl',
          desc: '跳转支付宝App指定页面',
          version: '1.0.0',
          type: 'button',
          scrUrl: `${rootUrl}/widget/alipay_schemeUrl.js`,
          icon: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/08/6b/da/086bdadb-643e-e7dd-f508-761c3d8d0258/AppIcon2-0-0-1x_U007emarketing-0-7-0-0-85-220.png/512x512bb.png'
        },
        {
          label: 'JD_SchemeUrl',
          desc: '跳转京东App指定页面',
          version: '1.0.0',
          type: 'button',
          scrUrl: `${rootUrl}/widget/jd_schemeUrl.js`,
          icon: `${rootUrl}/img/icon/jd_green.png`
        },
        {
          label: '清空回收站',
          desc: '清空Scriptable回收站',
          version: '1.0.1',
          type: 'button',
          scrUrl: `${rootUrl}/widget/cleanTrash.js`,
          icon: `${rootUrl}/img/icon/cleanFiles.png`
        }
      ]
    },
    {
      type: 'group',
      items: [{
        label: '退出登录',
        name: 'exit',
        type: 'restart',
        default: true
      }]
    },
  ];
  
  // 获取recommend为true的对象
  const recommended = formItems.reduce((acc, group) => {
    const recommendedItems = group.items.filter(item => item.recommend);
    acc.push(...recommendedItems);
    return acc;
  }, []);
  
  if (!settings.items || config.runsInApp) {
    settings.items = recommended;
    writeSettings(settings);
  };
  
  const findChangedVersion = (array1, array2) => {
    const changedItems = [];
    for (const item1 of array1) {
      const item2 = array2.find(i => i.label === item1.label);
      if (item2 && item2.version !== item1.version) {
        item2.update = true;
        changedItems.push(item2);
      }
    }
    return changedItems;
  };
  
  const changedItems = findChangedVersion(settings.items, recommended);
  // 判断返回哪个数组
  const resultArray = findChangedVersion(settings.items, recommended).length > 0 ? recommended : settings.items;
  
  const randomObjects = resultArray.filter(({ random }) => random);
  const randomObject = getRandomItem(randomObjects);
  const newData = resultArray.filter(item => !item.random).concat(randomObject);
  
  // 获取排列样式
  const getRank = async (stack, { column }) => {
    let i = -1;
    const rows = [];
    const add = async (fn) => {
      i++;
      if (i % column === 0) {
        stack.layoutVertically();
        rows.push(stack.addStack());
      }
      const r = Math.floor(i / column);
      await fn(rows[r]);
    };
    return { add };
  };
  
  // 添加数组
  const addItem = async (widget, item, index, lastIndex) => {
    const stack = widget.addStack();
    stack.layoutHorizontally();
    stack.centerAlignContent();
    stack.size = new Size(-1, 13 + 7)
    stack.url = `scriptable:///run/${encodeURIComponent(Script.name())}`

    const indexStack = stack.addStack();
    indexStack.size = new Size(18, 0)
    
    const indexText = indexStack.addText(String(index));
    const textColor =
      index <= 3 ? new Color('#FF0000') : 
      index <= 6 ? new Color('#FCA100') : 
      new Color('#00C400');
    indexText.textColor = textColor;
    indexText.font = Font.boldSystemFont(14);
    stack.addSpacer(4);
  
    const titleText = stack.addText(item.label);
    if (settings.alwaysDark) {
      titleText.textColor = Color.white();
    }
    titleText.font = Font.mediumSystemFont(13.5);
    titleText.textOpacity = 0.9;
    stack.addSpacer(8);
  
    const versionText = stack.addText(item.version);
    versionText.font = Font.mediumSystemFont(14);
    versionText.textColor = item.update ? new Color('#FF65FF') : index === lastIndex ? Color.orange() : Color.blue();
    stack.addSpacer();
  };
  
  // 创建组件
  const createWidget = async (data) => {
    const widget = new ListWidget();
    widget.setPadding(15, 18, 15, 18)
    if (settings.alwaysDark) {
      widget.backgroundColor = Color.black();  
    }
    const stackItems = widget.addStack();
    const { add } = await getRank(stackItems, { column: 2 });
    
    const max = 7 * 2
    for (let i = 0; i < max; ++i) {
      await add(stack => addItem(stack, data[i], i + 1, max));
    };
    
    if (config.runsInApp) {
      await widget.presentMedium();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
  };
  
  // ====== web start ======= //
  const renderAppView = async (options) => {
    const {
      formItems = [],
      head,
      avatarInfo
    } = options;
    
    const themeColor = Device.isUsingDarkAppearance() ? 'dark' : 'white';

    const appleHub_light = await getCacheImage('white.png', `${rootUrl}/img/picture/appleHub_white.png`);
    const appleHub_dark = await getCacheImage('black.png', `${rootUrl}/img/picture/appleHub_black.png`);
    
    const authorAvatar = fm.fileExists(getAvatarImg()) ? await toBase64(fm.readImage(getAvatarImg()) ) : await getCacheImage('author.png', `${rootUrl}/img/icon/4qiao.png`);
    
    const scripts = ['jquery.min.js', 'bootstrap.min.js', 'loader.js'];
    const scriptTags = await Promise.all(scripts.map(async (script) => {
      const content = await getCacheString(script, `${rootUrl}/web/${script}%3Fver%3D8.0.1`);
      return `<script>${content}</script>`;
    }));
    
    const getAndBuildIcon = async (item) => {
      const { icon } = item;
      if (icon?.name) {
        const { name, color } = icon;
        item.icon = await getCacheMaskSFIcon(name, color);
      } else if (icon?.startsWith('https')) {
        const name = icon.split('/').pop();
        item.icon = await getCacheImage(name, icon);
      } else if (icon) {
        item.icon = await getCacheDrawSFIcon(icon);
      }
    };
    
    const getAndBuildImage = async (item, urls) => {
      item.data.images = await Promise.all(urls.map(async (url) => {
        const name = /\/([^/]+\.(?:jpeg|png|jpg))/.exec(url)?.[1];
        return await getCacheImage(name, url);
      }));
    };
    
    for (const i of formItems) {
      for (const item of i.items) {
        (item.data?.images?.length) ? await getAndBuildImage(item, item.data.images) : await getAndBuildIcon(item);
      }
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
      --card-background: #fff;
      --desc-background: #86868b;
      --card-radius: 10px;
      --list-header-color: rgba(60,60,67,0.6);
      --update-desc: hsl(0, 0%, 20%);
    }
    
    .btn-block {
      display: block;
      width: 100%;
      height: 32px;
      font-size: 14.5px;
    }
    
    .fade {
      opacity: 0;
      transition: opacity .15s linear;
    }
    
    .fade.in {
      opacity: 1;
    }
    
    .modal {
      position: fixed;
      top: -5%;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1050;
      display: none;
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      outline: 0;
    }
    
    .modal.fade .modal-dialog {
      transform: translate(0,-25%);
      transition: transform .3s ease-out;
    }
    
    .modal.in .modal-dialog {
      transform: translate(0,0);
    }
    
    .modal-open .modal {
      overflow-x: hidden;
      /* overflow-y: auto; 纵向滑动 */
    }
    
    .modal-open {
      /* overflow: hidden; 弹窗滚动 */
    }
    
    .modal-dialog {
      position: relative;
      width: auto;
      margin: ${Device.screenSize().height < 926 ? '62px' : '78px'};
      bottom: ${183 + (settings.urls.length * 4 )}%; /* 弹窗位置: 每加一个组件 + 4 */
    }
    
    .modal-backdrop {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      z-index: 1040;
      background-color: #000;
    }
    
    .modal-backdrop.fade {
      opacity: 0;
    }
    
    .modal-backdrop.in {
      opacity: .5;
    }
    
    .modal.fade .modal-dialog {
      transform: scale(.9);
      transition: transform .5s cubic-bezier(.32,.85,.45,1.18),width .3s;
    }
    
    .modal.in .modal-dialog {
      transform: scale(1);
    }
    
    /* 弹窗 body f04494 */
    body {
      --theme-color: #ff6800;
      --focus-color: var(--theme-color);
      --main-color: #4e5358;
      --main-shadow: rgba(116, 116, 116, 0.08);
      --main-bg-color: #fff;
      --main-radius: 25px;
      --blur-bg: rgba(255, 255, 255, 0.75);
    }
    
    a:focus,a:hover {
      color: var(--focus-color);
      outline: 0;
      text-decoration: none;
    }
    
    .scriptable-widget {
      clear: both;
      background: var(--main-bg-color);
      padding: 15px;
      box-shadow: 0 0 10px var(--main-shadow);
      border-radius: var(--main-radius);
      margin-bottom: 20px;
    }
    
    .blur-bg {
      -webkit-backdrop-filter: saturate(5) blur(20px);
      backdrop-filter: saturate(5) blur(20px);
      background: var(--blur-bg);
    }
    
    .box-body,.box-header {
      padding: 20px 20px 10px 20px;
    }
    
    .badg.radius,.but.radius,.radius>.but {
      border-radius: 50px;
      padding: .3em 1em;
    }
    
    .jb-blue,.jb-cyan,.jb-green,.jb-pink,.jb-purple,.jb-red,.jb-vip,.jb-vip2,.jb-yellow {
      color: var(--this-color);
      background: var(--this-bg);
      --this-color: #fff;
    }
    
    .jb-blue,.jb-cyan,.jb-green,.jb-pink,.jb-purple,.jb-red,.jb-vip,.jb-vip2,.jb-yellow {
      border: none;
    }
    
    .jb-yellow{
      --this-bg: linear-gradient(135deg, #f59f54 10%, #ff6922 100%);
    }
    
    .jb-vip {  
      --this-bg: linear-gradient(25deg, #eabe7b 10%, #f5e3c7 70%, #edc788 100%);
      --this-color: #866127;
    }
      
    .title-h-center:before {
      position: absolute;
      content: "";
      width: 40px;
      height: 3px;
      background: var(--theme-color);
      top: auto;
      left: 0;
      right: 0;
      margin: auto;
      bottom: 3px;
      border-radius: 5px;
      box-shadow: 1px 1px 3px -1px var(--theme-color);
      transition: 0.4s;
    }
    
    .title-h-center {
      position: relative;
      padding-bottom: 7px;
    }
    
    .title-h-center:hover:before {
      width: 100px;
    }
    
    .separator {
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      color: #86868b;
      font-size: 14px;
    }
    
    .separator::after,
    .separator::before {
      content: "";
      max-width: 23%;
      height: 1px;
      margin: 0 1em;
      flex: 1;
      background-color: rgba(128, 128, 128, 0.5);
    }
    
    .sign-logo {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .sign-logo img {
      max-width: 180px;
      max-height: 60px;
    }
    
    /* 弹窗 content */
    .popup-title {
      text-align: center;
      font-size: 20px;
      margin-top: -18px;
      margin-bottom: 5px;
      font-weight: 500;
    }
    
    .popup-version {
      text-align: center;
      font-size: 16px;
      color: var(--update-desc);
    }
    
    .popup-content {
      margin-left: 12px;
      color: var(--update-desc);
    }
    
    /** 头像开始 **/
    .gif {
      display: none; /* 初始隐藏 */
      width: 100%;
      height: auto;
    }
    
    .form-item-auth {
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 3.8em;
      padding: 0.8em 18px;
      position: relative;
    }
    
    .form-item-auth-name {
      margin: 0px 12px;
      font-size: 18px;
      font-weight: 420;
    }
    
    .form-item-auth-desc {
      margin: 0px 12px;
      font-size: 14px;
      color: var(--desc-background);
    }
    
    .form-label-author-avatar {
      width: 58px;
      height: 58px;
      border-radius:50%;
      border: 1px solid #F6D377;
    }
    
    .centered-image {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 0px;
    }
    /** 头像结束 **/
    
    /* 跳转提示框开始 */  
    .popup {
      position: fixed;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #1B9AF1;
      font-size: 14px;
      color: #fff;
      border-radius: 50px;
      padding: 10px;
      width: 130px;
      height: 20px;
      opacity: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      text-align: center;
      transition: top 0.7s ease-in-out, opacity 0.5s ease-in-out;
    }
    
    .popup.show {
      top: 1.25%;
      opacity: 1;
    }
    
    .fd {
      animation: fd 0.15s ease-in-out;
    }
    
    @keyframes fd {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    /* 跳转提示框结束 */
    
    /* 打字机动画 */  
    .typing-indicator {
      display: inline-block;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background-color: #000;
      margin-left: 8px;
      vertical-align: middle;
      animation: typing-dot 0.4s infinite;
    }
    /* 打字机动画结束 */
    
    body {
      margin: ${!settings.music ? '70px' : '60px'} 0;
      -webkit-font-smoothing: antialiased;
      font-family: "SF Pro Display","SF Pro Icons","Helvetica Neue","Helvetica","Arial",sans-serif;
      accent-color: var(--color-primary);
      font-size: 14px;
      line-height: 1.42857143;
      color: #333;
      background: #f2f2f7;
    }
    
    .restart-text {
      font-family: 'Roboto', sans-serif;
      color: #0072FF;
      font-weight: lighter;
    }
    
    button {
      font-weight: 700;
      font-size: 15px;
      border-radius: 20px;
      border: none;
      background: var(--checkbox, #eeeeef);
      padding: 0.15em 1em 0.15em 1em;
    }
    
    .list {
      margin: 15px;
    }
    
    .list__header {
      margin: 0 20px;
      color: var(--list-header-color);
      font-size: 13px;
    }
    
    .list__body {
      margin-top: 6px;
      margin-bottom: 30px;
      background: var(--card-background);
      border-radius: var(--card-radius);
      overflow: hidden;
    }
    
    .custom-iframe {
      height: 0px;
    }
    
    .form-item,
    .from-music {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 16px;
      position: relative;
    }
    
    .form-item {
      min-height: 3.8em;
      padding: 0.3em 20px;
    }
    
    .from-music {
      min-height: 2.2em;
      padding: 0.3em 20px 0.3em 8px;
    }
    
    .form-item + .form-item::before {
      content: "";
      position: absolute;
      top: 0;
      left: 20px;
      right: 0;
      border-top: 0.5px solid var(--divider-color);
    }
    
    .form-item .iconfont {
      margin-right: 0px;
    }
    
    .icon-arrow_right {
      color: #86868b;
      font-size: 16px;
    }
    
    .form-item-right-desc {
      font-size: 14px;
      color: #86868b;
      /* margin: 0 6px 0 auto; */
      max-width: 100px;
      max-height: 15px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: flex;
      justify-content: center;
    }
    
    .form-label {
      display: flex;
      align-items: center;
    }
    
    .form-label-img {
      height: 46px;
      border-radius: 12px;
      border: 1px solid var(--solid-color, #ddd);
    }
    
    .form-label-title {
      margin-left: 12px;
      font-weight: 420;
    }
    
    .form-label-desc {
      margin: 0px 12px;
      font-size: 13px;
      color: var(--desc-background);
    }
    
    .formItems-label-img {
      width: 35px;
      height: 35px;
      padding: 0 7.5px 0 18px;
    }
    
    input[type='checkbox'][role='switch'] {
      position: relative;
      display: inline-block;
      appearance: none;
      width: 46.6px;
      height: 28px;
      border-radius: 28px;
      background: var(--checkbox, #ddd);
      transition: 0.3s ease-in-out;
    }
    
    input[type='checkbox'][role='switch']::before {
      content: '';
      position: absolute;
      left: 2px;
      top: 2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #fff;
      transition: 0.3s ease-in-out;
    }
    
    input[type='checkbox'][role='switch']:checked {
      background: #34C759;
    }
    
    input[type='checkbox'][role='switch']:checked::before {
      transform: translateX(18.6px);
    }
    
    .actions {
      margin: 15px;
    }
    
    .copyright {
      margin: 15px;
      margin-inline: 18px;
      font-size: 12px;
      color: #86868b;
    }
    
    .copyright a {
      color: #515154;
      text-decoration: none;
    }
    
    /* AppStore 样式 */
    .app {
      background: var(--card-background);
      border-radius: var(--card-radius);
      overflow: hidden;
    }
  
    .app-head {
      display: flex;
      padding: 18px 20px;
    }
    
    .app-icon {
      width: 60px;
      height: 60px;
      background: #eee;
      border-radius: 15px;
      border: 1px solid var(--solid-color, #eee);
      object-fit: cover;
    }
    
    .app-right {
      margin-left: 1em;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .app-name {
      font-size: 16px;
      font-weight: bold;
    }
    
    .app-desc {
      font-size: 0.85em;
      color: var(--desc-background);
    }
    
    .app-score {
      font-size: 0.85em;
      color: var(--desc-background);
    }
    
    .app-imgs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      column-gap: 0.5rem;
      padding: 0 1.25rem 1.125rem 1.25rem;
    }
    
    .app-img {
      width: 100%;
      aspect-ratio: 392 / 848;
      background: #eee;
      border-radius: 0.9rem;
      object-fit: cover;
    }
    /* AppStore 结束 */
    
    .icon-loading {
      display: inline-block;
      animation: 1s linear infinite spin;
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0);
      }
    
      100% {
        transform: rotate(1turn);
      }
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --divider-color: rgba(84,84,88,0.65);
        --card-background: #1c1c1e;
        --list-header-color: rgba(235,235,245,0.6);
        --checkbox: #454545;
        --solid-color: #1c1c1e;
        --desc-background: darkGrey;
        --update-desc: hsl(0,0%,80%);
      }
      
      .white-theme, .dark-theme {
        --blur-bg: rgba(50,51,53,0.8);
      }
    
      body {
        background: #000;
        color: #fff;
      }
    }`;
    
    // Java Script
    const js =`
    (() => {
    const settings = ${JSON.stringify({
      ...settings
    })}
    const formItems = ${JSON.stringify(formItems)}
  
    window.invoke = (code, data) => {
      window.dispatchEvent(
        new CustomEvent('JBridge', { detail: { code, data } })
      )
    }
    
    const formData = {};
    const createFormItem = ( item ) => {
      const value = settings[item.name] ?? item.default
      formData[item.name] = value;
      
      const label = document.createElement("label");  
      label.classList.add("form-item");
      if (item.type !== 'button') label.classList.add("from-music");
      label.dataset.name = item.name;
      
      const div = document.createElement("div");
      div.className = 'form-label';
      label.appendChild(div);
      
      if (item.icon) {
        const img = document.createElement("img");
        img.src = item.icon;
        img.className = item.type === 'button' ? 'form-label-img' : 'formItems-label-img'
        div.appendChild(img);
      }
      
      const divWrapper = document.createElement("div");
      const divTitle = document.createElement("div");
      divTitle.className = 'form-label-title';
      divTitle.innerText = item.label
      divWrapper.appendChild(divTitle);
      
      if (item.desc) {
        const divDesc = document.createElement("div");
        divDesc.className = 'form-label-desc';
        divDesc.innerText = item.desc
        divWrapper.appendChild(divDesc);
      }
      div.appendChild(divWrapper);
        
      if (['cell', 'button', 'page', 'restart'].includes(item.type)) {
        const labelClickHandler = ( e ) => {
          const { name } = item;
          const methodName = name === 'effect' ? 'itemClick' : name;
          invoke(methodName, item);
        };
        label.addEventListener('click', labelClickHandler);
      
        const addIconOrDesc = () => {
          if (['cell', 'page'].includes(item.type)) {
            const icon = document.createElement('i');
            icon.className = 'iconfont icon-arrow_right';
            label.appendChild(icon);
          } else if (item.type === 'restart') {
            label.classList.add('restart-text');
          } else {
            const cntr = document.createElement('div');
            
            const button = document.createElement('button');
            button.name = 'button';
            button.innerText = item.name === 'repo' ? '打开' : '获取';
            button.className = 'iconfont icon-arrow_bottom';
            cntr.appendChild(button);
            
            const desc = document.createElement("div");
            desc.className = 'form-item-right-desc';
            desc.innerText = item.version;
            cntr.appendChild(desc);
            button.addEventListener('click', () => button.style.color = 'darkGray');
      
            label.appendChild(cntr);
          }
        };
        addIconOrDesc();
      } else {
        const input = document.createElement("input")
        input.className = 'form-item__input'
        input.name = item.name
        input.type = item.type
        input.enterKeyHint = 'done'
        input.value = value
        
        if (item.type === 'switch') {
          input.type = 'checkbox'
          input.role = 'switch'
          input.checked = value
        }
        input.addEventListener("change", (e) => {
          formData[item.name] =
            item.type === 'switch'
            ? e.target.checked
            : e.target.value;
          invoke('changeSettings', formData);  
          
          iframe.src = !formData.music ? '' : iframe.getAttribute('data-src');
        });
        label.appendChild(input);
      }
      return label;
    };
  
    // 创建列表
    const createList = (list, title) => {
      const fragment = document.createDocumentFragment();
      let elBody;
      let isHeaderAdded = false;
    
      for (const item of list) {
        if (item.type === 'group') {
          const grouped = createList(item.items, item.label);
          fragment.appendChild(grouped);
        } else if (item.type === 'app') {
          const groupDiv = fragment.appendChild(document.createElement('div'));
          groupDiv.className = 'list'
    
          if (title && !isHeaderAdded) {
            const elTitle = groupDiv.appendChild(document.createElement('div'));
            elTitle.className = 'list__header';
            elTitle.textContent = title;
            isHeaderAdded = true;
          }
    
          elBody = groupDiv.appendChild(document.createElement('div'));
          elBody.className = 'list__body';
    
          const { name, desc, date, appUrl, images } = item.data;
          const app = elBody.appendChild(document.createElement('div'));
          app.className = 'app';
          app.innerHTML =
          \`<div class="app-head">
            <img class="app-icon" src="\${appUrl}"></img>
            <div class="app-right">
              <div>
                <div class="app-name">\${name}</div>
                <div class="app-desc">\${desc}</div>
                <div class="app-score">\${date}</div>
              </div>
              <button class="iconfont icon-arrow_bottom">获取</button>
            </div>
          </div>
          <div class="app-imgs">
          \${images.map((img) => (
            \`<img class="app-img" src="\${img}"></img>\`
          )).join('')}
          </div>\`;

          const button = app.querySelector('.icon-arrow_bottom');
          button.addEventListener('click', (e) => {
            button.style.color = 'darkGrey';
            invoke('widget', item);
          });
        } else {
          if ( !elBody ) {
            const groupDiv = fragment.appendChild(document.createElement('div'));
            groupDiv.className = 'list';
            
            if ( title ) {
              const elTitle = groupDiv.appendChild(document.createElement('div'));
              elTitle.className = 'list__header';
              elTitle.textContent = title;
            }
    
            elBody = groupDiv.appendChild(document.createElement('div'));
            elBody.className = 'list__body';
          }
    
          const label = createFormItem(item);
          elBody.appendChild(label);
        }
      }
      return fragment;
    };
    
    const fragment = createList(formItems);
    document.getElementById('settings').appendChild(fragment);
    
    /** 加载动画 loading **/  
    const toggleLoading = (e) => {
      const target = e.currentTarget
      target.classList.add('loading')
      const icon = target.querySelector('.iconfont');
      const className = icon.className;
      icon.className = 'iconfont icon-loading';
    
      const listener = (event) => {
        if (event.detail.code) {
          target.classList.remove('loading');
          icon.className = className;
          window.removeEventListener(
            'JWeb', listener
          );
        }
      };
      window.addEventListener('JWeb', listener);
    };
    
    document.querySelectorAll('.form-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = e.currentTarget.dataset.name;
        if (name === 'effect' || btn.classList.contains('from-music')) { toggleLoading(e) }
      });
    });
    
    // 切换 appleLogo 黑白主题
    const appleLogos = document.querySelectorAll('.logo');
    const toggleLogo = (isDark) => {
      const newSrc = isDark ? appleLogos[0].dataset.darkSrc : appleLogos[0].dataset.lightSrc;
      appleLogos.forEach(logo => logo.src = newSrc);
    };
      
    const updateOnDarkModeChange = (event) => toggleLogo(event.matches);
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    toggleLogo(isDarkMode);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateOnDarkModeChange);
    
    // 监听其他 elementById
    
document.getElementById('clearCache').addEventListener('click', () => {
      invoke('clearCache');
    });
      
document.getElementById('telegram').addEventListener('click', () => {
      invoke('telegram');
    });
    
    })()`;

    // 主菜单头像信息
    const mainMenuTop = async () => {
      const avatarHtml = `      
      <div class="list">
        <form class="list__body" action="javascript:void(0);">
          <img class="gif signin-loader" data-src="https://sweixinfile.hisense.com/media/M00/82/70/Ch4FyWYeOx-Aad1OAEgKkK6qUUk601.gif">
          <div class="form-item-auth form-item--link">
            <div class="form-label">
              <img class="signin-loader form-label-author-avatar" src="${authorAvatar}" />
              <div id="telegram">
                <div class="form-item-auth-name">95du丶茅台</div>
                <a class="but form-item-auth-desc chat-message"></a>
              </div>
            </div>
            <div class="form-label">
              <button id="plus" class="but jb-vip">PLUS</button>
              <div id="popup" class="popup"><p>加载中...</p>
              </div>
            </div>
          </div>
        </form>
      </div>
      <script>
        const loadGif = () => {
          const gif = document.querySelector('.gif');
          gif.setAttribute('src', gif.getAttribute('data-src'));
          gif.style.display = 'block'
        };
        window.onload = loadGif;
        document.querySelector('#plus').addEventListener('click', (e) => {
          e.preventDefault();
          const popupTips = document.getElementById("popup").classList;
          popupTips.add("show", "fd")
          setTimeout(() => {
            popupTips.remove("fd");
            setTimeout(() => popupTips.remove("show"), 1000);
          }, 1800);
          invoke('plus');
        });
        
        const message = 'Scriptable 组件脚本交流群';
        const chatMessage = document.querySelector(".chat-message");
        chatMessage.textContent = ''
        
        let currentChar = 0;
        function typeNextChar() {
          if (currentChar < message.length) {
            chatMessage.textContent += message[currentChar++];
            chatMessage.scrollTop = chatMessage.scrollHeight;
            setTimeout(typeNextChar, 100);
          }
        }
        typeNextChar();
      </script>`;
      
      //弹窗
      const popup = `      
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="scriptable-widget blur-bg">
            <div id="appleHub" class="box-body sign-logo">
              <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
            </div>
            <div class="box-body">
              <div class="title-h-center popup-title">
                ${scriptName}
              </div>
              <a id="version" class="popup-version">
                <div class="but">
                  Version ${version}
                </div>
              </a><br>
              <div class="popup-content"> <li>${updateDate}&nbsp;</li> <li>Scriptable桌面小组件</li> <li>性能优化，改进用户体验</li>
              </div>
            </div>
            <div class="box-body">
              <div id="sign-in">
                <button class="but radius jb-yellow btn-block" id="clearCache">清除缓存</button>
              </div>
            </div>
            <p class="separator">
              95du丶茅台</p>
          </div>
        </div>
      </div>
      <script>
        setTimeout(function() {
          $('${updateVersionNotice()}').click();
        }, 1200);
        window._win = { uri: 'https://demo.zibll.com/wp-content/themes/zibll' };
      </script>`;
      
      const songId = [
        '8fk9B72BcV2',
        '8duPZb8BcV2',
        '6pM373bBdV2',
        '6NJHhd6BeV2',
        '4yhGxb6CJV2',
        '2ihRd27CKV2',
        'a2e7985CLV2',
        'cwFCHbdCNV2',
        'UxE30dCPV2',
        '4Qs8h89CPV2'
      ];
      const randomId = songId[Math.floor(Math.random() * songId.length)];
      const music = `
      <iframe data-src="https://t1.kugou.com/song.html?id=${randomId}" class="custom-iframe" frameborder="0" scrolling="auto">
      </iframe>
      <script>
        const iframe = document.querySelector('.custom-iframe');
        iframe.src = iframe.getAttribute('data-src');
      </script>
      `;
      
      return `
        ${settings.music === true ? music : ''}
        ${avatarHtml}
        ${popup}
        ${scriptTags.join('\n')}
      `
    };
    
    // 组件效果图
    const previewEffectImgHtml = async () => {
      const previewImgUrl = Array.from({ length: 3 }, (_, index) => `${rootUrl}/img/picture/Example_${index}.png`);

      const previewImgs = await Promise.all(previewImgUrl.map(async (item) => {
        const imgName = decodeURIComponent(item.substring(item.lastIndexOf("/") + 1));
        const previewImg = await getCacheImage(imgName, item);
        return previewImg;
      }));
      return `
      <div>
        ${previewImgs.map((img) => `<img src="${img}">`).join('')}
      </div>`
    };
    
    // =======  HTML  =======//
    const html =`
    <html>
      <head>
        <meta name='viewport' content='width=device-width, user-scalable=no, viewport-fit=cover'>
        <link rel="stylesheet" href="https://at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
        <style>${style}</style>
      </head>
      <body class="${themeColor}-theme site-layout-1">
        ${avatarInfo ? await mainMenuTop() : await previewEffectImgHtml()}
        ${head || ''}
        <section id="settings">
        </section>
        <script>${js}</script>
      </body>
    </html>`;
    
    const webView = new WebView();
    await webView.loadHTML(html);

    /**
     * Input window
     * @param data
     * @returns {Promise<string>}
     */
    const input = async ({ label, name, message } = data) => {
      await generateInputAlert({
        title: label,
        message: message,
        options: [{
          hint: '请输入Github仓库链接',
          value: Pasteboard.paste()
        }]
      }, 
      async ([{ value }]) => {
        if (value?.includes('https://github.com/') && !settings[name].includes(value)) {
          settings[name] = settings[name] || [];
          settings[name].push(value);
          writeSettings(settings);
          ScriptableRun();
        } else {
          notify('保存失败 ⚠️', '链接错误或已存在，请检查后再试');
        }
      })
    };
    
    // 删减仓库链接
    const removeRepo = async () => {
      const subList = settings.urls;
      while (subList.length) {
        const alert = new Alert();
        alert.message = '删减仓库❓'
        subList.forEach(item => {
          const name = item.match(/github\.com\/([\w-]+\/[\w-]+)/);
          alert.addAction(name[1])
        });
        alert.addCancelAction('取消');
        const menuId = await alert.presentSheet();
        if (menuId === -1) break;
        
        const action = await generateAlert(  
          '是否删除此仓库❓', 
          subList[menuId], 
          options = ['取消', '删除'],
          true
        );
        if (action === 1) {
          subList.splice(menuId, 1);
          settings.urls = subList;
          writeSettings(settings);
          Timer.schedule(1000, false, () => { ScriptableRun() });
        }
      }
    };
    
    // 清除缓存
    const clearCache = async () => {
      const action = await generateAlert(
        '清除缓存', '是否确定删除所有缓存？\n离线数据及图片均会被清除。',
        options = ['取消', '清除']
      );
      if ( action == 1 ) {
        fm.remove(mainPath);
        ScriptableRun();
      }
    };
      
    /**
     * 跳转、下载并安装指定脚本。
     * 
     * @param {Object} options
     * @param {string} options.label
     * @param {string} options.name
     * @param {string} options.scrUrl
     * @param {Object} options.data
     * 
     * @returns {Promise<void>}
     */
    const installScript = async ({ label, name, scrUrl, data } = data) => {
      if (name === 'repo') {
        Safari.openInApp(scrUrl);  
        return null;
      }
      
      if (data.name === 'ChatGPT') {  
        Safari.open('https://chatgpt.com/?ref=dotcom');  
        return null;
      }
      
      if (label === 'jumpStore') {
        const encodedUrl = scrUrl.replace(/\/app\/([^\/]+)\//, (match, p1) => `/app/${encodeURIComponent(p1)}/`);
        Safari.open(encodedUrl);
        return null;
      }
    
      try {
        const script = await getString(scrUrl);
        if (script.includes('组件') && !script.includes('DOCTYPE')) saveScript(label, script, scrUrl);
      } catch (e) {
        console.log(e);
        notify(`${label} ⚠️`, '获取失败，请在设置中打开Sync Script Order');
      }
    };
    
    // 保存脚本函数
    const saveScript = (label, script, scrUrl) => {
      const fm = FileManager.iCloud()
      const path = fm.documentsDirectory() + `/${label}.js`;
      fm.writeString(path, script);
      Pasteboard.copy(scrUrl);
      shimoFormData(label);
      notify(`已拷贝（${label}）可用于随机/循环组件`, scrUrl);
      ScriptableRun(label);
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
      if (code === 'clearCache' && fm.fileExists(cache)) {
        await clearCache();
      } else if (data?.type === 'button' || data?.type === 'app') {
        await installScript(data);
      };
      
      switch (code) {
        case 'plus':
          Timer.schedule(1000, false, () => { Safari.openInApp('https://scriptore.imarkr.com', false) });
          break;
        case 'telegram':
          Timer.schedule(300, false, () => { Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false) });
          break;
        case 'exit':
          ScriptableRun();
          break
        case 'urls':
          await input(data);
          break;
        case 'removeRepo':
          await removeRepo();
          break;
        case 'preview':
          await createWidget(newData);
          break;
        case 'changeSettings':
          Object.assign(settings, data);
          writeSettings(settings);
          break;
        case 'itemClick':
          const item = formItems.find(element => (element.type === 'group'));
          await renderAppView(item, false, { settings });
          break;
      };
      
      // Remove Event Listener
      if ( event ) {
        webView.evaluateJavaScript(
          "window.dispatchEvent(new CustomEvent('JWeb', { detail: { code: 'finishLoading' } }))",
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
  
  // render Widget
  if (!config.runsInApp) {
    await createWidget(newData);
  } else {
    await renderAppView({ avatarInfo: true, formItems });
  }
};
module.exports = { main }