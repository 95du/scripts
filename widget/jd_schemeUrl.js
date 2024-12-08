// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: paper-plane;
/**
 * 脚本作者：95度茅台
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

const fm = FileManager.local();
const folder = fm.joinPath(fm.documentsDirectory(), "JD_SchemeUrl");
if (!fm.fileExists(folder)) fm.createDirectory(folder);

const settingPath = fm.joinPath(folder, 'setting.json');
if (fm.fileExists(settingPath)) {
  data = fm.readString(settingPath)
  setting = JSON.parse(data);
}

async function presentMenu() {
  const alert = new Alert();
  alert.message = '1，运行制作生成跳转链接\n2，桌面组件点击跳转到指定App页面\n3，具体方法请查看脚本代码开头注释'
  const actions = [
    '更新代码', '重置所有', '更多组件', '透明背景', '生成链接'
  ];

  actions.forEach(( action, index ) => {
  alert[ index === 0 || index === 1 ? 'addDestructiveAction' : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  const mainMenu = await alert.presentSheet();
  if (mainMenu === 1) {
    await fm.remove(folder);
    if (fm.fileExists(bgImage)) {
      await fm.remove(bgImage);
    }
    Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
  }
  if (mainMenu === 2) {
    script = {
      name: 'store.js',
      code: 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_95du_Store.js'
    }
    await importModule(await downloadModule()).main();
  }
  if (mainMenu === 3) {
    script = {
      name: 'image.js',
      code: 'https://raw.githubusercontent.com/95du/scripts/master/main/main_background.js'
    }
    await importModule(await downloadModule()).main(folder);
  }
  if (mainMenu === 4) {
    await generateLink();
  }
  if (mainMenu === 0) {
    const reqUpdate = new Request('https://raw.githubusercontent.com/95du/scripts/master/widget/jd_schemeUrl.js');
    const codeString = await reqUpdate.loadString();
    const finish = new Alert();
    if (codeString.indexOf("95度茅台") == -1) {
      finish.title = "更新失败"
      finish.addAction('OK')
      await finish.presentAlert();
    } else {
      fm.writeString(  
        module.filename,
        codeString
      );
      Safari.open('scriptable:///run/' + encodeURIComponent(Script.name()));
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
    setting = { schemeUrl }
    fm.writeString(settingPath, JSON.stringify(setting));
    console.log(schemeUrl);
    Pasteboard.copy(schemeUrl);
    Safari.open(schemeUrl);
  } else {
    console.log('生成失败 ⚠️', '请输入正确的链接。');
  }
}

async function createWidget() {
  const widget = new ListWidget();
  widget.url = setting.schemeUrl;
  const bgImage = fm.joinPath(folder, Script.name());
  if (fm.fileExists(bgImage)) {
    widget.backgroundImage = fm.readImage(bgImage);
  }
  
  function selectFrom( a, b ) {
    const choices = b - a + 1;
    return Math.floor(Math.random() * choices + a);
  }
  const num = selectFrom( 1, 30 );
  const image = await new Request(`https://storage.360buyimg.com/swm-stable/joypark-static1/unlock_joy_level${num}.png`).loadImage();
  const widgetImage = widget.addImage(image);
  widgetImage.centerAlignImage();
 
  Script.setWidget(widget);  
  Script.complete();
}

async function downloadModule() {
  const modulePath = fm.joinPath(folder, script.name);
  if (fm.fileExists(modulePath)) {
    return modulePath;
  } else {
    const req = new Request(script.code);
    const moduleJs = await req.load().catch(() => {
      return null;
    });
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      return modulePath;
    }
  }
}

if (config.runsInApp) {
  await presentMenu();
} else {
  await createWidget();
}