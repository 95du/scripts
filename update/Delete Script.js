const fm = FileManager.iCloud();
const filePath = fm.documentsDirectory();

const removeScript = async () => {
  const contents = fm.listContents(filePath);
  let fileCreTimes = contents.map(file => ({
    name: file,
    creationTime: fm.creationDate(fm.joinPath(filePath, file))
  }));

  fileCreTimes.sort((a, b) => b.creationTime - a.creationTime);

  while (fileCreTimes.length) {
    const alert = new Alert();
    alert.message = `\n♻ 删除脚本❓（ 总共 ${fileCreTimes.length} 个 ）`
    fileCreTimes.forEach(item => {
      alert.addAction(item.name);
    });
    alert.addCancelAction('取消');
    const menuId = await alert.presentSheet();
    if (menuId === -1) break;
      
    const selectedScript = fileCreTimes[menuId].name;
    const del = new Alert();
    del.title = `♻ 是否删除❓\n${selectedScript}`;
    del.addDestructiveAction('删除');
    del.addCancelAction('取消');
    const output = await del.presentAlert();
    if (output === 0 && selectedScript !== `${Script.name()}.js`) {
      fm.remove(fm.joinPath(filePath, selectedScript));
      fileCreTimes = fileCreTimes.filter(file => file.name !== selectedScript);
    }
  }
};

await removeScript();