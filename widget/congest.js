// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: map-marked-alt;
/**
 * 组件作者: 95度茅台
 * 组件名称: 智慧交通 (全国重点城市道路实时拥堵信息)
 * 组件版本: Version 1.0.2
 * 发布时间: 2024-02-29 16:30
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
const cacheFile = fm.joinPath(mainPath, 'congest_1.json');

const getSettings = (file) => {
  return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : { citycode: '125', cityname: '海口' };
};
const { citycode, cityname } = await getSettings(cacheFile);

//
const useFileManager = () => {
  const fullPath = (name) => fm.joinPath(mainPath, name);
  return {
    readImage: (name) => fm.fileExists(fullPath(name)) ? fm.readImage(fullPath(name)) : null,
    writeImage: (name, image) => fm.writeImage(fullPath(name), image)
  };
};

const getCacheImage = async (name, url) => {
  const cache = useFileManager();
  const image = cache.readImage(name);
  if (image) return image;
  const img = await new Request(url).loadImage();
  cache.writeImage(name, img);
  return img;
};

const notify = (title, body) => {
  const n = Object.assign(new Notification(), { title, body });
  n.schedule();
};

const ScriptableRun = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/congest.js').loadString();
  fm.writeString(module.filename, script);
};

const shimoFormData = async (name, status, districtRoad) => {
  const info = `${name}  -  ${status}   ${Device.systemName()} ${Device.systemVersion()}`;
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
      text: { content: districtRoad }
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
  const details = { detail, updatetime } = data;
  return details;
};

const getDistrictRoad = async () => {
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/city/roadrank/?cityCode=${citycode}&roadtype=11`);
  const congested = data.list.filter(i => i.index >= 2);
  return {
    roadCount: congested.length,
    roadInfo: congested.length > 0 ? congested[Math.floor(Math.random() * congested.length)] : {}
  };
};

const getCrosslist = async () => {
  const webUrl = `https://jiaotong.baidu.com/m/congestion/city/urbanrealtime?cityCode=${citycode}`;
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/overview/crosslist/?cityCode=${citycode}&top=10`);
  const cross = data.filter(item => item.congestIndex >= 2 || item.avgSpeed <= 20).length;
  return { data, cross, webUrl };
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
  const colors = ['#E90000', '#FF5500', '#FFA500'];
  const color = colors.find((_, i) => index >= thresholds[i]) || '';
  return color;
};

const drawBar = (color) => {
  const width = 13;
  const context = new DrawContext();
  context.size = new Size(width, 115);
  context.respectScreenScale = true;
  context.opaque = false;
  context.setStrokeColor(color);
  context.setLineWidth(width);

  const path = new Path();
  path.move(new Point(width / 2, 5));
  path.addLine(new Point(width / 2, 105));
  context.addPath(path);
  context.strokePath();
  context.setFillColor(color);

  context.fillEllipse(new Rect(0, 0, width, width));
  context.fillEllipse(new Rect(0, 100, width, width));
  return context.getImage();
};

// createText
const createCombo = (iconStack, text, value) => {
  const dataText = iconStack.addText(text);
  dataText.font = Font.mediumSystemFont(13.8);
  dataText.textColor = Color.dynamic(new Color('000000', 0.65), new Color('FFFFFF', 0.85));
  iconStack.addSpacer(5);
  
  const valueText = iconStack.addText(value);
  valueText.font = Font.mediumSystemFont(14);
  valueText.textColor = Color.blue();
};

const createText = ({ mainStack, indexColor, text, value, gap, rank, rankValue, iconName, color }) => {
  const iconStack = mainStack.addStack();
  iconStack.layoutHorizontally();
  iconStack.centerAlignContent();
  
  const iconSymbol = SFSymbol.named(iconName);
  const icon = iconStack.addImage(iconSymbol.image);
  if (color) icon.tintColor = color;
  icon.imageSize = new Size(18, 18);
  iconStack.addSpacer(6);
  
  if (rank && rankValue) {  
    createCombo(iconStack, rank, rankValue);
  }
  createCombo(iconStack, text, value)
  if (gap) mainStack.addSpacer(gap);
  
  if (indexColor) {
    iconStack.addSpacer(8);
    const barStack = iconStack.addStack();
    barStack.size = new Size(9, 9);
    barStack.cornerRadius = 50;
    barStack.backgroundColor = new Color(indexColor);
  }
};

// Create Component Instance
const createWidget = async () => {
  const { detail, updatetime } = await getDetails();
  const { index, week_rate, rank, city_name, road_network_speed: _speed, yongdu_length_4 } = detail;
  const { status, color } = getTraffic(index);
  
  const { roadCount, roadInfo } = await getDistrictRoad();
  const { roadname, speed, index: _index, yongdu_length } = roadInfo;
  
  const { data, cross, webUrl } = await getCrosslist();  
  const { avgSpeed, congestLength, congestIndex, crossName } = data[0] || {};
  
  const baidu_map = await getCacheImage('baidu_map.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/background/baidu_map.png');
  const imageDark = await getCacheImage('glass.png', 'https://raw.githubusercontent.com/95du/scripts/master/img/background/glass_0.png');
  
  const updateTime = updatetime.slice(-4).replace(/(\d{2})(\d{2})/, "$1:$2");
  const congestIdx = Math.floor(_index * 100) / 100;
  const cityRoad = `${roadCount} 条道路拥堵，${cross} 个路口拥堵`;
  
  const height = Device.screenSize().height < 926;
  const padding = height ? 15 : 18;
  
  // widget
  const widget = new ListWidget();
  widget.setPadding(padding, padding, padding, padding);
  widget.backgroundImage = Device.isUsingDarkAppearance() ? imageDark : baidu_map;
  const mainStack = widget.addStack();
  mainStack.layoutVertically();

  const statusStack = mainStack.addStack();
  statusStack.addSpacer(2);
  statusStack.layoutHorizontally();
  statusStack.centerAlignContent();
  statusStack.size = new Size(0, 50);
  const barImage = drawBar(color);
  statusStack.addImage(barImage);
  statusStack.addSpacer(10);

  const topStack = statusStack.addStack();
  topStack.layoutVertically();
  
  const cityStack = topStack.addStack();
  cityStack.layoutHorizontally();
  cityStack.centerAlignContent();
  cityStack.size = new Size(0, 27);
  const nameText = cityStack.addText(city_name);
  nameText.font = Font.mediumSystemFont(27);
  cityStack.addSpacer(15);
  
  const nullStack = cityStack.addStack();
  nullStack.layoutVertically();
  nullStack.addSpacer();

  const barStack = nullStack.addStack();
  barStack.setPadding(2.5, 12, 2.5, 12);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = color;
  
  const statusText = barStack.addText(status);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(13);
  nullStack.addSpacer(5);
  topStack.addSpacer(6);
  
  const countText = topStack.addText(cityRoad);
  countText.font = Font.systemFont(13.8);
  countText.textOpacity = 0.7;
  statusStack.addSpacer();
  
  const iconStack = statusStack.addStack();
  iconStack.layoutVertically();
  iconStack.setPadding(index >= 2 ? -3 : -8, 0, 0, -2);
  const iconSymbol = SFSymbol.named(index >= 2 ? 'wrongwaysign' : 'car');
  const icon = iconStack.addImage(iconSymbol.image);
  icon.tintColor = color;
  icon.imageSize = new Size(46, 46);
  icon.url = webUrl;
  iconStack.addSpacer();
  mainStack.addSpacer();
  
  createText({ 
    mainStack, 
    indexColor: getColor(_index),
    text: roadCount > 0 ? `${roadname}，速度` : '城区实时平均速度',
    value: `${Number(roadCount > 0 ? speed : _speed).toFixed(1)} km/h` + `${roadCount > 0 ? ` - ${congestIdx.toFixed(2)}` : ''}`,
    gap: height ? 2.5 : 3.6,
    iconName: 'timer' 
  });
  
  createText({ 
    mainStack, 
    text: `${roadCount > 0 ? '该道路' : ''}实时严重拥堵里程`,
    value: roadCount > 0 
      ? `${yongdu_length} km` 
      : `${yongdu_length_4} km`, 
    gap: height ? 2.5 : 3.6,
    iconName: 'arrow.triangle.swap', 
    color: new Color('#FF5000') 
  });
  
  createText({ 
    mainStack, 
    rank: '拥堵排行',
    rankValue: `${rank}`,
    text: `，较上周同期${week_rate > 0 ? '上升' : '下降'}`, 
    value: `${Math.abs(week_rate * 100).toFixed(1)}%`,
    iconName: 'align.vertical.bottom.fill', 
    color: new Color('#FF8CA8') 
  });
  
  if (roadCount < 1 && avgSpeed <= 20 && congestIndex >= 4) {
    notify('智慧交通提醒❗️', `${crossName}，平均速度${avgSpeed}km/h，拥堵长度${congestLength}km  ( ${city_name}最拥堵路口 )`);
  };
  
  if (config.runsInApp) {
    widget.presentMedium();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  
  await shimoFormData(city_name, status, cityRoad);
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
  alert.message = `\n全国${subList.length}个重点城市道路实时拥堵`;
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