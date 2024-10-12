// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: bolt;
/**
* 小组件作者: 95度茅台
* 获取token作者: @Fokit
* Version 1.1.0
* 2022-12-20 20:15
* Telegram 交流群 https://t.me/+ViT7uEUrIUV0B_iy
* 更新组件 https://gitcode.net/4qiao/scriptable/raw/master/api/95duScriptStore.js

==============================
Quantumult-X 获取Token重写：
https://raw.githubusercontent.com/FoKit/Scripts/main/rewrite/get_95598_token.sgmodule

使用方法：
打开南网在线APP，登录即可自动抓取/更Token

=========Quantumult-X=========
[MITM]
hostname = 95598.csg.cn

[rewrite_local]
^https:\/\/95598\.csg\.cn\/ucs\/ma\/zt\/eleCustNumber\/queryBindEleUsers url script-request-header https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/SouthernPower.js

============Surge=============
[Script]
南网在线Token = type=http-request,pattern=^https:\/\/95598\.csg\.cn\/ucs\/ma\/zt\/eleCustNumber\/queryBindEleUsers,requires-body=0,max-size=0,timeout=1000,script-path=https://raw.githubusercontent.com/FoKit/Scripts/main/scripts/SouthernPower.js,script-update-interval=0
[MITM]
hostname = %APPEND% 95598.csg.cn
*/

const timestamp = Date.parse(new Date());

const F_MGR = FileManager.iCloud();
const folder = F_MGR.joinPath(F_MGR.documentsDirectory(), "electric");
if (!F_MGR.fileExists(folder)) {
  F_MGR.createDirectory(folder)
}
const cacheFile = F_MGR.joinPath(folder, 'data.json');

if (F_MGR.fileExists(cacheFile)) {
  data = F_MGR.readString(cacheFile)
  data = JSON.parse(data)
} else {
  try {
    boxjs = await new Request('http://boxjs.com/query/data/token_95598').loadJSON();
    token = boxjs.val;
  } catch (e) {
    console.log(e)
    notify('获取Token失败 ⚠️', '需打开 Quantumult-X 或手动抓包获取');
  }  
  
  const login = new Alert();
  login.title = '南网在线登录';
  login.message = `\r\n南方电网只包括海南、广东、广西、云南、贵州5个\n\n首次登录需用户自行在App中登录时抓包获取token，登录成功将储存在iCloud，token在抓包历史中找到https://95598.csg.cn/ucs/ma/zt/center/login，在响应头部拷贝x-auth-token的值或使用Quantumult-X自动获取\n\r\n小组件作者: 95度茅台`;
  login.addAction('继续');
  login.addCancelAction('取消');
  onClick = await login.presentAlert();
  if (onClick === -1) {
    return;
  } else {
    const alert = new Alert();
    alert.title = '输入 Token';
    alert.addTextField('输入Token', token);
    alert.addAction('确定');
    alert.addCancelAction('取消');
    const input = await alert.presentAlert();
    if (input === 0) {
      data = {
        token: alert.textFieldValue(0),
        updateTime: timestamp
      }
      F_MGR.writeString(cacheFile, JSON.stringify(data));
    } else { return }
  }
}

// Get Year and Month
const Year = new Date().getFullYear();
const getMonth = new Date().getMonth() + 1;
const Month = getMonth < 10 ? '0' + getMonth : getMonth
const year = Month === 1 ? Year - 1 : Year

// UserInfo
const req = new Request('https://95598.csg.cn/ucs/ma/zt/eleCustNumber/queryBindEleUsers');
req.method = 'POST'
req.headers = {
  "x-auth-token": data.token
}
const res = await req.loadJSON();
if (res.sta == 00) {
  const user = res.data[parseInt(Math.random() * res.data.length)];
  ele = user //User res.data[0]
  name = ele.userName
  code = ele.areaCode
  id = ele.bindingId
  number = ele.eleCustNumber
} else if (res.sta == 04) {
  F_MGR.remove(folder);
  notify('用户未登录⚠️', 'Token错误，请重新获取'); return;
}

// queryMeteringPoint
const point = new Request('https://95598.csg.cn/ucs/ma/zt/charge/queryMeteringPoint');
point.method = 'POST'
point.headers = {
  "x-auth-token": data.token,
  "Content-Type":"application/json;charset=utf-8"}
point.body = `{
  "areaCode": "${code}",
  "eleCustNumberList": [
    {
      "areaCode": "${code}",
      "eleCustId": "${id}"
    }
  ]
}`
const resP = await point.loadJSON();
const P = resP.data[0]
  
// Month
const month = new Request('https://95598.csg.cn/ucs/ma/zt/charge/queryDayElectricByMPoint');
month.method = 'POST'
month.headers = {
  "x-auth-token": data.token,
  "Content-Type":"application/json;charset=utf-8"}
month.body = `{
  "eleCustId": "${id}",
  "areaCode": "${code}",
  "yearMonth": "${Year}${Month}",
  "meteringPointId": "${P.meteringPointId}"
}`
const resM = await month.loadJSON();

try {  
  const arr = resM.data.result
  totalPower = resM.data.totalPower
  ystdayPower = arr[arr.length-1].power
} catch(e) {
  console.log(e)
  totalPower = '0.00 '
  // Yesterday
  try {
    const yesterday = new Request('https://95598.csg.cn/ucs/ma/zt/charge/queryDayElectricByMPointYesterday');
    yesterday.method = 'POST'
    yesterday.headers = {
      "x-auth-token": data.token,
      "Content-Type":"application/json;charset=utf-8"}
    yesterday.body = `{
      "areaCode": "${code}",
      "eleCustId": "${id}"
    }`
    const resY = await yesterday.loadJSON();
    ystdayPower = resY.data.power
  } catch {
    ystdayPower = '0.00 '
  }
}

// UserAccountNumberSurplus
const balance = new Request('https://95598.csg.cn/ucs/ma/zt/charge/queryUserAccountNumberSurplus');
balance.method = 'POST'
balance.headers = {
  "x-auth-token": data.token,
  "Content-Type":"application/json;charset=utf-8"}
balance.body = `{
  "areaCode": "${code}",
  "eleCustId": "${id}"
}`
const resB = await balance.loadJSON();
bal = resB.data[0].balance


// selectElecBill
const elecBill = new Request('https://95598.csg.cn/ucs/ma/zt/charge/queryCharges');
elecBill.method = 'POST'
elecBill.headers = {
  "x-auth-token": data.token,
  "Content-Type":"application/json;charset=utf-8"}
elecBill.body = `{
  "type": 0,
  "areaCode": "${code}",
  "eleModels": [
    {
      "areaCode": "${code}",
      "eleCustId": "${id}"
    }
  ]
}`
const resBill = await elecBill.loadJSON();
const bill = resBill.data[0].points[0];
if (bill !== undefined) {  
  if (bill.arrears === null) {
    const elecBill = new Request('https://95598.csg.cn/ucs/ma/zt/charge/selectElecBill');  
    elecBill.method = 'POST'
    elecBill.headers = {
      "x-auth-token": data.token,
      "Content-Type":"application/json;charset=utf-8"}
    elecBill.body = `{  
      "electricityBillYear" : "${year}",
      "areaCode": "${code}",
      "eleCustId": "${id}"
    }`
    const resBill = await elecBill.loadJSON();
    const bill = resBill.data.billUserAndYear.pop();
    total = bill.totalPower;
    pay = resBill.data.electricBillPay;
    arrears = bill.totalElectricity;
  } else {
    total = bill.billingElectricity;
    pay = bill.arrears;
    arrears = bill.receieElectricity;
  }
} else {
  total = '0.00';
  pay = '0.00';
  arrears = '0.00';
}

// create Widget
const widget = await createWidget(ele, balance, pay);
  
if (config.runsInWidget) {
  Script.setWidget(widget)
  Script.complete()
} else {
  await widget.presentMedium();
}

// Create widget
async function createWidget() {
  const widget = new ListWidget();
  const gradient = new LinearGradient()
  color = [
    "#99CCCC",
    "#BCBBBB"
  ]
  const items = color[Math.floor(Math.random()*color.length)];
  gradient.locations = [0, 1]
  gradient.colors = [
    new Color(items, 0.5),
    new Color('#00000000')
  ]
  widget.backgroundGradient = gradient
    
   
  // Frame Layout
  const mainStack = widget.addStack();
  mainStack.layoutHorizontally();

  /**
  * Left Main Stack
  */
  const leftStack = mainStack.addStack();
  leftStack.layoutVertically();
  // logo stack
  const logoStack = leftStack.addStack();
  logoStack.setPadding(0, 4, 0, 0);
  const ironMan = new Request ('https://gitcode.net/4qiao/scriptable/raw/master/img/icon/lightningMan.png');
  const iconSymbol = await ironMan.loadImage();
  const ironManIcon = logoStack.addImage(iconSymbol);
  ironManIcon.imageSize = new Size(80, 80);
  logoStack.url = 'alipays://platformapi/startapp?appId=2021001164644764'
  leftStack.addSpacer(5);
    
  // name stack
  const nameStack = leftStack.addStack();
  nameStack.layoutHorizontally();
  nameStack.centerAlignContent();
  nameStack.setPadding(3, 10, 3, 10);
  // name icon
  const nameIcon = SFSymbol.named('person.crop.circle');
  const nameIconElement = nameStack.addImage(nameIcon.image);
  nameIconElement.imageSize = new Size(15, 15);
  nameIconElement.tintColor = Color.dynamic(new Color('#1E1E1E'), new Color('#FEFEFE'));
  nameStack.addSpacer(4);
  // name text
  const nameText = nameStack.addText(name);
  nameText.font = Font.mediumSystemFont(14);
  nameText.textOpacity = 0.8;
  leftStack.addSpacer(3)

  // pay stack
  const payStack = leftStack.addStack();
  payStack.backgroundColor = new Color('#EEEEEE', 0.1);
  payStack.setPadding(3, 10, 3, 10);
  payStack.cornerRadius = 10
  payStack.borderColor = pay > 0 ? new Color('#FF1744', 0.7) : Color.green();
  payStack.borderWidth = 2
  // pay bar icon
  const payIcon = SFSymbol.named('leaf.fill');
  const payIconElement = payStack.addImage(payIcon.image);
  payIconElement.imageSize = new Size(15, 15);
  payIconElement.tintColor = pay > 0 ? Color.red() : Color.green();
  payStack.addSpacer(4);
  // pay bar text
  const payText = payStack.addText(pay > 0 ? pay : '已缴费');
  payText.font = Font.mediumSystemFont(14);
  payText.textColor = pay > 0 ? new Color('#D50000') : Color.green();
  leftStack.addSpacer(6)
    
    
  /**
  * Center Stack
  */
  const centerStack = mainStack.addStack();
  centerStack.layoutVertically();
  centerStack.setPadding(5, 30, 0, 0)
  // yesterday
  const yesterdayRow = centerStack.addStack()
  const yesTDStack = yesterdayRow.addStack();
  yesTDStack.setPadding(0, 0, 0, 0);
  // yesterday icon
  const yesterdayIcon = SFSymbol.named('bolt.fill');
  const yesterdayIconElement = yesTDStack.addImage(yesterdayIcon.image);
  yesterdayIconElement.imageSize = new Size(15, 15);
  yesterdayIconElement.tintColor = Color.red();
  yesTDStack.addSpacer(6);
  // yesterday text
  const yesterdayText = yesTDStack.addText('昨日');
  yesterdayText.font = Font.mediumSystemFont(14)
  yesterdayText.textOpacity = 0.7;
  centerStack.addSpacer(3)
  // Yesterday Use text
  const yesterdayUseText = centerStack.addText(ystdayPower + ' kw·h')
  yesterdayUseText.textColor = Color.blue();
  yesterdayUseText.font = Font.boldSystemFont(14)
  yesterdayUseText.leftAlignText()
  centerStack.addSpacer(10)
    
    
  // month stack
  const monthStack = centerStack.addStack();
  monthStack.setPadding(0, 0, 0, 0);
  // month icon
  const monthIcon = SFSymbol.named('bolt.fill');
  const monthIconElement = monthStack.addImage(monthIcon.image);
  monthIconElement.imageSize = new Size(15, 15);
  monthIconElement.tintColor = Color.purple();
  monthStack.addSpacer(6);
  // month text
  const monthText = monthStack.addText('本月');
  monthText.font = Font.mediumSystemFont(14)
  monthText.textOpacity = 0.7;
  centerStack.addSpacer(3)
  // month Use Text
  const monthUseText = centerStack.addText(totalPower + ' kw·h')
  monthUseText.textColor = Color.blue();
  monthUseText.font = Font.boldSystemFont(14)
  monthUseText.leftAlignText()
  centerStack.addSpacer(10)
    
    
  // Use Ele Stack
  const useEleStack = centerStack.addStack();
  useEleStack.setPadding(0, 0, 0, 0);
  // Use ele icon
  const useEleIcon = SFSymbol.named('lightbulb.fill');
  const useEleIconElement = useEleStack.addImage(useEleIcon.image);
  useEleIconElement.imageSize = new Size(15, 15);
  useEleIconElement.tintColor = Color.orange();
  useEleStack.addSpacer(6);
  // Use ele text
  const useEleText = useEleStack.addText('上月');
  useEleText.font = Font.mediumSystemFont(14);
  useEleText.textOpacity = 0.7;
  centerStack.addSpacer(3)
  // Use ele total text
  const useEleTotalText = centerStack.addText(`${total} kw·h`)
  useEleTotalText.textColor = Color.blue();
  useEleTotalText.font = Font.boldSystemFont(14)
  useEleTotalText.leftAlignText()
  centerStack.addSpacer(5)
    
    
  /**
  * Right Main Stack
  */
  const rightStack = mainStack.addStack();
  rightStack.layoutVertically();
  rightStack.setPadding(5, 20, 0, 0)
  // bal Stack
  const balStack = rightStack.addStack();
  balStack.setPadding(0, 0, 0, 0);
  // balance Icon
  const balanceIcon = SFSymbol.named('star.fill');
  const balanceIconElement = balStack.addImage(balanceIcon.image);
  balanceIconElement.imageSize = new Size(15, 15);
  balanceIconElement.tintColor = Color.green();
  balStack.addSpacer(6);
  // balance text
  const balanceText = balStack.addText('余额');
  balanceText.font = Font.mediumSystemFont(14)
  balanceText.textOpacity = 0.7;
  rightStack.addSpacer(3)
  //balance Use Text
  const contain = bal.indexOf(".") != -1
  if (contain === false) {
    balanceUseText = rightStack.addText(`￥${bal}.00`)
  } else {
    balanceUseText = rightStack.addText('￥' + bal)
  }
  balanceUseText.textColor = Color.blue();
  balanceUseText.font = Font.boldSystemFont(14)
  balanceUseText.leftAlignText()
  rightStack.addSpacer(10)
    

  // ele Bill Stack
  const eleBiStack = rightStack.addStack();
  eleBiStack.setPadding(0, 0, 0, 0);
  // ele Bill icon
  const eleBillIcon = SFSymbol.named('yensign.circle');
  const eleBillIconElement = eleBiStack.addImage(eleBillIcon.image);
  eleBillIconElement.imageSize = new Size(15, 15);
  eleBillIconElement.tintColor = Color.purple();
  eleBiStack.addSpacer(6);
  // ele Bill text
  const eleBillText = eleBiStack.addText('电费');
  eleBillText.font = Font.mediumSystemFont(14);
  eleBillText.textOpacity = 0.7;
  rightStack.addSpacer(3)
  // ele Bill Total Text
  const eleBillTotalText = rightStack.addText(`￥${arrears}`)
  eleBillTotalText.textColor = Color.blue();
  eleBillTotalText.font = Font.boldSystemFont(14)
  eleBillTotalText.leftAlignText()
  rightStack.addSpacer(10)
    
    
  // arrears Stack
  const arrearsStack = rightStack.addStack();
  arrearsStack.setPadding(0, 0, 0, 0);
  // arrears icon
  const arrearsIcon = SFSymbol.named('exclamationmark.shield');
  const arrearsIconElement = arrearsStack.addImage(arrearsIcon.image);
  arrearsIconElement.imageSize = new Size(15, 15);
  arrearsIconElement.tintColor = Color.red();
  arrearsStack.addSpacer(6);
  // arrears text
  const arrearsText = arrearsStack.addText('待缴');
  arrearsText.font = Font.mediumSystemFont(14);
  arrearsText.textOpacity = 0.7;
  rightStack.addSpacer(3)
  // arrears total text
  const arrearsTotalText = rightStack.addText(`￥${pay}`);
  arrearsTotalText.textColor = Color.blue();
  arrearsTotalText.font = Font.boldSystemFont(14)
  arrearsTotalText.leftAlignText()
  rightStack.addSpacer(5)
  return widget;
}

// 计算时长
const pushTime = (timestamp - data.updateTime);
const P1 = pushTime % (24 * 3600 * 1000);
const hours = Math.floor(P1 / (3600 * 1000));
    
if (hours >= 12) {
  if (pay > 0) {
    notify('用电缴费通知‼️', `${name}` + `，户号 ${number}` + `\n上月用电 ${total} 度 ，待缴电费 ${pay} 元`)
    // writeString JSON
    if (F_MGR.fileExists(folder)) {
      data = {
        token: data.token,
        updateTime: timestamp
      };
      F_MGR.writeString(cacheFile, JSON.stringify(data));
    }
  }
}

async function notify (title, body, url, opts = {}) {
  let n = new Notification()
  n = Object.assign(n, opts);
  n.title = title
  n.body = body
  if (url) n.openURL = url
  return await n.schedule()
}

async function getImage(url) {
  const r = await new Request(url);
  return await r.loadImage();
}

async function shadowImage(img) {
  let ctx = new DrawContext();
  ctx.size = img.size
  ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
  // 图片遮罩颜色、透明度设置
  ctx.setFillColor(new Color("#000000", 0.2));
  ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
  return await ctx.getImage();
}