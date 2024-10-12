// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: shopping-bag;
/**
 * 组件名称: 京东
 * 组件作者：95度茅台
 * Version 1.0.1
 * 2023-11-09 18:30
 */


async function main() {
  const fm = FileManager.local();
  const mainPath = fm.joinPath(fm.documentsDirectory(), '95du_jd_Bean');
  
  const getCachePath = (dirName) => fm.joinPath(mainPath, dirName);
  
  const [ settingPath, cacheImg, cacheStr ] = [
    'setting.json',
    'cache_image',
    'cache_string',
  ].map(getCachePath);
  
  /**
   * 读取储存的设置
   * @returns {object} - 设置对象
   */
  const getBotSettings = (file) => {
    if (fm.fileExists(file)) {
      return { cookie, randomIndex, radius, light, dark } = JSON.parse(fm.readString(file));
    }
    return null;
  };
  const setting = await getBotSettings(settingPath);
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
    console.log(JSON.stringify(
      settings, null, 2)
    )
  };
  
  /**  
  * 弹出一个通知
  * @param {string} title
  * @param {string} body
  * @param {string} url
  * @param {string} sound
  */
  const notify = async (title, body, url) => {
    let n = new Notification();
    n.title = title
    n.body = body
    n.sound = 'alert'
    if (url) {n.openURL = url}
    return await n.schedule();
  };
  
  /**
   * 获取背景图片存储目录路径
   * @returns {string} - 目录路径
   */
  const getBgImage = () => fm.joinPath(cacheImg, Script.name());
  
  /**
   * 获取图片并使用缓存
   * @param {string} File Extension
   * @returns {image} - Request
   */
  const useFileManager = ({ cacheTime } = {}) => {
    return {
      readString: (name) => {
        const filePath = fm.joinPath(cacheStr, name);
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fm.fileExists(filePath) ? fm.readString(filePath) : null;
      },
      writeString: (name, content) => fm.writeString(fm.joinPath(cacheStr, name), content),
      // cache image
      readImage: (name) => {
        const filePath = fm.joinPath(cacheImg, name);
        const fileExists =  fm.fileExists(filePath);
        if (fileExists && hasExpired(filePath) > cacheTime) {
          fm.remove(filePath);
          return null;
        }
        return fm.fileExists(filePath) ? fm.readImage(filePath) : null;
      },
      writeImage: (name, image) => fm.writeImage(fm.joinPath(cacheImg, name), image),
    };
    
    function hasExpired(filePath) {
      const createTime = fm.creationDate(filePath).getTime();
      return (Date.now() - createTime) / (60 * 60 * 1000)
    }
  };
  
  const getCacheImage = async (name, url) => {
    const cache = useFileManager({ cacheTime : 48 });
    const image = cache.readImage(name);
    if (image) return image;
    const img = await new Request(url).loadImage();
    cache.writeImage(name, img);
    return img;
  };
  
  /**
   * 获取 POST JSON 字符串
   * @param {string} json
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, url, method, headers, body) => {
    const cache = useFileManager({ cacheTime: setting.cacheTime })
    const jsonString = cache.readString(jsonName);
    if (jsonString) {
      return JSON.parse(jsonString);
    }
    
    const response = await makeRequest(url, method, headers, body);
    const parsed = response;
    if (parsed.retcode === 0 || parsed.resultCode === 0 || parsed.code == 0 || parsed.list) {
      const jsonFile = JSON.stringify(response);
      cache.writeString(jsonName, jsonFile);
    } else {
      notify('京东', parsed.message);
    }
    return response;
  };
  
  /**
   * Makes an HTTP request and returns the response as JSON.
   *
   * @param {string} url
   * @param {string} method
   * @param {Object} headers
   * @param {string|null} body
   * @returns {Promise<any>} - JSON
   */
  const makeRequest = async (url, method, headers, body) => {
    const req = new Request(url);
    req.method = method;
    req.headers = headers;
    if (body) req.body = body;
    return await req.loadJSON();
  };
  
  // User Information
  const getUserInformation = async (url) => {
    const headers = {
      Referer: "https://my.m.jd.com/",
      Cookie: cookie
    };
    const response = await getCacheString('info.json', url, 'GET', headers);
    return response.base;
  };

  const { headImageUrl, nickname, jdNum, jvalue } = await getUserInformation('https://api.m.jd.com/api?functionId=queryJDUserInfo&appid=jd-cphdeveloper-m');
  
  // 白条
  const totalAsset = async (url) => {
    const headers = {
      Referer: "https://mallwallet.jd.com/",
      Cookie: cookie
    }
    const body = `reqData={
      "clientType": "ios"
    }`
    const { resultData } = await getCacheString('totalAsset.json', url, 'POST', headers, body);
    return resultData.data;
  };
  
  // 红包
  const redPackage = async (url) => {
    const headers = {
      Referer: 'https://plantearth.m.jd.com/',
      Cookie: cookie
    }
    const response = await getCacheString('redPackage.json', url, 'GET', headers);
    return response.result;
  };
  
  // 农场
  const getFarmProgress = async (url) => {
    const headers = {
      Referer: 'https://h5.m.jd.com/',  
      Cookie: cookie
    }
    const body = 'body=version:4&appid=wh5&clientVersion=9.1.0'
    const { farmUserPro } = await getCacheString('farmProgress.json', url, 'POST', headers, body);
    return farmUserPro;
  };
  
  // 守约分
  const getCustXbScore = async (url) => {
    const headers = {
      Referer: 'https://agree.jd.com/',
      Cookie: cookie
    }
    const body = `reqData={}`
    const { resultData } = await getCacheString('custXbScore.json', url, 'POST', headers, body);
    return resultData.data;
  };

  // 京豆
  const splitBeans = async (url) => {
    const headers = {
      Referer: 'https://plantearth.m.jd.com/',
      Cookie: cookie,
    };
    const { list, willExpireNum } = await getCacheString('beans.json', url, 'GET', headers);
    const df = new DateFormatter();
    df.dateFormat = 'yyyy-MM-dd';
    const date = df.string(new Date());
  
    const filteredItems = list.filter((item) => {
      return item.createDate.indexOf(date) > -1;
    });
  
    const positiveAmounts = filteredItems.filter((item) => item.amount > 0).map((item) => item.amount);
    const negativeAmounts = filteredItems.filter((item) => item.amount < 0).map((item) => Math.abs(item.amount));
  
    const positive = positiveAmounts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
    const negative = negativeAmounts.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  
    return { willExpireNum, positive, negative }
  };
  
  // 签到
  const signBeanAct = async () => {
    const url = 'https://api.m.jd.com/client.action?functionId=signBeanFinishIndex&appid=signed_wh5';
    const headers = {
      Referer: 'https://jdbeanscalendar-pro.pf.jd.com/',
      Cookie: cookie
    }
    const body = `body={
      fp: "-1",
      shshshfp: "-1",
      shshshfpa: "-1",
      referUrl: "-1",
      userAgent: "-1",
      jda: "-1",
      rnVersion: "3.9"
    }`
    const response = await getCacheString('signBeanAct.json', url, 'POST', headers, body);
    if (response.code === '0') {
      const { data } = response;
      const { status, dailyAward, continuousDays, tomorrowSendBeans, totalUserBean, continuityAward } = data;
      if (status === '1') {
        const filePath = fm.joinPath(cacheStr, 'signBeanAct.json');
        if (fm.fileExists(filePath)) fm.remove(filePath);
        if (dailyAward) {
          notify(`${dailyAward.title}${dailyAward.subTitle} ${dailyAward.beanAward.beanCount} 京豆`, `已签到 ${continuousDays} 天，明天签到加 ${tomorrowSendBeans || 0} 京豆 ( ${totalUserBean} )`);
        } else {
          notify(continuityAward.title, `获得 ${continuityAward.beanAward.beanCount} 京豆，已签到 ${continuousDays} 天，明天签到加 ${tomorrowSendBeans || 0} 京豆 ( ${totalUserBean} )`);
        }
      }
      return data;
    } else {
      setting.code = 3;
      //writeSettings(setting);
      notify(response.errorMessage, 'Cookie 过期，请重新登录京东 ‼️');
    }
  };
  const sign = await signBeanAct();
  
  // ========= config ========= //
  const Run = async () => {
    if (randomIndex === 0) {
      const {
        quota: { state, quotaLeft },
        bill: { amount }
      } = await totalAsset('https://ms.jr.jd.com/gw/generic/bt/h5/m/firstScreenNew');
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fmbt.jd.com%2Fbill%2Fmonthlybill%2Fmonthbillcore%2Fmonth-bill-index.html%3Fchannelcode%3D024%22%7D'
      setting.randomIndex = 1;
      const status = state === '1';
      val = {
        leading: 3,
        imageSize: 38,
        spac: 3,
        logoImage: 'https://kjimg10.360buyimg.com/jr_image/jfs/t1/199054/27/38361/3140/64ddf97fFb4d2b813/8c93bcb38b2b244c.png',
        text1: status ? `额度 ${Math.round(quotaLeft.replace(',', ''))}` : '额度 0.00',
        text2: status ? `待还 ${amount}` : '0.00',
        lightColor: '#FF0000',
        darkColor: '#FFBF00'
      }
    } else if (randomIndex === 1) {
      const { willExpireNum, positive, negative } = await splitBeans('https://api.m.jd.com?appid=jd-cphdeveloper-m&functionId=myBean&body=%7B%22tenantCode%22:%22jgm%22,%22bizModelCode%22:%226%22,%22bizModeClientType%22:%22M%22,%22externalLoginType%22:%221%22%7D&g_login_type=0&g_tk=997104177&g_ty=ajax&appCode=ms0ca95114');
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fbean.m.jd.com%2FbeanDetail%2Findex.action%3FresourceValue%3Dbean%22%7D'
      setting.randomIndex = 2;
      val = {
        leading: -3,
        imageSize: 38,
        spac: 3,
        logoImage: 'https://img30.360buyimg.com/jdmonitor/jfs/t1/187437/15/5066/2037/60ad0590E9aa565a9/fbacab715a77dc29.png',
        text1: '今日京豆 ' + String(positive - negative),
        text2: `即将过期 ${willExpireNum}`,  
        lightColor: '#FF0000',
        darkColor: '#FFBF00'
      }
    } else if (randomIndex === 2) {
      const redEnvelope = await redPackage('https://api.m.jd.com/api?functionId=redPacket&appid=jd-cphdeveloper-m&body=%7B%22type%22%3A1%2C%22redBalanceFlag%22%3A1%2C%22page%22%3A1%2C%22tenantCode%22%3A%22jgm%22%2C%22bizModelCode%22%3A%226%22%2C%22bizModeClientType%22%3A%22M%22%2C%22externalLoginType%22%3A%221%22%7D&loginType=2&client=m&sceneval=2&g_login_type=1&g_ty=ajax&appCode=ms0ca95114');
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fwqs.jd.com%2Fmy%2Fredpacket.shtml%3Fsceneval%3D2%26jxsid%3D16780988595962555448%22%7D'
      setting.randomIndex = 3;
      val = {
        leading: -3,
        imageSize: 42,
        spac: 3,
        logoImage: 'https://kjimg10.360buyimg.com/jr_image/jfs/t1/53657/7/23721/4026/63f4926cFd5b41d13/dcbf2725b8a4a2af.png',
        text1: `红包 ${redEnvelope.balance}`,
        text2: `即将过期 ${!redEnvelope.expiredBalance ? '0.00' : redEnvelope.expiredBalance}`,  
        lightColor: '#FF0000',
        darkColor: '#FFBF00'
      }
    } else if (randomIndex === 30) {
      const farm = await getFarmProgress('https://api.m.jd.com/client.action?functionId=initForFarm');
      if (farm.treeState === 2 || farm.treeState === 3) {
        notify('东东农场', `${farm.name}，可以兑换啦~`);  
      }
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fcarry.m.jd.com%2FbabelDiy%2FZeus%2F3KSjXqQabiTuD1cJ28QskrpWoBKT%2Findex.html%3FbabelChannel%3D94%2Findex%3Fsource%3Dlingjingdoushouye%22%7D'
      setting.randomIndex = 4
      val = {
        leading: 5,
        imageSize: 35,
        spac: 5,
        logoImage: 'https://gitcode.net/enoyee/scriptable/raw/master/img/jd/icon_fruit.png',
        text1: `已种植『 ${farm.simpleName} 』`,
        text2: '果树进度  ' + Math.floor((farm.treeEnergy / farm.treeTotalEnergy) * 100) + '%',  
        lightColor: '#1ea532',
        darkColor: '#32CD32'
      }
    } else if (randomIndex === 3) {
      const { continuousDays, tomorrowSendBeans } = sign;
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fh5.m.jd.com%2Frn%2F3a5TGXF7Y8xpQ45CjgMzQ3tyqd4K%2Findex.html%3Fhas_native%3D0%2Findex%3Fsource%3Dlingjingdoushouye%22%7D'
      setting.randomIndex = 4
      val = {
        leading: 3,
        imageSize: 40,
        spac: 8,
        logoImage: 'https://m.360buyimg.com/babel/jfs/t1/163192/9/7798/5516/6037526eE6df71306/1504fb66a0aa1a8e.png',
        text1: `已连签 ${continuousDays} 天`,
        text2: `明天加 ${tomorrowSendBeans || 0} 京豆`,
        lightColor: '#000000',
        darkColor: '#FFA500'
      }
    } else if (randomIndex === 4) {
      const { xbScore, recentDate } = await getCustXbScore('https://ms.jr.jd.com/gw/generic/bt/h5/m/queryCustXbScoreInfo');
      setting.schemeUrl = 'openApp.jdMobile://virtual?params=%7B%22category%22%3A%22jump%22%2C%22des%22%3A%22m%22%2C%22url%22%3A%22https%3A%2F%2Fagree.jd.com%2Fm%2Findex.html%3Fsceneval%3D2%26jxsid%3D16780988595962555448%26channel%3Dwq%26from%3Djdmwode%22%7D'
      setting.randomIndex = 0
      val = {
        leading: 3,
        imageSize: 33,
        spac: 8,
        logoImage: 'https://gitcode.net/4qiao/scriptable/raw/master/img/icon/human.png',
        text1: `守约分 ${xbScore}`,
        text2: recentDate,
        lightColor: '#000000',
        darkColor: '#FFFFFF'
      }
    };    
    writeSettings(setting);
    
    // Stack & Text Color
    stackSize = new Size(0, 64);
    stackBackground = Color.dynamic(
      new Color('#EFEBE9', light),
      new Color('#161D2A', dark)
    );
    textColor = Color.dynamic(
      new Color('#1E1E1E'),
      new Color('#FEFEFE')
    );
    jNumColor = Color.dynamic(
      new Color('#FF0000'),
      new Color('#FFBF00')
    );
    botTextColor = Color.dynamic(
      new Color(val.lightColor),
      new Color(val.darkColor)
    );
  };
  
  /**
   * Frame Layout
   * @param {image} image
   * @param {string} text
   */
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.url = setting.schemeUrl;
    
    const bgImage = await getBgImage();
    if (fm.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(fm.readImage(bgImage))
    } else {
      widget.backgroundColor = Color.dynamic(new Color('#999999'), new Color('#2B2B2E'));
    };
    
    /* Top Content */
    widget.setPadding(0, 0, 0, 0);
    const topStack = widget.addStack();
    topStack.setPadding(10, 3, 10, 3)
    topStack.layoutHorizontally();
    topStack.centerAlignContent();
    topStack.addSpacer();
    topStack.backgroundColor = stackBackground;
    topStack.cornerRadius = 21;
    topStack.size = stackSize;
    
    const iconStack = topStack.addStack();
    const headImage = await getCacheImage('headImage.png', headImageUrl);
    const imageElement = iconStack.addImage(headImage);
    imageElement.imageSize = new Size(45, 45);
    iconStack.cornerRadius = radius;
    iconStack.borderWidth = 2;
    iconStack.borderColor = new Color('#FFBF00');
    topStack.addSpacer(10);
    
    const nameStack = topStack.addStack();
    nameStack.layoutVertically();
    nameStack.centerAlignContent();
    const nicknameText = nameStack.addText(nickname);
    nicknameText.font = Font.boldSystemFont(15);
    nicknameText.textColor = textColor;
    nicknameText.textOpacity = 0.8
    nameStack.addSpacer(2);
    
    const jdNumStack = nameStack.addStack();
    jdNumStack.layoutHorizontally();
    jdNumStack.centerAlignContent();
    const jdou = await getCacheImage('jdou.png', 'https://m.360buyimg.com/njmobilecms/jfs/t23452/19/1797778090/8622/14e40996/5b69974eN9880f531.png');
    const jdouIcon = jdNumStack.addImage(jdou);
    jdouIcon.imageSize = new Size(16, 16);
    jdNumStack.addSpacer(3);
    const contentText = jdNumStack.addText(jdNum.toString());
    contentText.font = Font.boldSystemFont(16);
    contentText.textColor = jNumColor
    contentText.textOpacity = 0.7;
    topStack.addSpacer();
    widget.addSpacer(5);
    
    // middleStack
    const middleStack = widget.addStack();
    middleStack.addSpacer();
    const middleText = middleStack.addText(`京享值 ${jvalue.toString()}`);
    middleText.textColor = Color.white();
    middleText.textOpacity = 0.9
    middleText.font = Font.mediumSystemFont(12);
    middleStack.addSpacer();
    widget.addSpacer();
    
    /** 
    * Bottom Content
    * @param {image} image
    * @param {string} jvalue
    */
    const contentStack = widget.addStack();
    contentStack.layoutHorizontally()
    contentStack.centerAlignContent()
    contentStack.addSpacer();
    contentStack.backgroundColor = stackBackground;
    contentStack.setPadding(10, val.leading, 10, 3);
    contentStack.cornerRadius = 21;
    contentStack.size = stackSize;
    // Logo icon
    const logoStack = contentStack.addStack();
    const logoImage = await getCacheImage(`${randomIndex}.png`, val.logoImage);
    const logoIcon = logoStack.addImage(logoImage);
    logoIcon.imageSize = new Size(val.imageSize, val.imageSize);
    contentStack.addSpacer(val.spac);
    
    const bottStack = contentStack.addStack();
    bottStack.layoutVertically();
    bottStack.centerAlignContent();
    
    const randomText1 = bottStack.addText(val.text1);
    randomText1.textColor = textColor;
    randomText1.font = Font.boldSystemFont(13);
    randomText1.textOpacity = 0.8;
    bottStack.addSpacer(2.5);
  
    const randomText2 = bottStack.addText(val.text2);
    randomText2.textColor = botTextColor;
    randomText2.font = Font.mediumSystemFont(13);
    randomText2.textOpacity = 0.8;
    contentStack.addSpacer();
    
    if (config.runsInApp) {
      await widget.presentSmall();
    } else {
      Script.setWidget(widget);
      Script.complete();
    }
    return widget
  };
  
  
  /**-------------------------**
   * Request(url) json & image
   */
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage()
  };
  
  async function createErrWidget() {
    const widget = new ListWidget();
    const image = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/img/jingdong/user.png').loadImage();
    const widgetImage = widget.addImage(image);
    widgetImage.imageSize = new Size(50, 50);
    widgetImage.centerAlignImage();
    widget.addSpacer(10);
    const text = widget.addText('用户未登录');
    text.font = Font.systemFont(17);
    text.centerAlignText();
    Script.setWidget(widget);
  };
  
  if (setting.code === 0) {
    await Run();
    await createWidget();
  } else {
    await createErrWidget();
  }
}
module.exports = { main }