const text = `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;


`;

const cleanedText = text
  .replace(/\/\/.*\n\/\/.*\n\/\/.*\n/, '')
  .replace(/await main\([^\)]*\);?/, '');

console.log(cleanedText.trim());  // 打印替换后的结果