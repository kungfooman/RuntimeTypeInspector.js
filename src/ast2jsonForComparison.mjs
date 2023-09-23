const drop = [
  'loc',
  'start',
  'end',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'innerComments',
  'comments',
];
/**
 * @example
 * setRight(ast2jsonForComparison(parseSync("/** *"))); // Close comment with / after last *
 * @param {object} ast - The Babel AST.
 * @returns {string} String representation in JSON format for debugging/inspecting the AST.
 */
function ast2jsonForComparison(ast) {
  return JSON.stringify(ast, function(name, val) {
    if (name === 'trailingComma') {
      return 'offset removed for better comparison';
    }
    if (drop.includes(name)) {
      return undefined; // remove
    }
    return val; // keep
  }, 2);
}
export {ast2jsonForComparison};
