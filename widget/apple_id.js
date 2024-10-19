// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: rocket;
/**
 * 免责声明: 此脚本提供的 AppleID 账号来自于网络，仅供测试使用，不对安全性、稳定性以及不可预知的风险负责，建议购买独享账号。请勿登陆iCloud❗️ 双重认证请点击“其他选项”>“不升级”，否则您的手机会被锁定。
 * 使用方法: 在组件上点击"正常"按钮查看。
 * 快速拷贝AppleID和密码 (点组件上的获取)
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'apple_id');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const cacheFile = fm.joinPath(mainPath, 'cache.json');

const getSettings = (file) => {
  return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : {};
};
const setting = await getSettings(cacheFile);

const toBase64 = (img) => `data:image/png;base64,${Data.fromPNG(img).toBase64String()}`

const useFileManager = () => {
  const fullPath = (name) => fm.joinPath(mainPath, name);
  return {
    readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
    writeImage: (name, image) => fm.writeImage(fullPath(name), image)
  };
};
  
const getCacheImage = async (name, url, toBase64) => {
  const cache = useFileManager();
  const image = cache.readImage(name);
  if (image) return toBase64 ? toBase64(image) : image;

  const loadedImg = await new Request(url).loadImage();
  cache.writeImage(name, loadedImg);
  return toBase64 ? toBase64(loadedImg) : loadedImg;
};

const generateAlert = async ( title, message = '', options, destructiveAction ) => {
  const alert = new Alert();
  alert.title = title;
  alert.message = message ?? '';
  for (const option of options) {
    option === destructiveAction ? alert.addDestructiveAction(option) : alert.addAction(option);
  }
  return await alert.presentAlert();
};

const getRandomItem = async (array) => array[Math.floor(Math.random() * array.length)];

const run = 'scriptable:///run/' + encodeURIComponent(Script.name());

const getString = async (url) => await new Request(url).loadString();

const autoUpdate = async () => {
  const script = await getString('https://gitcode.net/4qiao/scriptable/raw/master/api/apple_id.js');
  fm.writeString(module.filename, script);
};

const getAppleId = async () => {
  const url = atob('YUhSMGNITTZMeTlqWTJKaGIyaGxMbU52YlM5aGNIQnNaVWxFTWc9PQ==');
  const html = await new Request(atob(url)).loadString();
  const webView = new WebView();
  await webView.loadHTML(html);

  const events = await webView.evaluateJavaScript(`
    (() => {
      const decodeEmail = str => {
        let email = '';
        const r = parseInt(str.substr(0, 2), 16);
        for (let n = 2; n < str.length; n += 2) {
          email += String.fromCharCode(parseInt(str.substr(n, 2), 16) ^ r);
        }
        return email;
      };

      const extract = (card, selector, attr) => {
        const elem = card.querySelector(selector);
        if (!elem) return '';
        if (attr === 'text') return elem.innerText.trim();
        if (attr === 'data-cfemail') return decodeEmail(elem.getAttribute(attr));
        if (attr === 'onclick') {
          const onclickAttr = elem.getAttribute(attr);
          if (onclickAttr) {
            const parts = onclickAttr.split("copy('");
            if (parts.length > 1) return parts[1].split("')")[0];
          }
        }
        return '';
      };

      return Array.from(document.querySelectorAll('.card')).map(card => ({
        status: extract(card, '.card-title', 'text').replace('账号状态：', ''),
        checkDate: extract(card, '.card-text', 'text'),
        appleId: extract(card, 'span[data-cfemail]', 'data-cfemail') || extract(card, 'button:nth-of-type(1)', 'onclick'),
        password: extract(card, 'button:nth-of-type(2)', 'onclick')
      })).filter(item => item.appleId && item.password);
    })();
  `);

  return { url, events };
};

// 获取数据
const { url, events } = await getAppleId();

const normalAcc = events.map(record => (record.status === "正常" || record.status === "正常可用") ? record : record.status.includes("安全问题") ? {...record, status: "请使用备用账号"} : record);

const normal = `备用中还有${normalAcc.length - 1}个正常账号`;

const { status, checkDate, appleId, password } = normalAcc.reduce((prev, curr) => {
  const prevDate = new Date(prev.checkDate.split("：")[1]);
  const currentDate = new Date(curr.checkDate.split("：")[1]);
  return prevDate > currentDate ? prev : curr;
});

// addition text stack
const createText = ({ mainStack, text, font, color, opacity, gap = 5 }) => {
  const dataText = mainStack.addText(text);
  dataText.font = font;
  if (color) dataText.textColor = color;
  if (opacity) dataText.textOpacity = opacity;
  mainStack.addSpacer(gap);
  return dataText;
};

const createButtonStack = (buttonStack, color, text, url) => {
  const barStack = buttonStack.addStack();
  barStack.setPadding(2, 12, 2, 12);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = color;
  barStack.url = url;
  
  const statusText = barStack.addText(text);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(14);
  buttonStack.addSpacer(6);
  return barStack;
};

const themeMode = () => {
    const theme = Device.isUsingDarkAppearance() ? 'white' : 'dark';
    return [`${theme}.png`, `https://gitcode.net/4qiao/framework/raw/master/img/icon/chatGPT_${theme}.png`];
};

const randomImgUrl = (useRandom) => useRandom === 0 ? ['button.png', 'https://gitcode.net/4qiao/framework/raw/master/img/icon/button_false.png'] : themeMode();

// 组件
const createWidget = async () => {
  const widget = new ListWidget();
  widget.setPadding(12, 17, 15, 17);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  
  createText({ mainStack, text: appleId, font: Font.boldSystemFont(16), color: !appleId.includes('@') ? Color.red() : null });
  createText({ mainStack, text: `${password}    「 密码 」`, font: Font.boldSystemFont(16) });
  createText({ mainStack, text: '账号信息：请勿开启二次验证或登录icloud，有锁机风险！如密码错误，请点击“备用地址”', font: Font.systemFont(14.5), opacity: 0.7 });
  createText({ mainStack, text: checkDate, font: Font.mediumSystemFont(15), color: Color.blue(), gap: 8 });
  
  const buttonStack = mainStack.addStack();
  buttonStack.layoutHorizontally();
  buttonStack.centerAlignContent();
  
  const randomZeroOrOne = Math.round(Math.random());
  createButtonStack(buttonStack, normalAcc ? Color.green() : Color.red(), status, 'https://idbao.vip/wp-content/uploads/2023/11/iosid.png');
  const [buttonLabel, buttonAction] = randomZeroOrOne === 0
    ? ['备用地址', run]
    : ['ChatGPT', 'https://chat.openai.com'];
  createButtonStack(buttonStack, new Color('#FF7000'), buttonLabel, buttonAction);
  createButtonStack(buttonStack, Color.purple(), '获取', run);
  buttonStack.addSpacer();
  
  const [imgName, imgUrl] = randomImgUrl(randomZeroOrOne);
  const image = await getCacheImage(imgName, imgUrl);
  buttonStack.size = new Size(0, 22);
  buttonStack.addImage(image);
  
  Script.setWidget(widget);
  Script.complete();
};

const getAppleIdWeb = async () => {  
  const randomImg = await getRandomItem([
    'https://sweixinfile.hisense.com/media/M00/81/A6/Ch4FyGXuAF-AXpYnAAS-yVNfIxM05.jpeg',
    'https://sweixinfile.hisense.com/media/M00/81/64/Ch4FyWXuAHyAKpxrAAVBm03_dl422.jpeg'
  ]);
  
  const name = randomImg.split('/').pop();
  const image = await getCacheImage(name, randomImg, toBase64);
  const chatGPT_icon = await getCacheImage('chatGPT_icon.png', 'https://gitcode.net/4qiao/framework/raw/master/img/icon/chatGPT_white.png', toBase64);
  
  const rankCircle = `
  <head>
    <style>
      .card-center {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 280px;
        margin-bottom: 10px;
      }
      
      .header {
        font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
        fill: #e7f216;
        animation: fadeInAnimation 2s ease-in-out forwards;
      }
  
      @supports(-moz-appearance: auto) {
        .header {
          font-size: 15.5px;
        }
      }
  
      .stat {
        font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif;
        fill: #fff;
      }
  
      @supports(-moz-appearance: auto) {
        .stat {
          font-size: 13px;
        }
      }
  
      .stagger {
        opacity: 0;
        animation: fadeInAnimation 0.3s ease-in-out forwards;
      }
  
      .rank-text {
        font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif;
        fill: #fff;
        animation: scaleInAnimation 0.8s ease-in-out forwards;
      }
  
      .rank-percentile-header {
        font-size: 14px;
      }
  
      .rank-percentile-text {
        font-size: 16px;
      }
  
      .not_bold {
        font-weight: 400
      }
  
      .bold {
        font-weight: 700
      }
  
      .icon {
        fill: #e7f216;
        display: block;
      }
  
      .rank-circle-rim {
        stroke: #e7f216;
        fill: none;
        stroke-width: 6;
        opacity: 0.3;
      }
  
      .rank-circle {
        stroke: #e7f216;
        stroke-dasharray: 251.32741228718345;
        fill: none;
        stroke-width: 6;
        stroke-linecap: round;
        opacity: 0.8;
        transform-origin: -10px 8px;
        transform: rotate(-90deg);
        animation: rankAnimation 1s forwards ease-in-out;
      }
    
      @keyframes rankAnimation {
        from {
          stroke-dashoffset: 251.32741228718345;
        }
        to {
          stroke-dashoffset: 70;
        }
      }
  
      /* Animations */
      @keyframes scaleInAnimation {
        from {
          transform: translate(-5px, 5px) scale(0);
        }
  
        to {
          transform: translate(-5px, 5px) scale(1);
        }
      }
  
      @keyframes fadeInAnimation {
        from {
          opacity: 0;
        }
  
        to {
          opacity: 1;
        }
      }
    </style>
  </head>
  <body>
    <div class="card-center">
      <svg width="100%" height="100%" viewBox="0 0 467 195" fill="none">
        <defs>
          <linearGradient id="gradient" gradientTransform="rotate(30)" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#e96443" />,
            <stop offset="100%" stop-color="#904e95" />
          </linearGradient>
        </defs>
        <g data-testid="card-title" transform="translate(25, 35)">
          <g transform="translate(0, 0)">
            <text x="0" y="0" id="title" for="input" class="header" data-testid="header">${setting.value ? 'Shadowrocket' : normal}</text>
          </g>
        </g>
        <g data-testid="main-card-body" transform="translate(0, 55)">
          <g data-testid="rank-circle" transform="translate(390.5, 47.5)">
            <circle class="rank-circle-rim" cx="-10" cy="8" r="40"/>
            <circle class="rank-circle" cx="-10" cy="8" r="40"/>
            <g class="rank-text">
              <svg x="-38" y="-30" height="66" width="66" aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" data-testid="github-rank-icon" onclick="window.location.href = '${run}'">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z">  
                </path>
              </svg>
            </g>
          </g>
          <svg x="0" y="0">
            <g transform="translate(0, 0)">
              <g class="stagger" style="animation-delay: 450ms" transform="translate(25, 0)">
                <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
                  <path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z" />
                </svg>
                <text class="stat  bold" x="25" y="12.5">OpenAI ChatGPT</text>
                <text class="stat  bold" x="219.01" y="12.5" data-testid="stars">1</text>
              </g>
            </g>
            <g transform="translate(0, 25)">
              <g class="stagger" style="animation-delay: 600ms" transform="translate(25, 0)">
                <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
                  <path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z" />
                </svg>
                <text class="stat  bold" x="25" y="12.5">Midjourney</text>
                <text class="stat  bold" x="219.01" y="12.5" data-testid="commits">2</text>
              </g>
            </g>
            <g transform="translate(0, 50)">
              <g class="stagger" style="animation-delay: 750ms" transform="translate(25, 0)">
                <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
                  <path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                </svg>
                <text class="stat  bold" x="25" y="12.5">Notion AI</text>
                <text class="stat  bold" x="219.01" y="12.5" data-testid="prs">3</text>
              </g>
            </g>
            <g transform="translate(0, 75)">
              <g class="stagger" style="animation-delay: 900ms" transform="translate(25, 0)">  
                <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
                  <path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" />
                </svg>
                <text class="stat  bold" x="25" y="12.5">Auto Draw AI</text>
                <text class="stat  bold" x="219.01" y="12.5" data-testid="issues">4</text>
              </g>
            </g>
            <g transform="translate(0, 100)">
              <g class="stagger" style="animation-delay: 1050ms" transform="translate(25, 0)">
                <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
                  <path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z" />
                </svg>
                <text class="stat  bold" x="25" y="12.5">Scriptable App</text>
                <text class="stat  bold" x="219.01" y="12.5" data-testid="contribs">5</text>
              </g>
            </g>
          </svg>
        </g>
      </svg>
    </div>
  </body>`;
  
  const html = `
  ${rankCircle}
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <head>
    <style>
      :root {
        --blur-bg: rgba(255, 255, 255, 0.75);
      }
  
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: black;
        height: 100vh;
        justify-content: center;
        align-items: center;
        margin: 15px;
        overflow: hidden;
      }
      
      .loaded {
        background-image: url('https://sweixinfile.hisense.com/media/M00/81/A6/Ch4FyGXuAF-AXpYnAAS-yVNfIxM05.jpeg');
        background-size: cover;
        background-position: center;
      }
      
      .blur-bg {
        -webkit-backdrop-filter: saturate(5) blur(20px);
        backdrop-filter: saturate(5) blur(20px);
        background: var(--blur-bg);
      }
  
      .card {
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: var(--blur-bg);
        padding: 15px 20px 15px 20px;
        cursor: pointer;
        border-radius: 20px;
        margin-top: 2%;
        margin-bottom: 10%;
        height: 230px;
      }
  
      .container {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin: 0px;
        justify-content: center;
        height: 100vh;
      }
  
      .text {
        font-size: 15px;
        align-items: center;
      }
  
      .text:nth-child(1) {
        font-size: 16px;
        font-weight: 400;
        margin-bottom: 23px;
      }
      
      .text:nth-child(2) {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 5px;
      }
  
      .text:nth-child(3) {
        color: #333;
        margin-bottom: 5px;
      }
  
      .text:nth-child(4) {
        color: blue;
        margin-bottom: 5px;
      }
  
      .status-container {
        display: flex;
        align-items: center;
      }
  
      .status {
        font-size: 15px;
        margin-right: 5.5px;
      }
  
      .button-container {
        display: flex;
        margin-top: 15px;
        align-items: center;
      }
  
      .button {
        background-color: #00c200;
        color: white;
        padding: 2px 10px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        margin-right: 5px;
      }
  
      .button-blue {
        background-color: #008DFF;
        padding: 8px 25px;
        font-size: 16px;
        border-radius: 8px;
      }
  
      .button-orange {
        background-color: #ff7800;
        padding: 8px 25px;
        font-size: 16px;
        border-radius: 8px;
      }
      
      /* 提示框 */
      .popup {
        position: fixed;
        top: -80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #fff;
        color: #000;
        border-radius: 22px;
        padding: 10px;
        width: 150px;
        height: 25px;
        opacity: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        text-align: center;
        font-size: 16px;
        transition: top 0.65s ease-in-out, opacity 1s ease-in-out;
      }
  
      .popup.show {
        top: 0.3%;
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
      /* 提示框结束 */
      
      .checkbox {
        position: relative;
        display: inline-block;
        appearance: none;
        width: 46.6px;
        height: 28px;
        border-radius: 28px;
        background: #ff9500;
        margin-left: 60px;
        transition: 0.3s ease-in-out;
      }
  
      .checkbox::before {
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
  
      .checkbox:checked {
        background: #34C759;
      }
  
      .checkbox:checked::before {
        transform: translateX(18.6px);
      }
      
      .button-text {
        font-size: 17px;
        color: #e7f216;
        margin: -30px 0 50px 20px;
        text-align: center;
        display: flex;
        align-items: center;
        /* justify-content: center; 在轴上居中对齐 */
      }
    
      p {
        font-size: 15px;
        text-align: center;
        line-height: 1.5;
        color: grey;
      }
      
      @media (max-width: 480px) {
        body {
          touch-action: pan-x pan-y !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="button-text header" onclick="openChatGPT()">
      <img src="${chatGPT_icon}" style="height: 25px; margin-right: 10px;"><span id="chatGPT">零门槛使用网页版 ChatGPT</span>  
    </div>
    <g transform="translate(0, 0)">
      <text class="header" style="color: #e7f216; font-size: 18px; margin-left: 20px;">95du丶@</text>
    </g>
    <div class="popup" id="popup">复制成功</div>
    <div class="card blur-bg">
      <div class="container">
        <div class="text" id="first" for="input">
          ${setting.value ? normal : '账号信息'}
        </div> 
        <div class="text">
          ${appleId}
        </div>
        <div class="text">账号信息：请勿开启二次验证或登录icloud，有锁机风险！如密码错误，请点击“备用”</div>
        <div class="text">
          ${checkDate}
        </div>
        <div class="status-container">
          <div class="status">
            账号状态
          </div>
          <button class="button">${status}</button>
          <button id="standby-1" class="button" style="background-color: #C030DE; display: ${setting.value ? 'none' : 'block'};" onclick="window.location.href = '${atob(url)}'">备用 1</button>    
          <button id="standby-2" class="button" style="background-color: #ff9500; display: ${setting.value ? 'block' : 'none'};" onclick="window.location.href = 'https://zcjd.top/s'">备用 2</button>
        </div>
        <div class="button-container">
          <button class="button button-blue" onclick="handleClick('账号', '${appleId}')">复制账号</button>
          <button class="button button-orange" onclick="handleClick('密码', '${password}')">复制密码</button>  
          <input type="checkbox" id="input" class="checkbox" ${setting.value ? 'checked' : ''}>
        </div>
      </div>
    </div>
    <p onclick="window.location.href='https://idbao.vip/wp-content/uploads/2023/11/iosid.png'">点击查看使用方法</p>
    <script>
      window.onload = () => document.body.classList.add('loaded')
      
      const handleClick = (title, value) => {
        const item = { title, value }
        const event = new CustomEvent('JBridge', { detail: { code: 1, data: item } });
        window.dispatchEvent(event);
        if (typeof value !== 'boolean') showPopup();
      };
      
      const showPopup = () => {
        const popup = document.getElementById('popup');
        popup.classList.add('show', 'fd');
        setTimeout(() => {
          popup.classList.remove('fd');
          setTimeout(() => popup.classList.remove('show'), 1000)
        }, 1000);
      };

      const openChatGPT = () => {
        const chatGPT = document.getElementById('chatGPT');
        if (chatGPT) {  
          chatGPT.textContent = '正在打开 ChatGPT ...';
        }
        window.location.href = 'https://chat.openai.com';
      };
      
      const toggle = document.getElementById('input');
      const first = document.getElementById('first');
      const title = document.getElementById('title');  
      const standbyFirst = document.getElementById('standby-1');  
      const standbySecond = document.getElementById('standby-2');
      toggle.addEventListener('change', () => { 
        updateLabel(); 
        updateBottom();
      });
      
      function updateLabel() {
        first.textContent = toggle.checked ? '${normal}' : '账号信息';
        title.textContent = toggle.checked ? 'Shadowrocket' : '${normal}';
        handleClick('toggle', toggle.checked);
      };
      
      function updateBottom() {
        standbyFirst.style.display = toggle.checked ? 'none' : 'block';
        standbySecond.style.display = toggle.checked ? 'block' : 'none';
      }
    </script>
  </body>`;
  
  const webView = new WebView();
  await webView.loadHTML(html);
  
  const injectListener = async () => {
    const event = await webView.evaluateJavaScript(
      `(() => {
        const controller = new AbortController();
        const listener = (e) => {
          completion(e.detail);
          controller.abort();
        };
        window.addEventListener('JBridge', listener, { signal: controller.signal });
      })()`, true
    ).catch((err) => {
      console.error(err);
    });
  
    const { data } = event;
    if (data.title === 'toggle') {
      setting.value = data.value;
      fm.writeString(cacheFile, JSON.stringify(setting, null, 2));
    } else {
      Pasteboard.copy(data.value);
      await generateAlert(data.value, null, [`${data.title}`]);
    }
    await injectListener();
  };
  
  injectListener().catch((e) => {
    console.error(e);
  });
  
  webView.present();
};

config.widgetFamily === 'medium' ? await createWidget() : await getAppleIdWeb().then(() => autoUpdate());