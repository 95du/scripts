// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: cannabis;
const original = Pasteboard.paste();

function processString(input) {
  return /[^\x00-\xff]/.test(input)
    ? encodeURIComponent(input)
    : decodeURIComponent(input);
};

if (original.includes('apple')) {
  const match = /\/app\/([^\/]+)\//.exec(original);
  result = match
    ? original.replace(match[1], processString(match[1]))
    : decodeURIComponent(original);
} else {
  result = processString(original);
}

QuickLook.present(result);
Pasteboard.copy(result);