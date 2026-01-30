// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: superscript;
class CodeMaker {
  constructor(codeMaker, sel = {}) {
    this.codeMaker = codeMaker;
    this.Data = sel.Data || {};
    this.drawRows = sel.drawRows;
    this.billData = sel.bill;
    this.logData = sel.log;
    this.css = this.css();
    this.drawnumber = this.drawnumber();
    this.historyBill = this.historyBill();
    this.quickSelectLog = this.quickSelectLog();
  }
  
  // 回放统计
  replayScript = (statData) => {
    return `document.addEventListener('DOMContentLoaded', () => {
      if (window.template) {
        template.helper("rpl_color", function(t) {
          if (!t) return '';
          return String(t).replace(/\\[([a-zA-Z0-9,\.\u4e00-\u9fa5,-]*)?\\]/g, (_, e) => "<span class='red'>" + e + "</span>");
        });
      }
      
      let normalResult = {};
      let assignResult = {};
    
      const renderNormal = () => {
        if (!window.template) return;
        const tbody = document.getElementById('normal_tbody')
        tbody.innerHTML = template('tpl_normal', { Data: normalResult.records || [] });
        document.getElementById('normal_summary').innerHTML =
          template('tpl_summary_text', {
            title: normalResult.title,
            summary: normalResult.summary,
            desc: normalResult.desc
          });
      };
    
      const renderAssign = () => {
        if (!window.template) return;
        const tbody = document.getElementById('assign_tbody')
        tbody.innerHTML = template('tpl_assign', { Data: assignResult.records || [] });
        document.getElementById('assign_summary').innerHTML =
          template('tpl_summary_text', {
            title: assignResult.title,
            summary: assignResult.summary
          });
      };
    
      window.renderReplay = (data) => {
        if (!data) return;
        normalResult = data.normal || {};
        assignResult = data.simulate || {};
        renderNormal();
        renderAssign();
      };
    
      // 构建下拉选项
      const buildSelect = (id, list, valueKey, labelKey, title) => {
        const select = document.getElementById(id);
        if (!select) return;
        select.innerHTML = '';
        const header = document.createElement('option');
        header.textContent = title;
        header.value = '';
        header.disabled = true;
        header.selected = true;
        select.appendChild(header);
        list.forEach(item => {
          const option = document.createElement('option');
          option.value = item[valueKey];
          option.textContent = item[labelKey];
          select.appendChild(option);
        });
      };
    
      // 初始化选择器 + 默认显示今日数据
      const initSelectors = (meta) => {
        buildSelect('ruleSelect', meta.rules, 'id', 'label', '选择规则');
        buildSelect('dateSelect', meta.dates, 'value', 'label', '选择日期');
        const rule = document.getElementById('ruleSelect');
        const date = document.getElementById('dateSelect');
        if (rule.options[1]) rule.selectedIndex = 1;
        if (date.options[1]) date.selectedIndex = 1;
        window.renderReplay(meta);
      };
    
      // 选择变化时触发回放
      const sendQuery = () => {
        const dateSelect = document.getElementById('dateSelect');
        const ruleSelect = document.getElementById('ruleSelect');
        if (!dateSelect.value || !ruleSelect.value) return;
        window.dispatchEvent(new CustomEvent('JBridge', {
          detail: {
            type: 'query',
            date: dateSelect.value,
            ruleId: ruleSelect.value
          }
        }));
      };
      
      ['dateSelect', 'ruleSelect'].forEach(id => {
        const sel = document.getElementById(id);
        sel.onchange = sendQuery;
      });
    
      // 模式切换
      window.showModule = (id) => {
        if (id === 'normal') renderNormal();
        if (id === 'assign') renderAssign();
        document.querySelectorAll('[name="module"]').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
        const module = document.querySelector('.module');
        [target, module].forEach(el => el && (el.scrollTop = 0));
        const tabMap = { normal: 'tab_normal', assign: 'tab_assign' };
        document.querySelectorAll('.mode-tab').forEach(tab => {
          tab.classList.remove('active', 'blue', 'orange');
        });
        const activeTab = document.getElementById(tabMap[id]);
        if (activeTab) activeTab.classList.add('active', id === 'normal' ? 'blue' : 'orange');
      };
    
      document.querySelectorAll('.header-tabs span').forEach(tab => {
        tab.addEventListener('click', () => {
          const id = tab.dataset.module;
          if (id) showModule(id);
        });
      });
    
      showModule('normal');
      initSelectors(${JSON.stringify(statData)});
    })`
  };

  // 回放 HTML
  replayHtml = (statData) => {
    const replayScript = this.replayScript(statData);
    return `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
      <style>
        ${this.css}
        body { 
          font-family: -apple-system,Arial;
        }
        
        .t-1 .bg3 td {
          background:#e3f5fd;
        }
        
        .header {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 5rem;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
      
        /* 模式切换按钮 */
        .mode-switch {
          display: flex;
          background: #eee;
          border-radius: 22px;
          padding: 4px;
          gap: 12px;
        }
        
        .mode-tab {
          min-width: 90px;
          padding: 8px 18px;
          text-align: center;
          font-size: 15px;
          font-weight: 600;
          border-radius: 22px;
          cursor: pointer;
          transition: all .25s ease;
          background: #ddd;
          color: #111;
        }
        
        .mode-tab.active {
          color: #fff;
          box-shadow: 0 3px 8px rgba(0,0,0,.18);
        }
        
        .mode-tab.blue.active {
          background: #008DFF;
        }
        
        .mode-tab.orange.active {
          background: #ff7800;
        }
        
        .module {
          position: absolute;
          top: calc(5.5rem + 3rem);
          bottom: 0;
          left: 0; 
          right: 0;
          overflow-y: auto;
        }
        
        [name="module"] {
          display: none;
        }
        [name="module"].active {
          display: block;
        }
        
        .selectTab {
          margin-top: 5.5rem;
          background: #eee;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }
        
        .select {
          outline: none;
          font-size: 15px;
          color: #fff;
          border-radius: 22px;
          padding: 5px 15px;
          text-align-last: center;
          white-space: nowrap;
          overflow: hidden;
          appearance: none;
          width: 130px;
        }
        
        .select.purple {
          background-color: #8B5FF4;
        }
        .select.green {
          background-color: #00C300;
        }
        
        .summary-text {
          margin-bottom: 18px;
          background: #fff;
          overflow: hidden;
          border: 1px solid #e5e5ea;
          box-sizing: border-box;
          font-size: 15px;
          color: #111;
        }
        
        .summary-text.normal {
          border-color: #cfe7ff;
          background: #f3f8ff;
        }
        
        .summary-text.assign {
          border-color: #ffd8bd;
          background: #fff9f3;
        }
        
        .summary-row {
          padding: 4px 10px;
          line-height: 1.8;
          border-bottom: 1px solid #e5e5ea;
        }
        
        .summary-text.normal 
        .summary-row {
          border-bottom: 1px solid #cfe7ff;
        }
        
        .summary-text.assign 
        .summary-row {
          border-bottom: 1px solid #ffd8bd;
        }
        
        .summary-text .summary-row:last-of-type {
          border-bottom: none;
        }
        
        .summary-text.normal 
        .summary-title {
          background: #e9f2ff;
        }
        
        .summary-text.assign 
        .summary-title {
          background: #fff1e7;
        }
        
        .summary-title {
          line-height: 20px;
          padding: 8px 10px;
        }
        
        .summary-pair {
          display: flex;
          justify-content: space-between;
        }
      </style>
    </head>
    <body>
      <div id="header" class="header">
        <div class="mode-switch header-tabs">
          <span id="tab_normal" class="mode-tab blue" data-module="normal">普通规则</span>
          <span id="tab_assign" class="mode-tab orange" data-module="assign">指定规则</span>
        </div>
      </div>
      <div class="tc selectTab">
        <select class="select purple" id="ruleSelect"></select>
        <select class="select green" id="dateSelect"></select>
      </div>
      <div class="module">
        <div name="module" id="normal" class="m5 mt10">
          <div class="summary-text normal" id="normal_summary"></div>
          <table class="t-1">
            <thead>
              <tr class="bg2 tc">
                <td>命中</td>
                <td>时间</td>
                <td>期号</td>
                <td>开奖</td>
                <td>动作</td>
                <td>盈亏</td>
                <td>常规</td>
              </tr>
            </thead>
            <tbody id="normal_tbody" class="fn-hover tc"></tbody>
          </table>
        </div>
        <div name="module" id="assign" class="m5 mt10">
          <div class="summary-text assign" id="assign_summary"></div>
          <table class="t-1">
            <thead>
              <tr class="bg2 tc">
                <td>命中</td>
                <td>时间</td>
                <td>期号</td>
                <td>开奖</td>
                <td>动作</td>
                <td>盈亏</td>
                <td>强投</td>
              </tr>
            </thead>
            <tbody id="assign_tbody" class="fn-hover tc"></tbody>
          </table>
        </div>
        <script type="text/html" id="tpl_summary_text">
          <div class="summary-row summary-title">
            {{= rpl_color(title) }}
          </div>
          <div class="summary-row summary-pair">
            <span>{{summary.desc}}</span><span>赔率：{{summary.water}}</span>
          </div>
          <div class="summary-row summary-pair">
            <span style="{{summary.profit > 0 ? 'color:#008DFF' : 'color:#FF0000'}}">今日盈亏：{{summary.profit}}</span>
            <span style="{{summary.total > 0 ? 'color:#008DFF' : 'color:#FF0000'}}">记录汇总：{{summary.total || 0}}</span>
          </div>
          <div class="summary-row summary-pair"><span>命中：{{summary.win}}</span><span>未中：{{summary.lose}}</span>
          </div>
          <div class="summary-row summary-pair"><span>未投：{{summary.unbet}}</span><span>净胜：{{summary.score}}</span>
          </div>
        </script>
        <script type="text/html" id="tpl_normal">
          {{if !Data.length}}
          <tr>
            <td colspan="6">暂无数据</td>
          </tr>
          {{else}}
            {{each Data as item i}}
              <tr>
                <td>{{item.hit_icon}}</td>
                <td>{{item.time}}</td>
                <td>{{item.period_no}}</td>
                <td>
                  <a>{{item.open_code}}</a>
                </td>
                <td>{{item.action}}</td>
                <td style='color:#008DFF'>
                  {{item.profit}}
                </td>
                <td></td>
              </tr>
            {{/each}}
          {{/if}}
        </script>
        <script type="text/html" id="tpl_assign">
          {{if !Data.length}}
          <tr>
            <td colspan="7">暂无数据</td>
          </tr>
          {{else}}
            {{each Data as item i}}
              <tr>
                <td>{{item.hit_icon}}</td>
                <td>{{item.time}}</td>
                <td>{{item.period_no}}</td>
                <td>
                  <a>{{item.open_code}}</a>
                </td>
                <td>{{item.action}}</td>
                <td style='color:#008DFF'>
                {{item.profit}}</td>
                <td>{{item.forced ? '⚠️' : '-'}}</td>
              </tr>
            {{/each}}
          {{/if}}
        </script>
      </div>
      <script>
        ${this.codeMaker}
        ${replayScript}
      </script>
    </body>
    </html>`;
  };
  
  // 日志解析 → options
  parseToOptions = (text) => {
    const o = {
      symbol: "X",
      isXian: 0,
      numberType: 40,
      firstNumber: "",
      secondNumber: "",
      thirdNumber: "",
      fourthNumber: "",
      fifthNumber: "",
      positionType: 0,
      positionFilter: 0,
      fixedPositions: [0,0,0,0],
      symbolPositions: [],
      remainFixedFilter: -1,
      remainFixedNumbers: [],
      remainMatchFilter: -1,
      remainMatchNumbers: [],
      remainMatchFilterThree: -1,
      remainMatchNumbersThree: [],
      remainValueRanges: [], 
      transformNumbers: [],
      fullTransform: false,
      upperNumbers: [],
      upPrize: false,
      exceptNumbers: [],
      containFilter: -1,
      containNumbers: [],
      repeatTwoWordsFilter: -1,
      repeatDoubleWordsFilter: -1,
      repeatThreeWordsFilter: -1,
      repeatFourWordsFilter: -1,
      twoBrotherFilter: -1,
      threeBrotherFilter: -1,
      fourBrotherFilter: -1,
      logarithmNumberFilter: -1,
      logarithmNumbers: [ [] ],
      oddNumberFilter: -1,
      oddNumberPositions: [0,0,0,0],
      evenNumberFilter: -1,
      evenNumberPositions: [0,0,0,0],
      bigNumberFilter: -1,
      bigNumberPositions: [0,0,0,0],
      smallNumberFilter: -1,
      smallNumberPositions: [0,0,0,0],
    };
  
    // 定位类型
    if (text.includes("四定位")) o.numberType = 40;
    
    // 定位置 [取/除]（千/百/十/个）
    const positionMatch = text.match(/定位置“(取|除)”：([^；]+)/);
    if (positionMatch) {
      o.positionFilter = positionMatch[1] === "取" ? 0 : 1;
      const nums = {};
      const numMatch = positionMatch[2].match(/(千|百|十|个)=([0-9]+)/g);
      if (numMatch) {
        numMatch.forEach(item => {
          const m = item.match(/(千|百|十|个)=([0-9]+)/);
          if (m) nums[m[1]] = m[2];
        });
      }
      o.firstNumber  = nums["千"];
      o.secondNumber = nums["百"];
      o.thirdNumber  = nums["十"];
      o.fourthNumber = nums["个"];
      o.positionType = 0;
    }
    
    // 配数 [取/除]
    const peishuMatch = text.match(/配数“(取|除)”/);
    if (peishuMatch) {
      const m1 = text.match(/第1位：([0-9]+)/);
      const m2 = text.match(/第2位：([0-9]+)/);
      const m3 = text.match(/第3位：([0-9]+)/);
      const m4 = text.match(/第4位：([0-9]+)/);
      if (m1) o.firstNumber  = m1[1];
      if (m2) o.secondNumber = m2[1];
      if (m3) o.thirdNumber  = m3[1];
      if (m4) o.fourthNumber = m4[1];
      o.positionType = 1;
      o.positionFilter = peishuMatch[1] === '除' ? 1 : 0;
    }
  
    // 固定合分 [取/除]
    const parseFixedRemain = (text, o) => {
      o.remainFixedNumbers = [];
      o.remainFixedFilter = -1;
      const groups = text.split('；').map(s => s.trim()).filter(Boolean);
      groups.forEach(group => {
        const typeMatch = group.match(/固定合分(取值|除值)/);
        const type = typeMatch ? typeMatch[1] : '取值';
        const contentMatch = group.match(/内容：([0-9]+)/);
        if (!contentMatch) return;
        const content = contentMatch[1].split('');
        const posMatches = Array.from(group.matchAll(/第(\d)位选中/g));
        const posArray = [0,0,0,0];
        posMatches.forEach(m => {
          const idx = Number(m[1]) - 1;
          if (idx >=0 && idx < 4) posArray[idx] = 1;
        });
        o.remainFixedNumbers.push([posArray, content]);
        o.remainFixedFilter = type === '取值' ? 0 : 1;
      });
      return o;
    };
    parseFixedRemain(text, o);
    
    // 不定合分值(两数合)
    const twoMatch = text.match(/不定合分值\(两数合\)：([0-9]+)/);
    if (twoMatch) {
      o.remainMatchFilter = 2;
      o.remainMatchNumbers = twoMatch[1].split('');
    }
    
    // 不定合分值(三数合)
    const threeMatch = text.match(/不定合分值\(三数合\)：([0-9]+)/);
    if (threeMatch) {
      o.remainMatchFilterThree = 3;
      o.remainMatchNumbersThree = threeMatch[1].split('');
    }
  
    // 合分值范围
    const range = text.match(/合分值范围：([0-9]+)-([0-9]+)/);
    if (range) o.remainValueRanges = [Number(range[1]), Number(range[2])];
  
    // 包含取/除
    const containMatch = text.match(/包含“(取|除)”数：([0-9]+)/);
    if (containMatch) {
      o.containFilter = containMatch[1] === "取" ? 0 : 1;
      o.containNumbers = containMatch[2].split('');
    }
  
    // 双重、双双重、三重、四重 除
    if (/[^双]双重“除”/.test(text)) o.repeatTwoWordsFilter = 1;
    if (/双双重“除”/.test(text)) o.repeatDoubleWordsFilter = 1;
    if (/三重“除”/.test(text)) o.repeatThreeWordsFilter = 1;
    if (/四重“除”/.test(text)) o.repeatFourWordsFilter = 1;
  
    // 兄弟 除
    if (text.includes("二兄弟“除”")) o.twoBrotherFilter = 1;
    if (text.includes("三兄弟“除”")) o.threeBrotherFilter = 1;
    if (text.includes("四兄弟“除”")) o.fourBrotherFilter = 1;
  
    // 全转数
    const transform = text.match(/全转数：([0-9]+)/);
    if (transform) {
      o.fullTransform = true;
      o.transformNumbers = transform[1].split('');
    }
    
    // 上奖数
    const upper = text.match(/上奖数：([0-9]+)/);
    if (upper) {
      o.upPrize = true;
      o.upperNumbers = upper[1].split('');
    }
    
    // 排除数
    const except = text.match(/排除数：([0-9]+)/);
    if (except) {
      o.exceptNumbers = except[1].split('');
    }
  
    // 对数 取/除
    if (text.includes("对数“取”")) o.logarithmNumberFilter = 0;
    if (text.includes("对数“除”")) o.logarithmNumberFilter = 1;
    const logMatches = [...text.matchAll(/\d{1,2}/g)];
    if (logMatches.length) {
      o.logarithmNumbers = logMatches
        .slice(0, 5)
        .map(m => m[0].split(""));
    }
  
    // 单数 取/除
    const oddMatch = text.match(/单数“(取|除)”数：(.+?)(?=，(双数|大数|小数)|$)/);
    if (oddMatch) {
      o.oddNumberFilter = oddMatch[1] === "取" ? 0 : 1;
      o.oddNumberPositions = [0,0,0,0];
      [...oddMatch[2].matchAll(/第(\d+)位/g)].forEach(m => {
        const idx = Number(m[1])-1;
        if (idx>=0 && idx<4) o.oddNumberPositions[idx] = 1;
      });
    }
  
    // 双数 取/除
    const evenMatch = text.match(/双数“(取|除)”数：(.+?)(?=，(单数|大数|小数)|$)/);
    if (evenMatch) {
      o.evenNumberFilter = evenMatch[1] === "取" ? 0 : 1;
      o.evenNumberPositions = [0,0,0,0];
      [...evenMatch[2].matchAll(/第(\d+)位/g)].forEach(m => {
        const idx = Number(m[1])-1;
        if (idx>=0 && idx<4) o.evenNumberPositions[idx] = 1;
      });
    }
  
    // 大数 取/除
    const bigMatch = text.match(/大数“(取|除)”数：(.+?)(?=，(单数|双数|小数)|$)/);
    if (bigMatch) {
      o.bigNumberFilter = bigMatch[1] === "取" ? 0 : 1;
      o.bigNumberPositions = [0,0,0,0];
      [...bigMatch[2].matchAll(/第(\d+)位/g)].forEach(m => {
        const idx = Number(m[1])-1;
        if (idx>=0 && idx<4) o.bigNumberPositions[idx] = 1;
      });
    }
  
    // 小数 取/除
    const smallMatch = text.match(/小数“(取|除)”数：(.+?)(?=，(单数|双数|大数)|$)/);
    if (smallMatch) {
      o.smallNumberFilter = smallMatch[1] === "取" ? 0 : 1;
      o.smallNumberPositions = [0,0,0,0];
      [...smallMatch[2].matchAll(/第(\d+)位/g)].forEach(m => {
        const idx = Number(m[1])-1;
        if (idx>=0 && idx<4) o.smallNumberPositions[idx] = 1;
      });
    }
  
    return o;
  }
  
  // 判断是否为 4 位号码数组输入
  isPureNumbersInput = (text) =>
    /^(\d{4})(\s*,\s*\d{4})*$/.test(text.trim());
  
  // 解析成号码数组
  parseNumber = (text) => text
    .replace(/\s+/g, '')
    .split(',')
    .filter(n => /^\d{4}$/.test(n));
  
  // 转换号码 js
  logScript = (input, options, log = '', money = '01') => {
    const isArrayMode = this.isPureNumbersInput(input);
    const rawNumbers = isArrayMode ? this.parseNumber(input) : [];
    
    return `
    const kx = window.__kx = new Kuaixuan({ json: { Param: {} } });
    window.invoke = (data) => {
      window.dispatchEvent(new CustomEvent('JBridge', { detail: { data } }))
    }
    
    // 隐私规则参数
    const fakeParam = {
      "symbol": "X",
      "isXian": 0,
      "firstNumber": "",
      "secondNumber": "",
      "thirdNumber": "",
      "fourthNumber": "",
      "fifthNumber": "",
      "numberType": 40,
      "positionType": 0,
      "positionFilter": 0,
      "remainFixedFilter": 0,
      "remainFixedNumbers": [[ [1, 1, 1, 1], ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] ]],
      "remainMatchFilter": -1,
      "remainMatchFilterThree": -1,
      "remainMatchNumbers": [],
      "remainMatchNumbersThree": [],
      "remainValueRanges": [6, 28],
      "transformNumbers": [],
      "upperNumbers": [],
      "exceptNumbers": [],
      "fixedPositions": [0,0,0,0],
      "symbolPositions": [],
      "containFilter": -1,
      "containNumbers": [],
      "multipleFilter": 0,
      "multipleNumbers": [],
      "repeatTwoWordsFilter": -1,
      "repeatThreeWordsFilter": 1,
      "repeatFourWordsFilter": 1,
      "repeatDoubleWordsFilter": 1,
      "twoBrotherFilter": 0,
      "threeBrotherFilter": 1,
      "fourBrotherFilter": 1,
      "logarithmNumberFilter": -1,
      "logarithmNumbers": [[]],
      "oddNumberFilter": -1,
      "oddNumberPositions": [0,0,0,0],
      "evenNumberFilter": -1,
      "evenNumberPositions": [0,0,0,0],
      "bigNumberFilter": -1,
      "bigNumberPositions": [0,0,0,0],
      "smallNumberFilter": -1,
      "smallNumberPositions": [0,0,0,0]
    }

    const showTips = (msg, duration = 1500) => {
      const tips = document.getElementById("tips");
      const text = tips.querySelector("span");
      text.textContent = msg;
      tips.classList.remove("hide");
      tips.classList.add("show");
      clearTimeout(tips.timer);
      tips.timer = setTimeout(() => {
        tips.classList.remove("show");
        tips.classList.add("hide");
      }, duration);
    };
    
    const setLogs = (log, o) => {
      if (log.includes("二兄弟“取”")) o.twoBrotherFilter = 0;
      if (log.includes("三兄弟“取”")) o.threeBrotherFilter = 0;
      if (log.includes("四兄弟“取”")) o.fourBrotherFilter = 0;
      if (log.includes("双双重“取”")) o.repeatDoubleWordsFilter = 0;
      if (log.includes("双重“取”") && !log.includes("双双重“取”")) o.repeatTwoWordsFilter = 0;
      if (log.includes("三重“取”")) o.repeatThreeWordsFilter = 0;
      if (log.includes("四重“取”")) o.repeatFourWordsFilter = 0;
      if (log.includes("单数“取”")) o.oddNumberFilter = 0;
      if (log.includes("双数“取”")) o.evenNumberFilter = 0;
      if (log.includes("大数“取”")) o.bigNumberFilter = 0;
      if (log.includes("小数“取”")) o.smallNumberFilter = 0;
    };
    
    // 初始化 checkbox 状态
    const checkboxMap = [
      { selector: '.repeat-words-filter[data-level="2"]', field: 'repeatTwoWordsFilter' },
      { selector: '.repeat-words-filter[data-level="double"]', field: 'repeatDoubleWordsFilter' },
      { selector: '.repeat-words-filter[data-level="3"]', field: 'repeatThreeWordsFilter' },
      { selector: '.repeat-words-filter[data-level="4"]', field: 'repeatFourWordsFilter' },
      { selector: '.brother-filter[data-level="2"]', field: 'twoBrotherFilter' },
      { selector: '.brother-filter[data-level="3"]', field: 'threeBrotherFilter' },
      { selector: '.brother-filter[data-level="4"]', field: 'fourBrotherFilter' },
      { selector: '.odd-number-filter[data-level="odd"]', field: 'oddNumberFilter', type: 'odd' },
      { selector: '.even-number-filter[data-level="even"]', field: 'evenNumberFilter', type: 'even' },
      { selector: '.big-number-filter[data-level="big"]', field: 'bigNumberFilter', type: 'big' },
      { selector: '.small-number-filter[data-level="small"]', field: 'smallNumberFilter', type: 'small' },
    ];
    
    const apply = (maker, type) => {
      const o = maker.options;
      if (o.positionType === 1) {
        const hasPei =
          o.firstNumber ||
          o.secondNumber ||
          o.thirdNumber ||
          o.fourthNumber;
        if (!hasPei) showTips("配数模式下必须输入❗️");
      }
      maker.log();
      maker.generate();
      if (type && window.__kx?.produceWord) {
        window.__kx.produceWord(type);
      }
    };
    
    const bindCheckboxGroup = (maker, { selector, field, type }) => {
      const checkboxes = document.querySelectorAll(selector);
      checkboxes.forEach(cb => {
        const v = maker.options[field];
        const action = cb.dataset.action;
        cb.checked =
          (v === 0 && action === 'include') ||
          (v === 1 && action === 'exclude');
      });
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const action = cb.dataset.action;
          if (cb.checked) {
            checkboxes.forEach(o => o !== cb && (o.checked = false));
            maker.options[field] = action === 'include' ? 0 : 1;
          } else {
            maker.options[field] = -1;
          }
          apply(maker, type);
          if (type) window.__kx.produceWord(type);
        });
      });
    };
    
    // 校验输入
    const bindUniqueDigitInput = (selector, onChange) => {
      const selected = document.querySelectorAll(selector);
      selected.forEach(input => {
        input.addEventListener('input', () => {
          let val = input.value.replace(/\D/g, '');
          let map = {}, out = '';
          for (let c of val) {
            if (!map[c]) {
              map[c] = 1;
              out += c;
            }
          }
          if (out !== input.value) input.value = out;
          onChange && onChange();
        });
      });
    };
    
    // 定位置配数全转
    const bindPosPeiShuMulti = (maker, o) => {
      const filters = [...document.querySelectorAll('.position-filter')];
      const fixedRow = document.querySelector('.fixed-input');
      const peiRow   = document.querySelector('.match-input');
      const fixedInputs = [...fixedRow.querySelectorAll('input[boxNumber]')];
      const peiInputs   = [...peiRow.querySelectorAll('input[boxNumber]')];
      const names = ['firstNumber','secondNumber','thirdNumber','fourthNumber'];
    
      let peiEverEdited = false;
      let autoSwitched = false;
      const hideAll = () => {
        fixedRow.classList.add('hide')
        peiRow.classList.add('hide');
      };
    
      const isPeiEmpty = () => peiInputs.every(i => i.value.trim() === '');
      const getFixedTake = () => filters.find(cb => +cb.getAttribute('positionType') === 0 && +cb.getAttribute('positionFilter') === 0);
      const getDefaultFilter = (type) => filters.find(cb => +cb.getAttribute('positionType') === type);
    
      const update = () => {
        let checked = filters.find(cb => cb.checked);
        if (checked && +checked.getAttribute('positionType') === 1 && peiEverEdited && isPeiEmpty() && !autoSwitched) {
          const fixedTake = getFixedTake();
          filters.forEach(cb => cb.checked = false);
          fixedTake.checked = true;
          checked = fixedTake;
          autoSwitched = true;
        }
        // 确保至少有一个复选框选中
        if (!checked) {
          checked = getDefaultFilter(0);
          checked.checked = true;
        }
        const positionType = +checked.getAttribute('positionType');
        const positionFilter = +checked.getAttribute('positionFilter');
    
        const inputs = positionType === 0 ? fixedInputs : peiInputs;
        const values = inputs.map(i => i.value.trim());
        o.positionType = positionType;
        o.positionFilter = positionFilter;
        [o.firstNumber, o.secondNumber, o.thirdNumber, o.fourthNumber] = values;
        hideAll();
        if (positionType === 0) fixedRow.classList.remove('hide');
        else peiRow.classList.remove('hide');
        apply(maker);
      };
    
      filters.forEach(cb => {
        cb.onchange = () => {
          const type = +cb.getAttribute('positionType');
          filters.forEach(o => {
            if (o !== cb && +o.getAttribute('positionType') === type) o.checked = false;
          });
          filters.forEach(o => {
            if (+o.getAttribute('positionType') !== type) o.checked = false;
          });
          // 保证至少一个选中
          if (!cb.checked) {
            cb.checked = true;
          }
          update();
        };
      });
    
      fixedInputs.forEach(input => {
        input.oninput = update;
      });
      peiInputs.forEach(input => {
        input.oninput = () => {
          peiEverEdited = true;
          autoSwitched = false;
          update();
        };
      });
      // ===== 初始化 UI =====
      filters.forEach(cb => {
        const t = +cb.getAttribute('positionType');
        const f = +cb.getAttribute('positionFilter');
        cb.checked = (o.positionType === t && o.positionFilter === f);
      });
    
      fixedInputs.forEach((i, idx) => i.value = (o.positionType === 0 ? o[names[idx]] : '') || '');
      peiInputs.forEach((i, idx) => i.value = (o.positionType === 1 ? o[names[idx]] : '') || '');
      update();
    };
    
    // 固定位置合分
    const bindFixedRemainMulti = (maker, o) => {
      const fcb = [...document.querySelectorAll('.remain-fixed-filter')];
      const rows = [...document.querySelectorAll('.remain-fixed-filter-item')];
    
      const update = () => {
        if (o.remainFixedFilter === -1) return (o.remainFixedNumbers = [], apply(maker));
        const numbers = rows.map(row => {
          const input = row.querySelector('input[type="text"]');
          const pos = [...row.querySelectorAll('input[type="checkbox"]:not(.remain-fixed-filter)')].map(cb => +cb.checked);
          if (!pos.some(Boolean) || !input.value.trim()) return null;
          return [pos, input.value.trim().split('')];
        }).filter(Boolean);
        o.remainFixedNumbers = numbers;
        apply(maker);
      };
    
      fcb.forEach(cb => {
        const val = +cb.getAttribute('remainFixedFilter');
        cb.checked = o.remainFixedFilter === val;
        cb.onchange = () => (o.remainFixedFilter = cb.checked ? val : -1, fcb.forEach(x => x !== cb && (x.checked = false)), update());
      });
      rows.forEach((row, i) => {
        const input = row.querySelector('input[type="text"]');
        const pos = [...row.querySelectorAll('input[type="checkbox"]:not(.remain-fixed-filter)')];
        pos.forEach((cb, j) => (cb.checked = o.remainFixedNumbers?.[i]?.[0]?.[j] === 1, cb.onchange = update));
        input.value = o.remainFixedNumbers?.[i]?.[1]?.join('') || '';
        input.oninput = update;
      });
      update();
    };
    
    // 不定位合分(两/三数)
    const bindRemainMatch = (maker, o) => {
      const two = document.querySelector('.remain-match-filter');
      const three = document.querySelector('.remain-match-filter-three');
      const [i2, i3] = document.querySelectorAll('input[name="budinghe"]');
      two.checked = o.remainMatchFilter === 2;
      three.checked = o.remainMatchFilterThree === 3;
      i2.value = o.remainMatchNumbers?.join('') || '';
      i3.value = o.remainMatchNumbersThree?.join('') || '';
      two.onchange = () => {
        o.remainMatchFilter = two.checked ? 2 : -1;
        apply(maker);
      };
      three.onchange = () => {
        o.remainMatchFilterThree = three.checked ? 3 : -1;
        apply(maker);
      };
      i2.oninput = () => {
        o.remainMatchNumbers = i2.value.trim().split('');
        apply(maker);
      };
      i3.oninput = () => {
        o.remainMatchNumbersThree = i3.value.trim().split('');
        apply(maker);
      };
    };
    
    // 值范围
    const bindValueRange = (maker, o) => {
      const min = document.querySelector('input[name="zhifanwei1"]');
      const max = document.querySelector('input[name="zhifanwei2"]');
      min.value = o.remainValueRanges?.[0] ?? '';
      max.value = o.remainValueRanges?.[1] ?? '';
      const update = () => {
        const a = min.value.trim();
        const b = max.value.trim();
        o.remainValueRanges = a || b ? [Number(a), Number(b)] : [];
        apply(maker);
      };
      min.oninput = max.oninput = update;
    };
    
    // 上奖 + 排除
    const bindUpperExcept = (maker, o) => {
      const upper = document.querySelector('.upper-filter-item');
      const except = document.querySelector('.except-filter-item');
      upper.value = o.upperNumbers?.join('') || '';
      except.value = o.exceptNumbers?.join('') || '';
      upper.oninput = () => {
        const v = upper.value.trim();
        o.upPrize = !!v;
        o.upperNumbers = v ? v.split('') : [];
        apply(maker);
      };
      except.oninput = () => {
        const v = except.value.trim();
        o.exceptNumbers = v ? v.split('') : [];
        apply(maker);
      };
    };
    
    // 四字定含
    const bindContain = (maker, o) => {
      const filters = document.querySelectorAll('.contain-filter');
      const input = document.querySelector('.contain-filter-item');
      filters.forEach(cb => cb.checked = o.containFilter === Number(cb.getAttribute('containFilter')));
      input.value = o.containNumbers?.join('') || '';
      filters.forEach(cb => {
        cb.onchange = () => {
          if (!cb.checked) {
            o.containFilter = -1;
            o.containNumbers = [];
          } else {
            filters.forEach(x => x !== cb && (x.checked = false));
            o.containFilter = Number(cb.getAttribute('containFilter'));
            o.containNumbers = input.value.trim().split('');
          }
          apply(maker);
        };
      });
      input.oninput = () => {
        if (o.containFilter !== -1) {
          o.containNumbers = input.value.trim().split('');
          apply(maker);
        }
      };
    };
    
    // 单双大小
    const bindPosition = (maker) => {
      const types = ['odd', 'even', 'big', 'small'];
      types.forEach(type => {
        const field = \`\${type}NumberPositions\`;
        document.querySelectorAll(\`.\${type}-number-item\`)
          .forEach((cb, i) => {
          cb.checked = maker.options[field][i] === 1;
          cb.addEventListener('change', () => {
            maker.options[field][i] = cb.checked ? 1 : 0;
            apply(maker);
            window.__kx.produceWord(type);
          });
        });
      });
      types.forEach(type => window.__kx.produceWord(type));
    };
    
    const renderLogs = (logs) => logs.map((l, i) => \`<div class="stagger" style="animation-delay:\${i*0.1}s"><span class="icon">✓</span>\${l}</div>\`).join('');
    
    const renderTable = (list) => {
      const numberList = document.getElementById('numberList');
      if (!list.length) {
        numberList.innerHTML = "<tr><td style='padding:2px;'>没有这样的号码</td></tr>";
      } else {
        let html = '';
        for (let i = 0; i < list.length; i += 7) {
          html += '<tr>';
          html += list.slice(i, i + 7).map(num => \`<td>\${num}</td>\`).join('');
          html += '</tr>';
        }
        numberList.innerHTML = html
      }
    };
    
    const doSave = (f, btn) => {
      const $n = $("#numberList")
      const $s = $(".betStatus")
      const $c = $("#multi_count");
      $n.hide(); $s.show(); 
      $c.html("0").removeClass("red");
      const total = f.numberList.length;
      $s.find('span').text(total); 
      const start = Date.now();
      const duration = Math.min(1000, 500 + total * 0.7);
    
      const step = () => {
        $c.addClass("red");
        const p = Math.min((Date.now() - start) / duration, 1);
        $c.html(Math.floor(total * p));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          const audio = document.getElementById('audio');
          if (audio) audio.play();
          setTimeout(() => { 
            btn.style.color = '';
            $s.hide(); $n.show(); 
            resetAll(); 
          }, 600);
        }
      };
      requestAnimationFrame(step);
    };
    
    // 保存请求体
    const getBody = (maker, type) => {
      const f = maker;
      const fake = JSON.stringify(fakeParam);
      const options = type === 'custom' ? fake : f.options;
      const body = Object.entries({
        bet_number: f.numberList.join(','),
        bet_money: '${money}',
        bet_way: 102,
        is_xian: f.options.isXian,
        number_type: f.options.numberType,
        bet_log: '${log}' || f.logs.join('，'),
        guid: kx.guid,
        period_no: 20251229097,
        operation_condition: options
      }).map(([k, v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v))
        .join('&');
      return body;
    };
    
    const bindActionBtn = (maker, list, btnId, type) => {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.onclick = () => {
        btn.style.color = '#333';
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        if (!list.length) {
          btn.style.color = '';
          return;
        }
        invoke(getBody(maker, type));
        doSave(maker, btn);
      };
    };
    
    try {
      const filterContainer = document.getElementById('filterContainer');
      filterContainer.innerHTML = document.getElementById('tpl_sid').innerHTML;
      const maker = new CodeMaker(${JSON.stringify(options)});
      const o = maker.options;
      kx.codeMaker = maker;
      setLogs('${input}', o);
      maker.log();
      
      checkboxMap.forEach(cfg => bindCheckboxGroup(maker, cfg));
      bindPosPeiShuMulti(maker, o);
      bindFixedRemainMulti(maker, o);
      bindPosition(maker);
      bindRemainMatch(maker, o);
      bindValueRange(maker, o);
      bindUpperExcept(maker, o);
      bindContain(maker, o);
      
      bindUniqueDigitInput(
        '.fixed-input input[boxNumber], .match-input input[boxNumber], .remain-fixed-filter-item input[type="text"], input[name="budinghe"], .contain-filter-item',
        () => apply(maker)
      );
      
      // 如果是数组模式，把数组作为白名单
      const isArrayMode = ${isArrayMode};
      const rawNumbers = ${JSON.stringify(rawNumbers)};
      if (isArrayMode) {
        maker.rawNumberList = [...rawNumbers];
        maker._originGenerate = maker.generate;
        maker.generate = function () {
          this.numberList = [...this.rawNumberList];
          this._originGenerate();
          const set = new Set(this.rawNumberList);
          this.numberList = this.numberList.filter(n => set.has(n));
          this.onCompleted.call(this);
        };
      }
      
      maker.onCompleted = function() {
        const list = this.numberList;
        document.getElementById('log')
          .innerHTML = \`<strong class="red2" style="font-size:16px;">【 匹配日志 】</strong><div style="height:5px"></div>\${renderLogs(this.logs)}\`;
        document.getElementById('count').textContent = list.length;
        renderTable(list);
        bindActionBtn(maker, list, 'originBtn', 'origin');
        bindActionBtn(maker, list, 'saveBtn', 'custom');
      };
      maker.generate();
    } catch (err) {
      document.getElementById('numberList').innerHTML = "<tr><td colspan='7' class='error'>" + err.message + "</td></tr>";
    }`;
  };
  
  // 日志生成号码 HTML
  logHtml = (input, log, money) => {
    const options = this.parseToOptions(input);
    const logScript = this.logScript(input, options, log, money);
    return `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
      <style>
        ${this.css}
        body {
          margin: 0;
          overflow-y: auto;
          padding: 20px;
          min-height: 100vh;
          font-family: -apple-system, Arial;
          color: #000;
          line-height: 1.4;
          background: #153B7D;
        }
        
        .log,
        .numbers {
          background: rgba(255, 255, 255, .15);
          border-radius: 15px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, .15);
        }
        
        .log {
          animation: fadeInUp .7s ease forwards;
          padding: 15px 20px;
          font-size: 14.5px;
          color: #fff;
        }
        
        .count {
          font-size: 22px;
          font-weight: bold;
          color: #fff;
          text-align: center;
          margin: 5px 0;
          text-shadow: 0 1px 3px rgba(0, 0, 0, .4);
        }
        
        .count-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 15px 0;
        }
        
        .save-btn {
          padding: 6px 14px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          background: orange;
          color: #fff;
        }
        
        .numbers {
          padding: 20px;
          max-height: 23.8vh;
        }
        
        .numbers-scroll {
          height: calc(23.8vh - 20px);
          overflow-y: auto;
        }
        
        .t-2 td {
          border: 1px solid #fff;
          color: #fff;
        }
        
        .filter-bar {
          margin: 10px 0 10px;
          padding: 10px 20px;
          background: rgba(255,255,255,.15);
          border-radius: 15px;
          color: #fff;
          font-size: 16px;
          text-align: left; 
          animation: fadeInUp .7s ease forwards;
        }
        
        .filter-bar label {
          margin-right: 2px;
        }
        
        .filter-bar table {
          color: #fff;
        }
        
        .red2 {
          color: yellow;
        }
        
        .two-col-repeat {
          display: flex;
          gap: 32px;
        }
        
        .two-col-repeat .col {
          white-space: nowrap;
        }
        
        .two-col-brother {
          display: flex;
          gap: 16px;
        }
        
        .two-col-brother .col {
          white-space: nowrap;
        }
        
        .green {
          color: #00FF00;
          margin-left: 2px;
        }
        
        input {
          font-size: 16px;
          -webkit-text-size-adjust: 100%;
        }
        
        input[type="text"] {
          background-color: rgba(255, 255, 255, 0.2);
          height: 20px;
          vertical-align: middle;
          display: inline-block;
          line-height: 1.4;
          color: #FFF;
          border-radius: 6px;
          border: .5px solid #999;
          padding: 4px 8px;
          outline: none;
        }
        
        /* 值范围输入框 */
        input[name="zhifanwei1"],
        input[name="zhifanwei2"] {
          width: 48px;
          height: 20px;
        }
        
        input[name="he1"],
        input[name="he2"],
        input[name="he3"],
        input[name="he4"] {
          width: 115px;
          height: 20px;
        }
        
        input[boxNumber="1"],
        input[boxNumber="2"],
        input[boxNumber="3"],
        input[boxNumber="4"] {
          width: 115px;
          height: 20px;
        }
        
        .filter-bar input[type="checkbox"],
        .remain-fixed-filter-item input[type="checkbox"] {
          transform: scale(1.1);
          margin-right: 1.5px;
        }
        
        .remain-fixed-filter-item input[type="checkbox"] {
          margin-right: 6px;
        }
        
        .remain-bar {
          margin-bottom: 6px;
        }
        
        .remain-fixed-filter-item .idx {
          display: inline-block;
          width: 20px;
        }
        
        .remain-fixed-filter-item {
          display: flex;
          align-items: center;
        }
        
        /* 定位置配数全转 */
        .filter-bar tr td:first-child {
          padding-right: 32px;
        }
        
        .fixed-input td,
        .match-input td {
          text-align: left;
        }
        
        .fixed-input td > div:first-child,
        .match-input td > div:first-child {
          margin-top: 6px;
        }
        
        /* 背景,图标 */
        .error {
          color: red;
          font-size: 15px;
          text-align: center;
        }
        
        .stagger {
          opacity: 0;
          animation: fadeInAnimation .3s ease-in-out forwards;
          display: flex;
          align-items: center;
          margin-top: 4px;
        }
        
        .icon {
          color: #00ff00;
          font-weight: bold;
          margin-right: 6px;
        }
        
        @keyframes fadeInAnimation {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .particle {
          position: fixed;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, .8);
          border-radius: 50%;
          opacity: 0;
          animation: floatParticles 6s infinite ease-in-out;
        }
        
        @keyframes floatParticles {
          0% { opacity: 0; transform: translateY(0) scale(.5); }
          50% {
            opacity: 1;
            transform: translateY(-60px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-120px) scale(.5);
          }
        }
        
        @media (prefers-color-scheme: dark) { body { background: #000; } }
        
        /* 列表动画 */
        @keyframes fadeInUp {
          0% { opacity: 0;transform: translate3d(0, 100%, 0); }
          100% {
            opacity: 1;
            transform: none;
          }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-15px);
          }
          60% {
            transform: translateY(-7.5px);
          }
        }
        /* loading 圈 */
        .loader {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255,255,255,0.5);
          border-top: 3px solid #fff;
          border-radius: 50%;
          margin: 10px auto;
          animation: spin 0.5s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* 弹窗提示 */
        #tips {
          position: fixed;
          top: 25%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: #fff;
          padding: 15px 20px;
          border-radius: 15px;
          z-index: 9999;
          max-width: 80%;
          width: auto;
          opacity: 0;
          pointer-events: none;
          transition: opacity .25s ease-in-out;
        }
        #tips.show { opacity: 1; }
        #tips.hide { opacity: 0; }
      </style>
    </head>
    <body>
      <script>
        for(let i=0;i<20;i++){ const p=document.createElement("div");p.className="particle";p.style.left=Math.random()*100+"vw";p.style.top=Math.random()*100+"vh";p.style.animationDelay=Math.random()*5+"s";document.body.appendChild(p); }
      </script>
      <div class="log" id="log">复制正确的原站日志或者号码 🚫</div>
      <div id="filterContainer"></div>
      <div class="count-bar">
        <button class="save-btn" id="originBtn">原版规则</button>
        <div class="count" id="count">0</div>
        <button class="save-btn" id="saveBtn">隐私规则</button>
      </div>
      <div class="numbers">
        <div class="numbers-scroll">
          <table class="t-2 tc" id="numberList" cellpadding="0" cellspacing="0"></table>
            <div class="betStatus" style="color:#fff"><div class="loader"></div><span>0</span>个注单正在写入，已完成<i id="multi_count"></i>个</div>
        </div>
      </div>
      <div id="tips"><span></span></div>
      <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3">
      <script type="text/html" id="tpl_sid">
        <div class="filter-bar">
          <table>
            <tr>
              <td colspan="2" >
                <strong class="red2">定位置</strong>
                <label><input type="checkbox" class="position-filter" positionType="0" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter" positionType="0" positionFilter="0" checked>取</label>
              </td>
              <td colspan="2" class="tc">
                <strong class="red2">配数全转</strong>
                <label><input type="checkbox" class="position-filter" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter" positionType="1" positionFilter="0">取</label>
              </td>
            </tr>
            <tr class="fixed-input tc">
              <td colspan="4">
                <div>
                  仟<input type="text" class="w90" boxNumber="1">
                  佰<input type="text" class="w90" boxNumber="2">
                </div>
                <div class="mt5">
                  拾<input type="text" class="w90" boxNumber="3">
                  个<input type="text" class="w90" boxNumber="4">
                </div>
              </td>
            </tr>
            <tr class="match-input hide">
              <td colspan="4" >
                <div>
                  <input type="text" class="w90" boxNumber="1"> 配,
                  <input type="text" class="w90" boxNumber="2"> 配,
                </div>
                <div class="mt5">
                  <input type="text" class="w90" boxNumber="3"> 配,
                  <input type="text" class="w90" boxNumber="4">
                </div>
              </td>
            </tr>
          </table>
        </div>
        <tr>
          <td colspan="4" class="tc">
            <div class="filter-bar">
              <div class="remain-bar">
                <strong class="red2">固定合分</strong>
                <label><input type="checkbox" class="remain-fixed-filter" remainFixedFilter="1"> 除</label>
                <label><input type="checkbox" class="remain-fixed-filter" remainFixedFilter="0" checked> 取</label>
              </div>
              <div class="remain-fixed-filter-item"><span class="idx">1.</span>
                <input type="checkbox"><input type="checkbox"><input type="checkbox"><input type="checkbox">
                <input type="text" name="he1">
              </div>
              <div class="remain-fixed-filter-item mt5"><span class="idx">2.</span>
                <input type="checkbox"><input type="checkbox"><input type="checkbox"><input type="checkbox">
                <input type="text" name="he2">
              </div>
              <div class="remain-fixed-filter-item mt5"><span class="idx">3.</span>
                <input type="checkbox"><input type="checkbox"><input type="checkbox"><input type="checkbox">
                <input type="text" name="he3">
              </div>
              <div class="remain-fixed-filter-item mt5"><span class="idx">4.</span>
                <input type="checkbox"><input type="checkbox"><input type="checkbox"><input type="checkbox">
                <input type="text" name="he4">
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-item">
            <div class="filter-bar">
              <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2"> 两数合</label>
              <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3"> 三数合</label>
              <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4" class="remain-match-filter-range">
            <div class="filter-bar">
              <strong class="red2"> 值 范 围</strong> 从 <input type="text" class="w30" name="zhifanwei1" digits="true" maxlength="10"> 值 至 <input type="text" class="w30" name="zhifanwei2" digits="true" maxlength="10">值
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <div class="filter-bar">
              <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
              <span class="inlineblock">
                <strong class="red2"> 排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
              </span>
              <span class="gu-ding-wei-zhi hide">
                <strong class="red2">固定位置</strong>
                <input type="checkbox" class="fixed-position-item">
                <input type="checkbox" class="fixed-position-item">
                <input type="checkbox" class="fixed-position-item">
                <input type="checkbox" class="fixed-position-item">
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <div class="filter-bar">
              <label><input type="checkbox" class="contain-filter checkbox" containFilter="1"> 除</label>
              <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked"> 取</label>
              <span class="inlineblock"> 四字定<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
              </span>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <div class="filter-bar">
              <div class="two-col-repeat">
                <div class="col">
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="2" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="2" data-action="include"> 取</label>
                  (<strong class="red2">双重</strong>)
                </div>
                <div class="col">
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="double" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="double" data-action="include"> 取</label>
                  (<strong class="red2">双双重</strong>)
                </div>
              </div>
              <div class="two-col-repeat">
                <div class="col">
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="3" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="3" data-action="include"> 取</label>
                  (<strong class="red2">三重</strong>)
                </div>
                <div class="col">
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="4" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="repeat-words-filter checkbox" data-level="4" data-action="include"> 取</label>
                  (<strong class="red2">四重</strong>)
                </div>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <div class="filter-bar">
              <div class="two-col-brother">
                <div class="col">
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="2" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="2" data-action="include"> 取</label>
                  (<strong class="red2">二兄弟</strong>)
                </div>
                <div class="col">
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="3" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="3" data-action="include"> 取</label>
                  (<strong class="red2">三兄弟</strong>)
                </div>
              </div>
              <div class="two-col-brother">
                <div class="col">
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="4" data-action="exclude"> 除</label>
                  <label><input type="checkbox" class="brother-filter checkbox" data-level="4" data-action="include"> 取</label>
                  (<strong class="red2">四兄弟</strong>)
                </div>
              </div>
            </div>
          </td>
        </tr>
        <div class="filter-bar">
          <tr>
            <td colspan="4">
              <label><input type="checkbox" class="odd-number-filter checkbox" data-level="odd" data-action="exclude"> 除</label>
              <label><input type="checkbox" class="odd-number-filter checkbox" data-level="odd" data-action="include"> 取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
              <input type="checkbox" class="odd-number-item checkbox">
              <input type="checkbox" class="odd-number-item checkbox">
              <input type="checkbox" class="odd-number-item checkbox">
              <span class="green fb f16"><span id="selectWord_odd"></span>  <span id="selectCondition_odd"></span></span>
          </td>
        </tr><br />
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="even-number-filter checkbox" data-level="even" data-action="exclude"> 除</label>
            <label><input type="checkbox" class="even-number-filter checkbox" data-level="even" data-action="include"> 取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <input type="checkbox" class="even-number-item checkbox">
            <span class="green fb f16"><span id="selectWord_even"></span>  <span id="selectCondition_even"></span></span>
          </td>
        </tr><br />
        <tr>
          <td colspan="4">
            <label><input type="checkbox" class="big-number-filter checkbox" data-level="big" data-action="exclude"> 除</label>
            <label><input type="checkbox" class="big-number-filter checkbox" data-level="big" data-action="include"> 取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
              <input type="checkbox" class="big-number-item checkbox">
              <input type="checkbox" class="big-number-item checkbox">
              <input type="checkbox" class="big-number-item checkbox">
              <span class="green fb f16"><span id="selectWord_big"></span>  <span id="selectCondition_big"></span></span>
            </td>
          </tr><br />
          <tr>
            <td colspan="4">
              <label><input type="checkbox" class="small-number-filter checkbox" data-level="small" data-action="exclude"> 除</label>
              <label><input type="checkbox" class="small-number-filter checkbox" data-level="small" data-action="include"> 取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>  <span id="selectCondition_small"></span></span>
            </td>
          </tr>
        </div>
      </script>
      <script>
        ${this.codeMaker}
        ${logScript}
      </script>
    </body>
    </html>`;
  };
  
  // 原站 CSS
  css = () => {
    return `
    html { 
      font-size: 62.5%; 
      height: 100% 
    } 
    @media screen and (min-width:360px) and (max-width:374px) and (orientation:portrait) {
      html { font-size: 70.3%; } 
    }
    @media screen and (min-width:375px) and (max-width:383px) and (orientation:portrait) {
      html { font-size: 73.24%; } 
    }
    @media screen and (min-width:384px) and (max-width:399px) and (orientation:portrait) {
      html { font-size: 75%; } 
    }
    @media screen and (min-width:400px) and (max-width:413px) and (orientation:portrait) {
      html { font-size: 78.125%; } 
    }
    @media screen and (min-width:414px) and (max-width:431px) and (orientation:portrait){
      html { font-size: 80.86%; }
    }
    @media screen and (min-width:432px) and (max-width:479px) and (orientation:portrait){
      html { font-size: 84.375%; }
    }
    body {
      margin:0; 
      padding:0; 
      font-size:1.2rem; 
      height:100%;
      overflow:hidden;
    }
    div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,form,fieldset,input,textarea,blockquote,p{padding:0; margin:0;}
    table {border-spacing:0; border-collapse:collapse; _border-collapse:inherit;  border:0; padding:0; margin:0;}
    ol,ul {list-style:none;}
    li {list-style-type:none;}
    img {vertical-align:top;border:0;}
    .tl {text-align: left;}
    .tc {text-align: center;}
    .tr {text-align: right;}
    .fl {float: left;}
    .fr {float: right;}
    .m10 {margin:0 10px;}
    .m5 {margin:0 5px;}
    .mr10 {margin-right: 10px;}
    .mr20 {margin-right: 20px;}
    .mt10 {margin-top:10px;}
    .mb10 {margin-bottom: 10px;}
    .mt5 {margin-top: 5px;}
    .pb5 {padding-bottom:5px;}
    .pt5 {padding-top: 5px;}
    .pt10 {padding-top:10px;}
    .pb10 {padding-bottom: 10px;}
    .wrap {word-break: break-all; word-wrap: break-word;}
    .nowrap {white-space:nowrap;}
    .vt {vertical-align: top;}
    .vm {vertical-align: middle;}
    i, em {font-style:normal;}
    .hide {display:none;}
    .vhide {visibility:hidden;}
    .ime-dis {ime-mode:disabled;}
    .inlineblock {display:inline-block;}
    .inlineblock {*display:inline;}
    .hx a,.hx em {font-weight:bold;}
    .clearfix {*zoom:1;}
    .clearfix:after {display:block; overflow:hidden; clear:both; height:0; visibility:hidden; content:".";}
    a {color:darkblue; text-decoration:none;}
    a:hover {text-decoration: underline;}
    .fb {font-weight:bold;}
    .f12 {font-size: 1.3rem;}
    .f14 {font-size: 0.87rem;}
    .f15{font-size:1.5rem;}
    .f16 {font-size: 1.2rem;}
    .f2r {font-size:1.7rem;}
    .white {color:white;}
    .red { color: red; }
    .red2 {color:#990033;}
    .green {color:green;}
    .blue {color: blue;}
    .yellow {color:yellow;}
    .bg-white {background: #fff;}
    .pink {color:#FF00CC;}
    .guide {border: 1px solid #58c654; height: 16px; padding: 5px 10px; background: #FBFFE1;}
    .bg-ball {width:20px; height:20px; background-repeat: no-repeat; text-align: center; color:#fff; font-weight:bold; line-height:20px; font-size:16px; display:inline-block; border-radius:50%; font-family:Arial;}
    .ball2 {background:red;}
    .ball1 {background:purple;}
    .ball0 {background:gray;}
    .btn {border-radius:5px; background:#0894ec; border:0; color:#fff; height:2.5rem; padding:0 1rem; cursor:pointer; font-size:1.2rem; display:inline-block; line-height:2.5rem;-webkit-appearance: none; vertical-align:middle;}
    .btn-gray {background:#ccccd4; color:#fff;}
    input[type=text] {height:1.5rem;}
    input.text-large {height:2.8rem; font-size:2rem; vertical-align:middle;}
    .btn-large {height:2.5rem; vertical-align:middle;}
    
    .header {position:absolute; width:100%;}
    .header .hd {background:#fb5924; font-weight:bold; height:4rem; line-height:1.8rem; text-align:center; font-size:1.2rem; padding-top:0.8rem;}
    .header .bd {height: 2.5rem; line-height:2.5rem; box-shadow:0 3px 5px rgba(0,0,0,.3);}
    .header .lotteryType-nav {width:130px;height:22px;border:1px #fff solid;border-radius:5px;display:inline-block;overflow:hidden;z-index:20;background-color:#599d3a;color:#f5f90a;position:absolute;margin: auto;left: 0;right: 0;font-size:16px;}
    .header .lotteryType-nav-now-down {position:absolute;right:5px;font-size:12px;}
    .header .lotteryType-nav a {color:#f5f90a;}
    .header .lotteryType-nav.on {height:auto;}
    .header .lotteryType-nav-now {display:inline-block;width:130px;}
    .header .lotteryType-nav-item {width:130px;height:24px;display:inline-block;margin-top:2px;}
    .header .lotteryType-nav-item.on {background-color:#437830}
    .header .topinfo {position:relative;z-index:10;bottom:-25px;}
    .header .nav {text-align:center; font-size:1.5rem;height:2.5rem;}
    .header .nav li {display:inline-block; font-weight:bold; margin:0 0.3rem;height:2.5rem;}
    .header .nav li a {color:#106eb4;}
    .header .nav li.on a {color:red;}
    .header .nav .more {position:relative;}
    .header .nav .more div {position:absolute;top:2.5rem;left:-2.6rem;width:7rem;height:auto;z-index:999;background:#fb5924;box-shadow:0rem 0.1rem 0.1rem rgba(0,0,0,.5); border:1px solid #fff;border-bottom:none;margin-top:-1px;}
    .header .nav .more div a {height:2.5rem;line-height:2.5rem;color:white;border-bottom:1px solid #fff;font-size:1.2rem;display:block;}
    .main {position:absolute; top:5.2rem; bottom:0; overflow:auto; width:100%; padding:0 0 10px;}
    .html-android, .html-android body {height:auto; overflow:auto;}
    .html-android .main {top:0; position:static; padding-top: 2.4rem;}
    
    .t-1 {width:100%;}
    .t-1 td {border:1px solid #f6d3bc; height:22px; padding:2px 4px;}
    .t-1 .bg1 td {background:#e3f5fd; border-bottom:1px solid #640000;border:1px solid #f6d3bc; height:22px; border-width:0 1px 1px 0; padding:2px 4px;}
    .t-1 .bg3 td {background:#F1F5F8;}
    .t-1 .bg4 td {background:#DEDEBC; color:red}
    .t-1 .bg5 td {background: #FFFF00;}
    .t-1 td.no-padding {padding:0;}
    .t-2 {width:100%;}
    .t-2 td {border:1px solid #000;}
    
    .w30 {width:30px;}
    .w60 {width:60px;}
    .w80 {width:80px;}
    .w90 {width:90px;}
    
    .pager {text-align:center; padding:0.5rem 0;}
    .pager .input {width:2em; height:1.2rem; padding:0; vertical-align:middle;}
    .pager .btn {padding:0; height:auto; line-height:1.7rem; vertical-align:middle;}
    
    /* dialog */
    .mask {position:absolute;margin-top:0;top:0;left:0;z-index:1000;width:100%;height:100%;background:#000;opacity:0.3;}
    .mask .ifr-fix-ie6 {display:none; _display:block; width:100%; height: 100%; z-index: -1; _filter:alpha(opacity=0)}
      .g-dialog {position: absolute; left: 0; top: 0; background: #fff; z-index: 1001; 
      -moz-box-shadow:1px 1px 50px rgba(0,0,0,.3);
      -webkit-box-shadow:1px 1px 50px rgba(0,0,0,.3);
      box-shadow: 1px 1px 50px rgba(0,0,0,.3);
      border-radius: 3px;
      top:10%;
    }
    .g-dialog .dialog-hd {height:40px; cursor: move; border-bottom:1px solid #d8dce5; background: #f8f8f8; border-radius: 3px 3px 0 0;}
    .g-dialog .dialog-hd .title {font-size:16px; line-height:40px; padding:0 0 0 10px;}
    .g-dialog .dialog-hd .btn-close {width:34px; height:34px; line-height:34px; text-align:center; color:#c7ced8; font-size:34px; display:block; margin:2px 2px 0 0; text-decoration:none;}
    .g-dialog .dialog-hd .btn-close:hover {color:#333;}
    .g-dialog .dialog-bd {min-height:100px; _height:100px; padding:10px 10px 0;}
    .g-dialog .dialog-ft {text-align: center; padding: 10px 0;}
    .g-dialog .dialog-ft .btn {margin:0 10px;}
    .g-dialog .dialog-ft :focus:not(.focus-visible) {outline: none;}
    .g-alert .dialog-bd {word-break:break-all; word-wrap:break-word;}
    .html-android .mask, .html-android .g-dialog {position:fixed;}
    /* module */
    .kuaixuan td.on {background:#ff9900;}
    .kuaixuan .tb-kuaixuan td {border:1px solid #f6d3bc; padding:5px 0;}
    .kuaixuan .kx-btn {width: 100%;border: none;background: none;outline: none;}
    .kuaixuan td.on .kx-btn {color: #fff;font-weight:bold;}
    
    .keyboard-betno {background:red; vertical-align:top;}
    .keyboard-betno td {border:none; padding:1px 1px 2px; height:auto; width:16%;}
    .keyboard-betno tr td:last-child {width:20%;}
    .keyboard-betno input[type=button] {border:1px solid yellow; color:yellow; background:red; box-sizing:border-box; width:100%; height:3.2rem; -webkit-appearance:none; font-size:2rem}
    .keyboard-money, .keyboard-money input[type=button] {background:blue;}
    
    /* rule */
    .rule .bd { padding:0 0.5rem;}
    .rule .rule-ball {width:50%; margin:0 0 1em;}
    .rule .rule-ball td {border:2px solid #f37999;}
    .rule h1 {text-align:center; font-size:1.4rem; margin:1rem 0;}
    .rule h2, .rule h3, .rule p {margin:0 0 1em;font-size:14px; line-height:21px;}
    .rule p {text-indent:2em;}
    .rule h2 {color:#FF00CC;}
    
    /* kuaida */
    .bd_print_list {height:109px; overflow:auto}
    .bd_print_list_max {height:600px;}
    .betStatus {
      text-align:center;
      vertical-align:central;
      margin-top:15%;
      margin-bottom:15%;
      font-size:18px;
      display:none;
    }
    /*倒计时*/
    .systime{
      position:fixed; top:0rem; height:2.2rem;  width:100%; line-height:2.2rem; background: #fff; 
    }
    .ssc_table_bg {background:#fff repeat-y center;background-size:100%;*background:#fff;}
    /* testline */
    .testline .status {display:none; color:red; margin:0 0 0 10px;}
    .testline .best .status {display:inline-block;}
    `
  };
  
  // 注入拦截 js
  intercept = () => {
    const rows = this.drawRows;
    const drawRows = {
      Status: 1,
      Data: {
        Rows: rows?.map(row => ({
          ...row,
          period_datetime: row.period_datetime.split(' ')[1]
        })),
        PageIndex: 1
      }
    };
    const { period_no } = this.Data;
    const curStatus = {
      last_seconds : 300,
      period_no,
      next_period_no: period_no,
      status : 0,
    }
    
    return `
    document.addEventListener('DOMContentLoaded', () => {
      const showTips = (msg, duration = 1500) => {
        const tip = document.getElementById("tip");
        const text = tip.querySelector("span");
        text.textContent = msg;
        tip.classList.remove("hide");
        tip.classList.add("show");
        clearTimeout(tip.timer);
        tip.timer = setTimeout(() => {
          tip.classList.remove("show")
          tip.classList.add("hide");
        }, duration);
      };
    
      if ($.validator) {
        $.validator.setDefaults({
          focusInvalid: false,
          onfocusout: false,
          onkeyup: false,
          showErrors: (_, list) => list.length && showTips(list[0].message)
        });
      }
    
      if ($.alert) {
        $.alert = (msg, cb) => { showTips(msg); cb && cb(); };
      }
      
      if ($.confirm) {
        $.confirm = function(msg, okCb, cancelCb) {
          showTips(msg);
          // if (typeof okCb === 'function') okCb(); // 直接执行
        };
      }
      
      const switchModule = (mod) => {
        const btn = kx.d.find(\`input[module="\${mod}"]\`)
        if (btn.length && !btn.hasClass('active')) {
          btn.click();
        }
      };
      
      // 初始化
      window.G = window.G || {};
      G.modules = G.modules || {};
      G.instance = G.instance || {};
      const kx = window.__kx = new Kuaixuan({ json: { Param: {} } });
      kx.d = $('#kuaixuan');
      kx.bd_template = $('#bd_template');
      kx.init();
      switchModule('sid');
      
      // 启动原站倒计时
      if (typeof Header !== 'undefined') {
        const header = new Header($('#header'));
        G.instance.header = header;
        const mockData = ${JSON.stringify(curStatus)} || {};
        const originalDoCountDown = header.doCountDown;
        header.doCountDown = function(t, e, i, n) {
          const o = n && n === 'current_period' ? \`距离\${t.period_no}期封盘还有\` : \`距离\${t.next_period_no}期开盘还有\`;
          i(o, e);
          if (this.timer_status) clearInterval(this.timer_status);
          const self = this; this.timer_status = setInterval(() => (e--, i(o, e)), 1e3);
        };
        header.showSystemInfo(mockData);
      }
      
      // 生成按钮强制执行，无视验证
      document.addEventListener('click', function(ev) {
        const btn = ev.target.closest('#btn_create');
        if (!btn) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const instance = window.__kx;
        try {instance.createNumber(); }
        catch (e) {}
      }, true);
      
      const genGuid = () =>
        crypto?.randomUUID?.() ||
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c =>
          ((Math.random()*16)|0).toString(16)
        );
      
      const resetAll = () => {
        const btn = document.getElementById('btn_reset');
        if (btn) btn.click(); 
        else kx.codeMaker.reset();
        kx.guid = genGuid();
      };
      
      // 拦截下注，返回请求体
      kx.doSave = function () {
        const f = this.codeMaker;
        if (!f?.numberList?.length) return showTips("请至少选择一个号码");
      
        const body = Object.entries({
          bet_number: f.numberList.join(','),
          bet_money: $('#bet_money').val(),
          bet_way: 102,
          is_xian: f.options.isXian,
          number_type: f.options.numberType,
          bet_log: f.logs.join('，'),
          guid: this.guid,
          period_no: ${period_no},
          operation_condition: f.operation_condition
        }).map(([k, v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v))
          .join('&');
          
        completion?.(body);
        
        // 显示动画
        const $n = $("#numberList")
        const $s = $(".betStatus")
        const $c = $("#multi_count");
        $n.hide(); $s.show(); 
        $c.html("0").removeClass("red");
        const total = f.numberList.length;
        $s.find('span').text(total); 
        const start = Date.now();
        const duration = Math.min(1000, 500 + total * 0.7);
      
        const step = () => {
          $c.addClass("red");
          const p = Math.min((Date.now() - start) / duration, 1);
          $c.html(Math.floor(total * p));
          if (p < 1) {
            requestAnimationFrame(step);
          } else {
            const audio = document.getElementById('audio');
            if (audio) audio.play();
            setTimeout(() => { $s.hide(); $n.show(); }, 500);
            setTimeout(() => { resetAll(); }, 1000);
          }
        };
        requestAnimationFrame(step);
      }
      
      // 号码/日志/账单模块数据
      const drawResult = ${JSON.stringify(drawRows)};
      const logResult = ${JSON.stringify(this.logData)};
      const billResult = ${JSON.stringify(this.billData)};
      
      // 渲染号码
      const renderDraw = () => {
        if (!window.template || !drawResult?.Data) return;
        const html = template('tpl_refresh', {
          HideYiziWuer: '0',
          Data: drawResult.Data
        });
        const tbody = document.getElementById('tbody')
        tbody.innerHTML = html;
      };
      // 渲染日志
      const renderLog = () => {
        if (!window.template || !logResult?.Data) return;
        const html = template('tpl_log', {
          Data: logResult.Data
        });
        const tbody = document.getElementById('log_tbody');
        tbody.innerHTML = html;
      };
      // 渲染账单
      const renderBill = () => {
        if (!window.template || !billResult?.Data) return;
        const html = template('tpl_bill', {
          Data: billResult.Data
        });
        const tbody = document.getElementById('bill_tbody');
        tbody.innerHTML = html;
      };
      
      // 切换模块样式
      window.showModule = (id) => {
        if (id === 'drawnumber') renderDraw();
        if (id === 'bill') renderBill();
        if (id === 'log') renderLog();
        document.querySelectorAll('[name="module"]').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(id);
        if (target) target.classList.add('active');
        // 滚动到顶部
        const module = document.querySelector('.module');
        [target, module].forEach(el => el && (el.scrollTop = 0));
      
        const tabMap = { 
          kuaixuan:'tab_kuaixuan', 
          drawnumber:'tab_draw', 
          bill:'tab_bill', 
          log:'tab_log' 
        };
        document.querySelectorAll('.header-tabs span').forEach(tab => {
          const tl = tab.classList;
          tl.remove('active');
          tl.add('inactive');
        });
        const activeTab = document.getElementById(tabMap[id]);
        if (activeTab) {
          const al = activeTab.classList;
          al.add('active');
          al.remove('inactive');
        }
        const pager = document.getElementById('pager');
        if (pager) pager.classList.toggle('active', id === 'drawnumber');
      };
      document.querySelectorAll('.header-tabs span').forEach(tab => {
        tab.addEventListener('click', () => {
          const moduleId = tab.dataset.module;
          if (moduleId) showModule(moduleId);
        });
      });
      // 初始化模块
      showModule('kuaixuan');
    })`;
  };
  
  // 号码模块
  drawnumber = () => {
    return `<div name="module" id="drawnumber" class="m5 mt5">
      <form id="form1" autocomplete="off">
        <div class="mt10" id="bd_serverinfo">
          <table class="t-1">
            <thead>
              <tr class="bg3 tc"><td colspan="11">开奖号码</td></tr>
            </thead>
          </table>
        </div>
      </form>
      <div class="mt10">
        <form>
          <table class="t-1">
            <thead>
              <tr class="bg3" style="text-align:center">
                <td width="15%">期号</td><td width="15%">开奖时间</td><td width="10%">仟</td><td width="10%">佰</td><td width="10%">拾</td><td width="10%">个</td><td width="10%">五</td>
              </tr>
            </thead>
            <tbody id="tbody" class="fn-hover"></tbody>
          </table>
        </form>
      </div>
    </div>
    <div name="module" id="pager" class="pager" >第 <span class="pageindex red">1</span> 页 共 <span class="pagecount red">17</span> 页 共 <span class="recordcount red">252</span> 条 <br />
    </div>
    <!-- 号码模板 -->
    <script type="text/html" id="tpl_refresh">
      {{if !Data.Rows.length}}
        <tr><td colspan="8">暂无数据</td></tr>
      {{else}}
        {{each Data.Rows as item i}}
          {{var is_show1 = item.period_status == 3;}}
          {{var is_show2 = (item.thousand_no != "0" || item.hundred_no != "0" || item.ten_no != "0" || item.one_no != "0" || item.ball5 != "0");}}
          {{var is_show = (is_show1 || is_show2);}}
    
          {{if i == 0 && Data.PageIndex == 1}}
            <tr>
              <td>
                {{item.period_no}}
                <span class="red">
                  {{if item.is_deleted == 1}}(已删){{/if}}
                  {{if item.enable_status == 2}}(已废置){{/if}}
                  {{if item.enable_status == 3}}(休市){{/if}}
                </span>
              </td>
              <td>
                {{if item.period_status != 3}}--
                {{else}}{{item.period_datetime}}{{/if}}
              </td>
              <td><span class="bg-ball ball2">{{if is_show}}{{item.thousand_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball2">{{if is_show}}{{item.hundred_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball2">{{if is_show}}{{item.ten_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball2">{{if is_show}}{{item.one_no}}{{/if}}</span></td>
              {{if HideYiziWuer == '0'}}
                <td><span class="bg-ball ball2">{{if is_show}}{{item.ball5}}{{/if}}</span></td>
              {{/if}}
            </tr>
          {{else}}
            <tr>
              <td>
                {{item.period_no}}
                <span class="red">
                  {{if item.is_deleted == 1}}(已删){{/if}}
                  {{if item.enable_status == 2}}(已废置){{/if}}
                  {{if item.enable_status == 3}}(休市){{/if}}
                </span>
              </td>
              <td>
                {{if item.period_status != 3}}--
                {{else}}{{item.period_datetime}}{{/if}}
              </td>
              <td><span class="bg-ball ball1">{{if is_show}}{{item.thousand_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball1">{{if is_show}}{{item.hundred_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball1">{{if is_show}}{{item.ten_no}}{{/if}}</span></td>
              <td><span class="bg-ball ball1">{{if is_show}}{{item.one_no}}{{/if}}</span></td>
              {{if HideYiziWuer == '0'}}
                <td><span class="bg-ball ball1">{{if is_show}}{{item.ball5}}{{/if}}</span></td>
              {{/if}}
            </tr>
          {{/if}}
        {{/each}}
      {{/if}}
    </script>`;
  };
  
  // 账单模块
  historyBill = () => {
    return `<div name="module" id="bill" class="m5 mt10">
      <div class="mt10">
        <table class="t-1">
          <thead>
            <tr class="bg3">
              <td colspan="5" class="tc">历史账单</td>
            </tr>
            <tr class="bg2 tc">
              <td width="20%">期号</td><td width="20%">金额</td><td width="20%">回水</td><td width="20%">中奖</td><td width="20%">盈亏</td>
            </tr>
          </thead>
          <tbody id="bill_tbody" class="fn-hover tc"></tbody>
        </table>
      </div>
    </div>
    <!-- 账单模板 -->
    <script type="text/html" id="tpl_bill">
      {{if !Data.length}}
      <tr>
        <td colspan="5">暂无数据</td>
      </tr>
      {{else}}
        {{each Data as item i}}
          {{if i != Data.length - 1}}
          <tr>
            <td class="f14 fb">
              <a class="{{if item.show_frontend == 0}}red fb{{/if}}">
                {{item.period_no}}
              </a>
            </td>
            <td>{{item.bet_money}}</td>
            <td>{{item.show_frontend == 0 ? '--' : item.return_water}}</td>
            <td>{{item.show_frontend == 0 ? '--' : item.win_money}}</td>
            <td class="fb">
              {{item.show_frontend == 0 ? '--' : item.profit_loss_money}}
            </td>
          </tr>
          {{else}}
          <tr class="bg2">
            <td>合计</td>
            <td>{{item.bet_money}}</td>
            <td>{{item.return_water}}</td>
            <td>{{item.win_money}}</td>
            <td>{{item.profit_loss_money}}</td>
          </tr>
          {{/if}}
        {{/each}}
      {{/if}}
    </script>`;
  };
  
  // 日志模块
  quickSelectLog = () => {
    return `<div name="module" id="log" class="m5 mt10">
      <div class="mt10">
        <table class="t-1">
          <thead>
            <tr class="bg3 tc">
              <td colspan="4">日志</td>
            </tr>
            <tr class="bg2">
              <td class="nowrap">笔数</td><td class="nowrap">金额</td><td>操作内容</td><td class="nowrap">操作时间</td>
            </tr>
          </thead>
          <tbody id="log_tbody">
          </tbody>
        </table>
      </div>
    </div>
    <!-- 日志模板 -->
    <script type="text/html" id="tpl_log">
      {{if !Data.Rows || !Data.Rows.length}}
        <tr>
          <td colspan="4" class="tc">暂无数据!</td>
        </tr>
      {{else}}
        {{each Data.Rows as item i}}
          <tr>
            <td>{{item.bet_count}}</td>
            <td>{{item.bet_money}}</td>
            <td>{{#item.operation_content | rpl_color}}</td>
            <td>{{item.operation_datetime}}</td>
          </tr>
        {{/each}}
      {{/if}}
    </script>`;
  };
  
  // 返回完整 HTML
  html = (account) => {
    const { 
      member_account, 
      previous_draw_no, 
      credit_balance 
    } = account.Data;
    const previous_no = previous_draw_no.replace(/,/g, " ");
    const js = this.intercept();
    
    return `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="/Styles/style-FiveMinutes.css?v=20250912115700000" type="text/css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
      <style>
        ${this.css}
        body { font-family: -apple-system,Arial; }
        .t-1 .bg3 td {
          background:#e3f5fd;
        }
        .header {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 5.5rem;
          background: #fb5924;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .header-1 {
          line-height: 1.4rem;
        }
        .header-2 {
          margin-top: 0.55rem;
          margin-bottom: -0.3rem;
          font-size: 1.2rem;
          line-height: 1.4rem;
          color: #fff;
        }
        .header-tabs {
          display: flex;
          gap: 8px;
        }
        .header-tabs .tab {
          padding: 6px 16px;
          border-radius: 8px;
          background-color: yellow;
          color: #111;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-size: 14px;
          user-select: none;
        }
        
        /* 激活状态 */
        .header-tabs .tab.active {
          background: linear-gradient(90deg, #ff7e5f, #feb47b);
          color: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .systime { 
          margin-top: -1.3rem; 
        }
        .module {
          position: absolute;
          top: calc(5.5rem + 2.8rem);
          bottom: 0;
          left: 0; 
          right: 0;
          overflow-y: auto;
        }
        [name="module"] {
          display: none;
        }
        [name="module"].active {
          display: block;
        }
        #tip {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 15px 20px;
          border-radius: 15px;
          z-index: 9999;
          max-width: 80%;
          width: auto;
          opacity: 0;
          pointer-events: none;
          transition: opacity .25s ease-in-out;
        }
        #tip.show { opacity: 1; }
        #tip.hide { opacity: 0; }
        /* 开奖结果 */
        .bg-ball {
          display: inline-block;
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          text-align: center;
          border-radius: 50%;
          margin: 0.8rem 0.35rem;
        }
      </style>
    </head>
    <body>
      <div id="header" class="header">
        <div class="header-1">
          <div class="header-tabs">
            <span id="tab_kuaixuan" data-module="kuaixuan" class="tab active">快选</span>
            <span id="tab_draw" data-module="drawnumber" class="tab">开奖号码</span>
            <span id="tab_bill" data-module="bill" class="tab">历史账单</span>
            <span id="tab_log" data-module="log" class="tab">日志</span>
          </div>
        </div>
        <div class="header-2">开奖结果 ${previous_no} &nbsp;&nbsp;账号 ${member_account}&nbsp;&nbsp;可用 ${credit_balance}
        </div>
      </div>
      <div class="tc systime" id="systime"></div>
      <div id="tip"><span></span></div>
      <div class="module">
        <!-- 号码模块 -->
        ${this.drawnumber}
        <!-- 账单模块 -->
        ${this.historyBill}
        <!-- 日志模块 -->
        ${this.quickSelectLog}
        <!-- 快选模块 -->
        <div name="module" id="kuaixuan" class="kuaixuan">
          <div class="right mt10">
            <div class="bd m5">
              <table width="100%" class="tb-kuaixuan tc" id="tab_kuaixuan">
                <tr>
                  <td width="33.3%" class="on">
                    <input type="button" value="二字定" class="fn-module btn-large kx-btn" module="erd">
                  </td>
                  <td width="33.3%">
                    <input type="button" value="三字定" class="fn-module btn-large kx-btn" module="sand">
                  </td>
                  <td width="33.3%">
                    <input type="button" value="四字定" class="fn-module btn-large kx-btn" module="sid">
                  </td>
                </tr>
                <tr>
                  <td width="16.7%">
                    <input type="button" value="二字现" class="fn-module btn-large kx-btn" module="erx">
                  </td>
                  <td width="16.7%">
                    <input type="button" value="三字现" class="fn-module btn-large kx-btn" module="sanx">
                  </td>
                  <td width="16.7%">
                    <input type="button" value="四字现" class="fn-module btn-large kx-btn" module="six">
                  </td>
                </tr>
                <tr>
                  <td width="16%">
                    <input type="button" value="五位二定" class="fn-module btn-large kx-btn" module="fifteen">
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              </table>
              <form id="createForm">
                <div id="bd_template">
                </div>
              </form>
            </div>
            <div class="tc mt10">
              <input id="btn_create" type="button" value="生成" class="btn btn-large">
              <input id="btn_reset" type="button" value="复位" class="btn btn-large">
            </div>
            <div class="mt10">
              <div class="bd m5">
                <table class="t-1" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr class="bg3">
                      <td>号码框</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="no-padding">
                        <div style="overflow-y:auto;min-height:100px; max-height:300px;">
                          <table class="t-2 tc" id="numberList" cellpadding="0" cellspacing="0"></table>
                          <div class="betStatus"><img src="https://raw.githubusercontent.com/95du/scripts/master/img/ticket/loading.gif" /><br /><br /><span>0</span>个注单正在投注，已完成<i id="multi_count"></i>个
                          </div>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <form id="sendForm" autocomplete="off">
                  <div class="mt10">
                    <table class="t-1">
                      <thead>
                        <tr class="bg3">
                          <td colspan="2">发送框</td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td rowspan="2" width="55%">
                            <span class="f2r vm">金额</span> <input id="bet_money" type="text" maxlength="8" required="true" positive="true" class="text-large w60"> <input id="btn_bet" type="submit" value="下注" class="btn btn-large"> <input type="hidden" name="operation_condition" id="operation_condition">
                          </td>
                          <td>笔数：<span id="numberCount"></span></td>
                        </tr>
                        <tr>
                          <td>金额：<span id="numberAmount"></span>元</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <script type="text/html" id="tpl_erd">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td colspan="2" class="tc">
                <strong class="red2">定位置</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
              </td>
              <td colspan="2" class="tc">
                <strong class="red2">配数全转</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
              </td>
            </tr>
            <tr class="fixed-input tc">
              <td colspan="4">
                <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
                </div>
                <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
                </div>
              </td>
            </tr>
            <tr class="match-input hide">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="bg2">
              <td colspan="4" class="tc">
                <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="tc">
              <td colspan="4">
                <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he1" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he2" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he3" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he4" digits="true" maxlength="10">
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong>
                <label><input type="checkbox" remainMatchFilter="2" class="remain-match-filter checkbox">两数合</label>&nbsp;&nbsp;&nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
                <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
                <span class="inlineblock">
                  <span class="inlineblock">
                    <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
                  </span>
                  <strong class="red2">乘号位置</strong>
                  <input type="checkbox" class="symbol-filter-item">
                  <input type="checkbox" class="symbol-filter-item">
                  <input type="checkbox" class="symbol-filter-item">
                  <input type="checkbox" class="symbol-filter-item">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 二字定含 <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
                <span class="inlineblock"> 二字定复式 <input type="text" class="multiple-filter-item w80" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_sand">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td colspan="2" class="tc">
                <strong class="red2">定位置</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
              </td>
              <td colspan="2" class="tc">
                <strong class="red2">配数全转</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
              </td>
            </tr>
            <tr class="fixed-input tc">
              <td colspan="4">
                <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
                </div>
                <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
                </div>
              </td>
            </tr>
            <tr class="match-input hide">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="bg2">
              <td colspan="4" class="tc">
                <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="tc">
              <td colspan="4">
                <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he1" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he2" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he3" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he4" digits="true" maxlength="10">
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong><br>
                <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
                <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
                <span class="inlineblock">
                  <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
                  <span class="inlineblock">
                    <strong class="red2">乘号位置</strong>
                    <input type="checkbox" class="symbol-filter-item">
                    <input type="checkbox" class="symbol-filter-item">
                    <input type="checkbox" class="symbol-filter-item">
                    <input type="checkbox" class="symbol-filter-item">
                  </span>
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 三字定含 <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
                <span class="inlineblock"> 三字定复式 <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>) 
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>) 
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_sid">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td colspan="2" class="tc">
                <strong class="red2">定位置</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
              </td>
              <td colspan="2" class="tc">
                <strong class="red2">配数全转</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
              </td>
            </tr>
            <tr class="fixed-input tc">
              <td colspan="4">
                <div> 仟<input type="text" class="w90" boxNumber="1" name="qian" digits="true" maxlength="10" value="{{Param.qian}}"> 佰<input type="text" class="w90" boxNumber="2" name="bai" digits="true" maxlength="10" value="{{Param.bai}}">
                </div>
                <div class="mt5"> 拾<input type="text" class="w90" boxNumber="3" name="shi" digits="true" maxlength="10" value="{{Param.shi}}"> 个<input type="text" class="w90" boxNumber="4" name="ge" digits="true" maxlength="10" value="{{Param.ge}}">
                </div>
              </td>
            </tr>
            <tr class="match-input hide">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="4" name="pei4" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="bg2">
              <td colspan="4" class="tc">
                <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="1">除</label>
                <label><input type="checkbox" class="remain-fixed-filter checkbox" remainFixedFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="tc">
              <td colspan="4">
                <div class="remain-fixed-filter-item"> 1. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he1" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 2. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he2" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 3. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he3" digits="true" maxlength="10">
                </div>
                <div class="remain-fixed-filter-item mt5"> 4. <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="checkbox">
                  <input type="text" class="w90" name="he4" digits="true" maxlength="10">
                </div>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong><br>
                <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-range">
                <strong class="red2">值 范 围</strong> 从 <input type="text" class="w30" name="zhifanwei1" digits="true" maxlength="10">值 至 <input type="text" class="w30" name="zhifanwei2" digits="true" maxlength="10">值
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
                <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
                <span class="inlineblock">
                  <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10">
                </span>
                <span class="gu-ding-wei-zhi hide"></br>
                  <strong class="red2">固定位置</strong>
                  <input type="checkbox" class="fixed-position-item">
                  <input type="checkbox" class="fixed-position-item">
                  <input type="checkbox" class="fixed-position-item">
                  <input type="checkbox" class="fixed-position-item">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label>
                <span class="inlineblock"> 四字定<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10"> 四字定<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
                <label><input type="checkbox" class="repeat-double-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-double-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双双重</strong>) 
                <span class="inlineblock">
                  <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
                  <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
                  <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="1">除</label>
                  <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">四重</strong>)
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
                <span class="inlineblock">
                  <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="1">除</label>
                  <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">四兄弟</strong>)
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_erx">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td class="tc">
                <strong class="red2">配数</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="match-input">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong>
                <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label> &nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 二字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
                <span class="inlineblock"> 二字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_sanx">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td class="tc">
                <strong class="red2">配数</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="match-input">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong><br>
                <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 三字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
                <span class="inlineblock"> 三字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_six">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td class="tc">
                <strong class="red2">配数</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr class="match-input">
              <td colspan="4" class="tc">
                <input type="text" class="w90" boxNumber="1" name="pei1" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="2" name="pei2" digits="true" maxlength="10">配,<input type="text" class="w90" boxNumber="3" name="pei3" digits="true" maxlength="10">
                <span class="inlineblock"> 配,<input type="text" class="w90" boxNumber="4" name="pei4" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="4" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong><br>
                <label><input type="checkbox" class="remain-match-filter checkbox" remainMatchFilter="2">两数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10"> &nbsp;&nbsp; <label><input type="checkbox" class="remain-match-filter-three checkbox" remainMatchFilterThree="3">三数合</label>
                <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked="checked">取</label> 四字现<strong class="red2">含</strong> <input type="text" class="contain-filter-item w80" name="han" digits="true" maxlength="10">
                <span class="inlineblock"> 四字现<strong class="red2">复式</strong> <input type="text" class="multiple-filter-item w90" name="fushi" digits="true" maxlength="10">
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-three-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">三重</strong>)
                <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-four-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">四重</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="three-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">三兄弟</strong>)
                <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="four-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">四兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="4" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
        <script type="text/html" id="tpl_fifteen">
          <table style="margin:23px 0" class="t-1">
            <tr class="bg2">
              <td class="tc" colspan="2">
                <strong class="red2">定位置</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="0" positionFilter="0" checked="checked">取</label>
              </td>
              <td class="tc" colspan="2">
                <strong class="red2">配数全转</strong>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="1">除</label>
                <label><input type="checkbox" class="position-filter checkbox" positionType="1" positionFilter="0">取</label>
              </td>
            </tr>
            <tr class="fixed-input">
              <td class="tc" colspan="2"> 仟<input type="text" boxNumber="1" class="w90" digits="true" maxlength="10">
              </td>
              <td class="tc" colspan="2"> 佰<input type="text" boxNumber="2" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="fixed-input">
              <td class="tc" colspan="2"> 拾<input type="text" boxNumber="3" class="w90" digits="true" maxlength="10">
              </td>
              <td class="tc" colspan="2"> 个<input type="text" boxNumber="4" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="fixed-input">
              <td class="tc" colspan="2"> 五<input type="text" boxNumber="5" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="match-input hide">
              <td class="tc" colspan="4">
                <input type="text" class="w90" boxNumber="4" digits="true" maxlength="10">&nbsp;配&nbsp;<input type="text" class="w90" boxNumber="5" digits="true" maxlength="10">
              </td>
            </tr>
            <tr class="bg2">
              <td class="tc" colspan="4">
                <strong class="red2">合</strong>&nbsp;&nbsp; <strong class="red2">分</strong>&nbsp;&nbsp; <label><input type="checkbox" class="checkbox remain-fixed-filter" remainfixedfilter="1">除</label>
                <label><input type="checkbox" class="checkbox remain-fixed-filter" remainfixedfilter="0" checked="checked">取</label>
              </td>
            </tr>
            <tr>
              <td class="tc remain-fixed-filter-item" colspan="4"> 1. <input type="checkbox" class="checkbox" />
                <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" /> XXX <input type="checkbox" class="checkbox" />
                <input type="text" name="he3" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td class="tc remain-fixed-filter-item" colspan="4"> 2. <input type="checkbox" class="checkbox hide" /> X <input type="checkbox" class="checkbox" />
                <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" /> XX <input type="checkbox" class="checkbox" />
                <input type="text" name="he4" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td class="tc remain-fixed-filter-item" colspan="4"> 3. <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" /> XX <input type="checkbox" class="checkbox" />
                <input type="checkbox" class="checkbox hide" /> X <input type="checkbox" class="checkbox" />
                <input type="text" name="he4" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td class="tc remain-fixed-filter-item" colspan="4"> 4. XXX <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox hide" />
                <input type="checkbox" class="checkbox" />
                <input type="checkbox" class="checkbox" />
                <input type="text" name="he4" class="w90" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="5" class="remain-match-filter-item">
                <strong class="red2">不定位合分</strong>
                <label><input type="checkbox" remainMatchFilter="2" class="remain-match-filter checkbox">两数合</label>&nbsp;&nbsp;&nbsp;&nbsp; <input type="text" class="w90" name="budinghe" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="5">
                <strong class="red2">全转</strong> <input type="text" class="transform-filter-item w80" name="quanzhuan" digits="true" maxlength="10">
                <strong class="red2">上奖</strong> <input type="text" class="upper-filter-item w80" name="shangjiang" digits="true" maxlength="10">
                <strong class="red2">排除</strong> <input type="text" class="except-filter-item w80" name="paichu" digits="true" maxlength="10"><br>
                <strong class="red2">乘号位置</strong>
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
                <input type="checkbox" class="symbol-filter-item">
              </td>
            </tr>
            <tr>
              <td colspan="5">
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="1">除</label>
                <label><input type="checkbox" class="contain-filter checkbox" containFilter="0" checked>取</label> 五位二定含 <input type="text" class="contain-filter-item  w80" name="han" digits="true" maxlength="10"><br>五位二定复式 <input type="text" class="multiple-filter-item  w80" name="fushi" digits="true" maxlength="10">
              </td>
            </tr>
            <tr>
              <td colspan="5">
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="1">除</label>
                <label><input type="checkbox" class="repeat-two-words-filter checkbox" repeatWordsFilter="0">取</label> (<strong class="red2">双重</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="5">
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="1">除</label>
                <label><input type="checkbox" class="two-brother-filter checkbox" brotherFilter="0">取</label> (<strong class="red2">二兄弟</strong>)
              </td>
            </tr>
            <tr>
              <td colspan="5" class="logarithm-number-item">
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="1">除</label>
                <label><input type="checkbox" class="logarithm-number-filter checkbox" logarithmNumberFilter="0">取</label> (<strong class="red2">对数</strong>) <br />
                <input type="text" class="w60" name="duishu1" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu2" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu3" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu4" pairNumber="true" maxlength="2">
                <input type="text" class="w60" name="duishu5" pairNumber="true" maxlength="2">
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="1">除</label>
                <label><input type="checkbox" class="odd-number-filter checkbox" oddNumberFilter="0">取</label> (<strong class="red2">单</strong>) <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <input type="checkbox" class="odd-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_odd"></span>&nbsp;&nbsp;<span id="selectCondition_odd"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="1">除</label>
                <label><input type="checkbox" class="even-number-filter checkbox" evenNumberFilter="0">取</label> (<strong class="red2">双</strong>) <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <input type="checkbox" class="even-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_even"></span>&nbsp;&nbsp;<span id="selectCondition_even"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="1">除</label>
                <label><input type="checkbox" class="big-number-filter checkbox" bigNumberFilter="0">取</label> (<strong class="red2">大</strong>) <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <input type="checkbox" class="big-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_big"></span>&nbsp;&nbsp;<span id="selectCondition_big"></span></span>
              </td>
            </tr>
            <tr>
              <td colspan="4">
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="1">除</label>
                <label><input type="checkbox" class="small-number-filter checkbox" smallNumberFilter="0">取</label> (<strong class="red2">小</strong>) <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <input type="checkbox" class="small-number-item checkbox">
                <span class="green fb f16"><span id="selectWord_small"></span>&nbsp;&nbsp;<span id="selectCondition_small"></span></span>
              </td>
            </tr>
          </table>
        </script>
      </div>
      <script type="text/html" id="tpl_number">
      {{if Data && Data.length >0}}
      {{each Data as item i}}
      {{if i % 7 == 0}}
      <tr>
        {{/if}}
        <td width="14.28%">{{item}}</td>
        {{/each}}
        {{else}}
      <tr><td>没有这样的号码</td></tr>
      {{/if}}
      </script>
      <script>
        ${this.codeMaker}
        ${js}
      </script>
      <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3">
      </audio>
    </body>
    </html>`;
  }
}

module.exports = { CodeMaker };