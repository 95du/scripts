// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: rocket;
/**
 * 免责声明: 此脚本提供的 AppleID 账号来自于网络，仅供测试使用，不对安全性、稳定性以及不可预知的风险负责，建议购买独享账号。请勿登陆iCloud❗️ 双重认证请点击“其他选项”>“不升级”，否则您的手机会被锁定。
 * 使用方法: 在组件上点击"正常"按钮查看。
 * 快速拷贝AppleID和密码 (先安装捷径);
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'apple_id');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const cacheFile = fm.joinPath(mainPath, 'cache.json');

const autoUpdate = async () => {
  const script = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/apple_id.js').loadString();
  fm.writeString(module.filename, script);
};

const getAppleId = async () => {  
  const url = atob('YUhSMGNITTZMeTloY0dsa0xtcGpibVl1ZUhsNkwzTm9ZWEpsTDJaNlpVWmplbVpuUkc5WmQweFRaUT09');
  const html = await new Request(atob(url)).loadString();
  const webView = new WebView();
  await webView.loadHTML(html);
  
  const regex = /<h3 align="center">(.*?)<\/h3>/g;
  const replacedHtml = html.replace(regex, '');
  
  try {
    const eventsData = await webView.evaluateJavaScript(`
      (() => {
        const cardBody = document.querySelector('.card-body');
        const cardSubtitle = cardBody.querySelectorAll('.card-subtitle');
        const tips = cardSubtitle[0].textContent.trim();
        const checkDate = cardSubtitle[1].textContent.trim();
        const status = cardSubtitle[2].querySelector('.badge').textContent.trim();
        const unblock = document.querySelector('.badge.bg-orange').textContent.trim();
        const id = cardBody.querySelector('.btn-primary').getAttribute('data-clipboard-text').trim();
        const password = cardBody.querySelector('.btn-success').getAttribute('data-clipboard-text').trim();
        const url = '${atob(url)}';
        
        return { tips, checkDate, url, status, unblock, id, password };
      })();
    `);
    
    if (config.runsInApp) {
      fm.writeString(cacheFile, JSON.stringify(eventsData, null, 2));  
    }
    return eventsData;
  } catch (e) {
    const accountInfo = JSON.parse(fm.readString(cacheFile));
    accountInfo.id = html.match(/<title>(.*?)<\/title>/)[1];
    return accountInfo;
  }
};

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

const createWidget = async () => {
  const { tips, checkDate, status, unblock, id, password, url } = await getAppleId();
  
  const widget = new ListWidget();
  widget.setPadding(12, 17, 15, 17);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  
  createText({ mainStack, text: id, font: Font.boldSystemFont(16), color: !id.includes('@') ? Color.red() : null });
  createText({ mainStack, text: `${password}    「 密码 」`, font: Font.boldSystemFont(16) });
  createText({ mainStack, text: tips, font: Font.systemFont(14.5), opacity: 0.7 });
  createText({ mainStack, text: checkDate, font: Font.mediumSystemFont(15), color: Color.blue(), gap: 8 });
  
  const buttonStack = mainStack.addStack();
  buttonStack.layoutHorizontally();
  buttonStack.centerAlignContent();
  
  createButtonStack(
    buttonStack, 
    status === '正常' ? Color.green() : Color.red(), status, 
    'https://idbao.vip/wp-content/uploads/2023/11/iosid.png'
  );
  createButtonStack(
    buttonStack, 
    new Color('#FF7000'), '安装捷径', 
    'shortcuts://shortcuts/89b694bb11c248c38355e57267ab2e76'
  );
  createButtonStack(
    buttonStack, 
    Color.purple(), '获取', 
    'shortcuts://run-shortcut?name=runScript&input=text'  
  );
  createButtonStack(
    buttonStack,
    Color.blue(), 'ChatGPT', 
    'https://ccbaohe.com/ChatGPTID.html'  
  );
  
  if (config.runsInApp) {
    widget.presentMedium();
    //autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};

config.widgetFamily === 'medium' || config.runsInApp ? await createWidget() : null;