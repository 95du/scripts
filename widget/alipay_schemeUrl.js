// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: cyan; icon-glyph: link;
/**
 组件作者: 95度茅台
 1，点击右上角菜单。
 2，点击分享，向左滑复制链接。
 3，运行脚本 (自动拷贝跳转的链接)
 */

const shortUrl = Pasteboard.paste();

if (shortUrl.startsWith('https://ur.alipay.com')) {  
  const req = new Request(shortUrl, { method: "HEAD" });
  req.onRedirect = (redirected) => {
    const decodedUrl = decodeURIComponent(decodeURIComponent(redirected.url));
    const scheme = decodedUrl.match(/scheme=(.+)&enbsv/)[1];
    console.log(scheme);
    Pasteboard.copy(scheme);
    Safari.open(scheme);
  };
  await req.load();
}