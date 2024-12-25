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
      if (family === 'medium') {
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
    const data = {"matchData":[{"teamRank":"1","teamFill":"欧冠正赛","round":"17","points":"40","goalStats":"42/19","winDrawLoss":"13/1/3","teamLogo":"https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=4198264962,2837429591&fm=58&app=10&f=PNG?w=300&h=300&s=2331CA228A910DF70F3235D90300D098","teamName":"亚特兰大"},{"teamRank":"2","teamFill":null,"round":"17","points":"38","goalStats":"26/12","winDrawLoss":"12/2/3","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=4028732067,2321777482&fm=58&app=10&f=PNG?w=180&h=180&s=23B1692038B35BA907FDDCC60300C0B5","teamName":"那不勒斯"},{"teamRank":"3","teamFill":null,"round":"16","points":"37","goalStats":"42/15","winDrawLoss":"11/4/1","teamLogo":"https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=1257166060,688465512&fm=58&app=10&f=PNG?w=300&h=300&s=42B1A962FCBAAFB55697C2D30300109D","teamName":"国际米兰"},{"teamRank":"4","teamFill":null,"round":"17","points":"34","goalStats":"32/24","winDrawLoss":"11/1/5","teamLogo":"https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=809496219,2071404746&fm=58&app=10&f=PNG?w=300&h=300&s=63F1A366E5A225AF4124D132030010D3","teamName":"拉齐奥"},{"teamRank":"5","teamFill":"欧联正赛","round":"16","points":"31","goalStats":"29/13","winDrawLoss":"9/4/3","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=1875468495,1106454263&fm=58&app=10&f=PNG?w=400&h=400&s=4A603A62CA9605E513AC66FB03005095","teamName":"佛罗伦萨"},{"teamRank":"6","teamFill":"欧协联附加赛","round":"17","points":"31","goalStats":"28/13","winDrawLoss":"7/10/0","teamLogo":"https://search-operate.cdn.bcebos.com/0f91267638237eb2b53106ea55fac330.png","teamName":"尤文图斯"},{"teamRank":"7","teamFill":null,"round":"16","points":"28","goalStats":"23/18","winDrawLoss":"7/7/2","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=1904847546,582219999&fm=58&app=10&f=PNG?w=181&h=278&s=2B22D10482CB0AF18635E6B803008085","teamName":"博洛尼亚"},{"teamRank":"8","teamFill":null,"round":"16","points":"26","goalStats":"25/16","winDrawLoss":"7/5/4","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=4246402492,1061669681&fm=58&app=10&f=PNG?w=300&h=300&s=41F58A62D8D80DFD8A14F6BC03001015","teamName":"AC米兰"},{"teamRank":"9","teamFill":null,"round":"17","points":"23","goalStats":"21/26","winDrawLoss":"7/2/8","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=663554538,1519112867&fm=58&app=10&f=PNG?w=180&h=180&s=C1701AC613E490FC1A45B1060300F0C5","teamName":"乌迪内斯"},{"teamRank":"10","teamFill":null,"round":"17","points":"19","goalStats":"23/23","winDrawLoss":"5/4/8","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=2035640999,335687799&fm=58&app=10&f=PNG?w=439&h=569&s=4DF58346D81219ED7C27C5A40300C01B","teamName":"罗马"},{"teamRank":"11","teamFill":null,"round":"17","points":"19","goalStats":"16/19","winDrawLoss":"4/7/6","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=980625370,1458527376&fm=58&app=10&f=PNG?w=400&h=400&s=EB71A246C0840CFF012A31800300F098","teamName":"恩波利"},{"teamRank":"12","teamFill":null,"round":"17","points":"19","goalStats":"17/22","winDrawLoss":"5/4/8","teamLogo":"https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=2677249372,459083076&fm=58&app=10&f=PNG?w=300&h=300&s=89E6C6062EF009BD0517FBBA03001019","teamName":"都灵"},{"teamRank":"13","teamFill":null,"round":"17","points":"16","goalStats":"14/26","winDrawLoss":"3/7/7","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=1968260215,1421482513&fm=58&app=10&f=PNG?w=277&h=294&s=2BA7CA0605643CBE5FA299200300A019","teamName":"热那亚"},{"teamRank":"14","teamFill":null,"round":"17","points":"16","goalStats":"11/29","winDrawLoss":"4/4/9","teamLogo":"https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=3858266653,651894083&fm=58&app=10&f=PNG?w=300&h=300&s=68C1AB460EA494DC175039990300D09A","teamName":"莱切"},{"teamRank":"15","teamFill":null,"round":"17","points":"15","goalStats":"23/33","winDrawLoss":"3/6/8","teamLogo":"https://ss0.baidu.com/6ONWsjip0QIZ8tyhnq/it/u=2163929094,1885154763&fm=58&app=10&f=PNG?w=400&h=400&s=3A34E50282BD1BB9081D146E0300E060","teamName":"帕尔马"},{"teamRank":"16","teamFill":null,"round":"17","points":"15","goalStats":"18/30","winDrawLoss":"3/6/8","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=1118375208,2546143191&fm=58&app=10&f=PNG?w=200&h=207&s=2A91E10068B40DBF4CB3B54603001099","teamName":"科莫"},{"teamRank":"17","teamFill":null,"round":"17","points":"15","goalStats":"21/40","winDrawLoss":"5/0/12","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=3528031221,549432563&fm=58&app=10&f=PNG?w=100&h=100&s=61FDAF66ACF20DB57B33CF2D0200F05D","teamName":"维罗纳"},{"teamRank":"18","teamFill":"降级","round":"17","points":"14","goalStats":"16/28","winDrawLoss":"3/5/9","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=2171375401,1979680359&fm=58&app=10&f=PNG?w=300&h=368&s=8284D1025EB009B15A2CB7E40300B015","teamName":"卡利亚里"},{"teamRank":"19","teamFill":null,"round":"17","points":"13","goalStats":"17/30","winDrawLoss":"3/4/10","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=1892377915,2359382140&fm=58&app=10&f=PNG?w=220&h=239&s=27908A6E6F5201DC5F78F1330300E051","teamName":"威尼斯"},{"teamRank":"20","teamFill":null,"round":"17","points":"10","goalStats":"15/23","winDrawLoss":"1/7/9","teamLogo":"https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=1833678222,3489463810&fm=58&app=10&f=PNG?w=139&h=181&s=2936EA1646981DF94E37F6B80300701F","teamName":"蒙扎"}],"leagueInfo":{"name":"意大利甲级联赛","season":"2024-2025","logo":"https://search-operate.cdn.bcebos.com/88bab6558d2c5e63092efdecc8da55f0.png"}}
    console.log(data)
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