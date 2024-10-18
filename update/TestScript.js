

const uploadImage = async (filePath, url) => {
  const img = await Photos.fromLibrary();
  if (!img) return;

  const alert = new Alert();
  alert.title = '路径/名称/扩展名';
  alert.addTextField('img.png');
  alert.addAction('确定');
  alert.addCancelAction('取消');

  const output = await alert.presentAlert();
  if (output === -1) return;

  const name = alert.textFieldValue(0);
  const api = `${url}/${encodeURIComponent(name)}`;
  const content = Data.fromPNG(img).toBase64String();

  const headers = { 'Content-Type': 'application/json' }; // 确保设置适当的请求头
  const data = {
    message: `Upload ${name}`,
    content
  };

  await httpRequest('PUT', api, headers, data);
  await loadDirectory(filePath);
};

await uploadImage()

用这个方法来尝试
const n = Object.assign(new Alert(), { title, message, addTextField });
