// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: light-brown; icon-glyph: magic;

  <body>
    <main class="layer-radar ui-blur ui-clock">
      <section id="map"  tabindex="0">
      </section>
      <div class="hit">
        <div class="hit-title">
        </div>
        <div class="hit-model">
        </div>
        <div class="hit-timeline">
        </div>
        <div class="hit-clock">
        </div>
        <div class="hit-footer">
        </div>
      </div>
      <div class="footer-coordinate">
        <div class="lat">
        </div>
        <div class="lon">
        </div>
      </div>
      <div class="scale-line">
        <div>
        </div>
      </div>
      <aside class="notices">
      </aside>
      <nav class="panel model"  aria-label="预测模型">
        <form>
          <div>
            <h4>预测模型</h4>
            <div>
              <input type="radio"  name="model"  id="model-icon"  checked>
              <label for="model-icon"  class="icon">
                <span class="item">
                  <span class="name">ICON</span>
                  <span class="resolution">13 公里</span>
                </span>
              </label>
            </div>
            <div>
              <input type="radio"  name="model"  id="model-gfs">
              <label for="model-gfs"  class="gfs">
                <span class="item">
                  <span class="name">GFS</span>
                  <span class="resolution">22 公里</span>
                </span>
              </label>
            </div>
          </div>
        </form>
      </nav>
      <div class="group overlays">
        <button class="radar"  aria-label="雷达探测到的雨雪"  data-state="off">
          <span class="menu-icon radar">
          </span>
        </button>
        <button class="coverage"  aria-label="有雷达覆盖的区域"  data-state="off">
          <span class="menu-icon coverage">
          </span>
        </button>
        <button class="clouds"  aria-label="云"  data-state="off">
          <span class="menu-icon clouds">
          </span>
        </button>
        <button class="isolines"  aria-label="气压等值线"  data-state="off">
          <span class="menu-icon isolines">
          </span>
        </button>
        <button class="wind-animation"  aria-label="风动画"  data-state="off">
          <span class="menu-icon wind-animation">
          </span>
        </button>
        <button class="heat"  aria-label="火灾和高温点"  data-state="off">
          <span class="menu-icon heat">
          </span>
        </button>
        <button class="more"  aria-label="更多的叠加层&hellip;&hellip;">
          <span class="menu-icon more">
          </span>
          <span class="close">
          </span>
        </button>
      </div>
      <nav class="panel overlays">
        <form>
          <div>
            <h4>叠加层</h4>
          </div>
        </form>
      </nav>
      <button class="layers"  aria-label="实时图, 预报图">
        <span class="menu-icon">
        </span>
        <span class="close">
        </span>
      </button>
      <button class="layers-dropdown"  aria-label="实时图, 预报图">
        <span class="menu-icon">
        </span>
        <span class="text">
        </span>
        <span class="arrow">
        </span>
      </button>
      <nav class="panel layers">
        <form>
          <div>
            <div class="live">
              <h4>实时图</h4>
            </div>
            <div class="forecast">
              <h4>预报图</h4>
            </div>
          </div>
          <button class="arrow"  aria-label="实时图, 预报图">
            <span class="icon">
            </span>
          </button>
        </form>
      </nav>
      <div class="panel time timeline loading"  tabindex="0">
        <div class="scroll">
          <div class="pad">
            <div class="times">
            </div>
            <div class="recent-indicator">
            </div>
          </div>
        </div>
        <div class="time-indicator">
        </div>
        <div class="time-tooltip">
          <div class="anchor">
          </div>
          <div class="text">&nbsp;</div>
        </div>
        <svg class="progress">
          <circle cx="50%"  cy="50%"  r="15.9155"  stroke="#fff"  stroke-width="2.5"  fill="none"  class="track" />
          <circle cx="50%"  cy="50%"  r="15.9155"  stroke="#fff"  stroke-width="2.5"  fill="none"  class="bar" />
        </svg>
        <button class="pause"  aria-label="暂停动画">
          <span>
          </span>
        </button>
        <button class="play"  aria-label="播放动画">
          <span>
          </span>
        </button>
        <button class="recent latest"  aria-label="最晚时间"  disabled>
          <span>
          </span>
        </button>
        <button class="recent now"  aria-label="现在"  disabled>
          <span>
          </span>
        </button>
      </div>
      <div class="panel time clock">
        <nav class="clock-live">
          <svg class="progress">
            <circle cx="50%"  cy="50%"  r="15.9155"  stroke="#fff"  stroke-width="2.5"  fill="none"  class="track" />
            <circle cx="50%"  cy="50%"  r="15.9155"  stroke="#fff"  stroke-width="2.5"  fill="none"  class="bar" />
          </svg>
          <button class="pause"  aria-label="暂停动画">
            <span>
            </span>
          </button>
          <button class="play"  aria-label="播放动画">
            <span>
            </span>
          </button>
          <div class="date">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一天"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="前一天"  disabled>
              <span>
              </span>
            </button>
          </div>
          <div class="text colon">:</div>
          <div class="hour">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一小时"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="前一小时"  disabled>
              <span>
              </span>
            </button>
          </div>
          <div class="text am-pm">
          </div>
          <div class="text utc">UTC</div>
          <div class="minute">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一时刻"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="上一时刻"  disabled>
              <span>
              </span>
            </button>
          </div>
        </nav>
        <nav class="clock-hd">
          <div class="year">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一年"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="上一年"  disabled>
              <span>
              </span>
            </button>
          </div>
          <div class="month">
            <div class="text">
            </div>
            <button class="up"  aria-label="下个月"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="上个月"  disabled>
              <span>
              </span>
            </button>
          </div>
          <div class="day">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一天"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="前一天"  disabled>
              <span>
              </span>
            </button>
          </div>
          <div class="am-pm">
            <div class="text">
            </div>
            <button class="up"  aria-label="下一时刻"  disabled>
              <span>
              </span>
            </button>
            <button class="down"  aria-label="上一时刻"  disabled>
              <span>
              </span>
            </button>
          </div>
        </nav>
        <button class="recent latest"  aria-label="最晚时间"  disabled>
          <span>
          </span>
        </button>
        <button class="recent now"  aria-label="现在"  disabled>
          <span>
          </span>
        </button>
      </div>
      <!-- 1. 自定义设置按钮-->
      <button id="custom-settings-btn" class="settings custom-settings-btn" aria-label="设置">
        <span class="icon"></span>
      </button>
      <button class="search"  aria-label="搜索">
        <span class="icon">
        </span>
        <span class="close">
        </span>
      </button>
      <button class="geolocation"  aria-label="显示当前位置">
        <span class="icon">
        </span>
      </button>
      <nav class="panel title">
        <form>
          <div>
            <h2>降水雷达地图</h2>
          </div>
        </form>
      </nav>
      <div class="group zoom">
        <button class="in"  aria-label="放大">
          <span class="icon">
          </span>
        </button>
        <button class="out"  aria-label="缩小">
          <span class="icon">
          </span>
        </button>
      </div>
      <aside class="panel search notranslate">
        <header class="search">
          <h3>搜索</h3>
          <button class="close"  aria-label="关闭">
            <span>
            </span>
          </button>
          <div>
            <form>
              <input name="q"  type="search"  enterkeyhint="search"  placeholder="查找地点或风暴&hellip;&hellip;"  aria-label="搜索"  maxlength="255"  autocorrect="off"  autocapitalize="off"  autocomplete="off">
            </form>
            <button class="geolocation-search"  aria-label="显示当前位置">
              <span class="icon">
              </span>
              <span class="text locate">显示当前位置</span>
              <span class="text locating">正在定位&hellip;&hellip;</span>
            </button>
            <button class="geolocation-remove"  aria-label="移除">
              <span>
              </span>
            </button>
          </div>
        </header>
        <section class="news">
          <div class="results user">
          </div>
          <div class="results remote">
          </div>
          <div class="activity">
            <div class="dots">
              <div>
              </div>
              <div>
              </div>
              <div>
              </div>
            </div>
            <div class="message">
              <p>无法加载</p>
              <button>
                <span class="icon">
                </span>
                <span class="text">重试</span>
              </button>
            </div>
          </div>
        </section>
        <section class="query">
          <div class="results">
          </div>
        </section>
      </aside>
      <aside class="panel settings">
        <div class="icon">
        </div>
        <h3>设置</h3>
        <button class="close"  aria-label="关闭">
          <span>
          </span>
        </button>
        <form name="settings">
          <div>
            <h4>时间</h4>
            <section class="bubble">
              <div class="bar2">
                <p>
                  <span class="menu-icon time-zone">
                  </span>
                  时区
                  <kbd class="hotkey">Z</kbd>
                </p>
                <div>
                  <input type="radio"  name="time-zone"  id="setting-time-zone-local"  value="local"  checked>
                  <label for="setting-time-zone-local">本地</label>
                  <input type="radio"  name="time-zone"  id="setting-time-zone-utc"  value="utc">
                  <label for="setting-time-zone-utc">UTC</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon time-format">
                  </span>
                  时间格式
                  <kbd class="hotkey">T</kbd>
                </p>
                <div>
                  <input type="radio"  name="time-format"  id="setting-time-format-hour12"  value="hour12"  checked>
                  <label for="setting-time-format-hour12">12小时</label>
                  <input type="radio"  name="time-format"  id="setting-time-format-hour24"  value="hour24">
                  <label for="setting-time-format-hour24">24小时</label>
                </div>
              </div>
              <div class="bar2 time-control">
                <p>
                  <span class="menu-icon time-control">
                  </span>
                  时间控制
                  <kbd class="hotkey">J</kbd>
                </p>
                <div>
                  <input type="radio"  name="time-control"  id="setting-time-control-timeline"  value="timeline"  checked>
                  <label for="setting-time-control-timeline">时间线</label>
                  <input type="radio"  name="time-control"  id="setting-time-control-clock"  value="clock">
                  <label for="setting-time-control-clock">时钟</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon summary">
                  </span>
                  预报概览
                  <kbd class="hotkey">U</kbd>
                </p>
                <div>
                  <input type="radio"  name="summary"  id="setting-summary-daily"  value="daily"  checked>
                  <label for="setting-summary-daily">每日</label>
                  <input type="radio"  name="summary"  id="setting-summary-hourly"  value="hourly">
                  <label for="setting-summary-hourly">逐小时</label>
                </div>
              </div>
            </section>
            <h4 class="custom">定制化</h4>
            <section class="bubble custom">
              <div class="bar2 appearance">
                <p>
                  <span class="menu-icon appearance">
                  </span>
                  外观
                </p>
                <div>
                  <input type="radio"  name="appearance"  id="setting-appearance-translucent"  value="translucent"  checked>
                  <label for="setting-appearance-translucent">半透明</label>
                  <input type="radio"  name="appearance"  id="setting-appearance-opaque"  value="opaque">
                  <label for="setting-appearance-opaque">不透明</label>
                </div>
              </div>
              <div class="bar2 map-tooltip-setting">
                <p>
                  <span class="menu-icon map-tooltip-setting">
                  </span>
                  地图提示
                </p>
                <div>
                  <input type="radio"  name="map-tooltip"  id="setting-map-tooltip-enabled"  value="enabled"  checked>
                  <label for="setting-map-tooltip-enabled">开启</label>
                  <input type="radio"  name="map-tooltip"  id="setting-map-tooltip-disabled"  value="disabled">
                  <label for="setting-map-tooltip-disabled">关闭</label>
                </div>
              </div>
              <div class="bar2 precipitation-theme">
                <p>
                  <span class="menu-icon precipitation-theme">
                  </span>
                  降水主题
                  <kbd class="hotkey">D</kbd>
                </p>
                <div>
                  <input type="radio"  name="precipitation-theme"  id="setting-precipitation-theme-light"  value="light"  checked>
                  <label for="setting-precipitation-theme-light">浅色</label>
                  <input type="radio"  name="precipitation-theme"  id="setting-precipitation-theme-dark"  value="dark">
                  <label for="setting-precipitation-theme-dark">深色</label>
                </div>
              </div>
            </section>
            <h4>动画</h4>
            <section class="bubble">
              <div class="bar3">
                <p>
                  <span class="menu-icon animation-speed">
                  </span>
                  动画速度
                  <kbd class="hotkey">A</kbd>
                </p>
                <div>
                  <input type="radio"  name="animation-speed"  id="setting-animation-slow"  value="slow">
                  <label for="setting-animation-slow">慢速</label>
                  <input type="radio"  name="animation-speed"  id="setting-animation-medium"  value="medium"  checked>
                  <label for="setting-animation-medium">中等</label>
                  <input type="radio"  name="animation-speed"  id="setting-animation-fast"  value="fast">
                  <label for="setting-animation-fast">快速</label>
                </div>
              </div>
              <div>
                <p>
                  <span class="menu-icon satellite">
                  </span>
                  卫星动画时长
                </p>
                <div>
                  <input type="radio"  name="animation-duration"  id="setting-animation-duration1"  value="3"  checked>
                  <label for="setting-animation-duration1">3小时</label>
                  <input type="radio"  name="animation-duration"  id="setting-animation-duration2"  value="6">
                  <label for="setting-animation-duration2">6小时</label>
                  <input type="radio"  name="animation-duration"  id="setting-animation-duration3"  value="12">
                  <label for="setting-animation-duration3">12小时</label>
                  <input type="radio"  name="animation-duration"  id="setting-animation-duration4"  value="24">
                  <label for="setting-animation-duration4">24小时</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon satellite">
                  </span>
                  卫星动画样式
                </p>
                <div>
                  <input type="radio"  name="animation-style"  id="setting-animation-style-fast"  value="fast"  checked>
                  <label for="setting-animation-style-fast">快速</label>
                  <input type="radio"  name="animation-style"  id="setting-animation-style-smooth"  value="smooth">
                  <label for="setting-animation-style-smooth">流畅</label>
                </div>
              </div>
            </section>
            <h4>测量单位</h4>
            <section class="bubble">
              <div class="bar3">
                <p>
                  <span class="menu-icon precipitation">
                  </span>
                  降水量
                </p>
                <div>
                  <input type="radio"  name="precipitation-unit"  id="setting-precipitation-mmh"  value="mmh">
                  <label for="setting-precipitation-mmh">毫米/小时</label>
                  <input type="radio"  name="precipitation-unit"  id="setting-precipitation-inh"  value="inh"  checked>
                  <label for="setting-precipitation-inh">英寸/小时</label>
                  <input type="radio"  name="precipitation-unit"  id="setting-precipitation-dbz"  value="dbz"  checked>
                  <label for="setting-precipitation-dbz">dBZ</label>
                </div>
              </div>
              <div class="bar5">
                <p>
                  <span class="menu-icon wind">
                  </span>
                  风速
                </p>
                <div>
                  <input type="radio"  name="wind-unit"  id="setting-wind-kmh"  value="kmh">
                  <label for="setting-wind-kmh">公里/小时</label>
                  <input type="radio"  name="wind-unit"  id="setting-wind-ms"  value="ms">
                  <label for="setting-wind-ms">米/秒</label>
                  <input type="radio"  name="wind-unit"  id="setting-wind-mph"  value="mph"  checked>
                  <label for="setting-wind-mph">英里/小时</label>
                  <input type="radio"  name="wind-unit"  id="setting-wind-knots"  value="knots">
                  <label for="setting-wind-knots">节</label>
                  <input type="radio"  name="wind-unit"  id="setting-wind-beaufort"  value="beaufort">
                  <label for="setting-wind-beaufort">蒲福</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon wind-direction">
                  </span>
                  风向
                </p>
                <div>
                  <input type="radio"  name="wind-direction-unit"  id="setting-wind-direction-compass"  value="compass"  checked>
                  <label for="setting-wind-direction-compass">罗盘</label>
                  <input type="radio"  name="wind-direction-unit"  id="setting-wind-direction-degrees"  value="degrees">
                  <label for="setting-wind-direction-degrees">度</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon temperature">
                  </span>
                  温度
                </p>
                <div>
                  <input type="radio"  name="temperature-unit"  id="setting-temperature-celsius"  value="celsius">
                  <label for="setting-temperature-celsius">摄氏度</label>
                  <input type="radio"  name="temperature-unit"  id="setting-temperature-fahrenheit"  value="fahrenheit"  checked>
                  <label for="setting-temperature-fahrenheit">华氏度</label>
                </div>
              </div>
              <div>
                <p>
                  <span class="menu-icon pressure">
                  </span>
                  气压
                </p>
                <div>
                  <input type="radio"  name="pressure-unit"  id="setting-pressure-hpa"  value="hpa">
                  <label for="setting-pressure-hpa">hPa</label>
                  <input type="radio"  name="pressure-unit"  id="setting-pressure-mb"  value="mb"  checked>
                  <label for="setting-pressure-mb">毫巴</label>
                  <input type="radio"  name="pressure-unit"  id="setting-pressure-mmhg"  value="mmhg">
                  <label for="setting-pressure-mmhg">mmHg</label>
                  <input type="radio"  name="pressure-unit"  id="setting-pressure-inhg"  value="inhg">
                  <label for="setting-pressure-inhg">inHg</label>
                </div>
              </div>
              <div>
                <p>
                  <span class="menu-icon measure-distance">
                  </span>
                  距离
                </p>
                <div>
                  <input type="radio"  name="distance-unit"  id="setting-distance-metric"  value="metric">
                  <label for="setting-distance-metric">公里</label>
                  <input type="radio"  name="distance-unit"  id="setting-distance-imperial"  value="imperial"  checked>
                  <label for="setting-distance-imperial">英里</label>
                  <input type="radio"  name="distance-unit"  id="setting-distance-nautical"  value="nautical">
                  <label for="setting-distance-nautical"  class="wide">海里</label>
                </div>
              </div>
              <div>
                <p>
                  <span class="menu-icon measure-area">
                  </span>
                  面积
                </p>
                <div>
                  <input type="radio"  name="area-unit"  id="setting-area-metric"  value="metric">
                  <label for="setting-area-metric">平方公里</label>
                  <input type="radio"  name="area-unit"  id="setting-area-imperial"  value="imperial"  checked>
                  <label for="setting-area-imperial">平方英里</label>
                  <input type="radio"  name="area-unit"  id="setting-area-acres"  value="acres">
                  <label for="setting-area-acres">英亩</label>
                  <input type="radio"  name="area-unit"  id="setting-area-hectares"  value="hectares">
                  <label for="setting-area-hectares">公顷</label>
                </div>
              </div>
              <div>
                <p>
                  <span class="menu-icon fire-area">
                  </span>
                  过火面积
                </p>
                <div>
                  <input type="radio"  name="fire-area-unit"  id="setting-fire-area-metric"  value="metric">
                  <label for="setting-fire-area-metric">平方公里</label>
                  <input type="radio"  name="fire-area-unit"  id="setting-fire-area-imperial"  value="imperial">
                  <label for="setting-fire-area-imperial">平方英里</label>
                  <input type="radio"  name="fire-area-unit"  id="setting-fire-area-acres"  value="acres"  checked>
                  <label for="setting-fire-area-acres">英亩</label>
                  <input type="radio"  name="fire-area-unit"  id="setting-fire-area-hectares"  value="hectares">
                  <label for="setting-fire-area-hectares">公顷</label>
                </div>
              </div>
              <div class="bar2">
                <p>
                  <span class="menu-icon coordinate-system">
                  </span>
                  坐标系
                </p>
                <div>
                  <input type="radio"  name="coordinate-unit"  id="setting-coordinate-dms"  value="dms"  checked>
                  <label for="setting-coordinate-dms">度分秒</label>
                  <input type="radio"  name="coordinate-unit"  id="setting-coordinate-decimal"  value="decimal">
                  <label for="setting-coordinate-decimal">十进制度</label>
                </div>
              </div>
            </section>
            <h4 class="lang">语言</h4>
            <section class="bubble lang">
              <div class="bar2">
                <div>
                  <input type="radio"  name="language"  id="setting-language-en"  value="en">
                  <label for="setting-language-en">English</label>
                  <input type="radio"  name="language"  id="setting-language-ar"  value="ar">
                  <label for="setting-language-ar">العربية</label>
                  <input type="radio"  name="language"  id="setting-language-de"  value="de">
                  <label for="setting-language-de">Deutsch</label>
                  <input type="radio"  name="language"  id="setting-language-es"  value="es">
                  <label for="setting-language-es">español</label>
                  <input type="radio"  name="language"  id="setting-language-fr"  value="fr">
                  <label for="setting-language-fr">français</label>
                  <input type="radio"  name="language"  id="setting-language-hi"  value="hi">
                  <label for="setting-language-hi">हिंदी</label>
                  <input type="radio"  name="language"  id="setting-language-it"  value="it">
                  <label for="setting-language-it">italiano</label>
                  <input type="radio"  name="language"  id="setting-language-ja"  value="ja">
                  <label for="setting-language-ja">日本語</label>
                  <input type="radio"  name="language"  id="setting-language-ko"  value="ko">
                  <label for="setting-language-ko">한국어</label>
                  <input type="radio"  name="language"  id="setting-language-nl"  value="nl">
                  <label for="setting-language-nl">nederlands</label>
                  <input type="radio"  name="language"  id="setting-language-pt"  value="pt">
                  <label for="setting-language-pt">português</label>
                  <input type="radio"  name="language"  id="setting-language-ru"  value="ru">
                  <label for="setting-language-ru">русский</label>
                  <input type="radio"  name="language"  id="setting-language-tr"  value="tr">
                  <label for="setting-language-tr">türkçe</label>
                  <input type="radio"  name="language"  id="setting-language-zh"  value="zh"  checked>
                  <label for="setting-language-zh">中文</label>
                </div>
              </div>
            </section>
          </div>
        </form>
      </aside>
      <aside class="panel weather daily notranslate">
        <header>
          <button class="done">
            <span class="icon">
            </span>
          </button>
          <button class="save">
            <span class="icon">
            </span>
            <span class="pulse">
            </span>
          </button>
          <h2>
          </h2>
          <form>
            <input name="title"  type="text"  inputmode="text"  enterkeyhint="done"  maxlength="32"  autocorrect="off"  autocapitalize="sentences"  autocomplete="off"  spellcheck="false">
          </form>
          <button class="close"  aria-label="关闭">
            <span>
            </span>
          </button>
        </header>
        <section>
          <table>
          </table>
        </section>
        <div class="activity">
          <div class="dots">
            <div>
            </div>
            <div>
            </div>
            <div>
            </div>
          </div>
          <div class="message">
            <p>无法加载</p>
            <button>
              <span class="icon">
              </span>
              <span class="text">重试</span>
            </button>
          </div>
        </div>
      </aside>
      <article class="panel storm-details">
        <header>
          <h1>
          </h1>
          <p class="lastmod">
          </p>
          <button class="close"  aria-label="关闭">
            <span>
            </span>
          </button>
        </header>
        <section>
          <div class="text">
          </div>
        </section>
        <div class="activity">
          <div class="dots">
            <div>
            </div>
            <div>
            </div>
            <div>
            </div>
          </div>
          <div class="message">
            <p>无法加载</p>
            <button>
              <span class="icon">
              </span>
              <span class="text">重试</span>
            </button>
          </div>
        </div>
      </article>
      <aside class="panel storm notranslate">
        <header>
          <h2>
          </h2>
          <button class="close"  aria-label="关闭">
            <span>
            </span>
          </button>
        </header>
        <section>
          <table>
            <thead>
              <tr class="title">
                <th class="date">日期</th>
                <th class="time">时间</th>
                <th class="type">类别</th>
                <th class="wind">风</th>
                <th class="pressure">气压</th>
              </tr>
              <tr class="units">
                <td class="date"  colspan="2">UTC</td>
                <td class="type">
                </td>
                <td class="wind changeable">英里/小时</td>
                <td class="pressure changeable">毫巴</td>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </section>
        <footer>
          <p class="text-type">
          </p>
          <p class="text-alt">
          </p>
          <p class="details">
            <span class="icon">
            </span>
            <span class="text long">最新警告和信息</span>
            <span class="text short">忠告</span>
          </p>
        </footer>
      </aside>
      <aside class="panel share">
        <header>
          <h3>分享</h3>
          <form>
            <input name="url"  type="text"  readonly>
            <button class="copy">
              <span class="text copy">复制链接</span>
              <span class="text copied">已复制！</span>
            </button>
          </form>
        </header>
        <div class="social">
          <a class="email"  style="color:#333;background-color:rgba(255,255,255,0.85)"  data-template="mailto:?subject={text}&body={text}%0A%0A{url}%0A%0A">电子邮件</a>
          <a class="weibo"  style="background-color:#f93"  data-template="https://service.weibo.com/share/share.php?url={url}&title={text}">微博</a>
          <a class="baidu"  style="background-color:#3b33db"  data-template="http://tieba.baidu.com/i/app/open_share_api?link={url}">百度</a>
          <a class="douban"  style="background-color:#41ac52"  data-template="https://www.douban.com/recommend/?url={url}&title={title}">豆瓣</a>
          <a class="whatsapp"  style="background-color:#25d366"  data-template="https://wa.me/?text={text}%20{url}">WhatsApp</a>
          <a class="telegram"  style="background-color:#1c93e3"  data-template="https://telegram.me/share/url?url={url}&text={text}">Telegram</a>
          <a class="facebook"  style="background-color:#1877f2"  data-template="https://www.facebook.com/sharer.php?u={url}&quote={text}">Facebook</a>
          <a class="linkedin"  style="background-color:#0a66c2"  data-template="https://www.linkedin.com/shareArticle?url={url}&title={text}">LinkedIn</a>
        </div>
      </aside>
      <aside class="panel about notranslate">
        <div class="icon">
        </div>
        <h3>信息</h3>
        <button class="close"  aria-label="关闭">
          <span>
          </span>
        </button>
        <div class="content">
          <div>
            <header>
              <div class="title-logo">
                <div class="icon">
                </div>
                <div class="title">
                </div>
              </div>
              <p>
                <strong>Zoom&nbsp;Earth</strong>
                是交互式世界天气图。
              </p>
              <p>通过精美的交互式地图查看降雨、风力、气温、气压等信息，探索当前天气和你所在位置的详细预报。</p>
              <p>
                借助
                <strong>Zoom&nbsp;Earth</strong>
                你可以跟踪飓风和风暴的发展、监测野火和烟雾、并通过查看近乎实时更新的卫星图像和降雨雷达来了解最新情况。
              </p>
            </header>
            <h4 class="app-head">移动应用</h4>
            <section class="bubble app-links">
              <a href="https://play.google.com/store/apps/details?id=com.neave.zoomearth"  target="_blank"  rel="nofollow noopener">
                <img src="/assets/images/icon-200.1.jpg"  width="100"  height="100"  loading="lazy"  alt="App"  class="touch">
              </a>
              <a href="/app/"  rel="nofollow">
                <img src="/assets/images/qr-app.svg"  width="145"  height="145"  loading="lazy"  alt="QR"  class="qr">
              </a>
              <p class="touch">
                下载
                <a href="https://play.google.com/store/apps/details?id=com.neave.zoomearth"  target="_blank"  rel="nofollow noopener">
                  <strong>Zoom&nbsp;Earth</strong>
                </a>
                应用！
              </p>
              <p class="qr">
                使用移动设备的摄像头
                <strong>扫描二维码</strong>
                ，获取
                <strong>Zoom&nbsp;Earth</strong>
                应用程序。
              </p>
              <p>
                可在 iPhone 和 iPad 的
                <a href="https://apps.apple.com/us/app/id1531561063"  target="_blank"  rel="nofollow noopener">App Store</a>
                ，以及 Android 的
                <a href="https://play.google.com/store/apps/details?id=com.neave.zoomearth"  target="_blank"  rel="nofollow noopener">Google Play</a>
                上获取。
              </p>
            </section>
            <h4>数据源</h4>
            <section class="bubble sources">
              <p>
                <span class="menu-icon precipitation">
                </span>
                天气预报会根据 DWD
                <a href="https://www.dwd.de/EN/research/weatherforecasting/num_modelling/01_num_weather_prediction_modells/icon_description.html"  target="_blank"  rel="nofollow noopener"  title="Icosahedral Nonhydrostatic">ICON</a>
                和 NOAA/NCEP/NWS
                <a href="https://www.emc.ncep.noaa.gov/emc/pages/numerical_forecast_systems/gfs.php"  target="_blank"  rel="nofollow noopener"  title="Global Forecast System">GFS</a>
                全球模式的最新数据持续更新。
              </p>
              <p>
                <span class="menu-icon radar">
                </span>
                来自全球众多
                <a href="https://zoom.earth/legal/radar/"  target="_blank"  rel="noopener">气象数据源</a>
                的雷达数据会被实时处理。
              </p>
              <p>
                <span class="menu-icon satellite">
                </span>
                实时卫星图像由地球静止卫星
                <a href="https://www.nesdis.noaa.gov/our-satellites/currently-flying/geostationary-satellites"  target="_blank"  rel="nofollow noopener">NOAA GOES</a>
                、
                <a href="https://www.eumetsat.int/our-satellites/meteosat-series"  target="_blank"  rel="nofollow noopener">EUMETSAT Meteosat</a>
                和
                <a href="https://www.jma.go.jp/jma/jma-eng/satellite/index.html"  target="_blank"  rel="nofollow noopener">日本气象厅向日葵</a>
                提供。
              </p>
              <p>
                <span class="menu-icon satellite">
                </span>
                高清卫星图像每天通过 NASA 极轨卫星
                <a href="https://aqua.nasa.gov/"  target="_blank"  rel="nofollow noopener">Aqua</a>
                和
                <a href="https://terra.nasa.gov/"  target="_blank"  rel="nofollow noopener">Terra</a>
                更新两次，并使用
                <a href="https://earthdata.nasa.gov/eosdis"  target="_blank"  rel="nofollow noopener"  title="Earth Observing System Data and Information System">EOSDIS</a>
                旗下的
                <a href="https://earthdata.nasa.gov/gibs"  target="_blank"  rel="nofollow noopener"  title="Global Imagery Browse Services">GIBS</a>
                服务。
              </p>
              <p>
                <span class="menu-icon storms">
                </span>
                热带系统路径使用
                <a href="https://www.nhc.noaa.gov/"  target="_blank"  rel="nofollow noopener"  title="National Hurricane Center">NHC</a>
                、
                <a href="https://www.metoc.navy.mil/jtwc/jtwc.html"  target="_blank"  rel="nofollow noopener"  title="Joint Typhoon Warning Center">JTWC</a>
                、
                <a href="https://www.nrlmry.navy.mil/TC.html"  target="_blank"  rel="nofollow noopener"  title="Naval Research Laboratory">NRL</a>
                和
                <a href="https://www.ncdc.noaa.gov/ibtracs/"  target="_blank"  rel="nofollow noopener"  title="International Best Track Archive for Climate Stewardship">IBTrACS</a>
                的最新数据生成。
              </p>
              <p>
                <span class="menu-icon fires">
                </span>
                当前火灾数据汇总自
                <a href="https://www.nifc.gov/"  target="_blank"  rel="nofollow noopener"  title="National Interagency Fire Center">NIFC</a>
                、
                <a href="https://ciffc.net/"  target="_blank"  rel="nofollow noopener"  title="Canadian Interagency Forest Fire Centre">CIFFC</a>
                、
                <a href="https://emergency.copernicus.eu/"  target="_blank"  rel="nofollow noopener"  title="Copernicus Emergency Management Service">CEMS</a>
                、
                <a href="https://forest-fire.emergency.copernicus.eu/"  target="_blank"  rel="nofollow noopener"  title="European Forest Fire Information System">EFFIS</a>
                、
                <a href="https://www.gdacs.org/"  target="_blank"  rel="nofollow noopener"  title="Global Disaster Alert and Coordination System">GDACS</a>
                ，以及世界各地的其他官方
                <a href="https://zoom.earth/legal/fires/"  target="_blank"  rel="noopener">数据源</a>
                。
              </p>
              <p>
                <span class="menu-icon heat">
                </span>
                高温点图层显示卫星探测到的极高温点。探测数据并非实时，而是通过 NASA LANCE
                <a href="https://firms.modaps.eosdis.nasa.gov/"  target="_blank"  rel="nofollow noopener"  title="Fire Information for Resource Management System">FIRMS</a>
                数据每日更新。
              </p>
              <p>
                <span class="menu-icon labels">
                </span>
                地图标签 &copy;
                <a href="https://www.openstreetmap.org/copyright"  target="_blank"  rel="nofollow noopener">OpenStreetMap</a>
                贡献者。
              </p>
            </section>
            <h4>联系我们</h4>
            <section class="bubble">
              <p class="link-contact">
                请使用我们的
                <a href="https://zoom.earth/contact/"  target="_blank"  rel="noopener">联系表单</a>
                发送你的意见、问题或建议。
              </p>
            </section>
            <footer>
              <p class="copyright">&copy; 2026 Neave Interactive Ltd.</p>
              <p>
                <a href="https://zoom.earth/legal/terms/"  target="_blank"  rel="noopener">服务条款</a>
              </p>
              <p>
                <a href="https://zoom.earth/legal/privacy/"  target="_blank"  rel="noopener">隐私政策</a>
              </p>
            </footer>
          </div>
        </div>
      </aside>
      <div class="dialogs">
      </div>

      <aside class="hud">
        <div class="panel">
        </div>
      </aside>
      <aside class="panel dialog heat-consent">
        <h3>
          <span class="icon">
          </span>
          高温点
        </h3>
        <button class="close"  aria-label="关闭">
          <span>
          </span>
        </button>
        <div class="items">
          <div class="icon p1">
          </div>
          <p>
            高温点
            <strong>并非实时数据！</strong>
            检测结果
            <em>每天</em>
            更新，并会延迟数小时。
          </p>
          <div class="icon p2">
          </div>
          <p>
            红点表示卫星检测到的极高温度的大致位置。它们可能来自火灾、
            <em>高温烟雾</em>
            或
            <em>农业活动</em>
            。
          </p>
          <div class="icon p3">
          </div>
          <p>云层可能阻碍热量检测。</p>
          <div class="icon p4">
          </div>
          <p>
            <strong>请勿</strong>
            将这些数据用于保护生命或财产！检测精度有限。请以当地部门的最新信息为准。
          </p>
        </div>
        <button class="dialog"  aria-label="是的，我明白">
          <span class="text">是的，我明白</span>
        </button>
      </aside>
      <aside class="panel dialog welcome location">
        <div class="title-logo">
          <div class="icon">
          </div>
          <div class="title">
          </div>
        </div>
        <button class="close"  aria-label="关闭">
          <span>
          </span>
        </button>
        <div class="app">
          <p>
            使用
            <strong>Zoom&nbsp;Earth</strong>
            实时掌握天气。
          </p>
          <a href="https://play.google.com/store/apps/details?id=com.neave.zoomearth"  rel="nofollow"  class="app-link">
            <span class="icon">
            </span>
            <span class="text">下载应用</span>
          </a>
          <button class="dialog continue"  aria-label="继续">
            <span class="text">继续</span>
          </button>
        </div>
        <div class="location">
          <p>欢迎！先在地图上找到你的位置。</p>
          <button class="dialog accent geolocation-welcome"  aria-label="显示当前位置">
            <span class="icon">
            </span>
            <span class="text locate">显示当前位置</span>
            <span class="text locating">正在定位&hellip;&hellip;</span>
          </button>
          <button class="dialog search-welcome"  aria-label="搜索">
            <span class="icon">
            </span>
            <span class="text">搜索&hellip;&hellip;</span>
          </button>
        </div>
      </aside>
      <div class="panel ad-header">
        <div class="swap1">
          <ins class="adsbygoogle"  data-ad-client="ca-pub-9316345695176880"  data-ad-slot="6630109491"  data-restrict-data-processing="1"  style="display: inline-block; width: 468px; height: 60px;"  data-page-url="https://zoom.earth/">
          </ins>
          <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
        </div>
        <div class="swap2">
          <ins class="adsbygoogle"  data-ad-client="ca-pub-9316345695176880"  data-ad-slot="4247462300"  data-restrict-data-processing="1"  style="display: inline-block; width: 468px; height: 60px;"  data-page-url="https://zoom.earth/">
          </ins>
          <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
        </div>
      </div>
      <div class="main-tooltip"  role="tooltip">
        <div class="tooltip">
          <span class="text">
          </span>
          <span class="anchor">
          </span>
        </div>
      </div>
      <span class="preload-images">
      </span>
    </main>
    <script>window._ZE={"version":{"labels":"v12","fill":"v1","land":"v1","line":"v1","gfs":"v1","icon":"v1","bundle":"24434048"},"config":{"countryCode":"US","mobile":false,"appURL":"https://play.google.com/store/apps/details?id=com.neave.zoomearth","useMTG":true,"useLog":false,"adsense":"ca-pub-9316345695176880"},"tiles":{"geocolor":{"min":1789297200,"max":1790160000},"radar":{"min":1789902600,"max":1790163000}},"place":{"isDefault":true,"isMarker":false,"view":"39.4,-97.9294,4"},"strings":{"date":{"days":["\\u661f\\u671f\\u65e5","\\u661f\\u671f\\u4e00","\\u661f\\u671f\\u4e8c","\\u661f\\u671f\\u4e09","\\u661f\\u671f\\u56db","\\u661f\\u671f\\u4e94","\\u661f\\u671f\\u516d"],"daysShort":["\\u5468\\u65e5","\\u5468\\u4e00","\\u5468\\u4e8c","\\u5468\\u4e09","\\u5468\\u56db","\\u5468\\u4e94","\\u5468\\u516d"],"daysNarrow":["\\u65e5","\\u4e00","\\u4e8c","\\u4e09","\\u56db","\\u4e94","\\u516d"],"months":["\\u4e00\\u6708","\\u4e8c\\u6708","\\u4e09\\u6708","\\u56db\\u6708","\\u4e94\\u6708","\\u516d\\u6708","\\u4e03\\u6708","\\u516b\\u6708","\\u4e5d\\u6708","\\u5341\\u6708","\\u5341\\u4e00\\u6708","\\u5341\\u4e8c\\u6708"],"monthsShort":["1\\u6708","2\\u6708","3\\u6708","4\\u6708","5\\u6708","6\\u6708","7\\u6708","8\\u6708","9\\u6708","10\\u6708","11\\u6708","12\\u6708"],"daysFormat":["\\u661f\\u671f\\u65e5","\\u661f\\u671f\\u4e00","\\u661f\\u671f\\u4e8c","\\u661f\\u671f\\u4e09","\\u661f\\u671f\\u56db","\\u661f\\u671f\\u4e94","\\u661f\\u671f\\u516d"],"monthsFormat":["1","2","3","4","5","6","7","8","9","10","11","12"],"monthsShortFormat":["1","2","3","4","5","6","7","8","9","10","11","12"],"formats":{"monthDay":"{month}\\u6708{day}","monthDayCompact":"{month}\\u6708{day}","monthDayShort":"{month}\\u6708{day}","weekdayDay":"{day}{weekday}","weekdayDayShort":"{day}{weekday}","weekdayDayNarrow":"{day}{weekday}","weekdayMonthDay":"{month}\\u6708{day}{weekday}","weekdayMonthDayShort":"{month}\\u6708{day}{weekday}","yearMonthDay":"{year}\\u5e74{month}\\u6708{day}","time12Hour":"{dayPeriod}{hour}\\u65f6","time12HourMinute":"{dayPeriod}{hour}:{minute}"},"am":"\\u4e0a\\u5348","dayExtra":"\\u65e5","midnight":"\\u5348\\u591c","noon":"\\u4e2d\\u5348","pm":"\\u4e0b\\u5348","relative":{"latest":"\\u6700\\u65b0","minutesAgo":"{minutes}\\u5206\\u524d","minutesFromNow":"{minutes}\\u5206\\u540e","now":"\\u73b0\\u5728","nowcast":"\\u4e34\\u8fd1\\u9884\\u62a5","today":"\\u4eca\\u5929","tomorrow":"\\u660e\\u5929","yesterday":"\\u6628\\u5929"}},"agency":{"jma":"\\u65e5\\u672c\\u6c14\\u8c61\\u5385","nasa":"\\u7f8e\\u56fd\\u5b87\\u822a\\u5c40"},"alert":{"loading":"\\u6b63\\u5728\\u52a0\\u8f7d&hellip;&hellip;"},"button":{"app":"\\u4e0b\\u8f7d\\u5e94\\u7528","clear":"\\u5168\\u90e8\\u6e05\\u9664","continue":"\\u7ee7\\u7eed","dismiss":"\\u5173\\u95ed","done":"\\u5b8c\\u6210","edit":"\\u7f16\\u8f91","ok":"\\u597d\\u7684","remove":"\\u79fb\\u9664"},"direction":{"east":"\\u4e1c","north":"\\u5317","south":"\\u5357","west":"\\u897f"},"error":{"retry":"\\u91cd\\u8bd5"},"fire":{"and":"\\u548c","complex":"\\u7fa4","contained":"\\u5df2\\u63a7\\u5236","control":{"bh":"\\u8513\\u5ef6\\u53d7\\u9650","oc":"\\u5931\\u63a7"},"fire":"\\u706b\\u707e","fires":"\\u706b\\u707e","prescribedBurn":"\\u8ba1\\u5212\\u70e7\\u9664"},"hud":{"favorite":{"add":"\\u4f4d\\u7f6e\\u5df2\\u4fdd\\u5b58","remove":"\\u5df2\\u53d6\\u6d88\\u4fdd\\u5b58\\u4f4d\\u7f6e"},"geolocation":{"approximate":"\\u5927\\u81f4\\u4f4d\\u7f6e","removed":"\\u4f4d\\u7f6e\\uff1a\\u5df2\\u5173\\u95ed","success":"\\u4f4d\\u7f6e\\u5df2\\u786e\\u5b9a"},"model":"\\u9884\\u6d4b\\u6a21\\u578b\\uff1a{model}","overlay":{"clouds":{"off":"\\u4e91\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u4e91\\uff1a\\u5df2\\u5f00\\u542f"},"coverage":{"off":"\\u96f7\\u8fbe\\u8986\\u76d6\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u96f7\\u8fbe\\u8986\\u76d6\\uff1a\\u5df2\\u5f00\\u542f"},"crosshair":{"off":"\\u4e2d\\u5fc3\\u5341\\u5b57\\u7ebf\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u4e2d\\u5fc3\\u5341\\u5b57\\u7ebf\\uff1a\\u5df2\\u5f00\\u542f"},"fires":{"off":"\\u5f53\\u524d\\u706b\\u707e\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u5f53\\u524d\\u706b\\u707e\\uff1a\\u5df2\\u5f00\\u542f"},"graticule":{"off":"\\u7ecf\\u7eac\\u7f51\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u7ecf\\u7eac\\u7f51\\uff1a\\u5df2\\u5f00\\u542f"},"heat":{"off":"\\u9ad8\\u6e29\\u70b9\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u9ad8\\u6e29\\u70b9\\uff1a\\u5df2\\u5f00\\u542f"},"heat-fires":{"off":"\\u9ad8\\u6e29\\u70b9\\u548c\\u706b\\u707e\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u9ad8\\u6e29\\u70b9\\u548c\\u706b\\u707e\\uff1a\\u5df2\\u5f00\\u542f"},"isolines":{"off":"\\u7b49\\u503c\\u7ebf\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u7b49\\u503c\\u7ebf\\uff1a\\u5df2\\u5f00\\u542f"},"label-values":{"off":"\\u503c\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u503c\\uff1a\\u5df2\\u5f00\\u542f"},"labels":{"off":"\\u6807\\u7b7e\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u6807\\u7b7e\\uff1a\\u5df2\\u5f00\\u542f"},"lines":{"off":"\\u8fb9\\u754c\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u8fb9\\u754c\\uff1a\\u5df2\\u5f00\\u542f"},"precipitation-animation":{"off":"\\u964d\\u6c34\\u52a8\\u753b\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u964d\\u6c34\\u52a8\\u753b\\uff1a\\u5df2\\u5f00\\u542f"},"radar":{"off":"\\u96f7\\u8fbe\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u96f7\\u8fbe\\uff1a\\u5df2\\u5f00\\u542f"},"storms":{"off":"\\u70ed\\u5e26\\u7cfb\\u7edf\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u70ed\\u5e26\\u7cfb\\u7edf\\uff1a\\u5df2\\u5f00\\u542f"},"temperature-values":{"off":"\\u6c14\\u6e29\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u6c14\\u6e29\\uff1a\\u5df2\\u5f00\\u542f"},"terminator":{"off":"\\u6668\\u660f\\u7ebf\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u6668\\u660f\\u7ebf\\uff1a\\u5df2\\u5f00\\u542f"},"wind-animation":{"off":"\\u98ce\\u52a8\\u753b\\uff1a\\u5df2\\u5173\\u95ed","on":"\\u98ce\\u52a8\\u753b\\uff1a\\u5df2\\u5f00\\u542f"}},"share":"\\u5206\\u4eab","time":{"summary":{"daily":"\\u6bcf\\u65e5\\u9884\\u62a5","hourly":"\\u6bcf\\u5c0f\\u65f6\\u9884\\u62a5"},"timeControl":{"clock":"\\u65f6\\u949f","timeline":"\\u65f6\\u95f4\\u7ebf"},"timeFormat":{"hour12":"12\\u5c0f\\u65f6\\u5236","hour24":"24\\u5c0f\\u65f6\\u5236"},"timeZone":{"local":"\\u672c\\u5730\\u65f6\\u533a","utc":"UTC\\u65f6\\u533a"}},"unit":{"area":{"acres":"\\u82f1\\u4ea9","hectares":"\\u516c\\u9877","imperial":"\\u5e73\\u65b9\\u82f1\\u91cc","metric":"\\u5e73\\u65b9\\u516c\\u91cc"},"coordinate":{"decimal":"\\u5341\\u8fdb\\u5236\\u5ea6","dms":"\\u5ea6\\u5206\\u79d2"},"distance":{"imperial":"\\u82f1\\u91cc","metric":"\\u516c\\u91cc","nautical":"\\u6d77\\u91cc"},"temperature":{"celsius":"\\u6444\\u6c0f\\u5ea6","fahrenheit":"\\u534e\\u6c0f\\u5ea6"},"wind":{"beaufort":"\\u84b2\\u798f\\u98ce\\u7ea7"},"windDirection":{"compass":"\\u7f57\\u76d8","degrees":"\\u5ea6"}}},"info":{"beaufort00":"\\u65e0\\u98ce","beaufort01":"\\u8f6f\\u98ce","beaufort02":"\\u8f7b\\u98ce","beaufort03":"\\u5fae\\u98ce","beaufort04":"\\u548c\\u98ce","beaufort05":"\\u6e05\\u98ce","beaufort06":"\\u5f3a\\u98ce","beaufort07":"\\u75be\\u98ce","beaufort08":"\\u5927\\u98ce","beaufort09":"\\u70c8\\u98ce","beaufort10":"\\u72c2\\u98ce","beaufort11":"\\u66b4\\u98ce","beaufort12":"\\u98d3\\u98ce","cityLights":"\\u57ce\\u5e02\\u706f\\u5149","condition":{"clearDay":"\\u6674","clearMostlyDay":"\\u5927\\u90e8\\u6674\\u6717","clearMostlyNight":"\\u5927\\u90e8\\u5206\\u6674\\u6717","clearNight":"\\u6674\\u6717","cloudOvercast":"\\u9634","cloudPartlyDay":"\\u5c40\\u90e8\\u591a\\u4e91","cloudPartlyNight":"\\u5c40\\u90e8\\u591a\\u4e91","fog":"\\u96fe/\\u4f4e\\u4e91","hail":"\\u7279\\u5927\\u96e8 / \\u51b0\\u96f9","noCoverage":"\\u65e0\\u96f7\\u8fbe\\u6570\\u636e","noPrecipitation":"\\u65e0\\u964d\\u6c34","rainExtreme":"\\u7279\\u5927\\u96e8","rainHeavy":"\\u5927\\u96e8","rainLight":"\\u5c0f\\u96e8","rainModerate":"\\u4e2d\\u96e8","rainVeryLight":"\\u5fae\\u96e8","snowHeavy":"\\u5927\\u96ea","snowLight":"\\u5c0f\\u96ea","snowModerate":"\\u4e2d\\u96ea","sunrise":"\\u65e5\\u51fa","sunset":"\\u65e5\\u843d","sunShower":"\\u6674\\u95f4\\u9635\\u96e8"},"dewPoint":{"dry":"\\u5e72\\u71e5","extremelyDry":"\\u6781\\u5ea6\\u5e72\\u71e5","extremelyHumid":"\\u6781\\u5ea6\\u6f6e\\u6e7f","humid":"\\u6f6e\\u6e7f","slightlyHumid":"\\u7565\\u6f6e\\u6e7f","veryDry":"\\u975e\\u5e38\\u5e72\\u71e5","veryHumid":"\\u975e\\u5e38\\u6f6e\\u6e7f"},"feelsLike":"\\u4f53\\u611f {temp}","geolocation":"\\u4f60\\u7684\\u4f4d\\u7f6e","heat":"\\u70ed","noImagery":"\\u6ca1\\u6709\\u56fe\\u50cf","notLive":"\\u975e\\u5b9e\\u65f6","pressure":{"highSymbol":"\\u9ad8","lowSymbol":"\\u4f4e"},"title":{"daily":"\\u5929","date":"\\u65e5\\u671f","hourly":"\\u5c0f\\u65f6","rangeMax":"\\u6700\\u9ad8","rangeMin":"\\u6700\\u4f4e","time":"\\u65f6\\u95f4"},"wetBulb":{"extreme":"\\u6781\\u7aef\\u70ed\\u5e94\\u6fc0","lethal":"\\u81f4\\u6b7b\\u6027\\u70ed\\u5e94\\u6fc0","moderate":"\\u4e2d\\u5ea6\\u70ed\\u5e94\\u6fc0","none":"\\u65e0\\u70ed\\u5e94\\u6fc0","slight":"\\u8f7b\\u5ea6\\u70ed\\u5e94\\u6fc0","strong":"\\u5f3a\\u70c8\\u70ed\\u5e94\\u6fc0","veryStrong":"\\u6781\\u5f3a\\u70ed\\u5e94\\u6fc0"},"windGusts":"\\u9635\\u98ce {gust}"},"intro":{"layer":{"dewPoint1":"\\u8fd9\\u5f20\\u5730\\u56fe\\u663e\\u793a\\u4e86\\u7a7a\\u6c14\\u7684\\u5e72\\u71e5\\u6216\\u6f6e\\u6e7f\\u7a0b\\u5ea6\\u3002","dewPoint2":"\\u9732\\u70b9\\u662f\\u53d1\\u751f\\u51dd\\u7ed3\\u7684\\u6e29\\u5ea6\\u3002","humidity":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u76f8\\u5bf9\\u6e7f\\u5ea6\\u9884\\u62a5\\u3002\\u76f8\\u5bf9\\u6e7f\\u5ea6\\u7528\\u4e8e\\u6bd4\\u8f83\\u7a7a\\u6c14\\u6e7f\\u5ea6\\u4e0e\\u6c14\\u6e29\\u3002","precipitation1":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u672a\\u6765\\u51e0\\u5929\\u7684\\u964d\\u96e8\\u3001\\u964d\\u96ea\\u548c\\u4e91\\u5c42\\u9884\\u62a5\\u3002","precipitation2":"\\u8981\\u67e5\\u770b\\u5b9e\\u65f6\\u964d\\u96e8\\uff0c\\u8bf7\\u5207\\u6362\\u5230_\\u96f7\\u8fbe\\u5730\\u56fe_\\u3002","precipitationRadarButton":"\\u5207\\u6362\\u5230\\u964d\\u96e8\\u96f7\\u8fbe","pressure1":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u6d77\\u5e73\\u9762\\u6c14\\u538b\\u9884\\u62a5\\u3002","pressure2":"\\u4f4e\\u538b\\u5e38\\u5e26\\u6765\\u4e91\\u5c42\\u548c\\u98ce\\u3002\\u9ad8\\u538b\\u901a\\u5e38\\u5e26\\u6765\\u66f4\\u6674\\u6717\\u7684\\u5929\\u7a7a\\u548c\\u8f83\\u5f31\\u7684\\u98ce\\u3002","radar1":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u6c14\\u8c61\\u96f7\\u8fbe\\u7ad9\\u63a2\\u6d4b\\u5230\\u7684\\u96e8\\u96ea\\u60c5\\u51b5\\u3002","radar2":"\\u96f7\\u8fbe\\u65e0\\u6cd5\\u8986\\u76d6\\u6240\\u6709\\u533a\\u57df\\u3002\\u5982\\u679c\\u672a\\u663e\\u793a\\u4efb\\u4f55\\u6570\\u636e\\uff0c\\u8bf7\\u5207\\u6362\\u5230_\\u964d\\u6c34\\u56fe_\\u3002","satellite1":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u6700\\u65b0\\u5929\\u6c14\\u56fe\\u50cf\\u3002","satellite2":"\\u4ece\\u592a\\u7a7a\\u5b9e\\u65f6\\u67e5\\u770b\\u98ce\\u66b4\\u3001\\u4e91\\u3001\\u96fe\\u3001\\u70df\\u96fe\\u3001\\u6c99\\u5c18\\u7b49\\u3002","satelliteHD1":"\\u8fd9\\u5f20\\u5730\\u56fe\\u663e\\u793a\\u4e86\\u9ad8\\u6e05\\u536b\\u661f\\u56fe\\u50cf\\u3002","satelliteHD2":"\\u6765\\u81ea NASA \\u536b\\u661f\\u7684\\u8be6\\u7ec6\\u56fe\\u50cf\\uff0c\\u81ea 2000 \\u5e74\\u8d77\\u6bcf\\u5929\\u66f4\\u65b0\\u4e24\\u6b21\\u3002","temperature":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u8ddd\\u5730\\u9762 {height} \\u9ad8\\u5ea6\\u7684\\u6c14\\u6e29\\u9884\\u62a5\\u3002","temperatureFeel":"\\u8fd9\\u5f20\\u5730\\u56fe\\u663e\\u793a\\u4f53\\u611f\\u6e29\\u5ea6\\uff0c\\u4e5f\\u79f0\\u4e3a\\u8868\\u89c2\\u6e29\\u5ea6\\u6216\\u70ed\\u6307\\u6570\\u3002","temperatureWetBulb1":"\\u8fd9\\u5f20\\u5730\\u56fe\\u663e\\u793a\\u4e86\\u4eba\\u4eec\\u9762\\u4e34\\u70ed\\u5e94\\u6fc0\\u98ce\\u9669\\u7684\\u5730\\u533a\\u3002","temperatureWetBulb2":"\\u6e7f\\u7403\\u6e29\\u5ea6\\u9ad8\\u4e8e{temp}\\u65f6\\u53ef\\u80fd\\u5f88\\u5371\\u9669\\uff0c\\u957f\\u65f6\\u95f4\\u66b4\\u9732\\u53ef\\u80fd\\u81f4\\u547d\\u3002","windGusts":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u8fd1\\u5730\\u9762\\u7a81\\u53d1\\u9635\\u98ce\\u7684\\u6700\\u5927\\u98ce\\u901f\\u9884\\u62a5\\u3002","windSpeed":"\\u8be5\\u5730\\u56fe\\u663e\\u793a\\u8fd1\\u5730\\u9762\\u5e73\\u5747\\u98ce\\u901f\\u9884\\u62a5\\u3002"},"model":{"detail":"\\u6700\\u9ad8\\u5206\\u8fa8\\u7387\\u4e3a{km}\\u516c\\u91cc\\uff08{mi}\\u82f1\\u91cc\\uff09\\u3002","gfs":"GFS \\u662f\\u7531\\u7f8e\\u56fd\\u56fd\\u5bb6\\u6c14\\u8c61\\u5c40\\u8fd0\\u884c\\u7684\\u9884\\u62a5\\u6a21\\u578b\\u3002","icon":"ICON \\u662f\\u5fb7\\u56fd\\u6c14\\u8c61\\u5c40\\uff08DWD\\uff09\\u8fd0\\u884c\\u7684\\u9884\\u62a5\\u6a21\\u578b\\u3002"}},"key":{"animation-speed":"A","clouds":"O","coverage":"Q","crosshair":"X","fires":"F","graticule":"G","heat":"H","isolines":"I","label-values":"V","labels":"L","lines":"K","model":"M","precipitation-animation":"P","precipitation-theme":"D","radar":"R","storms":"S","summary":"U","temperature-values":"E","terminator":"N","time-control":"J","time-format":"T","time-zone":"Z","wind-animation":"W"},"layer":{"abbr":{"dew-point":"\\u9732\\u70b9","humidity":"\\u6e7f\\u5ea6","precipitation":"\\u964d\\u6c34","pressure":"\\u6c14\\u538b","temperature":"\\u6c14\\u6e29","temperature-feel":"\\u4f53\\u611f","temperature-wet-bulb":"\\u6e7f\\u7403","wind-gusts":"\\u9635\\u98ce","wind-speed":"\\u98ce"},"category":{"humidity":"\\u6e7f\\u5ea6","satellite":"\\u536b\\u661f","temperature":"\\u6c14\\u6e29","wind":"\\u98ce"},"dropdown":{"dew-point":"\\u9732\\u70b9","humidity":"\\u76f8\\u5bf9\\u6e7f\\u5ea6","precipitation":"\\u964d\\u6c34","pressure":"\\u6c14\\u538b","radar":"\\u96f7\\u8fbe","satellite":"\\u5b9e\\u65f6\\u536b\\u661f","satellite-hd":"\\u9ad8\\u6e05\\u536b\\u661f","temperature":"\\u6c14\\u6e29","temperature-feel":"\\u4f53\\u611f\\u6e29\\u5ea6","temperature-wet-bulb":"\\u6e7f\\u7403","wind-gusts":"\\u9635\\u98ce","wind-speed":"\\u98ce\\u901f"},"full":{"dew-point":"\\u9732\\u70b9\\u5730\\u56fe","home":"\\u5929\\u6c14\\u56fe\\u3001\\u53f0\\u98ce\\u8ffd\\u8e2a\\u5668","humidity":"\\u76f8\\u5bf9\\u6e7f\\u5ea6\\u5730\\u56fe","precipitation":"\\u964d\\u6c34\\u5730\\u56fe","pressure":"\\u6c14\\u538b\\u5730\\u56fe","radar":"\\u964d\\u6c34\\u96f7\\u8fbe\\u5730\\u56fe","satellite":"\\u6c14\\u8c61\\u536b\\u661f\\u548c\\u96f7\\u8fbe\\u56fe","satellite-hd":"\\u9ad8\\u6e05\\u6c14\\u8c61\\u536b\\u661f\\u5730\\u56fe","temperature":"\\u6c14\\u6e29\\u5730\\u56fe","temperature-feel":"\\u4f53\\u611f\\u6e29\\u5ea6\\u5730\\u56fe","temperature-wet-bulb":"\\u6e7f\\u7403\\u6e29\\u5ea6\\u5730\\u56fe","wind-gusts":"\\u9635\\u98ce\\u5730\\u56fe","wind-speed":"\\u98ce\\u901f\\u5730\\u56fe"},"name":{"dew-point":"\\u9732\\u70b9\\u6e29\\u5ea6\\u9884\\u62a5","humidity":"\\u76f8\\u5bf9\\u6e7f\\u5ea6\\u9884\\u62a5","precipitation":"\\u964d\\u6c34\\u9884\\u62a5","pressure":"\\u6c14\\u538b\\u9884\\u62a5","radar":"\\u964d\\u6c34\\u96f7\\u8fbe\\u5730\\u56fe","satellite":"\\u5b9e\\u65f6\\u6c14\\u8c61\\u536b\\u661f","satellite-hd":"\\u9ad8\\u6e05\\u6c14\\u8c61\\u536b\\u661f","temperature":"\\u6c14\\u6e29\\u9884\\u62a5","temperature-feel":"\\u4f53\\u611f\\u6e29\\u5ea6\\u9884\\u62a5","temperature-wet-bulb":"\\u6e7f\\u7403\\u9884\\u62a5","wind-gusts":"\\u9635\\u98ce\\u9884\\u62a5","wind-speed":"\\u98ce\\u901f\\u9884\\u62a5"},"short":{"dew-point":"\\u9732\\u70b9","humidity":"\\u76f8\\u5bf9","precipitation":"\\u964d\\u6c34","pressure":"\\u6c14\\u538b","radar":"\\u96f7\\u8fbe","satellite":"\\u5b9e\\u65f6","satellite-hd":"\\u9ad8\\u6e05","temperature":"\\u5b9e\\u9645","temperature-feel":"\\u4f53\\u611f","temperature-wet-bulb":"\\u6e7f\\u7403","wind-gusts":"\\u9635\\u98ce","wind-speed":"\\u98ce\\u901f"}},"legend":{"rain":{"heavy":"\\u5927","light":"\\u5c0f","moderate":"\\u4e2d","title":"\\u96e8"},"snow":"\\u96ea"},"model":{"name":"\\u9884\\u6d4b\\u6a21\\u578b\\uff1a{model}","type":{"gfs":"GFS","icon":"ICON"}},"notice":{"graphics":"\\u56fe\\u5f62\\u9519\\u8bef","layerHD":"\\u5207\\u6362\\u5230_\\u9ad8\\u6e05\\u536b\\u661f_","layerLive":"\\u5207\\u6362\\u5230_\\u5b9e\\u65f6\\u536b\\u661f_","layerRadar":"\\u4f7f\\u7528_\\u5b9e\\u65f6\\u964d\\u96e8\\u96f7\\u8fbe_","layerRain":"\\u67e5\\u770b_\\u964d\\u96e8\\u9884\\u62a5_","layerWind":"\\u67e5\\u770b_\\u98ce\\u529b\\u9884\\u62a5_","maxZoom":"\\u6700\\u5927\\u5206\\u8fa8\\u7387","model":"\\u5207\\u6362\\u5230_{model} \\u6a21\\u578b_","offline":"\\u65e0\\u7f51\\u7edc\\u8fde\\u63a5","outage":"\\u56fe\\u50cf\\u4e0d\\u53ef\\u7528\\u3002_\\u66f4\\u591a\\u4fe1\\u606f_","slow":"\\u8fde\\u63a5\\u7f13\\u6162","stormSimilar":"\\u662f\\u5426\\u5728\\u627e{storm}\\uff1f","update":"\\u65b0\\u7248\\u672c\\u53ef\\u7528 _\\u73b0\\u5728\\u66f4\\u65b0_"},"outage":{"description":"{source} \\u7684\\u56fe\\u50cf\\u76ee\\u524d\\u4e0d\\u53ef\\u7528\\u3002","reason":"\\u6b63\\u5e38\\u670d\\u52a1\\u5373\\u5c06\\u6062\\u590d\\u3002\\u4e0d\\u4fbf\\u4e4b\\u5904\\uff0c\\u656c\\u8bf7\\u8c05\\u89e3\\u3002","title":"\\u5b9e\\u65f6\\u536b\\u661f\\u4e2d\\u65ad"},"overlay":{"clouds":"\\u4e91","coverage":"\\u96f7\\u8fbe\\u8986\\u76d6","crosshair":"\\u4e2d\\u5fc3\\u5341\\u5b57\\u7ebf","fires":"\\u5f53\\u524d\\u706b\\u707e","graticule":"\\u7ecf\\u7eac\\u7f51","heat":"\\u9ad8\\u6e29\\u70b9","isolines":"\\u6c14\\u538b\\u7b49\\u503c\\u7ebf","label-values":"\\u5730\\u56fe\\u6807\\u7b7e\\u503c","labels":"\\u5730\\u56fe\\u6807\\u7b7e","lines":"\\u8fb9\\u754c\\u7ebf","precipitation-animation":"\\u964d\\u6c34\\u52a8\\u753b","radar":"\\u96f7\\u8fbe","storms":"\\u70ed\\u5e26\\u7cfb\\u7edf","temperature-values":"\\u6c14\\u6e29","terminator":"\\u6668\\u660f\\u7ebf","title":"\\u53e0\\u52a0\\u5c42","wind-animation":"\\u98ce\\u52a8\\u753b"},"punctuation":{"colon":"{text}\\uff1a","comma":{"list":"\\u3001","sentence":"\\uff0c"},"parenthesis":"\\uff08{text}\\uff09","percent":"{pc}%","space":""},"satellite":{"goes-east":"GOES-East","goes-west":"GOES-West","himawari":"\\u5411\\u65e5\\u8475","msg-iodc":"Meteosat-IODC","msg-zero":"Meteosat","mtg-zero":"Meteosat"},"search":{"coordinates":"\\u5750\\u6807\\uff1a","drag":"\\u62d6\\u52a8\\u4ee5\\u91cd\\u65b0\\u6392\\u5e8f","favorites":"\\u5df2\\u4fdd\\u5b58\\u4f4d\\u7f6e","none":"\\u6ca1\\u6709\\u7ed3\\u679c","recent":"\\u6700\\u8fd1\\u641c\\u7d22"},"settings":{"account":{"login":"\\u767b\\u5f55"},"animationDuration":{"hours":"{hours}\\u5c0f\\u65f6","hudLabel":"\\u65f6\\u957f"},"animationSpeed":{"fast":"\\u5feb\\u901f","label":"\\u52a8\\u753b\\u901f\\u5ea6","medium":"\\u4e2d\\u7b49","slow":"\\u6162\\u901f"},"animationStyle":{"fast":"\\u5feb\\u901f","hudLabel":"\\u6837\\u5f0f","smooth":"\\u6d41\\u7545"},"appearance":{"label":"\\u5916\\u89c2","opaque":"\\u4e0d\\u900f\\u660e","translucent":"\\u534a\\u900f\\u660e"},"areaUnit":{"label":"\\u9762\\u79ef"},"coordinateUnit":{"label":"\\u5750\\u6807\\u7cfb"},"distanceUnit":{"label":"\\u8ddd\\u79bb"},"fireAreaUnit":{"label":"\\u8fc7\\u706b\\u9762\\u79ef"},"mapTooltip":{"disabled":"\\u5173\\u95ed","enabled":"\\u5f00\\u542f","label":"\\u5730\\u56fe\\u63d0\\u793a"},"precipitationTheme":{"dark":"\\u6df1\\u8272","label":"\\u964d\\u6c34\\u4e3b\\u9898","light":"\\u6d45\\u8272"},"precipitationUnit":{"label":"\\u964d\\u6c34\\u91cf"},"pressureUnit":{"label":"\\u6c14\\u538b"},"temperatureUnit":{"label":"\\u6e29\\u5ea6"},"windDirectionUnit":{"label":"\\u98ce\\u5411"},"windUnit":{"label":"\\u98ce\\u901f"}},"storm":{"area":"\\u53ef\\u80fd\\u53d1\\u5c55\\u533a\\u57df","chance":{"day2":"2\\u5929\\u5185 {chance}","day7":"7\\u5929\\u5185 {chance}","development":"\\u53d1\\u5c55\\u6f5c\\u529b","high":"\\u9ad8","hours24":"24\\u5c0f\\u65f6\\u5185 {chance}","low":"\\u4f4e","medium":"\\u4e2d\\u7b49"},"cone":"\\u8def\\u5f84\\u6982\\u7387\\u8303\\u56f4","forecast":"\\u9884\\u62a5","lastMod":"\\u6700\\u540e\\u4fee\\u6539\\uff1a","liveTitle":"\\u5b9e\\u65f6","warning-hurricane":"\\u98d3\\u98ce\\u8b66\\u544a","warning-storm":"\\u70ed\\u5e26\\u98ce\\u66b4\\u8b66\\u544a","watch-hurricane":"\\u98d3\\u98ce\\u9884\\u8b66","watch-storm":"\\u70ed\\u5e26\\u98ce\\u66b4\\u9884\\u8b66","winds":"\\u98ce\\u901f\\u4e3a{wind}"},"subscription":{"tierPro":"\\u4e13\\u4e1a"},"unit":{"acre":"\\u82f1\\u4ea9","acres":"\\u82f1\\u4ea9","acreShort":"\\u82f1\\u4ea9","beaufort":"\\u84b2\\u798f","celsius":"\\u00b0C","dbz":"dBZ","degree":"\\u00b0","fahrenheit":"\\u00b0F","feet":"\\u82f1\\u5c3a","hectare":"\\u516c\\u9877","hectares":"\\u516c\\u9877","hectareShort":"\\u516c\\u9877","hpa":"hPa","inh":"\\u82f1\\u5bf8/\\u5c0f\\u65f6","inhg":"inHg","km":"\\u516c\\u91cc","km2":"\\u5e73\\u65b9\\u516c\\u91cc","kmh":"\\u516c\\u91cc/\\u5c0f\\u65f6","knot":"\\u8282","knots":"\\u8282","mb":"\\u6beb\\u5df4","meters":"\\u7c73","miles":"\\u82f1\\u91cc","miles2":"\\u5e73\\u65b9\\u82f1\\u91cc","mmh":"\\u6beb\\u7c73/\\u5c0f\\u65f6","mmhg":"mmHg","mph":"\\u82f1\\u91cc/\\u5c0f\\u65f6","ms":"\\u7c73/\\u79d2","nm":"\\u6d77\\u91cc","utc":"UTC"}}};window._ZE.config.timeOffset=1790161788000-new Date().getTime();setTimeout(function(){var s=document.styleSheets;for(var i=s.length;i--;){s[i].disabled=s[i].ownerNode.tagName==='STYLE';}},150);</script>