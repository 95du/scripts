// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: paper-plane;
/**
 * 小组件作者：95度茅台
 * Version 1.0.0
 * 2023-03-07 14:30
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1

==============================
 * 获取网页链接方法: 
 1，网页版中页面的链接。
 2，App里右上角分享的链接。

 * 脚本使用方法:
 1，拷贝链接，运行脚本。
 2，脚本自动拷贝已生成的SchemeURL并储存链接到iCloud (用于桌面小组件跳转)

==============================
 * 领京豆 https://h5.m.jd.com/rn/42yjy8na6pFsq1cx9MJQ5aTgu3kX/index.html?has_native=0
 * 种豆得豆 https://plantearth.m.jd.com/plantBean/index?source=lingjingdoushouye
 * 京豆收支明细 https://bean.m.jd.com/beanDetail/index.action?resourceValue=bean
 * 积分加油站 https://3.cn/-1FXjNaL
 * 京东农场 https://carry.m.jd.com/babelDiy/Zeus/3KSjXqQabiTuD1cJ28QskrpWoBKT/index.html?babelChannel=94
 * 签到日历 https://h5.m.jd.com/rn/3a5TGXF7Y8xpQ45CjgMzQ3tyqd4K/index.html?has_native=0/index?source=lingjingdoushouye
 * 待收货 https://trade.m.jd.com/order/orderlist_jdm.shtml?sceneval=2&jxsid=16780988595962555448&orderType=waitReceipt&ptag=7155.1.13&source=my/index?source=lingjingdoushouye
 * 京享值 https://vipgrowth.m.jd.com/#/home
 * 红包 https://wqs.jd.com/my/redpacket.shtml?sceneval=2&jxsid=16780988595962555448
 * 下月待还 https://mbt.jd.com/bill/monthlybill/monthbillcore/month-bill-index.html?channelcode=024
 * 白条 https://mcr.jd.com/credit_home/pages/index.html?btPageType=BT&channelName=024
 * 白条等级 https://agree.jd.com/credit_rights/index.html?from=btsyjifentc
 * 剩余待还 https://mbt.jd.com/bill/monthlybill/monthbillcore/month-bill-all.html?channelcode=zhuye
 * 小金库 https://lc.jr.jd.com/ck/xjkHold/index/?channel=a00294
 * 总资产 https://channel.jr.jd.com/wealthAssets/index/?source=wdqb&channelCode=CFCCsingle01
 * 汪汪庄园 https://joypark.jd.com/?activityId=99DZNpaCTAv8f4TuKXr0Ew&inviterId=zXrXTE1udgOiA5aUdMsW8w&inviteType=0

*/

const uri = Script.name();
const F_MGR = FileManager.local();
const folder = F_MGR.joinPath(F_MGR.documentsDirectory(), "JD_SchemeUrl");
if (!F_MGR.fileExists(folder)) {
  F_MGR.createDirectory(folder);
}
const cacheFile = F_MGR.joinPath(folder, 'setting.json');
const bgPath = F_MGR.joinPath(F_MGR.documentsDirectory(), "95duBackground");
const bgImage = F_MGR.joinPath(bgPath, uri + ".jpg");

if (F_MGR.fileExists(cacheFile)) {
  data = F_MGR.readString(cacheFile)
  setting = JSON.parse(data);
}

const notify = async (title, body, url) => {
  let n = new Notification()
  n.title = title
  n.body = body
  n.sound = 'piano_success'
  if (url) {n.openURL = url}
  return await n.schedule()
}

async function presentMenu() {
  const alert = new Alert();
  alert.message = '\n1，运行制作生成跳转链接\n2，桌面组件点击跳转到指定App页面\n3，具体方法请查看脚本代码开头注释\n\n小组件作者:95度茅台'
  const actions = [
    '更新代码', '重置所有', '更多组件', '透明背景', '生成链接'
  ];

  actions.forEach(( action, index ) => {
  alert[ index === 0 || index === 1 ? 'addDestructiveAction' : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  const mainMenu = await alert.presentSheet();
  if (mainMenu === 1) {
    await F_MGR.remove(folder);
    if (F_MGR.fileExists(bgImage)) {
      await F_MGR.remove(bgImage);
    }
    Safari.open('scriptable:///run/' + encodeURIComponent(uri));
  }
  if (mainMenu === 2) {
    script = {
      name: 'store.js',
      code: 'https://gitcode.net/4qiao/scriptable/raw/master/vip/main95duStore.js'
    }
    await importModule(await downloadModule()).main();
  }
  if (mainMenu === 3) {
    script = {
      name: 'image.js',
      code: 'https://gitcode.net/4qiao/scriptable/raw/master/vip/mainTableBackground.js'
    }
    await importModule(await downloadModule()).main();
  }
  if (mainMenu === 4) {
    await generateLink();
  }
  if (mainMenu === 0) {
    const reqUpdate = new Request(atob('aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9zY3JpcHRhYmxlL3Jhdy9tYXN0ZXIvYXBpL2pkX3NjaGVtZVVybC5qcw=='));
    const codeString = await reqUpdate.loadString();
    const finish = new Alert();
    if (codeString.indexOf("95度茅台") == -1) {
      finish.title = "更新失败"
      finish.addAction('OK')
      await finish.presentAlert();
    } else {
      F_MGR.writeString(  
        module.filename,
        codeString
      );
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
  }
}

async function generateLink() {
  const alert = new Alert();
  alert.title = '输入链接';
  alert.addTextField('输入正确的链接', Pasteboard.paste());
  alert.addAction('确定');
  alert.addCancelAction('取消');
  const input = await alert.presentAlert();
  const value = alert.textFieldValue(0);
  if (input === -1) return;
    const openUrl = encodeURIComponent(value);
  if ((openUrl.indexOf('jd.com') > -1 || openUrl.indexOf('3.cn') > -1) && value.indexOf('openApp') === -1) {
    const schemeUrl = `openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22${openUrl}%22%7D`
    setting = {schemeUrl: schemeUrl}
    F_MGR.writeString(cacheFile, JSON.stringify(setting));
    console.log(schemeUrl);
    Pasteboard.copy(schemeUrl);
    Safari.open(schemeUrl);
  } else {
    notify('生成失败 ⚠️', '请输入正确的链接。')
  }
}

async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundImage = F_MGR.readImage(bgImage);
  const image = await getImage('https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/openUrl.png');
  const jdImage = widget.addImage(image);
  jdImage.centerAlignImage();
  jdImage.url = setting.schemeUrl;
  return widget;
}

async function downloadModule() {
  const modulePath = F_MGR.joinPath(folder, script.name);
  if (F_MGR.fileExists(modulePath)) {
    return modulePath;
  } else {
    const req = new Request(script.code);
    const moduleJs = await req.load().catch(() => {
      return null;
    });
    if (moduleJs) {
      F_MGR.write(modulePath, moduleJs);
      return modulePath;
    }
  }
}

async function getImage(url) {
  return await new Request(url).loadImage();
}

if (config.runsInApp) {
  await presentMenu();
} else {
  widget = await createWidget();
  Script.setWidget(widget);
  Script.complete();
}