// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;
let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
} else {
  // 注入 CSS：隐藏底部广告条、关闭按钮、可能的弹层
  const css = `
<style>
.ad-swipe,
.foot-banner,
.close-block,
.typhoon-insurance .icon-close,
[class*="ad-swipe"],
[class*="foot-banner"],
[class*="close-block"] {
  display: none !important;
  visibility: hidden !important;
  height: 0 !important;
  overflow: hidden !important;
  pointer-events: none !important;
}
</style>`;

  // 注入 JS：页面加载后继续清广告节点 + 尽量跳过启动逻辑
  const js = `
<script>
(function () {
  function killAds() {
    document.querySelectorAll('.ad-swipe, .foot-banner, .close-block, [class*="ad-swipe"], [class*="foot-banner"]').forEach(function (el) {
      el.remove();
    });
  }
  killAds();
  setInterval(killAds, 800);
  // 若当前不在 home，尝试跳转
  try {
    if (location.pathname.indexOf('/typhoonVisual/home') === -1 && location.pathname.indexOf('/typhoonVisual') !== -1) {
      // 不强制跳，避免误伤子页面；需要强制时可取消下一行注释
      // location.replace('https://tf03.istrongcloud.com/typhoonVisual/home?theme=dark');
    }
  } catch (e) {}
})();
</script>`;

  if (body.includes("</head>")) {
    body = body.replace("</head>", css + "</head>");
  } else if (body.includes("<head>")) {
    body = body.replace("<head>", "<head>" + css);
  }

  if (body.includes("</body>")) {
    body = body.replace("</body>", js + "</body>");
  } else {
    body = body + js;
  }

  $done({ body });
}