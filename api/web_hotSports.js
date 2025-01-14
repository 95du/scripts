// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: volleyball-ball;
/**
 * 组件作者: 95du茅台
 * 组件名称: 热门赛事
 * 组件版本: Version 1.0.1
 * 发布时间: 2025-01-03
 */

async function main(family) {
  const fm = FileManager.local();
  const depPath = fm.joinPath(fm.documentsDirectory(), '95du_module');
  const isDev = false
  
  if (typeof require === 'undefined') require = importModule;
  const { _95du } = require(isDev ? './_95du' : `${depPath}/_95du`);
  
  const pathName = '95du_hotSports';
  const module = new _95du(pathName);
  const setting = module.settings;
  const { count = 0 } = setting;
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    sportWidth: isSmall ? 90 : 95,
    scoreSize: isSmall ? 73 : 76,
    imgSize: isSmall ? 50 : 53,
    vsLogoSize: isSmall ? 40 : 43,
    stackSize: isSmall ? 18 : 20,
    iconSize: isSmall ? 21 : 23,
    titleSize: isSmall ? 15 : 16,
    textSize: isSmall ? 12 : 13,
    padding: family === 'medium' 
      ? [14, 18, 13, 18] 
      : [15, 18, 15, 18],
  };
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  const columnColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.dateColor));
  const barBgColor = Color.dynamic(new Color('#dddddd'), new Color('#666666'));
  const headerLogo = `${rootUrl}/img/icon/hotSports_header.png`;
  const vsLogo = 'https://search-operate.cdn.bcebos.com/9f667cbc82505f73b7445ecb1640ecb9.png';
  const raceScheduleUrl = 'https://tiyu.baidu.com/al/live';;
  
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
    const filename = 'hotSports.html';
    const filePath = fm.joinPath(cacheStr, filename);
    if (fm.fileExists(filePath)) 
    fm.remove(filePath);
  };
  
  // 实时比分通知
  const scoreNotice = async (
    matchId,
    matchStatus, 
    liveStageText, 
    leftName, 
    leftScore, 
    rightName, 
    rightScore
  ) => {
    const matchNames = `${leftName}_${rightName}`;
    const liveScore = `${leftName}  ${leftScore} - ${rightScore}  ${rightName}`;
    
    if (matchStatus === '1') {
      if (!setting[matchNames]) {
        setting[matchNames] = { leftScore: 0, rightScore: 0 };
      }
      if (leftScore !== setting[matchNames].leftScore || rightScore !== setting[matchNames].rightScore) {
        setting[matchNames] = { leftScore, rightScore };
        writeSettings(setting);
        // 进球事件
        const events = await getGoalsEvents(matchId);
        if (events) {
          const goals = events.left?.goal || events.right?.goal
          goals.forEach((goal) => {
            const assist = goal.assistPlayerName ? `\n${goal.assistPlayerName} ( 助攻 )` : '';
            module.notify(`${liveScore}`, `${goal.playerName} (${events.passedTime} 分钟) ${events.goaltype}❗️${assist}`);
          });
        } else {
          module.notify(liveScore, liveStageText);
        }
      }
    } else if (matchStatus === '2') {
      if (setting[matchNames]) {
        delete setting[matchNames];
        writeSettings(setting);
        module.notify('比赛结束 🤡', liveScore);
      }
    }
  };
  
  //===== 🔔 比分通知 🔔 =====//
  const sendNotice = (match, type = 'live') => {
    if (type === 'live') {
      const { matchId, matchName, liveStageText, leftLogo, rightLogo } = match;
      scoreNotice(
        matchId, 
        match.matchStatus, 
        `${matchName} ${liveStageText}`, 
        leftLogo.name, 
        leftLogo.score, 
        rightLogo.name, 
        rightLogo.score
      );
    } else if (type === 'end') {
      scoreNotice(
        null, 
        match.matchStatus, 
        null, 
        match.leftLogo.name, 
        match.leftLogo.score, 
        match.rightLogo.name, 
        match.rightLogo.score
      );
    }
  };
  
  // 进球事件
  const getGoalsEvents = async (matchId, live) => {
    try {
      const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('赛况')}`;
      const html = await module.httpRequest(url, 'string');
      const match = html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
      const value = JSON.parse(match);
      const tabsList = value.data.data.tabsList;
      
      if (live) {
        const getFreeLive = (data) => data.wiseLiveList?.find(match => match.free) || null;
        const freeLive = getFreeLive(value.data.data);
        const statistics = tabsList.find((tab) => tab.data?.["line-statistics"])?.data?.["line-statistics"] || null;
        return { 
          live: freeLive, 
          pageUrl: value.data.pageUrl,
          stat: statistics
        }
      }
      // 如果找到结果，则处理 events
      const result = tabsList.find(tab => tab.data && tab.data.events);
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
      const { header } = value;
      const { 
        victory = 40, 
        draw = header.sports === 'basketball' ? null : 20, 
        lost = 40 
      } = value.tabsList?.[0]?.data?.result?.percentage || {};
      const percentage = {
        total: 100,
        draw: parseInt(draw, 10),
        homeWin: parseInt(victory, 10),
        awayWin: parseInt(lost, 10),
      };
      return { header, percentage };
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
      const url = `https://tiyu.baidu.com/al/api/home/schedule?direction=after&type=hot&date=${nextTime}`;
      if (family === 'large') {
        const { data } = await module.getCacheData(url, 24, `${nextTime}.json`);
        return data;
      }
    } catch (e) {
      console.log(e);
    }
  };
  
  // 补充数据的逻辑
  const ensureMinimumMatches = async (tabsData, minCount) => {
    let totalLength = tabsData.reduce((sum, item) => sum + item.list.length, 0);
    while (totalLength < minCount) {
      const lastItem = tabsData[tabsData.length - 1];
      const newMatches = await specifiedDateSports(lastItem.time);
      if (newMatches && newMatches.list.length > 0) {
        tabsData.push(newMatches);
        totalLength += newMatches.list.length;
      } else { break }
    }
    return tabsData;
  };
  
  // 赛程
  const getRaceScheduleList = async () => {
    try {
      const url = `https://tiyu.baidu.com/al/live`;
      const html = await module.getCacheData(url, 2, 'hotSports.html');
      const match = html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
      const value = JSON.parse(match);
      const liveLists = value.data.data.liveList[0].data;
      let tabsData = liveLists.filter(item => !item.hide || new Date(item.time) >= new Date());
      // 如果总长度小于等于15，添加对象到data的最后
      tabsData = await ensureMinimumMatches(tabsData, 15);
  
      let data = [];
      let isMatches = [];
      let endMatches = [];
      let foundMatchStatus2 = false;
  
      for (let i = tabsData.length - 1; i >= 0; i--) {
        const item = tabsData[i];
        const currentList = item.list.filter(match => match.matchStatus !== '3');
        const completedMatches = currentList.filter(match => match.matchStatus === '2');
        const nonCompletedMatches = currentList.filter(match => match.matchStatus !== '2');
        
        if (completedMatches.length > 0 && item.weekday === '今天') {
          endMatches = item.list;
        }
        // 如果存在状态为 '2' 的比赛，优先保留最近的一场
        if (!foundMatchStatus2 && completedMatches.length > 0) {
          item.list = [completedMatches[completedMatches.length - 1], ...nonCompletedMatches];
          foundMatchStatus2 = true;
        } else {
          item.list = nonCompletedMatches;
        }
        // 收集所有状态为 '1' 的比赛或者开赛事今天的比赛
        const isStatusOneMatches = item.list.filter(match => match.matchStatus === '1');
        isMatches.push(...(isStatusOneMatches.length > 0 ? isStatusOneMatches : (item.weekday === '今天' ? item.list : [])));
        // 如果当前项目还有剩余比赛，则记录
        if (item.list.length > 0) {
          item.totalMatches = currentList.length; // 记录总比赛数量
          data.unshift(item);
        }
      }
      // 有状态为 1 的比赛时，过滤掉已结束的
      const hasStatusOne = data.some(item => item.list.some(match => match.matchStatus === '1'));
      if (hasStatusOne) {
        data = data.map(item => {
          const filteredList = item.list.filter(match => match.matchStatus !== '2');
          return { ...item, list: filteredList };
        }).filter(item => item.list.length > 0);
      }
      // 输出结果
      return { data, isMatches, endMatches};
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
    
    const isMatchesStatus = data.filter(match => match.matchStatus === '1'); // 收集 1 的对象并循环
    if (isMatchesStatus.length > 0 && setting.loopEvent) {
      const optNextIndex = (num, data) => (num + 1) % data.length;
      setting.count = optNextIndex(setting.count || 0, isMatchesStatus);
      writeSettings(setting);
      return { matches: isMatchesStatus[setting.count] };
    }
    
    for (const match of data) {
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
    }
    
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
  
  const addHeaderStack = async (widget) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    const leagueImg = await module.getCacheData(headerLogo, 240);
    const icon = leagueStack.addImage(leagueImg)
    icon.imageSize = new Size(42, lay.iconSize);
    leagueStack.addSpacer(5);
    createText(leagueStack, '热门赛事', lay.titleSize);
    leagueStack.addSpacer();
    const format = setting.dateFormat ? 'short' : 'hourMin';
    createText(leagueStack, module.formatDate(Date.now(), format), lay.titleSize);
    leagueStack.addSpacer(6);
    const sf = SFSymbol.named('arrow.triangle.2.circlepath');
    sf.applyMediumWeight();
    const symbol = leagueStack.addImage(sf.image);
    symbol.imageSize = new Size(lay.stackSize, lay.stackSize);
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
  
  const createTextStack = (stack, text, width, textOpacity, right, left, matchStatus, isGame) => {
    const rowStack = stack.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, lay.stackSize);
    if (left) rowStack.addSpacer();
    const rowText = rowStack.addText(text.length > 3 && isGame ? text.slice(0, 3) : text);
    rowText.font = Font.mediumSystemFont(lay.textSize);
    rowText.textOpacity = textOpacity === true || isGame ? 0.5 : 1;
    rowText.textColor = matchStatus === '1' ? Color.red() : textColor;
    if (right) rowStack.addSpacer();
    return rowText;
  };
  
  // 创建赛事列表
  const createMatches = async (widget, maxRows, showTitle) => {
    let rowCount = 0;
    if (rowCount < maxRows && showTitle) {
      await addHeaderStack(widget);
      widget.addSpacer();
      rowCount++;
    }
    
    const { data, isMatches, endMatches } = await getRaceScheduleList();
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
        const { matchStatus, leftLogo, rightLogo, time, matchId, game, matchName, liveStageText } = match;
        const textOpacity = match.matchStatus === '2';
        // 通知
        if (matchStatus === '1' && (!setting.autoSwitch || family === 'large') && match.liveStageText) {
          sendNotice(match, 'live');
        } else {
          endMatches.forEach(item => {
            sendNotice(item, 'end');
          });
        }
        // 检查是否即将开赛小于等于 1 小时
        const startTime = new Date(match.startTime || match.startTimeStamp * 1000);
        const startTimeDiff = (startTime - new Date()) / (60 * 1000);
        if (startTimeDiff > -180 && startTimeDiff <= 60) {
          updateCacheFile();
        }
        
        const stack = widget.addStack();
        stack.size = new Size(0, lay.stackSize);
        stack.url = raceScheduleUrl;
        stack.layoutHorizontally();
        stack.centerAlignContent();
        if (rowCount < maxRows - 1) {
          widget.addSpacer(3);
        }
        // 比赛时间
        createTextStack(stack, time, 46, textOpacity, 'right');
        // 主队图标
        const homeImg = await module.getCacheData(leftLogo.logo, 240, `${leftLogo.name}.png`);
        const homeIcon = stack.addImage(homeImg);
        homeIcon.imageSize = new Size(lay.stackSize, lay.stackSize);
        stack.addSpacer(8);
        // 主队名称
        createTextStack(stack, leftLogo.name, null, textOpacity, 'right');
        // 比分
        const isNumber = (string) => !isNaN(string);
        const isTeamScore = !isNumber(leftLogo.score) ? game : `${leftLogo.score} - ${rightLogo.score}`;
        const stackSize = matchName.includes('CBA') ? 80 : isTeamScore === game ? 65 : 50;
        createTextStack(stack, isTeamScore, stackSize, textOpacity, 'right', 'left', match.matchStatus, !isNumber(leftLogo.score));
        // 客队名称
        createTextStack(stack, rightLogo.name, null, textOpacity, null, 'left');
        stack.addSpacer(6);
        // 客队图标
        const awayImg = await module.getCacheData(rightLogo.logo, 240, `${rightLogo.name}.png`);
        const awayIcon = stack.addImage(awayImg);
        awayIcon.imageSize = new Size(lay.stackSize, lay.stackSize);
        rowCount++;
      }
    }
    return { isMatches };
  };
  
  // 三段进度条 🇩🇪🇩🇪
  const createThreeStageBar = (total, homeWin, draw, awayWin) => {
    const width = 200;
    const height = 4;
    const radius = height / 2;
    // 初始间隔宽度
    let interval = Number.isNaN(draw) && awayWin <= 5 ? 1 : 2.5;
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
    const awayWinTextWidth = awayWinText.length * textSize * 0.67;
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
    if (size) {
      verticalStack.size = new Size(size, size - 5);
      logoImage.tintColor = Color.dynamic(Color.red(), Color.white());
    }
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
  const createScoreStack = (mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, live) => {
    const mediumStack = mainStack.addStack();
    mediumStack.layoutVertically();
    const scoreLength = leftGoal.length >= 2 || rightGoal.length >= 2;
    mediumStack.size = new Size(scoreLength ? 148 : 96, lay.scoreSize);
    mediumStack.addSpacer(scoreLength ? 9 : 5);
    
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
    barStack.setPadding(2, live ? 12 : 15, 2, live ? 12 : 15);
    barStack.cornerRadius = 8;
    barStack.backgroundColor = matchStatus === '2' ? barBgColor : live ? new Color('#8226DC') : new Color('#FF4800');
    const statusText = barStack.addText(live?.category || matchStatusText);
    if (matchStatus === '2') statusText.textOpacity = 0.8;
    statusText.font = Font.boldSystemFont(12.5);
    statusText.textColor = matchStatus === '2' ? textColor : Color.white();
    statusStack.addSpacer();
    mediumStack.addSpacer(2);
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
  
  // 顶部组件
  const createTopStack = async (widget, matchId, live, pageUrl) => {
    const { header, percentage } = await getRaceSchedule(matchId);
    const { total, homeWin, draw, awayWin } = percentage || {};
    
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
    
    const infoStack = widget.addStack();
    createHeading(infoStack, headerLiveStageText);
    widget.addSpacer(2);
    
    const mainStack = widget.addStack();
    mainStack.url = live?.link || pageUrl;
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    await createStack(mainStack, leftLogo.logo, lay.imgSize, leftLogo.name);
    if (matchStatus === '0') {
      await createStack(mainStack, vsLogo, lay.vsLogoSize, null, 65);
    } else {
      createScoreStack(mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, live);
    }
    await createStack(mainStack, rightLogo.logo, lay.imgSize, rightLogo.name);
    widget.addSpacer();
    
    const progressChart = createThreeStageBar(total, homeWin, draw, awayWin);
    const imageStack = widget.addStack();
    imageStack.size = new Size(0, 28);
    imageStack.addImage(progressChart);
    return widget;
  };
  
  // 创建单独的进度条💥💥
  const createSingleProgressBar = (value, total, width, height, fillColor, reverse = false) => {
    const ctx = new DrawContext();
    ctx.size = new Size(width, height);
    ctx.opaque = false;
    ctx.respectScreenScale = true;
    const totalWidth = width;
    const radius = height / 2;
    
    // 绘制背景条
    const basePath = new Path();
    basePath.addRoundedRect(new Rect(0, 0, totalWidth, height), radius, radius);
    ctx.addPath(basePath);
    ctx.setFillColor(new Color('#cccccc', 0.5));
    ctx.fillPath();
    // 绘制前景进度条
    const progressPath = new Path();
    const progressWidth = (totalWidth * value) / total;
    if (reverse) {
      progressPath.addRoundedRect(new Rect(totalWidth - progressWidth, 0, progressWidth, height), radius, radius);
    } else {
      progressPath.addRoundedRect(new Rect(0, 0, progressWidth, height), radius, radius);
    }
    ctx.addPath(progressPath);
    ctx.setFillColor(fillColor);
    ctx.fillPath();
    return ctx.getImage();
  };
  
  // 添加技术统计结果
  const createStatText = (stack, text, width, right, left) => {
    const rowStack = stack.addStack();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, 12);
    if (left) rowStack.addSpacer();
    const rowText = rowStack.addText(`${text}`);
    rowText.font = Font.mediumSystemFont(12);
    rowText.textColor = textColor;
    if (right) rowStack.addSpacer();
    return rowText;
  };

  // 创建技术统计结果
  const createStatisticsWidget = (widget, list, matchType) => {
    const barWidth = lay.sportWidth;
    const barHeight = 6;
    
    const cleanTitle = (title) => title.replace('(%)', '').replace('总暂停数', '暂停').trim();
    if (matchType === 'basketball') {
      list.pop();
    }
    // 遍历并渲染每个统计项
    list.forEach((item, index) => {
      const isPercentage = item.title.includes('%');
      const total = isPercentage ? 100 : parseFloat(item.left) + parseFloat(item.right) || 1;
      const leftProgressBar = createSingleProgressBar(
        parseFloat(item.left),
        total,
        barWidth,
        barHeight,
        Color.red(),
        true
      );
      const rightProgressBar = createSingleProgressBar(
        parseFloat(item.right),
        total,
        barWidth,
        barHeight,
        Color.blue(),
      );
  
      const statStack = widget.addStack();
      statStack.layoutHorizontally();
      statStack.centerAlignContent();
      statStack.size = new Size(0, 12);
      const leftImage = statStack.addImage(leftProgressBar)
      leftImage.imageSize = new Size(barWidth, barHeight);
      statStack.addSpacer();
      createStatText(statStack, item.left, null, 'right');
      createStatText(statStack, cleanTitle(item.title),  matchType === 'football' ? 55 : 35);
      createStatText(statStack, item.right, null, null, 'left');
      statStack.addSpacer();
      const rightImage = statStack.addImage(rightProgressBar);
      rightImage.imageSize = new Size(barWidth, barHeight);
      if (index !== list.length - 1) {
        widget.addSpacer(matchType === 'football' ? 7 : 6);
      }
    });
    return widget;
  };
  
  // 创建赛况组件
  const createLiveWidget = async ({ matchId, matchType } = matches) => {
    const widget = new ListWidget();
    widget.setPadding(...lay.padding);
    const { live, pageUrl, stat } = await getGoalsEvents(matchId, true);
    await createTopStack(widget, matchId, live, pageUrl);
    if (family === 'large') {
      widget.addSpacer();
      if (stat?.list.length >= 10 && setting.statistics) {
        createStatisticsWidget(widget, stat.list, matchType);
      } else {
        await createMatches(widget, 8);
      }
    };
    return widget;
  };
  
  // 创建赛事列表组件
  const createWidget = async () => {
    const widget = new ListWidget();
    widget.setPadding(15, 17, 15, 17);
    const maxRows = family === 'medium' ? 6 : family === 'large' ? 15 : 6;
    const { isMatches } = await createMatches(widget, maxRows, true);
    return { widget, isMatches }; 
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中大尺寸');
    text.font = Font.systemFont(16);
    text.centerAlignText();
    return widget;
  };
  
  const runWidget = async () => {
    let widget = null;
    let isMatches = {};
    
    if (family === 'small') {
      widget = createErrorWidget();
    } else {
      ({ widget, isMatches } = await createWidget());
    }
    
    if (isMatches && Object.keys(isMatches).length) {
      const { matches } = processMatches(isMatches);
      const isFootballOrBasketball = matches?.matchType === 'football' || matches?.matchType === 'basketball';
      const isMediumSwitch = family === 'medium' && setting.autoSwitch;
      const isLargeSwitch = family === 'large' && setting.largeSwitch;
      if (matches && isFootballOrBasketball && (isMediumSwitch || isLargeSwitch)) {
        widget = await createLiveWidget(matches);
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