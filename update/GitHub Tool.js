// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: code;
/**
 * 脚本作者: 95度茅台
 * 脚本名称: GitHub Tool
 * 脚本功能: 创建/更新/删除，上传图片
 * 脚本版本: Version 1.0.0
 * 发布日期: 2024-10-25 15:30
 *
 * 快捷指令: 
   https://www.icloud.com/shortcuts/aa3bb21bd1834b5c9a28d14e403482ba
 *
 * 需填写 repo/token
 * 🚫 生成令牌 (token)
 * https://github.com/settings/tokens
 */

const fm = FileManager.iCloud();
const apiUrl = 'https://api.github.com/repos';
const param = 'contents';
const repo = '95du/scripts';
const token = '填写你的token'

const generateAlert = async (title, options, destructive) => {
  const alert = new Alert();
  alert.title = title;
  options.forEach((option, i) => {
    i === 1 && destructive ? alert.addDestructiveAction(option) : alert.addAction(option);
  });
  return await alert.presentAlert();
};

const showInputAlert = async (name) => {  
  const alert = new Alert();
  alert.message = `修改文件扩展名`;
  alert.addTextField('', name);
  alert.addAction("确定");
  alert.addCancelAction("取消");
  const action = await alert.presentAlert();
  const input = alert.textFieldValue(0);
  return action === -1 || !input.trim() ? '' : input;
};

const timeAgo = (dateString) => {
  const past = Math.floor(new Date(dateString).getTime() / 1000);
  const diffSec = Math.floor(Date.now() / 1000) - past;
  const units = [
    { name: 'year', ms: 31536000 },
    { name: 'week', ms: 604800 },
    { name: 'day', ms: 86400 },
    { name: 'hour', ms: 3600 },
    { name: 'minute', ms: 60 }
  ];

  for (const unit of units) {
    const diff = Math.floor(diffSec / unit.ms);
    if (diff >= 1) return diff === 1 ? `1 ${unit.name} ago` : `${diff} ${unit.name}s ago`;
  }
  return `${diffSec} seconds ago`;
};

const getScript = async (commit) => {
  const filePath = fm.documentsDirectory();
  const contents = fm.listContents(filePath);
  let fileCreTimes = contents.map(file => ({
    name: file,
    creationTime: fm.creationDate(fm.joinPath(filePath, file))
  }));

  fileCreTimes.sort((a, b) => b.creationTime - a.creationTime);

  const alert = new Alert();
  alert.message = `\n♻ iCloud Scriptable 本地文件（ 总共 ${fileCreTimes.length} 个 ）`
  fileCreTimes.forEach(item => {
    alert.addAction(item.name);
  });
  alert.addCancelAction('取消');
  const menuId = await alert.presentSheet();
  if (menuId !== -1) {
    const name = fileCreTimes[menuId].name;
    const output = await generateAlert(`♻ 创建 | 更新\n${name}`, ['取消', (commit ? '提交' : '继续')], true);
    if (output === 1) {
      const scriptPath = fm.joinPath(filePath, name);
      const scriptContent = fm.readString(scriptPath);
      return { name, scriptContent };
    } else {
      await getScript();
    }
  }
};

const getIcloudFile = async () => {
  const filePaths = await DocumentPicker.open();
  if (filePaths.length > 0) {
    const filePath = filePaths[0];
    const name = filePath.split('/').pop();
    
    const output = await generateAlert(`♻ 创建 | 更新\n${name}`, ['取消', '继续'], true);
    if (output === 1) {
      const scriptContent = fm.readString(filePath);
      return { name, scriptContent };
    }
  }
};

await (async () => {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
    
  const httpRequest = async (method, url, headers, body) => {
    const request = new Request(url);
    request.method = method;
    request.headers = headers;
    if (body) request.body = JSON.stringify(body);
    return await request.loadJSON();
  };
  
  // 使用 DELETE 删除文件
  const deleteFile = async (url, items, name, path) => {
    const output = await generateAlert(`⚠️ 是否删除文件❓\n${name}`, ['取消', '删除'], true);
    if (output === 1) {
      const api = `${url}/${encodeURIComponent(name)}`;
      const { sha } = await httpRequest('GET', api, headers);
      const { content } = await httpRequest('DELETE', api, headers, {
        message: `Delete:  ${path}`,
        sha: sha
      });
    };
    const filePath = items.length === 1 ? path.match(/^\w+/)?.[0] : path.match(/^.*(?=\/)/)?.[0];
    await loadDirectory(filePath);
  };
  
  // 上传图片
  const uploadImage = async (url, filePath) => {
    const img = await Photos.fromLibrary();
    if (img) {
      const alert = Object.assign(new Alert(), { title: '路径/名称/扩展名' })
      alert.addTextField('img.png');
      alert.addAction('确定');
      alert.addCancelAction('取消');
      const output = await alert.presentAlert();
      if (output === -1) return;
      
      const name = alert.textFieldValue(0);
      if (name.includes('.')) {
        const api = `${url}/${encodeURIComponent(name)}`;
        const content = Data.fromPNG(img).toBase64String();
        const value = await httpRequest('PUT', api, headers, {
          message: `Upload Image:  ${filePath}/${name}`,
          content: content
        });
      }
      await loadDirectory(filePath);
    }
  };
  
  // 使用 PUT 请求更新文件
  const updateScript = async (url, filePath, data) => {
    const { name, scriptContent } = data || await getScript(true) || {};
    if (scriptContent) {
      let updateName, cleanedText;
      if (['cssStyle.js', 'boxjs_json.js'].includes(name)) {
        updateName = await showInputAlert(name);
        cleanedText = scriptContent.replace(/\/\/.*\n\/\/.*\n\/\/.*\n/, '').trim();
      } else {
        updateName = name;
        cleanedText = scriptContent.replace(/await main\([^\)]*\);?/, '').trim();
      }
      
      const api = `${url}/${encodeURIComponent(updateName)}`;
      const { sha } = await httpRequest('GET', api, headers);
      const { content } = await httpRequest('PUT', api, headers, {
        message: `Update File:  ${filePath}/${updateName}`,
        content: btoa(cleanedText),
        sha: sha
      });
      
      await loadDirectory(filePath);
      if (content) Safari.open(content.html_url);
    }
  };
  
  // 仓库
  const loadDirectory = async (filePath, data) => {
    const url = [apiUrl, repo, param, filePath].join('/');
    const items = await httpRequest('GET', url, headers);
    
    const hasName = items.some(item => item.name === data?.name);
    const menuOption = data?.name ? (hasName ? '提交更新' : '提交创建') : '选取文件';
    
    const value = items.sort((a, b) => a.type === b.type 
      ? a.name.localeCompare(b.name)
      : a.type === 'dir' ? -1 : 1);
    
    const menuList = filePath 
      ? [{ 
          name: '上级目录', 
          type: 'back' 
        }, 
        { 
          name: '照片图库', 
          type: 'image' 
        },
        { 
          name: menuOption, 
          type: 'update' 
        }, ].concat(value)
      : value;
    
    const alert = new Alert();
    alert.message = `\n路径 ${repo}/${filePath}   ${items.length}`;
    menuList.forEach(item => {
      alert[item.type === 'update' ? 'addDestructiveAction' : 'addAction' ](item.name);
    });
    alert.addCancelAction('取消');
    const menuId = await alert.presentSheet();
    if (menuId === -1) return;
    
    const selected = menuList[menuId];
    switch (selected.type) {
      case 'back':
        const parentPath = filePath.match(/^.*(?=\/)/)?.[0];
        await loadDirectory(parentPath, data);
        break;
      case 'image':
        await uploadImage(url, filePath);
        break;
      case 'update':
        await updateScript(url, filePath, data);
        break;
      case 'dir':
        await loadDirectory(selected.path, data);
        break;
      case 'file':
        await deleteFile(url, items, selected.name, selected.path);
        break;
    }
  };
  
  const presentMenu = async () => {
    const [{ commit: { author: { date }, message } }] = await httpRequest('GET', 'https://api.github.com/repos/95du/scripts/commits?path', headers);
    const timeago = timeAgo(date);
    const dateStr = new Date(new Date(date).getTime() + 28800000);
    const formattedDate = dateStr.toISOString().replace('T', '  ').replace('.000Z', '');
    
    const alert = new Alert();
    alert.message = `最后更新  ${timeago}\n${message}\n${formattedDate}`;
    const menuList = ['iCloud Files', 'GitHub 仓库', 'Scriptable Files'];
    menuList.forEach(action => {
      alert.addAction(action)
    });
    alert.addCancelAction('取消');
    const response = await alert.presentSheet();
    if (response === -1) return;
    
    let path = '';
    const file = response === 0 ? await getIcloudFile() : response === 2 ? await getScript() : null;
    if (file !== null) file && await loadDirectory(path, file);
    else await loadDirectory(path);
  };
  await presentMenu();
})().catch((e) => {
  console.log(e.message);
});