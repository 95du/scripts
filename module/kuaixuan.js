// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: superscript;
class CodeMaker {
  constructor(codeMaker, account, curStatus) {
    this.account = account?.member_account || null;
    this.curStatus = curStatus;
    this.codeMaker = codeMaker;
  }
  
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
    li{list-style-type:none;}
    img{vertical-align:top;border:0;}
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
    i, em{font-style:normal;}
    .hide {display:none;}
    .vhide {visibility:hidden;}
    .ime-dis {ime-mode:disabled;}
    .inlineblock {display:inline-block;}
    .inlineblock {*display:inline;}
    .hx a,.hx em{font-weight:bold;}
    .clearfix{*zoom:1;}
    .clearfix:after{display:block; overflow:hidden; clear:both; height:0; visibility:hidden; content:".";}
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
    .header .lotteryType-nav{width:130px;height:22px;border:1px #fff solid;border-radius:5px;display:inline-block;overflow:hidden;z-index:20;background-color:#599d3a;color:#f5f90a;position:absolute;margin: auto;left: 0;right: 0;font-size:16px;}
    .header .lotteryType-nav-now-down{position:absolute;right:5px;font-size:12px;}
    .header .lotteryType-nav a{color:#f5f90a;}
    .header .lotteryType-nav.on{height:auto;}
    .header .lotteryType-nav-now{display:inline-block;width:130px;}
    .header .lotteryType-nav-item{width:130px;height:24px;display:inline-block;margin-top:2px;}
    .header .lotteryType-nav-item.on{background-color:#437830}
    .header .topinfo{position:relative;z-index:10;bottom:-25px;}
    .header .nav {text-align:center; font-size:1.5rem;height:2.5rem;}
    .header .nav li {display:inline-block; font-weight:bold; margin:0 0.3rem;height:2.5rem;}
    .header .nav li a {color:#106eb4;}
    .header .nav li.on a {color:red;}
    .header .nav .more{position:relative;}
    .header .nav .more div{position:absolute;top:2.5rem;left:-2.6rem;width:7rem;height:auto;z-index:999;background:#fb5924;box-shadow:0rem 0.1rem 0.1rem rgba(0,0,0,.5); border:1px solid #fff;border-bottom:none;margin-top:-1px;}
    .header .nav .more div a{height:2.5rem;line-height:2.5rem;color:white;border-bottom:1px solid #fff;font-size:1.2rem;display:block;}
    .main {position:absolute; top:5.2rem; bottom:0; overflow:auto; width:100%; padding:0 0 10px;}
    .html-android, .html-android body {height:auto; overflow:auto;}
    .html-android .main {top:0; position:static; padding-top: 2.4rem; }
    
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
    .mask{position:absolute;margin-top:0;top:0;left:0;z-index:1000;width:100%;height:100%;background:#000;opacity:0.3;}
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
    .kuaixuan .tb-kuaixuan td{border:1px solid #f6d3bc; padding:5px 0;}
    .kuaixuan .kx-btn{width: 100%;border: none;background: none;outline: none;}
    .kuaixuan td.on .kx-btn {color: #fff;font-weight:bold;}
    
    .keyboard-betno {background:red; vertical-align:top;}
    .keyboard-betno td {border:none; padding:1px 1px 2px; height:auto; width:16%;}
    .keyboard-betno tr td:last-child {width:20%;}
    .keyboard-betno input[type=button] {border:1px solid yellow; color:yellow; background:red; box-sizing:border-box; width:100%; height:3.2rem; -webkit-appearance:none; font-size:2rem}
    .keyboard-money, .keyboard-money input[type=button]{background:blue;}
    
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
    
    .ssc_table_bg{background:#fff repeat-y center;background-size:100%;*background:#fff;}
    
    /* testline */
    .testline .status {display:none; color:red; margin:0 0 0 10px;}
    .testline .best .status {display:inline-block;}
    `
  };
  
  // 注入拦截 js
  intercept = () => {
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
      
      // 初始化
      window.G = window.G || {};
      G.modules = G.modules || {};
      G.instance = G.instance || {};
      const kx = window.__kx = new Kuaixuan({ json: { Param: {} } });
      kx.d = $('#kuaixuan');
      kx.bd_template = $('#bd_template');
      kx.init();
      
      // 启动原站倒计时
      if (typeof Header !== 'undefined') {
        const header = new Header($('#header'));
        G.instance.header = header;
        const mockData = ${JSON.stringify(this.curStatus)} || {};
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
          bet_log: f.logs ? f.logs.join('，') : '',
          guid: this.guid,
          period_no: ${this.curStatus?.period_no} || '2025',
          operation_condition: f.operation_condition || f.options
        }).map(([k, v]) => k + '=' + encodeURIComponent(typeof v === 'object' ? JSON.stringify(v) : v))
          .join('&');
          
        completion?.(body);
        window.dispatchEvent(new CustomEvent('JBridge', { detail: body }));
        
        // 显示动画
        const $n = $("#numberList")
        const $s = $(".betStatus")
        const $c = $("#multi_count");
        $n.hide(); $s.show(); 
        $c.html("0").removeClass("red");
        const total = f.numberList.length;
        $s.find('span').text(total); 
        const start = Date.now();
        const duration = Math.min(1000, 300 + total * 0.7);
      
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
            // setTimeout(() => { kx.codeMaker.reset(); }, 5000);
          }
        };
        requestAnimationFrame(step);
      }
    })`;
  };
  
  // 返回完整 HTML
  html = async () => {
    return `
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link href="/Styles/style-FiveMinutes.css?v=20250912115700000" type="text/css" rel="stylesheet" />
      <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
      <style>
        ${this.css()}
        body {
          font-family: -apple-system,Arial;
          margin: 0;
          padding: 2px;
          min-height: 130vh;
          overflow-y: auto;
        }
        .t-1 .bg3 td {
          background: #e3f5fd;
        }
        .time {
          text-align: center;
          margin-top: -30px; 
          color: #111;
        }
        .systime { 
          left: 0; 
          right: 0:
        }
        .header {
          margin: 0 -2px;
          background:#fb5924;
          font-weight:bold;
          height:4rem;
          text-align:center;
          font-size:1.4rem;
          color: #fff;
          line-height: 4rem;
        }
        .module { margin-top: 100px; }
        #tip {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.6);
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
      </style>
    </head>
    <body>
      <div id="header" class="header hide">账号 ${this.account} 快选规则 ( 离线 )</div>
      <div class="tc systime time" id="systime">${this.curStatus}</div>
      <div id="tip"><span></span></div>
      <div class="module">
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
                      <td>生成号码框</td>
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
                <span class="gu-ding-wei-zhi hide">
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
        <script>
          ${this.codeMaker}
          ${this.intercept()}
        </script>
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
      <audio id="audio" src="https://www.bqxfiles.com/music/success.mp3">
      </audio>
    </body>
    </html>`;
  }
}

module.exports = CodeMaker;