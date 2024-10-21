// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: bell;
/**
* 弹出一个通知
* @param {string} title
* @param {string} body
* @param {string} url
* @param {string} sound
*/

/**
const notify = async (title, body, url, opts = {}) => {
  let n = new Notification()
  n = Object.assign(n, opts);
  n.title = title
  n.body = body
  n.sound = 'alert'
  if (url) {n.openURL = url}
  return await n.schedule()
}
*/


/**
- default
- accept
- alert
- complete
- event
- failure
- piano_error
- piano_success
- popup



// 第二种
async function notify (title, body, url, opts = {}) {
  let n = new Notification()
  n = Object.assign(n, opts);
  n.title = title
  n.body = body
  n.sound = 'accept'
  if (url) n.openURL = url
  return await n.schedule()
}
*/

// 第三种
const notify = (title, body, url, opts = {}) => {
  const n = Object.assign(new Notification(), { title, body, sound: 'piano_success', ...opts });
  if (url) n.openURL = url;
  return n.schedule();
};

notify('登录成功', '前往桌面添加小组件或点击预览查看小组件效果', 'https://m.baidu.com');