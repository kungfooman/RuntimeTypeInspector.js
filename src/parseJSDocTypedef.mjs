/**
 * @param {Record<string, object>} typedefs 
 * @param {Console["warn"]} warn 
 * @param {import("@babel/types").CommentBlock | import("@babel/types").CommentLine} comment - From import("@babel/types").File["comments"]
 * @param {Function} expandType
 * @returns 
 */
function parseJSDocTypedef(typedefs, warn, comment, expandType) {
  const {type, value} = comment;
  if (type !== 'CommentBlock') {
    return;
  }
  const lines = value.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line[0] === '*') {
      line = line.slice(1).trim();
    }
    if (line.startsWith('@typedef')) {
      const firstCurly = line.indexOf('{');
      let k = firstCurly + 1;
      let count = 0;
      for (; k<line.length; k++) {
        const c = line[k];
        if (c === '{') {
          count++;
        } else if (c === '}') {
          count--;
        }
        if (count === -1) {
          break;
        }
      }
      const def = line.substring(firstCurly + 1, k);
      let i = k;
      while (i < line.length) {
        const c = line[i];
        if (c === ' ') {
          i++;
          continue;
        }
        break;
      }
      if (line[i] !== '}') {
        warn("expected }");
        break;
      }
      i++;
      let name = line.substring(i).trim();
      // Drop description
      name = name.split(' ')[0];
      typedefs[name] = expandType(def);
    }
  }    
  return {};
}
export {parseJSDocTypedef};
