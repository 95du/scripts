// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: clipboard-list;
/**
 * 组件作者: 95度茅台
 * 组件名称: 埃隆·马斯克、ChatGPT最新资讯
 * 组件版本: Version 1.0.0
 * 发布时间: 2023-11-22
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 */

const gradientBackground = true //背景

const fm = FileManager.local();
const cache = fm.joinPath(fm.documentsDirectory(), '95du_elonMusk');
if (!fm.fileExists(cache)) fm.createDirectory(cache);

// Cache data
const useFileManager = ({ cacheTime } = {}) => {
  return {
    readString: (name) => {
      const filePath = fm.joinPath(cache, name);
      if (fm.fileExists(filePath) && hasExpired(filePath) > cacheTime) {
        fm.remove(filePath);
        return null;
      }
      return fm.fileExists(filePath) ? fm.readString(filePath) : null;
    },
    writeString: (name, content) => fm.writeString(fm.joinPath(cache, name), content),
    // cache image
    readImage: (name) => {
      const filePath = fm.joinPath(cache, name);
      if (fm.fileExists(filePath) && hasExpired(filePath) > cacheTime) {
        fm.remove(filePath);
        return null;
      }
      return fm.fileExists(filePath) ? fm.readImage(filePath) : null;
    },
    writeImage: (name, image) => fm.writeImage(fm.joinPath(cache, name), image),
  };
  
  function hasExpired(filePath) {
    const createTime = fm.creationDate(filePath).getTime();
    return (Date.now() - createTime) / (60 * 60 * 1000);
  }
};

const getCacheData = async (name, url, cacheTime, type) => {  
  const cache = useFileManager({ cacheTime });
  const cacheData = type 
    ? cache.readString(name) 
    : cache.readImage(name);
  if (cacheData) return cacheData;
  
  const response = type ? await new Request(url).loadString() : await new Request(url).loadImage();
  cache[type ? 'writeString' : 'writeImage'](name, response);
  return response;
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/elonMusk_info.js').loadString();
  fm.writeString(module.filename, script);
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

const shimoFormData = async (action) => {
  const req = new Request(atob('aHR0cHM6Ly9zaGltby5pbS9hcGkvbmV3Zm9ybXMvZm9ybXMvMndBbGRaVjdhd2lyYnhBUC9zdWJtaXQ='));
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [
      {
        type: 4,
        guid: 'sUXkKp7R',
        text: { content: '' },
      },
    ],
    userName: `elonMusk  -  ${Device.systemName()} ${Device.systemVersion()}  ${action}`
  });
  await req.loadJSON();
};

// get data
const getNewsList = async () => {
  const name = ['ailongmasike', 'chatgpt', 'tesila', 'cybertruck'];
  const randomApi = getRandomItem(name);
  await shimoFormData(randomApi);
  
  const html = await getCacheData(`${randomApi}.html`, `https://news.mydrivers.com/tag/${randomApi}.htm`, 4, true);
  const webView = new WebView();
  await webView.loadHTML(html);

  const eventsData = await webView.evaluateJavaScript(`
    (() => {
      const shareIcons = Array.from(document.querySelectorAll('.text-wrapper_share a')).map(a => a.querySelector('img').getAttribute('src'));

      const newsList = Array.from(document.querySelectorAll('ul#newsleft_1 li')).map(li => {
        const title = li.querySelector('h3 a').textContent.trim();
        const desc = li.querySelector('p a').textContent.replace(/\\n/g, '').trim();
        const imgUrl = li.querySelector('div.news_left img').getAttribute('data-original');
        const id = li.querySelector('h3 a').id.split('_')[1];
        const date = li.querySelector('span.time').textContent.trim();
        return { title, desc, imgUrl, id, date, shareIcons };
      });
      return newsList[0];
    })();
  `);

  return eventsData;
};

const { title, desc, imgUrl, id, date, shareIcons } = await getNewsList();

const name = imgUrl.split('/').pop();
const picture = await getCacheData(name, imgUrl, 4);

const status = new Date(date).toDateString() === new Date().toDateString() ? 'new' : 'hot'
const statusIcon = await getCacheData(`${status}.png`, `https://h5.sinaimg.cn/upload/100/1378/2023/05/16/ic_discovery_${status}.png`);

const schemeUrl = `https://m.mydrivers.com/newsview/${id}.html?ref=https%3A//news.mydrivers.com/tag/ailongmasike.htm`;

// 设置组件背景
const setBackground = (widget) => {
  if (gradientBackground && !Device.isUsingDarkAppearance()) {
    const gradient = new LinearGradient();
    const colors = [
      '#F7CE46'
    ];
    const randomColor = getRandomItem(colors);
      
    const angle = 90 // 渐变角度
    const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
    const x = 0.5 + 0.5 * Math.cos(radianAngle);
    const y = 0.5 + 0.5 * Math.sin(radianAngle);
    gradient.startPoint = new Point(1 - x, y);
    gradient.endPoint = new Point(x, 1 - y);
      
    gradient.locations = [0, 1];
    gradient.colors = [
      new Color(randomColor, 0.3),
      new Color('#00000000')
    ];
    widget.backgroundGradient = gradient;
  } else {
    widget.backgroundColor = Color.dynamic(new Color('#FFFFFF'), new Color('#111111'));
  }
};

//=========> Create <=========//
const createWidget = async () => {
  const widget = new ListWidget();
  setBackground(widget);
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 20);  
  widget.url = schemeUrl;
  
  widget.setPadding(13, 18, 13, 18);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.centerAlignContent();
  
  const titleStack = mainStack.addStack();
  titleStack.layoutHorizontally();
  titleStack.centerAlignContent();
  
  const titleText = titleStack.addText(title)
  titleText.leftAlignText();
  titleText.textOpacity = 0.9;
  titleText.font = Font.boldSystemFont(16.5);
  titleStack.addSpacer();
  
  const imageStack = titleStack.addStack();
  imageStack.size = new Size(0, 36);
  imageStack.cornerRadius = 6
  const image = imageStack.addImage(picture);
  mainStack.addSpacer();
  
  // 绘制分割线
  const context = new DrawContext()
  context.size = new Size(150, 0.5);
  context.opaque = false;
  context.respectScreenScale = true;
  context.setFillColor(new Color('#777777', 0.55));
  const path = new Path();
  path.addRoundedRect(new Rect(0, 0, 150, 0.3), 3, 2);
  context.addPath(path);
  context.fillPath();
  const line = context.getImage();
  const drawLine = mainStack.addImage(line);
  drawLine.centerAlignImage();
  mainStack.addSpacer();
  
  // bottom content
  const dateStack = mainStack.addStack();
  dateStack.layoutHorizontally();
  dateStack.centerAlignContent();
  const dateText = dateStack.addText(date);
  dateText.font = Font.mediumSystemFont(15);
  dateText.textColor = Color.dynamic(new Color('#000000', 0.6), new Color('#F7CE46'));
  dateStack.addSpacer(8);
  
  const icon = dateStack.addImage(statusIcon);
  icon.imageSize = new Size(16, 16);
  dateStack.addSpacer();
  
  for (item of shareIcons) {
    dateStack.addSpacer(8);
    const urlName = item.split('/').pop();
    const icons = await getCacheData(urlName, item);
    const shareIcon = dateStack.addImage(icons);
    shareIcon.url = schemeUrl;
    shareIcon.imageSize = new Size(16, 16);
  };
  mainStack.addSpacer(5);
  
  const descText = mainStack.addText(`${desc} ...`);
  descText.leftAlignText();
  descText.textOpacity = 0.8;
  descText.font = Font.mediumSystemFont(13);
  
  if (config.runsInApp) {
    await widget.presentMedium();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};

//=========> small <=========//
const smallWidget = async () => {
  const widget = new ListWidget();
  widget.backgroundImage = await getCacheData('elonMusk.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/icon/elonMusk.jpeg');
  Script.setWidget(widget);
  Script.complete();
};

const runWidget = async () => {
  await (config.runsInApp || config.widgetFamily === 'medium' 
  ? createWidget() 
  : smallWidget());
};
await runWidget();