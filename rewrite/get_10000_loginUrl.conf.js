// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
# 中国电信登录获取 Cookie
# 登录入口 https://e.dlife.cn/index.do
^https:\/\/e\.dlife\.cn\/user\/loginMiddle url script-request-header https://raw.githubusercontent.com/95du/scripts/main/rewrite/get_10000_loginUrl.js
hostname = e.dlife.cn