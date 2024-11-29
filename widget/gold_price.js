// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: mercury;
/**
 * 组件作者: 95du茅台
 * 组件名称: 实物黄金价格
 * 组件版本: Version 1.0.1
 * 发布时间: 2024-11-21 16:30
 * 数据来源: 金投行情
 * 支持大号和中号组件❗️
 * https://t.me/+CpAbO_q_SGo2ZWE1
 */

const configs = {
  medium: {
    total: 16,
    slice: 10,
    stackSize: 20,
    indexSize: 19
  }
}[config.widgetFamily] || {
  total: 36,
  slice: 28,
  stackSize: 22,
  indexSize: 20
};

const formatDate = (timestamp, short) => new Date(timestamp + 8 * 3600000).toISOString().slice(short ? 5 : 0, 16).replace('T', ' ');

//
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/gold_price.js').loadString();
  const fm = FileManager.local();
  fm.writeString(module.filename, script);
};

// 获取商店信息
const getShopInfo = async () => {
  const url = 'https://m.cngold.org/quote/gjs/swhj.html';
  const html = await new Request(url).loadString();
  const webView = new WebView();
  await webView.loadHTML(html);

  const shopInfo = await webView.evaluateJavaScript(`
    (() => {
      const shops = [];
      const items = document.querySelectorAll('.shop_info_list .shop_info');

      items.forEach(item => {
        const anchor = item.querySelector('a');
        const img = item.querySelector('img');
        const gold = item.querySelector('.gold_price span')?.id.replace(/_price$/, '');
        const silver = item.querySelector('.silver_price span')?.id.replace(/_price$/, '');

        if (anchor && gold) {
          shops.push({
            title: img.getAttribute('title') || img.getAttribute('alt'),
            gold,
            url: anchor.getAttribute('href')
          });
        }
      });
      return shops;
    })();
  `);
  return shopInfo.slice(0, configs.total);
};

// 获取黄金价格
const extractGoldPrice = async (code) => {
  const url = `https://api.jijinhao.com/quoteCenter/realTime.htm?codes=JO_92233,${code},&_=${Date.now()}`;
  
  try {
    const req = new Request(url);
    req.headers = { Referer: 'https://m.cngold.org/' };
    const data = await req.loadString();
    const jsonString = data.replace(/^var quote_json =/, '').trim();
    const jsonData = JSON.parse(jsonString);
    return jsonData;
  } catch (err) {
    console.log(err);
  }
};

// 
const fetchAndExtract = async () => {
  const symbolArr = await getShopInfo();

  const shopInfoItems = await Promise.all(symbolArr.map(async (shop) => {
    const goldPriceData = await extractGoldPrice(shop.gold);
    const gold = goldPriceData[shop.gold];
    const current = goldPriceData['JO_92233'] || {};
    gold.title = shop.title;
    return { gold, current };
  }));

  const current = shopInfoItems[shopInfoItems.length - 1]?.current || {};
  const shopsItems = shopInfoItems
    .map(shop => shop.gold)
    .filter(gold => gold.showCode === 'huangjinjiage');
  
  return { 
    current, 
    data: shopsItems.slice(0, configs.slice),
    random: Math.round(Math.random())
  };
};

// 提取数据
const { data, current, random } = await fetchAndExtract();
const updateTime = formatDate(data[0].time, true);
const max = Math.max(...data.map(item => item.q2));

let name = data[0].showName;
if (random === 0) name = current.showName;
const currentPrice = (current.q63).toFixed(2);
const percent = (current.q80).toFixed(2);

//
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

const addItem = async (widget, item, max, index) => {
  const stack = widget.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.size = new Size(0, configs.stackSize);

  const indexStack = stack.addStack();
  indexStack.size = new Size(configs.indexSize, 0);
  const indexText = indexStack.addText(String(index));
  indexText.font = Font.boldSystemFont(15);
  const textColor = index <= 3 
    ? '#FF0000' : index <= 6
    ? '#FCA100' : '#00C400';
  indexText.textColor = new Color(textColor);
  stack.addSpacer(4);
  
  const titleText = stack.addText(item.title);
  titleText.font = Font.mediumSystemFont(14);
  titleText.textColor = Color.dynamic(new Color('000000', 0.7), new Color('FFFFFF', 0.9));
  stack.addSpacer(8);
  
  const idxText = stack.addText(String(item.q2));
  idxText.font = Font.mediumSystemFont(15.5);
  idxText.textColor = Color.blue();
  
  if (item.q2 === max) {
    stack.addSpacer(10);
    const symbol = SFSymbol.named('arrow.up');
    const iconImage = stack.addImage(symbol.image);
    iconImage.imageSize = new Size(13, 13);
    iconImage.tintColor = Color.red();
  };
  stack.addSpacer();
};

// Create Component Instance
const createWidget = async () => {
  const widget = new ListWidget();
  widget.setPadding(15, 15, 15, 15);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.addSpacer(5);
  
  const topStack = mainStack.addStack();
  topStack.layoutHorizontally();
  topStack.centerAlignContent();
  topStack.addSpacer(6.5);
  
  const columnStack = topStack.addStack();
  columnStack.size = new Size(5, 23);
  columnStack.cornerRadius = 50;
  columnStack.backgroundColor = new Color('#8B5FF4');
  topStack.addSpacer(10);
  
  const nameText = topStack.addText(name).font = Font.boldSystemFont(17);
  topStack.addSpacer(15);
  
  const indexText = topStack.addText((random === 0 ? `${currentPrice}， ` : '') + `${percent}%`);
  indexText.font = Font.mediumSystemFont(15);
  indexText.textOpacity = 0.8;
  indexText.textColor = percent >= 0 ? Color.red() : Color.green();
  topStack.addSpacer(15);
  
  if (random === 1) {
    const dateText = topStack.addText(`更新于  ${updateTime}`);
    dateText.font = Font.systemFont(14);
    dateText.textOpacity = 0.75
  };
  
  mainStack.addSpacer();
  const stackItems = widget.addStack();
  const { add } = await getRank(stackItems, { column: 2 });
  const maxNum = configs.slice;
  
  for (let i = 0; i < maxNum; ++i) {
    await add(stack => addItem(stack, data[i], max, i + 1));
  };
  
  if (config.runsInApp) {
    widget.presentLarge();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  }
};

await createWidget();