// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: map-marked-alt;
/**
 * 组件作者: 95度茅台
 * 组件名称: 高德智慧交通
 * 组件版本: Version 1.0.0
 * 发布时间: 2024-04-01 11:30
 * 组件内容: 全国重点城市 (实时) 道路拥堵方向，拥堵指数、平均速度、行驶时间。
 *
 * 数据说明: 高德智慧交通采用拥堵指数作为表征交通拥堵程度的客观指标，基于高德地图海量的交通出行大数据、车辆轨迹大数据和位置定位大数据等挖掘计算所得。
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
const cacheFile = fm.joinPath(mainPath, 'congest_4.json');

const getSettings = (file) => {
  return fm.fileExists(file) 
    ? JSON.parse(fm.readString(file))
    : { name: '460100', label: '海口市', typeName: '全部道路', type: 0 };
};

const { name, label, typeName, type } = await getSettings(cacheFile);

//
const autoUpdate = async () => {
  const script = await new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/congest_4.js').loadString();
  fm.writeString(module.filename, script);
};

const ScriptableRun = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const shimoFormData = async (name, status, title) => {
  const info = `${name}  -  ${status}   ${Device.systemName()} ${Device.systemVersion()} / ${title}`;
  const req = new Request('https://shimo.im/api/newforms/forms/16q8xw0XZrs2Wq7D/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [{
      type: 4,
      guid: 'BMXSE90E',
      text: { content: title }
    }],
    userName: info
  });
  await req.loadJSON();
};

// request data
const getJson = async (url) => await new Request(url).loadJSON();

const getDetails = async () => {
  const data = await getJson('https://report.amap.com/ajax/getCityRank.do');
  const targetObject = data.find(item => item.name === name);
  return { data, targetObject };
};

const getDataForType = async (type) => {
  const url = `https://report.amap.com/ajax/roadRank.do?roadType=${type}&timeType=0&cityCode=${name}`;
  const { tableData } = await getJson(url);
  return {
    title: `${typeName}通行实况`,
    data: tableData
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

const addItem = async (widget, item, index, largeRow) => {
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  
  const stack = mainStack.addStack();
  stack.layoutHorizontally();
  stack.centerAlignContent();
  stack.size = new Size(0, 14 + 5);

  const indexStack = stack.addStack();
  indexStack.size = new Size(18, 0);
  const indexText = indexStack.addText(String(index));
  indexText.font = Font.boldSystemFont(14);
  const textColor = index <= 3 
    ? '#FF0000' : index <= 5
    ? '#FCA100' : '#00C400';
  indexText.textColor = new Color(textColor);
  stack.addSpacer(4);
  
  const titleText = stack.addText(item.name);
  titleText.font = Font.mediumSystemFont(13.2);
  stack.addSpacer(10);
  
  const congestIndex = Number(item.index).toFixed(2);
  const speedIndex = Number(item.speed).toFixed(1);
  const idxText = stack.addText(`${congestIndex} ─ ${speedIndex}`);
  idxText.font = Font.mediumSystemFont(14);
  idxText.textColor = Color.blue();
  stack.addSpacer(8);
  
  const barStack = stack.addStack();
  barStack.size = new Size(8, 8);
  barStack.cornerRadius = 50;
  const indexColor = getColor(item.index);
  barStack.backgroundColor = new Color(indexColor);
  
  mainStack.addSpacer(1);
  const dirStack = mainStack.addStack();
  dirStack.addSpacer(22);
  const disTagText = dirStack.addText(item.dir);
  disTagText.font = Font.systemFont(12.5);
  disTagText.textOpacity = 0.65;
  dirStack.addSpacer(8);
  
  const travelTimeIndex = (item.travelTime).toFixed(1);
  const travelTimeText = dirStack.addText(travelTimeIndex);
  travelTimeText.font = Font.mediumSystemFont(13);

  mainStack.addSpacer(index === largeRow ? 2 : 6);
};

// Create Component Instance
const createWidget = async () => {
  const { idx = 2 } = (await getDetails()).targetObject || {};
  const { status, color } = getTraffic(idx);
  const { title, data } = await getDataForType(type);

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
  columnStack.size = new Size(5, 40);
  columnStack.cornerRadius = 50;
  columnStack.backgroundColor = color;
  topStack.addSpacer(10);
  
  const titleStack = topStack.addStack();
  titleStack.layoutVertically();
  
  const cityStack = titleStack.addStack();
  cityStack.layoutHorizontally();
  cityStack.centerAlignContent();
  const nameText = cityStack.addText(label);
  nameText.font = Font.boldSystemFont(17);
  cityStack.addSpacer(2);
  
  const titleText = cityStack.addText(title);
  titleText.font = Font.systemFont(17);
  cityStack.addSpacer(10);
  
  const barStack = cityStack.addStack();
  barStack.setPadding(2, 9, 2, 9);
  barStack.cornerRadius = 7;
  barStack.backgroundColor = color;
  
  const statusText = barStack.addText(status);
  statusText.font = Font.boldSystemFont(13.2);
  statusText.textColor = Color.white();
  titleStack.addSpacer(4);
  
  const tipsText = titleStack.addText('拥堵指数、平均车速、行驶时间 (秒)')
  tipsText.font = Font.systemFont(13);
  tipsText.textOpacity = 0.65
  topStack.addSpacer();
  mainStack.addSpacer();
  
  const stackItems = widget.addStack();
  const { add } = await getRank(stackItems, { column: 1 });
  
  const screen = Device.screenSize().height < 926;
  const max = screen ? 6 : 7;
  for (let i = 0; i < max; ++i) {
    await add(stack => addItem(stack, data[i], i + 1, max));
  };
  
  if (config.runsInApp) {
    widget.presentLarge()
    autoUpdate();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  
  await shimoFormData(label, status, title);
};

const errorWidget = () => {
  const widget = new ListWidget();
  const text = widget.addText('仅支持大号组件');
  text.font = Font.systemFont(16);
  text.centerAlignText();
  Script.setWidget(widget);
};

const selectMenu = async (json) => {
  const alert = new Alert();
  alert.message = `【 ${json.label} 】  选择组件显示的内容 - ${typeName}`;
  const actions = [
    { typeName: '全部道路', type: 0 },
    { typeName: '快速高速', type: 1 },
    { typeName: '普通道路', type: 2 }
  ];
  actions.forEach(item => {
    alert.addAction(item.typeName)
  });
  alert.addCancelAction('取消');
  const response = await alert.presentSheet();
  if (response !== -1) {
    const value = { ...json, ...actions[response] };
    fm.writeString(cacheFile, JSON.stringify(value));
    ScriptableRun();
  }
};

const presentMenu = async () => {  
  const subList = (await getDetails()).data;
  const alert = new Alert();
  alert.message = `\n全国${subList.length}个重点城市道路通行实况`;
  const topMenu = [
    { menu: 'Telegram' },
    { menu: '更新代码' },
    { menu: '预览组件' }
  ];
  
  const menuList = topMenu.concat(subList);
  menuList.forEach((item, i) => {
    const icon = item.label === label ? '📍' : '';
    item.menu ? alert.addDestructiveAction(item.menu)   
    : alert.addAction(`${i - 2}，${item.label} ${icon}`)
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
        await selectMenu(menuList[menuId]);
        break;
    };
  }
};

const renderWidget = async () => {  
  config.widgetFamily === 'large' ? await createWidget() : errorWidget();
};

await (config.runsInApp ? presentMenu() : renderWidget());