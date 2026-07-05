// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: volleyball-ball;
/**
 * 组件作者: 95du茅台
 * 组件名称: 体育赛事
 * 组件版本: Version 1.0.4
 * 发布时间: 2025-01-01
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
  const { count = 0 } = setting;
  const { 
    rootUrl,
    settingPath, 
    cacheImg, 
    cacheStr,
  } = module;
  
  let chooseSports = setting.selected;
  const param = args.widgetParameter?.trim();
  if (param) {
    chooseSports = setting.values.some(item => item.value == param) ? param : chooseSports;
  }
  
  const isSmall = Device.screenSize().height < 926;
  const lay = {
    sportWidth: isSmall ? 90 : 95,
    scoreSize: isSmall ? 72 : 75,
    imgSize: isSmall ? 45 : 48,
    vsLogoSize: isSmall ? 37 : 40,
    stackSize: isSmall ? 18 : 20,
    iconSize: isSmall ? 21 : 23,
    titleSize: isSmall ? 15 : 16,
    textSize: isSmall ? 12 : 13,
    padding: family === 'medium' 
      ? [14, 18, 13, 18] 
      : [15, 18, 15, 18],
  };
  
  const textColor = Color.dynamic(new Color(setting.lightColor), new Color(setting.darkColor));
  const columnColor = setting.alwaysDark 
    ? new Color(setting.dateColor) 
    : Color.dynamic(new Color(setting.lightColor), new Color(setting.dateColor));
  const barBgColor = setting.alwaysDark ? new Color('#666666') : Color.dynamic(new Color('#dddddd'), new Color('#666666'));
  const videoColor = Color.dynamic(Color.green(), Color.white());
  
  const vsLogo = 'https://ms.bdstatic.com/se/tiyu-wise/static/san/img/vs.e0d7f6f1.png';
  const goalDecision = 'https://ms.bdstatic.com/se/tiyu-wise/static/san/img/var.d2f870ba.png';
  const raceScheduleUrl = `https://tiyu.baidu.com/al/match?match=${chooseSports}`;
  const cornerIcon = await module.getCacheData(`https://gips2.baidu.com/it/u=1181162153,2900628859&fm=3028&app=3028&f=PNG&fmt=auto&q=96&size=f42_42`, 240, `corner.png`);
  const redIcon = await module.getCacheData(`https://gips3.baidu.com/it/u=2891018693,3576086173&fm=3028&app=3028&f=PNG&fmt=auto&q=96&size=f42_42`, 240, `red.png`);
  const yellowIcon = await module.getCacheData(`https://gips3.baidu.com/it/u=3015608131,3478480768&fm=3028&app=3028&f=PNG&fmt=auto&q=96&size=f42_42`, 240, `yellow.png`);
    
  /**
   * 存储当前设置
   * @param { JSON } string
   */
  const writeSettings = (setting) => {
    fm.writeString(settingPath, JSON.stringify(setting, null, 2));
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
  
  // 清理过期的文件
  const cleanExpiredFiles = (path) => {
    if (!fm.fileExists(path) || !fm.isDirectory(path)) return;
    const regex = /\d{4}-\d{2}-\d{2}/;
    const today = new Date().setHours(0, 0, 0, 0);
    fm.listContents(path)
      .filter(file => file.endsWith('.json') && regex.test(file))
      .forEach(file => {
        const fileDate = new Date(file.match(regex)[0]);
        fileDate.setHours(0, 0, 0, 0);
        if (fileDate < today) {
          const filePath = fm.joinPath(path, file);
          fm.remove(filePath);
          console.log(`Deleted expired file: ${file}`);
        }
      });
  };
  
  // 更新缓存文件
  const updateCacheFile = () => {
    const filename = `${chooseSports}.json`;
    const filePath = fm.joinPath(cacheStr, filename);
    if (fm.fileExists(filePath)) 
    fm.remove(filePath);
    cleanExpiredFiles(cacheStr);
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
      if ((Number(leftScore) > 0 || Number(rightScore) > 0 ) && 
        leftScore !== setting[matchNames].leftScore || 
        rightScore !== setting[matchNames].rightScore
      ) {
        setting[matchNames] = { leftScore, rightScore };
        writeSettings(setting);
        // 进球事件
        const events = await getGoalsEvents(matchId);
        if (events) {
          const team = events.left || events.right || {};
          const homeAway = events?.left ? '主' : '客';
          team.goal.forEach(goal => {
            const assist = goal.assistPlayerName ? `\n${goal.assistPlayerName} ( 助攻 )` : '';
            module.notify(liveScore, `${homeAway} - ${goal.playerName || team.teamName}  ( ${events.passedTime} 分钟 ) ${events.goaltype}❗️${assist}`);
          });
        } else {
          module.notify(liveScore, liveStageText);
        }
      }
    } else if (matchStatus === '2') {
      if (setting[matchNames]) {
        delete setting[matchNames];
        writeSettings(setting);
      }
    }
  };
  
  //===== 🔔 比分通知 🔔 =====//
  const sendNotice = (match, type = 'live') => {
    const left = match.leftLogo;
    const right = match.rightLogo;
    const isLive = type === 'live';
    scoreNotice(
      isLive ? match.matchId : null,
      match.matchStatus,
      isLive ? `${match.matchName} ${match.liveStageText}` : null,
      left.name,
      left.score,
      right.name,
      right.score
    );
  };
  
  // 智能跟赛
  const getLiveMatch = async () => {
    const url = `https://tiyu.baidu.com/al/match/list`;
    const html = await module.httpRequest(url, 'string');
    const match =html.match(/<!--s-data:([\s\S]*?)-->/)?.[1] || html.match(/json"\>([\s\S]*?)\n<\/script\>/)?.[1];
    const data = JSON.parse(match);
    const findLive = (tabName) => {
      const tabs = data?.tplData?.tabList || [];
      const tab = tabs.find(t => t.title === tabName);
      const list = tab?.children?.[0]?.list || [];
      return list.find(sub => sub.status === '1');
    };
    let liveMatch = findLive('热门');
    if (!liveMatch) {
      liveMatch = findLive('足球');
    }
    return liveMatch?.name || chooseSports;
  };
  
  // 获取新的赛事列表
  const getCategoryList = async () => {
    const url = 'https://sqb3.com/prod-api/category/list?type=0';
    const { data } = await module.getCacheData(url, 240, 'categoryList.json') || {};
    const categoryList = data?.twoCategoryList.find(item => item.name === chooseSports);
    return categoryList;
  };
  
  // 赛况/技术统计
  const getGoalsEvents = async (matchId, live) => {
    try {
      const fetchMatchTab = async (tabText) => {
        const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent(tabText)}`;
        const html = await module.httpRequest(url, 'string');
        const match = html.match(/<!--s-data:([\s\S]*?)-->/)?.[1];
        const value = JSON.parse(match);
        const tabsList = value.data?.data?.tabsList || value.data?.tabsList;
        return { tabsList, pageUrl: value.data?.headLive?.iframeUrl };
      };
      
      const [liveData, statData] = await Promise.all([fetchMatchTab('赛况'), fetchMatchTab('统计')]);
      if (live) {
        const getStatistics = (tabsList) => tabsList?.find((tab) => tab.data?.["line-statistics"])?.data?.["line-statistics"] || null;
        return {
          stat: getStatistics(liveData.tabsList) || getStatistics(statData.tabsList),
          pageUrl: liveData.pageUrl
        };
      }
  
      const result = liveData.tabsList?.find(tab => tab.hasTabData);
      if (result) {
        const { incidents } = result.data.graphic_incidents;
        const goalEvents = ['进球', '点球', '点球未进', '乌龙球'];
        const events = incidents.filter(event => goalEvents.includes(event.goaltype));
        return events[0] || null;
      }
    } catch (e) {
      console.log('赛况统计错误' + e);
    }
  };
  
  /**
   * 赛事分析 async_source=h5&tab_type=single&from=baidu_shoubai_na&request__node__params=1&getAll=1
   */
  const getRaceSchedule = async (matchId) => {
    try {
      const url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=${encodeURIComponent('分析')}&request__node__params=1`;
      const { tplData } = await module.httpRequest(url, 'json');
      const { header, tabsList } = tplData.data;
      const { 
        victory = 40, 
        draw = header.sports === 'basketball' ? null : 20, 
        lost = 40 
      } = tabsList?.[0]?.data?.result?.percentage || {};
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
      const url = `https://tiyu.baidu.com/al/api/match/schedules?match=${encodeURIComponent(chooseSports)}&date=${nextTime}&direction=after&from=baidu_tiyu`
      if (family === 'large') {
        const filename = `${chooseSports}_${nextTime}.json`;
        const { data } = await module.getCacheData(url, 24, filename);
        return data?.[0];
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
      } else { break };
    }
    return tabsData;
  };
  
  // 赛程
  const getRaceScheduleList = async () => {
    try {
      const url = `https://tiyu.baidu.com/al/match?match=${encodeURIComponent(chooseSports)}&tab=${encodeURIComponent('赛程')}&request__node__params=1`;
      const { tplData } = await module.getCacheData(url, 2, `${chooseSports}.json`);
      let tabsData = tplData.data.tabsList[0].data || tplData.data.tabsList[0].all.data;
      // 如果总长度小于等于15，添加对象到data的最后
      tabsData = await ensureMinimumMatches(tabsData, 30);
      
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
        // 检查是否 tabsData 只有 1 个元素，并且所有比赛都是已结束状态
        const isOnlyCompletedMatches = tabsData.length === 1 && currentList.length > 0 && nonCompletedMatches.length === 0;
        // 如果存在状态为 '2' 的比赛，优先保留最近的一场
        if (!foundMatchStatus2 && completedMatches.length > 0 && !isOnlyCompletedMatches) {
          item.list = [completedMatches[completedMatches.length - 1], ...nonCompletedMatches];
          foundMatchStatus2 = true;
        } else {
          item.list = nonCompletedMatches;
        }
        // 如果 tabsData 只有 1 条数据，并且所有比赛都是已结束的，保留所有数据
        if (isOnlyCompletedMatches) {
          item.list = currentList;  
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
      return { 
        data, 
        isMatches, 
        endMatches, 
        header: tplData.data.header
      }
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
    for (const match of data) {
      const matchStartTime = new Date(match.startTime);
      const minutesUntilStart = Math.ceil((matchStartTime - new Date()) / (60 * 1000));
      if (minutesUntilStart > 0 && minutesUntilStart <= 30) {
        module.notify(`${match.matchName} ${match.time}`, `${match.leftLogo.name} - ${match.rightLogo.name}，还剩 ${minutesUntilStart} 分钟开赛`);
        return { matches: match };
      }
    };
    
    const isMatchesStatus = data.filter(match => match.matchStatus === '1'); // 收集 1 的对象并循环
    if (isMatchesStatus.length && setting.loopEvent) {
      const optNextIndex = (num, data) => (num + 1) % data.length;
      setting.count = optNextIndex(setting.count || 0, isMatchesStatus);
      setting.matchId = isMatchesStatus[setting.count].matchId;
      writeSettings(setting);
      return { matches: isMatchesStatus[setting.count] };
    }
  };
  
  // 创建文本
  const createText = (stack, text, textSize) => {
    const rowText = stack.addText(text);
    rowText.textColor = textColor;
    rowText.font = Font.mediumSystemFont(textSize);
  };
  
  // 顶部标题
  const addHeaderStack = async (widget, header) => {
    const leagueStack = widget.addStack();
    leagueStack.layoutHorizontally();
    leagueStack.centerAlignContent();
    leagueStack.size = new Size(0, lay.iconSize);
    const leagueImg = await module.loadAndProcessLogos(header.logoimg, header.name);
    const icon = leagueStack.addImage(leagueImg)
    if (header.name.includes('法国')) {
      icon.tintColor = textColor;
    };
    leagueStack.addSpacer(12);
    createText(leagueStack, header.name, lay.titleSize);
    leagueStack.addSpacer();
    const dateFormat = setting.dateFormat ? module.formatDate(Date.now(), 'hourMin') : header.info.replace(/北京时间：|赛季/g, '');
    createText(leagueStack, dateFormat, lay.titleSize);
    if (setting.dateFormat) {
      leagueStack.addSpacer(6);
      const sf = SFSymbol.named('arrow.triangle.2.circlepath');
      sf.applyMediumWeight();
      const symbol = leagueStack.addImage(sf.image);
      symbol.imageSize = new Size(lay.stackSize, lay.stackSize);
    };
    return leagueStack;
  };
  
  // 日期栏
  const createColumnText = (stack, text) => {
    const rowText = stack.addText(text);
    rowText.textColor = columnColor;
    rowText.font = Font.systemFont(lay.textSize);
    rowText.textOpacity = 0.8;
  };
  
  const addDateColumn = (widget, item) => {
    const dateStack = widget.addStack();
    dateStack.layoutHorizontally();
    dateStack.centerAlignContent();
    dateStack.setPadding(1, 0, 1, 0);
    dateStack.backgroundColor = item.dateText.includes('今天') 
      ? new Color('#CCC400', 0.15) 
      : item.dateText.includes('明天') 
        ? new Color('#8C7CFF', 0.15) 
        : new Color('#999999', 0.18);
    const dateTexts = item.dateText.split('/');
    const timeStack = dateStack.addStack();
    timeStack.centerAlignContent();
    timeStack.size = new Size(item.dateText.length > 8 ? 85 : 46.8, 0);
    createColumnText(timeStack, dateTexts[0]);
    timeStack.addSpacer();
    createColumnText(dateStack, dateTexts[1]);
    dateStack.addSpacer();
    createColumnText(dateStack, `${item.totalMatches}场比赛`);
    widget.addSpacer(5);
    return dateStack;
  };
  
  const createTextStack = (stack, text, width, textOpacity = 1, right, left, matchStatus) => {
    const rowStack = stack.addStack();
    rowStack.layoutHorizontally();
    rowStack.centerAlignContent();
    if (width) rowStack.size = new Size(width, lay.stackSize);
    if (left) rowStack.addSpacer();
    const newName = text.replace(/足球队/g, '');
    const rowText = rowStack.addText(newName);
    rowText.font = Font.mediumSystemFont(lay.textSize);
    rowText.textOpacity = textOpacity === true || text === '全明星' ? 0.5 : 1;
    rowText.textColor = matchStatus === '1' ? Color.red() : textColor;
    if (right) rowStack.addSpacer();
    return rowText;
  };
  
  // 创建赛事列表
  const createMatches = async (widget, maxRows, showTitle) => {
    const { data, isMatches, endMatches, header } = await getRaceScheduleList();
    let rowCount = 0;
    if (rowCount < maxRows && showTitle) {
      await addHeaderStack(widget, header);
      widget.addSpacer();
      rowCount++;
    }
    
    for (const item of data) {
      if (rowCount >= maxRows) break;
      const liveMatches = item.list.filter(match => match.matchStatus === '1');
      const targetRow = liveMatches.length > 4 ? -1 : liveMatches.length > 0 ? 1 : 2;
      
      if (rowCount + 1 < maxRows && (rowCount === targetRow || family !== 'medium')) {
        addDateColumn(widget, item);
        rowCount++;
      }
      
      for (const match of item.list) {
        if (rowCount >= maxRows) break;
        const { time, matchType, matchStatus, hasLiveOrFlash, leftLogo, rightLogo, matchStage } = match;
        const textOpacity = match.matchStatus === '2';
        // 赛程、事件通知
        if ((!setting.autoSwitch || family === 'large') && matchStatus === '1' && match.liveStageText) {
          sendNotice(match, 'live');
        } else {
          endMatches.forEach(item => {
            sendNotice(item, 'end');
          });
        }
        
        // 检查是否即将开赛小于等于 1 小时
        const startTime = new Date(match.startTime || match.startTimeStamp * 1000);
        const startTimeDiff = (startTime - new Date()) / (60 * 1000);
        if (startTimeDiff > -180 && startTimeDiff <= 60 && showTitle) {
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
        const leftLogoName = leftLogo.name.replace('/', '_');
        const homeImg = await module.getCacheData(leftLogo.logo, 240, `${leftLogoName}.png`);
        const homeIcon = stack.addImage(homeImg);
        homeIcon.imageSize = new Size(lay.stackSize, lay.stackSize);
        stack.addSpacer(8);
        // 主队名称
        createTextStack(stack, leftLogo.name, null, textOpacity, 'right');
        // 比分栏
        const typeSize = matchType === 'basketball' ? 80 : 52;
        const scoreColumn = matchStage === '全明星' && matchStatus === '0' ? matchStage : `${leftLogo.score} - ${rightLogo.score}`;
        createTextStack(stack, scoreColumn, typeSize, textOpacity, 'right', 'left', matchStatus);
        // 客队名称
        createTextStack(stack, rightLogo.name, null, textOpacity, null, 'left');
        stack.addSpacer(6);
        // 客队图标
        const rightLogoName = rightLogo.name.replace('/', '_');
        const awayImg = await module.getCacheData(rightLogo.logo, 240, `${rightLogoName}.png`);
        const awayIcon = stack.addImage(awayImg);
        awayIcon.imageSize = new Size(lay.stackSize, lay.stackSize);
        rowCount++;
      }
    }
    return { isMatches };
  };
  
  // 三段进度条 🇩🇪🇩🇪🇩🇪
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
    ctx.setFont(font);
    ctx.setTextColor(Color.blue());
    const textWidth = awayWinText.includes('1') ? 0.67 : 0.73
    const awayWinTextWidth = awayWinText.length * textSize * textWidth;
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
  
  // 中间容器
  const createStack = async (mainStack, logoUrl, imgSize, teamName, size) => {
    const verticalStack = mainStack.addStack();
    verticalStack.layoutVertically();
    verticalStack.size = new Size(size || 0, size ? size - 5 : lay.scoreSize);
    const logoStack = verticalStack.addStack();
    logoStack.layoutHorizontally();
    logoStack.addSpacer();
    const logo = await module.getCacheData(logoUrl, 240, `${teamName || 'vsLogo'}.png`);
    const logoImage = logoStack.addImage(logo);
    logoImage.imageSize = new Size(imgSize, imgSize);
    logoStack.addSpacer();
    verticalStack.addSpacer();
    if (teamName) {
      const titleStack = verticalStack.addStack();
      titleStack.centerAlignContent();
      titleStack.size = new Size(0, 14)
      titleStack.addSpacer();
      const newName = teamName.replace(/足球队/g, '');
      const titleText = titleStack.addText(newName);
      titleText.font = Font.mediumSystemFont(13.5);
      titleText.textColor = textColor;
      titleStack.addSpacer();
    }
    return verticalStack;
  };
  
  // 比分栏
  const createScoreStack = (mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, liveStage) => {
    const mediumStack = mainStack.addStack();
    mediumStack.layoutVertically();
    const scoreLength = leftGoal.length >= 2 || rightGoal.length >= 2;
    mediumStack.size = new Size(scoreLength ? 165 : 125, lay.scoreSize);
    mediumStack.addSpacer(scoreLength ? 9 : 5);
    
    const scoreStack = mediumStack.addStack();
    scoreStack.layoutHorizontally();
    scoreStack.addSpacer();
    const scoreText = scoreStack.addText(`${leftGoal}  -  ${rightGoal}`);
    scoreText.font = Font.mediumSystemFont(scoreLength ? 30 : 33);
    scoreText.textColor = textColor;
    scoreStack.addSpacer();
    mediumStack.addSpacer();
    const statusStack = mediumStack.addStack();
    statusStack.layoutHorizontally();
    statusStack.addSpacer();
    const barStack = statusStack.addStack();
    barStack.setPadding(3, 15, 3, 15);
    barStack.cornerRadius = 8;
    barStack.backgroundColor = matchStatus === '2' 
      ? barBgColor 
      : liveStage === '中场' 
        ? new Color('#8226DC') 
        : liveStage === '点球决战' 
          ? new Color('#FF0000')
          : new Color('#FF4800');
    const statusText = barStack.addText(matchStatus === '1' && liveStage === '中场' 
      ? '中场休息' 
      : liveStage === '点球决战' 
        ? liveStage
        : matchStatusText);
        
    statusText.font = Font.boldSystemFont(12.5);
    statusText.textColor = matchStatus === '2' ? textColor : Color.white();
    if (matchStatus === '2') statusText.textOpacity = 0.8;
    statusStack.addSpacer();
    mediumStack.addSpacer(0.5);
    return mediumStack;
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
    infoText.font = Font.systemFont(14);
    infoText.textColor = textColor; 
    infoStack.addSpacer();
  };
  
  // 顶部组件
  const createTopStack = async (widget, matchId, pageUrl) => {
    const { header, percentage } = await getRaceSchedule(matchId);
    const { total, homeWin, draw, awayWin } = percentage || {};
    
    const { matchStatus, matchStatusText, matchDesc, dateFormat, liveStageTime, liveStage, liveStageText, leftLogo, leftGoal, rightLogo, rightGoal } = header || {};
    
    const safeMatchDesc = (matchDesc || '').replace(/nba/gi, 'NBA');
    const liveStageSuffix = liveStage === '中场' || matchStatus !== '1' 
      ? dateFormat 
      : liveStage.includes('完')
      ? `${liveStageText} ${liveStageTime}`
      : liveStageText;
    const headerLiveStageText = `${safeMatchDesc}  ${liveStageSuffix}`;
    
    const infoStack = widget.addStack();
    createHeading(infoStack, headerLiveStageText);
    widget.addSpacer(2);
    
    const mainStack = widget.addStack();
    mainStack.layoutHorizontally();
    mainStack.centerAlignContent();
    mainStack.url = `https://tiyu.baidu.com/al/live/detail?matchId=${matchId}&tab=赛况`;
    await createStack(mainStack, leftLogo.logo, lay.imgSize, leftLogo.name);
    if (matchStatus === '0') {
      await createStack(mainStack, vsLogo, lay.vsLogoSize, null, 65);
    } else {
      createScoreStack(mainStack, leftGoal, rightGoal, matchStatus, matchStatusText, liveStage);
    }
    await createStack(mainStack, rightLogo.logo, lay.imgSize, rightLogo.name);
    widget.addSpacer();
    
    const progressChart = createThreeStageBar(total, homeWin, draw, awayWin);
    const imageStack = widget.addStack();
    imageStack.size = new Size(0, 28);
    imageStack.addImage(progressChart);
    
    // ===== 🔔 比分通知 🔔 ===== //
    scoreNotice(matchId, matchStatus, headerLiveStageText, leftLogo.name, leftGoal, rightLogo.name, rightGoal);
    return widget;
  };
  
  // 创建单独的进度条🧡🧡🧡
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
  };
  
  // 角球红牌黄牌事件 ❤️💛
  const parseStats = (data) => {
    const list = data?.list || [];
    const map = new Map(list.map(i => [i.title, i]));
    const get = (title, side) => map.get(title)?.[side] ?? 0;
    return {
      left: {
        corner: get('角球', 'left'),
        yellow: get('黄牌', 'left'),
        red: get('红牌', 'left')
      },
      right: {
        corner: get('角球', 'right'),
        yellow: get('黄牌', 'right'),
        red: get('红牌', 'right')
      }
    };
  };
  
  const matchEventsLeft = (stack, event, eventIcon) => {
    const icon = stack.addImage(eventIcon);
    icon.imageSize = new Size(18, 18);
    stack.addSpacer(2);
    const eventText = stack.addText(String(event));
    eventText.font = Font.mediumSystemFont(14);
    eventText.textColor = textColor;
  };
  
  const matchEventsRight = (stack, event, eventIcon) => {
    const eventText = stack.addText(String(event));
    eventText.font = Font.mediumSystemFont(14);
    eventText.textColor = textColor;
    stack.addSpacer(2);
    const icon = stack.addImage(eventIcon);
    icon.imageSize = new Size(18, 18);
  };
  
  const matchEventsColumnStack = async (widget, left, right) => {
    const stack = widget.addStack();
    stack.layoutHorizontally();
    stack.bottomAlignContent();
    matchEventsLeft(stack, left.corner, cornerIcon);
    stack.addSpacer(5);
    matchEventsLeft(stack, left.red, redIcon);
    stack.addSpacer(5);
    matchEventsLeft(stack, left.yellow, yellowIcon);
    stack.addSpacer();
    const vsIcon = await module.getCacheData(vsLogo, 240, `vsLogo.png`);
    const icon = stack.addImage(vsIcon);
    icon.imageSize = new Size(18, 18);
    stack.addSpacer();
    matchEventsRight(stack, right.yellow, yellowIcon);
    stack.addSpacer(5);
    matchEventsRight(stack, right.red, redIcon);
    stack.addSpacer(5);
    matchEventsRight(stack, right.corner, cornerIcon);
    widget.addSpacer();
    return stack;
  };
  
  // 创建技术统计列表
  const createStatisticsWidget = (widget, list, matchType, matchId) => {
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
  const createLiveWidget = async ({ matchId, matchType, matchStatus, leftLogo, rightLogo } = matches) => {
    const widget = new ListWidget();
    widget.setPadding(...lay.padding);
    const events = await getGoalsEvents(matchId, true);
    const { pageUrl, stat } = events;
    await createTopStack(widget, matchId, pageUrl);
    if (family === 'large') {
      widget.addSpacer();
      if (stat?.list.length && matchStatus !== '0' && setting.events && !setting.statistics) {
        const { left, right } = parseStats(stat);
        matchEventsColumnStack(widget, left, right);
      } 
      if (stat?.list.length >= 10 && setting.statistics) {
        createStatisticsWidget(widget, stat.list, matchType, matchId);
      } else {
        await createMatches(widget, (setting.events && stat && matchStatus !== '0' ? 7 : 8));
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
    const { matches } = processMatches(isMatches) || {};
    if (setting.matchFollow && isMatches[0]?.status !== '1') {
      const liveName = await getLiveMatch();
      setting.selected = liveName;
      writeSettings(setting);
    }
    return { widget, matches }; 
  };
  
  const createErrorWidget = () => {
    const widget = new ListWidget();
    const text = widget.addText('仅支持中大尺寸');
    text.font = Font.systemFont(16);
    text.textColor = textColor;
    text.centerAlignText();
    return widget;
  };
  
  const runWidget = async () => {
    let { widget, matches } = await createWidget();
    
    if (family === 'small') {
      widget = createErrorWidget();
    }
    
    if (matches) {
      const isMediumSwitch = family === 'medium' && setting.autoSwitch;
      const isLargeSwitch = family === 'large' && setting.largeSwitch;
      if (isMediumSwitch || isLargeSwitch) {
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