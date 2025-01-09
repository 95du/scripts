// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: volleyball-ball;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事
 * 组件版本: Version 1.0.0
 * 发布时间: 2025-01-01
 */
await main(config.widgetFamily || 'medium')
async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_sports';
  const module = new _95du(pathName);
  const setting = module.settings;
  const { count = 0 } = setting;
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
    const validParam = setting.values.some(item => item.value === trimmedParam) || ['NBA', 'CBA'].includes(trimmedParam);
    chooseSports = validParam ? trimmedParam : chooseSports;
  };
  
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    imgSize: isSmall ? 50 : 53,
    vsLogoSize: isSmall ? 40 : 43,
    stackSize: isSmall ? 18 : 20,
    iconSize: isSmall ? 21 : 23,
    titleSize: isSmall ? 15 : 16,
    textSize: isSmall ? 12 : 13,
  };
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  const columnColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.dateColor));
  const barBgColor = Color.dynamic(new Color('#dddddd'), new Color('#666666'));
  const videoColor = Color.dynamic(Color.green(), Color.white());
  const vsLogo = 'https://ms.bdstatic.com/se/tiyu-wise/static/img/e0d7f6f1bd51a47082dcc0e260a0a7c3.png';
  const raceScheduleUrl = `https://tiyu.baidu.com/match/${chooseSports}/tab/赛程`;;
  const basketball = ['NBA', 'CBA'].includes(chooseSports);
  
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
  
  // ====== 设置组件背景 ====== //
  const setBackground = async (widget) => {
    const bgImage = fm.joinPath(cacheImg, Script.name());
    const Appearance = Device.isUsingDarkAppearance();
    if (fm.fileExists(bgImage) && !Appearance) {
      const shadowImg = fm.readImage(bgImage);
      widget.backgroundImage = await module.shadowImage(shadowImg);
    } else if (setting.gradient.length > 0 && !setting.bwTheme) {
      widget.backgroundGradient = module.createGradient();
    } else {
      widget.backgroundColor = Color.dynamic(Color.white(), Color.black());
    }
  };
  
  // 更新缓存文件
  const updateCacheFile = () => {
    const filename = `${chooseSports}.json`;
    const filePath = fm.joinPath(cacheStr, filename);
    if (fm.fileExists(filePath)) 
    fm.remove(filePath);
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
    const matchNames = `${team1Name}_${team2Name}`;
    const liveScore = `${team1Name}  ${team1Score} - ${team2Score}  ${team2Name}`;
    
    if (matchStatus === '1') {
      if (!setting[matchNames]) {
        setting[matchNames] = { team1Score: 0, team2Score: 0 };
      }
      if (team1Score !== setting[matchNames].team1Score || team2Score !== setting[matchNames].team2Score) {
        setting[matchNames] = { team1Score, team2Score };
        writeSettings(setting);
        // 进球事件
        const events = await getGoalsEvents(matchId);
        if (!events) {
          module.notify(liveScore, liveStageText);
        }
        const [goal] = events.left?.goal || events.right?.goal
        if (events) {
          const assist = goal.assistPlayerName ? `\n${goal.assistPlayerName} ( 助攻 )` : '';
          module.notify(`${liveScore}`, `${goal.playerName} (${events.passedTime} 分钟) ${events.goaltype}❗️${assist}`);
        }
      }
    } else if (matchStatus === '2') {
      if (setting[matchNames]) {
        delete setting[matchNames];
        writeSettings(setting);
        module.notify('比赛结束', liveScore);
      }
    }
  };
  
  // 进球事件
  const getGoalsEvents = async (matchId, live) => {
    try {
      const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('赛况')}`;
      const html = await module.httpRequest(url, 'string');
      const match = html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
      const value = JSON.parse(match);
      if (live) return value.data;
      
      const tabsList = value.data.data.tabsList;
      const result = tabsList.find(tab => tab.data && tab.data.events);
      // 如果找到结果，则处理 events
      if (result) {
        const { list } = result.data.events;
        const goalEvents = ['进球', '点球', '点球未进', '乌龙球'];
        const events = list.filter(event => goalEvents.includes(event.goaltype));
        const firstObject = events[0];
        if (firstObject) {
          return firstObject;
        }
      }
    } catch (e) {
      console.log(e);
    }
  };
  
  /**
   * 赛事分析 async_source=h5&tab_type=single&from=baidu_shoubai_na&request__node__params=1&getAll=1
   */
  const getRaceSchedule = async (matchId) => {
    try {
      const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('分析')}&request__node__params=1`;
      const { tplData } = await module.httpRequest(url, 'json');
      const value = tplData.data;
      const { 
        victory = 40, 
        draw = basketball ? null : 20, 
        lost = 40 
      } = value.tabsList?.[0]?.data?.result?.percentage || {};
      const percentage = {
        total: 100,
        draw: parseInt(draw, 10),
        homeWin: parseInt(victory, 10),
        awayWin: parseInt(lost, 10),
      };
      return { header: value.header, percentage };
    } catch (e) {
      console.log(e);
    }
  };
  
  /**
   * 指定日期 
   * 参数: before today after
   */
  const specifiedDateSports = async (nextTime) => {
    try {
      const url = `https://tiyu.baidu.com/al/api/match/schedules?match=${encodeURIComponent(chooseSports)}&date=${nextTime}&direction=after&from=baidu_tiyu`
      if (family === 'large') {
        const filename = `${chooseSports}_${nextTime}.json`;
        const { data } = await module.getCacheData(url, 24, filename);
        return data[0];
      }
    } catch (e) {
      console.log(e);
    }
  };
  
  // 赛程
  const getRaceScheduleList = async () => {
    try {
      const url = `https://tiyu.baidu.com/al/match?match=${encodeURIComponent(chooseSports)}&tab=${encodeURIComponent('赛程')}&request__node__params=1`;
      const { tplData } = await module.getCacheData(url, 2, `${chooseSports}.json`);
      const tabsData = tplData.data.tabsList[0].data;
      
      // 如果总长度小于等于15，添加对象到data的最后，否则 data.pop()
      const totalListLength = tabsData.reduce((sum, item) => sum + item.list.length, 0);
      if (totalListLength < 15) {
        const lastItem = tabsData[tabsData.length - 1];
        const newMatches = await specifiedDateSports(lastItem.time);
        if (newMatches) tabsData.push(newMatches);
      }
  
      let data = [];
      let isMatches = null;
      let foundMatchStatus2 = false;
  
      for (let i = tabsData.length - 1; i >= 0; i--) {
        const item = tabsData[i];
        let currentList = item.list.filter(match => match.matchStatus !== '3');
        const isMatchesStatus = currentList.filter(match => match.matchStatus === '1');
        const completedMatches = currentList.filter(match => match.matchStatus === '2');
        const nonCompletedMatches = currentList.filter(match => match.matchStatus !== '2');
        // 保留最近的状态为 2 的比赛
        if (!foundMatchStatus2 && completedMatches.length > 0) {
          item.list = [completedMatches[completedMatches.length - 1], ...nonCompletedMatches];
          foundMatchStatus2 = true;
        } else {
          item.list = nonCompletedMatches;
        }
        
        if (isMatchesStatus.length > 0 || item.weekday === '今天') {
          isMatches = item;
        }
        
        if (item.list.length > 0) {
          item.totalMatches = currentList.length;
          data.unshift(item);
        }
      };
      // 最后统一处理状态为 1 的比赛过滤逻辑
      const hasStatusOne = data.some(item => item.list.some(match => match.matchStatus === '1'));
      if (hasStatusOne) {
        data = data.map(item => {
          const filteredList = item.list.filter(match => match.matchStatus !== '2');
          return { ...item, list: filteredList };
        }).filter(item => item.list.length > 0);
      }
      // 输出结果
      return { data, isMatches, header: tplData.data.header };
    } catch (error) {
      console.error(`获取赛程数据出错: ${error.message}`);
    }
  };
    
  /**
   * 获取距离当前时间最近的比赛信息
   *
   * 优先级逻辑：
   * 1. 优先返回“进行中”的比赛。
   * 2. 如果没有进行中的比赛，返回“已结束”但在 30 分钟以内的比赛。
   * 3. 如果没有满足上述条件的比赛，返回距离当前时间最近且即将开赛的比赛（未开赛）
   */
  const processMatches = (data) => {
    let nextTime = null;
    let matches = null;
    // 循环赛事
    const isMatchesStatus = data.list.filter(match => match.matchStatus === '1');
    if (isMatchesStatus.length > 0 && setting.loopEvent) {
      const optNextIndex = (num, data) => (num + 1) % data.length;
      setting.count = optNextIndex(count, isMatchesStatus);
      writeSettings(setting);
      return { matches: isMatchesStatus[setting.count] };
    }
    
    for (const match of data.list) {
      const matchStatus = parseInt(match.matchStatus);
      const matchStartTime = new Date(match.startTime);
      const minutesUntilStart = Math.ceil((matchStartTime - new Date()) / (60 * 1000));
      
      if (matchStatus === 1) {
        return { matches: match };
      } else if (matchStatus === 2) {
        matches = match;
        nextTime = minutesUntilStart;
      } else if (matchStatus === 0) {
        if (minutesUntilStart <= 25 && minutesUntilStart > 0) {
          matches = match;
          nextTime = minutesUntilStart;
          module.notify(`${matches.matchName} ${matches.time}`, `${matches.leftLogo.name} - ${matches.rightLogo.name}，还剩 ${nextTime} 分钟开赛`);
        }
      }
    };
    
    if (matches && nextTime > -125) {
      return { matches };
    }
    return { matches: null };
  };
  
  // 创建文本
  const createText = (stack, text, textSize) => {
    const rowText = stack.addText(text);
    rowText.textColor = textColor;
    rowText.font = Font.mediumSystemFont(textSize);
  };
  
  const addHeaderStack = async (widget, header) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    leagueStack.size = new Size(0, lay.iconSize);
    const leagueImg = await module.getCacheData(header.logoimg, 240, `${header.name}.png`);
    const icon = leagueStack.addImage(leagueImg)
    if (header.name.includes('法国')) {
      icon.tintColor = textColor;
    };
    leagueStack.addSpacer(12);
    createText(leagueStack, header.name, lay.titleSize);
    leagueStack.addSpacer();
    createText(leagueStack, header.info.replace('赛季', ''), lay.titleSize);
    return leagueStack;
  };
  
  // 日期栏
  const createColumnText = (stack, text) => {
    const rowText = stack.addText(text);
    rowText.textColor = columnColor;
    rowText.font = Font.systemFont(lay.textSize);
    rowText.textOpacity = 0.8;
  };
  
  const addDateColumn = (widget, totalMatches, item) => {
    const dateStack = widget.addStack();
    dateStack.layoutHorizontally();
    dateStack.centerAlignContent();
    dateStack.cornerRadius = 2;
    dateStack.setPadding(1, 0, 1, 0);
    dateStack.backgroundColor = item.dateText.includes('今天') 
      ? new Color('#CCC400', 0.15) 
      : item.dateText.includes('明天') 
        ? new Color('#8C7CFF', 0.15) 
        : new Color('#999999', 0.18);
    createColumnText(dateStack, item.dateText.replace('/', '   '));
    dateStack.addSpacer();
    createColumnText(dateStack, `${totalMatches}场比赛`);
    widget.addSpacer(5);
  };
  
  const createTextStack = (stack, text, width, textOpacity, right, left, matchStatus) => {
    const rowStack = stack.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, lay.stackSize);
    if (left) rowStack.addSpacer();
    const rowText = rowStack.addText(text);
    rowText.font = Font.mediumSystemFont(lay.textSize);
    rowText.textOpacity = textOpacity === true ? 0.5 : 1;
    rowText.textColor = matchStatus === '1' ? Color.red() : textColor;
    if (right) rowStack.addSpacer();
    return rowText;
  };
  
  // 创建组件
  const createWidget = async () => {
    const { data, isMatches, header } = await getRaceScheduleList();
    const widget = new ListWidget();
    widget.setPadding(15, 17, 15, 17);
    
    const maxRows = family === 'medium' ? 6 : family === 'large' ? 15 : 6;
    let rowCount = 0;
    if (rowCount < maxRows) {
      await addHeaderStack(widget, header);
      widget.addSpacer();
      rowCount++;
    }
    
    for (const item of data) {
      if (rowCount >= maxRows) break;
      const liveMatches = item.list.filter(match => match.matchStatus === '1');
      const targetRow = liveMatches.length > 4 ? -1 : liveMatches.length > 0 ? 1 : 2;
      
      if (rowCount + 1 < maxRows && (rowCount === targetRow || family !== 'medium')) {
        addDateColumn(widget, item.totalMatches, item);
        rowCount++;
      }
      
      for (const match of item.list) {
        if (rowCount >= maxRows) break;
        // 检查是否即将开赛小于等于 1 小时
        const startTime = new Date(match.startTime || match.startTimeStamp * 1000);
        const startTimeDiff = (startTime - new Date()) / (60 * 1000);
        if (startTimeDiff > -200 && startTimeDiff <= 60) {
          updateCacheFile();
        }
        
        const { matchId, matchName, matchStatus, liveStageText, hasLiveOrFlash, leftLogo, rightLogo, time } = match;
        const textOpacity = match.matchStatus === '2';
        //===== 🔔 比分通知 🔔 =====//
        if ((!setting.autoSwitch || family === 'large') && matchStatus === '1' && liveStageText) {
          scoreNotice(matchId, matchStatus, `${matchName} ${liveStageText}` , leftLogo.name, leftLogo.score, rightLogo.name, rightLogo.score);
        }
        
        const stack = widget.addStack();
        stack.url = raceScheduleUrl;
        stack.layoutHorizontally();
        stack.centerAlignContent();
        widget.addSpacer(3);
        // 比赛时间
        createTextStack(stack, time, 46, textOpacity, 'right');
        // 主队图标
        const homeImg = await module.getCacheData(leftLogo.logo, 240, `${leftLogo.name}.png`);
        const homeImage = stack.addImage(homeImg).imageSize = new Size(lay.stackSize, lay.stackSize);
        stack.addSpacer(8);
        // 主队名称
        createTextStack(stack, leftLogo.name, null, textOpacity, 'right');
        // 比分
        if (hasLiveOrFlash && matchStatus === '0' && setting.displayLive) {
          const sf = SFSymbol.named('video.fill');
          const icon = stack.addImage(sf.image);
          icon.imageSize = new Size(lay.stackSize, lay.stackSize);
          icon.tintColor = new Color(setting.videoColor || '#00C400');
        } else {
          createTextStack(stack, `${leftLogo.score} - ${rightLogo.score}`, (basketball ? 80 : 50), textOpacity, 'right', 'left', matchStatus);
        }
        // 客队名称
        createTextStack(stack, rightLogo.name, null, textOpacity, null, 'left');
        stack.addSpacer(6);
        // 客队图标
        const awayImg = await module.getCacheData(rightLogo.logo, 240, `${rightLogo.name}.png`);
        const awayIcon = stack.addImage(awayImg).imageSize = new Size(lay.stackSize, lay.stackSize);
        rowCount++;
      }
    }
    return { widget, isMatches };
  };
  
  // 三段进度条⚽️🇩🇪🇩🇪
  const createThreeStageBar = (total, homeWin, draw, awayWin) => {
    const width = 200;
    const height = 4;
    const radius = height / 2;
    // 初始间隔宽度
    let interval = awayWin < 10 ? 1 : 2
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
    const awayWinTextWidth = awayWinText.length * textSize * 0.72;
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
    const logo = await module.getCacheData(logoUrl, 240, `${teamName || 'vsLogo'}.png`);
    const logoImage = logoStack.addImage(logo);
    logoImage.imageSize = new Size(imgSize, imgSize);
    if (size) verticalStack.size = new Size(size, size - 5);
    logoStack.addSpacer();
    verticalStack.addSpacer(size ? teamName : 6);
    
    if (teamName) {
      const titleStack = verticalStack.addStack();
      titleStack.addSpacer();
      const titleText = titleStack.addText(teamName);
      titleText.font = Font.mediumSystemFont(14);
      titleText.textColor = textColor;
      titleStack.addSpacer();
    }
  };
  
  // 比分栏
  const createScoreStack = (mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, wiseLiveList) => {
    const scoreLength = leftGoal.length >= 2 || rightGoal.length >= 2;
    const mediumStack = mainStack.addStack();
    if (scoreLength) mediumStack.size = new Size(148, 75);
    mediumStack.layoutVertically();
    mediumStack.addSpacer();
    
    const scoreStack = mediumStack.addStack();
    scoreStack.layoutHorizontally();
    scoreStack.addSpacer();
    const scoreText = scoreStack.addText(`${leftGoal} - ${rightGoal}`);
    scoreText.font = Font.mediumSystemFont(scoreLength ? 30 : 35);
    scoreText.textColor = textColor;
    scoreStack.addSpacer();
    mediumStack.addSpacer();
    
    const statusStack = mediumStack.addStack();
    statusStack.layoutHorizontally();
    statusStack.addSpacer();
    const barStack = statusStack.addStack();
    barStack.setPadding(2, wiseLiveList ? 12 : 15, 2, wiseLiveList ? 12 : 15);
    barStack.cornerRadius = 8;
    barStack.backgroundColor = matchStatus === '2' ? barBgColor : wiseLiveList ? new Color('#8226DC') : new Color('#FF4800');
    const statusText = barStack.addText(wiseLiveList ? wiseLiveList[0].category : matchStatusText);
    if (matchStatus === '2') statusText.textOpacity = 0.7;
    statusText.font = Font.boldSystemFont(12.5);
    statusText.textColor = matchStatus === '2' ? textColor : Color.white();
    statusStack.addSpacer();
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
  const createLiveWidget = async ({ matchId } = matches) => {
    const [raceSchedule, goalsAndPenalties] = await Promise.all([ getRaceSchedule(matchId), getGoalsEvents(matchId, true) ]);
    const { header, percentage } = raceSchedule || {};
    const { total, homeWin, draw, awayWin } = percentage || {};
    const { data: { wiseLiveList }, pageUrl } = goalsAndPenalties || {};
    
    const {
      matchStatus,
      matchStatusText,
      matchDesc,
      dateFormat,
      liveStageTime,
      liveStage,
      liveStageText,
      leftLogo,
      leftGoal,
      rightLogo,
      rightGoal,
    } = header || {};
    
    // ===== 🔔 比分通知 🔔 ===== //
    const liveStageSuffix = liveStage === '中场' || matchStatus !== '1' 
      ? dateFormat 
      : liveStage.includes('完')
        ? `${liveStageText} ${liveStageTime}`
        : liveStageText;
    
    const safeMatchDesc = (matchDesc || '').replace(/nba/gi, 'NBA');
    const headerLiveStageText = `${safeMatchDesc}  ${liveStageSuffix}`;
    scoreNotice(matchId, matchStatus, headerLiveStageText, leftLogo.name, leftGoal, rightLogo.name, rightGoal);
    
    // 创建组件
    const widget = new ListWidget();
    widget.setPadding(15, 20, 5, 20);
    const infoStack = widget.addStack();
    createHeading(infoStack, headerLiveStageText);
    const mainStack = widget.addStack();
    mainStack.setPadding(0, 0, 5, 0);
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    await createStack(mainStack, leftLogo.logo, lay.imgSize, leftLogo.name);
    mainStack.addSpacer();
    if (matchStatus === '0') {
      await createStack(mainStack, vsLogo, lay.vsLogoSize, null, 65);
    } else {
      createScoreStack(mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, wiseLiveList);
    }
    mainStack.addSpacer();
    await createStack(mainStack, rightLogo.logo, lay.imgSize, rightLogo.name);
    widget.addSpacer();
    
    const progressChart = createThreeStageBar(total, homeWin, draw, awayWin);
    const imageStack = widget.addStack();
    imageStack.size = new Size(0, 35);
    imageStack.addImage(progressChart);
    
    // 跳转赛事直播页面
    if (wiseLiveList) {
      mainStack.url = wiseLiveList[0]?.link;
    } else {
      mainStack.url = pageUrl;
    }
    return widget;
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中大尺寸');
    text.font = Font.systemFont(16);
    text.centerAlignText();
    return widget;
  };
  
  // 
  const runWidget = async () => {
    let widget = null;
    let isMatches = {};
    
    if (family === 'small') {
      widget = createErrorWidget();
    } else {
      ({ widget, isMatches } = await createWidget());
    }
    
    if (isMatches && Object.keys(isMatches).length > 0) {
      const result = processMatches(isMatches);
      if (result?.matches && family === 'medium' && setting.autoSwitch) {
        widget = await createLiveWidget(result.matches);
      }
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