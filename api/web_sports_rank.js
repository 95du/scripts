// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: trophy;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事排名
 * 组件版本: Version 1.0.0
 * 发布时间: 2024-12-21
 */

async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_sports_rank';
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
  if (param) {
    const trimmedParam = param.trim();
    const validParam = setting.values.some(item => item.value === trimmedParam) || ['nba', 'cba'].includes(trimmedParam);
    chooseSports = validParam ? trimmedParam : chooseSports;
  }
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  
  // 获取排名
  const getMatchRankings = async (url, leagueName) => {
    const html = await module.getCacheData(url, 4, `${leagueName}.html`);
    const webView = new WebView();
    await webView.loadHTML(html);
  
    const data = await webView.evaluateJavaScript(`
      (() => {
        const leagueInfo = {};
        const matchData = [];
  
        // 提取联赛名称、赛季信息和Logo
        const header = document.querySelector('.wa-match-header');
        leagueInfo.name = header.querySelector('.wa-match-header-name')?.textContent.trim();
        leagueInfo.season = header.querySelector('.wa-match-header-rank')?.textContent.trim();
        leagueInfo.logo = header.querySelector('.logo-img img')?.src.replace(/&amp;/g, '&');
  
        // 获取所有的队伍列表
        const teamElements = document.querySelectorAll('.team-list-item');
  
        teamElements.forEach(team => {
          const teamFill = team.querySelector('.team-fill')?.textContent.trim() || null;
          const teamRank = team.querySelector('.team-rank')?.textContent.trim();
          const teamLogo = team.querySelector('.team-logo')?.style.backgroundImage
            .match(/https.+/)?.[0].replace(/["\\)]+$/, '') || '';
          const teamName = team.querySelector('.team-name')?.textContent.trim();
          const round = team.querySelectorAll('.rank-list-item')[0]?.textContent.trim();
          const winDrawLoss = team.querySelectorAll('.rank-list-item')[1]?.textContent.trim();
          const goalStats = team.querySelectorAll('.rank-list-item')[2]?.textContent.trim();
          const points = team.querySelectorAll('.rank-list-item')[3]?.textContent.trim();
  
          matchData.push({
            teamFill,
            teamRank,
            teamLogo,
            teamName,
            round,
            winDrawLoss,
            goalStats,
            points
          });
        });
  
        return {
          leagueInfo,
          matchData
        };
      })();
    `);
  
    return data;
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
      let backgroundImage = '';
      if (family === 'small') {
        backgroundImage = await module.getCacheData(`${rootUrl}/img/background/glass_0.png`);
      } else {
        const random = Math.ceil(Math.random() * 6);
        backgroundImage = await module.getCacheData(`${rootUrl}/img/background/football-player_${random}.png`);
      }
      widget.backgroundImage = backgroundImage;
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
  };
  
  const addText = (stack, text) => {
    const columnText = stack.addText(text);
    columnText.font = Font.mediumSystemFont(13);
    columnText.textColor = textColor;
  };
  
  const createWidget = async () => {
    const url = `https://tiyu.baidu.com/match/${encodeURIComponent(chooseSports)}/tab/${encodeURIComponent('排名')}`;
    const data = await getMatchRankings(url, chooseSports);
    const stackSize = (chooseSports.includes('nba') || chooseSports.includes('cba')) ? 150 : 200;
    
    const widget = new ListWidget();
    widget.setPadding(15, 18, 15, 18);
    widget.url = url;
    
    const maxCol = family === 'medium' ? 6 : 15;
    for (let i = 0; i < maxCol; i++) {
      const team = data.matchData[i];
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
      
      // 队标
      const teamLogoUrl = team.teamLogo || ''; // 修复潜在错误
      if (teamLogoUrl) {
        const teamLogo = await module.getCacheData(teamLogoUrl, 240, `${team.teamName}.png`);
        const logoImg = teamStack.addImage(teamLogo);
        logoImg.imageSize = new Size(20, 20);
      }
      teamStack.addSpacer(12);
      
      const teamInfoStack = teamStack.addStack();
      teamInfoStack.centerAlignContent();
      teamInfoStack.size = new Size(stackSize, 0);
      addText(teamInfoStack, team.teamName);
      teamInfoStack.addSpacer(8);
      if (team.teamFill) {
        const barStack = teamInfoStack.addStack();
        barStack.layoutHorizontally();
        barStack.setPadding(0.5, 5, 0.5, 5)
        barStack.cornerRadius = 5
        barStack.backgroundColor = Color.blue();
        const fillText = barStack.addText(team.teamFill);
        fillText.font = Font.boldSystemFont(11);
        fillText.textColor = Color.white()
      }
      
      teamInfoStack.addSpacer();
      
      const roundStack = teamStack.addStack();
      addText(roundStack, team.round);
      roundStack.addSpacer();
      addText(teamStack, team.points || team.goalStats);
          
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
    await setBackground(widget);
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