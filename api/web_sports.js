// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: volleyball-ball;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事
 * 组件版本: Version 1.0.0
 * 发布时间: 2024-12-21
 */

async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_sports';
  const module = new _95du(pathName);
  const setting = module.settings;
  
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  let chooseSports = '西甲';
  const param = args.widgetParameter;
  if (param !== null) {
    chooseSports = param.replace(/[^\w\s\u4e00-\u9fa5]/g, '');
  } else {
    chooseSports = setting.selected;
  }
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = async (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
    console.log(JSON.stringify(
      setting, null, 2
    ));
  };
  
  // 获取赛况分析
  const getRaceSchedule = async (url) => {
    const request = new Request(url);
    request.timeoutInterval = 5;
    const html = await request.loadString();
  
    const webView = new WebView();
    await webView.loadHTML(html);
  
    const data = await webView.evaluateJavaScript(`
      (() => {
        const roundInfo = document.querySelector('.info-time span:first-child')?.innerText || '';
        const matchTime = document.querySelector('.info-time span:last-child')?.innerText || '';
  
        const team1Name = document.querySelector('.header-team-name .team-name')?.innerText || '';
        const team1Img = (document.querySelector('.header-team-logo')?.style.backgroundImage.match(/https.+(?=\\))/)?.[0] || '').replace(/"$/, '');
  
        const team2Name = document.querySelector('.header-team.team-right .team-name')?.innerText || '';
        const team2Img = (document.querySelector('.header-team.team-right .header-team-logo-wrap .header-team-logo')?.style.backgroundImage.match(/https.+(?=\\))/)?.[0] || '').replace(/"$/, '');
        
        const vsLogo = document.querySelector('.info-vs-img-box img') ? document.querySelector('.info-vs-img-box img').src : null;
  
        // 获取赛前预测的百分比
        const preMatchPredictions = [...document.querySelectorAll('.analysis-result-compare .compare-team p')];
        const team1Prediction = preMatchPredictions[0]?.innerText.trim() || '0%';
        const team2Prediction = preMatchPredictions[2]?.innerText.trim() || '0%';
        
        // 赔率数据提取
        const oddsDescription = document.querySelector('.analysis-result-history')?.innerText.trim() || '';
        const oddsCount = document.querySelector('.analysis-result-history span.c-gap-left-small')?.innerText.trim() || '';
        const rates = [...document.querySelectorAll('.analysis-result-history + .wa-livedetail-progressbar .progressbar-rate span')];
        const homeWin = rates[0]?.innerText.replace('%', '').trim() || '0';
       
        let draw = '0';
        let awayWin = '0';
        if (rates.length === 2) {
          awayWin = rates[1]?.innerText.replace('%', '').trim() || '0';
        } else if (rates.length === 3) {
          draw = rates[1]?.innerText.replace('%', '').replace('平局', '').trim() || '0';
          awayWin = rates[2]?.innerText.replace('%', '').trim() || '0';
        };
  
        return {
          roundInfo,
          matchTime,
          vsLogo,
          team1: {
            name: team1Name,
            img: team1Img,
            prediction: team1Prediction
          },
          team2: {
            name: team2Name,
            img: team2Img,
            prediction: team2Prediction
          },
          odds: {
            count: oddsCount,
            total: 100,
            homeWin,
            draw,
            awayWin,
            description: oddsDescription
          }
        };
      })();
    `);
    return data;
  };
  
  const getRaceScheduleList = async (url) => {
    const request = new Request(url);
    request.timeoutInterval = 5;
    const html = await request.loadString();
  
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
  
        // 获取所有包含比赛信息的元素
        const matchElements = document.querySelectorAll('.c-pull-refresh-content .wa-match-schedule-list-wrapper');
        
        matchElements.forEach(wrapper => {
          const date = wrapper.querySelector('.wa-match-schedule-list-title .date')?.textContent.trim();
          const listNum = wrapper.querySelector('.wa-match-schedule-list-title .list-num')?.textContent.trim();
          
          const matchItems = wrapper.querySelectorAll('.wa-match-schedule-list-item');
          const matches = [];
  
          matchItems.forEach(item => {
            const time = item.querySelector('.vs-info-date-content p:first-of-type')?.textContent.trim();
            const round = item.querySelector('.vs-info-date-content p:nth-of-type(2)')?.textContent.trim();
            const analyseUrl = 'https:' + item.querySelector('a')?.getAttribute('href').replace(/&amp;/g, '&').replace(/赛况/, '分析');
            // 使用正则提取 matchId
            const matchId = analyseUrl.match(/\\/detail\\/(.*?)\\/tab/)?.[1] || null;
            const indexApi = 'https://tiyu.baidu.com/go/api/matchDetail/odds?matchId=' + matchId;
  
            // 提取比赛状态
            const statusText = item.querySelector('.status-text')?.textContent.trim() || '已结束';
  
            // 提取队伍信息和图片
            const team1Name = item.querySelectorAll('.team-row-name')[0]?.textContent.trim();
            const team1Score = item.querySelectorAll('.team-row-score')[0]?.textContent.trim();
            const team1Img = item.querySelectorAll('.team-row-logo img')[0]?.src.replace(/&amp;/g, '&');
  
            const team2Name = item.querySelectorAll('.team-row-name')[1]?.textContent.trim();
            const team2Score = item.querySelectorAll('.team-row-score')[1]?.textContent.trim();
            const team2Img = item.querySelectorAll('.team-row-logo img')[1]?.src.replace(/&amp;/g, '&');
  
            if (time && round && team1Name && team2Name) {
              matches.push({
                time,
                round,
                analyseUrl,
                indexApi,
                matchId,
                statusText,
                team1Name,
                team1Score,
                team1Img,
                team2Name,
                team2Score,
                team2Img
              });
            }
          });
  
          if (matches.length > 0) {
            matchData.push({
              date,
              listNum,
              matches
            });
          }
        });
  
        return {
          league: leagueInfo,
          items: matchData
        };
      })();
    `);
    return data;
  };
  
  // 计算剩余多少小时
  const getHourDifference = (dateStr) => {
    const currentYear = new Date().getFullYear();
    const targetDate = dateStr.match(/^\d{4}-/)
      ? new Date(`${dateStr.replace(' ', 'T')}:00`)
      : new Date(`${currentYear}-${dateStr.replace(' ', 'T')}:00`);
    if (isNaN(targetDate.getTime())) {
      return null;
    }
    const now = new Date();
    const diffMilliseconds = targetDate - now; // 计算时间差（毫秒）
    const diffHours = diffMilliseconds / (1000 * 60 * 60);
    return diffHours.toFixed(2);
  };
  
  const extractDate = (data) => {
    const date = data.items[1].date;
    const time = data.items[1].matches[0].time;
    const match = date.match(/^\d{2,4}-\d{2}-\d{2}|^\d{2}-\d{2}/);
    return getHourDifference(`${match[0]} ${time}`) || null;
  };
  
  // ====== 设置组件背景 ====== //
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    const Appearance = Device.isUsingDarkAppearance();
    if (fm.fileExists(bgImage) && !Appearance) {
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
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
  };
  
  const addLeagueStack = async (widget, data) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    const leagueImg = await module.getCacheData(data.league.logo, 240, `${data.league.name}.png`);
    const iconImage = leagueStack.addImage(leagueImg)
    iconImage.imageSize = new Size(23, 23);
    if (data.league.name.includes('法国')) {
      iconImage.tintColor = textColor;
    };
    leagueStack.addSpacer(12);
    
    createText(leagueStack, data.league.name, 16, true);
    leagueStack.addSpacer();
    createText(leagueStack, data.league.season, 16, true);
    widget.addSpacer();
  }
  
  let hasDisplayedDate = false;
  const addDateColumn = (widget, item, data) => {
    if (!hasDisplayedDate) {
      if (
        item.date.includes('今天') || 
        item.date.includes('明天') || 
        !data.items.some(i => i.date.includes('明天'))
      ) {
        const dateStack = widget.addStack();
        dateStack.layoutHorizontally();
        dateStack.centerAlignContent();
        dateStack.backgroundColor = item.date.includes('今天') 
        ? new Color('#CCC400', 0.15) 
        : item.date.includes('明天') 
        ? new Color('#8C7CFF', 0.15) 
        : new Color('#999999', 0.2);
        dateStack.cornerRadius = 2;
        dateStack.setPadding(1, 0, 1, 0);
  
        createText(dateStack, item.date.replace(/\//, '    '), 13, null, 0.7);
        dateStack.addSpacer();
        createText(dateStack, item.listNum, 13, null, 0.7);
        hasDisplayedDate = true;
        widget.addSpacer(5);
      }
    }
  };
  
  const createTextStack = (stack, text, width) => {
    const rowStack = stack.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, 20);
    const rowText = rowStack.addText(text);
    rowText.font = Font.mediumSystemFont(13);
    rowText.textColor = textColor;
    if (width) rowStack.addSpacer();
    return rowText;
  };
  
  const createText = (stack, text, textSize, font, opacity) => {
    const rowText = stack.addText(text);
    rowText.textColor = textColor;
    rowText.font = Font[font 
      ? 'mediumSystemFont' 
      : 'systemFont'](textSize);
    if (opacity) {
      rowText.textOpacity = opacity;
    }
  };
  
  // 创建组件
  const createWidget = async () => {
    const url = `https://tiyu.baidu.com/match/${chooseSports}/tab/赛程`;
    const data = await getRaceScheduleList(url);
    const diff = extractDate(data);
    const maxMatches = 4
    let count = 0;
    
    const widget = new ListWidget();
    widget.url = url;
    widget.setPadding(15, 17, 15, 17);
    await addLeagueStack(widget, data);
    
    for (const item of data.items) {
      // 如果已获取足够的比赛，跳出循环
      if (count >= maxMatches) break;
      addDateColumn(widget, item, data)
      if (item.matches.length === 0) {
        continue;
      }
    
      for (const match of item.matches) { // 如果已获取足够的比赛，跳出外层循环
        if (count >= maxMatches) break;
        count++;
    
        const stack = widget.addStack();
        stack.layoutHorizontally();
        stack.centerAlignContent();
        widget.addSpacer(3);
        // 比赛时间
        const timeText = createTextStack(stack, match.time, 46);
        // 主队图标
        const homeImg = await module.getCacheData(match.team1Img, 240, `${match.team1Name}.png`);
        stack.addImage(homeImg).imageSize = new Size(20, 20);
        stack.addSpacer(8);
        // 主队名称
        const team1Stack = stack.addStack();
        team1Stack.centerAlignContent()
        team1Stack.size = new Size(100, 20);
        const team1NameText = createTextStack(team1Stack, match.team1Name)
        team1Stack.addSpacer();
        // 比分
        const scoreText = createTextStack(stack, `${match.team1Score} - ${match.team2Score}`);
        stack.addSpacer();
        // 客队名称
        const team2NameText = createTextStack(stack, match.team2Name);
        stack.addSpacer(6);
        // 客队图标
        const awayImg = await module.getCacheData(match.team2Img, 240, `${match.team2Name}.png`);
        stack.addImage(awayImg).imageSize = new Size(20, 20);
        // 设置已结束颜色
        if (match.team1Score && match.statusText === '已结束') {
          timeText.textOpacity = 0.6;
          team1NameText.textOpacity = 0.6;
          scoreText.textOpacity = 0.6;
          team2NameText.textOpacity = 0.6;
        }
      }
    };
    return { widget, data, diff };
  };
  
  // 三段进度条
  const createThreeStageBar = (total, homeWin, draw, awayWin) => {
    const width = 200;
    const height = 4;
    const radius = height / 2;
  
    const ctx = new DrawContext();
    ctx.size = new Size(width, height + 13);
    ctx.opaque = false;
    ctx.respectScreenScale = true;
  
    // 初始间隔宽度
    let interval = 2.5
    let intervals = 2 * interval;
  
    // 初步计算每个阶段的宽度
    const stages = [homeWin, draw, awayWin];
    let widths = stages.map(value => (value > 0 ? (width - intervals) * value / total : 0));
  
    // 检查是否存在某个阶段的值为 0
    const zeroIndex = stages.findIndex(value => value === 0);
    if (zeroIndex !== -1) {
      intervals -= interval;
      const nonZeroIndexes = [0, 1, 2].filter(i => i !== zeroIndex);
      const minIndex = nonZeroIndexes.reduce((a, b) => (widths[a] < widths[b] ? a : b));
      widths[minIndex] += interval;
    }
  
    // 修正误差，确保总宽度精确等于目标宽度
    const totalWidth = widths.reduce((sum, w) => sum + w, 0) + intervals;
    const error = width - totalWidth;
    if (error !== 0) {
      const maxIndex = widths.indexOf(Math.max(...widths));
      widths[maxIndex] += error;
    }
  
    const [homeWinWidth, drawWidth, awayWinWidth] = widths;
  
    // 绘制主场获胜阶段（红色）
    const homeWinPath = new Path();
    homeWinPath.addRoundedRect(new Rect(0, 0, homeWinWidth, height), radius, radius);
    ctx.addPath(homeWinPath);
    ctx.setFillColor(Color.red());
    ctx.fillPath();
  
    // 绘制平局阶段（橙色）
    const drawPath = new Path();
    drawPath.addRoundedRect(
      new Rect(homeWinWidth + interval, 0, drawWidth, height), radius, radius);
    ctx.addPath(drawPath);
    ctx.setFillColor(Color.orange());
    ctx.fillPath();
  
    // 绘制客场获胜阶段（蓝色）
    const awayWinPath = new Path();
    awayWinPath.addRoundedRect(
      new Rect(homeWinWidth + drawWidth + interval * 2, 0, awayWinWidth, height), radius, radius);
    ctx.addPath(awayWinPath);
    ctx.setFillColor(Color.blue());
    ctx.fillPath();
  
    const margin = 10;
    const textSize = 8.5;
    const font = Font.systemFont(textSize);
  
    // 绘制左侧文字
    const homeWinText = `${homeWin}%`;
    ctx.setFont(font);
    ctx.setTextColor(Color.red());
    const homeWinTextWidth = homeWinText.length * textSize * 0.65;
    ctx.drawText(homeWinText, new Point(0, height + 2));
  
    // 绘制右侧文字（靠右对齐）
    const awayWinText = `${awayWin}%`;
    const awayWinTextWidth = awayWinText.length * textSize * 0.69;
    ctx.setFont(font);
    ctx.setTextColor(Color.blue());
    ctx.drawText(awayWinText, new Point(width - awayWinTextWidth, height + 2));
  
    // 绘制中间文字，确保居中显示在平局阶段
    if (drawWidth > 0) {
      const drawText = `${draw}%平局`;
      const drawTextWidth = drawText.length * textSize * 0.85;
      const drawCenterX = homeWinWidth + interval + drawWidth / 2;
      const drawX = drawCenterX - drawTextWidth / 2;
      // 防止中间文字和左右文字重叠
      const leftLimit = homeWinTextWidth + margin;
      const rightLimit = width - awayWinTextWidth - drawTextWidth - margin;
      const adjustedDrawX = Math.max(drawX, leftLimit);
      const finalDrawX = Math.min(adjustedDrawX, width - awayWinTextWidth - drawTextWidth - margin);
    
      ctx.setFont(font);
      ctx.setTextColor(Color.orange());
      ctx.drawText(drawText, new Point(finalDrawX, height + 2));
    };
    return ctx.getImage();
  };
  
  const createStack = async (mainStack, logoUrl, imgSize, teamName, size) => {
    const indexStack = mainStack.addStack();
    indexStack.layoutVertically();
    if (size) indexStack.size = new Size(size, size);
    
    const logoStack = indexStack.addStack();
    logoStack.layoutHorizontally();
    logoStack.addSpacer();
    const logo = await module.getCacheData(logoUrl, 240, `${teamName}.png`);
    const logoImage = logoStack.addImage(logo);
    logoImage.imageSize = new Size(imgSize, imgSize);
    if (!teamName) logoImage.tintColor = Color.dynamic(Color.red(), Color.white());
    logoStack.addSpacer();
    indexStack.addSpacer(5);
    
    if (teamName) {
      const titleStack = indexStack.addStack();
      titleStack.addSpacer();
      const titleText = titleStack.addText(teamName);
      titleText.font = Font.boldSystemFont(14);
      titleText.textColor = textColor;
      titleStack.addSpacer();
    }
  };
  
  const createHeading = async (infoStack, raceData, data) => {
    infoStack.layoutHorizontally();
    infoStack.setPadding(0, 25, 0, 0);
    infoStack.addSpacer();
    const infoText = infoStack.addText(`${raceData.roundInfo}  ${raceData.matchTime}`);
    infoText.font = Font.systemFont(15);
    infoText.textColor = textColor; 
    infoStack.addSpacer();
    
    const logoStack = infoStack.addStack();
    const logo = await module.getCacheData(data.league.logo, 240, `${data.league.name}.png`);
    logoStack.size = new Size(25, 25);
    logoStack.backgroundImage = logo;
  };
  
  // 创建组件
  const createLiveWidget = async (data, status) => {
    const leagueLogo = data.league.logo
    const json = data?.items[status === '进行中' ? 0 : 1]?.matches[0] || {};
    const raceScheduleData = await getRaceSchedule(json.analyseUrl);
    const { total, homeWin, draw, awayWin } = raceScheduleData.odds;
    const {
      team1: { name: team1Name, img: team1Img },
      team2: { name: team2Name, img: team2Img }
    } = raceScheduleData;
    
    const scoreLength = json.team1Score.length >= 2 && json.team2Score.length >= 2;
    
    // 
    const widget = new ListWidget();
    widget.url = json.analyseUrl;
    widget.setPadding(15, 20, 5, 20);
    const infoStack = widget.addStack();
    await createHeading(infoStack, raceScheduleData, data);
    widget.addSpacer(3);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    await createStack(mainStack, team1Img, 55, team1Name);
    mainStack.addSpacer();
    if (raceScheduleData.vsLogo) {
      await createStack(mainStack, raceScheduleData.vsLogo, 42, null, 65);
    } else {
      const mediumStack = mainStack.addStack();
      if (scoreLength) mediumStack.size = new Size(148, 0);
      mediumStack.layoutVertically();
      mediumStack.addSpacer(10);
      
      const scoreStack = mediumStack.addStack();
      scoreStack.layoutHorizontally();
      scoreStack.addSpacer();
      const scoreText = scoreStack.addText(`${json.team1Score} - ${json.team2Score}`);
      scoreText.textOpacity = 0.9;
      scoreText.font = Font.mediumSystemFont(scoreLength ? 30 : 35);
      scoreText.textColor = textColor;
      scoreStack.addSpacer();
      mediumStack.addSpacer(6);
      
      const statusStack = mediumStack.addStack();
      statusStack.layoutHorizontally();
      statusStack.addSpacer();
      const statusText = statusStack.addText(status || '');
      statusText.textOpacity = 0.8;
      statusText.font = Font.mediumSystemFont(14);
      statusText.textColor = status === '已结束' ? new Color(textColor.hex, 0.65) : Color.red();
      statusStack.addSpacer();
    }
    
    mainStack.addSpacer();
    await createStack(mainStack, team2Img, 55, team2Name);
    widget.addSpacer();
    
    let progressChart = createThreeStageBar(total, homeWin, draw, awayWin);
    if (!homeWin && !awayWin) {
      progressChart = createThreeStageBar(total, homeWin || 40, draw || 20, awayWin || 40);
    }
    const imageStack = widget.addStack();
    imageStack.size = new Size(0, 35);
    imageStack.addImage(progressChart);
  
    return widget;
  };
  
  // 
  const runWidget = async () => {
    let { widget = null, diff = 1, data = {} } = await createWidget();
    console.log(diff)
    const status = data?.items[0]?.matches[0].statusText;
    if (diff <= 1 || status === '进行中' || status !== '已结束') {
      widget = await createLiveWidget(data, status);
    }
    
    if (setting.alwaysDark) {
      widget.backgroundColor =  Color.black();
    } else {
      await setBackground(widget);
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