// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: gas-pump;
/**
 * 组件作者: 95度茅台
 * 组件名称: 全国油价
 * 组件版本: Version 1.2.0
 * 更新日期: 2022-12-19 11:30
 *
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 * ⚠️适配机型: 手动修改第11、12行的数字
 */

const value = 6 //小机型改成 4
const wide = 9 //小机型改成 6

const fm = FileManager.iCloud();
const folder = fm.joinPath(fm.documentsDirectory(), "oil");
if (!fm.fileExists(folder)) fm.createDirectory(folder);

const getBotSettings = (file) => {
  if (fm.fileExists(file)) {
    return { province, alert } = JSON.parse(fm.readString(file));
  }
  return {};
};

const cacheFile = fm.joinPath(folder, 'setting.json');
const setting = await getBotSettings(cacheFile);

const writeSettings = (setting) => {
  fm.writeString(cacheFile, JSON.stringify(setting, null, 2));
  console.log(JSON.stringify(
    setting, null, 2
  ));
};

const runScriptable = () => {
  Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
};

const notify = async (title, body, url, opts = {}) => {
  const n = Object.assign(new Notification(), { title, body, sound: 'alert', ...opts });
  if (url) n.openURL = url;
  return await n.schedule();
};

const shimoFormData = async (province) => {
  const req = new Request('https://shimo.im/api/newforms/forms/KlkKvoEPOvfGE0qd/submit');
  req.method = 'POST';
  req.headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  req.body = JSON.stringify({
    formRev: 1,
    responseContent: [{
      type: 4,
      guid: 'u2yzslYZ',
      text: { content: '' },
    }],
    userName: `${province}  -  ${Device.systemName()} ${Device.systemVersion()}`
  });
  await req.loadJSON();
};

const getAlertData = async () => {  
  try {
    const html = await new Request(atob('aHR0cDovL20ucWl5b3VqaWFnZS5jb20=')).loadString();
    const forecast = html.match(/var tishiContent="(.*?)";/)[1].replace("<br/>", '，');  
    return forecast;
  } catch(e) {
    console.log(e);
  }
};

const getOilData = async () => {
  const req = new Request(atob('aHR0cHM6Ly9teXM0cy5jbi92My9vaWwvcHJpY2U='));
  req.method = 'POST';
  req.body = `region=${province}`;
  const { data } = await req.loadJSON();  
  return data
};

// 更新时间
const df = new DateFormatter();
df.dateFormat = 'HH:mm';
const GMT = df.string(new Date());

// 创建组件
const createWidget = async () => {
  const forecast = await getAlertData();
  const { Oil0, Oil92, Oil95, Oil98 } = await getOilData();
  
  const oilTypes = [
    { name: '0#', value: Oil0.toPrecision(3), color: '#FB8C00' },
    { name: '92', value: Oil92.toPrecision(3), color: '#3F8BFF' },
    { name: '95', value: Oil95.toPrecision(3), color: '#00C853' },
    { name: '98', value: Oil98.toPrecision(3), color: '#BE38F3' },
  ];
  
  const widget = new ListWidget();
  widget.backgroundColor = Color.white();
  const gradient = new LinearGradient();
  const color = [
    "#82B1FF",
    "#4FC3F7",
    "#66CCFF",
    "#99CCCC",
    "#BCBBBB",
    "#A0BACB"
  ];
  const items = color[parseInt(Math.random() * color.length)];
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color(items, 0.5),
    new Color('#00000000')
  ]
  widget.backgroundGradient = gradient;
  
  widget.setPadding(7, 7, 7, 7);
  const mainStack = widget.addStack();
  mainStack.layoutVertically();
  mainStack.centerAlignContent();
  
  // Dynamic Island
  const Stack = mainStack.addStack();
  Stack.layoutHorizontally();
  Stack.centerAlignContent();
  Stack.addSpacer();
  const barStack = Stack.addStack();
  barStack.backgroundColor = Color.black();
  barStack.setPadding(5, 42, 5, 42);
  barStack.cornerRadius = 15
  
  const titleText = barStack.addText(`${province}油价`);
  titleText.textColor = new Color('#FFD723');
  titleText.font = Font.boldSystemFont(16);
  titleText.centerAlignText();
  Stack.addSpacer(3);
  
  const noticeStack = Stack.addStack();
  const iconSymbol2 = SFSymbol.named('bell.circle');
  const carIcon = noticeStack.addImage(iconSymbol2.image);
  carIcon.imageSize = new Size(30, 30);
  carIcon.tintColor = Color.black();
  Stack.addSpacer();
  mainStack.addSpacer(10);
  
  // oilPrice Alert
  const dataStack2 = mainStack.addStack();
  dataStack2.addSpacer();
  
  const barStack1 = dataStack2.addStack();
  barStack1.setPadding(8, 12, 8, 12);
  barStack1.backgroundColor = new Color('#EEEEEE', 0.1);
  barStack1.cornerRadius = 10
  barStack1.borderColor = new Color('#D50000', 0.8);
  barStack1.borderWidth = 2.5
  
  const oilTipsText = barStack1.addText((forecast.length < 45 ? `${forecast}，大家互相转告油价调整信息` : forecast) + `【 ${GMT} 】`);
  oilTipsText.textColor = Color.black();
  oilTipsText.font = Font.boldSystemFont(13);
  oilTipsText.textOpacity = 0.6
  oilTipsText.centerAlignText();
  dataStack2.addSpacer();
  mainStack.addSpacer(10)
  
  const dataStack = mainStack.addStack();
  dataStack.layoutHorizontally();
  dataStack.addSpacer();
  
  for (const type of oilTypes) {
    const barStack = dataStack.addStack();
    barStack.size = new Size(0, 23)
    barStack.setPadding(3, wide, 3, wide);
    barStack.backgroundColor = new Color(type.color);
    barStack.cornerRadius = 10;
    
    const oilPriceBar = barStack.addText(`${type.name} - ${type.value}`);
    oilPriceBar.font = Font.mediumSystemFont(14);
    oilPriceBar.textColor = Color.white();
      
    if (type !== oilTypes[oilTypes.length - 1]) {
      dataStack.addSpacer(value);
    }
  }
  dataStack.addSpacer();
  
  if (forecast.length !== alert.length) {
    notify(`${province}油价涨跌调整‼️`,  forecast);
    writeSettings({ alert: forecast, province });
  }
  
  if (!config.runsInWidget) {
    await widget.presentMedium();
  } else {
    Script.setWidget(widget);
    Script.complete();
  };
  await shimoFormData(province);
};

async function createErrorWidget() {
  const widget = new ListWidget();
  const text = widget.addText('仅支持中尺寸');
  text.font = Font.systemFont(17);
  text.centerAlignText();
  Script.setWidget(widget);
};

const downloadModule = async (scriptName, url) => {
  const modulePath = fm.joinPath(folder, scriptName);
  if (fm.fileExists(modulePath)) {
    return modulePath;
  } else {
    const req = new Request(atob(url));
    const moduleJs = await req.load().catch(() => {
      return null;
    });
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      return modulePath;
    }
  }
};

const showInput = async () => {
  const alert = new Alert();
  alert.title = '输入省份名称';
  alert.addTextField('海南', '');
  alert.addAction('确定');
  alert.addCancelAction('取消');  
  const input = await alert.presentAlert();
  const province = alert.textFieldValue(0);
  if (input === 0) {
    const forecast = await getAlertData();
    writeSettings({ alert: forecast, province });
    runScriptable();
  }
};

const presentMenu = async() => {
  const alert = new Alert();
  alert.message = '全国油价';
  const actions = ['95度茅台', '更新代码', '重置所有', '输入省份', '预览组件'];

  actions.forEach(( action, index ) => {
    alert[ index === 1 || index === 2 
      ? 'addDestructiveAction'
      : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  const menu = await alert.presentSheet();

  switch (menu) {
    case 0:
      await importModule(await downloadModule('store.js', 'aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9zY3JpcHRhYmxlL3Jhdy9tYXN0ZXIvdmlwL21haW45NWR1U3RvcmUuanM=')).main();
      break;
    case 1:
      const code = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/oils.js').loadString();
      if (code.includes('95度茅台')) {
        fm.writeString(
          module.filename, code
        );
        runScriptable();
      } else {
        const finish = new Alert();
        finish.title = "更新失败"
        finish.addAction('OK')
        finish.presentAlert();
      };
      break;
    case 2:
      fm.remove(folder);
      runScriptable();
      break;
    case 3:
      await showInput();
      break
    case 4:
      setting.province ? await createWidget() : await showInput();
      break;
  }
};

const runWidget = async () => {  
  if (config.runsInApp) {
    await presentMenu();
  } else {
    config.widgetFamily === 'medium' ? await createWidget() : await createErrorWidget();
  }
};
await runWidget();