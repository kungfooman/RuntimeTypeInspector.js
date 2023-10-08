/**
 * @param {string} line 
 * @returns {{content: string, nextIndex: number}}
 */
function extractCurlyContent(line) {
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
  const content = line.substring(firstCurly + 1, k);
  return {content, nextIndex: k + 1};
}
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
  let lastTypedef = undefined;
  for (let line of lines) {
    line = line.trim();
    if (line[0] === '*') {
      line = line.slice(1).trim();
    }
    if (line.startsWith('@typedef')) {
      const {content: def, nextIndex} = extractCurlyContent(line);
      let name = line.substring(nextIndex).trim();
      // Drop description
      name = name.split(' ')[0];
      lastTypedef = expandTypeDepFree(def);
      typedefs[name] = lastTypedef;
    } else if (line.startsWith('@property')) {
      const {content, nextIndex} = extractCurlyContent(line);
      const rest = line.substring(nextIndex);
      const propType = expandType(content);
      if (lastTypedef?.type === 'object') {
        lastTypedef.properties["todoName"] = propType;
      } else {
        warn("not an extensible type", lastTypedef);
      }
    }
  }    
  return {};
}
export {extractCurlyContent, parseJSDocTypedef};
