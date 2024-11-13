// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: cog;

async function main() {
  const scriptName = '中国电信_3'
  const version = '1.1.0'
  const updateDate = '2024年10月23日'
  const pathName = '95du_china_telecom_3';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  const scrUrl = `${rootUrl}/api/web_china_telecom_3.js`;
  
  /**
   * 创建，获取模块路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  if (!fm.fileExists(depPath)) fm.createDirectory(depPath);
  await download95duModule(rootUrl);
  const isDev = false
  
  /** ------- 导入模块 ------- */
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const module = new _95du(pathName);  
  const {
    mainPath,
    settingPath,
    cacheImg, 
    cacheStr, 
    cacheCar
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
    useCache: true,
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
  
  // 格式化日期
  const getFormattedTime = (timestamp) => {
    const dateFormatter = new DateFormatter();
    dateFormatter.dateFormat = 'yyyy-MM-dd HH:mm';
    return dateFormatter.string(new Date(timestamp));
  };
  
  // 预览组件，获取版本名称和链接
  const previewWidget = async (family = 'medium') => {
    const moduleJs = await module.webModule(scrUrl);
    const { main } = await importModule(moduleJs)
    await main(family);
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
   * 版本更新时弹出窗口
   * @returns {String} string
   */
  const updateVerPopup = () => {
    const creationDate = fm.creationDate(settingPath);
    if (creationDate) {
      isInitialized = Date.now() - creationDate.getTime() > 300000;
    }
    return settings.version !== version ? '.signin-loader' : (isInitialized && settings.loader !== '95du' ? '.signup-loader' : null);
  };
  
  /**
   * Download Update Script
   * @param { string } string
   * 检查苹果操作系统更新
   * @returns {Promise<void>}
   */
  const updateVersion = async () => {
    const index = await generateAlert(
      '更新代码',
      '更新后当前脚本代码将被覆盖\n但不会清除用户已设置的数据\n如预览组件未显示或桌面组件显示错误，可更新尝试自动修复',
      options = ['取消', '更新']
    );
    if (index === 0) return;
    await updateString();
  };
  
  const updateString = async () => {
    const modulePath = fm.joinPath(cacheStr, scrName);
    const str = await getString(scrUrl);
    if (!str.includes('95度茅台')) {
      notify('更新失败 ⚠️', '请检查网络或稍后再试');
    } else {
      const moduleDir = fm.joinPath(mainPath, 'Running');
      if (fm.fileExists(moduleDir)) fm.remove(moduleDir);
      fm.writeString(modulePath, str)
      settings.version = version;
      writeSettings(settings);
      shimoFormData('update');
      ScriptableRun();
    }
  };
  
  /**
   * 运行 Widget 脚本
   * 组件版本、iOS系统更新提示
   * @param {object} config - Scriptable 配置对象
   * @param {string} notice 
   */
  if (config.runsInWidget) {
    const hours = (Date.now() - settings.updateTime) / (3600 * 1000);
    
    if (version !== settings.version && !settings.update && hours >= 12) {
      settings.updateTime = Date.now();
      writeSettings(settings);
      notify(`${scriptName}‼️`, `新版本更新 Version ${version}，修复已知问题`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    };
    
    try {
      const family = config.widgetFamily;
      await previewWidget(family);
      await module.appleOS_update();
    } catch (e) {
      console.log(e);
    } finally {
      return null;
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
    
    const appImage = await module.getCacheImage(`${rootUrl}/img/icon/telecom_1.png`);
    
    const authorAvatar = fm.fileExists(getAvatarImg()) ? await module.toBase64(fm.readImage(getAvatarImg()) ) : await module.getCacheImage(`${rootUrl}/img/icon/4qiao.png`);
    
    const collectionCode = await module.getCacheImage(`${rootUrl}/img/picture/collectionCode.jpeg`);
    
    const clockScript = await module.getCacheData(`${rootUrl}/web/clock.html`);
    
    const scriptTags = await module.scriptTags();
    
    // 批量处理图标加载
    const subArray = [];  
    const getPromises = [];
    const getBuildIcon = (item) => {
      const { icon } = item;
      if (icon?.name) {
        const { name, color } = icon;
        return module.getCacheMaskSFIcon(name, color).then(iconData => {
          item.icon = iconData;
        });
      } else if (icon?.startsWith('https')) {
        return module.getCacheImage(icon).then(iconData => {
          item.icon = iconData;
        });
      } else if (!icon?.startsWith('data')) {
        return module.getCacheDrawSFIcon(icon).then(iconData => {
          item.icon = iconData;
        });
      }
    };

    for (const i of formItems) {
      for (const item of i.items) {
        if (item.item) {
          for (const subItem of item.item) {
            const arr = getBuildIcon(subItem);
            getPromises.push(arr);
            subArray.push(subItem);
          }
        }
        const array = getBuildIcon(item);
        getPromises.push(array);
      }
    };
    // 等待所有图标加载完成
    await Promise.all(getPromises);
    
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
      top: ${screenSize < 926 ? (avatarInfo ? '-5%' : '-2%') : (avatarInfo ? '-9%' : '-4%')};
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
    
    /**
     * 生成主菜单头像信息和弹窗的HTML内容
     * @returns {string} 包含主菜单头像信息、弹窗和脚本标签的HTML字符串
     */
    const mainMenuTop = async () => {
      const avatar = `
      <div class="avatarInfo">
        <span class="signup-loader">
          <img src="${authorAvatar}" class="avatar"/>
        </span>
        <a class="signin-loader"></a>
        <div class="interval"></div>
        <a class="but">
          <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" onclick="switchDrawerMenu()" tabindex="0"></a>
        <div id="store">
          <a class="rainbow-text but">Script Store</a>
        </div>
      </div>
      <!-- 对话框 -->
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="zib-widget blur-bg relative">
            <a href="#tab-sign-up" data-toggle="tab"></a>
            <div class="box-body sign-logo" data-dismiss="modal" onclick="hidePopup()">  
              <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
            </div>
            <div class="tab-content">
              <!-- 版本信息 -->
              <div class="tab-pane fade active in" id="tab-sign-in">
                <div class="padding">
                  <div href="#tab-sign-up" data-toggle="tab" class="title-h-center popup-title">
                    ${scriptName}
                  </div>
                  <a class="popup-content update-desc">
                     <div class="but">Version ${version}</div>
                  </a><br>
                  <div class="form-label-title update-desc"> <li>${updateDate}</li> <li>修复已知问题</li> <li>性能优化，改进用户体验</li>
                  </div>
                </div>
                <div class="box-body" ><button id="install" class="but radius jb-yellow btn-block">立即更新</button>
                </div>
              </div>
              <!-- 捐赠 -->
              <div class="tab-pane fade-in" id="tab-sign-up">
                <a class="donate flip-horizontal" href="#tab-sign-in" data-toggle="tab"><img src="${collectionCode}">  
                </a>
              </div>
            </div>
            <p class="separator" data-dismiss="modal">95du丶茅台</p>
          </div>
        </div>
      </div>
      <script>
        const popupOpen = () => { $('.signin-loader').click() };
        
        window.onload = () => {
          setTimeout(() => {
            $('${updateVerPopup()}').click();
          }, 1200);
        };
        window._win = { uri: 'https://demo.zibll.com/wp-content/themes/zibll' };
      </script>
      
      `
      // music
      const songId = [
        '8fk9B72BcV2',
        '8duPZb8BcV2',
        '6pM373bBdV2',
        '6NJHhd6BeV2',
        'a2e7985CLV2'
      ];
      const randomId = module.getRandomItem(songId);
      const music = `
      <iframe data-src="https://t1.kugou.com/song.html?id=${randomId}" class="custom-iframe" frameborder="0" scrolling="auto">
      </iframe>
      <script>
        const iframe = document.querySelector('.custom-iframe');
        iframe.src = iframe.getAttribute('data-src');
      </script>`;
      
      return `${avatar}
      ${settings.music ? music : ''}`
    };
    
    /**
     * Donated Author
     * weChat pay
     */
    const donatePopup = async () => {
      return `        
      <a class="signin-loader"></a>
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="zib-widget blur-bg relative">
            <div id="appleHub" class="box-body sign-logo">  
              <img class="custom-img logo" data-light-src="${appleHub_dark}" data-dark-src="${appleHub_light}" tabindex="0">
            </div>
            <a class="but donated">
              <img src="${collectionCode}">  
            </a>
            <p class="but separator">95du丶茅台</p>
          </div>
        </div>
      </div>
      <script>
        const popupOpen = () => { $('.signin-loader').click() };
        window._win = { uri: 'https://demo.zibll.com/wp-content/themes/zibll' };
      </script>`
    };
    
    /**
     * 底部弹窗信息
     * 创建底部弹窗的相关交互功能
     * 当用户点击底部弹窗时，显示/隐藏弹窗动画，并显示预设消息的打字效果。
     *
    const cardElements = subArray.flatMap(item => {
      if (item.type === 'card') {
        return `<div class="card">
          <img src="${item.icon}">
          <span>${item.label}</span>
          <p>${item.version}</p>
          <button class="but" style="background-color: #FF9000" onclick="clickCard('${item.label}', '${item.scrUrl}')">获 取</button>
        </div>`;
      }
    }).join('');
     */
    const cardElements = formItems.flatMap(group => group.items.flatMap(item =>
      item.item?.filter(item => item.type === 'card').map(item => `
        <div class="card">
          <img src="${item.icon}">
          <span>${item.label}</span>
          <p>${item.version}</p>
          <button class="but" style="background-color: #FF9000" onclick="clickCard('${item.label}', '${item.scrUrl}')">获 取</button>
        </div>`
      ) || [])
    ).join('');

    const buttonPopup = async () => {
      const js = `
      const menuMask = document.querySelector(".popup-mask")
      const showMask = async (callback, isFadeIn) => {
        const duration = isFadeIn ? 200 : 300;
        const startTime = performance.now();
    
        const animate = async (currentTime) => {
          const elapsedTime = currentTime - startTime;
          menuMask.style.opacity = isFadeIn ? elapsedTime / duration : 1 - elapsedTime / duration;
          if (elapsedTime < duration) requestAnimationFrame(animate);
          else callback?.();
        };
    
        menuMask.style.display = "block";
        requestAnimationFrame(() => animate(performance.now()));
      };
    
      function switchDrawerMenu() {
        const popup = document.querySelector(".popup-container");
        const isOpenPopup = popup.style.height !== '255px';
        showMask(isOpenPopup ? null : () => menuMask.style.display = "none", isOpenPopup);
        popup.style.height = isOpenPopup ? '255px' : ''
      };
      
      const hidePopup = () => {
        setTimeout(() => switchDrawerMenu(), 300);
      };
                  
      const clickCard = (label, scrUrl) => {
        hidePopup();
        const item = JSON.stringify({ label, scrUrl });
        const event = new CustomEvent('JBridge', { detail: { code: 1, data: item } });
        window.dispatchEvent(event);
      }`;
      
      const content = `${avatarInfo  
        ? `<img id="app" onclick="switchDrawerMenu()" class="app-icon" src="${appImage}">
          <div style="margin-bottom: 35px;">中国电信天翼账号中心</div>
          <button class="but jb-green" onclick="hidePopup()" id="cookie">实时账单</button>`  
        : `<div class="card-container">${cardElements}</div>`
      }`
      
      return `
      <div class="popup-mask" onclick="switchDrawerMenu()"></div>
      <div class="popup-container">
        <div class="popup-widget zib-widget blur-bg" role="dialog">
          <div class="box-body">
            ${content}
          </div>
        </div>
      </div>
      <script>${js}</script>`;
    };
      
    /**
     * 组件效果图预览
     * 图片左右轮播
     * Preview Component Images
     * This function displays images with left-right carousel effect.
     */
    const clockHtml = (() => {
      const displayStyle = settings.clock ? 'block' : 'none';
      return `<div id="clock" style="display: ${displayStyle}">${clockScript}</div>`;
    });
    
    previewImgHtml = async () => {
      const displayStyle = settings.clock ? 'none' : 'block';
      const previewImgUrl = [
        `${rootUrl}/img/picture/china_telecom_2.png`,
        `${rootUrl}/img/picture/china_telecom_3.png`
      ];
      
      if (settings.topStyle) {
        const previewImgs = await Promise.all(previewImgUrl.map(async (item) => {
          const previewImg = await module.getCacheImage(item);
          return previewImg;
        }));
        return `${clockHtml()}
        <div id="scrollBox" style="display: ${displayStyle}">
          <div id="scrollImg">
            ${previewImgs.map(img => `<img src="${img}">`).join('')}
          </div>
        </div>`; 
      } else {
        const randomUrl = module.getRandomItem(previewImgUrl);
        const previewImg = await module.getCacheImage(randomUrl);
        return `${clockHtml()}
        <img id="store" src="${previewImg}" class="preview-img" style="display: ${displayStyle}">`
      }
    };
    
    // 增加右侧 desc 颜色
    const addColorDesc = () => {
      let htmlFragment = '';
      settings.rank.forEach((item, index) => {
        htmlFragment += `<span class="${item.name.toLowerCase()}-text" style="color: ${item.color};">${item.name}</span>`;
      });
      return htmlFragment;
    };
    
    // =======  js  =======//
    const js =`
    (() => {
    const settings = ${JSON.stringify({
      ...settings
    })}
    const formItems = ${JSON.stringify(formItems)}
    
    window.invoke = (code, data) => {
      window.dispatchEvent(
        new CustomEvent(
          'JBridge',
          { detail: { code, data } }
        )
      )
    }
    
    const formData = {};
    const createFormItem = ( item ) => {
      const value = settings[item.name] ?? item.default;
      formData[item.name] = value;
      
      const label = document.createElement("label");
      label.className = "form-item";
      label.dataset.name = item.name;
      
      const div = document.createElement("div");
      div.className = 'form-label';
      label.appendChild(div);
      
      if (item.icon) {
        const img = document.createElement("img");
        img.src = item.icon;
        img.className = 'form-label-img';
        div.appendChild(img);
      }
          
      const divTitle = document.createElement("div");
      divTitle.className = 'form-label-title';
      divTitle.innerText = item.label;
      div.appendChild(divTitle);
          
      if (item.type === 'select') {
        const select = document.createElement('select');
        select.name = item.name;
        select.classList.add('select-input');
        select.multiple = !!item.multiple;
        select.style.width = '100px'
        
        item.options?.forEach(grp => {
          const container = document.createElement('optgroup');
          if (grp.label) container.label = grp.label;
      
          grp.values.forEach(opt => {
            const option = new Option(opt.label, opt.value);
            option.disabled = opt.disabled || false;
            option.selected = (item.multiple && Array.isArray(value)) ? value.includes(opt.value) : value === opt.value;
            container.appendChild(option);
          });
          if (container !== select) select.appendChild(container);
        });
        
        select.addEventListener('change', (e) => {
        const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
        const convertValue = value => value === 'true' ? true : (value === 'false' ? false : (!isNaN(value) ? parseFloat(value) : value));
      
        const convertedValues = item.multiple ? selectedValues.map(convertValue) : convertValue(selectedValues[0]);
      
        formData[item.name] = convertedValues;
        invoke('changeSettings', formData);
        selectWidth();
      });
      
        const selCont = document.createElement('div');
        selCont.classList.add('form-item__input__select');
        selCont.appendChild(select);
      
        if (!item.multiple) {
          select.style.appearance = 'none';
          const icon = document.createElement('i');
          icon.className = 'iconfont icon-arrow_right';
          selCont.appendChild(icon);
        };
        
        label.appendChild(selCont);
      } else if (['cell', 'page', 'file'].includes(item.type)) {
        const { name, isDesc, other, descColor } = item;

        if (item.desc) {
          const desc = document.createElement("div");
          desc.className = 'form-item-right-desc';
          desc.id = \`\${name}-desc\`
          
          if (descColor) {
            desc.innerHTML = \`${addColorDesc()}\`;
          } else {
            desc.innerText = isDesc ? (settings[\`\${name}_status\`] ??item.desc) : other ? item.desc : settings[name];
          };
          
          label.appendChild(desc);
        };
      
        const icon = document.createElement('i');
        icon.className = 'iconfont icon-arrow_right';
        label.appendChild(icon);
        label.addEventListener('click', (e) => {
          switch (name) {
            case 'version':
            case 'donate':
              popupOpen();
              break;
            case 'setAvatar':
              fileInput.click();
              invoke(name, data);
              break;
            case 'widgetMsg':
              switchDrawerMenu();
              break;
          };
      
          invoke(item.type === 'page' ? 'itemClick' : name, item);
        });
  
        /** file input **/
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = ".jpg,.jpeg,.png,.gif,.bmp";
        fileInput.addEventListener("change", async (event) => {
          const uploadedImage = document.querySelector('.avatar');
          const file = event.target.files[0];
          if (file && file.type.includes("image")) {
            avatarFile(file, name);
          }
        });
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
        };
        
input.addEventListener("change", async (e) => {
          const isChecked = e.target.checked;
          formData[item.name] =
            item.type === 'switch'
            ? isChecked
            : e.target.value;
          
          if (item.name === 'clock') switchStyle(isChecked);
          if (item.name === 'alwaysDark') switchColor(isChecked);
          
          invoke('changeSettings', formData);
        });
        label.appendChild(input);
      }
      return label
    };
    
    /** input Color 切换颜色 **/
    const switchColor = async (isChecked) => {
      const colorValue = isChecked ? '#FFFFFF' : '#000000';
      document.querySelector('input[name="subTitleColor"]').value = formData['subTitleColor'] = colorValue;
    };
    
    /** fileInput 头像 **/
    const avatarFile = (file, name) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const size = Math.min(img.width, img.height);
          const tempCanvas = document.createElement('canvas');
          const tempContext = tempCanvas.getContext('2d');
        
          tempCanvas.width = tempCanvas.height = size;
          tempContext.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, size, size);
        
          const uploadedImage = document.querySelector('.avatar');
          uploadedImage.src = tempCanvas.toDataURL();
        };
      
        img.src = e.target.result;
        const imageData = e.target.result.split(',')[1];
        invoke(name, imageData)
      };
      reader.readAsDataURL(file);
    };
    
    /** 时钟图片切换，动画 **/
    const fadeInOut = async (element, fadeIn) => {
      const fadeTime = 0.4
      element.style.transition = \`opacity \${fadeTime}s\`;
      element.style.opacity = fadeIn ? 1 : 0;
      element.style.display = 'block'          
      await new Promise(resolve => setTimeout(resolve, fadeTime * 700));
          
      if (!fadeIn) element.style.display = 'none';
      element.style.transition = '';
    };
    
    const switchStyle = async (isChecked) => {
      const imageId = settings.topStyle ? 'scrollBox' : 'store';
      const imageEle = document.getElementById(imageId);
      const htmlContainer = document.getElementById('clock');
          
      const fadeIn = isChecked ? htmlContainer : imageEle;
      const fadeOut = isChecked ? imageEle : htmlContainer;
          
      await fadeInOut(fadeOut, false)
      await fadeInOut(fadeIn, true);
    };
    
    /** ☘️创建列表通用组容器☘️ **/
    const createGroup = (fragment, title, headerClass = 'el__header', bodyClass = 'el__body') => {
      const groupDiv = fragment.appendChild(document.createElement('div'));
      groupDiv.className = 'list';
    
      if (title) {
        const elTitle = groupDiv.appendChild(document.createElement('div'));
        elTitle.className = headerClass;
        elTitle.textContent = title;
      }
    
      const elBody = groupDiv.appendChild(document.createElement('div'));
      elBody.className = bodyClass;
      return elBody;
    };
    
    /** 创建范围输入元素 **/
    const createRange = (elBody, item) => {
      const range = elBody.appendChild(document.createElement('div'));
      range.innerHTML = \`
        <label class="collapsible-label" for="collapse-toggle">
          <div class="form-label">
            <div class="collapsible-value">${settings.angle || 90}</div>
          </div>
          <input id="_range" type="range" value="${settings.angle || 90}" min="0" max="360" step="5">
          <i class="fas fa-chevron-right icon-right-down"></i>
        </label>
        <!-- 折叠取色器 -->
        <div class="collapsible-range" id="content">
          <hr class="range-separ2">
          <label class="form-item">
            <div class="form-label">
              <img class="form-label-img" src="\${item.icon}"/>
              <div class="form-label-title">渐变颜色</div>
            </div>
            <input type="color" value="\${settings.rangeColor}" id="color-input">
          </label>
        </div>\`;
    
      const icon = range.querySelector('.collapsible-label .icon-right-down');
      const content = range.querySelector('.collapsible-range');
      const colorInput = range.querySelector('#color-input');
      const rangeInput = range.querySelector('#_range');
      let isExpanded = false;
    
      const toggleShow = () => {
        content.classList.toggle('show');
        isExpanded = !isExpanded;
        icon.style.transition = 'transform 0.4s';
        icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      };
      range.querySelector('.collapsible-label').addEventListener('click', toggleShow);
    
      colorInput.addEventListener('change', (e) => {
        const selectedColor = e.target.value;
        settings.rangeColor = selectedColor;
        updateRange();
        formData[item.color] = selectedColor;
        invoke('changeSettings', formData);
      });
    
      const updateRange = () => {
        const value = rangeInput.value;
        const percent = ((value - rangeInput.min) / (rangeInput.max - rangeInput.min)) * 100;
        rangeInput.dataset.value = value;
        rangeInput.style.background = \`linear-gradient(90deg, \${settings.rangeColor} \${percent}%, var(--checkbox) \${percent}%)\`;
        range.querySelector('.collapsible-value').textContent = value;
      };
    
      rangeInput.addEventListener('input', updateRange);
      rangeInput.addEventListener('change', (event) => {
        formData[item.name] = event.target.value;
        invoke('changeSettings', formData);
      });
      updateRange();
    };
    
    /** 创建可折叠列表元素 **/  
    const createCollapsible = (elBody, item) => {
      const label = (item) => \`
        <label id="\${item.name}" class="form-item">
          <div class="form-label">
            <img class="form-label-img collapsible-label-img" src="\${item.icon}"/>
            <div class="form-label-title">\${item.label}</div>
          </div>
          \${item.desc ? \`
          <div class="form-label">
            <div id="\${item.name}-desc" class="form-item-right-desc">\${item.desc}</div>
            <i class="iconfont icon-arrow_right"></i>
          </div>\` : \`
          <i class="iconfont icon-arrow_right"></i>\`}
        </label>\`;
    
      const collapsible = elBody.appendChild(document.createElement('div'));
      collapsible.innerHTML = \`
        <label class="collapsible-label" for="collapse-toggle">
          <div class="form-label">
            <img class="form-label-img" src="\${item.icon}"/>
            <div class="form-label-title">\${item.label}</div>
          </div>
          <i class="fas fa-chevron-right icon-right-down"></i>
        </label>
        <hr class="separ">
        <!-- 折叠列表 -->
        <div class="collapsible-content" id="content">
          <div class="coll__body">
            \${item.item.map(item => label(item)).join('')}
          </div>
          <hr class="separ">
        </div>\`;
    
      const icon = collapsible.querySelector('.collapsible-label .icon-right-down');
      const content = collapsible.querySelector('.collapsible-content');
      let isExpanded = false;
      
      collapsible.querySelector('.collapsible-label').addEventListener('click', () => {
        content.classList.toggle('show');
        isExpanded = !isExpanded;
        icon.style.transition = 'transform 0.4s';
        icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
      });
    
      collapsible.querySelectorAll('.form-item').forEach((label, index) => {
        label.addEventListener('click', () => {
          const labelId = label.getAttribute('id');
          invoke(labelId, item.item[index]);
        });
      })
    };
    
    //======== 创建列表 ========//
    const createList = ( list, title ) => {
      const fragment = document.createDocumentFragment();
      let elBody;
    
      for (const item of list) {
        if (item.type === 'group') {
          const grouped = createList(item.items, item.label);
          fragment.appendChild(grouped);
        } else if (item.type === 'range') {
          elBody = createGroup(fragment, title);  
          createRange(elBody, item);
        } else if (item.type === 'collapsible') {
          elBody = createGroup(fragment, title);
          createCollapsible(elBody, item);
        } else {
          if (!elBody) {
            elBody = createGroup(fragment, title, 'list__header', 'list__body');
          }
          const label = createFormItem(item);
          elBody.appendChild(label);
        }
      }
      return fragment
    };
    const fragment = createList(formItems);
    document.getElementById('settings').appendChild(fragment);
    
    /** 加载动画 **/
    const toggleLoading = (e) => {
      const target = e.currentTarget;
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
      btn.addEventListener('click', (e) => { toggleLoading(e) });
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
    ['store', 'app', 'cookie', 'install'].forEach(id => {
      const elementById = document.getElementById(id).addEventListener('click', () => invoke(id));
    });
    
    })()`;
    
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
        ${avatarInfo ? await mainMenuTop() : (previewImage ? await previewImgHtml() : '')}
        <!-- 弹窗 -->
        ${await donatePopup()}
        ${await buttonPopup()}
        <section id="settings">
        </section>
        <script>${js}</script>
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
      const newHTML = newText ?? addColorDesc();
      webView.evaluateJavaScript(
        `var element = document.getElementById("${elementId}-desc");
        if (element) element.innerHTML = \`${newHTML}\`;
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
        if ( result ) {
          settings[name] = result;
          writeSettings(settings);
          innerTextElementById(name, other ? inputStatus : result);  
        }
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
    
    // 查看实时账单
    const getUserBill = async () => {
      const request = new Request('https://e.189.cn/user/bill.do');
      request.headers = {
        Cookie: settings.cookie
      }
      const { items } = await request.loadJSON();
      const bill = (items[0].sumCharge) / 100;
      notify('中国电信', `${items[0].acctName}，您当前账单 ${bill} 元。` );
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
    
    // 其他模块
    const getModule = async (jsName, jsUrl) => await importModule(await webModule(jsName, jsUrl)).main();
    
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
          fm.remove(settingPath);
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
        case 'preview':
          await previewWidget(data.family);
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
          break;
        case 'rank':
          await rank(data);
          break;
        case 'cookie':
          settings.cookie ? await getUserBill() : '';
          break;
        case 'getCookie':
          await getCookie(data);
          break;
        case 'rewrite':
          const rewrite123 = module.quantumult('中国电信', 'https://raw.githubusercontent.com/95du/scripts/main/rewrite/get_10000_loginUrl.conf');
          Safari.open(rewrite123);
          break;
        case 'boxjs_rewrite':
          const boxjs = module.quantumult('boxjs', 'https://github.com/chavyleung/scripts/raw/master/box/rewrite/boxjs.rewrite.quanx.conf');
          Safari.open(boxjs);
          break;
        case 'boxjs':
          Safari.openInApp(`http://boxjs.com/#/sub/add/${rootUrl}/boxjs/subscribe.json`, false);
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
          `window.dispatchEvent(new CustomEvent('JWeb', { detail: { code: 'finishLoading'} }))`, false
        );
      };
      await injectListener();
    };
  
    injectListener().catch((e) => {
      console.error(e);
    });
    await webView.present();
  };
  
  // 组件信息页
  const userMenu = (() => {
    const formItems = [
      {
        type: 'group',
        items: [
          {
            label: '炫酷时钟',
            name: 'clock',
            type: 'switch',
            icon: {
              name: 'button.programmable',
              color: '#F326A2'
            }
          },
          {
            label: '图片轮播',
            name: 'topStyle',
            type: 'switch',
            icon: {
              name: 'photo.tv',
              color: '#FF9500'
            }
          },
          {
            label: '列表动画',
            name: 'animation',
            type: 'switch',
            icon: {
              name: 'rotate.right.fill',  
              color: '#BD7DFF'
            },
            default: true
          },
          {
            label: '动画时间',
            name: 'fadeInUp',
            type: 'cell',
            input: true,
            icon: {
              name: 'clock.fill',
              color: '#0096FF'
            },
            message: '设置时长为0时，列表将无动画效果\n( 单位: 秒 )',
            desc: settings.fadeInUp
          },
          
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: '组件推荐',
            name: 'widgetMsg',
            type: 'cell',
            icon: {
              name: 'doc.text.image',
              color: '#43CD80'
            },
            item: [
              {
                label: '交管12123',
                type: 'card',
                version: '1.0.1',
                scrUrl: `${rootUrl}/run/web_module_12123.js`,
                icon: `${rootUrl}/img/icon/12123.png`
              },
              {
                label: '全国油价',
                type: 'card',
                version: '1.0.0',
                scrUrl: `${rootUrl}/run/web_module_oil_price.js`,
                icon: `${rootUrl}/img/icon/oilPrice2.png`
              },
              {
                label: '中国电信',
                type: 'card',
                version: '1.0.0',
                scrUrl: `${rootUrl}/run/web_module_china_telecom.js`,
                icon: `${rootUrl}/img/icon/telecom_2.png`
              },
              {
                label: '开奖结果',
                type: 'card',
                version: '1.0.4',
                scrUrl: `${rootUrl}/run/web_module_lottery.js`,
                icon: `${rootUrl}/img/icon/lottery.png`
              },
              {
                label: '智慧交通',
                version: '1.0.0',
                type: 'card',
                scrUrl: `${rootUrl}/widget/congest.js`,
                icon: `${rootUrl}/img/icon/cityCongest.png`
              },
              {
                label: '收支账单',
                version: '1.0.0',
                type: 'card',
                scrUrl: `${rootUrl}/run/web_module_jingDong_bill.js`,
                icon: `${rootUrl}/img/icon/jingDong.png`
              },
              {
                label: '南网在线',
                version: '1.0.0',
                type: 'card',
                scrUrl: `${rootUrl}/run/web_module_powerGrid.js`,
                icon: `${rootUrl}/img/icon/electric.png`
              },
              {
                label: '负一屏底栏',
                version: '1.3.0',
                type: 'card',
                scrUrl: `${rootUrl}/widget/bottomBar.js`,
                icon: `${rootUrl}/img/icon/bottomBars.png`
              },
              {
                label: '循环组件',
                version: '1.0.0',
                type: 'card',
                scrUrl: `${rootUrl}/widget/loopScripts.js`,
                icon: `${rootUrl}/img/icon/loopScript.png`
              }
            ]
          },
          {
            label: '组件商店',
            name: 'store',
            type: 'cell',
            icon: {
              name: 'bag.fill',  
              color: 'FF6800'
            }
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: 'AppleOS',
            name: 'appleOS',
            type: 'switch',
            icon: `${rootUrl}/img/symbol/notice.png`
          },
          {
            label: '推送时段',
            name: 'period',
            type: 'cell',
            isDesc: true,
            icon: {
              name: 'deskclock.fill',
              color: '#0096FF'
            },
            message: 'iOS 最新系统版本更新通知\n默认 04:00 至 06:00',
            desc: settings.startTime || settings.endTime ? '已设置' : '默认'
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            name: "donate",
            label: "打赏作者",
            type: "cell",
            icon: `${rootUrl}/img/icon/weChat.png`
          }
        ]
      }
    ];
    return formItems;
  })();
  
  // 设置菜单页
  const settingMenu = (() => {
    const formItems = [
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
          }
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
            label: '用量通知',
            name: 'notify',
            type: 'switch',
            default: true,
            icon: `${rootUrl}/img/symbol/notice.png`
          },
          {
            name: "bill",
            label: "显示账单",
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
    return formItems;
  })();
  
  // 主菜单
  await renderAppView({
    avatarInfo: true,
    formItems: [
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
            formItems: userMenu,
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
    ]
  }, true);
}
module.exports = { main }