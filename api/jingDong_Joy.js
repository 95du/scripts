// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: tree;
/**
 * 小组件作者：95度茅台
 * UITable 版本: Version 1.0.0
 * 2023-03-23 11:30
 */

async function main() {
  const F_MGR = FileManager.local();
  const folder = F_MGR.joinPath(F_MGR.documentsDirectory(), "95duJingDong_Joy");
  const bgPath = F_MGR.joinPath(F_MGR.documentsDirectory(), '95duBackground');
  
  // file_Path
  function getPath(pathName, fileName) {
    return F_MGR.joinPath(pathName, fileName);
  }
  const bgImage = getPath(bgPath, Script.name() + '.jpg');
  const cacheFile = getPath(folder, 'setting.json');
  
  // Get Settings { json }
  const getSettings = (file) => {
    if ( F_MGR.fileExists(file) ) {
      const data = F_MGR.readString(file);
      return JSON.parse(data);
    }
    return null;
  }
  const setting = getSettings(cacheFile);
  
  //=========> START <=========//
  
  async function createWidget() {
    const widget = new ListWidget();
    widget.setPadding(15, 15, 15, 15);
    if (F_MGR.fileExists(bgImage)) {
      widget.backgroundImage = await shadowImage(F_MGR.readImage(bgImage))
    } else if (setting.gradient.length !== 0) {
      const gradient = new LinearGradient();
      color = setting.gradient
      const items = color[Math.floor(Math.random() * color.length)];
      gradient.locations = [0, 1]
      gradient.colors = [
        new Color(items, Number(setting.transparency)),
        new Color('#00000000')
      ]
      widget.backgroundGradient = gradient
    } else {
      widget.backgroundColor = Color.dynamic(new Color(setting.light), new Color(setting.dark));
    }
    
    function selectFrom( a, b ) {
      const choices = b - a + 1;
      return Math.floor(Math.random() * choices + a);
    }
    const num = selectFrom( 1, 30 );
    const image = await getImage(`https://storage.360buyimg.com/swm-stable/joypark-static1/unlock_joy_level${num}.png`);
    const widgetImage = widget.addImage(image);
    widgetImage.centerAlignImage();
    if (!config.runsInWidget) {
      await widget.presentSmall();
    } else {
      Script.setWidget(widget);  
      Script.complete();
    }
  }
  
  async function getImage(url) {
    const r = await new Request(url);
    return await r.loadImage();
  }
  
  async function shadowImage(img) {
    let ctx = new DrawContext()
    ctx.size = img.size
    ctx.drawImageInRect(img, new Rect(0, 0, img.size['width'], img.size['height']))
    ctx.setFillColor(new Color("#000000", Number(setting.masking)));
    ctx.fillRect(new Rect(0, 0, img.size['width'], img.size['height']))
    return await ctx.getImage();
  }
  await createWidget();
}
module.exports = { main }