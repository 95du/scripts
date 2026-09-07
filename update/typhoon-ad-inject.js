// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;
let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
} else {
  const inject = `
<style id="typhoon-ad-hide">
.ad-swipe,
.foot-banner,
[class*="ad-swipe"],
[class*="foot-banner"],
[class*="splash"],
[class*="open-screen"],
[class*="openscreen"] {
  /* 先不强制隐藏，优先自动点击关闭，避免误伤 */
}
</style>
<script>
(function () {
  if (window.__typhoonAdAutoClose) return;
  window.__typhoonAdAutoClose = true;

  function textOf(el) {
    return ((el && (el.innerText || el.textContent || el.getAttribute("aria-label") || "")) + "").trim();
  }

  function isSkipLike(el) {
    if (!el || el.nodeType !== 1) return false;
    var t = textOf(el);
    var cls = (el.className && el.className.toString) ? el.className.toString() : "";
    var id = el.id || "";
    // 文案
    if (/^(跳过|关闭|跳过广告|关闭广告|我知道了|知道了|暂不|以后再说)$/.test(t)) return true;
    if (/跳过|关闭广告/.test(t) && t.length <= 8) return true;
    // class / id
    if (/close-block|icon-close|btn-close|skip|close-ad|ad-close|splash-skip|skip-btn/i.test(cls + " " + id)) return true;
    // 广告容器里的小关闭图
    if (el.closest && el.closest(".close-block, .ad-swipe, .foot-banner, [class*='ad-'], [class*='splash']")) {
      if (el.tagName === "IMG" || el.tagName === "I" || el.tagName === "SVG" || el.tagName === "SPAN" || el.tagName === "DIV") {
        if (/close|skip|guanbi|icon-close/i.test(cls + " " + id + " " + (el.src || ""))) return true;
      }
    }
    return false;
  }

  function click(el) {
    try {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      if (typeof el.click === "function") el.click();
    } catch (e) {}
  }

  function scanAndClose() {
    var nodes = document.querySelectorAll("div, span, a, button, img, i, svg, p");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!isSkipLike(el)) continue;
      // 避免点到正常导航
      if (el.closest && el.closest("nav, .tabbar, .van-tabbar, .home-menu, .right-menu")) continue;
      click(el);
      // 顺带移除广告容器
      var box = el.closest(".ad-swipe, .foot-banner, .close-block, [class*='ad-swipe'], [class*='foot-banner'], [class*='splash']");
      if (box && box.parentNode) {
        try { box.style.display = "none"; box.remove(); } catch (e) {}
      }
    }
  }

  // 启动后多轮点击，覆盖异步渲染的广告
  var times = 0;
  var timer = setInterval(function () {
    scanAndClose();
    times++;
    if (times >= 40) clearInterval(timer); // 约 20 秒
  }, 500);

  // DOM 变化时再点
  try {
    var mo = new MutationObserver(function () { scanAndClose(); });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", scanAndClose);
  window.addEventListener("load", scanAndClose);
})();
</script>`;

  if (body.includes("</head>")) {
    body = body.replace("</head>", inject + "</head>");
  } else if (body.includes("<body")) {
    body = body.replace(/<body([^>]*)>/i, "<body$1>" + inject);
  } else {
    body = inject + body;
  }
  $done({ body });
}