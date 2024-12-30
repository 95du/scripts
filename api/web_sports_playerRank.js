// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: trophy;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事排名
 * 组件版本: Version 1.0.0
 * 发布时间: 2024-12-28
 */


async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_sports_playerRank';
  const module = new _95du(pathName);
  const setting = module.settings;
  
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  let chooseSports = setting.selected;
  const param = args.widgetParameter;
  if (param != null) {
    const trimmedParam = param.trim();
    const validParam = setting.values.some(item => item.value === trimmedParam) || ['NBA', 'cba'].includes(trimmedParam);
    setting.type = null;
    chooseSports = validParam ? trimmedParam : chooseSports;
  }
  
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    iconSize: isSmall ? 18 : 20,
    imgSize: isSmall ? 21 : 23,
    titleSize: isSmall ? 15 : 16,
    textSize: isSmall ? 12 : 13,
  };
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  
  // 获取排名
  const getMatchRankings = async (chooseSports = '西甲') => {
    try {
      const url = `https://tiyu.baidu.com/al/match?match=${encodeURIComponent(chooseSports)}&tab=${encodeURIComponent('球员榜')}&current=0&&async_source=h5&tab_type=single&from=baidu_shoubai_na&request__node__params=1&getAll=1`;
      const { tplData } = await module.getCacheData(url, 6, `${chooseSports}.json`);
      const { tabsList, header } = tplData.data;
      const rankList = tabsList[0].data[0].data;
      return { rankList, header }
    } catch (error) {
      console.error(error.message);
      return [];
    }
  };
    
  // ====== 设置组件背景 ====== //
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    if (fm.fileExists(bgImage)) {
      const shadowImg = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(shadowImg);
    } else if (setting.gradient.length > 0 && !setting.bwTheme) {
      const gradient = new LinearGradient();
      const color = setting.gradient.length > 0 
        ? setting.gradient 
        : [setting.rangeColor];
      const randomColor = module.getRandomItem(color);
      // 渐变角度
      const angle = setting.angle;
      const radianAngle = ((360 - angle) % 360) * (Math.PI / 180);
      const x = 0.5 + 0.5 * Math.cos(radianAngle);
      const y = 0.5 + 0.5 * Math.sin(radianAngle);
      gradient.startPoint = new Point(1 - x, y);
      gradient.endPoint = new Point(x, 1 - y);
      
      gradient.locations = [0, 1];
      gradient.colors = [
        new Color(randomColor, setting.transparency),
        new Color('#00000000')
      ];
      widget.backgroundGradient = gradient;
    } else {
      if (family === 'medium') {
        //const random = Math.floor(Math.random() * 4);
        const random = module.getRandomItem([0, 3]);
        const backgroundImage = await module.getCacheData(`${rootUrl}/img/background/player_${random}.png`);
        widget.backgroundImage = backgroundImage;
      } else if (setting.largeBg) {
        const random = Math.ceil(Math.random() * 6);
        const backgroundImage = await module.getCacheData(`${rootUrl}/img/background/football-player_${random}.png`);
        widget.backgroundImage = backgroundImage;
      }
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
  };
  
  const createText = (stack, text, textSize, textOpacity) => {
    const columnText = stack.addText(text);
    columnText.font = Font.mediumSystemFont(textSize || lay.textSize);
    columnText.textColor = textColor;
    if (textOpacity) columnText.textOpacity = textOpacity;
  };
  
  const addLeagueStack = async (widget, header) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    const leagueImg = await module.getCacheData(header.logoimg, 240, `${header.name}.png`);
    const icon = leagueStack.addImage(leagueImg)
    icon.imageSize = new Size(lay.imgSize, lay.imgSize);
    if (header.name.includes('法国')) {
      icon.tintColor = textColor;
    };
    leagueStack.addSpacer(12);
    createText(leagueStack, header.name, lay.titleSize);
    leagueStack.addSpacer();
    createText(leagueStack, header.info.replace('赛季', ''), lay.titleSize);
    widget.addSpacer();
  };
  
  const createWidget = async () => {
    const { header, rankList } = await getMatchRankings(chooseSports);
    const maxCol = family === 'medium' ? 6 : rankList.length >= setting.lines ? setting.lines : rankList.length;
    
    const widget = new ListWidget();
    widget.setPadding(15, 18, 15, 18);
    await setBackground(widget);
    if (family === 'large') await addLeagueStack(widget, header);
    
    for (let i = 0; i < maxCol; i++) {
      const team = rankList[i];
      
      const teamStack = widget.addStack();
      teamStack.layoutHorizontally();
      teamStack.centerAlignContent();
      const indexStack = teamStack.addStack();
      indexStack.size = new Size(20, 0);
      const indexText = indexStack.addText(`${i + 1}`);
      indexText.font = Font.boldSystemFont(15);
      const textColor = i <= 2 
        ? '#FF0000' : i <= 3
        ? '#FCA100' : '#00C400';
      indexText.textColor = new Color(textColor);
      teamStack.addSpacer(8);
      // 球㖥头像
      const teamLogo = await module.getCacheData(team.logo, 240, `${team.playerName}.png`);
      const logoImg = teamStack.addImage(teamLogo).imageSize = new Size(lay.iconSize, lay.iconSize);
      teamStack.addSpacer(8);
      const infoStack = teamStack.addStack();
      infoStack.centerAlignContent();
      infoStack.size = new Size(160, 0);
      createText(infoStack, team.playerName);
      infoStack.addSpacer();
      createText(teamStack, team.teamName, null, 0.6); //position前锋
      teamStack.addSpacer();
      createText(teamStack, team.score);
      if (i !== maxCol - 1) {
        widget.addSpacer(3);
      }
    };
    return widget;
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中大尺寸');
    text.font = Font.systemFont(16);
    text.centerAlignText();
    return widget;
  };
  
  // 渲染组件
  const runWidget = async () => {
    const widget = family === 'small' ? createErrorWidget() : await createWidget();
    if (setting.alwaysDark) {
      widget.backgroundColor =  Color.black();
    }
    
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