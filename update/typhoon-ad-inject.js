// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: gray; icon-glyph: magic;
let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
} else {
  const inject = `
<script>
(function () {
  if (window.__tfAutoClose) return;
  window.__tfAutoClose = true;

  function clickEl(el) {
    if (!el) return;
    try {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
      if (typeof el.click === "function") el.click();
    } catch (e) {}
  }

  function autoClose() {
    // 1. 顶部提示条关闭：.icon-close
    document.querySelectorAll("span.icon-close, .icon-close").forEach(function (el) {
      clickEl(el);
    });

    // 2. 底部广告关闭：.close-block（点容器和里面的 img）
    document.querySelectorAll("div.close-block, .close-block").forEach(function (el) {
      clickEl(el);
      var img = el.querySelector("img");
      if (img) clickEl(img);
    });
  }

  // 立即执行 + 定时多轮（广告可能晚渲染）
  autoClose();
  var n = 0;
  var timer = setInterval(function () {
    autoClose();
    n++;
    if (n >= 30) clearInterval(timer); // 约 15 秒
  }, 500);

  // DOM 变化时再点一次
  try {
    var mo = new MutationObserver(function () { autoClose(); });
    mo.observe(document.documentElement || document.body, { childList: true, subtree: true });
  } catch (e) {}

  document.addEventListener("DOMContentLoaded", autoClose);
  window.addEventListener("load", autoClose);
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