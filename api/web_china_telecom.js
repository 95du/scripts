// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: phone-volume;
/**
 * 组件作者: 95度茅台
 * 组件名称: 中国电信_2
 * Version 1.1.0
 * 2024-10-23 13:18
 */


async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_telecom';
  const module = new _95du(pathName);  
  
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  const setting = module.settings;
  const { balanceColor } = setting;
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (settings) => {
    fm.writeString(settingPath, JSON.stringify(settings, null, 2));
    console.log(JSON.stringify(
      settings, null, 2
    ))
  };
    
  /**
   * 获取缓存的 JSON 字符串
   * @param {string} jsonName
   * @param {string} jsonUrl
   * @returns {object} - JSON
   */
  const getCacheString = async (jsonName, jsonUrl) => {
    const { type } = module.getFileInfo(jsonName);
    const cache = module.useFileManager({ cacheTime: setting.cacheTime, type });
    const json = cache.read(jsonName);
    if (json) return json;
    
    let response = await makeReq(jsonUrl);
    if (response?.serviceResultCode == 0 && setting.cookie) {
      cache.write(jsonName, response)
    } else {
      const cookie = await updateCookie(setting.loginUrl);
      if (cookie) response = await makeReq(jsonUrl);
    }
    return response;
  };
  
  /**
   * Get boxjs Data
   * Dependency: Quantumult-X / Surge
   */
  const getBoxjsData = async () => {
    try {
      const response = await new Request('http://boxjs.com/query/data/china_telecom_loginUrl').loadJSON();
      const loginUrl = response?.val;
      if (loginUrl) {
        setting.loginUrl = loginUrl;
        writeSettings(setting);
        return await updateCookie(loginUrl);
      }
    } catch (e) {
      module.notify('获取 Boxjs 数据失败⚠️', '需打开 Quantumult-X 或其他辅助工具', 'quantumult-x://');
      return null;
    }
  };
  
  /**
   * 从用户套餐页面获取数据，并进行处理
   * @returns {Promise<Object>} - 包含处理后的语音、流量和余额信息的对象
   */
  const updateCookie = async (loginUrl) => {
    if (loginUrl) {
      const url = loginUrl.match(/(http.+)&sign/)?.[1] || loginUrl;
      const req = await new Request(url);
      await req.load();  
      const cookie = req.response.headers['Set-Cookie'];
      if (cookie) {
        setting.cookie = cookie;
        writeSettings(setting);
        module.notify('中国电信_2', '天翼账号中心 Cookie 更新成功');
        return cookie;
      }
    }
  };
  
  const makeReq = async (url) => {
    let cookie = setting.cookie;
    if (!cookie) {
      cookie = setting.loginUrl 
      ? await updateCookie(setting.loginUrl) 
      : await getBoxjsData();
    }
    
    const headers = { 
      Cookie: cookie 
    };
    return await module.apiRequest(url, headers);
  };
  
  const formatFlows = (balance) => {
    if (balance < 1) {
      return `${(balance * 1024).toFixed(1)} MB`;
    } else {
      return `${balance} GB`;
    }
  };
  
  const fetchPackage = async () => {
    const package = await getCacheString('package_detail.json', 'https://e.dlife.cn/user/package_detail.do');
    return package || {};
  };
  
  let voiceTotal = 0;
  let voiceBalance = 0;
  let totalFlow = 0;
  let balanceFlow = 0;
  
  const package = await fetchPackage();
  // 遍历 items 数组
  package?.items?.forEach(data => {
    data?.items?.forEach(item => {
      const { ratableAmount: amount, ratableResourcename: name } = item;
      if (item.unitTypeId == 1) {
        voiceTotal += parseFloat(item.ratableAmount);
        voiceBalance += parseFloat(item.balanceAmount);
      } else if (item.unitTypeId == 3 && amount < 999999990000 && (setting.orient ? name.includes('定向') : !name.includes('定向'))) {
        totalFlow += parseFloat(item.ratableAmount);
        balanceFlow += parseFloat(item.balanceAmount);
      };
    })
  });
  
  // 语音
  const voice = voiceTotal > 0 ? (voiceBalance / voiceTotal * 100).toFixed(1) : '0';
  
  // 流量
  const flowTotal = (totalFlow / 1048576).toFixed(2);
  const flowBalance = (balanceFlow / 1048576).toFixed(2);
  const flow = flowTotal > 0 ? ((flowBalance / flowTotal) * 100).toFixed(1) : '0';
  // 格式化流量
  const flowBalFormat = formatFlows(flowBalance) || 0;
  
  // 余额
  const fetchBalance = async () => {
    const balances = await getCacheString('balance.json', 'https://e.dlife.cn/user/balance.do');
    return balances || {};
  };
  
  const bal = await fetchBalance();
  const balanceAvailable = (bal?.totalBalanceAvailable / 100).toFixed(2) || '0';
  
  // 用量通知
  const formatFlow = (isFlowBalance, isFlow) => {
    const uesd = (isFlowBalance - isFlow).toFixed(2);
    return uesd <= 0 ? '0 MB' : `${uesd >= 1 ? uesd + ' GB' : (uesd * 1024).toFixed(1) + ' MB'}`;
  };
  
  const hourlyWrite = async (flowBalance, voiceBalance) => {
    const modificationDate = fm.modificationDate(settingPath);
    const lastWriteTime = modificationDate.getTime();
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastWriteTime) / (60 * 60 * 1000);
    if (setting.cookie && (timeDifference >= setting.cacheTime || !setting.flowBalance)) {  
      const flowUesd = formatFlow(setting.flowBalance, flowBalance);
      module.notify(`中国电信${setting.cacheTime}小时用量‼️`, `流量使用 ${flowUesd}，语音使用 ${setting.voiceBalance - voiceBalance} 分钟。`);
      writeSettings({ 
        ...setting,
        flowBalance,
        voiceBalance
      });
    }
  };
  
  /**
   * Get dayNumber
   * Daily dosage
   */
  const date = Date.now();
  const dayNumber = Math.floor(date / 1000 / 60 / 60 / 24);
  if (dayNumber !== setting.dayNumber) {
    writeSettings({ 
      ...setting,
      dayNumber,
      flow,
      flowBalance,
      voice,
      voiceBalance
    });
    return null;
  };
  
  const [ flow1st, flow2nd, voice1st, voice2nd ] = [ setting.flow, flow, voice, setting.voice ];
  
  const StepFin = 100;
  const barWidth = 15;
  const barHeigth = 111
  
  //=========> Color <=========//
  const widgetColor = Color.dynamic(
    new Color("#FFFFFF"), 
    new Color("#000000")
  );
  const stackBgColor = Color.dynamic(
    new Color("#dfdfdf"), 
    new Color("#333333")
  );
  const barBgColor = Color.dynamic(
    new Color("#dfdfdf"), 
    new Color("#cfcfcf")
  );
  const MainTextColor = Color.dynamic(
    new Color("#000000"), 
    new Color("#ffffff")
  );
  const SubTextColor = Color.dynamic(  
    new Color("#666666"), 
    new Color("#aaaaaa")
  );
  
  // Small Widget Color
  const textColor = Color.dynamic(new Color(setting.textLightColor), new Color(setting.textDarkColor));
  const barColor = Color.dynamic(
    new Color('#CFCFCF'), 
    new Color('#7A7A7A')
  );

  const getColor = (value, isOpaque = false) => {
    const colorMap = new Map([
      [ 10, isOpaque ? new Color("#F7B50075") : new Color("#FF0000") ],
      [ 20, isOpaque ? new Color("#BE62F375") : new Color("#F7B500") ],
      [ 40, isOpaque ? new Color("#0099FF75") : new Color("#FFA500") ],
      [ 50, isOpaque ? new Color("#FFA50075") : new Color("#BE62F3") ],
      [ 65, isOpaque ? new Color("#FFA50075") : new Color("#0099FF") ],
      [ 75, isOpaque ? new Color("#FFA50075") : new Color("#44CB9C") ]
    ]);
  
    for (let [thresholdBetween, color] of colorMap) {
      if (value <= thresholdBetween) return color;
    }
    return isOpaque ? new Color("#FFA50075") : new Color("#00C400");
  };
  
  //=========> config <=========//
  const screenSize = Device.screenSize().height;
  const payment = 'alipays://platformapi/startapp?appId=2021001107610820&page=pages%2Ftop-up%2Fhome%2Findex';
  
  const df = new DateFormatter();
  df.dateFormat = 'ddHHmm'
  const day1st = df.string(new Date());
  
  const image = await module.getCacheData(`${rootUrl}/img/icon/telecom_5.png`);
  const image1 = await module.getCacheData(`${rootUrl}/img/icon/telecom_1.png`);
  
  // 设置组件背景
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    if (fm.fileExists(bgImage)) {
      const image = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(image);
    } else if (setting.solidColor) {
      widget.backgroundGradient = module.createGradient();
    } else {
      widget.backgroundColor = widgetColor;
    }
  };
  
  /**
   * Create Medium Widget
   * @param { string } string
   * @param { image } image
   */
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.setPadding(15, 15, 15, 15)
    const topStack = widget.addStack();
    topStack.layoutHorizontally();
    topStack.centerAlignContent();
    topStack.size = new Size(0, screenSize < 926 ? 25 : 28);
    
    const leftStack = topStack.addStack();
    leftStack.addSpacer();
    const logoImage = 
    leftStack.addImage(image);
    logoImage.tintColor = new Color('#2B83F1');
    logoImage.centerAlignImage();
    leftStack.addSpacer();
    topStack.addSpacer(50);
    
    const rightStack = topStack.addStack();
    rightStack.addSpacer();
    const balanceText = rightStack.addText(balanceAvailable);
    balanceText.textColor = new Color(balanceColor);
    balanceText.font = new Font('Georgia-Bold', screenSize < 926 ? 25 : 26);
    balanceText.url = payment;
    rightStack.addSpacer();
    widget.addSpacer(screenSize < 926 ? 3 : 5);
    
    /** 
     * Stacks and Bar
     * @param { string } string
     */
    const Content = widget.addStack();
    Content.setPadding(2, 2, 2, 2);
    Content.layoutHorizontally();
    
    const Stack1 = Content.addStack();
    Stack1.layoutVertically();
    Stack1.backgroundColor = stackBgColor;
    Stack1.size = new Size(0, barHeigth);
    Stack1.cornerRadius = 8;
    Stack1.addSpacer(12);
    
    const Stack1Head = Stack1.addStack();
    Stack1Head.addSpacer();
    const flowTitleText = Stack1Head.addText('剩余流量');
    flowTitleText.textColor = SubTextColor;
    flowTitleText.font = Font.mediumSystemFont(12);
    Stack1Head.addSpacer();
    Stack1.addSpacer(3);
    
    const flowStack = Stack1.addStack();
    flowStack.addSpacer();
    const flowText = flowStack.addText(flowBalFormat);
    flowText.textColor = MainTextColor
    flowText.font = Font.boldSystemFont(16);
    flowStack.addSpacer();
    
    const usedFlowStack = Stack1.addStack();
    usedFlowStack.addSpacer();
    if (day1st > '010000' && day1st < '010100') {
      usedFlowText = usedFlowStack.addText(`- ${(flowBalance - flowBalance).toFixed(2)}`);
    } else {
      usedFlowText = usedFlowStack.addText(`- ${(setting.flowBalance - flowBalance).toFixed(2)}`);
    }
    usedFlowText.textColor  = SubTextColor;
    usedFlowText.font = Font.boldSystemFont(13);
    usedFlowStack.addSpacer();
    Stack1.addSpacer(5);
    
    const Stack1Pct = Stack1.addStack();
    Stack1Pct.layoutHorizontally();
    Stack1Pct.centerAlignContent();
    Stack1Pct.addSpacer();
    
    const percentText1 = Stack1Pct.addText(flow);
    percentText1.textColor = MainTextColor
    percentText1.font = Font.boldSystemFont(28);
    const percentSymbol1 = Stack1Pct.addText(' %');
    percentSymbol1.textColor = SubTextColor
    percentSymbol1.font = Font.systemFont(26);
    Stack1Pct.addSpacer();
    Stack1.addSpacer();
    Content.addSpacer();
    
    // Progress bar 1
    const BarContent1 = Content.addStack();
    const progressBar1st = BarContent1.addImage(creatProgress(flow2nd, flow1st));
    progressBar1st.cornerRadius = 6
    progressBar1st.imageSize = new Size(barWidth, barHeigth);
    Content.addSpacer();
   
    // Progress bar 2
    const BarContent2 = Content.addStack();
    const progressBar2nd = BarContent2.addImage(creatProgress(voice1st, voice2nd));
    progressBar2nd.cornerRadius = 6
    progressBar2nd.imageSize = new Size(barWidth, barHeigth);
    Content.addSpacer();
    
    const Stack2 = Content.addStack();
    Stack2.layoutVertically();
    Stack2.backgroundColor = stackBgColor;
    Stack2.size = new Size(0, barHeigth);
    Stack2.cornerRadius = 8;
    Stack2.addSpacer(12);
    
    const Stack2Head = Stack2.addStack();
    Stack2Head.addSpacer();
    const voiceTitleText = Stack2Head.addText('剩余语音');
    voiceTitleText.textColor = SubTextColor
    voiceTitleText.font = Font.mediumSystemFont(12);
    Stack2Head.addSpacer();
    Stack2.addSpacer(3);
     
    const voiceStack = Stack2.addStack();
    voiceStack.addSpacer();
    const voiceText = voiceStack.addText(voiceBalance + ' Min');
    voiceText.textColor = MainTextColor
    voiceText.font = Font.boldSystemFont(16);
    voiceStack.addSpacer();
    
    const voiceUsedStack = Stack2.addStack();
    voiceUsedStack.addSpacer();
    if (day1st > '010000' && day1st < '010100') {
      voiceUsedText = voiceUsedStack.addText(`- ${voiceBalance - voiceBalance}`);
    } else {
      voiceUsedText = voiceUsedStack.addText(`- ${setting.voiceBalance - voiceBalance}`);
    }
    voiceUsedText.textColor  = SubTextColor
    voiceUsedText.font = Font.boldSystemFont(13);
    voiceUsedStack.addSpacer();
    Stack2.addSpacer(5);
    
    const Stack2Pct = Stack2.addStack();
    Stack2Pct.layoutHorizontally();
    Stack2Pct.centerAlignContent();
    Stack2Pct.addSpacer();
    
    const percentText2 = Stack2Pct.addText(voice);
    percentText2.textColor = MainTextColor;
    percentText2.font = Font.boldSystemFont(28);
    const percentSymbol2 = Stack2Pct.addText(' %');
    percentSymbol2.textColor = SubTextColor
    percentSymbol2.font = Font.systemFont(26);
    Stack2Pct.addSpacer();
    Stack2.addSpacer();
    
    return widget;
  };
    
  /**
   * Create Progress 
   * 中号组件柱状进度条
   */
  const creatProgress = (barValue1, barValue2) => {
    barValue1 = Math.round(barValue1);
    barValue2 = Math.round(barValue2);
    
    const context = new DrawContext()
    context.size = new Size(barWidth, barHeigth);
    context.opaque = false
    context.respectScreenScale = true
    
    const BarColor1 = getColor(barValue1);
    const BarColor2 = getColor(barValue2, true);
    
    // background
    const path = new Path();
    path.addRoundedRect(new Rect(0, 0, barWidth, barHeigth), 4, 4);
    context.addPath(path);
    context.setFillColor(barBgColor);
    context.fillPath();
    
    context.setFillColor(BarColor2);
    const path2 = new Path();
    const path2BarHeigth = (barHeigth * (barValue2 / StepFin) > barHeigth) ? barHeigth : barHeigth * (barValue2 / StepFin);
    path2.addRoundedRect(new Rect(0, barHeigth, barWidth, -path2BarHeigth), 2, 2);
    context.addPath(path2);
    context.fillPath();
    
    context.setFillColor(BarColor1);
    const path1 = new Path();
    const path1BarHeigth = (barHeigth * (barValue1 / StepFin) > barHeigth) ? barHeigth : barHeigth * (barValue1 / StepFin);
    path1.addRoundedRect(new Rect(0, barHeigth, barWidth, -path1BarHeigth), 2, 2);
    context.addPath(path1);
    context.fillPath();
    context.setFont(Font.boldSystemFont(barValue1 > 99 ? 6 : 8));
    context.setTextAlignedCenter();
    
    if (barValue1 < 90) {
      context.setTextColor(new Color("#666666"));
      context.drawTextInRect('%', new Rect(0, 3, barWidth, barHeigth));
    } else {
      context.setTextColor(new Color("#FFFFFF"));
      context.drawTextInRect('%', new Rect(0, barHeigth - 15, barWidth, barHeigth));
    };
    
    if (barValue1 <= 10) {
      PosCorr = -15
      context.setTextColor(  
        Color.black()
      );
    } else {
      PosCorr = 2
      context.setTextColor(
        Color.white()
      );
    };
    
    context.drawTextInRect(
      barValue1.toString(),
      new Rect(0, barHeigth - path1BarHeigth + PosCorr, barWidth, path1BarHeigth - PosCorr)
    );
    return context.getImage();
  };

  /**
   * Create Small Widget
   * @param { string } string
   * @param { image } image
   */
  const smallWidget = async () => {
    const widget = new ListWidget();
    widget.setPadding(6, 0, 0, 0);
    if (balanceAvailable < 0) {
      widget.url = payment;
    }

    const width = 128
    const height = 8
    const radius = height / 2
    
    if (setting.logoSwitch) {
      const logoImage = widget.addImage(image1);
      logoImage.centerAlignImage();
      logoImage.imageSize = new Size(screenSize < 926 ? 120 : 130, screenSize < 926 ? 37 : 40);
    } else {
      const logoImage = widget.addImage(image);
      logoImage.centerAlignImage();
      logoImage.imageSize = new Size(screenSize < 926 ? 110 : 115, screenSize < 926 ? 33 : 35);
      logoImage.tintColor = new Color('#2B83F1');
    }
    const balText = widget.addText(balanceAvailable);  
    balText.textColor = Color.orange();
    balText.font = new Font("Georgia-Bold", 22);
    balText.centerAlignText();
    widget.addSpacer(6);
    
    getWidget(voice2nd, voiceTotal, voiceBalance, `${voiceBalance} 分钟 - ${voice}%`, getColor(voice));
    getWidget(flow1st, totalFlow, balanceFlow, `${flowBalFormat} - ${flow}%`, getColor(flow));
    
    function getWidget(stock, total, haveGone, str, progressColor) {
      const title = widget.addText(str);
      title.centerAlignText();
      title.textColor = textColor;
      title.font = Font.mediumSystemFont(14);
      widget.addSpacer(3);
      
      const progress = creatProgress(stock, total, haveGone, progressColor);
      const drawImage = widget.addImage(progress);
      drawImage.centerAlignImage();
      drawImage.imageSize = new Size(width, height);
      widget.addSpacer(6);
    };
    
    function creatProgress(stock, total, haveGone, progressColor) {
      const ctx = new DrawContext();
      ctx.size = new Size(width, height);
      ctx.opaque = false;
      ctx.respectScreenScale = true;
      ctx.setFillColor(barColor);
      
      const path = new Path();
      path.addRoundedRect(new Rect(0, 0, width, height), radius, radius);
      ctx.addPath(path);
      ctx.fillPath();
      
      const stockColor = getColor(stock, true);
      const path2 = new Path();
      ctx.setFillColor(stockColor);
      if (total > 0 && stock) {  
        path2.addRoundedRect(new Rect(0, 0, width * stock / 100, height), radius, radius);  
      }
      ctx.addPath(path2);
      ctx.fillPath();
      
      const path1 = new Path();
      ctx.setFillColor(haveGone < 0.3 ? widgetColor : progressColor);
      if (total > 0) {
        path1.addRoundedRect(new Rect(0, 0, width * haveGone / total, height), radius, radius);  
      }
      ctx.addPath(path1);
      ctx.fillPath();
      return ctx.getImage();
    };
    return widget;
  };
  
  // 图片遮罩
  async function shadowImage(img) {
    let ctx = new DrawContext();
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']));
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']));
    return await ctx.getImage();
  };
  
  /*
   * Name: MyWidget
   * Author: John Smith
   * Date: 2022/11/11
   * Version: 1.1
   * Description: This is a widget that displays some information.
   */
  const runWidget = async () => {
    const widget = await (family === 'medium' ? createWidget() : smallWidget());
    await setBackground(widget);
    hourlyWrite(flowBalance, voiceBalance);
    
    if (config.runsInApp) {
      await widget[`present${family.charAt(0).toUpperCase() + family.slice(1)}`]();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
}
module.exports = { main }