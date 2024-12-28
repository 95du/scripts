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
  
  let chooseSports = setting.selected;
  const param = args.widgetParameter;
  if (param) {
    const trimmedParam = param.trim();
    const validParam = setting.values.some(item => item.value === trimmedParam) || ['NBA', 'cba'].includes(trimmedParam);
    chooseSports = validParam ? trimmedParam : chooseSports;
  };
  
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    iconSize: isSmall ? 50 : 53,
    vsLogoSize: isSmall ? 40 : 43,
    titleSize: isSmall ? 15 : 16,
    textSize: isSmall ? 12 : 13,
  };
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  const vsLogo = 'https://search-operate.cdn.bcebos.com/9f667cbc82505f73b7445ecb1640ecb9.png';
  
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
    console.log(JSON.stringify(
      setting, null, 2
    ));
  };
  
  // 实时比分通知
  const scoreNotice = async (
    matchId,
    matchStatus, 
    liveStageText, 
    team1Name, 
    team1Score, 
    team2Name, 
    team2Score
  ) => {
    const matchName = `${team1Name}_${team2Name}`;
    const liveScore = `${team1Name}  ${team1Score} - ${team2Score}  ${team2Name}`;
    
    if (matchStatus === '1') {
      if (!setting[matchName]) {
        setting[matchName] = { team1Score: 0, team2Score: 0 };
      }
      if (team1Score !== setting[matchName].team1Score || team2Score !== setting[matchName].team2Score) {
        setting[matchName] = { team1Score, team2Score };
        writeSettings(setting);
        if (chooseSports === 'NBA' || chooseSports === 'cba') {
          return module.notify(liveStageText, liveScore)
        }
        // 进球事件
        const events = await getGoalsAndPenalties(matchId);
        const goal = events.left?.goal || events.right?.goal;
        if (events && goal) {
          const assist = goal.assistPlayerName ? `\n${goal.assistPlayerName}助攻，第 ${events.passedTime} 分钟` : '';
          module.notify(`${liveScore}`, `${goal.playerName}  ${events.goaltype}❗️${assist}`);
        }
      }
    } else if (matchStatus === '2') {
      if (setting[matchName]) {
        delete setting[matchName];
        writeSettings(setting);
        module.notify('比赛结束', liveScore);
      }
    }
  };
  
  // 进球事件
  const getGoalsAndPenalties = async (matchId) => {
    const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('赛况')}`;
    const request = new Request(url);
    request.timeoutInterval = 5;
    
    try {
      const html = await request.loadString();
      const match = html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
      const value = JSON.parse(match);
      const tabsList = value.data.data.tabsList;
      const result = tabsList.find(tab => tab.data && tab.data.events);
      // 如果找到结果，则处理 events
      if (result) {
        const { list } = result.data.events;
        const events = list.filter(event => [
          '进球', 
          '点球', 
          '点球不进', 
          '乌龙球'
        ].includes(event.goaltype || event.type));
        const firstObject = events[0];
        if (firstObject) {
          return firstObject;
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  
  // 获取赛况
  const getRaceSchedule = async (matchId) => {
    const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('分析')}&&async_source=h5&tab_type=single&from=baidu_shoubai_na&request__node__params=1&getAll=1`;
    const request = new Request(url);
    request.timeoutInterval = 5;
    
    try {
      const { tplData } = await request.loadJSON();
      const value = tplData.data;
      const { victory, draw, lost } = value.tabsList[0].data.result.percentage;
      const percentage = {
        total: 100,
        draw: parseInt(draw, 10),
        homeWin: parseInt(victory, 10),
        awayWin: parseInt(lost, 10),
      };
      return { header: value.header, percentage };
    } catch (error) {
      console.log(error);
    }
  };
  
  // 实时赛况分析
  const getRaceScheduleList = async (chooseSports) => {
    const url = `https://tiyu.baidu.com/al/match?match=${encodeURIComponent(chooseSports)}&tab=${encodeURIComponent('赛程')}&&async_source=h5&tab_type=single&from=baidu_shoubai_na&request__node__params=1&getAll=1`;
    const request = new Request(url);
request.timeoutInterval = 5;

    try {
      const { tplData } = await request.loadJSON();
      const tabsData = tplData.data.tabsList[0].data;
      const hasMatchStatus2 = (list) => list.some(match => 
        match.matchStatus === '2');
    
      let data = [];
      let foundMatchStatus2 = false;
      let lastStatus2Item = null;
      for (let i = tabsData.length - 1; i >= 0; i--) {
        const item = tabsData[i];
        if (hasMatchStatus2(item.list)) {
          if (!foundMatchStatus2) {
            foundMatchStatus2 = true;
            const completedMatches = item.list.filter(match => match.matchStatus === '2');
            item.list = [completedMatches[completedMatches.length - 1]];
            lastStatus2Item = item;
          }
        } else {
          data.unshift(item);
        }
      }
    
      if (lastStatus2Item) {
        data.unshift(lastStatus2Item)
      }
      return { data, header: tplData.data.header };
    } catch (error) {
      console.log(error);
    }
  };
  
  // 计算剩余多少分钟
  const getMinutesDiff = (dateStr) => {
    const targetDate = new Date(`${dateStr.replace(' ', 'T')}:00`)
    if (isNaN(targetDate.getTime())) {
      return null;
    }
    const diffMilliseconds = targetDate - new Date(); // 计算时间差（毫秒）
    const diffHours = diffMilliseconds / (1000 * 60);
    return diffHours.toFixed(2);
  };
  
  /**
   * 获取距离当前时间最近的比赛信息
   *
   * 优先级逻辑：
   * 1. 优先返回“进行中”的比赛。
   * 2. 如果没有进行中的比赛，返回“已结束”但在 30 分钟以内的比赛。
   * 3. 如果没有满足上述条件的比赛，返回距离当前时间最近且即将开赛的比赛（未开赛）
   */
  const getClosestMatch = (data) => {
    let nextDiff = Infinity;
    let nextMatch = null;
    let lastEndedMatch = null;
    let hasTodayMatch = false;
    
    for (const item of data) {
      const isToday = item.dateText.includes('今天');
      if (!isToday) continue
      for (const match of item.list) {
        const diff = getMinutesDiff(match.startTime);
        if (match.status === '1') return { matches: match };
        if (match.status === '2') {
          if (!lastEndedMatch || diff < getMinutesDiff(lastEndedMatch.time)) {
            lastEndedMatch = match;
            nextDiff = Math.ceil(diff);
            hasTodayMatch = isToday;
          }
        }
        
        if (match.matchStatus === '0' && diff > 0 && diff < setting.switchTime) {
          if (diff < nextDiff) {
            nextMatch = match;
            nextDiff = Math.ceil(diff);
            hasTodayMatch = isToday
          }
        }
      }
    };
    // 比赛结束后，保持已结束的界面25分后切换到下一场比赛的内容；如果全天比赛已结束，切换到全天结束组件；若比赛进行时间未超过125分钟，保持已结束的界面，超过后恢复到正常组件。
    if (nextDiff > 25 && lastEndedMatch && nextMatch && nextDiff >= -125) {
      return {
        matches: lastEndedMatch,
        nextDiff,
        hasTodayMatch
      }
    }
    
    if (nextMatch) {
      return {
        matches: nextMatch,
        nextDiff,
        hasTodayMatch
      }
    }
    
    return {
      matches: null,
      hasTodayMatch: false
    }
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
  
  const createText = (stack, text, textSize, font, opacity, color) => {
    const rowText = stack.addText(text);
    rowText.textColor = textColor;
    rowText.font = Font[font 
      ? 'mediumSystemFont' 
      : 'systemFont'](textSize);
    if (opacity) {
      rowText.textOpacity = opacity;
    }
  };
  
  const addLeagueStack = async (widget, header) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    const leagueImg = await module.getCacheData(header.logoimg, 240, `${header.name}.png`);
    const icon = leagueStack.addImage(leagueImg)
    icon.imageSize = new Size(23, 23);
    if (header.name.includes('法国')) {
      icon.tintColor = textColor;
    };
    leagueStack.addSpacer(12);
    
    createText(leagueStack, header.name, 16);
    leagueStack.addSpacer();
    createText(leagueStack, header.info, 16);
    widget.addSpacer();
  };
  
  // 日期栏
  const addDateColumn = (widget, length, item) => {
    const dateStack = widget.addStack();
    dateStack.layoutHorizontally();
    dateStack.centerAlignContent();
    dateStack.cornerRadius = 2;
    dateStack.setPadding(1, 0, 1, 0);
    dateStack.backgroundColor = item.dateText.includes('今天') 
      ? new Color('#CCC400', 0.15) 
      : item.dateText.includes('明天') 
      ? new Color('#8C7CFF', 0.15) 
      : new Color('#999999', 0.2);
    
    createText(dateStack, item.dateText.replace(/\//, '   '), 13, null, 0.8);
    dateStack.addSpacer();
    createText(dateStack, `${length}场比赛`, 13, null, 0.8);
    widget.addSpacer(5);
  };
  
  const createTextStack = (stack, text, width, textOpacity, right, left, scoreColor) => {
    const rowStack = stack.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, 20);
    if (left) rowStack.addSpacer();
    const rowText = rowStack.addText(text);
    rowText.font = Font.mediumSystemFont(13);
    rowText.textOpacity = textOpacity === true ? 0.5 : 1;
    rowText.textColor = scoreColor && /\d/.test(text) && !setting.autoSwitch ? Color.red() : textColor;
    if (right) rowStack.addSpacer();
    return rowText;
  };
  
  // 创建组件
  const createWidget = async () => {
    const { data, header} = await getRaceScheduleList(chooseSports);
    
    const widget = new ListWidget();
    widget.url = `https://tiyu.baidu.com/match/${chooseSports}/tab/赛程`;;
    widget.setPadding(15, 17, 15, 17);
    
    const maxMatches = 4
    let count = 0;
    for (const item of data) {
      if (count === 0) await addLeagueStack(widget, header);
      if (item.dateText.includes('今天') && item.list[0].matchStatus !== '2' || count > 0 && count < 2) {
        addDateColumn(widget, item.list.length, item);
      }
      
      for (const match of item.list) {
        if (count >= maxMatches) break;
        count++;
        const { leftLogo, rightLogo, time, matchId } = match;
        const textOpacity = match.matchStatus === '2';
        const stackSize = (chooseSports.includes('NBA') || chooseSports.includes('cba')) ? 80 : 50
        
        const stack = widget.addStack();
        stack.layoutHorizontally();
        stack.centerAlignContent();
        widget.addSpacer(3);
        // 比赛时间
        const timeText = createTextStack(stack, time, 46, textOpacity, 'right');
        // 主队图标
        const homeImg = await module.getCacheData(leftLogo.logo, 240, `${leftLogo.name}.png`);
        const homeImage = stack.addImage(homeImg).imageSize = new Size(20, 20);
        stack.addSpacer(8);
        // 主队名称
        const team1NameText = createTextStack(stack, leftLogo.name, null, textOpacity, 'right');
        // 比分
        const scoreText = createTextStack(stack, `${leftLogo.score} - ${rightLogo.score}`, stackSize, textOpacity, 'right', 'left', '#FF0000');
        // 客队名称
        const team2NameText = createTextStack(stack, rightLogo.name, null, textOpacity, null, 'left');
        stack.addSpacer(6);
        // 客队图标
        const awayImg = await module.getCacheData(rightLogo.logo, 240, `${rightLogo.name}.png`);
        const awayIcon = stack.addImage(awayImg).imageSize = new Size(20, 20);
      }
    };
    return { widget, data };
  };
  
  // 三段进度条⚽️🇩🇪🇩🇪
  const createThreeStageBar = (total, homeWin, draw, awayWin) => {
    const width = 200;
    const height = 4;
    const radius = height / 2;
    // 初始间隔宽度
    let interval = 2.5
    let intervals = 2 * interval;
    
    const ctx = new DrawContext();
    ctx.size = new Size(width, height + 13);
    ctx.opaque = false;
    ctx.respectScreenScale = true;
  
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
    const awayWinTextWidth = awayWinText.length * textSize * 0.7;
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
    const verticalStack = mainStack.addStack();
    verticalStack.layoutVertically();
    const logoStack = verticalStack.addStack();
    logoStack.layoutHorizontally();
    logoStack.addSpacer();
    const logo = await module.getCacheData(logoUrl, 240, `${teamName}.png`);
    const logoImage = logoStack.addImage(logo);
    logoImage.imageSize = new Size(imgSize, imgSize);
    if (!teamName) {
      verticalStack.size = new Size(size, size - 5);
      logoImage.tintColor = Color.dynamic(Color.red(), Color.white());
    }
    logoStack.addSpacer();
    verticalStack.addSpacer(size ? teamName : 5);
    
    if (teamName) {
      const titleStack = verticalStack.addStack();
      titleStack.addSpacer();
      const titleText = titleStack.addText(teamName);
      titleText.font = Font.mediumSystemFont(14);
      titleText.textColor = textColor;
      titleStack.addSpacer();
    }
  };
  
  /**
   * 如果header.liveStage === 中场
   * 获取matchDesc ➕ dateFormat 
   * 否则liveStageText
   */
  const createHeading = (infoStack, headerLiveStageText) => {
    infoStack.layoutHorizontally();
    infoStack.size = new Size(0, 25);
    infoStack.addSpacer();
    const infoText = infoStack.addText( headerLiveStageText);
    infoText.font = Font.systemFont(15);
    infoText.textColor = textColor; 
    infoStack.addSpacer();
  };
  
  // 创建组件
  const createLiveWidget = async (result, data) => {
    const { matches, hasTodayMatch, closestDiff } = result;
    const { header, percentage } = await getRaceSchedule(matches.matchId);
    const { total, homeWin, draw, awayWin } = percentage;
    
    const {
      key,
      matchStatus,
      matchStatusText,
      matchDesc,
      dateFormat,
      liveStage,
      liveStageText,
      leftLogo,
      leftGoal,
      rightLogo,
      rightGoal,
    } = header;
    
    const headerLiveStageText = liveStage === '中场' ? `${matchDesc}  ${dateFormat}` : liveStageText;
    const scoreLength = leftGoal.length >= 2 && rightGoal.length >= 2;
    // ===== 🔔 比分通知 🔔 ===== //
    scoreNotice(matches.matchId || key, matchStatus, headerLiveStageText, leftLogo.name, leftGoal, rightLogo.name, rightGoal);
    
    // 创建组件
    const widget = new ListWidget();
    widget.url = `https://tiyu.baidu.com/al/live/detail?matchId=${matches.matchId || key}&tab=赛况`;
    widget.setPadding(15, 20, 5, 20);
    const infoStack = widget.addStack();
    createHeading(infoStack, headerLiveStageText);
    widget.addSpacer(3);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    await createStack(mainStack, leftLogo.logo, lay.iconSize, leftLogo.name);
    mainStack.addSpacer();
    if (matchStatus === '0') {
      await createStack(mainStack, vsLogo, lay.vsLogoSize, null, 65);
    } else {
      const mediumStack = mainStack.addStack();
      if (scoreLength) mediumStack.size = new Size(148, 0);
      mediumStack.layoutVertically();
      mediumStack.addSpacer(10);
      
      const scoreStack = mediumStack.addStack();
      scoreStack.layoutHorizontally();
      scoreStack.addSpacer();
      const scoreText = scoreStack.addText(`${leftGoal} - ${rightGoal}`);
      scoreText.textOpacity = 0.9;
      scoreText.font = Font.mediumSystemFont(scoreLength ? 30 : 35);
      scoreText.textColor = textColor;
      scoreStack.addSpacer();
      mediumStack.addSpacer(4);
      
      const statusStack = mediumStack.addStack();
      statusStack.layoutHorizontally();
      statusStack.addSpacer();
      const statusText = statusStack.addText(matchStatusText);
      statusText.textOpacity = 0.8;
      statusText.font = Font.mediumSystemFont(13.5);
      statusText.textColor = matchStatus === '2' ? new Color(textColor.hex, 0.65) : Color.red();
      statusStack.addSpacer();
    }
    
    mainStack.addSpacer();
    await createStack(mainStack, rightLogo.logo, lay.iconSize, rightLogo.name);
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
    let { widget = null, data = {} } = await createWidget();
    const result = getClosestMatch(data);
    console.log(
      JSON.stringify(result, null, 2)
    );
    if (result.matches && setting.autoSwitch) {
      widget = await createLiveWidget(result, data);
    }
    
    if (setting.alwaysDark) {
      widget.backgroundColor =  Color.black();
    } else {
      await setBackground(widget);
    }
    
    if (config.runsInApp) {
      await widget.presentMedium();
    } else {
      widget.refreshAfterDate = new Date(Date.now() + 1000 * 60 * Number(setting.refresh));
      Script.setWidget(widget);
      Script.complete();
    }
  };
  await runWidget();
}
module.exports = { main }