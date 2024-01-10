/**
 * @param {*} type 
 * @param {*} search 
 * @param {*} replace 
 * @param {*} warn 
 */
function replaceType(type, search, replace, warn) {
  if (type.type === 'object') {
    const {properties} = type;
    for (const prop in properties) {
      const val = properties[prop];
      if (val === search) {
        console.log("replaceType", {prop, properties, search, replace});
        properties[prop] = replace;
      }
    }
  }
  warn('replaceType: unhandled', {type, search, replace});
}
export {replaceType};
