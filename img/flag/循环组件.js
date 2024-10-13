// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: th-large;
/**
 * 小组件作者: 95度茅台
 * 循环切换显示桌面小组件
 * Version 1.0.0
 * 2023-10-04 20:30
 *
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 *
 * 例如: https://gitcode.net/4qiao/framework/raw/master/mian/web_module_12123.js
 */

const fm = FileManager.local();
const folder = fm.joinPath(fm.documentsDirectory(), 'loopScripts');
const cacheFile = fm.joinPath(folder, 'setting.json');
const files = fm.fileExists(cacheFile);

const writeSettings = (data) => {
  fm.writeString(cacheFile, JSON.stringify(data, null, 2));
};

const readCacheFile = () => {
  if (!fm.fileExists(folder)) fm.createDirectory(folder);
  if ( files ) {
    const data = fm.readString(cacheFile);
    return { scripts, currentIndex } = JSON.parse(data);
  }
};
await readCacheFile();

// Get scriptUrl
const myScript = atob('aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9mcmFtZXdvcmsvcmF3L21hc3Rlci9hcGkvd2ViX21haW5fb2lsX3ByaWNlLmpz');
const script = files ? scripts : scripts = [ myScript ];

const outputNextScript = () => {
  const nextIndex = ((!files ? 0 : currentIndex) + 1) % scripts.length;
  if ( files ) {
    writeSettings({ scripts, currentIndex: nextIndex });
  };
  return scripts[nextIndex];
};

const scriptUrl = outputNextScript();
const modulePath = await downloadModule(scriptUrl);
if ( modulePath !== null ) {
  if ( config.runsInWidget ) {
    const importedModule = await importModule(modulePath);
    await importedModule.main();
  } else {
    await presentMenu();
  }
};

async function downloadModule() {
  const modulePath = fm.joinPath(folder, 'random.js');
  if (fm.fileExists(modulePath)) {  
    fm.remove(modulePath);
  }
  const req = new Request(scriptUrl);
  let moduleJs = await req.loadString().catch(() => {
    return null;
  });
  if ( files ) {
    moduleJs = `
async function main() {
  ${moduleJs}
}
module.exports = { main }`  
  }
  if ( moduleJs ) {
    fm.writeString(modulePath, moduleJs);  
    return modulePath;
  }
};

async function notify(title, body, url, opts = {}) {
  const n = Object.assign(new Notification(), { title, body, sound: 'piano_success', ...opts });
  if (url) n.openURL = url;
  return await n.schedule();
};

async function presentMenu() {
  const alert = new Alert();
  alert.message = '\n添加小组件的脚本URL\r在桌面循环切换显示所添加的小组件'
  const actions = [
    '更新代码', '重置所有', '95度茅台', '删减脚本', '添加组件', '预览组件'
  ];

  actions.forEach((action, i) => {
    alert[ i === 0 || i === 1 || i === 3 ? 'addDestructiveAction' : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  
  const response = await alert.presentSheet();
  if ( response === 1 && fm.fileExists(folder) ) {
    fm.remove(folder);
    notify('已重置数据', '请重新添加小组件URL');
  }
  if ( response === 2 ) await importModule(await downloadScripts()).main();
  if ( response === 3 && files ) await removeScript();
  if ( response === 4 ) await addScripts();
  if ( response === 5 ) {
    const importedModule = importModule(modulePath);
    await importedModule.main();
  }
  if ( response === 0 ) {
    const codeString = await new Request('https://gitcode.net/4qiao/scriptable/raw/master/api/loopScripts.js').loadString();
    if ( codeString.indexOf('95度茅台') === -1 ) {
      notify('更新失败⚠️', '请检查网络或稍后再试');
    } else {
      fm.writeString(module.filename, codeString);
      const uri = Script.name();
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
  }
};

async function downloadScripts() {
  const modulePath = fm.joinPath(folder, 'store.js');
  if (fm.fileExists(modulePath)) {
    fm.remove(modulePath);
  }
  const req = new Request(atob('aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9zY3JpcHRhYmxlL3Jhdy9tYXN0ZXIvdmlwL21haW45NWR1U3RvcmUuanM='));
  const moduleJs = await req.load().catch(() => {
    return null;
  });
  if ( moduleJs ) {
    fm.write(modulePath, moduleJs);
    return modulePath;
  }
};

async function addScripts() {
  const input = new Alert();
  input.title = '添加小组件URL';
  input.addTextField('输入URL', Pasteboard.paste());
  input.addAction('确定');
  input.addCancelAction('取消');
  const install = await input.presentAlert();
  const url = input.textFieldValue(0)
  if ( install === 0 ) {
    const javaScript = url.substring(url.lastIndexOf(".") + 1);
    if ( javaScript === 'js' ) {
      files ? arr = scripts : arr = new Array();
      arr.push(url);
      writeSettings({ scripts: arr, currentIndex: 0 });
      notify('添加成功', `当前数据库中已储存${arr.length}个小组件`);
    }
    await presentMenu();
  } 
};

async function removeScript() {
  while (script.length) {
    const alert = new Alert();
    alert.message = '删减组件❓';
    script.forEach((item, i) => {
      alert.addAction(decodeURIComponent(item.split('/').pop()));
    });
    alert.addCancelAction('取消');
    const menuId = await alert.presentSheet();
    if (menuId === -1) break;
        
    script.splice(menuId, 1);
    writeSettings({ scripts: script, currentIndex: 0 });
    if (menuId !== -1) {
      script.length === 0 ? fm.remove(cacheFile) : null;
    }
  }
};