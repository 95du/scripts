// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: kaaba;
const moduleFilename = [
  'web_main_china_telecom_3',
  'web_main_china_telecom'
];
const random = moduleFilename[Math.floor(Math.random() * moduleFilename.length)];

const { main } = await importModule(random);
await main(config.widgetFamily);