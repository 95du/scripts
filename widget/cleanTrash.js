// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: recycle;
// 一键清空 Scriptable 回收站(非组件)
const F_MGR = FileManager.iCloud();
const recycleBin = F_MGR.joinPath(F_MGR.documentsDirectory(), '/.Trash');

const Run = async () => {
  if (F_MGR.fileExists(recycleBin)) {
    const contents = F_MGR.listContents(recycleBin);
    const alert = new Alert();
    alert.title = '♻ 是否清空回收站 ？'
    alert.message = JSON.stringify(contents, null, 2);
    alert.addDestructiveAction('删除');
    alert.addCancelAction('取消');
    const output = await alert.presentAlert();
    if (output === 0) {
      F_MGR.remove(recycleBin)
    }
  }
}
await Run();