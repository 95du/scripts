// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: th-large;
/**
 * 小组件作者: 95度茅台
 * 随机自动切换多个小组件
 * Version 1.1.5
 * 2023-03-23 15:30
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 *
 * 例如: https://gitcode.net/4qiao/framework/raw/master/mian/web_module_12123.js
 */

if (config.runsInApp) {
  getData = await new Request(atob(
'aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9zaG9ydGN1dHMvcmF3L21hc3Rlci9hcGkvdXBkYXRlL3JhbmRvbS5qc29u')).loadJSON();
}

const F_MGR = FileManager.local();
const folder = F_MGR.joinPath(F_MGR.documentsDirectory(), 'randomScript');
const cacheFile = F_MGR.joinPath(folder, 'data.json');
const files = F_MGR.fileExists(cacheFile);

const readCacheFile = () => {
  if (!F_MGR.fileExists(folder)) {
    F_MGR.createDirectory(folder);
  }
  if ( files ) {
    const data = F_MGR.readString(cacheFile);
    return JSON.parse(data);
  } else {
    return getData.script;
  }
};

// Get scriptUrl
const script = await readCacheFile();
const scriptUrl = script[Math.floor(Math.random() * script.length)];
const modulePath = await downloadModule(scriptUrl);
if ( modulePath != null ) {
  if ( config.runsInWidget ) {
    const importedModule = await importModule(modulePath);
    await importedModule.main();
  } else {
    await presentMenu();
  }
}

async function notify (title, body, url, opts = {}) {
  let n = new Notification()
  n = Object.assign(n, opts);
  n.title = title
  n.body = body
  n.sound = 'alert'
  if (url) n.openURL = url
  return await n.schedule();
}

async function downloadModule() {
  const modulePath = F_MGR.joinPath(folder, 'random.js');
  if (F_MGR.fileExists(modulePath)) {  
    F_MGR.remove(modulePath);
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
    F_MGR.writeString(modulePath, moduleJs);  
    return modulePath;
  }
}

async function presentMenu() {
  const alert = new Alert();
  alert.message = getData.version;
  const actions = [
    '更新代码', '重置所有', '95度茅台', '删减脚本', '添加组件', '预览组件'
  ];

  actions.forEach((action, i) => {
  alert[ i === 0 || i === 1 || i === 3 ? 'addDestructiveAction' : 'addAction' ](action);
  });
  alert.addCancelAction('取消');
  
  const response = await alert.presentSheet();
  if ( response === 1 && F_MGR.fileExists(folder) ) {
    F_MGR.remove(folder);
    notify('已重置数据', '请重新添加小组件URL');
  }
  if ( response === 2 ) await importModule(await downloadScripts()).main();
  if ( response === 3 && files ) await removeScript();
  if ( response === 4 ) await addScriptURL();
  if ( response === 5 ) {
    const importedModule = importModule(modulePath);
    await importedModule.main();
  }
  if ( response === 0 ) {
    const codeString = await new Request(getData.update).loadString();
    if ( codeString.indexOf('95度茅台' ) == -1) {
      notify('更新失败⚠️', '请检查网络或稍后再试');
    } else {
      F_MGR.writeString(
        module.filename,
        codeString
      );
      const uri = Script.name();
      Safari.open('scriptable:///run/' + encodeURIComponent(uri));
    }
  }
};

async function downloadScripts() {
  const modulePath = F_MGR.joinPath(folder, 'store.js');
  if (F_MGR.fileExists(modulePath)) {
    F_MGR.remove(modulePath);
  }
  const req = new Request(atob('aHR0cHM6Ly9naXRjb2RlLm5ldC80cWlhby9zY3JpcHRhYmxlL3Jhdy9tYXN0ZXIvdmlwL21haW45NWR1U3RvcmUuanM='));
  const moduleJs = await req.load().catch(() => {
    return null;
  });
  if ( moduleJs ) {
    F_MGR.write(modulePath, moduleJs);
    return modulePath;
  }
};

async function addScriptURL() {
  const input = new Alert();
  const URL = Pasteboard.paste();
  input.title = '添加小组件URL';
  input.addTextField('输入URL', URL);
  input.addAction('确定');
  input.addCancelAction('取消');
  const install = await input.presentAlert();
  const url = input.textFieldValue(0)
  if ( install === 0 ) {
    files ? arr = script : arr = new Array();
    const javaScript = url.substring(url.lastIndexOf(".") + 1);
    if ( javaScript === 'js' ) {
      await arr.push(url);
      F_MGR.writeString(cacheFile, JSON.stringify(arr));  
      notify('添加成功', `当前数据库中已储存${arr.length}个小组件`);
    }
    //await presentMenu();
  } 
};

async function removeScript() {
  if ( files ) {
    const Run = async () => {
      const alert = new Alert();
      alert.message = '\n删减脚本';
      script.forEach(item => {
        alert.addAction(decodeURIComponent(item.substring(item.lastIndexOf('/') + 1)));
      });
      alert.addCancelAction('取消');
      const menuId = await alert.presentSheet();
      if ( menuId !== -1 ) {
        script.some((item, i) => {
          if ( menuId == i ) {
            script.splice(i, 1);
            return true;
          }
        })
      F_MGR.writeString(cacheFile, JSON.stringify(script));  
      script.length !== 0 ? await Run() : F_MGR.remove(cacheFile);
      }
    }
    await Run();
  }
};