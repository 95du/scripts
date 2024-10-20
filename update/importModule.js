const moduleFilename = [
  'web_china_telecom_3',
  'web_china_telecom'
];
const random = moduleFilename[Math.floor(Math.random() * moduleFilename.length)];
const { main } = await importModule(random);
测试
