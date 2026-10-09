// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: rss;
/**
 * 组件作者: 95du茅台
 * 组件名称: 实时雨雪雷达
 * 组件版本: Version 1.0.0
 * 发布时间: 2026-10-09
 */

const scriptName = '95du_radar';
const filename = config.runsInApp ? 'main/web_main_radar.js' : 'api/web_radar.js';
const scriptUrl = `https://raw.githubusercontent.com/95du/scripts/master/${filename}`;

const fm = FileManager.local();
const runPath = fm.joinPath(fm.documentsDirectory(), scriptName);
const pathName = config.runsInApp ? 'Running' : 'cache_string';
const moduleDir = fm.joinPath(runPath, pathName);

if (!fm.fileExists(runPath)) fm.createDirectory(runPath);
if (!fm.fileExists(moduleDir)) fm.createDirectory(moduleDir);

const dateName = () => {
  const date = new Date();
  const df = new DateFormatter();
  df.dateFormat = 'yyyyMMddHH';
  const filename = df.string(date).toString() + '.js';
  return filename;
};

const downloadModule = async () => {
  const scrName = scriptUrl.split('/').pop();
  const moduleFilename = !config.runsInApp ? scrName : dateName();
  const modulePath = fm.joinPath(moduleDir, moduleFilename);
  if (fm.fileExists(modulePath)) {
    return modulePath;
  }
  const [moduleFiles, moduleLatestFile] = getModuleVersions();

  try {
    const moduleJs = await new Request(scriptUrl).load();
    if (moduleJs) {
      fm.write(modulePath, moduleJs);
      if (moduleFiles) {
        moduleFiles.forEach(file => fm.remove(fm.joinPath(moduleDir, file)))
      }
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

await (async () => {
  const modulePath = await downloadModule();
  if (modulePath) {
    const importedModule = await importModule(modulePath);
    const family = config.widgetFamily;
    await importedModule.main(family);
  }
})().catch((e) => {
  console.log(e);
  fm.remove(moduleDir);
});