// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: cog;

async function main() {
  const uri = Script.name();
  const scriptName = '澳门六合彩'
  const version = '1.1.0'
  const updateDate = '2024年10月24日'
  
  const pathName = '95du_macaujc';
  const widgetMessage = 'The Caterpillar and Alice looked at each other for some time in silence: at last the Caterpillar took the hookah out of its mouth, and addressed her in a languid, sleepy voice.';
  
  const rootUrl = 'https://raw.githubusercontent.com/95du/scripts/master';
  
  const [scrName, scrUrl] = ['macaujc.js', `${rootUrl}/api/web_macaujc.js`];

  /**
   * 创建，获取存储路径
   * @returns {string} - string
   */
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), pathName);
  
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
    console.log(JSON.stringify(
      settings, null, 2)
    )
  };
  
  const ScriptableRun = () => {
    Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
  }
  
  /**
   * 读取储存的设置
   * @param {string} file - JSON
   * @returns {object} - JSON
   */
  const DEFAULT_SETTINGS = {
    version,
    refresh: 20,
    transparency: 0.5,
    masking: 0.3,
    picture: [],
    update: true,
    topStyle: true,
    music: true,
    bufferTime: 240,
    textLightColor: '#000000',
    textDarkColor: '#FFFFFF',
    titleLightColor: '#3F8BFF',
    gradient: '#BCBBBB',
    rangeColor: '#ff6800'
  };
  
  const getSettings = (file) => {
    if (fm.fileExists(file)) {
      return JSON.parse(fm.readString(file));
    } else {
      settings = DEFAULT_SETTINGS;
      writeSettings(settings);
    }
    return settings;
  };
  settings = await getSettings(getSettingPath());
  
  // refresh time
  if (settings.refresh) {  
    const widget = new ListWidget();
    widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(settings.refresh));
  }
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => {
    const bgPath = fm.joinPath(fm.documentsDirectory(), '95duBackground');
    return fm.joinPath(bgPath, Script.name() + '.jpg');
  };
  
  // 获取头像图片
  const getAvatarImg = () => {
    const avatarImgPath = fm.joinPath(fm.documentsDirectory(), pathName);
    return fm.joinPath(avatarImgPath, 'userSetAvatar.png');
  };
  
  /**
   * 指定模块页面
   * @param { string } time
   * @param { string } color
   * @param { string } module
   */
  const webModule = async (scriptName, url) => {
    const modulePath = fm.joinPath(mainPath, scriptName);
    if (settings.update === false && await fm.fileExists(modulePath)) {
      return modulePath;
    } else {
      const req = new Request(url);
      const moduleJs = await req.load().catch(() => {
        return null;
      });
      if (moduleJs) {
        fm.write(modulePath, moduleJs);
        return modulePath;
      }
    }
  };
  
  if (config.runsInWidget) {
    if ( version !== settings.version && settings.update === false ) {
      notify(scriptName, `新版本更新 Version ${version}  ( 可开启自动更新 )`, 'scriptable:///run/' + encodeURIComponent(Script.name()));
    };
    await importModule(await webModule(scrName, scrUrl)).main();  
    return null;
  };
  
  // download store
  const myStore = async () => {
    const script = await getString(`${rootUrl}/run/web_module_95duScript.js`);
    const fm = FileManager.iCloud();
    fm.writeString(
      fm.documentsDirectory() + '/95du_ScriptStore.js', script);
  };
  
  /**
   * 版本更新时弹出窗口
   * @returns {String} string
   */
  const updateVersionNotice = () => {
    if ( version !== settings.version ) {
      return '.signin-loader';
    }
    return null
  };
  
  /**
   * Download Update Script
   * @param { string } string
   */
  const updateVersion = async () => {
    const index = await generateAlert(
      title = '更新代码',
      message = '更新后当前脚本代码将被覆盖\n但不会清除用户已设置的数据\n如预览组件未显示或桌面组件显示错误，可更新尝试自动修复',
      options = ['取消', '确认']
    );
    if (index == 0) return;
    await updateString();
  };
  
  const updateString = async () => {
    const modulePath = fm.joinPath(mainPath, scrName);
    const codeString = await new Request(scrUrl).loadString();
console.log(codeString)
    if (codeString.indexOf('95度茅台') == -1) {
      notify('更新失败 ⚠️', '请检查网络或稍后再试');
    } else {
      fm.writeString(modulePath, codeString);
      settings.version = version;
      writeSettings(settings);
      ScriptableRun();
    }
  };
  
  /**
   * Setting drawTableIcon
   * @param { Image } image
   * @param { string } string
   */  
  const getCacheMaskSFIcon = async (name, color) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if ( image ) {
      return toBase64(image);
    }
    const img = await loadSF2B64(name, color);
    cache.writeImage(name, img);
    return toBase64(img);
  };
  
  // loadSF2B64
  const loadSF2B64 = async (
    icon = 'message.fill',
    color = '#56A8D6',
    cornerWidth = 39
  ) => {
    const sfSymbolImg = await drawTableIcon(icon, color, cornerWidth);
    return sfSymbolImg;
  };
  
  const drawTableIcon = async (
    icon = 'message.fill',
    color = '#ff6800',
    cornerWidth = 39
  ) => {
    let sfi = SFSymbol.named(icon);
    if (sfi == null) sfi = SFSymbol.named('scribble');
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
   * drawSquare
   * @param { Image } image
   * @param { string } string
   */
  const drawSquare = async (img) => {
    const imgData = Data.fromPNG(img).toBase64String();
    const html = `
      <img id="sourceImg" src="data:image/png;base64,${imgData}" />
      <img id="silhouetteImg" src="" />
      <canvas id="mainCanvas" />`;
    const js = `
      const canvas = document.createElement("canvas");
      const sourceImg = document.getElementById("sourceImg");
      const silhouetteImg = document.getElementById("silhouetteImg");
      const ctx = canvas.getContext('2d');
      // 裁剪成正方形
      const size = Math.min(sourceImg.width, sourceImg.height);
      canvas.width = canvas.height = size;
      ctx.drawImage(sourceImg, (sourceImg.width - size) / 2, (sourceImg.height - size) / 2, size, size, 0, 0, size, size);
      
      // 压缩图像
      const maxFileSize = 200 * 1024
      const quality = Math.min(1, Math.sqrt(maxFileSize / (canvas.toDataURL('image/jpeg', 1).length * 0.75)));
      const compressedCanvas = document.createElement("canvas");
      const compressedCtx = compressedCanvas.getContext('2d');
      compressedCanvas.width = compressedCanvas.height = 400;
      compressedCtx.drawImage(canvas, 0, 0, size, size, 0, 0, 400, 400);
      
      silhouetteImg.src = canvas.toDataURL();
      output = compressedCanvas.toDataURL('image/jpeg', quality);
    `;
    
    const wv = new WebView();
    await wv.loadHTML(html);
    const base64Image = await wv.evaluateJavaScript(js);
    return await new Request(base64Image).loadImage();  
  };
  
  /**
   * 获取css及js字符串和图片并使用缓存
   * @param {string} File Extension
   * @param {Image} Base64 
   * @returns {string} - Request
   */
  const cache = fm.joinPath(mainPath, 'cache_path');
  fm.createDirectory(cache, true);
  
  const useFileManager = () => {
    return {
      readString: (fileName) => {
        const filePath = fm.joinPath(cache, fileName);
        return fm.readString(filePath);
      },
      writeString: (fileName, content) => fm.writeString(fm.joinPath(cache, fileName), content),  
      // cache Image
      readImage: (fileName) => {
        const imgPath = fm.joinPath(cache, fileName);
        return fm.fileExists(imgPath) ? fm.readImage(imgPath) : null;
      },
      writeImage: (fileName, image) => fm.writeImage(fm.joinPath(cache, fileName), image)
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
    if (cssString) {
      return cssString;
    }
    const response = await getString(cssFileUrl);
    if (!response.includes('!DOCTYPE')) {  
      cache.writeString(cssFileName, response);
    }
    return response;
  };
  
  /**
   * 获取网络图片并使用缓存
   * @param {Image} url
   */
  const getImage = async (url) => {
    return await new Request(url).loadImage();
  };
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager();
    const image = cache.readImage(name);
    if ( image ) {
      return image;
    }
    const img = await getImage(url);
    cache.writeImage(name, img);
    return img;
  };
  
  const toBase64 = async (img) => {
    return `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`
  };

  /**
   * 弹出一个通知
   * @param {string} title
   * @param {string} body
   * @param {string} url
   * @param {string} sound
   */  
  const notify = async (title, body, url, opts = {}) => {
    const n = Object.assign(new Notification(), { title, body, sound: 'piano_', ...opts });
    if (url) n.openURL = url;
    n.schedule();
  };
  
  /**
   * 弹出输入框
   * @param title 标题
   * @param desc  描述
   * @param opt   属性
   * @returns { Promise<void> }
   */
  const generateInputAlert = async (options, confirm) => {  
    const inputAlert = new Alert();
    inputAlert.title = options.title;
    inputAlert.message = options.message;
    const fieldArr = options.options;
    for (const option of fieldArr) {
      inputAlert.addTextField(
        option.hint,
        option.value
      );
    }
    inputAlert.addAction('取消');
    inputAlert.addAction('确认');
    let getIndex = await inputAlert.presentAlert();
    if (getIndex == 1) {
      const inputObj = [];
      fieldArr.forEach((index) => {
        let value = inputAlert.textFieldValue(index);
        inputObj.push({index, value});
      });
      confirm(inputObj);
    }
    return getIndex;
  };
  
  /**
   * @param message 内容
   * @param options 按键
   * @returns { Promise<number> }
   */
  const generateAlert = async ( title, message = '', options, destructiveAction ) => {
    const alert = new Alert();
    alert.title = title;
    alert.message = message ?? '';
    for (const option of options) {
      option === destructiveAction ? alert.addDestructiveAction(option) : alert.addAction(option);
    }
    return await alert.presentAlert();
  };
  
  
  // ====== web start ======= //
  
  const renderAppView = async (options) => {
    const {
      formItems = [],
      head,
      $ = 'https://www.imarkr.com',
      avatarInfo,
      previewImage
    } = options;
    
    const logoColor = Device.isUsingDarkAppearance() ? 'white' : 'black';
    const appleHub = await toBase64(await getCacheImage(
      `${logoColor}.png`,
      `${rootUrl}/img/picture/appleHub_${logoColor}.png`
    ));
    
    const authorAvatar = await toBase64(fm.fileExists(getAvatarImg()) ? fm.readImage(getAvatarImg()) : await getCacheImage(
      'author.png',
      `${rootUrl}/img/icon/4qiao.png`
    ));
    
    const rangeColorImg = await getCacheMaskSFIcon('arrowshape.turn.up.left.2.fill', '#F6C534');
    
    const scripts = ['jquery.min.js', 'bootstrap.min.js', 'loader.js'];
    const scriptTags = await Promise.all(scripts.map(async (script) => {
      const content = await getCacheString(script, `${rootUrl}/web/${script}%3Fver%3D8.0`);
      return `<script>${content}</script>`;
    }));
    
    for (const i of formItems) {
      for (const item of i.items) {
        const { icon } = item;
        if (typeof icon === 'object' && icon.name) {
          const {name, color} = icon;
          item.icon = await getCacheMaskSFIcon(name, color);
        } else if (typeof icon === 'string' && icon?.startsWith('https')) {
          const name = decodeURIComponent(icon.substring(icon.lastIndexOf("/") + 1));
          const image = await getCacheImage(name, icon);
          item.icon = await toBase64(image);
        }
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
    const cssStyle = await getCacheString('cssStyle.css', `${rootUrl}/web/cssStyle.css`);  
    const screenSize = Device.screenSize().height;

    const style =`  
    :root {
      --color-primary: #007aff;
      --divider-color: rgba(60,60,67,0.36);
      --card-background: #fff;
      --card-radius: 10px;
      --checkbox: #ddd;
      --desc-color: #888;
      --list-header-color: rgba(60,60,67,0.6);
      --typing-indicator: #000;
      --separ: var(--checkbox);
    }
    
    .modal-dialog {
      position: relative;
      width: auto;
      margin: ${Device.screenSize().height < 926 ? '62px' : '78px'};
      top: ${Device.screenSize().height < 926 ? '-2%' : '-8%'};
    }
    ${cssStyle}
    `;
    
    // Java Script
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
      const value = settings[item.name] ?? item.default
      formData[item.name] = value;
      
      const label = document.createElement("label");
      label.className = "form-item";
      label.dataset.name = item.name;
      
      const div = document.createElement("div");
      div.className = 'form-label';
      label.appendChild(div);
      
      if ( item.icon ) {
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
        select.style.width = '99px';
      
        item.options?.forEach(grp => {
          const container = grp.label && (item.multiple || !item.multiple) ? document.createElement('optgroup') : select;
          if ( grp.label ) container.label = grp.label;
      
          grp.values.forEach(opt => {
            const option = new Option(opt.label, opt.value);
            option.disabled = opt.disabled || false;
            option.selected = (item.multiple && Array.isArray(value)) ? value.includes(opt.value) : value === opt.value;
            container.appendChild(option);
          });
          if (container !== select) select.appendChild(container);
        });
        
        select.addEventListener( 'change', (e) => {
          const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
          formData[item.name] = item.multiple ? selectedValues : selectedValues[0];
          invoke('changeSettings', formData);
        });
      
        const selCont = document.createElement('div');
        selCont.classList.add('form-item__input__select');
        selCont.appendChild(select);
        
        /**
        const icon = document.createElement('i');
        icon.className = 'iconfont icon-arrow_right form-item__icon';
        selCont.appendChild(icon);
        */
        
        label.appendChild(selCont);
      } else if ( item.type === 'cell' || item.type === 'page' ) {
        if ( item.desc ) {
          const desc = document.createElement("div");
          desc.className = 'form-item-right-desc';
          desc.innerText = settings[item.name];
          label.appendChild(desc);
        }
        
        const icon = document.createElement('i');
        icon.className = 'iconfont icon-arrow_right'
        label.appendChild(icon);
        label.addEventListener('click', (e) => {
          const { name } = item;
          if (name === 'version') {
            //switchDrawerMenu();
            popupOpen();
          }
          const methodName = name === 'preference' || name === 'infoPage' ? 'itemClick' : name;
          invoke(methodName, item);
        });
      } else if (item.type === 'number') {
        const inputCntr = document.createElement("div");
        inputCntr.className = 'form-item__input-container'
  
        const input = document.createElement("input");
        input.className = 'form-item__input'
        input.name = item.name
        input.type = 'number'
        input.value = Number(value)
        input.addEventListener("change", (e) => {
          formData[item.name] = Number(e.target.value);
          invoke('changeSettings', formData);
        });
        inputCntr.appendChild(input);
  
        const icon = document.createElement('i');
        icon.className = 'iconfont icon-arrow_right form-item__icon'
        inputCntr.appendChild(icon);
        label.appendChild(inputCntr);
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
        });
        label.appendChild(input);
      }
      return label
    };
    
    // 创建列表
    const createList = ( list, title ) => {
      const fragment = document.createDocumentFragment();
      let elBody;
    
      for (const item of list) {
        if (item.type === 'group') {
          const grouped = createList(item.items, item.label);
          fragment.appendChild(grouped);
        } else if (item.type === 'range') {
          const groupDiv = fragment.appendChild(document.createElement('div'));
          groupDiv.className = 'list'
          
          const elTitle = groupDiv.appendChild(document.createElement('div'));
          elTitle.className = 'el__header';
          elTitle.textContent = title
          
          elBody = groupDiv.appendChild(document.createElement('div'));
          elBody.className = 'el__body';
          
          const range = elBody.appendChild(document.createElement('div'));
          range.innerHTML = \`
          <label class="collapsible-label" for="collapse-toggle">
            <div class="form-label">
              <div class="collapsible-value">${settings.range || 90}</div>
            </div>
            <input id="_range" type="range" value="${settings.range || 90}" min="0" max="360" step="5">
            <i class="fas fa-chevron-right icon-right-down"></i>
          </label>
          <!-- 折叠取色器 -->
          <div class="collapsible-content" id="content">
            <hr class="separ">
            <label class="form-item">
              <div class="form-label">
                <img class="form-label-img" src="${rangeColorImg}" />
                <div class="form-label-title">渐变颜色</div>
              </div>
              <input type="color" value="${settings.rangeColor}" id="color-input">
            </label>
          </div>\`;
          
          const icon = range.querySelector('.collapsible-label .icon-right-down');
          const content = range.querySelector('.collapsible-content');
          const colorInput = range.querySelector('#color-input');
          const rangeInput = range.querySelector('#_range');
          let isExpanded = false;
          
          const toggleContent = () => {
            content.classList.toggle('show');
            isExpanded = !isExpanded;
            icon.style.transition = 'transform 0.5s';
            icon.style.transform = isExpanded ? 'rotate(90deg)' : 'rotate(0deg)';
          };
          
          range.querySelector('.collapsible-label').addEventListener('click', toggleContent);
          
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
        } else {
          if ( !elBody ) {
            const groupDiv = fragment.appendChild(document.createElement('div'));
            groupDiv.className = 'list'
            if ( title ) {
              const elTitle = groupDiv.appendChild(document.createElement('div'))
              elTitle.className = 'list__header'
              elTitle.textContent = title;
            }
            elBody = groupDiv.appendChild(document.createElement('div'))
            elBody.className = 'list__body'
          }
          const label = createFormItem(item)
          elBody.appendChild(label)
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
    document.getElementById('store').addEventListener('click', () => {
      invoke('store');
    });
    
document.getElementById('install').addEventListener('click', () => {
      invoke('install');
    });
    
    })()`;
  
  
    // 主菜单头像信息
    const mainMenuTop = async () => {
      const avatar = `
      <div class="avatarInfo">
        <span class="signin-loader">
          <img src="${authorAvatar}" class="avatar"/>
        </span>
        <div class="interval"></div>
        <img src="${appleHub}" onclick="switchDrawerMenu()" class="custom-img"><br>
        <div id="store">
          <a class="rainbow-text but">Script Store</a>
        </div>
      </div>`;
      
      const popup = `      
      <div class="modal fade" id="u_sign" role="dialog">
        <div class="modal-dialog">
          <div class="zib-widget blur-bg relative">
            <div id="appleHub" class="box-body sign-logo">
              <img src="${appleHub}">
            </div>
            <div class="box-body">
              <div class="title-h-center popup-title">
                ${scriptName}
              </div>
              <a id="notify" class="popup-content">
                <div class="but">
                  Version ${version}
                </div>
              </a><br>
              <div class="form-label-title"> <li>${updateDate}</li> <li>修复已知问题</li> <li>性能优化，改进用户体验</li>
              </div>
            </div>
            <div class="box-body">
              <div id="sign-in">
                <button id="install" type="button" class="but radius jb-yellow btn-block">立即更新</button>
              </div>
            </div>
            <p class="social-separator separator separator-center">95度茅台</p>
          </div>
        </div>
      </div>
      <script type="text/javascript">
        function popupOpen() {
          $('.signin-loader').click()
        }
        setTimeout(function() {
          $('${updateVersionNotice()}').click();
        }, 1200);
        window._win = { uri: 'https://zibll.com/wp-content/themes/zibll', loading: '0' };
      </script>
      `
      // music
      const songId = [
        '8fk9B72BcV2',
        '8duPZb8BcV2',
        '6pM373bBdV2'
      ];
      const randomId = songId[Math.floor(Math.random() * songId.length)];
      const music = `
      <iframe data-src="https://t1.kugou.com/song.html?id=${randomId}" class="custom-iframe" frameborder="0" scrolling="auto">
      </iframe>
      <script>
        const iframe = document.querySelector('.custom-iframe');
        iframe.src = iframe.getAttribute('data-src');
      </script>`;
      
      return `
        ${avatar}
        ${settings.music === true ? music : ''}
        ${popup}
        ${scriptTags.join('\n')}
      `
    };
    
    /**
     * 底部弹窗信息
     * 创建底部弹窗的相关交互功能
     * 当用户点击底部弹窗时，显示/隐藏弹窗动画，并显示预设消息的打字效果。
     */
    const buttonPopup = async () => {
      const js = `
      const menuMask = document.querySelector(".popup-mask");
  
      const showMask = async (callback, isFadeIn) => {
        const duration = isFadeIn ? 200 : 300;
        const startTime = performance.now();
        
        const animate = ( currentTime ) => {
          const elapsedTime = currentTime - startTime;
          menuMask.style.opacity = isFadeIn ? elapsedTime / duration : 1 - elapsedTime / duration;
          if (elapsedTime < duration) requestAnimationFrame(animate);
          else callback?.();
        };
      
        menuMask.style.display = "block";
        await new Promise(requestAnimationFrame);
        animate(performance.now());
      };

      function switchDrawerMenu() {
        const popup = document.querySelector(".popup-container");
        const isOpen = !popup.style.height || popup.style.height !== '255px';

        showMask(isOpen ? null : () => menuMask.style.display = "none", isOpen);
        popup.style.height = isOpen ? '255px' : '';
        isOpen && typeNextChar();
      };

      // ChatGPT 打字动画
      const typeNextChar = () => {
        const chatMsg = document.querySelector(".chat-message");
        const message = \`${widgetMessage}\`
        chatMsg.textContent = "";
        let currentChar = 0;

        function appendNextChar() {
          if (currentChar < message.length) {
            chatMsg.textContent += message[currentChar++];
            chatMsg.innerHTML += '<span class="typing-indicator"></span>';
            chatMsg.scrollTop = chatMsg.scrollHeight;
            setTimeout(appendNextChar, 30);
          } else {
            chatMsg.querySelectorAll(".typing-indicator").forEach(indicator => indicator.remove());
          }
        }
        appendNextChar();
      }`;

      return `
      <div class="popup-mask" onclick="switchDrawerMenu()"></div>
      <div class="popup-container">
        <div class="popup-widget zib-widget blur-bg">
          <div id="appleHub" class="box-body sign-logo">
            <img src="${appleHub}">
          </div>
          <div class="chat-message"></div>
        </div>
      </div>
      <script>${js}</script>`;
    };
    
    // 组件效果图预览
    previewImgHtml = async () => {
      const previewImgUrl = [
        `${rootUrl}/img/picture/macaujc_black.png`,
        `${rootUrl}/img/picture/macaujc_white.png`
      ];
      
      if ( settings.topStyle ) {
        const previewImgs = await Promise.all(previewImgUrl.map(async (item) => {
          const imgName = decodeURIComponent(item.substring(item.lastIndexOf("/") + 1));
          const previewImg = await toBase64(await getCacheImage(imgName, item));
          return previewImg;
        }));
        return `<div id="scrollBox">
          <div id="scrollImg">
            ${previewImgs.map(img => `<img src="${img}">`).join('')}
          </div>
        </div>
        <div class="popup" id="store"><p>别碰我</p>
        </div>
        <script>
          const popupTips = document.getElementById("store")
          .classList;
          setTimeout(() => popupTips.add("show", "fd"), 999000);
          setTimeout(() => {
            popupTips.remove("fd");
            setTimeout(() => popupTips.remove("show"), 1500);
          }, 3500);
        </script>`; 
      } else {
        const randomUrl = previewImgUrl[Math.floor(Math.random() * previewImgUrl.length)];
        const imgName = decodeURIComponent(randomUrl.substring(randomUrl.lastIndexOf("/") + 1));
        const previewImg = await toBase64(await getCacheImage(imgName, randomUrl));
        return `<img id="store" src="${previewImg}" class="preview-img">`
      }
    };
    
    // =======  HTML  =======//
    const html =`
    <html>
      <head>
        <meta name='viewport' content='width=device-width, user-scalable=no, viewport-fit=cover'>
        <link rel="stylesheet" href="//at.alicdn.com/t/c/font_3772663_kmo790s3yfq.css" type="text/css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
      <style>${style}</style>
      </head>
      <body>
        ${avatarInfo ? await mainMenuTop() : previewImage ? await previewImgHtml() : ''}
        ${head || ''}
        <!-- 底部窗口 -->
        ${await buttonPopup()}
        <section id="settings">
        </section>
        <script>${js}</script>
      </body>
    </html>`;
  
    const webView = new WebView();
    await webView.loadHTML(html, $);
    
    /**
     * Input window
     * @param data
     * @returns {Promise<string>}
     */
    const input = async ({ label, message, name } = data) => {
      return new Promise(resolve => {
        generateInputAlert({
          title: label,
          message: message,
          options: [
            {
              hint: String(settings[name]),
              value: String(settings[name])
            }
          ]
        },
        async ([{ value }]) => {
          const result = /^\d+$/.test(value) ? settings[name] = Number(value) : settings[name];
          writeSettings(settings);
          resolve(result);
        })
      })
    };
    
    /**
     * 修改特定 form 表单项的文本
     * @param {string} fieldName
     * @param {string} newText
     * @param {WebView} webView
     */
    const updateFormText = async (fieldName, newText) => {
      webView.evaluateJavaScript(
        `document.querySelector('.form-item[data-name="${fieldName}"] .form-item-right-desc').innerText = ${JSON.stringify(newText)}`, false
      )
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
        const action = await generateAlert(  
          '清除缓存', '是否确定删除所有缓存？\n离线内容及图片均会被清除。',
          options = ['取消', '清除']
        );
        if ( action === 1 ) {
          fm.remove(cache);
          ScriptableRun();
        }
      } else if (code === 'reset') {
        const action = await generateAlert(
          '清空所有数据', 
          '该操作将把用户储存的所有数据清除，重置后等待5秒组件初始化并缓存数据', 
          ['取消', '重置'], '重置'
        );
        if ( action === 1 ) {
          fm.remove(mainPath);
          ScriptableRun();
        }
      } else if (code === 'updateCode') {
        await updateVersion();
      } else if (code === 'bufferTime') {
        updateFormText('bufferTime', await input(data));
      };
      
      switch (code) {
        case 'setAvatar':
          const avatar = await Photos.fromLibrary();
          fm.writeImage(
            getAvatarImg(), await drawSquare(avatar)
          );
          ScriptableRun();
          break;
        case 'telegram':
          Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false);
          break;
        case 'changeSettings':
          Object.assign(settings, data);
          writeSettings(settings);
          break;
        case 'preview':
          await importModule(await webModule(scrName, scrUrl)).main();
          break;
        case 'chooseBgImg':
          const image = await Photos.fromLibrary();
          fm.writeImage(getBgImage(), image);
          notify('设置成功', '桌面组件稍后将自动刷新');
          break;
        case 'clearBgImg':
          const bgImagePath = fm.fileExists(getBgImage());
          if ( bgImagePath ) {
            fm.remove(getBgImage());
            notify('已删除背景图', '桌面组件稍后将自动刷新');
          }
          break;
        case 'background':
          const modulePath = webModule('background.js', `${rootUrl}/main/main_background.js`);
          if (modulePath != null) {
            await importModule(await modulePath).main(cacheImg);
            await previewWidget();
          }
          break;
        case 'store':
          const storeModule = webModule('store.js', `${rootUrl}/main/web_main_95du_Store.js`);
          await importModule(await storeModule).main();
          await myStore();
          break;
        case 'install':
          await updateString();
          break;
        case 'itemClick':
          if (data.type === 'page') {
            const item = (() => {
              const find = (i) => {
                for (const el of i) {
                  if (el.name === data.name) return el
                  if (el.type === 'group') {
                    const r = find(el.items);
                    if (r) return r
                  }
                }
                return null
              };
              return find(formItems)
            })();
            await renderAppView(item, false, { settings });
          } else {
            await onItemClick?.(data, { settings });
          }
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
  
  
  // 用户菜单
  const userMenu = (() => {
    const formItems = [
      {
        type: 'group',
        items: [
          {
            label: '图片轮播',
            name: 'topStyle',
            type: 'switch',
            icon: {
              name: 'photo.tv',
              color: '#FF9500'
            },
            default: true
          },
          {
            label: '缓存时间',
            name: 'bufferTime',
            type: 'cell',
            icon: {
              name: 'clock',
              color: '#0096FF'
            },
            message: '设置缓存离线内容及图片的时长\n( 单位: 小时 )',
            desc: settings.bufferTime
          },
          {
            label: '用户登录',
            name: 'login',
            type: 'cell',
            icon: {
              name: 'person.crop.circle',
              color: '#43CD80'
            }
          }
        ]
      },
      {
        type: 'group',
        items: [
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
      }
    ];
    return formItems;
  })();
  
  // 设置菜单
  const settingMenu = (() => {
    const formItems = [
      {
        label: '设置',
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
            name: "titleLightColor",
            label: "标题颜色",
            type: "color",
            icon: {
              name: 'checklist',
              color: '#F9A825'
            }
          },
          {
            name: "gradient",
            label: "渐变背景",
            type: "color",
            icon: `${rootUrl}/img/symbol/gradient.png`
          }
        ]
      },
      {
        label: '渐变角度、颜色',
        type: 'group',
        items: [
          {
            type: 'range',
            name: 'range',
            color: 'rangeColor'
          }
        ]
      },
      {
        type: 'group',
        items: [
          {
            label: '刷新时间',
            name: 'refresh',
            type: 'number',
            icon: `${rootUrl}/img/symbol/refresh.png`
          },
          {
            label: '精选渐变',
            name: 'gradient',
            type: 'select',
            multiple: true,
            icon: `${rootUrl}/img/symbol/gradientBackground.png`,
            options: [
              {
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
                label: 'more',
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
            type: 'number',
            id: 'input',
            icon: `${rootUrl}/img/symbol/masking.png`
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
            type: 'number',
            id: 'input',
            icon: {
              name: 'photo.stack',
              color: '#8E8D91'
            }
          },
          {
            label: '图片背景',
            name: 'chooseBgImg',
            type: 'cell',
            icon: `${rootUrl}/img/symbol/bgImage.png`
          },
          {
            label: '清除背景',
            name: 'clearBgImg',
            type: 'cell',
            icon: `${rootUrl}/img/symbol/clearBg.png`,
            desc: fm.fileExists(getBgImage()) ? '已设置' : ''
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
            icon: `${rootUrl}/img/symbol/update.png`,
            default: true
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
      {
        type: 'group',
        items: [
          {
            label: '组件信息',
            name: 'infoPage',
            type: 'page',
            icon: {
              name: 'person.crop.circle',
              color: '#43CD80'
            },
            formItems: userMenu,
            previewImage: true
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
            label: '组件信息',
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
            label: '偏好设置',
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
      }
    ]
  }, true);
}
module.exports = { main }