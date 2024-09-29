// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-blue; icon-glyph: magic;
/**
 * 脚本名称: 高德会员等级
 * 组件作者：95度茅台
 * 组件版本: Version 1.0.0
 * 更新日期: 2024-03-27
 *
============ 附加别人的 ===========
高德地图打车签到 (作者不详)
Quantumult X 重写: https://raw.githubusercontent.com/wf021325/qx/master/task/ampDache.js

=================================
[rewrite_local]
^https:\/\/(m5(|-zb)|dache)\.amap\.com\/(ws\/yuece\/(act|openapi\/activity\/current)\/query|common\/(alipaymini|wxmini)\?_ENCRYPT=) url script-response-body https://raw.githubusercontent.com/wf021325/qx/master/task/ampDache.js

[task_local]
1 0 * * * https://raw.githubusercontent.com/wf021325/qx/master/task/ampDache.js, tag=高德地图打车签到, enabled=true

[mitm]
hostname = *.amap.com
=================================
 */

// 随时守护彼此位置安全
const scriptName = '95du_amap_vip';
const scriptUrl = atob('YUhSMGNITTZMeTluYVhSamIyUmxMbTVsZEM4MGNXbGhieTltY21GdFpYZHZjbXN2Y21GM0wyMWhjM1JsY2k5aGNHa3ZkMlZpWDIxaGFXNWZZVzFoY0Y5MmFYQXVhbk09');

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
    const moduleJs = await new Request(atob(scriptUrl)).load();
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