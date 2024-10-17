const cleanedText = text
  .replace(/\/\/.*\n\/\/.*\n\/\/.*\n/, '')
  .replace(/await main\([^\)]*\);?/, '');

console.log(cleanedText.trim());