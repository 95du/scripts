// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: bolt;
/**
 * 组件名称: 南网在线
 * 组件作者：95度茅台
 * 组件版本: Version 1.1.1
 * 更新日期: 2024-11-19
 * Telegram 交流群 https://t.me/+CpAbO_q_SGo2ZWE1
 * 
 * Quantumult X 自动获取 token 重写: https://raw.githubusercontent.com/95du/scripts/master/rewrite/get_95598_token.sgmodule

根据中国南方电网的居民阶梯电价标准，第三档的起始用电量（即第二档的上限）在夏季和非夏季有所不同：

夏季（4月至10月）：

	•	第一档：0 - 220度。
	•	第二档：221 - 400度。
	•	第三档：超过400度。

非夏季（11月至次年3月）：

	•	第一档：0 - 170度。
	•	第二档：171 - 280度。
	•	第三档：超过280度。

电价梯度

	1.	第一档：基准电价（最低）。
	2.	第二档：比第一档略高。
	3.	第三档：最高价格。

具体电价标准可能因地区不同有所差异，但全国范围内的总体规则大致相同。如果需要精确值，建议查询您所在地区的电力部门公告。
*/

const scriptName = '95du_powerGrid';
const scriptUrl = 'https://raw.githubusercontent.com/95du/scripts/master/main/web_main_powerGrid.js';

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

await (async () => {
  const modulePath = await downloadModule();
  if (modulePath) {
    const importedModule = await importModule(modulePath);
    await importedModule.main();
  }
})().catch((e) => {
  console.log(e);
  fm.remove(moduleDir);
});