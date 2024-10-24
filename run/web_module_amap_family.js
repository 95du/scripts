// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: heart;
/**
 * 脚本名称: 高德家人地图
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.0
 * 更新日期: 2024-10-25
 *
 * 开启指定成员的位置共享方法: 
 * 1，首先在App中登录指定成员的高德地图。
 * 2，关闭 Quantumult X，把成员的状态设置为不共享，然后再打开圈X，最后点击打开成员的位置共享。这样就获取到开启的请求‼️
 * 3，如果操作失误，在 Boxjs 里清除 amap_family_update开头的，重复上一条。
 * 4，当成员位置共享状态关闭时，在组件里把成员的位置共享打开。
 * 
 * 腾讯地图 KEY (2个)
CUNBZ-N7MR2-6EJUP-CAHQA-CGFLH-UWBE6
6GZBZ-OF43F-4DOJQ-JI5C6-UCBYH-VYFDE
 *
 * 注：点击组件右侧跳转到家人地图页面。
 */

// 随时守护彼此位置安全
const scriptName = '95du_amap_family'
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_amap_family.js';

const fm = FileManager.local();
const runPath = fm.joinPath(fm.documentsDirectory(), scriptName);
const moduleDir = fm.joinPath(runPath, 'Running');

if (!fm.fileExists(runPath)) fm.createDirectory(runPath);
if (!fm.fileExists(moduleDir)) fm.createDirectory(moduleDir);

const downloadModule = async () => {
  const date = new Date();
  const df = new DateFormatter();
  df.dateFormat = 'yyyyMMddHH';
  
  const moduleFilename = df.string(date).toString() + '.js';
  const modulePath = fm.joinPath(moduleDir, moduleFilename);

  if (fm.fileExists(modulePath)) return modulePath;

  const [moduleFiles, moduleLatestFile] = getModuleVersions();

  try {
    const moduleJs = await new Request(scriptUrl).load();
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      if (moduleFiles) moduleFiles.forEach(file => fm.remove(fm.joinPath(moduleDir, file)));
      return modulePath;
    } else {
      return moduleLatestFile ? fm.joinPath(moduleDir, moduleLatestFile) : null;
    }
  } catch (e) {
    return moduleLatestFile ? fm.joinPath(moduleDir, moduleLatestFile) : null;
  }
};

const getModuleVersions = () => {
  const dirContents = fm.listContents(moduleDir);
  if (dirContents.length > 0) {
    const versions = dirContents.map(x => parseInt(x.replace('.js', '')));
    versions.sort((a, b) => b - a);

    if (versions.length > 0) {
      const moduleFiles = versions.map(x => `${x}.js`);
      const moduleLatestFile = `${versions[0]}.js`;
      return [moduleFiles, moduleLatestFile];
    }
  }
  return [null, null];
};

const modulePath = await downloadModule();
if (modulePath) {
  const importedModule = await importModule(modulePath);
  await importedModule.main();
};