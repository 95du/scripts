// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: map-signs;
/**
 * 组件作者: 95度茅台
 * 组件名称: 畅游中国
 * 组件版本: Version 1.0.1
 * 发布时间: 2024-02-16
 * 组件内容: 随机显示 ( 该城市实时前 10 ) 旅游景区拥堵信息。
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
const cacheFile = fm.joinPath(mainPath, 'scenic.json');

const getSettings = (file) => {
  return fm.fileExists(file) ? JSON.parse(fm.readString(file)) : { citycode: '121', cityname: '三亚' };
};
const { citycode, cityname } = await getSettings(cacheFile);

//
const ScriptableRun = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const autoUpdate = async () => {
  const script = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/scenic_area.js').loadString();
  fm.writeString(module.filename, script);
};

const shimoFormData = async (name, status, scenic) => {
  const info = `${name}  -  ${status}   ${Device.systemName()} ${Device.systemVersion()}  ${scenic}`
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
      text: { content: scenic }
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

const getScenicArea = async () => {
  const { data } = await getJson(`https://jiaotong.baidu.com/trafficindex/overview/arealist?type=1&cityCode=${citycode}&stdTag=1&index=1&top=10`);
  return  {
    areaCount: data.filter(item => item.congestIndex >= 4).length,
    areaCount_1: data.filter(item => item.congestIndex < 4 && item.congestIndex > 2).length,
    roadInfo: data.length ? data[Math.floor(Math.random() * data.length)] : {}
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

// Column Chart
const drawBar = (color) => {
  const context = new DrawContext();
  context.size = new Size(10, 115);
  context.respectScreenScale = true;
  context.opaque = false;
  context.setStrokeColor(color);
  context.setLineWidth(10);

  const path = new Path();
  path.move(new Point(5, 5));
  path.addLine(new Point(5, 110));
  context.addPath(path);
  context.strokePath();
  context.setFillColor(color);

  const ellipseSize = 10;
  context.fillEllipse(new Rect(0, 0, ellipseSize, ellipseSize));
  context.fillEllipse(new Rect(0, 105, ellipseSize, ellipseSize));
  return context.getImage();
};

// createText
const createCombo = (iconStack, text, value, textSize, congestRatio) => {
  const dataText = iconStack.addText(text);
  dataText.font = Font.mediumSystemFont(textSize);
  dataText.textColor = Color.dynamic(new Color('000000', 0.65), new Color('FFFFFF', 0.85));
  iconStack.addSpacer(5);
  
  const valueText = iconStack.addText(value);
  valueText.font = Font.mediumSystemFont(textSize);
  valueText.textColor = congestRatio > 0 ? Color.red() :  Color.blue();
};

const createText = ({ mainStack, flow, flowValue, text, value, gap, textSize, congestRatio, iconName, color }) => {
  const iconStack = mainStack.addStack();
  iconStack.layoutHorizontally();
  iconStack.centerAlignContent();
  
  const iconSymbol = SFSymbol.named(iconName);
  const icon = iconStack.addImage(iconSymbol.image)
  icon.tintColor = color;
  icon.imageSize = new Size(18, 18);
  iconStack.addSpacer(6);
  
  if (flow && flowValue) {
    createCombo(iconStack, flow, flowValue, textSize);
  }
  createCombo(iconStack, text, value, textSize, congestRatio);
  if (gap) mainStack.addSpacer(gap);
};

const createWidget = async () => {
  const { areaCount, areaCount_1, roadInfo } = await getScenicArea();
  const { districtName, areaName, flowRatio, congestRatio, congestIndex, avgSpeed, congestLength } = roadInfo;
  const { status, color } = getTraffic(congestIndex);
  
  const scenicArea = `${areaCount} 个景区严重拥堵，${areaCount_1} 个景区拥堵`;
  const systemVersion =  Device.systemVersion().split('.')[0];
  const height = Device.screenSize().height < 926;
  const padding = height ? 15 : 18;
  const textSize = height ? 13 : 14;
  
  // widget
  const widget = new ListWidget();
  widget.setPadding(padding, padding, padding, padding);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();

  const statusStack = mainStack.addStack();
  statusStack.addSpacer(2.5);
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
  const nameText = cityStack.addText(cityname);
  nameText.font = Font.boldSystemFont(27);
  cityStack.addSpacer(15);

  const nameStack = cityStack.addStack();
  nameStack.layoutVertically();
  nameStack.addSpacer();
  const barStack = nameStack.addStack();
  barStack.setPadding(2.5, 12, 2.5, 12);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = color;

  const statusText = barStack.addText(status);
  statusText.textColor = Color.white();
  statusText.font = Font.boldSystemFont(13);
  nameStack.addSpacer(3);
  topStack.addSpacer(6);
  
  const rateText = topStack.addText(scenicArea);
  rateText.font = Font.systemFont(textSize);
  rateText.textOpacity = 0.7;
  statusStack.addSpacer();
  
  const iconStack = statusStack.addStack();
  iconStack.layoutVertically();
  iconStack.setPadding(0, 0, 0, -5);
  const iconSymbol = SFSymbol.named('figure.and.child.holdinghands');
  const icon = iconStack.addImage(iconSymbol.image);
  icon.tintColor = color;
  icon.imageSize = new Size(48, 48);
  iconStack.url = `https://jiaotong.baidu.com/m/congestion/city/urbanrealtime?cityCode=${citycode}`;
  iconStack.addSpacer();
  mainStack.addSpacer();
  
  createText({ 
    mainStack, 
    text: areaName,
    value: `( ${districtName} )`,
    textSize,
    gap: height ? 2.5 : 3.6,
    iconName: 'parkingsign',
    color: new Color('#D54ED0')
  });
  
  createText({ 
    mainStack, 
    text: '该景区实时严重拥堵里程',
    value: `${congestLength} km`, 
    textSize,
    gap: height ? 2.5 : 3.6,
    iconName: systemVersion < 16 ? 'car' : 'arrow.triangle.swap', 
    color: new Color('#FF5000')
  });
  
  createText({ 
    mainStack, 
    flow: `较上周流量${flowRatio > 0 ? '上升' : '下降'}`,
    flowValue: `${Math.abs(flowRatio * 100).toFixed(1)}%`, 
    text: `，拥堵${congestRatio > 0 ? '上升' : '下降'}`,
    value: `${Math.abs(congestRatio * 100).toFixed(2)}%`,
    textSize,
    congestRatio,
    iconName: 'align.vertical.bottom.fill', 
    color: new Color('#FF8CA8') 
  });
  
  if (config.runsInApp) {
    widget.presentMedium();
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  
  await shimoFormData(cityname, status, areaName);
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
  alert.message = `\n全国${subList.length}个重点城市景区拥堵实况`;
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