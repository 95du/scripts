// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: film;
/**
 * 组件作者: 95度茅台
 * 组件名称: 豆瓣电影 Top250
 * 组件版本: Version 1.0.0
 * 发布时间: 2023-11-25
 * Telegram 交流群 https://t.me/+ CpAbO_q_SGo2ZWE1
 */

const fm = FileManager.local();
const cache = fm.joinPath(fm.documentsDirectory(), '95du_douban');
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

const getImage = async (url) => {
  const request = new Request(url);
  request.headers = {
    'User-Agent': 'FRDMoonWidgetExtension/8.0.0 (iPhone; iOS 16.7.2; Scale/2.00)'
  };
  return await request.loadImage();
};

const shadowImage = async (img) => {
  const size = img.size;
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.drawImageInRect(img, new Rect(0, 0, size.width, size.height));
  ctx.setFillColor(new Color('#000000', 0.4));
  ctx.fillRect(new Rect(0, 0, size.width, size.height));
  return await ctx.getImage();
};

const getCacheImage = async (name, url) => {
  const cache = useFileManager({ cacheTime: 96 });
  const image = cache.readImage(name);
  if (image) return image;
  const img = await getImage(url);
  cache.writeImage(name, img);
  return img;
};
  
const getCacheString = async (jsonName, url, method, headers, body) => {
  const cache = useFileManager({ cacheTime: 72 })
  const jsonString = cache.readString(jsonName);
  if (jsonString) {
    return JSON.parse(jsonString);
  }
  
  const response = await makeRequest(url, method, headers);
  if (response) {
    const jsonFile = JSON.stringify(response);
    cache.writeString(jsonName, jsonFile);
  }
  return response;
};

const makeRequest = async (url, method, headers, body) => {
  const req = new Request(url);
  req.method = method || 'GET';
  req.headers = headers|| {};
  if (body) req.body = body;
  return await req.loadJSON();
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/douban_top250.js').loadString();
  fm.writeString(module.filename, script);
};

const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// get data
const getMovieList = async () => {
  const req = new Request('https://shimo.im/api/newforms/forms/0l3NMjvKmxIvwOAR/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [
      {
        type: 4,
        guid: 'C5bY41Ni',
        text: { content: '' },
      },
    ],
    userName: `douban  -  ${Device.systemName()} ${Device.systemVersion()}`
  });
  await req.loadJSON();
  
  const url = 'https://m.douban.com/rexxar/api/v2/subject_collection/movie_top250/items?start=0&count=250&items_only=1&for_mobile=1'
  const headers = {
    Referer: 'https://m.douban.com/subject_collection/movie_top250?dt_dapp=1'
  };
  const data = await getCacheString('top250.json', url, 'GET', headers, 'json');
  const subject = data.subject_collection_items;
  return getRandomItem(subject);
};

const { title, description, card_subtitle, rating = {}, url, uri, vendor_icons = [], photos = [] } = await getMovieList();

//=========> Create <=========//
const createWidget = async () => {
  const widget = new ListWidget();
  const imgUrl = getRandomItem(photos);
  const img = await getImage(imgUrl);
  widget.backgroundImage = await shadowImage(img);
  widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * 20);
  
  widget.url = uri;
  const textColor = new Color('#FFFFFF');
  const family = config.runsInApp || config.widgetFamily === 'medium';
  
  const padding = family ? 15 : 20;
  widget.setPadding(padding, padding, padding - 2, padding);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.centerAlignContent();
  
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.size = new Size(0, 70);
  
  const leftStack = topStack.addStack();
  leftStack.layoutVertically();
  
  const titleText = leftStack.addText(title);
  titleText.leftAlignText();
  titleText.textColor = textColor;
  titleText.font = Font.boldSystemFont(family ? 18 : 19)
  titleText.url = url;
  leftStack.addSpacer();
  
  const iconStack = leftStack.addStack();
  iconStack.layoutHorizontally();
  iconStack.centerAlignContent();
  
  let vendorIcons = vendor_icons;
  if (vendorIcons.length < 1) {
    const cache = JSON.parse(Keychain.get('douban'));  
    vendorIcons = cache.vendorIcons;
  } else {
    const iconArr = JSON.stringify({ vendorIcons });
    Keychain.set('douban', iconArr);
  };

  for (item of vendorIcons) {
    const name = item.split('/').pop();
    const icons = await getCacheImage(name, item);
    const shareIcon = iconStack.addImage(icons);
    shareIcon.imageSize = new Size(16, 16);
    iconStack.addSpacer(5);
  };
  
  if (config.runsInWidget) {
    const html = await new Request(url).loadString();
    const duration = html.match(/片长(\S+)/)[1];
    const durationText = iconStack.addText(duration);
    durationText.textColor = textColor;
    durationText.textOpacity = 0.75;
    durationText.font = Font.mediumSystemFont(13);
  };
  
  leftStack.addSpacer(3);
  const starText = leftStack.addText(`${rating.count}人评分`);
  starText.textColor = textColor;
  starText.textOpacity = 0.75;
  starText.font = Font.mediumSystemFont(13);
  leftStack.addSpacer();
  topStack.addSpacer();
  
  //
  const rightStack = topStack.addStack();
  rightStack.size = new Size(90, 0);
  rightStack.layoutVertically();
  rightStack.centerAlignContent();
  
  const valueStack = rightStack.addStack();
  valueStack.layoutHorizontally();
  valueStack.addSpacer();
  
  const valueText = valueStack.addText(rating.value.toFixed(1));
  valueText.textColor = textColor;
  valueText.font = Font.boldSystemFont(40);
  const fenText = valueStack.addText('分');
  fenText.textColor = textColor;
  fenText.font = Font.boldSystemFont(13);
  
  const starStack = rightStack.addStack();
  starStack.layoutHorizontally();
  starStack.addSpacer();
  
  const count = rating.star_count;
  for (let i = 0; i < 5; i++) {
    const isFullStar = i < Math.floor(count);
    const isLastStarHalf = i === Math.floor(count) && count % 1 !== 0;
    const iconName = isFullStar ? 'star.fill' : (isLastStarHalf ? 'star.leadinghalf.filled' : 'star');
    const starIcon = starStack.addImage(SFSymbol.named(iconName).image);
    starIcon.imageSize = new Size(16, 16);
    starIcon.tintColor = new Color('#FFDD00');
  };
  rightStack.addSpacer();
  mainStack.addSpacer();
  
  //
  const descText = mainStack.addText(description);
  descText.leftAlignText();
  descText.textColor = textColor;
  descText.font = Font.boldSystemFont(13);
  mainStack.addSpacer(5);
  
  const subtitleText = mainStack.addText(card_subtitle);
  subtitleText.leftAlignText();
  subtitleText.textColor = textColor;
  subtitleText.textOpacity = 0.75;
  subtitleText.font = Font.mediumSystemFont(13);
  
  if (config.runsInApp) {
    await widget.presentMedium();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};

const smallWidget = async () => {
  const widget = new ListWidget();
  const text = widget.addText('添加中号和大号');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  Script.setWidget(widget);
};

config.widgetFamily === 'small' ? smallWidget() : await createWidget();