// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: map-marked-alt;
/**
 * 组件作者: 95度茅台
 * 组件名称: 城市通行实况
 * 组件版本: Version 1.0.0
 * 发布时间: 2024-03-03 15:30
 * 组件内容: 全国重点城市 (实时前 10) 拥堵道路排行，早高峰、晚高峰。
 *
 * 数据说明: 百度智慧交通采用拥堵指数作为表征交通拥堵程度的客观指标，基于百度地图海量的交通出行大数据、车辆轨迹大数据和位置定位大数据等挖掘计算所得。
 *
 * 拥堵指数为实际行程时间与畅通行程时间的比值，拥堵指数越大代表拥堵程度越高❗️(注：交通拥堵受天气、偶发事件等因素的影响较大，请以实际情况为准)
 *
 * 城市区域级拥堵程度划分标准：
   🟢 畅通［1.00-1.50）
   🟡 缓行［1.50~1.80）
   🟠 拥堵 [1.80~2.00）
   🔴 严重拥堵［2.00～）
 * 城市道路级拥堵程度划分标准：
   🟢 畅通【1.00-1.50）  
   🟡 缓行［1.50~2.00）
   🟠 拥堵［2.00~4.00
   🔴 严重拥堵［4.00~）
 */

const fm = FileManager.local();
const mainPath = fm.joinPath(fm.documentsDirectory(), 'jiaotong');
if (!fm.fileExists(mainPath)) fm.createDirectory(mainPath);
const cacheFile = fm.joinPath(mainPath, 'congest_2.json');

const getSettings = (file) => {
  return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : { citycode: '125', cityname: '海口' };
};
const { citycode, cityname } = await getSettings(cacheFile);

//
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/congest_2.js').loadString();
  fm.writeString(module.filename, script);
};

const ScriptableRun = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const shimoFormData = async (name, status, index, title) => {
  const info = `${name}  -  ${status}   ${Device.systemName()} ${Device.systemVersion()} / ${index}`;
  const req = new Request('https://shimo.im/api/newforms/forms/m5kvdgBp8jfPpz3X/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [{
      type: 4,
      guid: 'hf9rp0Ro',
      text: { content: title }
    }],
    userName: info
  });
  await req.loadJSON();
};

// request data
const getJson = async (url) => await new Request(url).loadJSON();

const getCityList = async () => {
  const { data } = await getJson('https://jiaotong.baidu.com/trafficindex/city/list/');
  return data.list;
};

const getDetails = async () => {
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/city/details/?cityCode=${citycode}`);
  return data.detail;
};

const getRoadPredict = async (hours) => {
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/predict/road?cityCode=${citycode}`);
  console.log(data)
  const predict = data[hours > 10 && hours < 19 ? 'pm' : 'am'];
  return predict;
};

const getDistrictRoad = async () => {
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/city/roadrank/?cityCode=${citycode}&roadtype=11`);
  const count = data.list.length;
  const hours = new Date().getHours()
  if (count === 9) data.list.pop();
  return {
    title: count >= 8 ? '实时拥堵道路排行' : `明日${hours > 10 && hours < 19 ? '晚' : '早'}高峰拥堵预测`,
    data: count >= 8 ? data.list : await getRoadPredict(hours)
  }
};

// status Color
const getTraffic = (index) => {
  const thresholds = [2, 1.8, 1.5];
  const data = [
    { status: '严重拥堵', 
      color: '#FF0000' 
    },
    { status: '拥堵',
      color: '#FF5500'
    },
    { status: '缓行', 
      color: '#FFA500' 
    },
    { status: '畅通', 
      color: '#00C400' 
    }
  ];
  const indexThreshold = thresholds.findIndex(threshold => index >= threshold);
  const { status, color } = data[indexThreshold >= 0 ? indexThreshold : data.length - 1];
  return { status, color: new Color(color) };
};

const getColor = (index) => {
  const thresholds = [4, 2, 1.5];
  const colors = ['#FF0000', '#FF5500', '#FFA500', '#00C400'];
  const color = colors.find((_, i) => index >= thresholds[i]) || colors[colors.length - 1];
  return color;
};

// Draw Divider Line
const drawLine = () => {
  const context = new DrawContext()
  context.size = new Size(150, 0.5);
  context.opaque = false;
  context.respectScreenScale = true;
  context.setFillColor(new Color('#777777', 0.5));
  const path = new Path();
  path.addRoundedRect(new Rect(0, 0, 150, 0.3), 3, 2);
  context.addPath(path);
  context.fillPath();
  return context.getImage();
};

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

const addItem = async (widget, item, index) => {
  const stack = widget.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.size = new Size(0, 14 + 5);

  const indexStack = stack.addStack();
  indexStack.size = new Size(18, 0);
  const indexText = indexStack.addText(String(index));
  indexText.font = Font.boldSystemFont(14);
  const textColor = index <= 3 
    ? '#FF0000' : index <= 6
    ? '#FCA100' : '#00C400';
  indexText.textColor = new Color(textColor);
  stack.addSpacer(4);
  
  const titleText = stack.addText(item.roadname ?? item.road_name);
  titleText.font = Font.mediumSystemFont(13.2);
  titleText.textColor = Color.dynamic(new Color('000000', 0.7), new Color('FFFFFF', 0.9));
  stack.addSpacer(7);
  
  const congestIndex = Number(item.index).toFixed(2);
  const idxText = stack.addText(congestIndex);
  idxText.font = Font.mediumSystemFont(14);
  idxText.textColor = Color.blue();
  
  if (item.index >= 15) {
    stack.addSpacer(6);
    const barStack = stack.addStack();
    barStack.size = new Size(8, 8);
    barStack.cornerRadius = 50;
    const indexColor = getColor(item.index);
    barStack.backgroundColor = new Color(indexColor);
  };
  stack.addSpacer();
};

// Create Component Instance
const createWidget = async () => {
  const { index, city_name } = await getDetails();
  const { status, color } = getTraffic(index);
  const { data, title } = await getDistrictRoad();

  // widget
  const widget = new ListWidget();
  widget.setPadding(15, 15, 15, 15);
  widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
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
  columnStack.backgroundColor = color;
  topStack.addSpacer(10);
  
  const nameText = topStack.addText(city_name);
  nameText.font = Font.boldSystemFont(17);
  topStack.addSpacer(2);
  
  const titleText = topStack.addText(title);
  titleText.font = Font.systemFont(17);
  topStack.addSpacer(10);
  
  const barStack = topStack.addStack();
  barStack.setPadding(2, 12, 2, 12);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = color;
  
  const statusText = barStack.addText(status);
  statusText.font = Font.boldSystemFont(13);
  statusText.textColor = Color.white();
  mainStack.addSpacer();
  
  if (data?.length === 8) {
    const lineStack = mainStack.addStack();
    lineStack.size = new Size(0, 1.5)
    const line = lineStack.addImage(drawLine());
    line.centerAlignImage();
    mainStack.addSpacer();
  };
  
  const stackItems = widget.addStack();
  const { add } = await getRank(stackItems, { column: 2 });

  const max = data?.length;
  for (let i = 0; i < max; ++i) {
    await add(stack => addItem(stack, data[i], i + 1));
  };
  
  if (config.runsInApp) {
    widget.presentMedium();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  
  await shimoFormData(city_name, status, index, title);
};

const errorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('仅支持中号组件');
  text.font = Font.systemFont(16);
  text.centerAlignText();
  Script.setWidget(widget);
};

// Selected menu
const presentMenu = async () => {  
  const subList = await getCityList();
  const alert = new Alert();
  alert.message = `\n全国${subList.length}个重点城市道路实况`;
  const topMenu = [
    { name: 'Telegram' },
    { name: '更新代码' },
    { name: '预览组件' }
  ];
  
  const menuList = topMenu.concat(subList);
  menuList.forEach((item, i) => {
    const icon = item.cityname === cityname ? '📍' : '';
    item.name ? alert.addDestructiveAction(item.name)   
    : alert.addAction(`${i - 2}，${item.cityname} ( ${item.provincename} ) ${icon}`)
  });
  alert.addCancelAction('取消');
  const menuId = await alert.presentSheet();
  if (menuId !== -1) {
    switch (menuId) {
      case 0:
        Safari.openInApp('https://t.me/+CpAbO_q_SGo2ZWE1', false);
        break;
      case 1:
        await autoUpdate();
        ScriptableRun();
      case 2:
        return await createWidget();
      default:  
        fm.writeString(cacheFile, JSON.stringify(menuList[menuId]));
        ScriptableRun();
    };
  }
};

const renderWidget = async () => {  
  config.widgetFamily === 'medium' ? await createWidget() : errorWidget();
};

await (config.runsInApp ? presentMenu() : renderWidget());